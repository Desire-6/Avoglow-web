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

function removeItem(index){

    cart.splice(index,1);

    saveCart();

}

/* ==========================
   RENDER CART
========================== */

function renderCart(){

    cartItems.innerHTML = "";

    if(cart.length === 0){

        emptyCart.style.display = "block";

        summaryBox.style.display = "none";

        return;

    }

    emptyCart.style.display = "none";

    summaryBox.style.display = "block";

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

const checkoutBtn =
document.getElementById("checkout-btn");

if(checkoutBtn){

    checkoutBtn.textContent =
    `Checkout (${formatUGX(subtotal)})`;

}

}

/* ==========================
   INITIAL LOAD
========================== */

updateCartBadge();

renderCart();