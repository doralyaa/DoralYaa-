// ─── Supabase Setup ────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://djrhmfwsipjzqvfxfoer.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DWFxv5ZYhZjrtBKc2aGomQ_lor6K66W';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const restaurants = [
    { id: 1, name: "Santa Maria", image: "santamaria.jpg" },
    { id: 2, name: "Farmacia San José", image: "cat_pharmacy.png" },
    { id: 3, name: "Supermercado Rindemax", image: "rindemax.jpg" },
    { id: 4, name: "Greegory's Coffee", image: "greegorys.jpg" },
    { id: 5, name: "Grill Arepas parrilla", image: "grill.jpg" },
    { id: 6, name: "Classic Burger", image: "classic_burger.jpg" }
];

const DELIVERY_CONFIG = {
    fee: 6000,
    driverShare: 0.75
};

let allOrders = [];
let myDriverId = localStorage.getItem('domiciliario_id') || null;
let myDriverName = localStorage.getItem('domiciliario_name') || null;

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}

// ─── Inicialización ────────────────────────────────────────────────────────
async function init() {
    console.log("[INIT] Iniciando aplicación de domiciliarios...");
    
    if (!myDriverId) {
        document.getElementById('login-overlay').style.display = 'flex';
    } else {
        document.getElementById('login-overlay').style.display = 'none';
        updateDriverDisplay();
        await loadAvailableOrders();
        subscribeToChanges();
    }

    if (window.lucide) lucide.createIcons();
}

function updateDriverDisplay() {
    const display = document.getElementById('driver-display');
    const nameSpan = document.getElementById('current-driver-name');
    if (myDriverName) {
        display.style.display = 'flex';
        nameSpan.innerText = myDriverName;
    } else {
        display.style.display = 'none';
    }
}

async function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const idNumber = document.getElementById('login-id').value.trim();

    if (!phone || !idNumber) {
        Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor ingresa tu número y cédula.' });
        return;
    }

    // Loader
    Swal.fire({ title: 'Verificando...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
        const { data, error } = await supabaseClient
            .from('drivers')
            .select('*')
            .eq('phone', phone)
            .eq('id_number', idNumber)
            .single();

        if (error || !data) {
            Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Credenciales incorrectas o no estás registrado.' });
            return;
        }

        // Éxito
        myDriverId = data.id;
        myDriverName = data.name;
        localStorage.setItem('domiciliario_id', data.id);
        localStorage.setItem('domiciliario_name', data.name);

        Swal.fire({ icon: 'success', title: `¡Bienvenido ${data.name}!`, timer: 1500, showConfirmButton: false });
        
        document.getElementById('login-overlay').style.display = 'none';
        updateDriverDisplay();
        await loadAvailableOrders();
        subscribeToChanges();

    } catch (err) {
        console.error("Error en login:", err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Ocurrió un problema al iniciar sesión.' });
    }
}

function logout() {
    localStorage.removeItem('domiciliario_id');
    localStorage.removeItem('domiciliario_name');
    location.reload();
}

// ─── Carga de Datos ────────────────────────────────────────────────────────
async function loadAvailableOrders() {
    console.log("[DEBUG] Cargando pedidos recientes...");
    // Traer los últimos 50 pedidos (aunque no estén pagados aún, para tenerlos en memoria para Realtime)
    const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('[ERROR] al cargar pedidos:', error);
        return;
    }

    allOrders = data || [];
    console.log(`[DEBUG] ${allOrders.length} pedidos cargados en memoria.`);
    renderOrders();
}

function subscribeToChanges() {
    console.log("[DEBUG] Iniciando suscripción Realtime...");
    supabaseClient
        .channel('delivery-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            console.log(`[REALTIME] ${payload.eventType} en orders:`, payload.new);
            
            if (payload.eventType === 'INSERT') {
                allOrders.unshift(payload.new);
            } else if (payload.eventType === 'UPDATE') {
                const idx = allOrders.findIndex(o => o.id === (payload.new?.id || payload.old?.id));
                if (idx > -1) {
                    allOrders[idx] = { ...allOrders[idx], ...payload.new };
                } else {
                    allOrders.unshift(payload.new);
                }
            } else if (payload.eventType === 'DELETE') {
                allOrders = allOrders.filter(o => o.id !== payload.old.id);
            }
            renderOrders();
        })
        .subscribe((status) => {
            console.log("[REALTIME] Estado de suscripción:", status);
        });
}

// ─── Renderizado ──────────────────────────────────────────────────────────
function renderOrders() {
    const list = document.getElementById('orders-list');
    const noOrders = document.getElementById('no-orders');
    const myOrderContainer = document.getElementById('assigned-order-card');

    // Filtrar: Disponibles (Pagadas, sin repartidor)
    const available = allOrders.filter(o => o.is_paid === true && (!o.driver_name || o.driver_name === '') && o.status !== 'delivered');
    
    // Filtrar: Mi entrega actual (Pagada, asignada a mí, no entregada aún)
    const myOrders = allOrders.filter(o => o.driver_name === myDriverName && o.status !== 'delivered' && myDriverName !== null);

    console.log(`[RENDER] Disponibles: ${available.length}, Mis Ordenes: ${myOrders.length}`);

    // Renderizar Disponibles
    if (available.length === 0) {
        console.log("[RENDER] No hay pedidos disponibles para mostrar.");
        if (allOrders.length > 0) {
            console.log("[DEBUG] Datos crudos en memoria (los primeros 3):");
            console.table(allOrders.slice(0, 3).map(o => ({ id: o.id, is_paid: o.is_paid, status: o.status, driver: o.driver_name })));
        }
        list.innerHTML = '';
        noOrders.style.display = 'flex';
    } else {
        noOrders.style.display = 'none';
        list.innerHTML = available.map(o => {
            const items = Array.isArray(o.items) ? o.items : [];
            const restId = items.length > 0 ? items[0].restaurantId : null;
            const rest = restaurants.find(r => r.id === restId) || { name: 'DoralYaa!', image: 'logo.jpg' };
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">#${o.id}</span>
                        <span class="order-price">${formatPrice(DELIVERY_CONFIG.fee * DELIVERY_CONFIG.driverShare)}</span>
                    </div>
                    <div class="order-body">
                        <div class="info-item">
                            <i data-lucide="store"></i>
                            <div>
                                <span class="label">RESTAURANTE</span>
                                <span class="value">${rest.name}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i data-lucide="map-pin"></i>
                            <div>
                                <span class="label">DIRECCIÓN ENTREGA</span>
                                <span class="value">${o.customer_address}</span>
                            </div>
                        </div>
                    </div>
                    <button class="assign-btn" onclick="assignOrder('${o.id}')">
                        <i data-lucide="crosshair"></i> ASIGNAR PEDIDO
                    </button>
                </div>
            `;
        }).join('');
    }

    // Renderizar Mis Pedidos
    if (myOrders.length > 0) {
        myOrderContainer.innerHTML = myOrders.map(myOrder => {
            const items = myOrder.items || [];
            const rest = restaurants.find(r => r.id === items[0]?.restaurantId) || { name: 'DoralYaa!', image: 'logo.jpg' };
            
            return `
                <div class="assigned-card" style="margin-bottom: 16px;">
                    <div class="order-header">
                        <span class="order-id">#${myOrder.id}</span>
                        <span class="order-price" style="background:rgba(255,255,255,0.2); color:white;">Ganancia: ${formatPrice(DELIVERY_CONFIG.fee * DELIVERY_CONFIG.driverShare)}</span>
                    </div>
                    <div class="order-body">
                        <div class="info-item">
                            <i data-lucide="store"></i>
                            <div>
                                <span class="label">RECOGIDA</span>
                                <span class="value">${rest.name}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i data-lucide="user"></i>
                            <div>
                                <span class="label">CLIENTE</span>
                                <span class="value">${myOrder.customer_name}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i data-lucide="map-pin"></i>
                            <div>
                                <span class="label">ENTREGA</span>
                                <span class="value">${myOrder.customer_address}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i data-lucide="phone"></i>
                            <div>
                                <span class="label">TELÉFONO</span>
                                <span class="value">${myOrder.customer_phone}</span>
                            </div>
                        </div>
                    </div>

                    <div class="contact-buttons">
                        <a href="https://wa.me/57${myOrder.customer_phone.replace(/\D/g,'')}" class="contact-btn btn-whatsapp">
                            <i data-lucide="message-circle"></i> WhatsApp
                        </a>
                        <button onclick="markAsDelivered('${myOrder.id}')" class="contact-btn btn-call" style="background:var(--primary); color:white;">
                            <i data-lucide="check-circle"></i> ENTREGADO
                        </button>
                    </div>
                    
                    <div class="unassign-row">
                        <button onclick="unassignOrder('${myOrder.id}')" class="unassign-link">
                            <i data-lucide="rotate-ccw"></i> Desistir del pedido
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        myOrderContainer.innerHTML = `
            <div class="empty-mini">
                <p>No tienes entregas asignadas.</p>
            </div>
        `;
    }

    if (window.lucide) lucide.createIcons();
}

// ─── Acciones ─────────────────────────────────────────────────────────────
async function assignOrder(orderId) {
    // Si no tiene nombre, pedírselo primero
    if (!myDriverName) {
        await changeDriver();
        if (!myDriverName) return;
    }

    const { value: confirmAssignment } = await Swal.fire({
        title: '¿Asignar Pedido?',
        text: `Se te asignará el pedido #${orderId} y ya no estará disponible para otros.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1F3A5F',
        confirmButtonText: 'Sí, tomarlo',
        cancelButtonText: 'Cancelar'
    });

    if (confirmAssignment) {
        // Bloqueo atómico: solo actualizar si driver_name sigue NULL
        const { data, error } = await supabaseClient
            .from('orders')
            .update({ driver_name: myDriverName, status: 'processing' })
            .eq('id', orderId)
            .is('driver_name', null) // CRÍTICO: Bloqueo para evitar doble asignación
            .select();

        if (error || !data || data.length === 0) {
            Swal.fire({
                icon: 'error',
                title: '¡Lo sentimos!',
                text: 'Este pedido ya fue tomado por otro domiciliario.',
                confirmButtonColor: '#1F3A5F'
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: '¡Pedido Asignado!',
                text: 'Ya puedes ver la información del cliente.',
                timer: 2000,
                showConfirmButton: false
            });
        }
    }
}

async function unassignOrder(orderId) {
    const { isConfirmed } = await Swal.fire({
        title: '¿Desistir del pedido?',
        text: 'El pedido volverá a estar disponible para todos los domiciliarios.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, liberar pedido',
        cancelButtonText: 'Cancelar'
    });

    if (isConfirmed) {
        // Mostrar cargando
        Swal.fire({ title: 'Liberando pedido...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

        const { error } = await supabaseClient
            .from('orders')
            .update({ driver_name: null, status: 'pending' })
            .eq('id', orderId);

        if (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo liberar el pedido.' });
        } else {
            Swal.fire({ 
                icon: 'success', 
                title: 'Pedido Liberado', 
                text: 'El pedido ahora está disponible de nuevo.', 
                timer: 2000, 
                showConfirmButton: false 
            });
        }
    }
}

async function markAsDelivered(orderId) {
    const { isConfirmed } = await Swal.fire({
        title: '¿Pedido Entregado?',
        text: 'Confirma que el cliente ya recibió su pedido.',
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        confirmButtonText: 'Sí, entregado',
        cancelButtonText: 'No aún'
    });

    if (isConfirmed) {
        const { error } = await supabaseClient
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', orderId);

        if (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo completar la entrega.' });
        }
    }
}

// Ventana global
window.assignOrder = assignOrder;
window.unassignOrder = unassignOrder;
window.markAsDelivered = markAsDelivered;
window.handleLogin = handleLogin;
window.logout = logout;

// Iniciar
init();
