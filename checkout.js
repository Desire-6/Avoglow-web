import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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

/* ==========================
   LOAD CART
========================== */

async function loadCart(){

    cart = [];

    const user = auth.currentUser;

    if(user){

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

    let fee = 5000;

    if(deliveryOption){

        fee =

        deliveryOption.value==="express"

        ?

        10000

        :

        5000;

    }

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
   PAYMENT METHOD
========================== */

const mtnBox =
document.getElementById("mtnBox");

const airtelBox =
document.getElementById("airtelBox");

document

.querySelectorAll("input[name='payment']")

.forEach(option=>{

    option.addEventListener("change",()=>{

        mtnBox.style.display="none";

        airtelBox.style.display="none";

        if(option.checked){

            if(option.value==="mtn"){

                mtnBox.style.display="block";

            }

            if(option.value==="airtel"){

                airtelBox.style.display="block";

            }

        }

    });

});

/* ==========================
   PLACE ORDER
========================== */

document

.getElementById("placeOrder")

.addEventListener("click",()=>{

    alert(

        "Order placement will be implemented next."

    );

});

/* ==========================
   INIT
========================== */

onAuthStateChanged(auth,()=>{

    loadCart();

});