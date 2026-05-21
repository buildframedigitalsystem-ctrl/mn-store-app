/* =========================================
   M&N STORE APP DASHBOARD
   BuildFrame Store OS
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeStoreDashboard_();
});

function initializeStoreDashboard_() {
    console.log("M&N Store App Dashboard loaded.");

    const user =
        JSON.parse(localStorage.getItem("mnUser") || "{}");

    const storeData = {
        name:
            user.StoreName ||
            user.BusinessName ||
            user.Name ||
            "M&N Partner Store",

        type:
            user.AccountType ||
            user.StoreType ||
            "Wholesale Store",

        status:
            user.Status ||
            "Active",

        balance:
            user.OutstandingBalance ||
            0,

        contact:
            user.ContactNumber ||
            user.Phone ||
            "-",

        agent:
            user.AssignedAgentName ||
            user.AgentName ||
            "-"
    };

    setText_("storeNameText", storeData.name);
    setText_("storeTypeText", "Account Type: " + storeData.type);
    setText_("storeStatusText", "Status: " + storeData.status);
    setText_("storeBalanceText", "Outstanding Balance: ₱" + formatMoney_(storeData.balance));
    setText_("storeContactText", "Contact: " + storeData.contact);
    setText_("storeAgentText", "Assigned Agent: " + storeData.agent);
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