import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


export async function loginWithEmail(email, password) {

    const credential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    return credential.user;

}


export async function loginWithGoogle() {

    const provider =
        new GoogleAuthProvider();

    const result =
        await signInWithPopup(
            auth,
            provider
        );

    return result.user;

}


export async function getUser(uid) {

    const userSnap =
        await getDoc(doc(db, "users", uid));

    if (!userSnap.exists()) {

        throw new Error("User profile not found.");

    }

    return userSnap.data();

}


export async function getAdmin(uid) {

    const adminSnap =
        await getDoc(doc(db, "admins", uid));

    if (!adminSnap.exists()) {

        return null;

    }

    return adminSnap.data();

}


export async function getUserRole(uid) {

    const admin =
        await getAdmin(uid);

    if (admin && admin.active) {

        return "admin";

    }

    return "customer";

}


export async function logout() {

    await signOut(auth);

}
export function getCurrentUser() {

    return new Promise((resolve) => {

        onAuthStateChanged(auth, (user) => {

            resolve(user);

        });

    });

}
export async function requireAdmin() {

    const user = await getCurrentUser();

    if (!user) {

        throw new Error("NOT_LOGGED_IN");

    }

    const admin = await getAdmin(user.uid);

    if (!admin) {

        throw new Error("NOT_ADMIN");

    }

    if (!admin.active) {

        throw new Error("ADMIN_DISABLED");

    }

    return {

        user,

        admin

    };

}