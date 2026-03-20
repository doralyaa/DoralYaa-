const supabaseUrl = 'https://djrhmfwsipjzqvfxfoer.supabase.co';
const supabaseKey = 'sb_publishable_DWFxv5ZYhZjrtBKc2aGomQ_lor6K66W';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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

async function loadOrders() {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (data) {
            orders = data.map(o => ({
                id: o.id,
                timestamp: o.created_at,
                customerName: o.customer_name,
                customerAddress: o.customer_address,
                customerPhone: o.customer_phone,
                notes: o.notes,
                items: o.items,
                total: o.total,
                status: o.status
            }));
        }
    } catch (err) {
        console.error("Error loading orders:", err);
    }
    renderDashboard();
}

// Enable realtime
supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Cambio detectado en base de datos:', payload);
        loadOrders();
    })
    .subscribe();

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
        const orderDate = new Date(o.timestamp);
        
        if (orderDate.toDateString() === todayStr) {
            revenueToday += o.total;
            ordersToday++;
        }
        
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
            revenueMonth += o.total;
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
    order.items.forEach(i => {
        if (!byRest[i.restaurantId]) byRest[i.restaurantId] = [];
        byRest[i.restaurantId].push(i);
    });
    
    let linksHtml = '';
    for (const restId in byRest) {
        const items = byRest[restId];
        const phone = RESTAURANT_PHONES[restId] || "573000000000";
        let msg = `Hola! Nuevo pedido ${order.id}:\n\n`;
        msg += items.map(i => {
            const opt = i.option ? ` (${i.option})` : '';
            return `- ${i.qty}x ${i.name.es || i.name}${opt}`;
        }).join('\n');
        if (order.customerName) {
            msg += `\n\nCliente: ${order.customerName}\nDir: ${order.customerAddress}\nTel: ${order.customerPhone}`;
        }
        if (order.notes) msg += `\nNotas: ${order.notes}`;
        
        const encoded = encodeURIComponent(msg);
        linksHtml += `<a href="https://wa.me/${phone}?text=${encoded}" target="_blank" style="display:inline-flex; align-items:center; gap:4px; padding: 6px 10px; background: #25D366; color: white; border-radius: 6px; text-decoration: none; font-size: 13px; margin-top: 6px; border: none; font-weight: 600;" title="Enviar a Restaurante">
            <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i> WS Local
        </a> `;
    }
    
    // Add Client WhatsApp Button
    if (order.customerPhone) {
        let cPhone = order.customerPhone.replace(/[\s\+\-]/g, '');
        if (cPhone.length === 10) cPhone = '57' + cPhone; // Assume Colombia
        
        const customerMsg = encodeURIComponent(`Hola ${order.customerName},\n\nSomos de DoraYaa. Tu pedido ${order.id} ha sido registrado. `);
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
        const time = new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let itemsStr = order.items.map(i => {
            const optStr = i.option ? ` <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">(${i.option})</span>` : '';
            return `<div style="padding: 2px 0;">${i.qty}x ${i.name.es || i.name}${optStr}</div>`;
        }).join('');
        
        let statusClass = '';
        let statusText = '';
        switch(order.status) {
            case 'pending': statusClass = 'status-pending'; statusText = 'Pendiente'; break;
            case 'processing': statusClass = 'status-processing'; statusText = 'En Proceso'; break;
            case 'delivered': statusClass = 'status-delivered'; statusText = 'Entregado'; break;
            default: statusClass = 'status-pending'; statusText = order.status;
        }
        
        const customerInfo = order.customerName ? `
            <div style="font-weight: 700; color: var(--navy); margin-bottom: 4px;">${order.customerName}</div>
            <div style="font-size: 13px; color: var(--text-muted);"><i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: text-bottom;"></i> ${order.customerAddress}</div>
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
    
    if(window.lucide) lucide.createIcons();
}

async function updateOrderStatus(orderId, newStatus) {
    // optimistic update
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = newStatus;
        renderDashboard();
    }
    
    // update db
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
            
        if (error) throw error;
    } catch (err) {
        console.error("Error updating order:", err);
        loadOrders();
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', loadOrders);
