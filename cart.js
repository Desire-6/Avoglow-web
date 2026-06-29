import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
/* ==========================
   LOAD CART
========================== */

let cart =
JSON.parse(
    localStorage.getItem("cart")
) || [];

/* ==========================
   ELEMENTS
========================== */

const cartItems =
document.getElementById("cart-items");

const emptyCart =
document.getElementById("empty-cart");

const summaryBox =
document.getElementById("summary-box");

const subtotalElement =
document.getElementById("subtotal");

const totalElement =
document.getElementById("total");

const cartCount =
document.getElementById("cart-count");

const checkoutBtn =
document.getElementById("checkout-btn");

/* ==========================
   FORMAT UGX
========================== */

function formatUGX(amount){

    return "UGX " +
    amount.toLocaleString();

}

/* ==========================
   UPDATE CART BADGE
========================== */

function updateCartBadge(){

    let totalItems = 0;

    cart.forEach(item => {

        totalItems += item.quantity;

    });

    if(cartCount){

        cartCount.textContent =
        totalItems;

    }

}

/* ==========================
   SAVE CART
========================== */

function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCartBadge();

    renderCart();

}

/* ==========================
   INCREASE QTY
========================== */

function increaseQty(index){

    cart[index].quantity++;

    saveCart();

}

/* ==========================
   DECREASE QTY
========================== */

function decreaseQty(index){

    if(cart[index].quantity > 1){

        cart[index].quantity--;

    }

    saveCart();

}

/* ==========================
   REMOVE ITEM
========================== */
let removeIndex = null;

function removeItem(index){

    removeIndex = index;

    document
        .getElementById("remove-modal")
        .classList.add("show");

}
/* ==========================
   RENDER CART
========================== */

function renderCart(){

    cartItems.innerHTML = "";

  if(cart.length === 0){

    emptyCart.style.display = "block";

    summaryBox.style.display = "none";

    document
        .querySelector(".cart-layout")
        .classList.add("empty");

    if(checkoutBtn){

        checkoutBtn.disabled = true;

    }

    return;

}

   emptyCart.style.display = "none";

summaryBox.style.display = "block";

document
    .querySelector(".cart-layout")
    .classList.remove("empty");

if(checkoutBtn){

    checkoutBtn.disabled = false;

}

    let subtotal = 0;

    cart.forEach((item,index)=>{

        subtotal +=
        item.price *
        item.quantity;

        cartItems.innerHTML += `

        <div class="cart-item">

            <img src="${item.image}"
                 alt="${item.name}">

            <div class="cart-info">

    <h3>
        ${item.name}
    </h3>
<p class="product-subtitle">

    ${item.subtitle || ""}

</p>

<div class="product-meta">

    <span class="size-tag">

        ${item.size || "50ml"}

    </span>

    <span class="stock-tag">

        ✓ In Stock

    </span>

</div>

    <button
        class="remove-btn"
        onclick="removeItem(${index})">

        <i class="fa-solid fa-trash"></i>

        Remove

    </button>

</div>

            <div class="cart-right">

                <div class="item-price">

                    ${formatUGX(
                        item.price *
                        item.quantity
                    )}

                </div>

                <div class="quantity-controls">

                    <button
                    onclick="decreaseQty(${index})">

                    −

                    </button>

                    <span>

                    ${item.quantity}

                    </span>

                    <button
                    onclick="increaseQty(${index})">

                    +

                    </button>

                </div>

            </div>

        </div>

        `;

    });

   subtotalElement.textContent =
formatUGX(subtotal);

totalElement.textContent =
formatUGX(subtotal);

}

/* ==========================
   INITIAL LOAD
========================== */

updateCartBadge();

renderCart();
function loadRecentlyViewed(){

    const container =
    document.getElementById(
        "recently-viewed-container"
    );

    if(!container) return;

    const viewed =
    JSON.parse(
        localStorage.getItem(
            "recentlyViewed"
        )
    ) || [];

    container.innerHTML = "";

    viewed.forEach(product => {

        container.innerHTML += `

        <div class="recent-card">

            <a href="${product.link}">

                <img src="${product.image}"
                     alt="${product.name}">

            </a>

            <div class="recent-content">

                <h3>${product.name}</h3>

                <p class="recent-category">
                    ${product.category}
                </p>

                <div class="recent-price">
                    UGX ${product.price.toLocaleString()}
                </div>

                <a href="${product.link}">
                    <button class="recent-btn">
                        View Product
                    </button>
                </a>

            </div>

        </div>

        `;

    });

}

loadRecentlyViewed();
const recentContainer =
document.getElementById("recently-viewed-container");

const leftArrow =
document.querySelector(".recent-arrow.left");

const rightArrow =
document.querySelector(".recent-arrow.right");

if(recentContainer){

    rightArrow.addEventListener("click", () => {

        recentContainer.scrollBy({
            left: 350,
            behavior: "smooth"
        });

    });

    leftArrow.addEventListener("click", () => {

        recentContainer.scrollBy({
            left: -350,
            behavior: "smooth"
        });

    });

}
if(checkoutBtn){

    checkoutBtn.addEventListener("click",(e)=>{

        e.preventDefault();

        if(auth.currentUser){

            window.location.href="checkout.html";

        }else{

            localStorage.setItem(
                "redirectAfterLogin",
                "checkout.html"
            );

            window.location.href="login.html";

        }

    });

}

const removeModal =
document.getElementById("remove-modal");

const cancelRemove =
document.getElementById("cancel-remove");

const confirmRemove =
document.getElementById("confirm-remove");

if(cancelRemove){

    cancelRemove.addEventListener("click",()=>{

        removeModal.classList.remove("show");

    });

}

if(confirmRemove){

    confirmRemove.addEventListener("click",()=>{

        if(removeIndex !== null){

            cart.splice(removeIndex,1);

            saveCart();

            removeIndex = null;

        }

        removeModal.classList.remove("show");

        showToast("Product removed successfully");

    });

}

function showToast(message){

    const toast = document.getElementById("toast");

    toast.innerHTML = `✓ ${message}`;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}

/* ==========================
   MAKE FUNCTIONS GLOBAL
========================== */

window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.removeItem = removeItem;