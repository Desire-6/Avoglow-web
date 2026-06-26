import { db } from "./firebase-config.js";

import {
collection,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
const params = new URLSearchParams(window.location.search);

const productSlug = params.get("slug");
let currentPage = 1;
const reviewsPerPage = 10;
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

    displayReviews(reviews);

}
function displayReviews(reviews){

    const container = document.getElementById("reviews-container");

    if(!container) return;

    container.innerHTML = "";

    let totalRating = 0;

    let starsCount = {
        5:0,
        4:0,
        3:0,
        2:0,
        1:0
    };

    // Sort newest first

    reviews.sort((a,b)=>{

        return new Date(b.date) - new Date(a.date);

    });

    reviews.forEach(review=>{

        totalRating += review.rating;

        starsCount[review.rating]++;

    });

    // =====================
    // SUMMARY
    // =====================

    const average = reviews.length
        ? (totalRating / reviews.length).toFixed(1)
        : "0.0";

    document.getElementById("average-rating").textContent = average;

    document.getElementById("review-count").textContent = reviews.length;

    document.getElementById("review-count-text").textContent = reviews.length;

    document.getElementById("product-review-count").textContent = reviews.length;

    // Average stars

    const rounded = Math.round(Number(average));

    let averageStars = "";

    for(let i=1;i<=5;i++){

        averageStars += i<=rounded ? "★" : "☆";

    }

    document.getElementById("average-stars").textContent = averageStars;

    // Rating bars

    const ids={

        5:"five-star-bar",
        4:"four-star-bar",
        3:"three-star-bar",
        2:"two-star-bar",
        1:"one-star-bar"

    };

    const countIds={

        5:"five-star-count",
        4:"four-star-count",
        3:"three-star-count",
        2:"two-star-count",
        1:"one-star-count"

    };

    for(let i=5;i>=1;i--){

        const percent = reviews.length
            ? (starsCount[i]/reviews.length)*100
            : 0;

        document.getElementById(ids[i]).style.width = percent+"%";

        document.getElementById(countIds[i]).textContent =
            "(" + starsCount[i] + ")";

    }

    // =====================
    // REVIEWS
    // =====================
// Total pages
const totalPages = Math.ceil(reviews.length / reviewsPerPage);

// Make sure page is valid
if (currentPage > totalPages) currentPage = totalPages || 1;

// Reviews to display
const start = (currentPage - 1) * reviewsPerPage;
const end = start + reviewsPerPage;

const pageReviews = reviews.slice(start, end);

pageReviews.forEach(review => {

    let stars = "";

    for (let i = 1; i <= 5; i++) {
        stars += i <= review.rating ? "★" : "☆";
    }

    container.innerHTML += `

    <div class="review-item">

        <div class="review-top">

            <div class="review-stars">
                ${stars}
            </div>

            ${
                review.verified
                ? `<div class="verified">
                        ✓ Verified Purchase
                   </div>`
                : ""
            }

        </div>

        <h3 class="review-title">
            ${review.title}
        </h3>

        <p class="review-comment">
            ${review.comment}
        </p>

        <div class="review-footer">

            <div class="review-user">

                <span>${review.date}</span>

                <span>by ${review.name}</span>

            </div>

        </div>

    </div>

    `;

});
const pageNumber = document.getElementById("pageNumber");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");

pageNumber.textContent = currentPage;

prevBtn.disabled = currentPage === 1;
nextBtn.disabled = currentPage === totalPages || totalPages === 0;

prevBtn.onclick = () => {

    if (currentPage > 1) {

        currentPage--;

        displayReviews(reviews);

    }

};

nextBtn.onclick = () => {

    if (currentPage < totalPages) {

        currentPage++;

        displayReviews(reviews);

    }

};

}
loadReviews(productSlug);
loadReviews(productSlug);

// =======================
// Back button
// =======================

const backBtn = document.getElementById("backToProduct");

if (backBtn) {

    backBtn.addEventListener("click", () => {

        window.location.href = `product.html?slug=${productSlug}`;

    });

}