document.addEventListener("DOMContentLoaded", function() {
    const carouselText = [
        {text: "TAGGCGCACTAA", color: "#020305"},
        {text: "TGCTCAGCACCA", color: "#0492ca"},
        {text: "CGACACCAGATC", color: "#00325a"}
    ];

    carousel(carouselText, document.getElementById("feature-text"));
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
    const letters = [...eleRef.textContent];  // Spread string into array of characters
    while (letters.length > 0) {
        await waitForMs(100);
        letters.pop();
        eleRef.textContent = letters.join("");
    }
}

async function carousel(carouselList, eleRef) {
    let i = 0;
    while (true) {
        updateFontColor(eleRef, carouselList[i].color);
        await typeSentence(carouselList[i].text, eleRef);
        await waitForMs(1500);
        await deleteSentence(eleRef);
        await waitForMs(500);
        i++;
        if (i >= carouselList.length) {
            i = 0;
        }
    }
}

function updateFontColor(eleRef, color) {
    eleRef.style.color = color;
}

function waitForMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
