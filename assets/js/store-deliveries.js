/* =========================================
   STORE DELIVERIES MODULE
   BuildFrame Store OS
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Store Deliveries Module Loaded"
        );

        initializeStoreDeliveries_();

    }
);

/* =========================================
   INITIALIZE
========================================= */

async function initializeStoreDeliveries_() {

    try {

        const user =
            JSON.parse(
                localStorage.getItem("mnUser") || "{}"
            );

        const customerId =
            user.CustomerID || "";

        if (!customerId) {

            console.warn(
                "Customer ID missing."
            );

            return;
        }

        setText_(
            "deliveryStoreName",
            user.StoreName ||
            "M&N Partner Store"
        );

        loadDeliveryRecords_(customerId);

    } catch (error) {

        console.error(error);

    }
}

/* =========================================
   LOAD DELIVERY RECORDS
========================================= */

async function loadDeliveryRecords_(customerId) {

    const tbody =
        document.getElementById(
            "deliveriesTableBody"
        );

    if (!tbody) return;

    try {

        const response =
            await fetch(API.BASE_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "getStoreOrders",
                    storeId: customerId
                })
            });

        const result =
            await response.json();

        if (!result.success) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Failed to load deliveries.
                    </td>
                </tr>
            `;

            return;
        }

        const rows =
            result.rows || [];

        if (!rows.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No deliveries yet.
                    </td>
                </tr>
            `;

            return;
        }

        let pending = 0;
        let transit = 0;
        let completed = 0;

        tbody.innerHTML =
            rows.map(order => {

                const deliveryStatus =
                    String(
                        order.DeliveryStatus ||
                        "Pending"
                    );

                const paymentStatus =
                    String(
                        order.PaymentStatus ||
                        "Unpaid"
                    );

                const upperStatus =
                    deliveryStatus
                        .trim()
                        .toUpperCase();

                if (
                    upperStatus === "PENDING"
                ) {
                    pending++;
                }

                if (
                    upperStatus === "IN TRANSIT"
                ) {
                    transit++;
                }

                if (
                    upperStatus === "DELIVERED"
                ) {
                    completed++;
                }

                return `
                    <tr>

                        <td>
                            ${order.InvoiceID || "-"}
                        </td>

                        <td>
                            ${formatDate_(
                    order.OrderDate
                )}
                        </td>

                        <td>
                            <span class="delivery-status-badge">
                                ${deliveryStatus}
                            </span>
                        </td>

                        <td>
                            ${paymentStatus}
                        </td>

                        <td>
                            ₱${formatMoney_(
                    order.TotalAmount || 0
                )}
                        </td>

                    </tr>
                `;
            }).join("");

        /* =========================================
           UPDATE DASHBOARD
        ========================================= */

        setText_(
            "pendingDeliveriesText",
            "Pending Deliveries: " + pending
        );

        setText_(
            "pendingDeliveryCard",
            pending + " pending deliveries."
        );

        setText_(
            "inTransitDeliveryCard",
            transit + " deliveries on the way."
        );

        setText_(
            "completedDeliveryCard",
            completed + " completed deliveries."
        );

        setText_(
            "deliveryLastUpdatedText",
            "Last Updated: " +
            new Date().toLocaleString()
        );

    } catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    Connection error.
                </td>
            </tr>
        `;
    }
}

/* =========================================
   HELPERS
========================================= */

function setText_(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.innerText = value;
    }
}

function formatMoney_(value) {

    return Number(value || 0)
        .toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}

function formatDate_(value) {

    if (!value) return "-";

    try {

        return new Date(value)
            .toLocaleDateString(
                "en-PH",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

    } catch (error) {

        return "-";
    }
}