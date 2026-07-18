import { db } from "./firebase-config.js";

import {

    collection,

    addDoc,

    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

export async function createNotification(

    userId,

    title,

    message,

    type,

    action = {}

){

    return await addDoc(

        collection(db,"notifications"),

        {

            userId,

            title,

            message,

            type,

           action:{

    page: action.page || null,

    orderNumber: action.orderNumber || null,

    productName: action.productName || null,

    productImage: action.productImage || null,

    quantity: action.quantity || 1,

    totalItems: action.totalItems || 1,

    items: action.items || [],

    status: action.status || "Pending",

    estimatedFrom: action.estimatedFrom || null,

    estimatedTo: action.estimatedTo || null

},

            isRead:false,

            createdAt:serverTimestamp()

        }

    );

}