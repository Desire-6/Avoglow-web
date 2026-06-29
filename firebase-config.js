import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const firebaseConfig = {

    apiKey: "AIzaSyBbymB7zY46rOVuaXHOLeXJo1GUiEUR27Y",

    authDomain: "avoglow.firebaseapp.com",

    projectId: "avoglow",

    storageBucket: "avoglow.firebasestorage.app",

    messagingSenderId: "980315908799",

    appId: "1:980315908799:web:6b09a5b560745a67f6f40a"

};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export { db, auth };