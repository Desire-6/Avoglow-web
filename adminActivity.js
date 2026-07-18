import { db } from "../firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


export async function createAdminActivity({

    type = "system",

    title = "",

    description = "",

    userName = null,

    userId = null,

    orderNumber = null,

    productName = null,

    relatedId = null,

    metadata = {}

}) {

    try {

        await addDoc(

            collection(

                db,

                "adminActivities"

            ),

            {

                type,

                title,

                description,

                userName,

                userId,

                orderNumber,

                productName,

                relatedId,

                metadata,

                performedBy: "Admin",

                createdAt:

                    serverTimestamp()

            }

        );

        console.log(

            "Admin activity recorded:",

            title

        );

    }

    catch(error){

        console.error(

            "Failed to record admin activity:",

            error

        );

    }

}