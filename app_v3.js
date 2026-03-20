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
console.log('DoraYaa! app_v3.js v1.1 - Supabase ready');

const translations = {
    es: {
        greetMorning: "¡Buenos días!",
        greetAfternoon: "¡Buenas tardes!",
        greetEvening: "¡Buenas noches!",
        subgreet: "Pidamos algo de comida y tengamos un día delicioso",
        searchPlaceholder: "Buscar...",
        bannerTag: "#OfertaDeSábado",
        bannerTitle: "Pide un Filete con Patatas y obtén un 60% de Descuento",
        catTitle: "Categorías",
        prodTitle: "Nuestros Productos",
        viewAll: "Ver todo",
        categories: {
            food: "Comida",
            pharmacy: "Farmacia",
            supermarket: "Supermercado"
        },
        addToCart: "Añadir al Carrito",
        cartTitle: "Tu Pedido",
        subtotal: "Subtotal",
        total: "Total",
        checkout: "Pedir Yaa!",
        emptyCart: "Tu carrito está vacío",
        added: "¡Añadido!",
        nav: {
            home: "Inicio",
            orders: "Pedidos",
            profile: "Perfil",
            settings: "Configuración"
        }
    },
    en: {
        greetMorning: "Good morning!",
        greetAfternoon: "Good afternoon!",
        greetEvening: "Good evening!",
        subgreet: "Let's order some food and have a delicious day",
        searchPlaceholder: "Search...",
        bannerTag: "#SaturdayOffer",
        bannerTitle: "Order a Steak with Potatoes and get 60% Off",
        catTitle: "Categories",
        prodTitle: "Our Products",
        viewAll: "View All",
        categories: {
            food: "Food",
            pharmacy: "Pharmacy",
            supermarket: "Supermarket"
        },
        addToCart: "Add to Cart",
        cartTitle: "Your Order",
        subtotal: "Subtotal",
        total: "Total",
        checkout: "Order Yaa!",
        emptyCart: "Your cart is empty",
        added: "Added!",
        nav: {
            home: "Home",
            orders: "Orders",
            profile: "Profile",
            settings: "Settings"
        }
    }
};

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}

const restaurants = [
    { id: 1, category: 'food', name: "Burger Gourmet", image: "cat_food.png" },
    { id: 2, category: 'pharmacy', name: "Farmacia San José", image: "cat_pharmacy.png" },
    { id: 3, category: 'supermarket', name: "Supermercado Rindemax", image: "rindemax.jpg" },
    { id: 4, category: 'food', name: "Greegory's Coffee", image: "greegorys.jpg" }
];

const products = [
    { id: 1, restaurantId: 1, category: 'food', name: { es: "Hamburguesa Gourmet", en: "Gourmet Burger" }, price: 13000, image: "cat_food.png", popular: true },
    { id: 2, restaurantId: 2, category: 'pharmacy', name: { es: "Kit Primeros Auxilios", en: "First Aid Kit" }, price: 25500, image: "cat_pharmacy.png", popular: false },
    { id: 3, restaurantId: 3, category: 'supermarket', name: { es: "Canasta de Desayuno", en: "Breakfast Basket" }, price: 18000, image: "cat_supermarket.png", popular: true },
    { id: 4, restaurantId: 1, category: 'food', name: { es: "Pizza Artesanal", en: "Artisan Pizza" }, price: 15000, image: "cat_food.png", popular: true },
    { id: 5, restaurantId: 4, category: 'food', name: { es: "Capuchino", en: "Cappuccino" }, description: { es: "Delicioso café expreso con leche espumada.", en: "Delicious espresso with frothy milk." }, price: 12000, image: "capuchino.png", popular: true, options: ["Frío", "Caliente"] },
    { id: 7, restaurantId: 4, category: 'food', name: { es: "Tinto", en: "Black Coffee" }, description: { es: "Café negro tradicional colombiano.", en: "Traditional Colombian black coffee." }, price: 2000, image: "tinto.jpg", popular: false },
    { id: 8, restaurantId: 4, category: 'food', name: { es: "Café Mocca", en: "Mocha Coffee" }, description: { es: "Café con chocolate y leche.", en: "Coffee with chocolate and milk." }, price: 5000, image: "capuchino.png", popular: false },
    { id: 9, restaurantId: 4, category: 'food', name: { es: "Soda Michelada", en: "Michelada Soda" }, description: { es: "Refrescante soda michelada.", en: "Refreshing michelada soda." }, price: 10000, image: "michelada.jpg", popular: false, options: ["Frutos Rojos", "Frutos Amarillos", "Tamarindo"] },
    { id: 12, restaurantId: 4, category: 'food', name: { es: "Sándwich", en: "Sandwich" }, description: { es: "Sándwich clásico para acompañar tu café.", en: "Classic sandwich to go with your coffee." }, price: 16000, image: "sandwich.jpg", popular: false }
];

let currentLang = 'es';
let cart = [];
let currentCategory = 'all';
let currentRestaurantId = null;

// Modal state
let currentOptionsProduct = null;
let selectedOptionsQty = 1;

function toggleLangDropdown() {
    document.getElementById('lang-dropdown').classList.toggle('active');
}

function switchLanguage(lang) {
    currentLang = lang;
    updateUI();
    document.querySelectorAll('.lang-option').forEach(opt => {
        const isMatch = opt.innerText.toLowerCase().includes(lang === 'es' ? 'español' : 'english');
        opt.classList.toggle('active', isMatch);
    });
    document.getElementById('lang-dropdown').classList.remove('active');
}

function updateUI() {
    const t = translations[currentLang];

    // Dynamic greeting based on time of day
    const hour = new Date().getHours();
    let greetKey = 'greetMorning';
    if (hour >= 12 && hour < 18) {
        greetKey = 'greetAfternoon';
    } else if (hour >= 18) {
        greetKey = 'greetEvening';
    }

    document.getElementById('greet-text').innerText = t[greetKey];
    document.getElementById('subgreet-text').innerText = t.subgreet;
    document.getElementById('search-input').placeholder = t.searchPlaceholder;
    if (document.getElementById('banner-tag')) document.getElementById('banner-tag').innerText = t.bannerTag;
    if (document.getElementById('banner-title')) document.getElementById('banner-title').innerText = t.bannerTitle;
    if (document.getElementById('cat-title')) document.getElementById('cat-title').innerText = t.catTitle;
    if (document.getElementById('prod-title') && !currentRestaurantId) document.getElementById('prod-title').innerText = t.prodTitle;
    if (document.getElementById('view-all-cats')) document.getElementById('view-all-cats').innerText = t.viewAll;
    if (document.getElementById('view-all-prods')) document.getElementById('view-all-prods').innerText = t.viewAll;

    // Update Sidebar Navigation
    const navHome = document.getElementById('nav-home');
    if (navHome) {
        navHome.innerText = t.nav.home;
        document.getElementById('nav-orders').innerText = t.nav.orders;
        document.getElementById('nav-profile').innerText = t.nav.profile;
        document.getElementById('nav-settings').innerText = t.nav.settings;
    }

    // Update Cart Modal Static Text
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.querySelector('.modal-header h2').innerText = t.cartTitle;
        modal.querySelectorAll('.summary-row span:first-child')[0].innerText = t.subtotal;
        modal.querySelectorAll('.summary-row span:first-child')[1].innerText = t.total;
        modal.querySelector('.checkout-btn').innerText = t.checkout;
    }

    renderCategories();
    renderRestaurants();
    renderPopularProducts();
    if (currentRestaurantId) {
        renderProducts();
    }
    updateCartCount();
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    const cats = [
        { id: 'food', icon: '🍔', name: translations[currentLang].categories.food },
        { id: 'pharmacy', icon: '💊', name: translations[currentLang].categories.pharmacy },
        { id: 'supermarket', icon: '🛒', name: translations[currentLang].categories.supermarket }
    ];
    container.innerHTML = cats.map(cat => `
        <div class="category-card ${currentCategory === cat.id ? 'active' : ''}" onclick="filterCategory('${cat.id}')">
            <div class="category-icon">${cat.icon}</div>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

function filterCategory(catId) {
    currentCategory = currentCategory === catId ? 'all' : catId;
    renderCategories();
    backToRestaurants();
    renderRestaurants();
}

function renderRestaurants() {
    const grid = document.getElementById('restaurant-grid');
    if (!grid) return;
    const filtered = currentCategory === 'all' ? restaurants : restaurants.filter(r => r.category === currentCategory);
    grid.innerHTML = filtered.map(r => `
        <div class="restaurant-card" onclick="showRestaurantProducts(${r.id})">
            <img src="${r.image}" class="restaurant-img" alt="${r.name.replace(/"/g, '&quot;')}">
            <div class="restaurant-info">
                <h3>${r.name}</h3>
                <p>${translations[currentLang].categories[r.category]}</p>
            </div>
        </div>
    `).join('');
}

function showRestaurantProducts(restId) {
    currentRestaurantId = restId;
    const rest = restaurants.find(r => r.id === restId);
    document.getElementById('restaurant-grid').style.display = 'none';
    document.getElementById('rests-header').style.display = 'none';
    document.getElementById('product-grid').style.display = 'grid';
    document.getElementById('restaurant-products-header').style.display = 'flex';
    document.getElementById('prod-title').innerText = rest ? rest.name : '';
    renderProducts();
}

function backToRestaurants(e) {
    if (e) e.preventDefault();
    currentRestaurantId = null;
    document.getElementById('restaurant-grid').style.display = 'grid';
    document.getElementById('rests-header').style.display = 'flex';
    document.getElementById('product-grid').style.display = 'none';
    document.getElementById('restaurant-products-header').style.display = 'none';
    if (document.getElementById('prod-title')) document.getElementById('prod-title').innerText = translations[currentLang].prodTitle;
}

let currentSlide = 0;
let carouselInterval;

function renderPopularProducts() {
    const container = document.getElementById('popular-carousel');
    const dotsContainer = document.getElementById('carousel-dots');
    if (!container || !dotsContainer) return;

    const populars = products.filter(p => p.popular);
    if (populars.length === 0) return;

    let trackHtml = `<div class="carousel-track" id="carousel-track">`;
    populars.forEach((p, index) => {
        trackHtml += `
        <div class="carousel-slide">
            <div class="popular-card" onclick="addToCartPopular(${p.id})">
                <div class="popular-card-info">
                    <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 8px;">#Destacado</span>
                    <h3>${p.name[currentLang]}</h3>
                    <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                        <span style="font-weight: 800; font-size: 18px;">${formatPrice(p.price)}</span>
                        <div style="font-size: 12px; font-weight: 600; background: white; color: var(--primary); padding: 6px 12px; border-radius: 12px;">Pedir</div>
                    </div>
                </div>
                <img src="${p.image}" alt="${p.name[currentLang]}">
            </div>
        </div>`;
    });
    trackHtml += `</div>`;
    container.innerHTML = trackHtml;

    // Render dots
    dotsContainer.innerHTML = populars.map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('');

    startCarousel(populars.length);
}

function openProductDetails(productId, qty) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // If it has options or description, show modal
    if (product.options || product.description) {
        openOptionsModal(productId, qty);
    }
}

function openOptionsModal(productId, qty) {
    const product = products.find(p => p.id === productId);
    currentOptionsProduct = product;
    selectedOptionsQty = qty || 1;

    document.getElementById('options-modal-title').innerText = product.name[currentLang];

    // reset qty text
    const qtyEl = document.getElementById('options-modal-qty');
    if (qtyEl) qtyEl.innerText = selectedOptionsQty;

    const descEl = document.getElementById('options-modal-desc');
    if (product.description) {
        descEl.innerText = product.description[currentLang];
        descEl.style.display = 'block';
    } else {
        descEl.style.display = 'none';
    }

    const optsContainer = document.getElementById('options-container');
    if (product.options && product.options.length > 0) {
        optsContainer.innerHTML = `<p style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Elige una opción:</p>`;
        optsContainer.innerHTML += product.options.map((opt, i) => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer;">
                <input type="radio" name="product-option" value="${opt}" ${i === 0 ? 'checked' : ''}>
                ${opt}
            </label>
        `).join('');
    } else {
        optsContainer.innerHTML = '';
    }

    document.getElementById('product-options-modal').classList.add('active');
}

function updateModalQty(delta) {
    selectedOptionsQty = Math.max(1, selectedOptionsQty + delta);
    const qtyEl = document.getElementById('options-modal-qty');
    if (qtyEl) qtyEl.innerText = selectedOptionsQty;
}

function closeOptionsModal() {
    document.getElementById('product-options-modal').classList.remove('active');
    currentOptionsProduct = null;
}

function confirmProductOptions() {
    if (!currentOptionsProduct) return;

    let selectedOption = null;
    const radios = document.getElementsByName('product-option');
    for (let r of radios) {
        if (r.checked) {
            selectedOption = r.value;
            break;
        }
    }

    addItemToCart(currentOptionsProduct, selectedOptionsQty, selectedOption);
    closeOptionsModal();
}

function addItemToCart(product, qty, option) {
    const cartId = option ? `${product.id}-${option}` : `${product.id}`;
    const existing = cart.find(item => item.cartId === cartId);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty, option, cartId });
    }

    updateCartCount();
    alert(currentLang === 'es' ? '¡Añadido al carrito!' : 'Added to cart!');
    if (currentRestaurantId) renderProducts();
}

function startCarousel(totalSlides) {
    if (carouselInterval) clearInterval(carouselInterval);
    if (totalSlides <= 1) return;
    carouselInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 4000);
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
    const populars = products.filter(p => p.popular);
    startCarousel(populars.length);
}

function updateCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.querySelectorAll('.dot');
    if (track) {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
    }
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function addToCartPopular(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // If it has options or description, show modal
    if (product.options || product.description) {
        openOptionsModal(productId, 1);
    } else {
        addItemToCart(product, 1, null);
    }
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid || !currentRestaurantId) return;
    const filtered = products.filter(p => p.restaurantId === currentRestaurantId);
    grid.innerHTML = filtered.map(p => {
        const inCart = cart.find(item => item.id === p.id);
        const badgeText = currentLang === 'es' ? 'en carrito' : 'in cart';
        const badgeHtml = inCart ? `<div class="in-cart-badge">${inCart.qty} ${badgeText}</div>` : '';

        return `
        <div class="product-card">
            <div class="product-img-container" onclick="openProductDetails(${p.id}, 1)" style="cursor: pointer;">
                <img src="${p.image}" alt="${p.name[currentLang]}" class="product-img">
                ${badgeHtml}
            </div>
            <div class="product-info" onclick="openProductDetails(${p.id}, 1)" style="cursor: pointer;">
                <h3>${p.name[currentLang]}</h3>
                <p>${formatPrice(p.price)}</p>
            </div>
            <div class="product-controls">
                <button class="control-btn" onclick="updateQty(this, -1)">-</button>
                <span class="qty">1</span>
                <button class="control-btn" onclick="updateQty(this, 1)">+</button>
            </div>
            <button class="add-to-cart" onclick="addToCart(this, ${p.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                ${translations[currentLang].addToCart}
            </button>
        </div>
    `}).join('');
}

function updateQty(btn, delta) {
    const qtySpan = btn.parentElement.querySelector('.qty');
    let currentQty = parseInt(qtySpan.innerText);
    currentQty = Math.max(1, currentQty + delta);
    qtySpan.innerText = currentQty;
}

function addToCart(btn, productId) {
    const card = btn.closest('.product-card');
    const qtySpan = card.querySelector('.qty');
    const qty = qtySpan ? parseInt(qtySpan.innerText) : 1;
    const product = products.find(p => p.id === productId);

    if (product.options || product.description) {
        openOptionsModal(productId, qty);
    } else {
        addItemToCart(product, qty, null);
    }

    if (qtySpan) qtySpan.innerText = '1';

    // Feedback
    const originalText = btn.innerHTML;
    btn.innerText = translations[currentLang].added;
    btn.style.backgroundColor = '#1F3A5F';
    setTimeout(() => { btn.innerHTML = originalText; btn.style.backgroundColor = 'var(--primary)'; }, 800);
}

function updateCartCount() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cart-count').innerText = count;
}

function viewCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.add('active');
    renderCartItems();
}

function closeCart() {
    document.getElementById('cart-modal').classList.remove('active');
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 20px;">${translations[currentLang].emptyCart}</p>`;
        updateTotals();
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" class="cart-item-img">
            <div class="cart-item-info">
                <h4>${item.name[currentLang]} ${item.option ? '<br><span style="font-size:12px;color:var(--text-muted);">(' + item.option + ')</span>' : ''}</h4>
                <p>${item.qty} x ${formatPrice(item.price)}</p>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.cartId}')">&times;</button>
        </div>
    `).join('');
    updateTotals();
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    renderCartItems();
    updateCartCount();
    renderProducts();
}

function updateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    document.getElementById('cart-subtotal').innerText = formatPrice(subtotal);
    document.getElementById('cart-total').innerText = formatPrice(subtotal);
}

function openCheckoutForm() {
    if (cart.length === 0) return;
    document.getElementById('checkout-form-modal').classList.add('active');
}

function closeCheckoutForm() {
    document.getElementById('checkout-form-modal').classList.remove('active');
}

async function submitOrder() {
    if (cart.length === 0) return;

    const nameInput = document.getElementById('customer-name').value.trim();
    const addressInput = document.getElementById('customer-address').value.trim();
    const phoneInput = document.getElementById('customer-phone').value.trim();
    const notesInput = document.getElementById('order-notes').value.trim();

    if (!nameInput || !addressInput || !phoneInput) {
        alert(currentLang === 'es' ? 'Por favor ingrese su nombre, dirección y número de contacto.' : 'Please enter your name, address, and contact number.');
        return;
    }

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const orderId = 'ORD-' + Date.now();

    // Disable button to prevent double submission
    const sendBtn = document.querySelector('#checkout-form-modal .checkout-btn');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.innerText = currentLang === 'es' ? 'Enviando...' : 'Sending...'; }

    // Save to Supabase (cross-device, real-time)
    const { error } = await getSupabaseClient().from('orders').insert([{
        id: orderId,
        customer_name: nameInput,
        customer_address: addressInput,
        customer_phone: phoneInput,
        notes: notesInput || null,
        items: cart.map(item => ({
            id: item.id,
            restaurantId: item.restaurantId,
            name: item.name,
            price: item.price,
            qty: item.qty,
            option: item.option || null,
            image: item.image
        })),
        total: totalAmount,
        status: 'pending'
    }]);

    if (sendBtn) { sendBtn.disabled = false; sendBtn.innerText = currentLang === 'es' ? 'Enviar Pedido' : 'Send Order'; }

    if (error) {
        console.error('Supabase error:', error);
        alert(currentLang === 'es'
            ? '❌ Error al enviar el pedido. Verifica tu conexión e intenta de nuevo.'
            : '❌ Error sending order. Check your connection and try again.');
        return;
    }

    // Feedback & clear
    alert(currentLang === 'es' ? '✅ ¡Pedido enviado con éxito!' : '✅ Order submitted successfully!');

    cart = [];
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('order-notes').value = '';

    renderProducts();
    updateCartCount();
    renderCartItems();
    closeCheckoutForm();
    closeCart();
}

window.toggleLangDropdown = toggleLangDropdown;
window.switchLanguage = switchLanguage;
window.filterCategory = filterCategory;
window.updateQty = updateQty;
window.addToCart = addToCart;
window.viewCart = viewCart;
window.closeCart = closeCart;
window.removeFromCart = removeFromCart;
window.openCheckoutForm = openCheckoutForm;
window.closeCheckoutForm = closeCheckoutForm;
window.submitOrder = submitOrder;
window.showRestaurantProducts = showRestaurantProducts;
window.backToRestaurants = backToRestaurants;
window.addToCartPopular = addToCartPopular;
window.goToSlide = goToSlide;
window.closeOptionsModal = closeOptionsModal;
window.confirmProductOptions = confirmProductOptions;
window.openProductDetails = openProductDetails;
window.updateModalQty = updateModalQty;
window.showAllRestaurants = (e) => { if (e) e.preventDefault(); };
window.toggleMenu = () => document.getElementById('sidebar').classList.toggle('active');

function adminLogin() {
    const user = prompt(currentLang === 'es' ? 'Usuario:' : 'User:');
    if (!user) return;
    const pass = prompt(currentLang === 'es' ? 'Contraseña:' : 'Password:');
    if (!pass) return;

    if (user.trim() === 'gusbe11@hotmail.com' && pass.trim() === '1017256260Holahola') {
        window.location.href = 'admin.html';
    } else {
        alert(currentLang === 'es' ? 'Credenciales incorrectas.' : 'Incorrect credentials.');
    }
}
window.adminLogin = adminLogin;

updateUI();
