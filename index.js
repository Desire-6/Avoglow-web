import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const track =
document.getElementById("testimonialTrack");

const prevBtn =
document.getElementById("testimonialPrev");

const nextBtn =
document.getElementById("testimonialNext");

let testimonialSlides = [];

let currentSlide = 0;



// ======================================
// LOAD TESTIMONIALS
// ======================================

async function loadTestimonials(){

    try{

        const reviewsRef =
        collection(db,"reviews");

        const q = query(

            reviewsRef,

            where("verified","==",true)

        );

        const snapshot = await getDocs(q);

        let reviews = [];

        snapshot.forEach(doc=>{

            reviews.push(doc.data());

        });

        // Only 4 and 5 stars

        reviews = reviews.filter(review=>{

            return review.rating >= 4;

        });

        // Shuffle

        reviews.sort(()=>Math.random()-0.5);

        // Maximum 6 reviews

        reviews = reviews.slice(0,6);

        buildSlides(reviews);

    }

    catch(error){

        console.error(

            "Failed to load testimonials:",

            error

        );

    }

}



// ======================================
// BUILD SLIDES
// ======================================

function buildSlides(reviews){

    track.innerHTML = "";

    for(let i=0;i<reviews.length;i+=3){

        const group = reviews.slice(i,i+3);

        let slide =

        `<div class="testimonial-slide">`;

        group.forEach(review=>{

            let stars="";

            for(let s=1;s<=5;s++){

                stars +=

                s<=review.rating

                ? "★"

                : "☆";

            }

            slide += `

            <div class="testimonial-card">

                <img

                src="${review.productImage}"

                alt="${review.productName}"

                class="testimonial-product-image">

                <h4>

                    ${review.productName}

                </h4>

                <p>

                    ${review.comment}

                </p>

                <div class="stars">

                    ${stars}

                </div>

                <span class="verified">

                    ✓ Verified Purchase

                </span>

                <h5>

                    ${review.name}

                </h5>

            </div>

            `;

        });

        slide += "</div>";

        track.innerHTML += slide;

    }

    testimonialSlides =

    document.querySelectorAll(

        ".testimonial-slide"

    );

    currentSlide = 0;

    updateTestimonials();

}



// ======================================
// UPDATE SLIDER
// ======================================

function updateTestimonials(){

    if(testimonialSlides.length===0)

        return;

    track.style.transform =

    `translateX(-${currentSlide*100}%)`;

}



// ======================================
// NEXT
// ======================================

function nextSlide(){

    if(testimonialSlides.length<=1)

        return;

    currentSlide++;

    if(currentSlide>=testimonialSlides.length){

        currentSlide=0;

    }

    updateTestimonials();

}



// ======================================
// PREVIOUS
// ======================================

function prevSlide(){

    if(testimonialSlides.length<=1)

        return;

    currentSlide--;

    if(currentSlide<0){

        currentSlide=

        testimonialSlides.length-1;

    }

    updateTestimonials();

}



// ======================================
// BUTTONS
// ======================================

nextBtn.addEventListener(

    "click",

    nextSlide

);

prevBtn.addEventListener(

    "click",

    prevSlide

);



// ======================================
// AUTO SLIDE
// ======================================

setInterval(()=>{

    nextSlide();

},6000);



// ======================================
// START
// ======================================

loadTestimonials();