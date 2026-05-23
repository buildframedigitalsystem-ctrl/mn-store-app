/* =========================================
   STORE SESSION SYSTEM
========================================= */

const PUBLIC_STORE_PAGES = [
    "store-login.html",
    "store-signup.html"
];

function getStoreSession_() {
    try {
        return JSON.parse(localStorage.getItem("mnStoreSession") || "{}");
    } catch (error) {
        return {};
    }
}

function saveStoreSession_(data) {
    localStorage.setItem("mnStoreSession", JSON.stringify(data || {}));
}

function clearStoreSession_() {
    localStorage.removeItem("mnStoreSession");
}

function requireStoreLogin_() {
    const page = window.location.pathname.split("/").pop();
    const isPublicPage = PUBLIC_STORE_PAGES.includes(page);

    if (isPublicPage) return;

    const session = getStoreSession_();

    if (!session.CustomerID) {
        window.location.href = "store-login.html";
    }
}

/* =========================================
   STORE INFO
========================================= */

function getStoreName_() {
    return getStoreSession_().StoreName || "Store";
}

function getStoreType_() {
    return getStoreSession_().CustomerType || "Wholesale Store";
}

function getOutstandingBalance_() {
    return getStoreSession_().OutstandingBalance || 0;
}

/* =========================================
   DISPLAY SESSION DATA
========================================= */

function displayStoreSessionData_() {
    document.querySelectorAll("[data-store-name]").forEach(el => {
        el.textContent = getStoreName_();
    });

    document.querySelectorAll("[data-store-type]").forEach(el => {
        el.textContent = getStoreType_();
    });

    document.querySelectorAll("[data-balance]").forEach(el => {
        el.textContent = "₱" + Number(getOutstandingBalance_()).toLocaleString();
    });
}

function logoutStoreUser_() {
    localStorage.removeItem("mnUser");
    localStorage.removeItem("mnCustomerSession");
    localStorage.removeItem("mnStoreSession");
    localStorage.removeItem("mn_store_partner_cart");

    alert("Logged out successfully.");

    window.location.href = "store-login.html";
}

window.logoutStoreUser_ = logoutStoreUser_;

/* =========================================
   AUTO INIT
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    requireStoreLogin_();
    displayStoreSessionData_();
});