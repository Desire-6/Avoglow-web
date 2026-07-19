/*=====================================
    IMPACT COUNTERS
=====================================*/

const counters =
document.querySelectorAll(".counter");

const impactSection =
document.querySelector(".circular-impact");

let started = false;

const observer = new IntersectionObserver((entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting && !started){

            started = true;

            animateCounters();

        }

    });

},{
    threshold:0.4
});

observer.observe(impactSection);

function animateCounters(){

    counters.forEach(counter=>{

        const target =
        Number(counter.dataset.target);

        const plus =
        counter.dataset.plus === "true";

        let current = 0;

        const increment =
        target / 120;

        const timer = setInterval(()=>{

            current += increment;

            if(current >= target){

                current = target;

                clearInterval(timer);

            }

            let value =
            Math.floor(current).toLocaleString();

            if(plus){

                value += "+";

            }

            counter.textContent = value;

        },15);

    });

}