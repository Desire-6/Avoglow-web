import { auth, db } from "../../firebase-config.js";

import {
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    const adminSnap = await getDoc(
        doc(db, "admins", user.uid)
    );

    if (!adminSnap.exists()) {

        await signOut(auth);

        window.location.href = "login.html";

        return;

    }
    const admin = adminSnap.data();

document.getElementById("adminName").textContent =
admin.name;

document.getElementById("adminEmail").textContent =
admin.email;

document.getElementById("adminInitials").textContent =
admin.name
.split(" ")
.map(n=>n[0])
.join("")
.toUpperCase();

    loadDashboard();

});

async function loadDashboard() {

    /* ==========================
       ORDERS
    ========================== */

    const ordersSnapshot =
        await getDocs(collection(db, "orders"));

    let totalOrders = 0;

    let revenue = 0;

    const recentOrders =
        document.getElementById("recentOrders");

    recentOrders.innerHTML = "";

    ordersSnapshot.forEach(orderDoc => {

        const order = orderDoc.data();

        totalOrders++;

        revenue += order.total;

     let badge = "";

switch(order.status){

case "Pending":

badge = "<span class='status pending'>Pending</span>";

break;

case "Ready for Pickup":

badge = "<span class='status ready'>Ready</span>";

break;

case "Out for Delivery":

badge = "<span class='status transit'>Out for Delivery</span>";

break;

case "Completed":

case "Delivered":

badge = "<span class='status delivered'>Delivered</span>";

break;

default:

badge = `<span class='status'>${order.status}</span>`;

}

recentOrders.innerHTML += `

<tr>

<td>${order.orderNumber}</td>

<td>${order.customer.name}</td>

<td>${badge}</td>

<td>UGX ${order.total.toLocaleString()}</td>

</tr>

`;

    });

    document.getElementById("ordersCount").textContent =
        totalOrders;

    document.getElementById("revenue").textContent =
        "UGX " + revenue.toLocaleString();

    /* ==========================
       CUSTOMERS
    ========================== */

    const customersSnapshot =
        await getDocs(collection(db, "users"));

    document.getElementById("customers").textContent =
        customersSnapshot.size;

    /* ==========================
       PRODUCTS
    ========================== */

    const productsSnapshot =
        await getDocs(collection(db, "products"));

    document.getElementById("products").textContent =
        productsSnapshot.size;

}

/* ==========================
   LOGOUT
========================== */

document
.getElementById("logoutBtn")
.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "login.html";

});
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");

if(menuToggle && sidebar){

    menuToggle.onclick = ()=>{

        sidebar.classList.toggle("show");

    };

}