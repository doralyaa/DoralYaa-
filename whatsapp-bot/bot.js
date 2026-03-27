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
    console.log('🤖 ESCANEA ESTE CÓDIGO QR CON EL WHATSAPP DEL BOT (DoralYaa)');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ ¡Bot de WhatsApp listo y conectado!');
});

// Evento: Cuando llega o enviamos un mensaje a WhatsApp
client.on('message_create', async (message) => {
    console.log(`[DEBUG] Mensaje detectado desde ${message.from}: "${message.body}" (fromMe: ${message.fromMe})`);

    // [EVITAR BUCLES] Ignorar TODOS los mensajes que el propio BOT envía a menos que sean un "SI" o "NO" manual.
    // Esto previene que el bot responda a sus propias instrucciones ("Por favor, responde...") o a las alertas de orden.
    if (message.fromMe) {
        const isResponse = message.body.trim().toUpperCase() === 'SI' || 
                           message.body.trim().toUpperCase() === 'SÍ' || 
                           message.body.trim().toUpperCase() === 'NO';
        
        // Si es de nosotros pero NO es una de las respuestas clave, lo ignoramos.
        if (!isResponse) return;
    }

    // Buscar todas las órdenes que coincidan con este número de restaurante
    let matchedOrders = [];
    const contact = await message.getContact();
    const realSenderNumber = contact.number || message.from.split('@')[0];

    for (const [id, order] of Object.entries(pendingOrders)) {
        const baseNumber = order.restauranteNumero.split('@')[0];
        if (realSenderNumber === baseNumber || message.from.includes(baseNumber)) {
            matchedOrders.push({ id, ...order });
        }
    }

    if (matchedOrders.length === 0) return;

    const textMsg = message.body.trim().toUpperCase();
    const parts = textMsg.split(/\s+/); // Dividir por espacios
    const command = parts[0]; // SI o NO
    const providedId = parts.length > 1 ? parts[1].replace('#', '') : null;

    let selectedOrder = null;

    // 1. Si el usuario dio un ID (ej: "SI 1234"), buscar esa orden específica
    if (providedId) {
        selectedOrder = matchedOrders.find(o => o.id.includes(providedId) || providedId.includes(o.id));
    } 
    // 2. Si solo hay UNA orden, la seleccionamos automáticamente
    else if (matchedOrders.length === 1) {
        selectedOrder = matchedOrders[0];
    }

    // Si hay varias órdenes y no dio ID, o el ID no coincide, pedir aclaración
    if (!selectedOrder && matchedOrders.length > 1) {
        let msgClarify = `⚠️ Tienes ${matchedOrders.length} órdenes pendientes. Por favor, responde con el ID:\n\n`;
        matchedOrders.forEach(o => {
            msgClarify += `• *#${o.id}*: ${o.totalPedido} (${o.detallesPedido.slice(0, 30)}...)\n`;
        });
        msgClarify += `\nEjemplo: "SI ${matchedOrders[0].id}"`;
        
        if (!message.fromMe) {
            await client.sendMessage(matchedOrders[0].restauranteNumero, msgClarify);
        }
        return;
    }

    // Si aún no hay orden seleccionada (ej. mandó solo "SI" pero no hay órdenes o algo falló)
    if (!selectedOrder) {
        if (!message.fromMe) {
            await client.sendMessage(matchedOrders[0].restauranteNumero, `No encontré ninguna orden con el ID "${providedId || ''}". Revisa el número e intenta de nuevo.`);
        }
        return;
    }

    const pendingOrderId = selectedOrder.id;
    const orderData = selectedOrder;

    // Soportar "SI", "SÍ", y comandos con ID
    if (command === 'SI' || command === 'SÍ') {
        console.log(`✅ Restaurante aceptó orden #${pendingOrderId}`);
        const totalTexto = orderData.totalPedido || 'el valor de tu pedido';
        const msgConfirm = `¡Hola! Tu pedido ha sido confirmado.\nRealiza el pago de ${totalTexto} a la cuenta de Nequi XXXXXXXXX, y empezaremos a preparar lo que tanto deseas.`;

        await client.sendMessage(orderData.clienteNumero, msgConfirm);
        await client.sendMessage(orderData.restauranteNumero, `✔️ Listo. Le confirmé el pedido al cliente.`);
        delete pendingOrders[pendingOrderId];

    } else if (command === 'NO') {
        console.log(`❌ Restaurante rechazó orden #${pendingOrderId}`);
        const msgReject = `¡Hola! Tu pedido no se ha podido procesar, debido a la alta demanda.`;
        await client.sendMessage(orderData.clienteNumero, msgReject);

        await client.sendMessage(orderData.restauranteNumero, `✔️ Listo. Le avisé al cliente que no se pudo en esta ocasión.`);
        delete pendingOrders[pendingOrderId];

    } else {
        // Solo mandamos el recordatorio si el mensaje NO es de "mí mismo"
        if (!message.fromMe) {
            await client.sendMessage(orderData.restauranteNumero, `Por favor, responde únicamente "SI [ID]" o "NO [ID]" para la orden #${pendingOrderId}.`);
        }
    }
});
client.initialize();


// 2. Servidor API para que la Web le envíe los pedidos =======================
app.post('/api/send-order', async (req, res) => {
    try {
        const { orderId, clienteNumero, restauranteNumero, detallesPedido, qrUrl, totalPedido } = req.body;

        const formatClientNumber = `${clienteNumero}@c.us`;
        const formatRestNumber = `${restauranteNumero}@c.us`;

        const finalOrderId = orderId || Date.now().toString().slice(-5); // Usar el ID de Supabase

        // Almacenamos la info con el número dinámico del Restaurante 
        pendingOrders[finalOrderId] = {
            clienteNumero: formatClientNumber,
            restauranteNumero: formatRestNumber,
            detallesPedido: detallesPedido,
            totalPedido: totalPedido,
            qrUrl: qrUrl || 'https://i.imgur.com/TuImagenQR.png', // Fallback si no mandan QR
            status: 'esperando_respuesta_restaurante'
        };

        let msgRestaurante = `🛎️ ¡Nueva orden de DoralYaa (#${finalOrderId})!\n\n`;
        msgRestaurante += `Detalles:\n${detallesPedido}\n\n`;
        msgRestaurante += `¿Puedes preparar esta orden?\nResponde "SI" o "NO".`;

        await client.sendMessage(formatRestNumber, msgRestaurante);

        console.log(`[API] Orden #${finalOrderId} reenviada al Restaurante ${restauranteNumero}.`);
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
