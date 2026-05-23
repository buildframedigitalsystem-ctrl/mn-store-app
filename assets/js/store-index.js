async function initializeStoreDashboard_() {

    console.log("M&N Store App Dashboard loaded.");

    const user =
        JSON.parse(localStorage.getItem("mnUser") || "{}");

    const customerId =
        user.CustomerID || "";

    try {

        const response = await fetch(API.BASE_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getStorePartnerSummary",
                customerId: customerId
            })
        });

        const result = await response.json();

        if (!result.success) {

            console.error(result.message);

            return;
        }

        const summary =
            result.summary || {};

        setText_(
            "storeNameText",
            summary.storeName ||
            user.StoreName ||
            "M&N Partner Store"
        );

        setText_(
            "storeTypeText",
            "Account Type: " +
            (
                summary.storeType ||
                user.AccountType ||
                "Wholesale Store"
            )
        );

        setText_(
            "storeStatusText",
            "Status: " +
            (
                summary.status ||
                "ACTIVE"
            )
        );

        setText_(
            "storeBalanceText",
            "Outstanding Balance: ₱" +
            formatMoney_(
                summary.outstandingBalance || 0
            )
        );

        setText_(
            "storeContactText",
            "Contact: " +
            (
                summary.contact ||
                user.ContactNumber ||
                "-"
            )
        );

        setText_(
            "storeAgentText",
            "Assigned Agent: " +
            (
                summary.agent ||
                user.AssignedAgentName ||
                "-"
            )
        );

        /* OPTIONAL EXTRA CARDS */

        setText_(
            "todayOrdersText",
            summary.todayOrders || 0
        );

        setText_(
            "pendingDeliveriesText",
            summary.pendingDeliveries || 0
        );

        setText_(
            "totalPaidText",
            "₱" +
            formatMoney_(
                summary.totalPaid || 0
            )
        );

    } catch (error) {

        console.error(error);

    }
}

function setText_(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.innerText = value;
    }
}

function formatMoney_(value) {
    return Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}