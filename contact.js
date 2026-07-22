import { auth, db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    createAdminActivity
}
from "./adminActivity.js";

const form = document.getElementById("contactForm");

const sendButton =
document.getElementById("sendMessage");

let currentUser = null;

onAuthStateChanged(auth, (user) => {

    currentUser = user;

});

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    // if (!currentUser) {

    //     alert("Please login before sending a message.");

    //     return;

    // }

    sendButton.disabled = true;

    sendButton.textContent = "Sending...";

    try {

        const messageNumber =
            generateMessageNumber();

        const contactData = {

            messageNumber,

            fullName:
                document.getElementById("fullName").value.trim(),

            email:
                document.getElementById("email").value.trim(),

            phone:
                document.getElementById("phone").value.trim(),

            inquiryType:
                document.getElementById("inquiryType").value,

            message:
                document.getElementById("message").value.trim(),

           userId: currentUser ? currentUser.uid : null,

            status: "New",

            replied: false,

            createdAt:
                serverTimestamp()

        };

        const docRef = await addDoc(

            collection(db, "contactMessages"),

            contactData

        );

        // await createAdminActivity({

        //     type: "contact",

        //     title: "New Contact Message",

        //     description:
        //         `${contactData.fullName} submitted a ${contactData.inquiryType}.`,

        //     userName:
        //         contactData.fullName,

        //     metadata: {

        //         messageId:
        //             docRef.id,

        //         messageNumber:
        //             messageNumber,

        //         email:
        //             contactData.email,

        //         phone:
        //             contactData.phone,

        //         inquiryType:
        //             contactData.inquiryType,

        //         status:
        //             "New"

        //     }

        // });

        showToast(
    "Message Sent",
    "Thank you for contacting Avoglow. We'll get back to you shortly.",
    "success"
);

        form.reset();

    }

    catch (error) {

        console.error(error);

        showToast(
    "Sending Failed",
    "Unable to send your message. Please try again.",
    "error"
);

    }

    finally {

        sendButton.disabled = false;

        sendButton.textContent = "Send Message";

    }

});

function generateMessageNumber() {

    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1)
        .padStart(2, "0");

    const day =
        String(now.getDate())
        .padStart(2, "0");

    const random =
        Math.floor(1000 + Math.random() * 9000);

    return `MSG-${year}${month}${day}-${random}`;

}
function showToast(title, message, type = "success") {

    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");

    let icon = "fa-circle-check";

    if(type === "error"){

        icon = "fa-circle-xmark";

    }

    if(type === "warning"){

        icon = "fa-circle-exclamation";

    }

    toast.className = `contact-toast ${type}`;

    toast.innerHTML = `

        <i class="fas ${icon}"></i>

        <div>

            <h4>${title}</h4>

            <p>${message}</p>

        </div>

    `;

    container.appendChild(toast);

    setTimeout(()=>{

        toast.classList.add("show");

    },50);

    setTimeout(()=>{

        toast.classList.remove("show");

        setTimeout(()=>{

            toast.remove();

        },350);

    },4000);

}