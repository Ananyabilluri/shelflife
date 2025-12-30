// ===============================
// SUPABASE CONFIG
// ===============================
const SUPABASE_URL = "https://ovmncweiieblooihrbmg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_N7299RC-cNXD8uMYirTSuw_pF8T3NFC";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===============================
// GLOBAL STATE
// ===============================
let currentUser = {
  name: "",
  email: "",
  foodType: ""
};

// ===============================
// PAGE ELEMENTS
// ===============================
const loginPage = document.getElementById("loginPage");
const profilePage = document.getElementById("profilePage");
const mainApp = document.getElementById("mainApp");

// ===============================
// LOGIN
// ===============================
function handleLogin() {
  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();

  if (!name || !email) {
    alert("Please enter name and email");
    return;
  }

  currentUser.name = name;
  currentUser.email = email;

  loginPage.classList.add("hidden");
  profilePage.classList.remove("hidden");
}

// ===============================
// PROFILE
// ===============================
function selectPreference(type) {
  currentUser.foodType = type;

  document.querySelectorAll(".preference-btn").forEach(btn => {
    btn.style.border = "2px solid transparent";
  });

  event.currentTarget.style.border = "2px solid green";
}

async function savePreference() {
  if (!currentUser.foodType) {
    alert("Please select veg or non-veg");
    return;
  }

  const { error } = await supabaseClient.from("users").insert([{
    username: currentUser.name,
    email: currentUser.email,
    food_type: currentUser.foodType
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  profilePage.classList.add("hidden");
  mainApp.classList.remove("hidden");

  document.getElementById("welcomeUser").innerText =
    `Hello, ${currentUser.name} 👋`;
  document.getElementById("userPreference").innerText =
    `Preference: ${currentUser.foodType}`;

  showSection("dashboard");
  loadProducts();
}

// ===============================
// NAVIGATION
// ===============================
function showSection(section) {
  ["dashboardSection", "addProductSection", "expiredSection"].forEach(id =>
    document.getElementById(id).classList.add("hidden")
  );

  document.querySelectorAll(".nav-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  if (section === "dashboard") {
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.querySelectorAll(".nav-btn")[0].classList.add("active");
  }

  if (section === "addProduct") {
    document.getElementById("addProductSection").classList.remove("hidden");
    document.querySelectorAll(".nav-btn")[1].classList.add("active");
  }

  if (section === "expired") {
    document.getElementById("expiredSection").classList.remove("hidden");
    document.querySelectorAll(".nav-btn")[2].classList.add("active");
  }
}

// ===============================
// ADD PRODUCT
// ===============================
async function addProduct() {
  const product = document.getElementById("productName").value.trim();
  const expiry = document.getElementById("expiryDate").value;

  if (!product || !expiry) {
    alert("Enter product and expiry date");
    return;
  }

  const { error } = await supabaseClient.from("items").insert([{
    product_name: product,
    expiry_date: expiry,
    user_email: currentUser.email
  }]);

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById("productName").value = "";
  document.getElementById("expiryDate").value = "";

  loadProducts();
  showSection("dashboard");
}

// ===============================
// DELETE PRODUCT
// ===============================
async function deleteProduct(id) {
  await supabaseClient.from("items").delete().eq("id", id);
  loadProducts();
}

// ===============================
// LOAD PRODUCTS + EXPIRY LOGIC
// ===============================
async function loadProducts() {
  const { data } = await supabaseClient
    .from("items")
    .select("*")
    .eq("user_email", currentUser.email);

  const list = document.getElementById("productList");
  const expiredList = document.getElementById("expiredList");

  list.innerHTML = "";
  expiredList.innerHTML = "";

  let fresh = 0, warning = 0, expired = 0;
  const today = new Date();

  data.forEach(item => {
    const expDate = new Date(item.expiry_date);
    const daysLeft = Math.ceil(
      (expDate - today) / (1000 * 60 * 60 * 24)
    );

    let statusText = "";
    let color = "";
    let emoji = "";

    if (daysLeft < 0) {
      expired++;
      statusText = "Expired";
      color = "#f44336";
      emoji = "❌";

      expiredList.innerHTML += `
        <div class="product-card" style="border-left-color:${color}">
          <div class="product-title">${emoji} ${item.product_name}</div>
          <div class="product-status">Expired</div>
          <button class="delete-btn" onclick="deleteProduct('${item.id}')">🗑️ Delete</button>
        </div>
      `;
    } else if (daysLeft <= 3) {
      warning++;
      statusText = `Expiring Soon • ${daysLeft} day(s) left`;
      color = "#ff9800";
      emoji = "⚠️";
    } else {
      fresh++;
      statusText = `Fresh • ${daysLeft} days left`;
      color = "#4caf50";
      emoji = "✅";
    }

    list.innerHTML += `
      <div class="product-card" style="border-left-color:${color}">
        <div class="product-title">${emoji} ${item.product_name}</div>
        <div class="product-status">${statusText}</div>
        <button class="delete-btn" onclick="deleteProduct('${item.id}')">🗑️ Delete</button>
      </div>
    `;
  });

  document.getElementById("freshCount").innerText = fresh;
  document.getElementById("warningCount").innerText = warning;
  document.getElementById("expiredCount").innerText = expired;
}


// ===============================
// LOGOUT
// ===============================
function logout() {
  location.reload();
}
