const counters = document.querySelectorAll(".counter");

let started = false;

function animateCounters() {

    if (started) return;

    const section = document.querySelector(".impact-stats");

    const sectionTop = section.getBoundingClientRect().top;

    if (sectionTop < window.innerHeight - 100) {

        started = true;

        counters.forEach(counter => {

            const target = Number(counter.dataset.target);

            let current = 0;

            const increment = Math.ceil(target / 100);

            const updateCounter = () => {

                current += increment;

                if (current >= target) {

                    counter.textContent = target.toLocaleString() + "+";

                } else {

                    counter.textContent = current.toLocaleString();

                    requestAnimationFrame(updateCounter);

                }

            };

            updateCounter();

        });

    }

}

window.addEventListener("scroll", animateCounters);

window.addEventListener("load", animateCounters);

let currentSlide = 0;

const slides = document.querySelectorAll('.slide');

function showSlide(index){

    slides.forEach(slide =>
        slide.classList.remove('active')
    );

    slides[index].classList.add('active');
}

function changeSlide(direction){

    currentSlide += direction;

    if(currentSlide >= slides.length){
        currentSlide = 0;
    }

    if(currentSlide < 0){
        currentSlide = slides.length - 1;
    }

    showSlide(currentSlide);
}

/* Auto Slide Every 5 Seconds */

setInterval(() => {

    changeSlide(1);

}, 5000);