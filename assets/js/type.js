let stopCarousel = false;

document.addEventListener("DOMContentLoaded", function() {
    const carouselTextLight = [
        {text: "TAGGCGCAC", color: "#020305"},
        {text: "TGCTCAGCAC", color: "#0492ca"},
        {text: "CGACACCA", color: "#00325a"}
    ];

    const carouselTextDark = [
        {text: "TAGGCGCAC", color: "#a1ecfb"},
        {text: "TGCTCAGCAC", color: "#f0e14a"},
        {text: "CGACACCA", color: "#f4a261"}
    ];

    carousel(carouselTextLight, carouselTextDark, document.getElementById("feature-text"));
});

async function typeSentence(sentence, eleRef, delay = 100) {
    const letters = sentence.split("");
    let i = 0;
    while (i < letters.length) {
        await waitForMs(delay);
        eleRef.textContent += letters[i];
        i++;
    }
    return;
}

async function deleteSentence(eleRef) {
    const letters = [...eleRef.textContent];
    while (letters.length > 0) {
        await waitForMs(100);
        letters.pop();
        eleRef.textContent = letters.join("");
    }
}

async function carousel(carouselListLight, carouselListDark, eleRef) {
    let carouselList = document.body.getAttribute("data-theme") === "dark" ? carouselListDark : carouselListLight;
    let i = 0;
    while (true) {
        if (stopCarousel) {
            stopCarousel = false; // Reset flag
            eleRef.textContent = ''; // Clear current text
            return; // Exit the function to restart it
        }

        carouselList = document.body.getAttribute("data-theme") === "dark" ? carouselListDark : carouselListLight;
        updateFontColor(eleRef, carouselList[i].color);
        await typeSentence(carouselList[i].text, eleRef);
        await waitForMs(1500);
        await deleteSentence(eleRef);
        await waitForMs(500);
        i = (i + 1) % carouselList.length;
    }
}


function updateFontColor(eleRef, color) {
    eleRef.style.color = color;
}

function waitForMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

