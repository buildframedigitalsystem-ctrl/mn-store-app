const STORE_CART_KEY = "mn_store_partner_cart";

document.addEventListener("DOMContentLoaded", () => {
    renderCart_();
});

function getCart_() {
    return JSON.parse(
        localStorage.getItem(STORE_CART_KEY) || "[]"
    );
}

function saveCart_(cart) {
    localStorage.setItem(
        STORE_CART_KEY,
        JSON.stringify(cart)
    );
}

function renderCart_() {
    const cart = getCart_();

    const container =
        document.getElementById("cartItemsContainer");

    const itemCount =
        document.getElementById("cartItemCount");

    const subtotalText =
        document.getElementById("cartSubtotal");

    const totalText =
        document.getElementById("cartTotal");

    if (!container) return;

    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-cart">
                Cart is empty.
            </div>
        `;

        if (itemCount) itemCount.textContent = "0";
        if (subtotalText) subtotalText.textContent = "₱0.00";
        if (totalText) totalText.textContent = "₱0.00";

        return;
    }

    let subtotal = 0;
    let count = 0;

    container.innerHTML = cart.map((item, index) => {
        const qty = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        const total = qty * price;

        subtotal += total;
        count += qty;

        return `
            <div class="cart-item">
                <img src="${item.image || "assets/images/no-image.png"}" alt="">

                <div class="cart-item-info">
                    <h3>${item.name || "Unnamed Product"}</h3>
                    <p>${item.category || ""}</p>
                    <strong>₱${formatMoney_(price)}</strong>
                </div>

                <div class="cart-item-controls">
                    <button onclick="changeQty_(${index}, -1)">−</button>
                    <span>${qty}</span>
                    <button onclick="changeQty_(${index}, 1)">+</button>
                </div>

                <div class="cart-item-total">
                    ₱${formatMoney_(total)}
                </div>

                <button class="remove-cart-btn" onclick="removeItem_(${index})">
                    Remove
                </button>
            </div>
        `;
    }).join("");

    if (itemCount) itemCount.textContent = count;
    if (subtotalText) subtotalText.textContent = "₱" + formatMoney_(subtotal);
    if (totalText) totalText.textContent = "₱" + formatMoney_(subtotal);
}

function changeQty_(index, amount) {
    const cart = getCart_();

    if (!cart[index]) return;

    cart[index].quantity =
        Math.max(1, Number(cart[index].quantity || 1) + amount);

    saveCart_(cart);
    renderCart_();
}

function removeItem_(index) {
    const cart = getCart_();

    cart.splice(index, 1);

    saveCart_(cart);
    renderCart_();
}

function formatMoney_(value) {
    return Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}