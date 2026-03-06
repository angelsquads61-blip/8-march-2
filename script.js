const canvas = document.getElementById("scratch");
const ctx = canvas.getContext("2d", { willReadFrequently: true }); // Улучшает производительность getImageData

const revealText = document.getElementById("revealText");
const resetBtn = document.getElementById("resetBtn");

const audio = document.getElementById("bgAudio");
const musicBtn = document.getElementById("toggleMusic");

audio.volume = 0.2;

let drawing = false;
let revealed = false;

function initScratch() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#bdbdbd";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#777";
    ctx.font = "bold 20px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Сотри здесь", canvas.width / 2, canvas.height / 2);

    // Включаем режим "стирания"
    ctx.globalCompositeOperation = "destination-out";
}

initScratch();

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", end);
canvas.addEventListener("mouseleave", end);

canvas.addEventListener("touchstart", start);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", end);

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    }
    
    // Корректируем координаты на случай масштабирования CSS
    x = x * (canvas.width / rect.width);
    y = y * (canvas.height / rect.height);

    return { x, y };
}

function start(e) {
    if (revealed) return;
    drawing = true;
    draw(e);
}

function draw(e) {
    if (!drawing) return;
    
    // Предотвращаем скроллинг на мобильных, если touch-action: none не сработал
    if (e.cancelable) e.preventDefault(); 

    const pos = getPos(e);

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
    ctx.fill();

    checkReveal();
}

function end() {
    drawing = false;
}

function checkReveal() {
    if (revealed) return;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;

    for (let i = 3; i < pixels.data.length; i += 4) {
        if (pixels.data[i] === 0) {
            transparent++;
        }
    }

    const percent = transparent / (pixels.data.length / 4);

    if (percent > 0.35) {
        revealed = true;
        
        // Плавная анимация после стирания достаточной площади
        canvas.style.transition = "opacity 0.5s ease-out";
        canvas.style.opacity = "0";
        
        revealText.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        revealText.style.transform = "scale(1.1)";

        try {
            audio.play();
            musicBtn.setAttribute("aria-pressed", "true");
        } catch (err) {
            console.log("Автозапуск аудио заблокирован браузером");
        }
    }
}

resetBtn.onclick = () => {
    revealed = false;
    
    canvas.style.transition = "none";
    canvas.style.opacity = "1";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    initScratch();

    revealText.style.transform = "scale(1)";

    audio.pause();
    audio.currentTime = 0;
    musicBtn.setAttribute("aria-pressed", "false");
};

musicBtn.onclick = async () => {
    const playing = musicBtn.getAttribute("aria-pressed") === "true";

    if (playing) {
        audio.pause();
        musicBtn.setAttribute("aria-pressed", "false");
    } else {
        try {
            await audio.play();
            musicBtn.setAttribute("aria-pressed", "true");
        } catch (err) {
            console.log("Ошибка воспроизведения аудио", err);
        }
    }
};