import { db } from "./firebase-config.js";

import {
collection,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const params =
new URLSearchParams(window.location.search);

const slug =
params.get("slug");

let productFound = null;

async function loadProduct() {

const querySnapshot =
await getDocs(collection(db, "products"));

querySnapshot.forEach((doc) => {

    const product = doc.data();

    if (product.slug === slug) {

        productFound = product;

    }

});

if (!productFound) {

    document.body.innerHTML =
    "<h1>Product not found</h1>";

    return;

}
/* ==========================
   SAVE RECENTLY VIEWED
========================== */

let viewed =
JSON.parse(localStorage.getItem("recentlyViewed")) || [];

// Remove duplicate if already exists
viewed = viewed.filter(item => item.slug !== productFound.slug);

// Add current product to the beginning
viewed.unshift({

    name: productFound.name,

    category: productFound.category,

    price: productFound.price,

    image: productFound.image,

    link: `product.html?slug=${productFound.slug}`,

    slug: productFound.slug

});

// Keep only the latest 10
viewed = viewed.slice(0,10);

localStorage.setItem(
    "recentlyViewed",
    JSON.stringify(viewed)
);

// IMAGE

document.getElementById(
    "product-image"
).src = productFound.image;

document.getElementById(
    "product-image"
).alt = productFound.name;

document.getElementById(
    "product-image"
).classList.add(
    productFound.imageClass
);

// BASIC INFO

document.getElementById(
    "product-name"
).textContent =
productFound.name;

document.getElementById(
    "product-paragraph"
).textContent =
productFound.paragraph;

document.getElementById(
    "product-price"
).textContent =
`UGX ${productFound.price.toLocaleString()}`;

document.getElementById(
    "product-intro"
).textContent =
productFound.intro;

document.getElementById(
    "product-description"
).textContent =
productFound.description;

// CATEGORY

const categoryElement =
document.getElementById(
    "product-category"
);

if (categoryElement) {

    categoryElement.textContent =
    productFound.category;

}

// BENEFITS

const benefitsList =
document.getElementById(
    "benefits-list"
);

if (benefitsList) {

    benefitsList.innerHTML = "";

    productFound.benefits.forEach(
    (benefit) => {

        benefitsList.innerHTML += `
            <li>${benefit}</li>
        `;

    });

}

// HOW TO USE

const howToUseList =
document.getElementById(
    "how-to-use-list"
);

if (howToUseList) {

    howToUseList.innerHTML = "";

    productFound.howToUse.forEach(
    (step) => {

        howToUseList.innerHTML += `
            <li>${step}</li>
        `;

    });

}

// INGREDIENTS

const ingredientsList =
document.getElementById(
    "ingredients-list"
);

if (ingredientsList) {

    ingredientsList.innerHTML = "";

    productFound.ingredients.forEach(
    (ingredient) => {

        ingredientsList.innerHTML += `
            <li>${ingredient}</li>
        `;

    });

}

// STORY

const storyTitle =
document.getElementById(
    "story-title"
);

const storyText =
document.getElementById(
    "story-text"
);

if (storyTitle) {

    storyTitle.textContent =
    productFound.storyTitle;

}

if (storyText) {

    storyText.textContent =
    productFound.story;

}

// SIZES

const sizesContainer =
document.getElementById(
    "sizes-container"
);

if (
    sizesContainer &&
    productFound.sizes
) {

    sizesContainer.innerHTML = "";

    productFound.sizes.forEach(
    (size, index) => {

        sizesContainer.innerHTML += `

            <button
                class="size-btn ${index === 0 ? "active" : ""}"
                data-price="${size.price}">

                ${size.size}

            </button>

        `;

    });

    const sizeButtons =
    document.querySelectorAll(
        ".size-btn"
    );

    sizeButtons.forEach(
    (button) => {

        button.addEventListener(
        "click",
        () => {

            sizeButtons.forEach(
            (btn) => {

                btn.classList.remove(
                    "active"
                );

            });

            button.classList.add(
                "active"
            );

            const price =
            Number(
                button.dataset.price
            );

            document.getElementById(
                "product-price"
            ).textContent =
            `UGX ${price.toLocaleString()}`;

        });

    });

}
let currentPrice = productFound.price;

const quantityElement =
document.getElementById("quantity");

const minusBtn =
document.getElementById("minus");

const plusBtn =
document.getElementById("plus");

const totalPriceElement =
document.getElementById("total-price");

function updateTotal() {


const quantity =
Number(quantityElement.textContent);

const total =
currentPrice * quantity;

totalPriceElement.textContent =
`UGX ${total.toLocaleString()}`;


}

// Initial total

updateTotal();

// Quantity buttons

plusBtn.addEventListener(
"click",
() => {


quantityElement.textContent =
Number(quantityElement.textContent) + 1;

updateTotal();


});

minusBtn.addEventListener(
"click",
() => {


const quantity =
Number(quantityElement.textContent);

if(quantity > 1){

    quantityElement.textContent =
    quantity - 1;

    updateTotal();

}


});

// Size buttons

const sizeButtons =
document.querySelectorAll(".size-btn");

sizeButtons.forEach(button => {

button.addEventListener(
"click",
() => {

    sizeButtons.forEach(btn => {

        btn.classList.remove(
            "active"
        );

    });

    button.classList.add(
        "active"
    );

    currentPrice =
    Number(
        button.dataset.price
    );

    document.getElementById(
        "product-price"
    ).textContent =
    `UGX ${currentPrice.toLocaleString()}`;

    updateTotal();

});


});
const whatsappBtn =
document.getElementById(
"whatsappOrder"
);

if(whatsappBtn){


whatsappBtn.addEventListener(
"click",
(e) => {

    e.preventDefault();

    const activeSize =
    document.querySelector(
        ".size-btn.active"
    );

    const selectedSize =
    activeSize
    ? activeSize.textContent.trim()
    : productFound.sizes[0].size;

    const selectedPrice =
    activeSize
    ? Number(activeSize.dataset.price)
    : productFound.price;

    const quantity =
    Number(
        document.getElementById(
            "quantity"
        ).textContent
    );

    const total =
    selectedPrice * quantity;

    const message =


`Hello Avoglow,

I would like to order:

Product: ${productFound.name}
Size: ${selectedSize}
Quantity: ${quantity}

Total: UGX ${total.toLocaleString()}

Thank you.`;

    const whatsappUrl =
`https://wa.me/message/QFMWC52VG3R7B1?text=${encodeURIComponent(message)}`;

window.open(
    whatsappUrl,
    "_blank"
);

});


}



// ADD TO CART

const addToCartBtn =
document.getElementById(
    "addToCart"
);

if (addToCartBtn) {

    addToCartBtn.addEventListener(
    "click",
    () => {

        const activeSize =
        document.querySelector(
            ".size-btn.active"
        );

        const selectedSize =
        activeSize
        ? activeSize.textContent.trim()
        : productFound.sizes[0].size;

        const selectedPrice =
        activeSize
        ? Number(
            activeSize.dataset.price
          )
        : productFound.price;

        const quantity =
        Number(
            document.getElementById(
                "quantity"
            ).textContent
        );

        let cart =
        JSON.parse(
            localStorage.getItem(
                "cart"
            )
        ) || [];

        const existingItem =
        cart.find(item =>

            item.name ===
            productFound.name &&

            item.size ===
            selectedSize

        );

        if (existingItem) {

            existingItem.quantity +=
            quantity;

        } else {

            cart.push({

                name:
                productFound.name,

                subtitle:
                productFound.paragraph,

                image:
                productFound.image,

                price:
                selectedPrice,

                size:
                selectedSize,

                quantity:
                quantity,

                slug:
                productFound.slug

            });

        }

     localStorage.setItem(
    "cart",
    JSON.stringify(cart)
);

console.log("Cart saved:", cart);

updateCartBadge();

console.log(
    "Badge now:",
    document.getElementById("cart-count").textContent
);

showToast("Product added successfully");

    });

}
const relatedContainer =
document.getElementById(
    "related-products"
);

if(relatedContainer){

    relatedContainer.innerHTML = "";

    querySnapshot.forEach((doc) => {

        const related =
        doc.data();

        if(
            related.slug !== productFound.slug &&
            related.category === productFound.category
        ){

            relatedContainer.innerHTML += `

                <div class="related-card">

                    <img
                        src="${related.image}"
                        alt="${related.name}">

                    <h3>
                        ${related.name}
                    </h3>

                    <p>
                        ${related.paragraph}
                    </p>

                    <span>
                        UGX ${related.price.toLocaleString()}
                    </span>

                    <a href="product.html?slug=${related.slug}">
                        View Product
                    </a>

                </div>

            `;

        }

    });

}
loadReviews(productFound.slug);

}

loadProduct();


function displayReviews(reviews){

    const container =
    document.getElementById("reviews-container");

    if(!container) return;

    container.innerHTML = "";

    // Statistics
    let totalRating = 0;

    let starsCount = {
        5:0,
        4:0,
        3:0,
        2:0,
        1:0
    };

   reviews
.slice(0,3)
.forEach(review=>{

        totalRating += review.rating;

        starsCount[review.rating]++;

        let stars = "";

        for(let i=1;i<=5;i++){

            stars += i <= review.rating ? "★" : "☆";

        }
container.innerHTML += `

<div class="review-card">

    <div class="review-stars">
        ${stars}
    </div>

    <h3 class="review-title">
        ${review.title}
    </h3>

    <p class="review-comment">
        "${review.comment}"
    </p>

    <div class="review-footer">

        <div>

            <strong>${review.name}</strong>

            <br>

            <span>${review.date}</span>

        </div>

        ${
            review.verified
            ? `<span class="verified">✔ Verified Purchase</span>`
            : ""
        }

    </div>

</div>

`;

    });

    // Average Rating

    const average =
    reviews.length
    ? (totalRating / reviews.length).toFixed(1)
    : "0.0";

    document.getElementById(
        "average-rating"
    ).textContent = average;

    document.getElementById(
        "review-count"
    ).textContent = reviews.length;

    // Average Stars

    const rounded =
    Math.round(Number(average));

    let averageStars = "";

    for(let i=1;i<=5;i++){

        averageStars +=
        i <= rounded
        ? "★"
        : "☆";

    }

    document.getElementById(
        "average-stars"
    ).textContent =
    averageStars;

    // Rating Bars

    for(let i=1;i<=5;i++){

        const percent =
        reviews.length
        ? (starsCount[i] / reviews.length) * 100
        : 0;

        const ids = {

            5:"five-star-bar",
            4:"four-star-bar",
            3:"three-star-bar",
            2:"two-star-bar",
            1:"one-star-bar"

        };

        document.getElementById(
            ids[i]
        ).style.width =
        percent + "%";

    }

}
async function loadReviews(productSlug){

    const reviewsRef = collection(db, "reviews");

    const q = query(
        reviewsRef,
        where("productSlug", "==", productSlug)
    );

    const snapshot = await getDocs(q);

    const reviews = [];

    snapshot.forEach(doc => {

        reviews.push(doc.data());

    });

    const average =
reviews.length
? (
reviews.reduce((sum, review) => sum + review.rating, 0)
/ reviews.length
).toFixed(1)
: "0.0";

document.getElementById("average-rating").textContent =
average;

document.getElementById("review-count").textContent =
reviews.length;

let stars = "";

for(let i = 1; i <= 5; i++){

    stars +=
    i <= Math.round(average)
    ? "★"
    : "☆";

}

document.getElementById("average-stars").textContent =
stars;

document.getElementById("view-all-reviews").href =
`reviews.html?slug=${productSlug}`;
    const seeAll =
document.getElementById(
    "see-all-reviews"
);

if(seeAll){

    seeAll.href =
    `product-reviews.html?slug=${productSlug}`;

}

}
function showToast(message){

    const toast =
    document.getElementById("toast");

    const text =
    document.getElementById("toast-message");

    text.textContent = "✓ " + message;

    toast.classList.add("show");

    setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}

document.getElementById("close-toast")
.addEventListener("click",()=>{

    document
    .getElementById("toast")
    .classList.remove("show");

});