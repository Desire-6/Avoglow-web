import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { placeOrder } from "./orders.js";
/* ==========================
   GLOBALS
========================== */

let cart = [];

let expanded = false;

/* ==========================
   ELEMENTS
========================== */

const productsContainer =
document.getElementById("checkout-products");

const subtotal =
document.getElementById("subtotal");

const deliveryFee =
document.getElementById("deliveryFee");

const grandTotal =
document.getElementById("grandTotal");

const itemCount =
document.getElementById("item-count");

const viewMoreBtn =
document.getElementById("toggleProducts");

/* ==========================
   FORMAT MONEY
========================== */

function formatUGX(value){

    return "UGX " + Number(value).toLocaleString();

}
async function mergeGuestCart(user){

    const guestCart =
    JSON.parse(localStorage.getItem("cart")) || [];

    if(guestCart.length === 0) return;

    for(const item of guestCart){

        const id =
        (item.slug || item.name) + "_" + (item.size || "default");

        const cartRef = doc(
            db,
            "users",
            user.uid,
            "cart",
            id
        );

        const existing = await getDoc(cartRef);

        if(existing.exists()){

            const data = existing.data();

            item.quantity += data.quantity;

        }

        await setDoc(cartRef,item);

    }

    localStorage.removeItem("cart");

}

/* ==========================
   LOAD CART
========================== */

async function loadCart(){

    cart = [];

    const user = auth.currentUser;
if(user){

    await mergeGuestCart(user);
    updateCartBadge();

    const snapshot = await getDocs(

            collection(

                db,

                "users",

                user.uid,

                "cart"

            )

        );

        snapshot.forEach(doc=>{

            cart.push(doc.data());

        });

    }

    else{

        cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    }

    renderSummary();

}

/* ==========================
   RENDER SUMMARY
========================== */

function renderSummary(){

    productsContainer.innerHTML = "";

    let subtotalAmount = 0;

    cart.forEach(item=>{

        subtotalAmount +=
        item.price * item.quantity;

    });

    itemCount.textContent =
    `${cart.length} Item${cart.length===1?"":"s"}`;

  const visibleProducts =

expanded ?

cart

:

cart.slice(0,2);

    visibleProducts.forEach(item=>{

        productsContainer.innerHTML += `

        <div class="summary-product">

            <img
                src="${item.image}"
                alt="${item.name}">

            <div class="summary-product-info">

                <h4>

                    ${item.name}

                </h4>

                <p>

                    ${item.size || ""}

                </p>

                <p>

                    Qty: ${item.quantity}

                </p>

            </div>

            <div class="summary-product-price">

                ${formatUGX(item.price * item.quantity)}

            </div>

        </div>

        `;

    });

    subtotal.textContent =
    formatUGX(subtotalAmount);

    updateTotals(subtotalAmount);

if(cart.length <=2){

    viewMoreBtn.style.display="none";

}

else{

    viewMoreBtn.style.display = "block";

    viewMoreBtn.innerHTML =

        expanded

        ?

        '<i class="fas fa-chevron-up"></i> View Less'

        :

        `<i class="fas fa-chevron-down"></i> View ${cart.length-2} More`;

}

}

/* ==========================
   TOTALS
========================== */

function updateTotals(sub){

    const deliveryOption =
    document.querySelector(
        "input[name='delivery']:checked"
    );

    // Standard transport fee
    const fee = 5000;

    deliveryFee.textContent =
    formatUGX(fee);

    grandTotal.textContent =
    formatUGX(sub + fee);

}

/* ==========================
   VIEW MORE
========================== */

viewMoreBtn.addEventListener("click",()=>{

    expanded = !expanded;

    renderSummary();

});

/* ==========================
   DELIVERY METHOD
========================== */

document

.querySelectorAll("input[name='delivery']")

.forEach(option=>{

    option.addEventListener("change",()=>{

        let subtotalAmount = 0;

        cart.forEach(item=>{

            subtotalAmount +=

            item.price * item.quantity;

        });

        updateTotals(subtotalAmount);

    });

});

/* ==========================
   PLACE ORDER
========================== */

document
.getElementById("placeOrder")
.addEventListener("click", async ()=>{

    // Address
    const addressSaved =
    document.getElementById("saved-name");

    if(!addressSaved || addressSaved.textContent === "No address saved"){
        showToast("Please add a delivery address first.");

        return;

    }

    // Payment
    const paymentSaved =
    document.getElementById("saved-payment-title");

    if(!paymentSaved ||
       paymentSaved.textContent === "No payment method selected"){

        showToast("Please choose a payment method.");

        return;

    }

    // Delivery
    const deliverySelected =
    document.querySelector(
        "input[name='delivery']:checked"
    );

    if(!deliverySelected){

       showToast("Please select a delivery method.");

        return;

    }

   // Everything complete
try{

    await placeOrder();

}

catch(error){

    console.error(error);

    showToast(error.message);

}

});

/* ==========================
   INIT
========================== */

onAuthStateChanged(auth,()=>{

    loadCart();

});
/* ==========================
   TOAST
========================== */

function showToast(message){

    const toast =
    document.getElementById("toast");

    const text =
    document.getElementById("toast-message");

    text.textContent = message;

    toast.classList.remove("hidden");

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

        toast.classList.add("hidden");

    },3000);

}