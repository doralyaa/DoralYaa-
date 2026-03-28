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
console.log('DoralYaa! app_v3.js v1.1 - Supabase ready');

const DELIVERY_FEE = 6000;

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
            supermarket: "Supermercado",
            licores: "Licores"
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
        },
        sectionTitles: {
            all: "Comercios",
            food: "Restaurantes",
            pharmacy: "Farmacias",
            supermarket: "Supermercados",
            licores: "Licores"
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
            supermarket: "Supermarket",
            licores: "Liquors"
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
        },
        sectionTitles: {
            all: "Businesses",
            food: "Restaurants",
            pharmacy: "Pharmacies",
            supermarket: "Supermarkets",
            licores: "Liquors"
        }
    }
};

function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}

const restaurants = [
    { id: 1, category: 'food', name: "Burger Gourmet", image: "cat_food.png", whatsapp: "573222737975", qrUrl: "https://i.imgur.com/ejemploQRFood.png" },
    { id: 2, category: 'pharmacy', name: "Farmacia San José", image: "cat_pharmacy.png", whatsapp: "573222737976", qrUrl: "https://i.imgur.com/ejemploQRPharm.png" },
    { id: 3, category: 'supermarket', name: "Supermercado Rindemax", image: "rindemax.jpg", whatsapp: "573222737977", qrUrl: "https://i.imgur.com/ejemploQRMarket.png" },
    { id: 4, category: 'food', name: "Greegory's Coffee", image: "greegorys.jpg", whatsapp: "573222737975", qrUrl: "https://i.imgur.com/ejemploQRCoffee.png" },
    { id: 5, category: 'food', name: "Grill Arepas", image: "grill.jpg", whatsapp: "573222737975", qrUrl: "https://i.imgur.com/ejemploQRCoffee.png" },
    { id: 6, category: 'food', name: "Classic Burger", image: "classic.jpg", whatsapp: "573222737975", qrUrl: "https://i.imgur.com/ejemploQRCoffee.png" }
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
    { id: 12, restaurantId: 4, category: 'food', name: { es: "Sándwich", en: "Sandwich" }, description: { es: "Sándwich clásico para acompañar tu café.", en: "Classic sandwich to go with your coffee." }, price: 16000, image: "sandwich.jpg", popular: false },
    { id: 15, restaurantId: 5, category: 'food', name: { es: "Jamón y Queso", en: "Ham & Cheese" }, price: 9600, image: "cat_food.png", popular: false },
    { id: 16, restaurantId: 5, category: 'food', name: { es: "Con Queso", en: "With Cheese" }, price: 7800, image: "cat_food.png", popular: false },
    { id: 17, restaurantId: 5, category: 'food', name: { es: "Chócolo", en: "Chócolo" }, description: { es: "Jamón y queso tipo mozzarella", en: "Ham and mozzarella cheese" }, price: 13200, image: "cat_food.png", popular: true },
    { id: 18, restaurantId: 5, category: 'food', name: { es: "Arepa del Pueblo", en: "Arepa del Pueblo" }, description: { es: "Pollo, hogao, maicitos, cebolla grillé, maduritos y salsa dulce maíz", en: "Chicken, hogao, sweet corn, grilled onion, sweet plantain and sweet corn sauce" }, price: 15000, image: "cat_food.png", popular: true },
    { id: 19, restaurantId: 5, category: 'food', name: { es: "Paisa", en: "Paisa" }, description: { es: "Frijol refrito, guacamole, chorizo, chicharrón y maicitos", en: "Refried beans, guacamole, chorizo, pork rinds and sweet corn" }, price: 21600, image: "grill_paisa.jpg", popular: true },
    { id: 20, restaurantId: 5, category: 'food', name: { es: "Vegetariana", en: "Vegetarian Arepa" }, description: { es: "Queso tipo mozzarella, guacamole, pimentón, cebolla, maicitos y champiñones", en: "Mozzarella cheese, guacamole, bell pepper, onion, sweet corn and mushrooms" }, price: 17400, image: "cat_food.png", popular: false },
    { id: 21, restaurantId: 5, category: 'food', name: { es: "Arepaburger", en: "Arepaburger" }, description: { es: "Carne de hamburguesa, jamón, tocineta y queso tipo mozzarella", en: "Burger meat, ham, bacon and mozzarella cheese" }, price: 22200, image: "cat_food.png", popular: false },
    { id: 22, restaurantId: 5, category: 'food', name: { es: "Combinada", en: "Combined Arepa" }, description: { es: "Queso tipo mozzarella, carne de res, pollo, hogao", en: "Mozzarella cheese, beef, chicken, hogao" }, price: 22800, image: "cat_food.png", popular: false },
    { id: 23, restaurantId: 5, category: 'food', name: { es: "Pollo y Champiñones", en: "Chicken & Mushrooms" }, description: { es: "Queso tipo mozzarella, pollo, champiñones y tocineta", en: "Mozzarella cheese, chicken, mushrooms and bacon" }, price: 19800, image: "cat_food.png", popular: false },
    { id: 24, restaurantId: 5, category: 'food', name: { es: "Doña Lucía", en: "Doña Lucía" }, description: { es: "Jamón, queso tipo mozzarella, carne de cerdo, cebolla y maicitos", en: "Ham, mozzarella cheese, pork, onion and sweet corn" }, price: 21000, image: "cat_food.png", popular: false },
    { id: 25, restaurantId: 5, category: 'food', name: { es: "Mexicana", en: "Mexican Arepa" }, description: { es: "Frijol refrito, guacamole, carne de res, pico de gallo y picante", en: "Refried beans, guacamole, beef, pico de gallo and spicy sauce" }, price: 26400, image: "cat_food.png", popular: false },
    { id: 26, restaurantId: 5, category: 'food', name: { es: "Antioqueña", en: "Antioqueña" }, description: { es: "Queso tipo mozzarella, frijol refrito, guacamole, carne, hogao, chorizo, maduro y aguacate", en: "Mozzarella cheese, refried beans, guacamole, meat, hogao, chorizo, sweet plantain and avocado" }, price: 28800, image: "cat_food.png", popular: false },
    { id: 27, restaurantId: 5, category: 'food', name: { es: "Super Arepa", en: "Super Arepa" }, description: { es: "Pollo, carne, chicharrón, maicitos, tocineta, hogao, salsa BBQ y queso tipo mozzarella", en: "Chicken, meat, pork rinds, sweet corn, bacon, hogao, BBQ sauce and mozzarella cheese" }, price: 34800, image: "cat_food.png", popular: true },
    { id: 28, restaurantId: 6, category: 'food', name: { es: "Patacón Burger", en: "Patacón Burger" }, description: { es: "2 patacones, carne artesanal, queso mozzarella, tocineta, cebolla caramelizada, lechuga, tomate y salsa de la casa.", en: "2 patacones, artisan meat, mozzarella cheese, bacon, caramelized onion, lettuce, tomato and house sauce." }, price: 31500, image: "classic_pataconb.jpeg", popular: true, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 29, restaurantId: 6, category: 'food', name: { es: "Buenos Aires Burger", en: "Buenos Aires Burger" }, description: { es: "Pan artesanal, carne artesanal, queso gratinado, chorizo argentino asado, chimichurri, lechuga, tomate y salsa de la casa.", en: "Artisan bread, artisan meat, grilled cheese, grilled Argentine chorizo, chimichurri, lettuce, tomato and house sauce." }, price: 39000, image: "classic_classic.jpeg", popular: true, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 30, restaurantId: 6, category: 'food', name: { es: "La Classic", en: "La Classic" }, description: { es: "Pan artesanal, 160 gr de carne artesanal al carbón, queso gratinado, tocineta caramelizada, lechuga, salsa de la casa.", en: "Artisan bread, 160g charcoal artisan meat, grilled cheese, caramelized bacon, lettuce, house sauce." }, price: 31000, image: "classic_classic.jpeg", popular: true, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 31, restaurantId: 6, category: 'food', name: { es: "Arepa Burger", en: "Arepa Burger" }, description: { es: "Arepa paisa, carne queso chicharrón de pollo apanada, queso calta coleslaw, lechuga, tomato y salsa de la casa.", en: "Arepa paisa, meat, breaded chicken rind cheese, coleslaw, lettuce, tomato and house sauce." }, price: 27500, image: "classic_arepab.jpeg", popular: false, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 32, restaurantId: 6, category: 'food', name: { es: "Sweet Classic", en: "Sweet Classic" }, description: { es: "Pan artesanal, 150 gr de carne artesanal al carbón, queso gratinado, tocineta caramelizada, cebolla, puerro y salsa de la casa.", en: "Artisan bread, 150g charcoal artisan meat, grilled cheese, caramelized bacon, onion, leek and house sauce." }, price: 37000, image: "classic_sweet.jpeg", popular: false, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 33, restaurantId: 6, category: 'food', name: { es: "Grill Paisa", en: "Grill Paisa" }, description: { es: "Deliciosa burger en maduro artesanal, gratinada, con guacamole, plátano maduro, vegetales frescos y salsa la casa.", en: "Delicious burger in artisan sweet plantain, grilled with guacamole, sweet plantain, fresh vegetables and house sauce." }, price: 31500, image: "classic_classic.jpeg", popular: false, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 34, restaurantId: 6, category: 'food', name: { es: "Paradise Burger", en: "Paradise Burger" }, description: { es: "Pan brioche con ajonjolí, carne artesanal, queso costeño frito, tomates cherry caramelizada, lechuga y salsa de la casa.", en: "Sesame brioche bread, artisan meat, fried coastal cheese, caramelized cherry tomatoes, lettuce and house sauce." }, price: 34500, image: "classic_paradise.jpeg", popular: false, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 35, restaurantId: 6, category: 'food', name: { es: "Hawaí Burger", en: "Hawaí Burger" }, description: { es: "Pan brioche con ajonjolí, carne artesanal, queso asada, cebollas encurtidas, tomato, lechuga y salsa de la casa.", en: "Sesame brioche bread, artisan meat, grilled cheese, pickled onions, tomato, lettuce and house sauce." }, price: 33500, image: "classic_classic.jpeg", popular: false, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 36, restaurantId: 6, category: 'food', name: { es: "Burger Crunch Chicken", en: "Burger Crunch Chicken" }, description: { es: "Pan de parmesano y orégano, pechuga de pollo apanada, queso gratinado BBQ, lechuga, tomate y salsa de la casa.", en: "Parmesan and oregano bread, breaded chicken breast, BBQ grilled cheese, lettuce, tomato and house sauce." }, price: 30000, image: "classic_crunch.jpeg", popular: false, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 37, restaurantId: 6, category: 'food', name: { es: "Pork Burger", en: "Pork Burger" }, description: { es: "Pan artesanal, 110 grs de chicharrón con salsa acevichada, queso mozzarella, vegetales y salsa de la casa.", en: "Artisan bread, 110g pork rinds with acevichada sauce, mozzarella cheese, vegetables and house sauce." }, price: 37500, image: "classic_pork.jpeg", popular: false, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 38, restaurantId: 6, category: 'food', name: { es: "Hoops Onion Burger", en: "Hoops Onion Burger" }, description: { es: "Pan de parmesano y orégano, carne 100% artesanal, salsa de la casa, muzzarella gratinado y cebolla apanatos, tocineta caramelizada, lechuga crespa y tomate.", en: "Parmesan and oregano bread, 100% artisan meat, house sauce, grilled mozzarella and breaded onion, caramelized bacon, curly lettuce and tomato." }, price: 43000, image: "classic_hoops.jpeg", popular: true, options: ["Solo Producto", "Con Papas (+ $7.000)"] },
    { id: 39, restaurantId: 6, category: 'food', name: { es: "Burger Loving", en: "Burger Loving" }, description: { es: "Pan de parmesano y orégano, carne 100% artesanal, salsa de la casa, queso philadelphia, topping de mermelada, albahaca morada.", en: "Parmesan and oregano bread, 100% artisan meat, house sauce, Philadelphia cheese, jam topping, purple basil." }, price: 37000, image: "classic_loving.jpeg", popular: true, options: ["Solo Producto", "Con Papas (+ $7.000)"] }
];

let currentLang = 'es';
let cart = JSON.parse(localStorage.getItem('doraCart')) || [];
let currentCategory = 'all';

function saveCart() {
    localStorage.setItem('doraCart', JSON.stringify(cart));
}
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
    if (document.getElementById('cart-delivery')) document.getElementById('cart-delivery').innerText = formatPrice(DELIVERY_FEE);
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
        { id: 'supermarket', icon: '🛒', name: translations[currentLang].categories.supermarket },
        { id: 'licores', icon: '🍾', name: translations[currentLang].categories.licores }
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
    const titleEl = document.getElementById('rests-title');
    if (!grid) return;

    if (titleEl) {
        const sectionTitles = translations[currentLang].sectionTitles;
        titleEl.innerText = sectionTitles[currentCategory] || sectionTitles['all'];
    }

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
                    ${p.description ? `<p style="font-size: 12px; margin: 4px 0 8px 0; opacity: 0.9; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.description[currentLang]}</p>` : ''}
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

    const imgEl = document.getElementById('options-modal-img');
    if (imgEl && product.image) {
        imgEl.src = product.image;
        imgEl.alt = product.name[currentLang];
        imgEl.style.display = 'block';
    } else if (imgEl) {
        imgEl.style.display = 'none';
    }

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
    let finalPrice = product.price;

    // Detectar ajuste de precio en las opciones, ej: "(+ $7.000)"
    if (option && option.includes('(+ $')) {
        const parts = option.split('$');
        if (parts.length > 1) {
            const extraStr = parts[1].split(')')[0].replace(/\./g, '').trim();
            const extra = parseInt(extraStr);
            if (!isNaN(extra)) finalPrice += extra;
        }
    }

    const cartId = option ? `${product.id}-${option}` : `${product.id}`;
    const existing = cart.find(item => item.cartId === cartId);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty, option, cartId, price: finalPrice });
    }

    saveCart();
    updateCartCount();
    // SweetAlert2 Toast for adding to cart
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: 'success',
        title: currentLang === 'es' ? '¡Añadido!' : 'Added!',
        background: '#1F3A5F',
        color: '#fff',
        iconColor: '#fff'
    });
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
                ${p.description ? `<p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 8px 0; font-weight: 500; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${p.description[currentLang]}</p>` : ''}
                <p style="color: var(--primary); font-weight: 800;">${formatPrice(p.price)}</p>
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
    saveCart();
    renderCartItems();
    updateCartCount();
    renderProducts();
}

function updateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const envio = cart.length > 0 ? 6000 : 0;
    const total = subtotal + envio;

    document.getElementById('cart-subtotal').innerText = formatPrice(subtotal);

    // Si metimos al DOM la nueva fila (como ya hicimos en index.html)
    const cartDelivery = document.getElementById('cart-delivery');
    if (cartDelivery) {
        cartDelivery.innerText = formatPrice(envio);
        cartDelivery.parentElement.style.display = cart.length > 0 ? 'flex' : 'none';

        // Configurar los rotulos para multi-idioma
        cartDelivery.previousElementSibling.innerText = currentLang === 'es' ? 'Envío (Tarifa Fija)' : 'Delivery Fee (Fixed)';
    }

    document.getElementById('cart-total').innerText = formatPrice(total);
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
        Swal.fire({
            icon: 'warning',
            title: currentLang === 'es' ? 'Datos incompletos' : 'Incomplete data',
            text: currentLang === 'es' ? 'Por favor ingrese su nombre, dirección y número de Whatsapp.' : 'Please enter your name, address, and WhatsApp number.',
            confirmButtonColor: '#FF6B00',
            confirmButtonText: 'OK'
        });
        return;
    }

    const sendBtn = document.querySelector('#checkout-form-modal .checkout-btn');
    const originalBtnText = sendBtn ? sendBtn.innerText : '';

    try {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const randomId = letters[Math.floor(Math.random() * letters.length)] +
            letters[Math.floor(Math.random() * letters.length)] +
            numbers[Math.floor(Math.random() * numbers.length)] +
            numbers[Math.floor(Math.random() * numbers.length)];
        const orderId = 'ORD-' + randomId;

        // Disable button to prevent double submission
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.innerText = currentLang === 'es' ? 'Enviando...' : 'Sending...';
        }

        // Calculate subtotal and then add fixed delivery fee
        const orderTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0) + DELIVERY_FEE;

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
            total: orderTotal,
            status: 'pending'
        }]);

        if (error) throw error;

        // --- Petición al Bot Local de WhatsApp ---
        try {
            const detalles = cart.map(item => `${item.qty}x ${item.name[currentLang]} (${item.option ? item.option : 'Sin opción'})`).join('\n');
            let formatPhone = phoneInput.replace(/\D/g, ''); // Quitar cualquier letra/espacio
            if (formatPhone.length === 10) formatPhone = '57' + formatPhone; // Prevenir num de col sin indicativo

            // Averiguar de qué restaurante es el pedido (usamos el primero del carrito)
            const restaurantApp = restaurants.find(r => r.id === cart[0].restaurantId);
            const numRestaurante = restaurantApp && restaurantApp.whatsapp ? restaurantApp.whatsapp : '573222737975'; // fallback
            const qrPagar = restaurantApp && restaurantApp.qrUrl ? restaurantApp.qrUrl : '';

            await fetch('https://pentarchical-knuckly-tenley.ngrok-free.dev/api/send-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true' // Salta la pantalla de advertencia gratuita de Ngrok
                },
                body: JSON.stringify({
                    orderId: orderId,
                    clienteNumero: formatPhone,
                    restauranteNumero: numRestaurante,
                    qrUrl: qrPagar,
                    totalPedido: formatPrice(orderTotal),
                    detallesPedido: `Cliente: ${nameInput}\nDirección: ${addressInput}\nTotal a pagar: ${formatPrice(orderTotal)} (incluye ${formatPrice(DELIVERY_FEE)} envío)\n\nProductos:\n${detalles}\n\nNotas: ${notesInput || 'Ninguna'}`,
                })
            });
        } catch (botErr) {
            console.error('Error comunicando con el bot (asegúrate de que node bot.js esté encendido):', botErr);
        }
        // ------------------------------------------

        // Reset Cart and Form
        cart = [];
        saveCart();
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-address').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('order-notes').value = '';

        closeCheckoutForm();
        closeCart();
        renderCartItems();
        updateCartCount();

        // Success Feedback
        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: currentLang === 'es' ? '¡Pedido enviado!' : 'Order submitted!',
                text: currentLang === 'es' ? '✅ Tu pedido ha sido enviado con éxito.' : '✅ Your order has been submitted successfully.',
                confirmButtonColor: '#28a745',
                timer: 3500,
                timerProgressBar: true
            });
        }, 100);

    } catch (error) {
        console.error('Order submission error:', error);
        Swal.fire({
            icon: 'error',
            title: currentLang === 'es' ? 'Error al enviar' : 'Error sending',
            text: currentLang === 'es'
                ? 'No pudimos procesar tu pedido. Verifica tu conexión e intenta de nuevo.'
                : 'We couldn\'t process your order. Check your connection and try again.',
            confirmButtonColor: '#d33'
        });
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerText = originalBtnText;
        }
    }
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

// --- Buscador Global ---
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            const restaurantGrid = document.getElementById('restaurant-grid');
            const restsHeader = document.getElementById('rests-header');
            const restsTitle = document.getElementById('rests-title');
            const popularCarousel = document.getElementById('popular-carousel');
            const popularTitle = document.getElementById('popular-title');
            const catContainer = document.getElementById('categories-container');
            const catTitle = document.getElementById('cat-title');
            const productsGrid = document.getElementById('product-grid');
            const productsHeader = document.getElementById('restaurant-products-header');

            if (query.length === 0) {
                // Restaurar vista original
                currentCategory = 'all';
                renderCategories();
                renderRestaurants();
                if (popularCarousel) popularCarousel.style.display = 'block';
                if (popularTitle) popularTitle.parentElement.style.display = 'block';
                if (catContainer) catContainer.style.display = 'flex';
                if (catTitle) catTitle.parentElement.style.display = 'flex';

                if (restsHeader) restsHeader.style.display = 'flex';
                if (restsTitle) restsTitle.innerText = translations[currentLang].rests;

                productsGrid.style.display = 'none';
                productsHeader.style.display = 'none';
                currentRestaurantId = null;
                return;
            }

            // Ocultar inicio (carruseles y categorías)
            if (popularCarousel) popularCarousel.style.display = 'none';
            if (popularTitle) popularTitle.parentElement.style.display = 'none';
            if (catContainer) catContainer.style.display = 'none';
            if (catTitle) catTitle.parentElement.style.display = 'none';

            // Ocultar grilla de productos si estaba abierta
            productsGrid.style.display = 'none';
            productsHeader.style.display = 'none';

            // Mostrar grilla de Restaurantes para los resultados
            if (restaurantGrid) restaurantGrid.style.display = 'grid';
            if (restsHeader) restsHeader.style.display = 'flex';
            if (restsTitle) restsTitle.innerText = currentLang === 'es' ? 'Resultados de búsqueda' : 'Search Results';

            // Encontrar restaurantes que coincidan (Set para evitar duplicados)
            const matchedRestaurants = new Set();
            const catTranslates = translations[currentLang].categories;

            // 1. Por restaurante o categoría (Farmacia, Supermercado, etc.)
            restaurants.forEach(r => {
                const catName = catTranslates[r.category] ? catTranslates[r.category].toLowerCase() : '';
                const rName = r.name.toLowerCase();

                if (rName.includes(query) || catName.includes(query)) {
                    matchedRestaurants.add(r.id);
                }
            });

            // 2. Por producto que pertenece al restaurante
            products.forEach(p => {
                const pNameEs = p.name.es ? p.name.es.toLowerCase() : '';
                const pNameEn = p.name.en ? p.name.en.toLowerCase() : '';
                const pDescEs = (p.description && p.description.es) ? p.description.es.toLowerCase() : '';

                if (pNameEs.includes(query) || pNameEn.includes(query) || pDescEs.includes(query)) {
                    matchedRestaurants.add(p.restaurantId);
                }
            });

            // Filtrar y renderizar restaurantes
            const filteredRests = restaurants.filter(r => matchedRestaurants.has(r.id));

            restaurantGrid.innerHTML = filteredRests.length > 0 ? filteredRests.map(r => `
                <div class="restaurant-card" onclick="showRestaurantProducts(${r.id})">
                    <img src="${r.image}" class="restaurant-img" alt="${r.name.replace(/"/g, '&quot;')}">
                    <div class="restaurant-info">
                        <h3>${r.name}</h3>
                        <p>${translations[currentLang].categories[r.category]}</p>
                    </div>
                </div>
            `).join('') : `<p style="text-align:center; padding: 20px; grid-column: 1/-1;">${currentLang === 'es' ? 'No se encontraron resultados' : 'No results found'}</p>`;
        });
    }
});

async function adminLogin() {
    const { value: formValues } = await Swal.fire({
        title: currentLang === 'es' ? 'Acceso Admin' : 'Admin Access',
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
        confirmButtonText: currentLang === 'es' ? 'Entrar' : 'Login',
        confirmButtonColor: '#1F3A5F',
        showCancelButton: true,
        cancelButtonText: currentLang === 'es' ? 'Cancelar' : 'Cancel',
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
            title: currentLang === 'es' ? 'Autenticando...' : 'Authenticating...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // Autenticación real con Supabase
        const { data, error } = await getSupabaseClient().auth.signInWithPassword({
            email: user.trim(),
            password: pass.trim()
        });

        if (error) {
            Swal.fire({
                icon: 'error',
                title: currentLang === 'es' ? 'Error' : 'Error',
                text: currentLang === 'es' ? 'Credenciales incorrectas.' : 'Incorrect credentials.',
                confirmButtonColor: '#d33'
            });
        } else {
            // Redirigir si el login fue exitoso
            window.location.href = 'admin.html';
        }
    }
}
window.adminLogin = adminLogin;

updateUI();
