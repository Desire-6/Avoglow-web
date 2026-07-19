import { auth, db } from "../../firebase-config.js";

import {
    signOut
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    requireAdmin
}
from "../../auth-service.js";

import {
    doc,
    updateDoc,
    collection,
    getDoc,
    getDocs,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import { createNotification } from "../../notification.js";
import {
    createAdminActivity
}
from "../../adminActivity.js";

const params = new URLSearchParams(window.location.search);

const orderNumber = params.get("order");
console.log("Order Number:", orderNumber);

let currentOrder = null;

async function checkAdminAccess(){

    try{

        await requireAdmin();

        loadOrder();

    }

    catch(error){

        console.error(error);

        location.href="../../login.html";

    }

}


checkAdminAccess();
async function loadOrder(){

    const orderRef = doc(db,"orders",orderNumber);

    const snap = await getDoc(orderRef);

    if(!snap.exists()){

        alert("Order not found");

        return;

    }

    currentOrder = snap.data();

    document.getElementById("orderNumber").textContent =
        currentOrder.orderNumber;
        if(currentOrder.createdAt){

    document.getElementById("orderDate").textContent =

        "Placed on " +

        currentOrder.createdAt
        .toDate()
        .toLocaleDateString("en-GB",{

            day:"numeric",

            month:"long",

            year:"numeric"

        });

}

    document.getElementById("customerName").textContent =
        currentOrder.customer.name;

    document.getElementById("customerEmail").textContent =
        currentOrder.customer.email;

    document.getElementById("customerPhone").textContent =
        currentOrder.address.phone;

    document.getElementById("deliveryAddress").textContent =

        `${currentOrder.address.address},
         ${currentOrder.address.city},
         ${currentOrder.address.district}`;

    document.getElementById("subtotal").textContent =
        "UGX " + currentOrder.subtotal.toLocaleString();
        document.getElementById("paymentMethod").textContent =

currentOrder.payment.method;

document.getElementById("paymentStatus").textContent =

currentOrder.paymentStatus;

    document.getElementById("deliveryFee").textContent =
        "UGX " + currentOrder.deliveryFee.toLocaleString();

    document.getElementById("total").textContent =
        "UGX " + currentOrder.total.toLocaleString();

    document.getElementById("statusSelect").value =
currentOrder.status;

updateStatusBadge(currentOrder.status);

    loadItems();
    loadTracking();

}
function updateStatusBadge(status){

const badge =
document.getElementById("statusBadge");

badge.textContent = status;

badge.className = "status";

switch(status){

case "Pending":

badge.classList.add("pending");

break;

case "Preparing Order":

badge.classList.add("preparing");

break;

case "Ready for Pickup":

badge.classList.add("pickup");

break;

case "Out for Delivery":

badge.classList.add("delivery");

break;

case "Delivered":

badge.classList.add("delivered");

break;

}

}
function loadItems(){

    const container =
    document.getElementById("orderedItems");

    container.innerHTML="";

    currentOrder.items.forEach(item=>{

        container.innerHTML +=`

        <div class="product-card">

            <img src="../${item.image}">

            <div>

                <h3>${item.name}</h3>

                <p>Size: ${item.size}</p>

                <p>Quantity: ${item.quantity}</p>

                <strong>

                UGX ${item.price.toLocaleString()}

                </strong>

            </div>

        </div>

        `;

    });

}
document.getElementById("logoutBtn")

.onclick = async()=>{

    await signOut(auth);

    location.href="login.html";

};
document.getElementById("updateStatus")
.onclick = async () => {

    const newStatus =
        document
        .getElementById("statusSelect")
        .value;

    const oldStatus =
        currentOrder.status;


    if(newStatus === oldStatus){

        showToast(
            "Status already selected.",
            "",
            "error"
        );

        return;

    }


    const updateButton =
        document
        .getElementById("updateStatus");

    updateButton.disabled = true;


    try {

        // 1. Update the order status
        await updateDoc(

            doc(
                db,
                "orders",
                currentOrder.orderNumber
            ),

            {
                status: newStatus
            }

        );


        // 2. Update tracking stages
        await updateTracking(newStatus);


        // 3. Create admin activity
        await createAdminActivity({

            type: "order",

            title: "Order Status Updated",

            description:

                `Admin changed order
                ${currentOrder.orderNumber}
                from ${oldStatus}
                to ${newStatus}.`,

            userName: "Admin",

            orderNumber:
                currentOrder.orderNumber,

            metadata: {

                customer:
                    currentOrder.customer.name,

                previousStatus:
                    oldStatus,

                newStatus:
                    newStatus

            }

        });


        // 4. Update local order data
        currentOrder.status =
            newStatus;


        // 5. Update badge
        updateStatusBadge(
            newStatus
        );


        // 6. Reload tracking display
        await loadTracking();


        // 7. Notify customer
        await sendCustomerNotification(
            newStatus
        );


        showToast(

            "Success",

            "Order status updated successfully.",

            "success"

        );

    }

    catch(error){

        console.error(

            "Status update failed:",

            error

        );

        showToast(

            "Error",

            "Failed to update order status.",

            "error"

        );

    }

    finally{

        updateButton.disabled = false;

    }

};
async function updateTracking(status){

    const trackingRef =
        collection(

            db,

            "orders",

            currentOrder.orderNumber,

            "tracking"

        );


    const snapshot =
        await getDocs(trackingRef);


    const updates = [];


    snapshot.forEach(docSnap => {

        const stage =
            docSnap.data().stage;


        let complete = false;


        if(status === "Preparing Order"){

            complete =

                stage === "Order Placed" ||

                stage === "Preparing Order";

        }


        else if(
            status === "Ready for Pickup"
        ){

            complete =

                stage === "Order Placed" ||

                stage === "Preparing Order" ||

                stage === "Ready For Pickup";

        }


        else if(
            status === "Out for Delivery"
        ){

            complete =

                stage === "Order Placed" ||

                stage === "Preparing Order" ||

                stage === "Out For Delivery";

        }


        else if(status === "Delivered"){

            complete = true;

        }


        updates.push(

            updateDoc(

                docSnap.ref,

                {

                    completed:
                        complete,

                    date:

                        complete

                        ? serverTimestamp()

                        : null

                }

            )

        );

    });


    await Promise.all(updates);

}
async function loadTracking(){

const container =

document.getElementById("trackingTimeline");

container.innerHTML="";

const tracking =

await getDocs(

collection(

db,

"orders",

currentOrder.orderNumber,

"tracking"

)

);

tracking.forEach(stage=>{

const data = stage.data();

container.innerHTML +=`

<div class="timeline-item">

<div>

<div class="timeline-dot ${data.completed?"complete":""}"></div>

${!stage.docs ? '<div class="timeline-line"></div>' : ""}

</div>

<div class="timeline-content">

<strong>${data.stage}</strong><br>

${data.completed ? "Completed":"Waiting"}

</div>

</div>

`;

});

}
async function sendCustomerNotification(status){

let title="";
let message="";

switch(status){

case "Preparing Order":

title="Preparing your order";

message=`Your order #${currentOrder.orderNumber} is being prepared.`;

break;

case "Ready for Pickup":

title="Ready for Pickup";

message=`Your order #${currentOrder.orderNumber} is ready for pickup.`;

break;

case "Out for Delivery":

title="Out for Delivery";

message=`Your order #${currentOrder.orderNumber} is on the way.`;

break;

case "Delivered":

title="Order Delivered";

message=`Your order #${currentOrder.orderNumber} has been delivered successfully.`;

break;

default:

return;

}

await createNotification(

currentOrder.userId,

title,

message,

"order",

{

page:"orders",

orderNumber:currentOrder.orderNumber,

productName:currentOrder.items[0].name,

productImage:currentOrder.items[0].image,

quantity:currentOrder.items[0].quantity,

totalItems:currentOrder.items.length,

status:status,

estimatedFrom:currentOrder.estimatedFrom,

estimatedTo:currentOrder.estimatedTo

}

);

}
function showToast(title,message,type="success"){

const toast=document.createElement("div");

toast.className=`toast ${type}`;

toast.innerHTML=`

<i class="fas fa-circle-check"></i>

<div>

<h4>${title}</h4>

<p>${message}</p>

</div>

`;

document

.getElementById("toastContainer")

.appendChild(toast);

setTimeout(()=>{

toast.remove();

},4000);

}
/* ===========================
LOGOUT
=========================== */

document.getElementById("logoutBtn")

.onclick=async()=>{

await signOut(auth);

window.location.href="../../login.html";

};