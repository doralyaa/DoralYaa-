// ─── Supabase Setup (lazy init to avoid SDK timing issues) ───────────────────
const SUPABASE_URL = 'https://djrhmfwsipjzqvfxfoer.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DWFxv5ZYhZjrtBKc2aGomQ_lor6K66W';
let _supabaseClient = null;
function getSupabaseClient() {
    if (!_supabaseClient) {
        _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return _supabaseClient;
}
// ─────────────────────────────────────────────────────────────────────────────
console.log('DoraYaa! app_admin.js v1.1 - Supabase ready');

let orders = [];

// Phone mapping for restaurants
const RESTAURANT_PHONES = {
    1: "573000000000", // Burger Gourmet
    2: "573000000001", // Farmacia
    3: "573000000002", // Supermercado
    4: "573127922967"  // Greegory's Coffee
};

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}

// ─── Load orders from Supabase ────────────────────────────────────────────────
async function loadOrders() {
    const { data, error } = await getSupabaseClient()
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading orders:', error);
        return;
    }

    orders = data || [];
    renderDashboard();
}

// ─── Realtime subscription ────────────────────────────────────────────────────
function subscribeToOrders() {
    getSupabaseClient()
        .channel('orders-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                orders.unshift(payload.new);
                showNewOrderToast(payload.new);
            } else if (payload.eventType === 'UPDATE') {
                const idx = orders.findIndex(o => o.id === payload.new.id);
                if (idx > -1) orders[idx] = payload.new;
            } else if (payload.eventType === 'DELETE') {
                orders = orders.filter(o => o.id !== payload.old.id);
            }
            renderDashboard();
        })
        .subscribe();
}

// ─── Toast notification ───────────────────────────────────────────────────────
function showNewOrderToast(order) {
    // Remove existing toast if any
    const existing = document.getElementById('order-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'order-toast';
    toast.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🔔</span>
            <div>
                <div style="font-weight:700;font-size:14px;">¡Nuevo Pedido!</div>
                <div style="font-size:13px;opacity:0.9;">${order.customer_name} · ${formatPrice(order.total)}</div>
            </div>
        </div>
    `;
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        background: #FF6B00; color: white; padding: 14px 20px;
        border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        font-family: 'Outfit', sans-serif; cursor: pointer;
        animation: slideInToast 0.4s ease;
    `;
    toast.onclick = () => toast.remove();

    // Add animation keyframe
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `@keyframes slideInToast { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 6000);
}

function renderDashboard() {
    updateStats();
    renderOrdersTable();
}

function updateStats() {
    let revenueToday = 0;
    let revenueMerchant = 0;
    let revenueDriver = 0;
    let ordersCount = 0;
    let pendingCount = 0;

    const filterStart = document.getElementById('dash-filter-date-start').value;
    const filterEnd = document.getElementById('dash-filter-date-end').value;
    const filterMerchant = document.getElementById('dash-filter-merchant').value;

    orders.forEach(o => {
        const oDateStr = new Date(o.created_at).toISOString().split('T')[0];

        // 1. Aplicar Filtro de Fecha si existe
        if (filterStart && oDateStr < filterStart) return;
        if (filterEnd && oDateStr > filterEnd) return;

        // 2. Aplicar Filtro de Comercio si existe
        const itemsList = o.items || [];
        const belongsToMerchant = filterMerchant === 'all' || itemsList.some(i => i.restaurantId.toString() === filterMerchant);
        if (!belongsToMerchant) return;

        // --- Calcular Ingresos si pasa los filtros ---
        const itemCost = itemsList.reduce((sum, item) => {
            // Si hay filtro de comercio, solo sumamos lo de ese comercio para Merchant Revenue
            if (filterMerchant !== 'all' && item.restaurantId.toString() !== filterMerchant) return sum;
            return sum + (Number(item.price) * Number(item.qty));
        }, 0);
        
        // El envío se cuenta solo si la orden tiene items del comercio filtrado (o si es 'all')
        let deliveryCost = Number(o.total) - itemsList.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
        if (deliveryCost < 0) deliveryCost = 0;

        // DoraYaa Revenue (Comisión 15% productos + 25% envío)
        revenueToday += (itemCost * 0.15) + (deliveryCost * 0.25);
        
        // Merchant Revenue (85% de sus productos)
        revenueMerchant += (itemCost * 0.85);

        // Driver Revenue (75% del envío)
        // Nota: Solo sumamos envío si estamos en vista 'all' o si el comercio es parte de la orden
        revenueDriver += (deliveryCost * 0.75);

        ordersCount++;
        if (o.status === 'pending') pendingCount++;
    });

    document.getElementById('stat-orders-today').innerText = ordersCount;
    document.getElementById('stat-revenue-today').innerText = formatPrice(revenueToday);
    document.getElementById('stat-revenue-merchant').innerText = formatPrice(revenueMerchant);
    document.getElementById('stat-revenue-driver').innerText = formatPrice(revenueDriver);
    document.getElementById('stat-pending').innerText = pendingCount;
}

function generateWhatsAppLinks(order) {
    const byRest = {};
    const items = order.items || [];
    items.forEach(i => {
        if (!byRest[i.restaurantId]) byRest[i.restaurantId] = [];
        byRest[i.restaurantId].push(i);
    });

    let linksHtml = '';
    for (const restId in byRest) {
        const restItems = byRest[restId];
        const phone = RESTAURANT_PHONES[restId] || "573000000000";
        let msg = `Hola! Nuevo pedido ${order.id}:\n\n`;
        msg += restItems.map(i => {
            const opt = i.option ? ` (${i.option})` : '';
            return `- ${i.qty}x ${i.name?.es || i.name?.en || i.name}${opt}`;
        }).join('\n');
        if (order.customer_name) {
            msg += `\n\nCliente: ${order.customer_name}\nDir: ${order.customer_address}\nTel: ${order.customer_phone}`;
        }
        if (order.notes) msg += `\nNotas: ${order.notes}`;

        const encoded = encodeURIComponent(msg);
        linksHtml += `<a href="https://wa.me/${phone}?text=${encoded}" target="_blank" style="display:inline-flex; align-items:center; gap:4px; padding: 6px 10px; background: #25D366; color: white; border-radius: 6px; text-decoration: none; font-size: 13px; margin-top: 6px; border: none; font-weight: 600;" title="Enviar a Restaurante">
            <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i> WS Local
        </a> `;
    }

    // Add Client WhatsApp Button
    if (order.customer_phone) {
        let cPhone = order.customer_phone.replace(/[\s\+\-]/g, '');
        if (cPhone.length === 10) cPhone = '57' + cPhone;

        const customerMsg = encodeURIComponent(`Hola ${order.customer_name},\n\nSomos de DoraYaa. Tu pedido ${order.id} ha sido registrado. `);
        linksHtml += `<a href="https://wa.me/${cPhone}?text=${customerMsg}" target="_blank" style="display:inline-flex; align-items:center; gap:4px; padding: 6px 10px; background: #E3F2FD; color: #1565C0; border-radius: 6px; text-decoration: none; font-size: 13px; margin-top: 6px; border: none; font-weight: 600;" title="Enviar a Cliente">
            <i data-lucide="user" style="width: 14px; height: 14px;"></i> WS Cliente
        </a> `;
    }

    return `<div style="display: flex; flex-wrap: wrap; gap: 6px;">${linksHtml}</div>`;
}

const restaurants = [
    { id: 1, category: 'food', name: "Burger Gourmet", image: "cat_food.png" },
    { id: 2, category: 'pharmacy', name: "Farmacia San José", image: "cat_pharmacy.png" },
    { id: 3, category: 'supermarket', name: "Supermercado Rindemax", image: "rindemax.jpg" },
    { id: 4, category: 'food', name: "Greegory's Coffee", image: "greegorys.jpg" }
];

function renderOrdersTable() {
    const tbody = document.getElementById('orders-body');
    const noOrders = document.getElementById('no-orders');

    // --- Lógica de Filtros ---
    const filterStart = document.getElementById('filter-date-start').value;
    const filterEnd = document.getElementById('filter-date-end').value;
    const filterMerchant = document.getElementById('filter-merchant').value;

    let filtered = [...orders];

    // 1. Filtro de Fecha (Rango YYYY-MM-DD)
    if (filterStart || filterEnd) {
        filtered = filtered.filter(o => {
            // Extraer solo la parte YYYY-MM-DD de la fecha de creación de Supabase
            const oDateStr = new Date(o.created_at).toISOString().split('T')[0];
            
            if (filterStart && oDateStr < filterStart) return false;
            if (filterEnd && oDateStr > filterEnd) return false;
            return true;
        });
    }

    // 2. Filtro de Comercio
    if (filterMerchant !== 'all') {
        filtered = filtered.filter(o => {
            const items = o.items || [];
            return items.some(i => i.restaurantId.toString() === filterMerchant);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        noOrders.style.display = 'flex';
        return;
    }

    noOrders.style.display = 'none';

    tbody.innerHTML = filtered.map(order => {
        const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const items = order.items || [];
        
        // Merchant(s) lookup
        const orderRestaurants = [];
        items.forEach(item => {
            const rest = restaurants.find(r => r.id === item.restaurantId);
            if (rest && !orderRestaurants.some(r => r.id === rest.id)) {
                orderRestaurants.push(rest);
            }
        });

        const merchantsHtml = orderRestaurants.map(r => `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <img src="${r.image}" alt="${r.name}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                <span style="font-size: 13px; font-weight: 700; color: var(--navy);">${r.name}</span>
            </div>
        `).join('') || '<span style="color: #999; font-size: 12px;">DoraYaa!</span>';

        let itemsStr = items.map(i => {
            const optStr = i.option ? ` <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">(${i.option})</span>` : '';
            const name = i.name?.es || i.name?.en || i.name || 'Producto';
            return `<div style="padding: 2px 0;">${i.qty}x ${name}${optStr}</div>`;
        }).join('');

        let statusClass = '';
        let statusText = '';
        switch (order.status) {
            case 'pending': statusClass = 'status-pending'; statusText = 'Pendiente'; break;
            case 'processing': statusClass = 'status-processing'; statusText = 'En Proceso'; break;
            case 'delivered': statusClass = 'status-delivered'; statusText = 'Entregado'; break;
            default: statusClass = 'status-pending'; statusText = order.status;
        }

        const customerInfo = order.customer_name ? `
            <div style="font-weight: 700; color: var(--navy); margin-bottom: 4px;">${order.customer_name}</div>
            <div style="font-size: 13px; color: var(--text-muted);"><i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: text-bottom;"></i> ${order.customer_address}</div>
        ` : `<span style="color: #999;">Anónimo</span>`;

        const notesHtml = order.notes ? `
            <div style="margin-top: 8px; font-size: 13px; padding: 6px; background: #FFF9E6; border-left: 2px solid #FFC107; border-radius: 4px;">
                <strong>Nota:</strong> ${order.notes}
            </div>
        ` : '';

        return `
            <tr>
                <td style="color: var(--primary); font-weight: 700;">${order.id}</td>
                <td style="color: var(--text-muted);">${time}</td>
                <td>${merchantsHtml}</td>
                <td>${customerInfo}</td>
                <td>
                    <div style="margin-bottom: 4px;">${itemsStr}</div>
                    ${notesHtml}
                </td>
                <td><strong style="color: var(--text-main);">${formatPrice(order.total)}</strong></td>
                <td>
                    <span class="status-badge ${order.is_paid ? 'status-paid' : 'status-unpaid'}" 
                          onclick="togglePaymentStatus('${order.id}', ${order.is_paid})"
                          title="Click para cambiar estado de pago">
                        ${order.is_paid ? 'Pagado' : 'No Pagado'}
                    </span>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <select onchange="updateOrderStatus('${order.id}', this.value)" style="padding: 6px; border-radius: 6px; border: 1px solid var(--border); outline: none;">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>En Proceso</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Entregado</option>
                        </select>
                        ${generateWhatsAppLinks(order)}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// ─── Dashboard Navigation ─────────────────────────────────────────────────────
function showSection(id) {
    const section = document.getElementById(id + '-section');
    if (!section) return;

    // Update sections
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    section.classList.remove('hidden');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeNav = document.getElementById('nav-' + id);
    if (activeNav) activeNav.classList.add('active');

    // Update title
    const titles = {
        'dashboard': 'Panel de Control',
        'orders': 'Gestión de Pedidos'
    };
    const titleEl = document.getElementById('section-title');
    if (titleEl) titleEl.innerText = titles[id] || 'Admin';

    if (window.lucide) lucide.createIcons();
}

function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

async function logout() {
    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        text: "Tendrás que ingresar tus credenciales de nuevo para acceder.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1F3A5F',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        // Cerrar sesión en el servidor
        await getSupabaseClient().auth.signOut();
        window.location.href = 'index.html';
    }
}

function clearFilters() {
    document.getElementById('filter-date-start').value = '';
    document.getElementById('filter-date-end').value = '';
    document.getElementById('filter-merchant').value = 'all';
    renderDashboard();
}

function clearDashFilters() {
    document.getElementById('dash-filter-date-start').value = '';
    document.getElementById('dash-filter-date-end').value = '';
    document.getElementById('dash-filter-merchant').value = 'all';
    renderDashboard();
}

// Global expose
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.loadOrders = loadOrders;
window.clearFilters = clearFilters;
window.clearDashFilters = clearDashFilters;
window.togglePaymentStatus = togglePaymentStatus;

async function updateOrderStatus(orderId, newStatus) {
    // Optimistic update
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
        orders[idx].status = newStatus;
        renderDashboard();
    }

    const { error } = await getSupabaseClient()
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error('Error updating status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar el estado del pedido.',
            confirmButtonColor: '#d33'
        });
        // Revert on error
        await loadOrders();
    } else {
        // Success Toast
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });

        Toast.fire({
            icon: 'success',
            title: 'Estado actualizado',
            background: '#28a745',
            color: '#fff',
            iconColor: '#fff'
        });
    }
}

async function togglePaymentStatus(orderId, currentStatus) {
    const newStatus = !currentStatus;

    // Optimistic update
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
        orders[idx].is_paid = newStatus;
        renderDashboard();
    }

    const { error } = await getSupabaseClient()
        .from('orders')
        .update({ is_paid: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error('Error updating payment status:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el pago.' });
        await loadOrders();
    } else {
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: newStatus ? 'Pedido Marcado como Pagado' : 'Pedido de nuevo Pendiente de Pago',
            background: newStatus ? '#28a745' : '#dc3545',
            color: '#fff'
        });
    }
}

// ─── Authentication Gate ──────────────────────────────────────────────────────
async function checkAdminAuth() {
    // Comprobar si hay una sesión válida en Supabase (seguro e inviolable)
    const { data: { session } } = await getSupabaseClient().auth.getSession();
    
    if (session) {
        // Ya está logueado correctamente
        await loadOrders();
        subscribeToOrders();
        return;
    }

    // No hay sesión, mostrar popup
    const { value: formValues } = await Swal.fire({
        title: 'Acceso Administrativo',
        html:
            '<div style="text-align: left; margin-bottom: 8px;">' +
            '<label style="font-size: 14px; font-weight: 600;">Email</label>' +
            '<input id="swal-user" class="swal2-input" placeholder="email@ext.com" style="margin-top: 4px;">' +
            '</div>' +
            '<div style="text-align: left;">' +
            '<label style="font-size: 14px; font-weight: 600;">Contraseña</label>' +
            '<input id="swal-pass" type="password" class="swal2-input" placeholder="••••••••" style="margin-top: 4px;">' +
            '</div>',
        focusConfirm: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonText: 'Entrar',
        confirmButtonColor: '#1F3A5F',
        showCancelButton: true,
        cancelButtonText: 'Volver al Inicio',
        preConfirm: () => {
            return [
                document.getElementById('swal-user').value,
                document.getElementById('swal-pass').value
            ]
        }
    });

    if (formValues) {
        const [user, pass] = formValues;
        
        Swal.fire({
            title: 'Autenticando...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const { data, error } = await getSupabaseClient().auth.signInWithPassword({
            email: user.trim(),
            password: pass.trim()
        });

        if (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Credenciales incorrectas.',
                confirmButtonColor: '#d33'
            });
            window.location.href = 'index.html';
        } else {
            // Login exitoso, cerrar el Swal de loading y cargar datos
            Swal.close();
            await loadOrders();
            subscribeToOrders();
        }
    } else {
        // User cancelled
        window.location.href = 'index.html';
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    try {
        if (typeof Swal === 'undefined') {
            console.warn('SweetAlert2 not loaded immediately, waiting for it...');
            // Fallback to basic loading if Swal is missing
            await loadOrders();
            subscribeToOrders();
            return;
        }
        await checkAdminAuth();
    } catch (err) {
        console.error('Initialization error:', err);
        // Ensure content is loaded even on error
        await loadOrders().catch(e => console.error(e));
        subscribeToOrders();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
