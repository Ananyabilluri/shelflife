// ================= GLOBAL VARIABLES =================
let selectedPreference = '';
let products = [];

// ================= PAGE LOAD =================
window.onload = function () {
    const user = JSON.parse(localStorage.getItem('user'));

    // Hide all sections first
    hideAll();

    if (!user) {
        // No user → Login page
        document.getElementById('loginPage').style.display = 'block';
        return;
    }

    if (!user.preference) {
        // User exists but no preference → Profile page
        document.getElementById('profilePage').style.display = 'block';
        return;
    }

    // User + preference → Main app
    showMainApp();
};

// ================= UTIL =================
function hideAll() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('profilePage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
}

// ================= LOGIN =================
function handleLogin() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();

    if (!name || !email) {
        alert('Please enter both name and email!');
        return;
    }

    fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
    })
        .then(res => res.json())
        .then(data => {
            localStorage.setItem('user', JSON.stringify(data.user));

            hideAll();
            document.getElementById('profilePage').style.display = 'block';
        })
        .catch(() => alert('Login failed'));
}

// ================= PROFILE =================
function selectPreference(pref) {
    selectedPreference = pref;

    document.querySelectorAll('.preference-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    event.target.closest('.preference-btn').classList.add('active');
}

function savePreference() {
    if (!selectedPreference) {
        alert('Please select a preference!');
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));

    fetch('/api/user/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: user.email,
            preference: selectedPreference
        })
    })
        .then(res => res.json())
        .then(data => {
            localStorage.setItem('user', JSON.stringify(data.user));
            showMainApp();
        })
        .catch(() => alert('Saving preference failed'));
}

// ================= MAIN APP =================
function showMainApp() {
    hideAll();
    document.getElementById('mainApp').style.display = 'block';

    loadUserData();
    loadProducts();
}

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));

    document.getElementById('welcomeUser').textContent = `Welcome, ${user.name}! 👋`;

    const prefText = user.preference === 'veg' ? '🥦 Vegetarian' : '🍗 Non-Vegetarian';
    document.getElementById('userPreference').textContent = prefText;
}

// ================= PRODUCTS =================
function loadProducts() {
    const user = JSON.parse(localStorage.getItem('user'));

    fetch(`/api/products/${user.email}`)
        .then(res => res.json())
        .then(data => {
            products = data.products || [];
            renderDashboard();
        });
}

function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const expiryDate = document.getElementById('expiryDate').value;

    if (!name || !expiryDate) {
        alert('Please fill all fields!');
        return;
    }

    const user = JSON.parse(localStorage.getItem('user'));

    fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: user.email,
            name,
            expiryDate
        })
    })
        .then(res => res.json())
        .then(() => {
            document.getElementById('productName').value = '';
            document.getElementById('expiryDate').value = '';
            loadProducts();
        });
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;

    fetch(`/api/products/${id}`, { method: 'DELETE' })
        .then(() => {
            products = products.filter(p => p.id !== id);
            renderDashboard();
        });
}

// ================= DATE LOGIC =================
function calculateDaysLeft(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(date);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function getStatus(days) {
    if (days < 0) return 'expired';
    if (days <= 3) return 'warning';
    return 'fresh';
}

// ================= DASHBOARD =================
function renderDashboard() {
    const productList = document.getElementById('productList');
    const expiredList = document.getElementById('expiredList');

    productList.innerHTML = '';
    expiredList.innerHTML = '';

    let fresh = 0, warning = 0, expired = 0;

    products.forEach(p => {
        const days = calculateDaysLeft(p.expiryDate);
        const status = getStatus(days);

        if (status === 'fresh') fresh++;
        if (status === 'warning') warning++;
        if (status === 'expired') expired++;

        productList.innerHTML += `
            <div class="product-card ${status}">
                <div>
                    <h3>${p.name}</h3>
                    <p>Expires: ${new Date(p.expiryDate).toLocaleDateString()}</p>
                </div>
                <div>
                    <span class="days-left ${status}">
                        ${status === 'expired' ? 'EXPIRED' : days + ' days'}
                    </span>
                    <button onclick="deleteProduct(${p.id})">🗑️</button>
                </div>
            </div>
        `;
    });

    const expiredItems = products.filter(
        p => getStatus(calculateDaysLeft(p.expiryDate)) === 'expired'
    );

    expiredItems.forEach(p => {
        expiredList.innerHTML += `
            <div class="product-card expired">
                <h3>${p.name}</h3>
                <p>Expired</p>
            </div>
        `;
    });

    document.getElementById('freshCount').textContent = fresh;
    document.getElementById('warningCount').textContent = warning;
    document.getElementById('expiredCount').textContent = expired;
}

// ================= NAV =================
function showSection(section) {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('addProductSection').style.display = 'none';
    document.getElementById('expiredSection').style.display = 'none';

    if (section === 'dashboard') document.getElementById('dashboardSection').style.display = 'block';
    if (section === 'addProduct') document.getElementById('addProductSection').style.display = 'block';
    if (section === 'expired') document.getElementById('expiredSection').style.display = 'block';
}

// ================= LOGOUT =================
function logout() {
    if (confirm('Logout?')) {
        localStorage.removeItem('user');
        location.reload();
    }
}
