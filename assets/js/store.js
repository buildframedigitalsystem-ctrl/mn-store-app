/* ===============================
   M&N PUBLIC ONLINE STORE
   BuildFrame Store Rendering Engine
================================ */

let allProducts = [];
let visibleCount = 20;

/* ===============================
   PAGE MODE DETECTION
================================ */

function getStoreMode() {
    const bodyMode = document.body.dataset.storePage;

    if (bodyMode) return bodyMode;

    const page = window.location.pathname.toLowerCase();

    if (page.includes("wholesale")) return "wholesale";
    if (page.includes("retail")) return "retail";
    if (page.includes("promo")) return "promo";

    return "home";
}

/* ===============================
   URL CATEGORY DETECTION
================================ */

function getCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || "";
}

/* ===============================
   INITIALIZE STORE
================================ */

document.addEventListener("DOMContentLoaded", async () => {
    initializeCategoryCards();
    bindStoreEvents();
    await loadProductsFromAPI();

    const categoryFromURL = getCategoryFromURL();
    const categoryFilter = document.getElementById("categoryFilter");

    if (categoryFromURL && categoryFilter) {
        categoryFilter.value = categoryFromURL;
        visibleCount = 20;
        filterProducts();
    }
});

/* ===============================
   LOAD PRODUCTS
================================ */

async function loadProductsFromAPI() {
    const productGrid = document.getElementById("productGrid");

    try {
        if (productGrid) {
            productGrid.innerHTML = `<p>Loading products...</p>`;
        }

        const API_URL =
            typeof API !== "undefined" && API.BASE_URL
                ? API.BASE_URL
                : "https://script.google.com/macros/s/AKfycbzbUww2SKIl6uqQvPqLtO6L35A0Xw5Ny0N5hjq16JOguAiLUAovKMdUagJ9SgK1fOSJ/exec";

        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getWholesaleProducts"
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to fetch products.");
        }

        const rows =
            data.rows ||
            data.products ||
            data.data ||
            [];

        allProducts = Array.isArray(rows) ? rows : [];

        populateCategoryFilter(allProducts);
        filterProducts();

    } catch (error) {
        console.error("Product load error:", error);

        if (productGrid) {
            productGrid.innerHTML = `<p>Failed to load products.</p>`;
        }
    }
}

/* ===============================
   EVENTS
================================ */

function bindStoreEvents() {
    const searchInput = document.getElementById("storeSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const loadMoreBtn = document.getElementById("loadMoreProducts");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            visibleCount = 20;
            filterProducts();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", () => {
            visibleCount = 20;
            filterProducts();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            visibleCount += 20;
            filterProducts();
        });
    }
}

/* ===============================
   FILTER PRODUCTS
================================ */

function filterProducts() {
    const mode = getStoreMode();

    const searchValue =
        document.getElementById("storeSearch")
            ?.value
            .toLowerCase()
            .trim() || "";

    const categoryValue =
        document.getElementById("categoryFilter")
            ?.value || "all";

    const filtered = allProducts.filter(product => {
        const productName =
            String(
                product.ProductName ||
                product.productName ||
                product.Name ||
                ""
            ).toLowerCase();

        const description =
            String(
                product.Description ||
                product.description ||
                ""
            ).toLowerCase();

        const category =
            String(
                product.Category ||
                product.category ||
                ""
            );

        const matchesSearch =
            productName.includes(searchValue) ||
            description.includes(searchValue);

        const matchesCategory =
            categoryValue === "all" ||
            category === categoryValue;

        const matchesMode =
            productMatchesMode(product, mode);

        return matchesSearch && matchesCategory && matchesMode;
    });

    renderProducts(filtered, mode);
}

/* ===============================
   MODE RULES
================================ */

function productMatchesMode(product, mode) {
    if (mode === "home") {
        return (
            isYes(product.ShowOnHomepage) ||
            isYes(product.Featured) ||
            isYes(product.ShowInWholesale)
        );
    }

    if (mode === "wholesale") {
        return (
            isYes(product.ShowInWholesale) ||
            Number(product.WholesalePrice || 0) > 0
        );
    }

    if (mode === "promo") {
        return (
            isYes(product.IsPromo) ||
            isYes(product.OnSale) ||
            Number(product.PromoPrice || 0) > 0 ||
            String(product.DiscountLabel || "").trim() !== "" ||
            String(product.BundleName || "").trim() !== ""
        );
    }

    return true;
}

/* ===============================
   RENDER PRODUCTS
================================ */

function renderProducts(products, mode) {
    const productGrid = document.getElementById("productGrid");
    const loadMoreBtn = document.getElementById("loadMoreProducts");

    if (!productGrid) return;

    if (!products || products.length === 0) {
        productGrid.innerHTML = `<p>No products found.</p>`;

        if (loadMoreBtn) {
            loadMoreBtn.style.display = "none";
        }

        return;
    }

    const visibleProducts = products.slice(0, visibleCount);

    productGrid.innerHTML =
        visibleProducts
            .map(product => createProductCard(product, mode))
            .join("");

    if (loadMoreBtn) {
        loadMoreBtn.style.display =
            products.length > visibleCount
                ? "inline-block"
                : "none";
    }
}

/* ===============================
   PRODUCT CARD
================================ */

function createProductCard(product, mode) {

    const productIndex =
        getProductIndex_(product);

    const name =
        product.ProductName ||
        product.productName ||
        product.Name ||
        "Unnamed Product";

    const category =
        product.Category ||
        product.category ||
        "";

    const description =
        product.Description ||
        product.description ||
        "";

    const image =
        getProductImage(product);

    const wholesalePrice =
        Number(
            product.WholesalePrice ||
            product.wholesalePrice ||
            0
        );

    const promoPrice =
        Number(
            product.PromoPrice ||
            product.promoPrice ||
            0
        );

    const priceHTML =
        getPriceHTML({
            mode,
            wholesalePrice,
            promoPrice,
            discountLabel:
                product.DiscountLabel || "",
            bundleName:
                product.BundleName || ""
        });

    /* ===============================
       STOCK DISPLAY
    ================================ */

    const stockCount =
        Number(
            product.CurrentStock ||
            product.StockQty ||
            product.Quantity ||
            0
        );

    const showStockCount =
        String(
            product.ShowStockCount || ""
        ).toUpperCase() === "YES";

    const stockHTML =
        stockCount <= 0
            ? `
                <div class="stock-badge out">
                    Out Of Stock
                </div>
            `
            : showStockCount
                ? `
                    <div class="stock-badge in">
                        ${stockCount} Stocks Left
                    </div>
                `
                : `
                    <div class="stock-badge in">
                        In Stock
                    </div>
                `;

    return `
        <div class="product-card">

            <div class="product-image">

                ${image
            ? `
                        <img
                            src="${image}"
                            alt="${escapeHTML(name)}"
                            loading="lazy"
                            onerror="this.src='assets/images/no-image.png';"
                        >
                    `
            : `
                        <span>No Image Yet</span>
                    `
        }

            </div>

            <div class="product-info">

                <span class="product-category">
                    ${escapeHTML(category)}
                </span>

                <h3>
                    ${escapeHTML(name)}
                </h3>

                <p>
                    ${escapeHTML(description)}
                </p>

                ${priceHTML}

                ${stockHTML}

                <div class="product-actions">

                    <button
                        type="button"
                        class="view-btn"
                        onclick="openProductModal(${productIndex})"
                    >
                        View Details
                    </button>

                 ${stockCount <= 0
            ? `
        <button
            type="button"
            class="cart-btn"
            disabled
            style="opacity:0.55; cursor:not-allowed;">
            Out Of Stock
        </button>
    `
            : `
        <button
            type="button"
            class="cart-btn"
            onclick="addProductToCartSafe_(${productIndex})"
        >
            🛒 Add To Cart
        </button>
    `
        }

                </div>

            </div>

        </div>
    `;
}


function getProductIndex_(product) {
    return allProducts.findIndex(item => {
        const itemKey =
            item.ProductID ||
            item.ProductName ||
            item.Name;

        const productKey =
            product.ProductID ||
            product.ProductName ||
            product.Name;

        return String(itemKey) === String(productKey);
    });
}

/* ===============================
   PRICE DISPLAY
================================ */

function getPriceHTML(data) {
    if (data.mode === "promo" && data.promoPrice > 0) {
        return `
            <div class="product-price">
                ${data.discountLabel
                ? `<span class="promo-label">${escapeHTML(data.discountLabel)}</span>`
                : ""
            }

                ${data.bundleName
                ? `<small>${escapeHTML(data.bundleName)}</small>`
                : ""
            }

                <strong>Promo: ₱${formatMoney(data.promoPrice)}</strong>
                <small>Wholesale: ₱${formatMoney(data.wholesalePrice)}</small>
            </div>
        `;
    }

    return `
        <div class="product-price">
            <strong>Wholesale: ₱${formatMoney(data.wholesalePrice)}</strong>
        </div>
    `;
}

/* ===============================
   CATEGORY FILTER
================================ */

function populateCategoryFilter(products) {
    const categoryFilter =
        document.getElementById("categoryFilter");

    if (!categoryFilter) return;

    const categories =
        [...new Set(
            products
                .map(product =>
                    product.Category ||
                    product.category ||
                    ""
                )
                .filter(Boolean)
        )];

    categoryFilter.innerHTML = `
        <option value="all">All Categories</option>

        ${categories
            .map(category => `
                    <option value="${escapeHTML(category)}">
                        ${escapeHTML(category)}
                    </option>
                `)
            .join("")
        }
    `;
}

/* ===============================
   CATEGORY CARDS
================================ */

function initializeCategoryCards() {
    const cards = document.querySelectorAll(".category-card");

    cards.forEach(card => {
        card.addEventListener("click", function (event) {
            event.preventDefault();

            const category = this.dataset.category;

            if (!category || category === "all") {
                window.location.href = "wholesale.html";
                return;
            }

            window.location.href =
                `wholesale.html?category=${encodeURIComponent(category)}`;
        });
    });
}

/* ===============================
   IMAGE HANDLING
================================ */

function getProductImage(product) {
    let image =
        product.ProductImage ||
        product.productImage ||
        product.ImageURL ||
        product.Image ||
        "";

    if (!image) return "";

    image = String(image).trim();

    const driveMatch =
        image.match(/\/d\/([^/]+)/) ||
        image.match(/id=([^&]+)/);

    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    }

    if (image.startsWith("http")) {
        return image;
    }

    return `assets/images/products/${image}`;
}

/* ===============================
   PRODUCT MODAL
================================ */

function openProductModal(productIndex) {
    const product = allProducts[productIndex];

    if (!product) return;

    const modal =
        document.getElementById("productModal");

    if (!modal) {
        alert(product.ProductName || "Product selected.");
        return;
    }

    const image = getProductImage(product);

    setModalImage_("modalProductImage", image);
    setModalText_("modalProductName", product.ProductName || "Unnamed Product");
    setModalText_("modalProductCategory", product.Category || "General");
    setModalText_("modalProductDescription", product.Description || "No description available.");

    const modalPriceBox =
        document.getElementById("modalPriceBox");

    if (modalPriceBox) {
        modalPriceBox.innerHTML = `
            <strong>Wholesale: ₱${formatMoney(product.WholesalePrice || 0)}</strong>

            ${Number(product.PromoPrice || 0) > 0
                ? `<small>Promo: ₱${formatMoney(product.PromoPrice)}</small>`
                : ""
            }
        `;
    }

    renderModalBadges_(product);

    const addToCartBtn =
        document.getElementById("modalAddToCartBtn");

    if (addToCartBtn) {
        addToCartBtn.onclick = function () {
            addProductToCartSafe_(productIndex);
        };
    }

    modal.classList.add("active");
}

function renderModalBadges_(product) {
    const badgeBox =
        document.getElementById("modalBadges");

    if (!badgeBox) return;

    const badges = [];

    if (isYes(product.IsPromo)) badges.push("PROMO");
    if (isYes(product.Featured)) badges.push("FEATURED");
    if (isYes(product.ShowInWholesale)) badges.push("WHOLESALE");

    if (String(product.DiscountLabel || "").trim() !== "") {
        badges.push(product.DiscountLabel);
    }

    badgeBox.innerHTML =
        badges
            .map(badge => `
                <span class="modal-badge">
                    ${escapeHTML(badge)}
                </span>
            `)
            .join("");
}

function closeProductModal() {
    const modal =
        document.getElementById("productModal");

    if (modal) {
        modal.classList.remove("active");
    }
}

window.addEventListener("click", function (event) {
    const modal =
        document.getElementById("productModal");

    if (event.target === modal) {
        closeProductModal();
    }
});

/* ===============================
   REAL ADD TO CART
================================ */

const STORE_CART_KEY_PUBLIC = "mn_store_partner_cart";

function addProductToCartSafe_(productIndex) {
    const product =
        allProducts[productIndex];

    if (!product) return;

    const cart =
        JSON.parse(
            localStorage.getItem(STORE_CART_KEY_PUBLIC)
        ) || [];

    const existingIndex =
        cart.findIndex(item =>
            String(item.productId) ===
            String(product.ProductID)
        );

    const price =
        Number(
            product.PromoPrice ||
            product.WholesalePrice ||
            0
        );

    const cartItem = {
        productId:
            product.ProductID,

        name:
            product.ProductName,

        category:
            product.Category || "",

        image:
            getProductImage(product),

        quantity: 1,

        mode:
            "WHOLESALE",

        price
    };

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }

    localStorage.setItem(
        STORE_CART_KEY_PUBLIC,
        JSON.stringify(cart)
    );

    showCartSuccess_(product.ProductName);
}

/* ===============================
   CART SUCCESS
================================ */

function showCartSuccess_(productName) {
    window.location.href = "cart.html";
}

/* ===============================
   HEADER SEARCH
================================ */

document.addEventListener("DOMContentLoaded", () => {
    const headerSearchInput =
        document.getElementById("headerSearchInput");

    const headerSearchBtn =
        document.getElementById("headerSearchBtn");

    if (headerSearchBtn && headerSearchInput) {
        headerSearchBtn.addEventListener("click", () => {
            applyHeaderSearch();
        });

        headerSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                applyHeaderSearch();
            }
        });
    }
});

function applyHeaderSearch() {
    const headerSearchInput =
        document.getElementById("headerSearchInput");

    const storeSearch =
        document.getElementById("storeSearch");

    if (!headerSearchInput || !storeSearch) return;

    storeSearch.value =
        headerSearchInput.value.trim();

    const productsSection =
        document.getElementById("products");

    if (productsSection) {
        productsSection.scrollIntoView({
            behavior: "smooth"
        });
    }

    visibleCount = 20;
    filterProducts();
}

/* ===============================
   SMALL HELPERS
================================ */

function setModalText_(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.innerText = value || "-";
    }
}

function setModalImage_(id, image) {
    const element =
        document.getElementById(id);

    if (!element) return;

    element.src =
        image || "assets/images/no-image.png";
}

function isYes(value) {
    const normalized =
        String(value || "")
            .toLowerCase()
            .trim();

    return (
        normalized === "yes" ||
        normalized === "true" ||
        normalized === "active" ||
        normalized === "1"
    );
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}