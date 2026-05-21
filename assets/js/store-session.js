/* =========================================
   STORE SESSION SYSTEM
========================================= */

function getStoreSession_() {
    return JSON.parse(
        localStorage.getItem("mnStoreSession")
    );
}

function saveStoreSession_(data) {
    localStorage.setItem(
        "mnStoreSession",
        JSON.stringify(data)
    );
}

function clearStoreSession_() {
    localStorage.removeItem("mnStoreSession");
}

/* =========================================
   STORE INFO
========================================= */

function getStoreName_() {
    const session = getStoreSession_();

    return session?.StoreName || "Store";
}

function getStoreType_() {
    const session = getStoreSession_();

    return session?.StoreType || "Retail";
}

function getPriceLevel_() {
    const session = getStoreSession_();

    return session?.PriceLevel || "Retail";
}

function getOutstandingBalance_() {
    const session = getStoreSession_();

    return session?.OutstandingBalance || 0;
}

/* =========================================
   DISPLAY SESSION DATA
========================================= */

function displayStoreSessionData_() {

    const storeTargets =
        document.querySelectorAll("[data-store-name]");

    const typeTargets =
        document.querySelectorAll("[data-store-type]");

    const priceTargets =
        document.querySelectorAll("[data-price-level]");

    const balanceTargets =
        document.querySelectorAll("[data-balance]");

    storeTargets.forEach(el => {
        el.textContent = getStoreName_();
    });

    typeTargets.forEach(el => {
        el.textContent = getStoreType_();
    });

    priceTargets.forEach(el => {
        el.textContent = getPriceLevel_();
    });

    balanceTargets.forEach(el => {
        el.textContent =
            "₱" +
            Number(getOutstandingBalance_())
                .toLocaleString();
    });

}

/* =========================================
   AUTO INIT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    displayStoreSessionData_();

});