import { db } from "./firebase-config.js";
import {

    collection,

    getDocs,

    query,

    where,

    orderBy

}

from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
const counters = document.querySelectorAll(".counter");

let started = false;
let storyInterval = null;

function animateCounters() {

    if (started) return;

    const section = document.querySelector(".impact-stats");

    const sectionTop = section.getBoundingClientRect().top;

    if (sectionTop < window.innerHeight - 100) {

        started = true;

        counters.forEach(counter => {

            const target = Number(counter.dataset.target);

            let current = 0;

            const increment = Math.ceil(target / 100);

            const updateCounter = () => {

                current += increment;

                if (current >= target) {

                    counter.textContent = target.toLocaleString() + "+";

                } else {

                    counter.textContent = current.toLocaleString();

                    requestAnimationFrame(updateCounter);

                }

            };

            updateCounter();

        });

    }

}

window.addEventListener("scroll", animateCounters);

window.addEventListener("load", animateCounters);

let currentSlide = 0;

let slides = [];

function showSlide(index){

    if(slides.length===0) return;

    slides.forEach(slide=>{

        slide.classList.remove("active");

    });

    slides[index].classList.add("active");

}

function changeSlide(direction){

    if(slides.length === 0) return;

    currentSlide += direction;

    if(currentSlide >= slides.length){

        currentSlide = 0;

    }

    if(currentSlide < 0){

        currentSlide = slides.length - 1;

    }

    showSlide(currentSlide);

}

async function loadFarmerStories(){

    const container =
    document.getElementById("farmerStoriesContainer");

    container.innerHTML = "";

    const q = query(

        collection(db,"farmerStories"),

        where("published","==",true),

        orderBy("createdAt","desc")

    );

    const snapshot = await getDocs(q);

    let stories = [];

    snapshot.forEach(doc=>{

        stories.push({

            id: doc.id,

            ...doc.data()

        });

    });

   // Create groups of 3
let slideGroups = [];

    for(let i=0;i<stories.length;i+=3){

       slideGroups.push(
    stories.slice(i,i+3)
);

    }

    slideGroups.forEach((group,index)=>{

        const slide = document.createElement("div");

        slide.className =

            index===0

            ? "slide active"

            : "slide";

        group.forEach(story=>{

            slide.innerHTML += `

                <div class="story-card">

                    <div class="quote">❝</div>

                    <p>${story.story}</p>

                    <h4>${story.farmerName}</h4>

                    <span>

                        Farmer • ${story.location}

                    </span>

                </div>

            `;

        });

        container.appendChild(slide);

    });
    slides = container.querySelectorAll(".slide");

currentSlide = 0;

showSlide(currentSlide);

}
loadFarmerStories().then(() => {

    if(storyInterval){

        clearInterval(storyInterval);

    }

    storyInterval = setInterval(() => {

        changeSlide(1);

    },5000);

});
window.changeSlide = changeSlide;