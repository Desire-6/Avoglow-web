import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

/* =========================
   ELEMENTS
========================= */

const modal = document.getElementById("paymentModal");

const chooseBtn = document.getElementById("choosePaymentBtn");

const changeBtn = document.getElementById("changePaymentBtn");

const closeBtn = document.getElementById("closePaymentModal");

const cancelBtn = document.getElementById("cancelPayment");

const form = document.getElementById("paymentForm");

const savedTitle = document.getElementById("saved-payment-title");

const savedDescription = document.getElementById("saved-payment-description");

const mtnInput = document.getElementById("mtnInput");

const airtelInput = document.getElementById("airtelInput");

const mtnPhone = document.getElementById("mtnPhone");

const airtelPhone = document.getElementById("airtelPhone");

/* =========================
   MODAL
========================= */

chooseBtn.addEventListener("click", () => {

    modal.classList.add("show");

});

changeBtn.addEventListener("click", () => {

    modal.classList.add("show");

});

closeBtn.addEventListener("click", () => {

    modal.classList.remove("show");

});

cancelBtn.addEventListener("click", () => {

    modal.classList.remove("show");

});

window.addEventListener("click", e => {

    if(e.target === modal){

        modal.classList.remove("show");

    }

});

/* =========================
   LOAD PAYMENT
========================= */

async function loadPayment(user){

    const paymentRef = doc(

        db,

        "users",

        user.uid,

        "profile",

        "payment"

    );

    const snap = await getDoc(paymentRef);

    if(!snap.exists()){

        savedTitle.textContent =
        "No payment method selected";

        savedDescription.textContent =
        "Choose how you'd like to pay.";

        chooseBtn.style.display="inline-flex";

        changeBtn.style.display="none";

        return;

    }

    const data = snap.data();

    chooseBtn.style.display="none";

    changeBtn.style.display="inline-flex";

    document
    .querySelectorAll(".payment-option")
    .forEach(card=>card.classList.remove("selected"));

    mtnInput.style.display="none";
    airtelInput.style.display="none";

    if(data.method==="cash"){

        savedTitle.textContent =
        "Cash on Delivery";

        savedDescription.textContent =
        "Pay when your order arrives.";

        document.querySelector(
            "input[value='cash']"
        ).checked=true;

        document
        .querySelector("input[value='cash']")
        .closest(".payment-option")
        .classList.add("selected");

    }

    if(data.method==="mtn"){

        savedTitle.textContent =
        "MTN Mobile Money";

        savedDescription.textContent =
        data.phone;

        document.querySelector(
            "input[value='mtn']"
        ).checked=true;

        document
        .querySelector("input[value='mtn']")
        .closest(".payment-option")
        .classList.add("selected");

        mtnPhone.value=data.phone || "";

    }

    if(data.method==="airtel"){

        savedTitle.textContent =
        "Airtel Money";

        savedDescription.textContent =
        data.phone;

        document.querySelector(
            "input[value='airtel']"
        ).checked=true;

        document
        .querySelector("input[value='airtel']")
        .closest(".payment-option")
        .classList.add("selected");

        airtelPhone.value=data.phone || "";

    }

}

/* =========================
   SAVE PAYMENT
========================= */

form.addEventListener("submit",async(e)=>{

    e.preventDefault();

    const user = auth.currentUser;

    if(!user){

        alert("Please login first.");

        return;

    }

    const method=document.querySelector(

        "input[name='payment']:checked"

    ).value;

    let phone="";

    if(method==="mtn"){

        phone=mtnPhone.value.trim();

        if(phone===""){

            alert("Please enter your MTN number.");

            return;

        }

    }

    if(method==="airtel"){

        phone=airtelPhone.value.trim();

        if(phone===""){

            alert("Please enter your Airtel number.");

            return;

        }

    }

    await setDoc(

        doc(

            db,

            "users",

            user.uid,

            "profile",

            "payment"

        ),

        {

            method,

            phone,

            updatedAt:serverTimestamp()

        }

    );

    modal.classList.remove("show");

    await loadPayment(user);

});

/* =========================
   INIT
========================= */

onAuthStateChanged(auth,user=>{

    if(user){

        loadPayment(user);

    }

});