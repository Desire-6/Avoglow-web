import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

/* ==========================
   SHOW CACHED BADGE FIRST
========================== */

const cachedCount =
Number(localStorage.getItem("cartCount")) || 0;

document.querySelectorAll("#cart-count").forEach(badge=>{

    if(cachedCount > 0){

        badge.textContent = cachedCount;

        badge.style.display = "flex";

    }else{

        badge.style.display = "none";

    }

});

/* ==========================
   UPDATE CART BADGE
========================== */

window.updateCartBadge = async function(){

    let totalItems = 0;

    const user = auth.currentUser;

    if(user){

        const snapshot = await getDocs(

            collection(
                db,
                "users",
                user.uid,
                "cart"
            )

        );

        snapshot.forEach(doc=>{

            totalItems += doc.data().quantity || 1;

        });

    }

    else{

        const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

        cart.forEach(item=>{

            totalItems += item.quantity || 1;

        });

    }

    // Save latest count
    localStorage.setItem(
        "cartCount",
        totalItems
    );

    document.querySelectorAll("#cart-count").forEach(badge=>{

        if(totalItems > 0){

            badge.textContent = totalItems;

            badge.style.display = "flex";

        }else{

            badge.style.display = "none";

        }

    });

};

/* ==========================
   AUTH STATE
========================== */

onAuthStateChanged(auth, ()=>{

    updateCartBadge();

});