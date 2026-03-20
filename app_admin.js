// ─── Supabase Setup (lazy init to avoid SDK timing issues) ───────────────────
const SUPABASE_URL = 'https://djrhmfwsipjzqvfxfoer.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcmhtZndzaXBqenF2Znhmb2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjMwNTgsImV4cCI6MjA4OTUzOTA1OH0.daVZQxMym-9B7n_4b-wXVAGQm8EC41KLR-NMSAvmJAM';
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
    let ordersToday = 0;
    let revenueMonth = 0;
    let ordersMonth = 0;
    let pendingCount = 0;

    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    orders.forEach(o => {
        const orderDate = new Date(o.created_at);

        if (orderDate.toDateString() === todayStr) {
            revenueToday += Number(o.total);
            ordersToday++;
        }

        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            revenueMonth += Number(o.total);
            ordersMonth++;
        }

        if (o.status === 'pending') pendingCount++;
    });

    document.getElementById('stat-orders-today').innerText = ordersToday;
    document.getElementById('stat-revenue-today').innerText = formatPrice(revenueToday);
    document.getElementById('stat-orders-month').innerText = ordersMonth;
    document.getElementById('stat-revenue-month').innerText = formatPrice(revenueMonth);
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

function renderOrdersTable() {
    const tbody = document.getElementById('orders-body');
    const noOrders = document.getElementById('no-orders');

    if (orders.length === 0) {
        tbody.innerHTML = '';
        noOrders.style.display = 'flex';
        return;
    }

    noOrders.style.display = 'none';

    tbody.innerHTML = orders.map(order => {
        const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const items = order.items || [];
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
                <td>${customerInfo}</td>
                <td>
                    <div style="margin-bottom: 4px;">${itemsStr}</div>
                    ${notesHtml}
                </td>
                <td><strong style="color: var(--text-main);">${formatPrice(order.total)}</strong></td>
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

async function updateOrderStatus(orderId, newStatus) {
    const { error } = await getSupabaseClient()
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error('Error updating status:', error);
        alert('Error al actualizar el estado. Intenta de nuevo.');
    }
    // Realtime will automatically update the UI
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadOrders();
    subscribeToOrders();
});
