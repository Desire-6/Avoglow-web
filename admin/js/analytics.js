import {auth, db } from "../../firebase-config.js";
import {
    signOut
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {

    collection,
    getDocs,
    query,
    where

} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


import {
    requireAdmin
} from "../../auth-service.js";


/* ==========================================
   GLOBAL VARIABLES
========================================== */

let allOrders = [];

let allCustomers = [];

let filteredOrders = [];

let revenueChart = null;

let ordersChart = null;

let orderStatusChart = null;
let pickupStations = {};


/* ==========================================
   CHECK ADMIN LOGIN
========================================== */

async function checkAdminAccess(){

    try{

        await requireAdmin();

        initialiseAnalytics();

    }

    catch(error){

        console.error(error);

        window.location.href = "../../login.html";

    }

}


checkAdminAccess();


/* ==========================================
   INITIALISE
========================================== */

async function initialiseAnalytics() {

    await loadAnalyticsData();
       await loadOrders();

    await loadCustomers();

    await loadPickupStations();

    updateAnalytics();


    const periodSelect =

        document.getElementById(

            "analyticsPeriod"

        );


    if (periodSelect) {

        periodSelect.addEventListener(

            "change",

            applyAnalyticsPeriod

        );

    }


    const refreshButton =

        document.getElementById(

            "refreshAnalytics"

        );


    if (refreshButton) {

        refreshButton.addEventListener(

            "click",

            async () => {

                await loadAnalyticsData();

            }

        );

    }

}


/* ==========================================
   LOAD ALL DATA
========================================== */

async function loadAnalyticsData() {

    try {

        setText(

            "analyticsRevenue",

            "Loading..."

        );


        setText(

            "analyticsOrders",

            "..."

        );


        setText(

            "averageOrderValue",

            "Loading..."

        );


        setText(

            "analyticsCustomers",

            "..."

        );


        await Promise.all([

            loadOrders(),

            loadCustomers()

        ]);


        applyAnalyticsPeriod();

    }


    catch (error) {

        console.error(

            "Analytics loading error:",

            error

        );

    }

}


/* ==========================================
   LOAD ORDERS
========================================== */

async function loadOrders() {

    const snapshot = await getDocs(

        collection(

            db,

            "orders"

        )

    );


    allOrders = snapshot.docs.map(

        orderDoc => ({

            id: orderDoc.id,

            ...orderDoc.data()

        })

    );

}


/* ==========================================
   LOAD CUSTOMERS
========================================== */

async function loadCustomers() {

    const snapshot = await getDocs(

        collection(

            db,

            "users"

        )

    );


    allCustomers = snapshot.docs.map(

        userDoc => ({

            id: userDoc.id,

            ...userDoc.data()

        })

    );

}


/* ==========================================
   PERIOD FILTER
========================================== */

function applyAnalyticsPeriod() {

    const period = Number(

        document

            .getElementById(

                "analyticsPeriod"

            )

            ?.value || 30

    );


    const startDate = new Date();


    startDate.setDate(

        startDate.getDate() - period

    );


    filteredOrders = allOrders.filter(

        order => {

            const orderDate =

                getOrderDate(order);


            if (!orderDate) {

                return false;

            }


            return orderDate >= startDate;

        }

    );


    updatePeriodLabel(

        period

    );


    updateAnalytics();

}


/* ==========================================
   UPDATE EVERYTHING
========================================== */

function updateAnalytics() {

    updateKeyStatistics();

    updateCustomerStatistics();

    updateRevenueChart();

    updateOrdersChart();

    updateOrderStatusChart();

    updateTopProducts();

    updatePaymentMethods();

    updateDeliveryMethods();

    updatePickupStationAnalytics();

}


/* ==========================================
   KEY STATISTICS
========================================== */

function updateKeyStatistics() {

    const totalRevenue =

        filteredOrders.reduce(

            (total, order) => {

                return total +

                    getOrderTotal(order);

            },

            0

        );


    const totalOrders =

        filteredOrders.length;


    const averageOrderValue =

        totalOrders > 0

            ? totalRevenue /

              totalOrders

            : 0;


    const customersWithOrders =

        new Set(

            filteredOrders

                .map(

                    order =>

                        order.userId

                )

                .filter(Boolean)

        ).size;


    setText(

        "analyticsRevenue",

        formatUGX(

            totalRevenue

        )

    );


    setText(

        "analyticsOrders",

        totalOrders

    );


    setText(

        "averageOrderValue",

        formatUGX(

            averageOrderValue

        )

    );


    setText(

        "analyticsCustomers",

        customersWithOrders

    );


    // Growth will be implemented later

    setText(

        "revenueGrowth",

        "--%"

    );


    setText(

        "ordersGrowth",

        "--%"

    );

}


/* ==========================================
   CUSTOMER ANALYTICS
========================================== */

function updateCustomerStatistics() {

    const customerIds =

        new Set(

            filteredOrders

                .map(

                    order =>

                        order.userId

                )

                .filter(Boolean)

        );


    const period = Number(

        document

            .getElementById(

                "analyticsPeriod"

            )

            ?.value || 30

    );


    const startDate = new Date();


    startDate.setDate(

        startDate.getDate() - period

    );


    const newCustomers =

        allCustomers.filter(

            customer => {

                const date =

                    getCustomerDate(

                        customer

                    );


                return date &&

                    date >= startDate;

            }

        );


    const orderCountByCustomer = {};


    allOrders.forEach(

        order => {

            if (!order.userId) return;


            orderCountByCustomer[

                order.userId

            ] = (

                orderCountByCustomer[

                    order.userId

                ] || 0

            ) + 1;

        }

    );


    const returningCustomers =

        Object.keys(

            orderCountByCustomer

        ).filter(

            userId =>

                orderCountByCustomer[

                    userId

                ] > 1

        ).length;


    const customersWithoutOrders =

        Math.max(

            allCustomers.length -

            customerIds.size,

            0

        );


    setText(

        "newAnalyticsCustomers",

        newCustomers.length

    );


    setText(

        "returningCustomers",

        returningCustomers

    );


    setText(

        "customersWithOrdersAnalytics",

        customerIds.size

    );


    setText(

        "customersWithoutOrders",

        customersWithoutOrders

    );

}


/* ==========================================
   REVENUE CHART
========================================== */

function updateRevenueChart() {

    const canvas =

        document.getElementById(

            "revenueChart"

        );


    if (!canvas) return;


    const grouped = {};


    filteredOrders.forEach(

        order => {

            const date =

                getOrderDate(

                    order

                );


            if (!date) return;


            const key =

                date.toLocaleDateString(

                    "en-GB",

                    {

                        day: "2-digit",

                        month: "short"

                    }

                );


            grouped[key] =

                (

                    grouped[key] || 0

                ) +

                getOrderTotal(

                    order

                );

        }

    );


    const labels =

        Object.keys(

            grouped

        );


    const values =

        labels.map(

            label =>

                grouped[label]

        );


    if (revenueChart) {

        revenueChart.destroy();

    }


    revenueChart = new Chart(

        canvas,

        {

            type: "line",


            data: {

                labels,


                datasets: [

                    {

                        label: "Revenue",

                        data: values,

                        borderColor: "#0d6b38",

                        backgroundColor:

                            "rgba(13, 107, 56, 0.10)",

                        fill: true,

                        tension: 0.4,

                        borderWidth: 2,

                        pointRadius: 3

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                plugins: {

                    legend: {

                        display: false

                    }

                },


                scales: {

                    y: {

                        beginAtZero: true,


                        ticks: {

                            callback: value =>

                                "UGX " +

                                Number(

                                    value

                                ).toLocaleString()

                        }

                    }

                }

            }

        }

    );

}


/* ==========================================
   ORDERS OVER TIME
========================================== */

function updateOrdersChart() {

    const canvas =

        document.getElementById(

            "ordersChart"

        );


    if (!canvas) return;


    const grouped = {};


    filteredOrders.forEach(

        order => {

            const date =

                getOrderDate(

                    order

                );


            if (!date) return;


            const key =

                date.toLocaleDateString(

                    "en-GB",

                    {

                        day: "2-digit",

                        month: "short"

                    }

                );


            grouped[key] =

                (

                    grouped[key] || 0

                ) + 1;

        }

    );


    const labels =

        Object.keys(

            grouped

        );


    const values =

        labels.map(

            label =>

                grouped[label]

        );


    if (ordersChart) {

        ordersChart.destroy();

    }


    ordersChart = new Chart(

        canvas,

        {

            type: "line",


            data: {

                labels,


                datasets: [

                    {

                        label: "Orders",

                        data: values,

                        borderColor: "#1769aa",

                        backgroundColor:

                            "rgba(23, 105, 170, 0.10)",

                        fill: true,

                        tension: 0.4,

                        borderWidth: 2,

                        pointRadius: 3

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,


                plugins: {

                    legend: {

                        display: false

                    }

                },


                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            precision: 0

                        }

                    }

                }

            }

        }

    );

}


/* ==========================================
   ORDER STATUS
========================================== */

function updateOrderStatusChart() {

    const canvas =

        document.getElementById(

            "orderStatusChart"

        );


    const legend =

        document.getElementById(

            "orderStatusLegend"

        );


    if (!canvas) return;


    const statusCounts = {};


    filteredOrders.forEach(

        order => {

            const status =

                order.status ||

                "Pending";


            statusCounts[status] =

                (

                    statusCounts[status] ||

                    0

                ) + 1;

        }

    );


    const labels =

        Object.keys(

            statusCounts

        );


    const values =

        labels.map(

            status =>

                statusCounts[status]

        );


    if (orderStatusChart) {

        orderStatusChart.destroy();

    }


    orderStatusChart = new Chart(

        canvas,

        {

            type: "doughnut",


            data: {

                labels,


                datasets: [

                    {

                        data: values

                    }

                ]

            },


            options: {

                responsive: true,

                maintainAspectRatio: false,

                cutout: "68%",


                plugins: {

                    legend: {

                        display: false

                    }

                }

            }

        }

    );


    if (legend) {

        legend.innerHTML = "";


        labels.forEach(

            (label, index) => {

                legend.innerHTML += `

                    <div class="chart-legend-item">

                        <span>

                            <span class="legend-dot"></span>

                            ${label}

                        </span>


                        <strong>

                            ${values[index]}

                        </strong>

                    </div>

                `;

        });

    }

}
function getAdminImagePath(imagePath){

    if(!imagePath){

        return "../Images/product-placeholder.png";

    }

    // Remove any leading slash
    imagePath = imagePath.replace(/^\/+/, "");

    // If the path already starts with Images/
    if(imagePath.startsWith("Images/")){

        return "../" + imagePath;

    }

    return "../Images/" + imagePath;

}


/* ==========================================
   TOP PRODUCTS
========================================== */

function updateTopProducts(){

    const container =
        document.getElementById("topProductsList");

    if(!container) return;

    /*
    Use the orders that are already loaded
    and filtered according to the selected period.
    */

    const orders = filteredOrders || [];

    const productMap = {};

    orders.forEach(order => {

        const items = order.items || [];

        items.forEach(item => {

            const productName =
                item.name || "Unknown Product";

            if(!productMap[productName]){

                productMap[productName] = {

                    name: productName,

                    quantity: 0,

                    revenue: 0,

                    image: item.image || ""

                };

            }

            const quantity =
                Number(item.quantity || 0);

            const price =
                Number(item.price || 0);

            productMap[productName].quantity += quantity;

            productMap[productName].revenue +=

                quantity * price;

        });

    });

    const topProducts =

        Object.values(productMap)

        .sort(

            (a,b) =>

                b.quantity - a.quantity

        )

        .slice(0,5);

    if(!topProducts.length){

        container.innerHTML = `

            <div class="analytics-empty">

                No product sales data available.

            </div>

        `;

        return;

    }

    container.innerHTML =

        topProducts.map(product => {

            const imagePath =

                getAdminImagePath(

                    product.image

                );

            return `

                <div class="top-product-item">

                    <img

                        src="${imagePath}"

                        alt="${product.name}"

                        onerror="

                        this.src=

                        '../Images/product-placeholder.png'

                        "

                    >

                    <div

                        class="top-product-info">

                        <strong>

                            ${product.name}

                        </strong>

                        <span>

                            ${product.quantity}

                            units sold

                        </span>

                    </div>

                    <strong

                        class="top-product-revenue">

                        UGX ${

                            product.revenue

                            .toLocaleString()

                        }

                    </strong>

                </div>

            `;

        })

        .join("");

}
/* ==========================================
   DELIVERY METHODS
========================================== */

function updateDeliveryMethods(){

    const container =
        document.getElementById(
            "deliveryMethodsList"
        );

    if(!container) return;

    const deliveryCounts = {};

    filteredOrders.forEach(order => {

        const method =

            order.delivery?.method ||

            "Unknown";

        const label =

            method === "pickup"

            ?

            "Pickup Station"

            :

            method === "home"

            ?

            "Home Delivery"

            :

            method;

        deliveryCounts[label] =

            (deliveryCounts[label] || 0) + 1;

    });

    const deliveries =

        Object.entries(deliveryCounts)

        .sort((a,b) => b[1] - a[1]);

    if(!deliveries.length){

        container.innerHTML = `

            <div class="analytics-empty">

                No delivery data available.

            </div>

        `;

        return;

    }

    const totalOrders = filteredOrders.length;

    container.innerHTML = deliveries.map(

        ([method, count]) => {

            const percentage =

                Math.round(

                    (count / totalOrders) * 100

                );

            return `

                <div class="breakdown-item">

                    <div class="breakdown-info">

                        <strong>

                            ${method}

                        </strong>

                        <span>

                            ${count} order${

                                count === 1

                                ? ""

                                : "s"

                            }

                        </span>

                    </div>

                    <div class="breakdown-bar">

                        <span

                            style="width:${percentage}%">

                        </span>

                    </div>

                    <strong

                        class="breakdown-percentage">

                        ${percentage}%

                    </strong>

                </div>

            `;

        }

    ).join("");

}


/* ==========================================
   PICKUP STATION PERFORMANCE
========================================== */

function updatePickupStationAnalytics(){

    const container =
        document.getElementById(
            "pickupStationsList"
        );

    if(!container) return;

    const station =
        pickupStations["main"];

    if(!station){

        container.innerHTML = `

            <div class="analytics-empty">

                No pickup stations found.

            </div>

        `;

        return;

    }

    // Use your actual current-period orders
    const orders = filteredOrders || [];

    const pickupOrders = orders.filter(order => {

        return order.delivery?.method === "pickup";

    });

    const pickupRevenue = pickupOrders.reduce(

        (total, order) => {

            return total +

                Number(order.total || 0);

        },

        0

    );

    container.innerHTML = `

        <div class="pickup-station-analytics-card">

            <div class="pickup-station-icon">

                <i class="fa-solid fa-location-dot"></i>

            </div>

            <div class="pickup-station-details">

                <h3>

                    ${station.name}

                </h3>

                <p>

                    ${station.building || ""}

                </p>

                <span>

                    <i class="fa-solid fa-location-dot"></i>

                    ${station.landmark || ""}

                </span>

                <small>

                    ${station.city || ""},

                    ${station.district || ""}

                </small>

            </div>


        </div>

    `;

}

/* ==========================================
   GET PICKUP STATION
========================================== */

function getPickupStation(order) {

    return (

        order.delivery?.pickupStationName ||

        order.delivery?.pickupStation ||

        order.pickupStation ||

        order.address?.address ||

        "Unknown Pickup Station"

    );

}


/* ==========================================
   BREAKDOWN LIST
========================================== */

function renderBreakdownList(

    container,

    data,

    icon

) {

    const entries =

        Object.entries(

            data

        )

        .sort(

            (a, b) =>

                b[1] -

                a[1]

        );


    if (entries.length === 0) {

        container.innerHTML = `

            <p class="analytics-loading">

                No data available.

            </p>

        `;

        return;

    }


    const total =

        entries.reduce(

            (sum, item) =>

                sum + item[1],

            0

        );


    container.innerHTML =

        entries

            .map(

                ([name, count]) => {

                    const percentage =

                        total > 0

                            ? Math.round(

                                (

                                    count /

                                    total

                                ) * 100

                            )

                            : 0;


                    return `

                        <div class="breakdown-item">

                            <div class="breakdown-icon">

                                <i class="${icon}"></i>

                            </div>


                            <div class="breakdown-info">

                                <strong>

                                    ${name}

                                </strong>


                                <span>

                                    ${count}

                                    order${

                                        count === 1

                                            ? ""

                                            : "s"

                                    }

                                </span>

                            </div>


                            <div class="breakdown-value">

                                ${percentage}%

                            </div>

                        </div>

                    `;

                }

            )

            .join("");

}


/* ==========================================
   ORDER DATE
========================================== */

function getOrderDate(order) {

    if (!order.createdAt) {

        return null;

    }


    if (

        typeof order.createdAt.toDate ===

        "function"

    ) {

        return order.createdAt.toDate();

    }


    return null;

}


/* ==========================================
   CUSTOMER DATE
========================================== */

function getCustomerDate(customer) {

    if (!customer.createdAt) {

        return null;

    }


    if (

        typeof customer.createdAt.toDate ===

        "function"

    ) {

        return customer.createdAt.toDate();

    }


    return null;

}


/* ==========================================
   ORDER TOTAL
========================================== */

function getOrderTotal(order) {

    return Number(

        order.total || 0

    );

}


/* ==========================================
   FORMAT UGX
========================================== */

function formatUGX(amount) {

    return (

        "UGX " +

        Number(

            amount || 0

        ).toLocaleString()

    );

}


/* ==========================================
   SET TEXT
========================================== */

function setText(

    id,

    value

) {

    const element =

        document.getElementById(

            id

        );


    if (element) {

        element.textContent = value;

    }

}


/* ==========================================
   PERIOD LABEL
========================================== */

function updatePeriodLabel(period) {

    let label =

        "Last 30 Days";


    if (period === 7) {

        label = "Last 7 Days";

    }


    if (period === 90) {

        label = "Last 3 Months";

    }


    if (period === 365) {

        label = "This Year";

    }


    setText(

        "revenuePeriodLabel",

        label

    );

}
async function loadPickupStations(){

    const snapshot = await getDocs(

        collection(db, "pickupStations")

    );

    pickupStations = {};

    snapshot.forEach(stationDoc => {

        pickupStations[stationDoc.id] = {

            id: stationDoc.id,

            ...stationDoc.data()

        };

    });

}
function getPickupStationName(){

    const station = pickupStations["main"];

    if(!station){

        return "No pickup station";

    }

    return station.name;

}
function updatePaymentMethods(){

    const container =
        document.getElementById("paymentMethodsList");

    if(!container) return;

    const paymentCounts = {};

    filteredOrders.forEach(order => {

        const method =
            order.payment?.method ||
            "Unknown";

        paymentCounts[method] =

            (paymentCounts[method] || 0) + 1;

    });

    const payments =

        Object.entries(paymentCounts)

        .sort((a,b) => b[1] - a[1]);

    if(!payments.length){

        container.innerHTML = `

            <div class="analytics-empty">

                No payment data available.

            </div>

        `;

        return;

    }

    const totalOrders = filteredOrders.length;

    container.innerHTML = payments.map(

        ([method, count]) => {

            const percentage =

                totalOrders > 0

                ?

                Math.round(

                    (count / totalOrders) * 100

                )

                :

                0;

            return `

                <div class="breakdown-item">

                    <div class="breakdown-info">

                        <strong>

                            ${method}

                        </strong>

                        <span>

                            ${count} order${

                                count === 1

                                ? ""

                                : "s"

                            }

                        </span>

                    </div>

                    <div class="breakdown-bar">

                        <span

                            style="width:${percentage}%">

                        </span>

                    </div>

                    <strong class="breakdown-percentage">

                        ${percentage}%

                    </strong>

                </div>

            `;

        }

    ).join("");

}
/* ===========================
LOGOUT
=========================== */

document.getElementById("logoutBtn")

.onclick=async()=>{

await signOut(auth);

 window.location.href = "../login.html";

};
