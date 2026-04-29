import { menuArray } from "./data.js";

let orderArray = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────
document.addEventListener("click", function (e) {
    if (e.target.dataset.add) {
        handleAddClick(e.target.dataset.add);
    } 
    else if (e.target.dataset.remove) {
        handleRemoveClick(e.target.dataset.remove);
    } 
    else if (e.target.id === "complete-btn") {
        handleCompleteOrder();
    }
    else if (e.target.dataset.favorite) {
        handleFavoriteClick(e.target.dataset.favorite);
    }
    else if (e.target.id === "reorder-btn") {
        handleReorderLast();
    }
    else if (e.target.id === "cart-btn" || e.target.closest("#cart-btn")) {
        const sidebar = document.getElementById("order-sidebar");
        sidebar.classList.toggle("active");
    }
    else if (e.target.classList.contains("modal-overlay")) {
        document.getElementById("payment-modal").classList.add("hidden");
    }
    else if (e.target.classList.contains('category-btn')) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        handleCategoryFilter(e.target.dataset.category);
    }
    else if (e.target.id === "clear-btn") {
        orderArray = [];
        render();
    }
});

// ─── CORE FUNCTIONS ───────────────────────────────────────────────────────

function handleAddClick(itemId) {
    const targetItem = menuArray.find(item => item.id === Number(itemId));
    
    if (targetItem) {
        orderArray.push(targetItem);
        render();
        showNotification(`Added ${targetItem.name}`);
    }
}

function handleRemoveClick(itemId) {
    const targetIndex = orderArray.findIndex(item => item.id === Number(itemId));
    
    if (targetIndex > -1) {
        orderArray.splice(targetIndex, 1);
        render();
    }
}

function handleCompleteOrder() {
    if (orderArray.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    
    updatePaymentTotal();
    document.getElementById("payment-modal").classList.remove("hidden");
}

// ─── FAVORITES SYSTEM ─────────────────────────────────────────────────────

function handleFavoriteClick(itemId) {
    const id = Number(itemId);
    
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    render();
}

function isFavorite(itemId) {
    return favorites.includes(itemId);
}



function handleReorderLast() {
    if (orderHistory.length === 0) {
        alert("No previous orders found!");
        return;
    }
    
    const lastOrder = orderHistory[0];
    orderArray = [...lastOrder.items];
    render();
    
    showNotification("Reordered your last meal!");
}

// ─── CALCULATE TOTAL WITH TRANSPARENCY ────────────────────────────────────

function calculateTotal() {
    const subtotal = orderArray.reduce((sum, item) => sum + item.price, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const delivery = subtotal > 50 ? 0 : 8;
    const total = subtotal + tax + delivery;
    
    return {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        delivery: delivery.toFixed(2),
        total: total.toFixed(2),
        serviceFee: 0
    };
}

// ─── CALORIE COUNTER ──────────────────────────────────────────────────────

function calculateMealCalories() {
    if (orderArray.length === 0) return 0;
    
    const totalCalories = orderArray.reduce((sum, item) => sum + item.calories, 0);
    return totalCalories;
}

// ─── CATEGORY FILTER ──────────────────────────────────────────────────────

let activeCategory = "all";

function handleCategoryFilter(category) {
    activeCategory = category;
    render();
}

function getFilteredMenu() {
    if (activeCategory === "all") {
        return menuArray;
    }
    return menuArray.filter(item => item.category === activeCategory);
}

// ─── NOTIFICATION SYSTEM ──────────────────────────────────────────────────

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ─── SAVE ORDER TO HISTORY ────────────────────────────────────────────────

function saveOrderToHistory(customerName) {
    const order = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        items: orderArray,
        total: calculateTotal().total,
        customerName: customerName
    };
    
    orderHistory.unshift(order);
    orderHistory = orderHistory.slice(0, 10);
    
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
}

// ─── UPDATE FUNCTIONS ─────────────────────────────────────────────────────

function updateCartButton() {
    const count = orderArray.length;
    const total = orderArray.reduce((sum, item) => sum + item.price, 0);
    
    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total').textContent = total;
}

function updatePaymentTotal() {
    const total = calculateTotal().total;
    const finalTotalSpan = document.getElementById('final-total');
    if (finalTotalSpan) {
        finalTotalSpan.textContent = total;
    }
}

// ─── RENDER FUNCTIONS ─────────────────────────────────────────────────────

function getMenuHtml() {
    const filteredMenu = getFilteredMenu();
    let menuHtml = "";
    let lastCategory = "";

    filteredMenu.forEach(function (item) {
        if (item.category !== lastCategory) {
            menuHtml += `<h2 class="menu-category-header">${item.category}</h2>`;
            lastCategory = item.category;
        }

        const heartIcon = isFavorite(item.id) ? '❤️' : '🤍';

        menuHtml += `
            <div class="menu-item">
                <div class="item-img-container">
                    <img src="${item.image}" class="item-img" alt="${item.name}">
                </div>
                <div class="menu-details">
                    <div class="item-header">
                        <h3 class="item-name">${item.name}</h3>
                        <button class="favorite-btn" data-favorite="${item.id}" aria-label="Add to favorites">
                            ${heartIcon}
                        </button>
                    </div>
                    <p class="item-ingredients">${item.ingredients.join(", ")}</p>
                    <div class="item-meta">
                        <span class="item-rating">⭐ ${item.rating} (${item.reviews})</span>
                        <span class="item-calories">${item.calories} cal</span>
                    </div>
                    <div class="item-footer">
                        <p class="item-price">$${item.price}</p>
                        <button class="add-btn" data-add="${item.id}">Add to Order</button>
                    </div>
                </div>
            </div>
        `;
    });

    return menuHtml;
}

function getOrderHtml() {
    if (orderArray.length === 0) {
        return `
            <div class="order-header">
                <h3>Your Order</h3>
            </div>
            <p style="color: #999; text-align: center; padding: 40px 20px;">Your cart is empty</p>
            ${orderHistory.length > 0 ? '<button class="reorder-btn" id="reorder-btn">Reorder Last Meal</button>' : ''}
        `;
    }

    const totals = calculateTotal();
    const calories = calculateMealCalories();

    let orderHtml = `
        <div class="order-header">
            <h3 class="order-title">Your Order</h3>
            <p class="order-calories">${calories} total calories</p>
        </div>
    `;

    orderArray.forEach(function (item) {
        orderHtml += `
            <div class="order-item">
                <div class="order-item-details">
                    <p class="order-item-name">${item.name}</p>
                    <button class="remove-btn" data-remove="${item.id}">✕</button>
                </div>
                <p class="order-item-price">$${item.price}</p>
            </div>
        `;
    });

    orderHtml += `
        <div class="order-summary">
            <div class="order-line">
                <span>Subtotal</span>
                <span>$${totals.subtotal}</span>
            </div>
            <div class="order-line">
                <span>Tax (8%)</span>
                <span>$${totals.tax}</span>
            </div>
            <div class="order-line">
                <span>Delivery ${totals.delivery === '0.00' ? '(Free over $50!)' : ''}</span>
                <span>$${totals.delivery}</span>
            </div>
            <div class="order-line service-fee">
                <span>Service Fee</span>
                <span>$${totals.serviceFee} 🎉</span>
            </div>
            <div class="order-total">
                <span>Total</span>
                <span>$${totals.total}</span>
            </div>
        </div>
        
        <button class="complete-btn" id="complete-btn">Complete Order</button>
    `;

    return orderHtml;
}

function render() {
    document.getElementById("menu-container").innerHTML = getMenuHtml();

    const orderSection = document.getElementById("order-sidebar");  
    const orderContent = getOrderHtml();

    orderSection.innerHTML = orderContent;
    
    updateCartButton();
}

// ─── PAYMENT FORM HANDLER ─────────────────────────────────────────────────

const paymentForm = document.getElementById("payment-form");

paymentForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const formData = new FormData(paymentForm);
    const customerName = formData.get("fullName");
    
    saveOrderToHistory(customerName);
    
    document.getElementById("payment-modal").classList.add("hidden");
    
    const thankYou = document.getElementById("thank-you");
    thankYou.classList.remove("hidden");
    
    document.getElementById("customer-name").textContent = customerName;
    
    const orderNum = Math.floor(100000 + Math.random() * 900000);
    document.getElementById("order-number").textContent = orderNum;
    
    orderArray = [];
    
    paymentForm.reset();
});

// New Order Button Handler
document.getElementById("new-order-btn").addEventListener("click", function() {
    document.getElementById("thank-you").classList.add("hidden");
    render();
});


// ─── TASTE PROFILE INTELLIGENCE ───────────────────────────────────────────

function savePreference(itemId, action) {
    let preferences = JSON.parse(localStorage.getItem('tasteProfile')) || { 
        liked: [], 
        disliked: [], 
        allergens: [] 
    };
    
    if (action === 'added') {
        if (!preferences.liked.includes(itemId)) {
            preferences.liked.push(itemId);
        }
    } else if (action === 'skipped') {
        if (!preferences.disliked.includes(itemId)) {
            preferences.disliked.push(itemId);
        }
    }
    
    localStorage.setItem('tasteProfile', JSON.stringify(preferences));
}

function getSuggestedDishes() {
    const preferences = JSON.parse(localStorage.getItem('tasteProfile'));
    if (!preferences || preferences.liked.length < 3) return [];
    
    const likedCategories = preferences.liked.map(id => {
        const item = menuArray.find(i => i.id === id);
        return item ? item.category : null;
    }).filter(Boolean);
    
    const mostLikedCategory = likedCategories.sort((a,b) =>
        likedCategories.filter(v => v === a).length - 
        likedCategories.filter(v => v === b).length
    ).pop();
    
    return menuArray.filter(item => 
        item.category === mostLikedCategory && 
        !preferences.liked.includes(item.id)
    ).slice(0, 3);
}

// ─── ALLERGEN FILTERING SYSTEM ────────────────────────────────────────────

const allergenDatabase = {
    0: ['dairy'],           // Wings (blue cheese)
    3: ['dairy', 'gluten'], // Wagyu Burger
    4: ['dairy', 'gluten'], // Pizza
    5: ['gluten'],          // Beef Wellington
    7: ['soy', 'nuts'],     // Tofu Fried Rice
    9: ['dairy', 'gluten'], // Mac & Cheese
    10: ['dairy', 'eggs'],  // Lava Cake
    11: ['dairy', 'eggs'],  // Cheesecake
    12: ['gluten'],         // Beer
    14: ['dairy']           // Latte
};

function setAllergens(allergenList) {
    let preferences = JSON.parse(localStorage.getItem('tasteProfile')) || { 
        liked: [], 
        disliked: [], 
        allergens: [] 
    };
    
    preferences.allergens = allergenList;
    localStorage.setItem('tasteProfile', JSON.stringify(preferences));
}

function filterByAllergens() {
    const preferences = JSON.parse(localStorage.getItem('tasteProfile'));
    if (!preferences || preferences.allergens.length === 0) return menuArray;
    
    return menuArray.filter(item => {
        const itemAllergens = allergenDatabase[item.id] || [];
        return !itemAllergens.some(allergen => 
            preferences.allergens.includes(allergen)
        );
    });
}

function hasAllergen(itemId) {
    const preferences = JSON.parse(localStorage.getItem('tasteProfile'));
    if (!preferences || preferences.allergens.length === 0) return false;
    
    const itemAllergens = allergenDatabase[itemId] || [];
    return itemAllergens.some(allergen => 
        preferences.allergens.includes(allergen)
    );
}

// ─── DELIVERY TIME ESTIMATION ─────────────────────────────────────────────

function calculateDeliveryTime() {
    const itemCount = orderArray.length;
    const hasComplexItems = orderArray.some(item => 
        ['Main', 'Desserts'].includes(item.category)
    );
    
    let baseTime = 15;
    if (itemCount > 3) baseTime += 5;
    if (hasComplexItems) baseTime += 10;
    
    return {
        min: baseTime,
        max: baseTime + 10,
        estimate: `${baseTime}-${baseTime + 10} min`
    };
}

// ─── SMART REORDERING WITH FREQUENCY ANALYSIS ─────────────────────────────

function getMostOrderedItems() {
    if (orderHistory.length === 0) return [];
    
    const itemFrequency = {};
    
    orderHistory.forEach(order => {
        order.items.forEach(item => {
            if (itemFrequency[item.id]) {
                itemFrequency[item.id].count++;
            } else {
                itemFrequency[item.id] = { item, count: 1 };
            }
        });
    });
    
    return Object.values(itemFrequency)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(entry => entry.item);
}

// ─── NUTRITIONAL INSIGHTS ─────────────────────────────────────────────────

function getNutritionalSummary() {
    if (orderArray.length === 0) return null;
    
    const totalCalories = calculateMealCalories();
    const avgCaloriesPerItem = Math.round(totalCalories / orderArray.length);
    
    let healthScore = 'Balanced';
    if (totalCalories > 2000) healthScore = 'Indulgent';
    if (totalCalories < 800) healthScore = 'Light';
    
    const hasVegetarian = orderArray.some(item => 
        [2, 7].includes(item.id) // Soup, Tofu Rice
    );
    
    return {
        totalCalories,
        avgCaloriesPerItem,
        healthScore,
        hasVegetarian,
        proteinItems: orderArray.filter(item => 
            ['Main', 'Starters'].includes(item.category)
        ).length
    };
}

// ─── COMPETITIVE PRICING TRANSPARENCY ─────────────────────────────────────

function compareWithCompetitors() {
    const ourTotal = calculateTotal();
    
    const uberEatsMarkup = parseFloat(ourTotal.subtotal) * 0.30;
    const glovoMarkup = parseFloat(ourTotal.subtotal) * 0.25;
    
    return {
        lumiere: parseFloat(ourTotal.total),
        uberEats: parseFloat(ourTotal.subtotal) + uberEatsMarkup + 5 + parseFloat(ourTotal.tax),
        glovo: parseFloat(ourTotal.subtotal) + glovoMarkup + 4 + parseFloat(ourTotal.tax),
        savings: {
            vsUber: Math.round((parseFloat(ourTotal.subtotal) * 0.30 + 5) * 100) / 100,
            vsGlovo: Math.round((parseFloat(ourTotal.subtotal) * 0.25 + 4) * 100) / 100
        }
    };
}

// ─── PEAK HOURS DETECTION ────────────────────────────────────────────────

function isPeakHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    const lunchRush = hour >= 12 && hour <= 14;
    const dinnerRush = hour >= 18 && hour <= 21;
    const weekend = day === 0 || day === 6;
    
    if (weekend && (lunchRush || dinnerRush)) {
        return { isPeak: true, multiplier: 1.5, message: 'Weekend peak hours' };
    } else if (lunchRush || dinnerRush) {
        return { isPeak: true, multiplier: 1.2, message: 'Peak dining hours' };
    }
    
    return { isPeak: false, multiplier: 1, message: 'Off-peak hours' };
}

// ─── INITIALIZE ───────────────────────────────────────────────────────────

render();
