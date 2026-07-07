import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


export async function saveAddress(uid,address){

    await setDoc(

        doc(
            db,
            "users",
            uid,
            "profile",
            "address"
        ),

        {

            ...address,

            updatedAt:serverTimestamp()

        }

    );

}


export async function getAddress(uid){

    const snap = await getDoc(

        doc(
            db,
            "users",
            uid,
            "profile",
            "address"
        )

    );

    if(snap.exists()){

        return snap.data();

    }

    return null;

}