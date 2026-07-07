import { auth, db } from "./firebase-config.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
function generateOrderNumber(){

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2,"0");

    const day = String(now.getDate()).padStart(2,"0");

    const random = Math.floor(1000 + Math.random()*9000);

    return `AVG-${year}${month}${day}-${random}`;

}

export async function placeOrder(){

    const user = auth.currentUser;

    if(!user){

        throw new Error("User not logged in");

    }

    /* ==========================
       USER PROFILE
    ========================== */

    const userRef = doc(

        db,

        "users",

        user.uid

    );

    const userSnap = await getDoc(userRef);

    if(!userSnap.exists()){

        throw new Error("User profile not found");

    }

    const profile = userSnap.data();

    /* ==========================
       ADDRESS
    ========================== */

    const addressRef = doc(

        db,

        "users",

        user.uid,

        "profile",

        "address"

    );

    const addressSnap = await getDoc(addressRef);

    if(!addressSnap.exists()){

        throw new Error("Address not found");

    }

    const address = addressSnap.data();

    /* ==========================
       PAYMENT
    ========================== */

    const paymentRef = doc(

        db,

        "users",

        user.uid,

        "profile",

        "payment"

    );

    const paymentSnap = await getDoc(paymentRef);

    if(!paymentSnap.exists()){

        throw new Error("Payment method not found");

    }

    const payment = paymentSnap.data();

/* ==========================
   FORMAT PAYMENT METHOD
========================== */

let paymentMethod = payment.method;

if(payment.method === "airtel"){

    paymentMethod = "Airtel Money";

}

else if(payment.method === "mtn"){

    paymentMethod = "MTN MoMo";

}

else if(payment.method === "cash"){

    paymentMethod = "Cash on Delivery";

}

    /* ==========================
       CART
    ========================== */

    const cartSnapshot = await getDocs(

        collection(

            db,

            "users",

            user.uid,

            "cart"

        )

    );

    const items = [];

    let subtotal = 0;

    cartSnapshot.forEach(doc=>{

        const item = doc.data();

        items.push(item);

        subtotal += item.price * item.quantity;

    });

    /* ==========================
       DELIVERY
    ========================== */

    const deliveryOption = document.querySelector(

        "input[name='delivery']:checked"

    );

    const delivery = {

        method: deliveryOption.value,

        transportFee: 5000,

        homeDelivery:

        deliveryOption.value === "home"

    };

    /* ==========================
       TOTAL
    ========================== */

    const total = subtotal + 5000;

    /* ==========================
   CREATE ORDER
========================== */

const order = {

    orderNumber: generateOrderNumber(),

    userId: user.uid,

    customer: profile,

    address,

 payment:{

    method: paymentMethod,

    phone: payment.phone

},

    delivery,

    items,

    subtotal,

    deliveryFee:5000,

    total,

    status:"Pending",

    paymentStatus:"Pending",

    createdAt: serverTimestamp()

};

/* ==========================
   SAVE ORDER
========================== */

await setDoc(

    doc(

        db,

        "orders",

        order.orderNumber

    ),

    order

);

/* ==========================
   CLEAR CART
========================== */

for(const item of items){

    await deleteDoc(

        doc(

            db,

            "users",

            user.uid,

            "cart",

            item.slug + "_" + item.size

        )

    );

}

/* ==========================
   SUCCESS
========================== */

console.log("Order Saved Successfully");

console.log(order);

return order;

}