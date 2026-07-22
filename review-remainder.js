import { auth, db } from "./firebase-config.js";

import {

onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {

collection,

query,

where,

getDocs,

doc,

updateDoc,

addDoc,

serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
let pendingReviews = [];

let currentReview = null;

let selectedRating = 0;
async function loadReminderPopup(){

    const response = await fetch("review-remainder.html");

    const html = await response.text();

    document.body.insertAdjacentHTML(

        "beforeend",

        html

    );

}
async function loadPendingReviews(uid){

    const reviewsRef = collection(

        db,

        "users",

        uid,

        "pendingReviews"

    );

    const q = query(

        reviewsRef,

        where("reviewed","==",false),

        where("dismissed","==",false)

    );

    const snapshot = await getDocs(q);

    pendingReviews=[];

    snapshot.forEach(docSnap=>{

        pendingReviews.push({

            id:docSnap.id,

            ...docSnap.data()

        });

    });

if(pendingReviews.length){

    showReminder(pendingReviews[0]);

}

}
onAuthStateChanged(auth,async(user)=>{

    if(!user) return;

    await loadReminderPopup();
    initialiseStars();

    await loadPendingReviews(user.uid);

});
function showReminder(review){

    currentReview = review;

    selectedRating = 0;

    document.getElementById("reviewTitle").value = "";

    document.getElementById("reviewComment").value = "";

    document
    .getElementById("reviewForm")
    .classList.remove("show");

    document
    .getElementById("reviewSuccess")
    .classList.remove("show");

    document.querySelectorAll(".review-stars i").forEach(star=>{

        star.classList.remove("fas","active");

        star.classList.add("far");

    });

    document.getElementById("reviewProductImage").src =
    review.productImage;

    document.getElementById("reviewProductName").textContent =
    review.productName;

    document
    .getElementById("reviewReminder")
    .classList.add("show");

    document.body.style.overflow="hidden";

}
function hideReminder(){

    document
    .getElementById("reviewReminder")
    .classList.remove("show");

    document.body.style.overflow="";

}
document.addEventListener("click",(e)=>{

    if(e.target.closest("#closeReminder")){

        hideReminder();

    }

});
function initialiseStars(){

    const stars = document.querySelectorAll(".review-stars i");

    stars.forEach(star=>{

        star.onclick=()=>{

            selectedRating = Number(star.dataset.rating);

            stars.forEach(s=>{

                if(Number(s.dataset.rating)<=selectedRating){

                    s.classList.remove("far");

                    s.classList.add("fas");

                    s.classList.add("active");

                }

                else{

                    s.classList.remove("fas");

                    s.classList.remove("active");

                    s.classList.add("far");

                }

            });

            document
            .getElementById("reviewForm")
            .classList.add("show");

        };

    });

}
async function dismissReminder(){

    if(!currentReview) return;

    await updateDoc(

        doc(

            db,

            "users",

            auth.currentUser.uid,

            "pendingReviews",

            currentReview.id

        ),

        {

            dismissed:true

        }

    );

    hideReminder();

}
document.addEventListener("click",(e)=>{

    if(e.target.closest("#closeReminder")){

        dismissReminder();

    }

});
document.addEventListener("click", async(e)=>{

    if(!e.target.closest("#submitReview")) return;

    if(selectedRating===0){

        alert("Please select a rating.");

        return;

    }

    const title =
    document.getElementById("reviewTitle").value.trim();

    const comment =
    document.getElementById("reviewComment").value.trim();

    if(comment===""){

        alert("Please write your review.");

        return;

    }

const button = document.getElementById("submitReview");

button.disabled = true;

button.textContent = "Submitting...";

try{

    await addDoc(

        collection(db,"reviews"),

        {

            userId: auth.currentUser.uid,

            productSlug: currentReview.productSlug,

            productName: currentReview.productName,

            productImage: currentReview.productImage,

            title,

            comment,

            rating: selectedRating,

            verified: true,

            name: auth.currentUser.displayName || "Verified Customer",

            date: new Date().toLocaleDateString("en-GB"),

            createdAt: serverTimestamp()

        }

    );

        await updateDoc(

            doc(

                db,

                "users",

                auth.currentUser.uid,

                "pendingReviews",

                currentReview.id

            ),

            {

                reviewed:true

            }

        );
        button.disabled = false;

button.textContent = "Submit Review";

        document
        .getElementById("reviewForm")
        .classList.remove("show");

        document
        .getElementById("reviewSuccess")
        .classList.add("show");

        setTimeout(()=>{

            document
            .getElementById("reviewSuccess")
            .classList.remove("show");

            hideReminder();

pendingReviews = pendingReviews.filter(

review => review.id !== currentReview.id

);

if(pendingReviews.length){

    setTimeout(()=>{

        showReminder(

            pendingReviews[0]

        );

    },500);

}

        },2000);

    }

    catch(error){

        console.error(error);

        alert("Failed to submit review.");

    }

});