const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Objeto para almacenar las órdenes temporalmente
let pendingOrders = {};

// 1. Configurar y arrancar WhatsApp Web =======================
const client = new Client({
    authStrategy: new LocalAuth(),
    authTimeoutMs: 0, // Desactiva el timeout de 45seg, crucial para servidores gratuitos lentos
    puppeteer: { 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions',
            '--disable-default-apps',
            '--disable-background-networking',
            '--mute-audio'
        ],
        headless: true
    }
});

client.on('qr', (qr) => {
    console.log('🤖 ESCANEA ESTE CÓDIGO QR CON EL WHATSAPP DEL BOT (DoraYaa)');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ ¡Bot de WhatsApp listo y conectado!');
});

// Evento: Cuando llega o enviamos un mensaje a WhatsApp
client.on('message_create', async (message) => {
    console.log(`[DEBUG] Mensaje detectado desde ${message.from}: "${message.body}" (fromMe: ${message.fromMe})`);

    // Si el mensaje es automatizado del propio bot hacia un restaurante o cliente (Evitar bucles de ecos)
    if (message.fromMe && message.body.includes('🛎️ ¡Nueva orden') || message.body.includes('✔️ Listo.')) return;

    // Buscar si el número que envía el mensaje coincide con algún restaurante que tenga una orden pendiente
    let pendingOrderId = null;
    let orderData = null;

    // Obtener el contacto real del mensaje para descubrir el número oculto detrás de los IDs engañosos (@lid)
    const contact = await message.getContact();
    const realSenderNumber = contact.number || message.from.split('@')[0];

    for (const [id, order] of Object.entries(pendingOrders)) {
        const baseNumber = order.restauranteNumero.split('@')[0]; // Ej: "573222737975"
        
        // Comparamos el número real extraído vs el número configurado
        if (realSenderNumber === baseNumber || message.from.includes(baseNumber)) {
            pendingOrderId = id;
            orderData = order;
            break;
        }
    }

    // Si NO encontramos ninguna orden pendiente para este número, ignoramos el mensaje
    if (!orderData) return;

    const textMsg = message.body.trim().toUpperCase();

    // Soportar "SI" y "SÍ" con tilde
    if (textMsg === 'SI' || textMsg === 'SÍ') {
        console.log(`✅ Restaurante aceptó orden #${pendingOrderId}`);
        const totalTexto = orderData.totalPedido || 'el valor de tu pedido';
        const msgConfirm = `¡Hola! Tu pedido ha sido confirmado.\nRealiza el pago de ${totalTexto} a la cuenta de Nequi XXXXXXXXX, y empezaremos a preparar lo que tanto deseas.`;
        
        await client.sendMessage(orderData.clienteNumero, msgConfirm);

        // Si el QR que nos enviaron parece un enlace válido (https), lo enviamos como IMAGEN
        if (orderData.qrUrl && orderData.qrUrl.startsWith('http')) {
            try {
                const media = await MessageMedia.fromUrl(orderData.qrUrl);
                await client.sendMessage(orderData.clienteNumero, media);
            } catch (errorImage) {
                console.error('Error enviando la imagen del QR, enviando enlace en texto en su lugar:', errorImage);
                await client.sendMessage(orderData.clienteNumero, `Enlace del QR: ${orderData.qrUrl}`);
            }
        } else {
            // Si el restaurante configuró texto de fallback en lugar de QR
            await client.sendMessage(orderData.clienteNumero, orderData.qrUrl);
        }

        await client.sendMessage(orderData.restauranteNumero, `✔️ Listo. Le confirmé el pedido al cliente.`);
        delete pendingOrders[pendingOrderId];

    } else if (textMsg === 'NO') {
        console.log(`❌ Restaurante rechazó orden #${pendingOrderId}`);
        const msgReject = `¡Hola! Tu pedido no se ha podido procesar, debido a la alta demanda.`;
        await client.sendMessage(orderData.clienteNumero, msgReject);

        await client.sendMessage(orderData.restauranteNumero, `✔️ Listo. Le avisé al cliente que no se pudo en esta ocasión.`);
        delete pendingOrders[pendingOrderId];

    } else {
        // Verificamos que no hayamos sido nosotros el que escribió otra palabra antes de lanzar el aviso
        if (!message.fromMe) {
            await client.sendMessage(orderData.restauranteNumero, `Por favor, responde únicamente "SI" o "NO" para la orden pendiente #${pendingOrderId}.`);
        }
    }
});
client.initialize();


// 2. Servidor API para que la Web le envíe los pedidos =======================
app.post('/api/send-order', async (req, res) => {
    try {
        const { clienteNumero, restauranteNumero, detallesPedido, qrUrl, totalPedido } = req.body;

        const formatClientNumber = `${clienteNumero}@c.us`;
        const formatRestNumber = `${restauranteNumero}@c.us`;

        const orderId = Date.now().toString().slice(-5); // ID de orden corto

        // Almacenamos la info con el número dinámico del Restaurante 
        pendingOrders[orderId] = {
            clienteNumero: formatClientNumber,
            restauranteNumero: formatRestNumber,
            detallesPedido: detallesPedido,
            totalPedido: totalPedido,
            qrUrl: qrUrl || 'https://i.imgur.com/TuImagenQR.png', // Fallback si no mandan QR
            status: 'esperando_respuesta_restaurante'
        };

        let msgRestaurante = `🛎️ ¡Nueva orden de DoraYaa (#${orderId})!\n\n`;
        msgRestaurante += `Detalles:\n${detallesPedido}\n\n`;
        msgRestaurante += `¿Puedes preparar esta orden?\nResponde "SI" o "NO".`;

        await client.sendMessage(formatRestNumber, msgRestaurante);

        console.log(`[API] Orden #${orderId} reenviada al Restaurante ${restauranteNumero}.`);
        res.status(200).json({ success: true, message: 'Orden enviada al bot exitosamente.' });
    } catch (error) {
        console.error('Error en /api/send-order:', error);
        res.status(500).json({ success: false, error: 'Ocurrió un error en el bot de WhatsApp' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Servidor Web del Bot corriendo en el puerto ${PORT}`);
});
