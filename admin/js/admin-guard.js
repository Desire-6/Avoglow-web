import { auth } from "../../firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
    getAdmin
} from "../../auth-service.js";

onAuthStateChanged(auth, async (user) => {

    // Not logged in
    if (!user) {

        window.location.href = "../../login.html";
        return;

    }

    try {

        const admin = await getAdmin(user.uid);

        // User is not an admin
        if (!admin) {

            await signOut(auth);

            window.location.href = "../../login.html";

            return;

        }

        // Admin account disabled
        if (!admin.active) {

            await signOut(auth);

            window.location.href = "../../login.html";

            return;

        }

        console.log("Admin verified.");

    }

    catch (error) {

        console.error(error);

        await signOut(auth);

        window.location.href = "../../login.html";

    }

});