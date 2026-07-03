import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged }
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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
const savedIcon = document.getElementById("saved-payment-icon");

const mtnInput = document.getElementById("mtnInput");
const airtelInput = document.getElementById("airtelInput");

const mtnPhone = document.getElementById("mtnPhone");
const airtelPhone = document.getElementById("airtelPhone");

const paymentCards = document.querySelectorAll(".payment-card");

/* =========================
MODAL
========================= */

chooseBtn.onclick = () => modal.classList.add("show");
changeBtn.onclick = () => modal.classList.add("show");

closeBtn.onclick = () => modal.classList.remove("show");
cancelBtn.onclick = () => modal.classList.remove("show");

window.onclick = (e) => {

    if (e.target === modal) {

        modal.classList.remove("show");

    }

};

/* =========================
PAYMENT CARD SELECTION
========================= */

paymentCards.forEach(card => {

    card.addEventListener("click", () => {

        paymentCards.forEach(c => c.classList.remove("selected"));

        card.classList.add("selected");

        const radio = card.querySelector("input[type='radio']");

        radio.checked = true;

        mtnInput.style.display = "none";
        airtelInput.style.display = "none";

        if (radio.value === "mtn") {

            mtnInput.style.display = "block";

        }

        if (radio.value === "airtel") {

            airtelInput.style.display = "block";

        }

    });

});

/* =========================
LOAD PAYMENT
========================= */

async function loadPayment(user) {

    const paymentRef = doc(
        db,
        "users",
        user.uid,
        "profile",
        "payment"
    );

    const snap = await getDoc(paymentRef);

    paymentCards.forEach(c => c.classList.remove("selected"));

    mtnInput.style.display = "none";
    airtelInput.style.display = "none";

    if (!snap.exists()) {

        savedTitle.textContent = "No payment method selected";

        savedDescription.textContent =
        "Choose how you'd like to pay.";

        savedIcon.innerHTML =
        `<i class="fa-solid fa-wallet"></i>`;

        chooseBtn.style.display = "inline-flex";
        changeBtn.style.display = "none";

        return;

    }

    const data = snap.data();

    chooseBtn.style.display = "none";
    changeBtn.style.display = "inline-flex";

    const radio = document.querySelector(
        `input[name="payment"][value="${data.method}"]`
    );

    if (radio) {

        radio.checked = true;

        radio.closest(".payment-card")
        .classList.add("selected");

    }

    switch (data.method) {

        case "cash":

            savedTitle.textContent = "Cash on Delivery";

            savedDescription.textContent =
            "Pay when your order arrives.";

            savedIcon.innerHTML =
            `<i class="fa-solid fa-money-bill-wave"></i>`;

            break;

        case "mtn":

            savedTitle.textContent = "MTN Mobile Money";

            savedDescription.textContent = data.phone;

            savedIcon.innerHTML =
            `<img src="Images/mtn.png" alt="MTN">`;

            mtnPhone.value = data.phone || "";

            mtnInput.style.display = "block";

            break;

        case "airtel":

            savedTitle.textContent = "Airtel Money";

            savedDescription.textContent = data.phone;

            savedIcon.innerHTML =
            `<img src="Images/airtel.png" alt="Airtel">`;

            airtelPhone.value = data.phone || "";

            airtelInput.style.display = "block";

            break;

    }

}

/* =========================
SAVE PAYMENT
========================= */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {

        alert("Please login first.");

        return;

    }

    const selected = document.querySelector(
        "input[name='payment']:checked"
    );

    if (!selected) {

        alert("Select a payment method.");

        return;

    }

    const method = selected.value;

    let phone = "";

    if (method === "mtn") {

        phone = mtnPhone.value.trim();

        if (!phone) {

            alert("Please enter your MTN number.");

            return;

        }

    }

    if (method === "airtel") {

        phone = airtelPhone.value.trim();

        if (!phone) {

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
            updatedAt: serverTimestamp()
        }

    );

    modal.classList.remove("show");

    await loadPayment(user);

});

/* =========================
INIT
========================= */

onAuthStateChanged(auth, user => {

    if (user) {

        loadPayment(user);

    }

});