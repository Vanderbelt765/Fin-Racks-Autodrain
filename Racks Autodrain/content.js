let addToCartRunning = false;
let checkoutRunning = false;
var payClicked = false;
var running = true;
var racksPage = true;

const RACKS_URL = "https://throne.com/racksfindom";
const IMAGE_LIFETIME = 5000;


let mainLoopTimer = null;
let imageInterval = null;
let stampInterval = null;

function onRacksPage() {
    return window.location.href.startsWith(RACKS_URL);
}

function onCheckoutPage() {
    return window.location.href.startsWith(`${RACKS_URL}/checkout`);
}

function normalizeProductName(text) {
    return text
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

function clickAddToCartForRacks() {
    if (addToCartRunning || !running || !onRacksPage() || onCheckoutPage()) {
        return;
    }

    addToCartRunning = true;

    setTimeout(() => {
        try {
            if (!running) return;

            const productName = "tin¥ offering";

            // Find the actual <p> containing "Initiation".
            const labels = [...document.querySelectorAll("p")];
            const label = labels.find(p =>
                p.textContent.trim().toLowerCase() === productName
            );
            if (!label) {
                console.log("Could not find Initiation.");
                return;
            }
            console.log("Found product:", label.textContent.trim());
            let container = label;
            while (container && container !== document.body) {
                const buttons = [...container.querySelectorAll("button")];

                const addButton = buttons.find(button => {
                    const text = button.textContent
                        .trim()
                        .toLowerCase();

                    return (
                        text.includes("add to cart") &&
                        !button.disabled
                    );
                });
                if (addButton) {
                    console.log("Clicking 'Add to cart' for Initiation");
                    addButton.click();
                    return;
                }
                container = container.parentElement;
            }
            console.log(
                "Found Initiation, but could not find its Add to Cart button."
            );
        } finally {
            addToCartRunning = false;
        }
    }, 6000);
}


function clickCheckoutIfExists() {
    if (checkoutRunning || !running || !onRacksPage() || onCheckoutPage()) return;
    checkoutRunning = true;

    setTimeout(() => {
        try {
            if (!running) return;

            const buttons = [...document.querySelectorAll("button")];

            for (const button of buttons) {
                const text = button.textContent.trim().toLowerCase();

                if (text === "checkout" && !button.disabled) {
                    console.log("Clicking Checkout...");
                    button.click();
                    break;
                }
            }
        } finally {
            checkoutRunning = false;
        }
    }, 1500);
}

function clickPayNowIfExists() {
    setTimeout(() => {
        const buttons = document.querySelectorAll("button");
        for (const btn of buttons) {
            const span = btn.querySelector("span");
            if (span && span.textContent.trim().toLowerCase() === "pay now" && !btn.disabled) {
                console.log("Clicking Pay Now...");
                btn.click();
                payClicked = true;
                return;
            }
            else if (btn.disabled){
                stopExtension();
            }
        }
    }, 7000);
}

function showBrokie() {
    // Remove an old one first so we don't create duplicates.
    document.getElementById("racksBrokie")?.remove();
    document.getElementById("racksBrokieStyle")?.remove();

    const el = document.createElement("div");
    el.id = "racksBrokie";
    el.textContent = "BROKIE";

    Object.assign(el.style, {
        position: "fixed",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        color: "white",
        fontFamily: "Impact, Arial Black, sans-serif",
        fontSize: "clamp(80px, 18vw, 260px)",
        fontWeight: "900",
        letterSpacing: "0.04em",
        zIndex: "2147483647",
        pointerEvents: "none",
        textShadow: "0 0 20px rgb(186, 12, 202), 0 0 50px rgb(186, 12, 202)",
        animation: "racksBrokieFlash 0.3s steps(2,end) infinite"
    });

    const style = document.createElement("style");
    style.id = "racksBrokieStyle";
    style.textContent = `
        @keyframes racksBrokieFlash {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }

            50% {
                opacity: 0.05;
                transform: scale(1.03);
            }
        }
    `;

    document.documentElement.appendChild(style);
    document.body.appendChild(el);

    // IMPORTANT:
    // No timeout here. BROKIE stays until explicitly removed.
}


function removeVideoOverlay() {
    const backdrop = document.getElementById("videoOverlayBackdrop");

    if (backdrop) {
        const video = backdrop.querySelector("video");

        if (video) {
            video.pause();
            video.removeAttribute("src");
            video.load();
        }

        backdrop.remove();
    }

    document.getElementById("reopenVideoButton")?.remove();
}

function stopExtension() {
    if (!running) return;

    console.log("Stopping autodrain extension...");

    running = false;

    // Stop the main loop.
    if (mainLoopTimer !== null) {
        clearTimeout(mainLoopTimer);
        mainLoopTimer = null;
    }

    // Stop image/stamp loops.
    if (imageInterval !== null) {
        clearInterval(imageInterval);
        imageInterval = null;
    }

    if (stampInterval !== null) {
        clearInterval(stampInterval);
        stampInterval = null;
    }

    // Remove generated images/stamps.
    document
        .querySelectorAll("[data-racks-autodrain]")
        .forEach(e => e.remove());

    document
        .querySelectorAll("[data-racks-stamp]")
        .forEach(e => e.remove());

    // Delete video.
    removeVideoOverlay();

    // BROKIE remains flashing.
    showBrokie();
}

function spawnImage() {
    if (!onRacksPage()) return;
    if (!running || !document.body) return;

    const paths = [
        "images/FinRack1.jpg",
        "images/FinRack2.jpg",
        "images/FinRack3.jpg",
        "images/FinRack4.jpg",
        "images/FinRack5.jpg"
    ];

    let src;

    try {
        // Extension context may have been invalidated after a reload/update.
        if (!chrome?.runtime?.id) {
            running = false;
            return;
        }

        src = chrome.runtime.getURL(
            paths[Math.floor(Math.random() * paths.length)]
        );
    } catch (error) {
        console.warn("Extension context is no longer valid:", error);

        running = false;
        return;
    }

    const img = new Image();

    img.onload = () => {
        if (!running) return;

        const scale = 0.2;
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;

        const shown = document.createElement("img");

        shown.dataset.racksAutodrain = "1";
        shown.src = src;
        shown.alt = "";

        Object.assign(shown.style, {
            position: "fixed",
            left: `${Math.max(
                0,
                Math.random() * Math.max(1, innerWidth - w)
            )}px`,
            top: `${Math.max(
                0,
                Math.random() * Math.max(1, innerHeight - h)
            )}px`,
            width: `${w}px`,
            height: `${h}px`,
            zIndex: "10000",
            pointerEvents: "none",
            opacity: "1"
        });

        document.body.appendChild(shown);

        setTimeout(() => {
            shown.remove();
        }, IMAGE_LIFETIME);
    };

    img.onerror = () => {
        console.warn("Could not load image:", src);
    };

    img.src = src;
}

function mainLoop() {
    if (!onRacksPage()) return;
    // Do NOT schedule another iteration once stopped.
    if (!running) {
        mainLoopTimer = null;
        return;
    }

    if (onCheckoutPage()) {
        clickPayNowIfExists();
    } else if (onRacksPage()) {
        clickAddToCartForRacks();
        clickCheckoutIfExists();
    }

    mainLoopTimer = setTimeout(mainLoop, 5000);
}

const stampPhrases = [
    "STARE", "KEEP DROOLING", "LOSER", "DUMMY", "STROKE", "GOON", "EDGE",
    "ALL FOR RACKS", "KEEP GOING", "GOOD BOY", "DRAIN", "KEEP DRAINING",
    "THIS IS YOUR PURPOSE", "MAKE RACKS RICH", "KEEP SPIRALING", "GO HARDER",
    "FASTER", "MELT FOR ME", "GIVE MORE", "GO DUMB",
    "NO MORE THOUGHTS", "OBEY", "SUBMIT", "LOSE FOR RACKS", "FEELS SO GOOD",
    "GO BANKRUPT", "YOU LOSE", "MORE MORE MORE"
];

function spawnStamp() {
    if (!onRacksPage()) return;
    if (!running || !document.body) return;

    const stamp = document.createElement("div");

    stamp.dataset.racksStamp = "1";
    stamp.innerText =
        stampPhrases[Math.floor(Math.random() * stampPhrases.length)];

    Object.assign(stamp.style, {
        position: "fixed",
        left: `${Math.max(
            0,
            Math.random() * (window.innerWidth - 200)
        )}px`,
        top: `${Math.max(
            0,
            Math.random() * (window.innerHeight - 100)
        )}px`,
        fontSize: "32px",
        fontWeight: "bold",
        color: "rgb(186, 12, 202)",
        textShadow: "2px 2px 8px black",
        fontFamily: "Impact, Arial Black, sans-serif",
        zIndex: "10000",
        opacity: "0",
        transform: `rotate(${Math.random() * 40 - 20}deg)`,
        pointerEvents: "none",
        transition: "opacity 0.4s ease-in"
    });

    document.body.appendChild(stamp);

    setTimeout(() => {
        if (document.body.contains(stamp)) {
            stamp.style.opacity = "1";
        }
    }, 50);

    setTimeout(() => {
        if (!document.body.contains(stamp)) return;

        stamp.style.opacity = "0";

        setTimeout(() => stamp.remove(), 800);
    }, 2000);
}

function addVideoOverlay() {
    if (!onRacksPage()) return;
    if (!running || !document.body) return;

    if (document.getElementById("videoOverlayBackdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "videoOverlayBackdrop";

    Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        background: "rgba(0,0,0,0.6)",
        zIndex: "9999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    });

    const frame = document.createElement("div");
    frame.id = "videoOverlayFrame";

    Object.assign(frame.style, {
        position: "relative",
        width: "80vw",
        maxWidth: "360px",
        aspectRatio: "1 / 2",
        background: "#000",
        border: "4px solid rgb(186, 12, 202)",
        borderRadius: "18px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        overflow: "hidden"
    });

    const video = document.createElement("video");

    video.src =
        "https://static1.e621.net/data/sample/80/a4/80a4e2b78f21503371a86d5e08d44c4d_alt.mp4";

    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");

    Object.assign(video.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
    });

    // Close button actually exists now.
    const closeButton = document.createElement("button");
    closeButton.id = "closeVideoButton";
    closeButton.textContent = "×";

    Object.assign(closeButton.style, {
        position: "absolute",
        top: "8px",
        right: "8px",
        width: "36px",
        height: "36px",
        border: "none",
        borderRadius: "50%",
        background: "rgba(0,0,0,0.65)",
        color: "white",
        fontSize: "26px",
        lineHeight: "36px",
        cursor: "pointer",
        zIndex: "3"
    });

    closeButton.addEventListener("click", () => {
        if (!running) return;

        backdrop.remove();
        showReopenButton();
    });

    /*
     * Browsers generally allow muted autoplay.
     * Start muted immediately, then allow the user to enable sound
     * with a gesture.
     */
    const tryPlay = () => {
        if (!running) return;

        const promise = video.play();

        if (promise && typeof promise.catch === "function") {
            promise.catch(error => {
                console.warn("Autoplay was blocked:", error);
            });
        }
    };

    const prompt = document.createElement("div");
    prompt.id = "tapToStartPrompt";
    prompt.textContent = "Tap for sound";

    Object.assign(prompt.style, {
        position: "absolute",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
        cursor: "pointer",
        userSelect: "none",
        color: "white",
        fontSize: "18px",
        fontFamily: "system-ui, sans-serif",
        zIndex: "2"
    });

    const startWithSound = async event => {
        event?.preventDefault();

        try {
            video.muted = false;
            video.volume = 1;

            await video.play();

            prompt.remove();
        } catch (error) {
            console.warn("Playback with sound failed:", error);

            // If sound is blocked, keep playback going muted.
            video.muted = true;
            tryPlay();
        }
    };

    prompt.addEventListener("click", startWithSound);

    frame.append(video, prompt, closeButton);
    backdrop.appendChild(frame);
    document.body.appendChild(backdrop);

    // Start playback immediately.
    tryPlay();

    // Retry after the element has had a chance to attach/load.
    setTimeout(tryPlay, 100);
    setTimeout(tryPlay, 500);
    setTimeout(tryPlay, 1500);
}

function showReopenButton() {
    if (!running) return;

    if (document.getElementById("reopenVideoButton")) return;

    const btn = document.createElement("button");
    btn.id = "reopenVideoButton";
    btn.innerText = "Show Video";

    Object.assign(btn.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: "9999",
        fontSize: "14px",
        padding: "8px 12px",
        color: "white",
        background: "rgb(186, 12, 202)",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
    });

    btn.addEventListener("click", () => {
        if (!running) return;

        btn.remove();
        addVideoOverlay();
    });

    document.body.appendChild(btn);
}


// Start everything.
mainLoop();

imageInterval = setInterval(() => {
    if (running) spawnImage();
}, 1500);

stampInterval = setInterval(() => {
    if (running) spawnStamp();
}, 3000);

addVideoOverlay();