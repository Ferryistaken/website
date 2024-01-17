(() => {
    // Theme switch
    const body = document.body;
    const lamp = document.getElementById("mode");
    const data = body.getAttribute("data-theme");

    const initTheme = (state) => {
        if (state === "dark") {
            body.setAttribute("data-theme", "dark");
        } else if (state === "light") {
            body.removeAttribute("data-theme");
        } else {
            localStorage.setItem("theme", data);
        }
    };

    const toggleTheme = (state) => {
        if (state === "dark") {
            localStorage.setItem("theme", "light");
            body.removeAttribute("data-theme");
        } else if (state === "light") {
            localStorage.setItem("theme", "dark");
            body.setAttribute("data-theme", "dark");
        } else {
            initTheme(state);
        }
    };

    initTheme(localStorage.getItem("theme"));

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


    lamp.addEventListener("click", () => {
    stopCarousel = true; // Set the flag to stop current carousel
    toggleTheme(localStorage.getItem("theme"));
    // Restart the carousel after a short delay
    setTimeout(() => {
      carousel(carouselTextLight, carouselTextDark, document.getElementById("feature-text"));
    }, 100);
    });

    // Blur the content when the menu is open
    const cbox = document.getElementById("menu-trigger");

    cbox.addEventListener("change", function () {
        const area = document.querySelector(".wrapper");
        this.checked
            ? area.classList.add("blurry")
            : area.classList.remove("blurry");
    });
})();
