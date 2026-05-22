/* =========================================
   M&N STORE ORDERS MODULE
   BuildFrame Store OS
========================================= */

let storeProducts = [];
let orderCart = [];

let signatureCanvas = null;
let signatureCtx = null;
let isSigning = false;

const STORE_CART_KEY = "mn_store_partner_cart";

/* =========================================
   START
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    requireSessionSafe_();

    initializeSignaturePad_();
    initializeOrderButtons_();

    fillStoreInfo_();
    loadCartFromStorage_();

    loadStoreProducts_();
    loadRecentOrders_();
});

/* =========================================
   SESSION HELPERS
========================================= */

function getCurrentStoreSession_() {
    try {
        if (typeof getStoreSession_ === "function") {
            return getStoreSession_();
        }

        return JSON.parse(
            localStorage.getItem("mnStoreSession") || "{}"
        );
    } catch (error) {
        return {};
    }
}

function requireSessionSafe_() {
    const session = getCurrentStoreSession_();

    if (!session.CustomerID) {
        window.location.href = "store-login.html";
    }
}

function fillStoreInfo_() {
    const session = getCurrentStoreSession_();

    const customerNameField =
        document.getElementById("customerName");

    const contactField =
        document.getElementById("contactNumber");

    const statusText =
        document.getElementById("storeStatusText");

    const balanceText =
        document.getElementById("outstandingBalanceText");

    if (customerNameField) {
        customerNameField.value =
            session.StoreName || "";
    }

    if (contactField) {
        contactField.value =
            session.ContactNumber || "";
    }

    if (statusText) {
        statusText.innerText =
            session.AccountStatus || "ACTIVE";
    }

    if (balanceText) {
        balanceText.innerText =
            "₱" + formatMoney_(session.OutstandingBalance || 0);
    }
}

/* =========================================
   API URL
========================================= */

function getApiUrl_() {
    if (
        typeof API !== "undefined" &&
        API.BASE_URL
    ) {
        return API.BASE_URL;
    }

    return "https://script.google.com/macros/s/AKfycbxVDhIAQceRvhmF0XXTG0GNiecaOlkUv3UBBd0SC-Hyu-AA51Xfg5v02gaUNIAXyiII/exec"
}

/* =========================================
   LOAD CART FROM HOMEPAGE / CART PAGE
========================================= */

function loadCartFromStorage_() {
    try {
        const savedCart =
            JSON.parse(
                localStorage.getItem(STORE_CART_KEY) || "[]"
            );

        orderCart = savedCart.map(item => {
            const quantity =
                Number(item.quantity || item.Qty || 1);

            const price =
                Number(item.price || item.Price || 0);

            return {
                productId:
                    item.productId ||
                    item.ProductID ||
                    item.id ||
                    item.name ||
                    "",

                name:
                    item.name ||
                    item.ProductName ||
                    "Unnamed Product",

                quantity,
                price,
                total: quantity * price
            };
        });

        renderOrderCart_();

    } catch (error) {
        console.error("Cart load error:", error);
        orderCart = [];
        renderOrderCart_();
    }
}

/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadStoreProducts_() {
    const productSelect =
        document.getElementById("productSelect");

    if (!productSelect) return;

    try {
        productSelect.innerHTML = `
            <option value="">
                Loading products...
            </option>
        `;

        const response =
            await fetch(getApiUrl_(), {
                method: "POST",
                body: JSON.stringify({
                    action: "getWholesaleProducts"
                })
            });

        const data =
            await response.json();

        const rows =
            data.rows ||
            data.products ||
            data.data ||
            [];

        storeProducts =
            Array.isArray(rows) ? rows : [];

        if (!storeProducts.length) {
            productSelect.innerHTML = `
                <option value="">
                    No products found
                </option>
            `;
            return;
        }

        productSelect.innerHTML = `
            <option value="">
                Select Product
            </option>

            ${storeProducts.map((product, index) => {
            const name =
                product.ProductName ||
                product.productName ||
                product.Name ||
                "Unnamed Product";

            const price =
                Number(
                    product.PromoPrice ||
                    product.WholesalePrice ||
                    product.SellingPrice ||
                    0
                );

            return `
                    <option value="${index}">
                        ${escapeHTML_(name)} - ₱${formatMoney_(price)}
                    </option>
                `;
        }).join("")}
        `;

    } catch (error) {
        console.error(error);

        productSelect.innerHTML = `
            <option value="">
                Failed loading products
            </option>
        `;
    }
}

/* =========================================
   BUTTONS
========================================= */

function initializeOrderButtons_() {
    const addToCartBtn =
        document.getElementById("addToCartBtn");

    const clearSignatureBtn =
        document.getElementById("clearSignatureBtn");

    const orderForm =
        document.getElementById("orderForm");

    if (addToCartBtn) {
        addToCartBtn.addEventListener(
            "click",
            addSelectedProductToCart_
        );
    }

    if (clearSignatureBtn) {
        clearSignatureBtn.addEventListener(
            "click",
            clearSignature_
        );
    }

    if (orderForm) {
        orderForm.addEventListener(
            "submit",
            submitStoreOrder_
        );
    }
}

/* =========================================
   ADD PRODUCT TO CART
========================================= */

function addSelectedProductToCart_() {
    const productSelect =
        document.getElementById("productSelect");

    const quantityInput =
        document.getElementById("productQuantity");

    if (!productSelect || !quantityInput) return;

    const productIndex =
        productSelect.value;

    const quantity =
        Number(quantityInput.value || 1);

    if (productIndex === "") {
        alert("Please select product.");
        return;
    }

    if (quantity <= 0) {
        alert("Invalid quantity.");
        return;
    }

    const product =
        storeProducts[productIndex];

    if (!product) {
        alert("Product not found.");
        return;
    }

    const productId =
        product.ProductID ||
        product.ID ||
        product.ProductName;

    const name =
        product.ProductName ||
        product.productName ||
        product.Name ||
        "Unnamed Product";

    const price =
        Number(
            product.PromoPrice ||
            product.WholesalePrice ||
            product.SellingPrice ||
            0
        );

    const existing =
        orderCart.find(item =>
            String(item.productId) === String(productId)
        );

    if (existing) {
        existing.quantity += quantity;
        existing.total =
            existing.quantity * existing.price;
    } else {
        orderCart.push({
            productId,
            name,
            quantity,
            price,
            total: quantity * price
        });
    }

    saveCartToStorage_();

    productSelect.value = "";
    quantityInput.value = 1;

    renderOrderCart_();
}

function saveCartToStorage_() {
    localStorage.setItem(
        STORE_CART_KEY,
        JSON.stringify(orderCart)
    );
}

/* =========================================
   RENDER CART
========================================= */

function renderOrderCart_() {
    const cartTableBody =
        document.getElementById("cartTableBody");

    const totalAmountInput =
        document.getElementById("totalAmount");

    if (!cartTableBody) return;

    if (!orderCart.length) {
        cartTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No products added.
                </td>
            </tr>
        `;

        if (totalAmountInput) {
            totalAmountInput.value = 0;
        }

        return;
    }

    cartTableBody.innerHTML =
        orderCart.map((item, index) => `
            <tr>
                <td>${escapeHTML_(item.name)}</td>
                <td>${item.quantity}</td>
                <td>₱${formatMoney_(item.price)}</td>
                <td>₱${formatMoney_(item.total)}</td>
                <td>
                    <button
                        type="button"
                        onclick="removeCartItem_(${index})">
                        Remove
                    </button>
                </td>
            </tr>
        `).join("");

    const total =
        orderCart.reduce(
            (sum, item) => sum + Number(item.total || 0),
            0
        );

    if (totalAmountInput) {
        totalAmountInput.value = total;
    }
}

/* =========================================
   REMOVE CART ITEM
========================================= */

function removeCartItem_(index) {
    orderCart.splice(index, 1);
    saveCartToStorage_();
    renderOrderCart_();
}

/* =========================================
   SIGNATURE PAD
========================================= */

function initializeSignaturePad_() {
    signatureCanvas =
        document.getElementById("signatureCanvas");

    if (!signatureCanvas) return;

    signatureCtx =
        signatureCanvas.getContext("2d");

    resizeSignatureCanvas_();

    signatureCtx.lineWidth = 3;
    signatureCtx.strokeStyle = "#062f1b";
    signatureCtx.lineCap = "round";

    signatureCanvas.style.touchAction = "none";

    signatureCanvas.addEventListener("mousedown", startSignature_);
    signatureCanvas.addEventListener("mousemove", drawSignature_);
    signatureCanvas.addEventListener("mouseup", stopSignature_);
    signatureCanvas.addEventListener("mouseleave", stopSignature_);

    signatureCanvas.addEventListener(
        "touchstart",
        startSignature_,
        { passive: false }
    );

    signatureCanvas.addEventListener(
        "touchmove",
        drawSignature_,
        { passive: false }
    );

    signatureCanvas.addEventListener("touchend", stopSignature_);
}

function getSignaturePosition_(event) {
    const rect =
        signatureCanvas.getBoundingClientRect();

    if (event.touches && event.touches.length) {
        return {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top
        };
    }

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function startSignature_(event) {
    event.preventDefault();

    isSigning = true;

    const position =
        getSignaturePosition_(event);

    signatureCtx.beginPath();

    signatureCtx.moveTo(
        position.x,
        position.y
    );
}

function drawSignature_(event) {
    if (!isSigning) return;

    event.preventDefault();

    const position =
        getSignaturePosition_(event);

    signatureCtx.lineTo(
        position.x,
        position.y
    );

    signatureCtx.stroke();
}

function stopSignature_() {
    isSigning = false;
}

function clearSignature_() {
    if (!signatureCanvas || !signatureCtx) return;

    signatureCtx.clearRect(
        0,
        0,
        signatureCanvas.width,
        signatureCanvas.height
    );
}

function resizeSignatureCanvas_() {
    if (!signatureCanvas) return;

    const rect =
        signatureCanvas.getBoundingClientRect();

    signatureCanvas.width = rect.width || 700;
    signatureCanvas.height = rect.height || 150;
}

/* =========================================
   SUBMIT ORDER
========================================= */

async function submitStoreOrder_(event) {
    event.preventDefault();

    if (!orderCart.length) {
        alert("Please add product first.");
        return;
    }

    const session =
        getCurrentStoreSession_();

    const submitBtn =
        document.getElementById("submitOrderBtn");

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting...";
    }

    const payload = {
        action: "submitStoreOrder",

        storeId:
            session.CustomerID || "",

        storeName:
            session.StoreName || "",

        customerName:
            session.StoreName ||
            document.getElementById("customerName")?.value ||
            "",

        contactNumber:
            session.ContactNumber ||
            document.getElementById("contactNumber")?.value ||
            "",

        orderType: "Wholesale",

        paymentStatus:
            document.getElementById("paymentStatus")?.value || "Unpaid",

        orderNotes:
            document.getElementById("orderNotes")?.value || "",

        totalAmount:
            Number(
                document.getElementById("totalAmount")?.value || 0
            ),

        signatureImage:
            signatureCanvas
                ? signatureCanvas.toDataURL("image/png")
                : "",

        items: orderCart
    };

    try {
        const response =
            await fetch(getApiUrl_(), {
                method: "POST",
                body: JSON.stringify(payload)
            });

        const data =
            await response.json();

        if (!data.success) {
            throw new Error(
                data.message || "Submit failed."
            );
        }

        alert("Order submitted successfully.");

        orderCart = [];
        localStorage.removeItem(STORE_CART_KEY);

        renderOrderCart_();
        clearSignature_();

        document.getElementById("orderForm")?.reset();

        fillStoreInfo_();
        loadRecentOrders_();

    } catch (error) {
        console.error(error);
        alert("Failed submitting order.");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Order";
        }
    }
}

/* =========================================
   LOAD RECENT ORDERS
========================================= */

async function loadRecentOrders_() {
    const tbody =
        document.getElementById("ordersTableBody");

    if (!tbody) return;

    const session =
        getCurrentStoreSession_();

    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                Loading orders...
            </td>
        </tr>
    `;

    try {
        const response =
            await fetch(getApiUrl_(), {
                method: "POST",
                body: JSON.stringify({
                    action: "getStoreOrders",
                    storeId: session.CustomerID || ""
                })
            });

        const result =
            await response.json();

        if (!result.success) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Failed loading orders.
                    </td>
                </tr>
            `;
            return;
        }

        const orders =
            result.rows || [];

        updateSummaryCards_(orders);

        if (!orders.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        No orders yet.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML =
            orders.map(order => `
                <tr>
                    <td>${order.OrderID || "-"}</td>
                    <td>${order.CustomerName || "-"}</td>
                    <td>${order.OrderType || "-"}</td>
                    <td>₱${formatMoney_(order.TotalAmount)}</td>
                    <td>${order.PaymentStatus || "-"}</td>
                    <td>${order.DeliveryStatus || "-"}</td>
                    <td>
                        <button
                            type="button"
                            onclick="viewInvoice_('${order.InvoiceID || order.OrderID || ""}')">
                            View Invoice
                        </button>
                    </td>
                </tr>
            `).join("");

    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Backend connection failed.
                </td>
            </tr>
        `;
    }
}

/* =========================================
   SUMMARY CARDS
========================================= */

function updateSummaryCards_(orders) {
    const todayOrdersText =
        document.getElementById("todayOrdersText");

    const pendingDeliveriesText =
        document.getElementById("pendingDeliveriesText");

    const balanceText =
        document.getElementById("outstandingBalanceText");

    const session =
        getCurrentStoreSession_();

    const today =
        new Date().toDateString();

    const todayOrders =
        orders.filter(order => {
            const dateValue =
                order.OrderDate || order.CreatedAt;

            if (!dateValue) return false;

            return new Date(dateValue).toDateString() === today;
        });

    const pendingDeliveries =
        orders.filter(order =>
            String(order.DeliveryStatus || "").toLowerCase() !== "delivered"
        );

    if (todayOrdersText) {
        todayOrdersText.innerText =
            todayOrders.length;
    }

    if (pendingDeliveriesText) {
        pendingDeliveriesText.innerText =
            pendingDeliveries.length;
    }

    if (balanceText) {
        balanceText.innerText =
            "₱" + formatMoney_(session.OutstandingBalance || 0);
    }
}

/* =========================================
   VIEW INVOICE
========================================= */

function viewInvoice_(invoiceId) {
    const row =
        document
            .querySelector(`button[onclick="viewInvoice_('${invoiceId}')"]`)
            ?.closest("tr");

    if (!row) {
        alert("Invoice row not found.");
        return;
    }

    const cells =
        row.querySelectorAll("td");

    setInvoiceText_("invoiceIdText", invoiceId);
    setInvoiceText_("invoiceCustomerText", cells[1]?.innerText || "-");
    setInvoiceText_("invoiceContactText", document.getElementById("contactNumber")?.value || "-");
    setInvoiceText_("invoiceOrderTypeText", cells[2]?.innerText || "-");
    setInvoiceText_("invoicePaymentStatusText", cells[4]?.innerText || "-");
    setInvoiceText_("invoiceDeliveryStatusText", cells[5]?.innerText || "-");
    setInvoiceText_("invoiceDateText", new Date().toLocaleString("en-PH"));
    setInvoiceText_("invoiceTotalText", cells[3]?.innerText || "₱0.00");
    setInvoiceText_("invoiceNotesText", document.getElementById("orderNotes")?.value || "-");

    const signatureImg =
        document.getElementById("invoiceSignatureImage");

    if (signatureImg) {
        if (
            signatureCanvas &&
            signatureCanvas.toDataURL("image/png") !==
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
        ) {
            signatureImg.src =
                signatureCanvas.toDataURL("image/png");

            signatureImg.style.display = "block";
        } else {
            signatureImg.removeAttribute("src");
            signatureImg.style.display = "none";
        }
    }

    const modal =
        document.getElementById("invoiceModal");

    if (modal) {
        modal.style.display = "flex";
        modal.style.visibility = "visible";
        modal.style.opacity = "1";
    }
}

function setInvoiceText_(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.innerText = value || "-";
    }
}

function closeSimpleInvoice_() {
    const modal =
        document.getElementById("invoiceModal");

    if (modal) {
        modal.classList.remove("active");
    }
}

/* =========================================
   HELPERS
========================================= */

function formatMoney_(value) {
    return Number(
        value || 0
    ).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML_(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}