document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CREAR OVERLAY
    // ==========================================

    const overlay = document.createElement("div");
    overlay.id = "liaIntro";

    overlay.innerHTML = `
        <video
            id="liaVideo"
            autoplay
            muted
            playsinline
            preload="auto"
            disablepictureinpicture
            controlslist="nodownload noplaybackrate noremoteplayback"
            poster="assets/intro/lia_genesis_poster.webp">

            <source
                src="assets/intro/lia_genesis_intro.mp4"
                type="video/mp4">

        </video>

        <div id="liaIntroHUD" class="visible">

            <button
                id="liaSoundButton"
                title="Activar sonido">

                🔇

            </button>

            <button
                id="liaSkipButton"
                title="Entrar al sitio">

                ⏭ SALTAR INTRO

            </button>

        </div>
    `;

    document.body.appendChild(overlay);

    const video = document.getElementById("liaVideo");
    const soundButton = document.getElementById("liaSoundButton");
    const skipButton = document.getElementById("liaSkipButton");

    // ==========================================
    // REPRODUCIR VIDEO
    // ==========================================

    video.play().catch(() => {

        console.warn("No fue posible iniciar el video automáticamente.");

        cerrarIntro();

    });

    // ==========================================
    // BOTÓN SONIDO
    // ==========================================

    soundButton.addEventListener("click", () => {

        video.muted = !video.muted;

        soundButton.innerHTML = video.muted ? "🔇" : "🔊";

        soundButton.title = video.muted
            ? "Activar sonido"
            : "Silenciar";

    });

    // ==========================================
    // BOTÓN SALTAR
    // ==========================================

    skipButton.addEventListener("click", () => {

        cerrarIntro();

    });

    // ==========================================
    // VIDEO TERMINADO
    // ==========================================

    video.addEventListener("ended", () => {

        cerrarIntro();

    });

    // ==========================================
    // ERROR VIDEO
    // ==========================================

    video.addEventListener("error", () => {

        console.error("No fue posible cargar el video de introducción.");

        cerrarIntro();

    });

    // ==========================================
    // CERRAR INTRO
    // ==========================================

    function cerrarIntro() {

        if (overlay.classList.contains("fadeOut")) {
            return;
        }

        overlay.classList.add("fadeOut");

        setTimeout(() => {

            overlay.remove();

        }, 800);

    }

});