import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const orderNumber = params.get("order");

if (!orderNumber) {

    window.location.href = "shop.html";

}
function formatDeliveryDate(dateString){

    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB",{

        weekday:"long",

        day:"numeric",

        month:"long"

    });

}

async function loadOrder() {

    const snap = await getDoc(

        doc(db, "orders", orderNumber)

    );

    if (!snap.exists()) {

        alert("Order not found.");

        return;

    }

    const order = snap.data();
    if(order.status === "Completed"){

    document.getElementById("estimatedDate").textContent =
    `Delivered on ${formatDeliveryDate(order.deliveredAt)}`;

}else{

    document.getElementById("estimatedDate").textContent =
    `Delivered between ${formatDeliveryDate(order.estimatedFrom)} and ${formatDeliveryDate(order.estimatedTo)}`;

}
    
    /* =====================
       HEADER
    ===================== */

   document.getElementById("customerName").textContent =
    `Thank you, ${order.customer.name}`;

//    const status =
// document.getElementById("orderStatus");

// status.textContent = order.status;

// status.classList.remove(

//     "pending",
//     "confirmed",
//     "ready"

// );

// switch(order.status){

//     case "Pending":

//         status.classList.add("pending");

//         break;

//     case "Confirmed":

//         status.classList.add("confirmed");

//         break;

//     case "Ready":

//         status.classList.add("ready");

//         break;

// }

    document.getElementById("orderNumber").textContent =
        order.orderNumber;

    /* =====================
       SUMMARY
    ===================== */

   document.getElementById("orderNumber").textContent =
order.orderNumber;

    document.getElementById("itemCount").textContent =
        order.items.length;

    document.getElementById("subtotal").textContent =
        "UGX " + order.subtotal.toLocaleString();

    document.getElementById("deliveryFee").textContent =
        "UGX " + order.deliveryFee.toLocaleString();

    document.getElementById("grandTotal").textContent =
        "UGX " + order.total.toLocaleString();

    /* =====================
       DELIVERY
    ===================== */

    const deliveryTitle =
        order.delivery.homeDelivery
            ? "Home Delivery"
            : "Pickup Station";

    document.getElementById("deliveryMethod").textContent =
        deliveryTitle;

    if (order.delivery.homeDelivery) {

        document.getElementById("deliveryDescription").innerHTML = `
            ${order.address.fullName}<br>
            ${order.address.phone}<br>
            ${order.address.district}<br>
            ${order.address.address}
        `;

    } else {

        document.getElementById("deliveryDescription").innerHTML = `
                Oxepress Office,
                Mega Supermarket Building,
                Opposite Old Taxi Park.
`;

    }

    /* =====================
       PAYMENT
    ===================== */

   document.getElementById("paymentMethod").innerHTML = `

<strong>${order.payment.method}</strong>

`;

    if(order.payment.phone){

    document.getElementById("paymentPhone").textContent =
    order.payment.phone;

}else{

    document.getElementById("paymentPhone").textContent =
    "Pay on Pickup";

}

    document.getElementById("paymentStatus").textContent =
        order.paymentStatus;

    /* =====================
       ITEMS
    ===================== */

    const container =
        document.getElementById("orderedItems");

    container.innerHTML = "";

order.items.forEach(item=>{

    container.innerHTML += `

    <div class="ordered-item">

        <img
            src="${item.image}"
            alt="${item.name}"
        >

        <div class="item-info">

            <h3>${item.name}</h3>

            <p>Size: ${item.size}</p>

            <p>Quantity: ${item.quantity}</p>

        </div>

        <div class="item-price">

            UGX ${(item.price * item.quantity).toLocaleString()}

        </div>

    </div>

    `;

});
}

loadOrder();