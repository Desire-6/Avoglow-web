
const menuToggle =
document.querySelector(".menu-toggle");

const navLinks =
document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {

    navLinks.classList.toggle("active");

});

window.addEventListener("load", () => {

    const hash = window.location.hash;

    const map = {

        "#hair-care": "hair",
        "#skin-care": "skin",
        "#wellness": "wellness",
        "#gift-sets": "gift",
        "#all-products": "all"

    };

    const filter = map[hash];

    if(!filter) return;

    const btn = document.querySelector(
        `.filter-btn[data-filter="${filter}"]`
    );

    if(btn){

        btn.click();

    }

});

    document
    .querySelectorAll(".product-card")
    .forEach(card => {

        if(
            filter === "all" ||
            card.classList.contains(filter)
        ){

            card.style.display = "block";

        }else{

            card.style.display = "none";

        }

    });


// ELEMENTS
const sizeButtons = document.querySelectorAll(".size-btn");

const priceElement = document.querySelector(".price");

const totalPriceElement =
      document.getElementById("total-price");

const plusBtn =
      document.getElementById("plus");

const minusBtn =
      document.getElementById("minus");

const quantityDisplay =
      document.getElementById("quantity");


// VARIABLES

let quantity = 1;

let currentPrice = 25000;

// FORMAT PRICE
function formatUGX(amount){

    return `UGX ${amount.toLocaleString()}`;

}

// UPDATE TOTAL
function updateTotal(){

    const total =
          currentPrice * quantity;

    totalPriceElement.textContent =
          formatUGX(total);

}


// ==========================
// SIZE SELECTION

sizeButtons.forEach(button => {

    button.addEventListener("click", () => {

        sizeButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");

        currentPrice =
            Number(button.dataset.price);

        priceElement.textContent =
            formatUGX(currentPrice);

        updateTotal();

    });

});


// ==========================
// INCREASE QUANTITY
// ==========================

plusBtn.addEventListener("click", () => {

    quantity++;

    quantityDisplay.textContent =
        quantity;

    updateTotal();

});


// ==========================
// DECREASE QUANTITY
// ==========================

minusBtn.addEventListener("click", () => {

    if(quantity > 1){

        quantity--;

        quantityDisplay.textContent =
            quantity;

        updateTotal();

    }

});


// ==========================
// INITIAL LOAD
// ==========================

updateTotal();
const whatsappBtn =
document.getElementById("whatsappOrder");

whatsappBtn.addEventListener("click", function(e){

    e.preventDefault();

    const productName =
        document.querySelector(".product-details h1").textContent.trim();

    const selectedSize =
        document.querySelector(".size-btn.active").textContent.trim();

    const quantity =
        document.getElementById("quantity").textContent.trim();

    const total =
        document.getElementById("total-price").textContent.trim();

    const message =
`Hello Avoglow 👋

I would like to order:

Product: ${productName}
Size: ${selectedSize}
Quantity: ${quantity}
Total: ${total}

Please share payment and delivery details.

Thank you.`;

    const phone = "256787244223";

    const url =
`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

});
const reviews = [

{
    name:"Sarah K.",
    rating:5,
    text:"After a few weeks of use, my hair felt stronger, softer and noticeably healthier."
},

{
    name:"Brenda N.",
    rating:5,
    text:"My scalp feels moisturized and my hair is healthier than before."
},

{
    name:"Martha A.",
    rating:4,
    text:"Love the natural ingredients and scent. Reduced breakage significantly."
}

];

generateReviews();

function generateReviews(){

    const container =
    document.getElementById("reviews-container");

    container.innerHTML = "";

    let totalRating = 0;

    let starCounts = {
        1:0,
        2:0,
        3:0,
        4:0,
        5:0
    };

    reviews.forEach(review => {

        totalRating += review.rating;

        starCounts[review.rating]++;

        container.innerHTML += `

        <div class="review-card">

            <div class="review-stars">
                ${"★".repeat(review.rating)}
            </div>

            <p>${review.text}</p>

            <h4>${review.name}</h4>

            <span>✔ Verified Purchase</span>

        </div>

        `;

    });

    const average =
    (totalRating/reviews.length).toFixed(1);

    document.getElementById("average-rating")
    .textContent = average;

    document.getElementById("review-count")
    .textContent = reviews.length;

    document.getElementById("average-stars")
    .textContent =
    "★".repeat(Math.round(average)) +
    "☆".repeat(5-Math.round(average));

    updateBar("five-star-bar",starCounts[5]);
    updateBar("four-star-bar",starCounts[4]);
    updateBar("three-star-bar",starCounts[3]);
    updateBar("two-star-bar",starCounts[2]);
    updateBar("one-star-bar",starCounts[1]);

}

function updateBar(id,count){

    const percentage =
    (count/reviews.length)*100;

    document.getElementById(id)
    .style.width = percentage + "%";

}
const reviewsGrid =
document.getElementById("reviews-container");

document.querySelector(".review-arrow.left")
.addEventListener("click", () => {

    reviewsGrid.scrollBy({
        left: -400,
        behavior: "smooth"
    });

});

document.querySelector(".review-arrow.right")
.addEventListener("click", () => {

    reviewsGrid.scrollBy({
        left: 400,
        behavior: "smooth"
    });

});

// document.getElementById("addToCart")
// .addEventListener("click", function(){

   
// const menuToggle =
// document.querySelector(".menu-toggle");

// const navLinks =
// document.querySelector(".nav-links");

// menuToggle.addEventListener("click", () => {

//     navLinks.classList.toggle("active");

// });

// window.addEventListener("load", () => {

//     const hash = window.location.hash;

//     const map = {

//         "#hair-care": "hair",
//         "#skin-care": "skin",
//         "#wellness": "wellness",
//         "#gift-sets": "gift",
//         "#all-products": "all"

//     };

//     const filter = map[hash];

//     if(!filter) return;

//     const btn = document.querySelector(
//         `.filter-btn[data-filter="${filter}"]`
//     );

//     if(btn){

//         btn.click();

//     }

// });

//     document
//     .querySelectorAll(".product-card")
//     .forEach(card => {

//         if(
//             filter === "all" ||
//             card.classList.contains(filter)
//         ){

//             card.style.display = "block";

//         }else{

//             card.style.display = "none";

//         }

//     });


// ELEMENTS

const addToCartBtn =
document.getElementById("addToCart");

if(addToCartBtn){

    addToCartBtn.addEventListener("click", function(){

        const selectedSize =
        document.querySelector(".size-btn.active")
        .textContent.trim();

        const selectedPrice =
        Number(
            document.querySelector(".size-btn.active")
            .dataset.price
        );

        const product = {

            name: "Root & Revive",

            subtitle: "Triple Active Hair Elixir",

            category: "Hair Care",

            image: "Images/root-revive.png",

            size: selectedSize,

            price: selectedPrice,

            quantity: quantity

        };

        let cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];

        cart.push(product);

        localStorage.setItem(
            "cart",
            JSON.stringify(cart)
        );

        alert("Added to Cart!");


    });

}