window.updateCartBadge = function () {

    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];

    let totalItems = 0;

    cart.forEach(item => {
        totalItems += item.quantity || 1;
    });

    document.querySelectorAll("#cart-count").forEach(badge => {
        badge.textContent = totalItems;
    });

};

updateCartBadge();