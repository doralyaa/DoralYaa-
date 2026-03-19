const translations = {
    es: {
        greet: "¡Hola Amaya!",
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
        checkout: "Pedir por WhatsApp",
        emptyCart: "Tu carrito está vacío",
        added: "¡Añadido!"
    },
    en: {
        greet: "Hey Amaya!",
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
        checkout: "Order via WhatsApp",
        emptyCart: "Your cart is empty",
        added: "Added!"
    }
};

const products = [
    { id: 1, category: 'food', name: { es: "Hamburguesa Gourmet", en: "Gourmet Burger" }, price: 12.99, image: "cat_food.png" },
    { id: 2, category: 'pharmacy', name: { es: "Kit Primeros Auxilios", en: "First Aid Kit" }, price: 25.50, image: "cat_pharmacy.png" },
    { id: 3, category: 'supermarket', name: { es: "Canasta de Desayuno", en: "Breakfast Basket" }, price: 18.00, image: "cat_supermarket.png" },
    { id: 4, category: 'food', name: { es: "Pizza Artesanal", en: "Artisan Pizza" }, price: 15.00, image: "cat_food.png" }
];

let currentLang = 'es';
let cart = [];
let currentCategory = 'all';

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
    document.getElementById('greet-text').innerText = t.greet;
    document.getElementById('subgreet-text').innerText = t.subgreet;
    document.getElementById('search-input').placeholder = t.searchPlaceholder;
    document.getElementById('banner-tag').innerText = t.bannerTag;
    document.getElementById('banner-title').innerText = t.bannerTitle;
    document.getElementById('cat-title').innerText = t.catTitle;
    document.getElementById('prod-title').innerText = t.prodTitle;
    document.getElementById('view-all-cats').innerText = t.viewAll;
    document.getElementById('view-all-prods').innerText = t.viewAll;
    
    // Update Cart Modal Static Text
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.querySelector('.modal-header h2').innerText = t.cartTitle;
        modal.querySelectorAll('.summary-row span:first-child')[0].innerText = t.subtotal;
        modal.querySelectorAll('.summary-row span:first-child')[1].innerText = t.total;
        modal.querySelector('.checkout-btn').innerText = t.checkout;
    }

    renderCategories();
    renderProducts();
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
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const filtered = currentCategory === 'all' ? products : products.filter(p => p.category === currentCategory);
    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name[currentLang]}" class="product-img">
            <div class="product-info">
                <h3>${p.name[currentLang]}</h3>
                <p>$${p.price.toFixed(2)}</p>
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
    `).join('');
}

function updateQty(btn, delta) {
    const qtySpan = btn.parentElement.querySelector('.qty');
    let currentQty = parseInt(qtySpan.innerText);
    currentQty = Math.max(1, currentQty + delta);
    qtySpan.innerText = currentQty;
}

function addToCart(btn, productId) {
    const card = btn.closest('.product-card');
    const qty = parseInt(card.querySelector('.qty').innerText);
    const product = products.find(p => p.id === productId);
    
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }
    
    updateCartCount();
    card.querySelector('.qty').innerText = '1';

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
                <h4>${item.name[currentLang]}</h4>
                <p>${item.qty} x $${item.price.toFixed(2)}</p>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">&times;</button>
        </div>
    `).join('');
    updateTotals();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCartItems();
    updateCartCount();
}

function updateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    document.getElementById('cart-subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').innerText = `$${subtotal.toFixed(2)}`;
}

function checkoutWhatsApp() {
    if (cart.length === 0) return;
    
    let message = `*DoraYaa! - Nuevo Pedido*%0A%0A`;
    cart.forEach(item => {
        message += `- ${item.qty}x ${item.name[currentLang]} ($${(item.qty * item.price).toFixed(2)})%0A`;
    });
    message += `%0A*Total: $${cart.reduce((acc, item) => acc + (item.price * item.qty), 0).toFixed(2)}*`;
    
    window.open(`https://wa.me/573000000000?text=${message}`, '_blank');
}

window.toggleLangDropdown = toggleLangDropdown;
window.switchLanguage = switchLanguage;
window.filterCategory = filterCategory;
window.updateQty = updateQty;
window.addToCart = addToCart;
window.viewCart = viewCart;
window.closeCart = closeCart;
window.removeFromCart = removeFromCart;
window.checkoutWhatsApp = checkoutWhatsApp;
window.toggleMenu = () => document.getElementById('sidebar').classList.toggle('active');

updateUI();
