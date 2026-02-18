// Timer state
let totalSeconds = 0;
let remainingSeconds = 0;
let timerInterval = null;
let isPaused = false;
let gongAudio = null;
let endTime = null; // wall-clock time when timer will reach zero

// DOM elements
const setupView = document.getElementById("setupView");
const timerView = document.getElementById("timerView");
const timeDisplay = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const soundIndicator = document.getElementById("soundIndicator");

// Picker state
const ITEM_HEIGHT = 50;
const savedMinutes = localStorage.getItem("gong_minutes");
const savedSeconds = localStorage.getItem("gong_seconds");
let minuteValue = savedMinutes !== null ? parseInt(savedMinutes) : 5;
let secondValue = savedSeconds !== null ? parseInt(savedSeconds) : 0;

// Build circular picker: 3 copies of items for seamless wrapping
function buildPicker(scrollEl, count, initialValue) {
  const padItem = () => {
    const div = document.createElement("div");
    div.className = "picker-item";
    div.textContent = "";
    return div;
  };

  scrollEl.appendChild(padItem());

  for (let copy = 0; copy < 3; copy++) {
    for (let i = 0; i < count; i++) {
      const div = document.createElement("div");
      div.className = "picker-item";
      div.textContent = i.toString().padStart(2, "0");
      div.dataset.value = i;
      scrollEl.appendChild(div);
    }
  }

  scrollEl.appendChild(padItem());

  const middleOffset = -(count + initialValue) * ITEM_HEIGHT;
  scrollEl.style.transform = `translateY(${middleOffset}px)`;
  updateActiveItem(scrollEl, initialValue, count);
}

function updateActiveItem(scrollEl, value, count) {
  const items = scrollEl.querySelectorAll(".picker-item");
  items.forEach((item) => {
    item.classList.toggle("active", item.dataset.value == value);
  });
}

function setupPickerDrag(pickerEl, scrollEl, count, onChange) {
  let startY = 0;
  let startOffset = 0;
  let currentOffset = 0;
  let isDragging = false;
  let lastY = 0;
  let velocity = 0;
  let lastTime = 0;

  function getOffset() {
    const transform = scrollEl.style.transform;
    const match = transform.match(/translateY\((.+?)px\)/);
    return match ? parseFloat(match[1]) : 0;
  }

  function snap(offset) {
    return Math.round(offset / ITEM_HEIGHT) * ITEM_HEIGHT;
  }

  function getValue(offset) {
    const index = Math.round(-offset / ITEM_HEIGHT);
    return ((index % count) + count) % count;
  }

  function teleportToMiddle(offset) {
    const index = Math.round(-offset / ITEM_HEIGHT);
    const value = ((index % count) + count) % count;
    return -(count + value) * ITEM_HEIGHT;
  }

  function onStart(y) {
    isDragging = true;
    startY = y;
    startOffset = getOffset();
    velocity = 0;
    lastY = y;
    lastTime = Date.now();
    scrollEl.style.transition = "none";
  }

  function onMove(y) {
    if (!isDragging) return;
    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (y - lastY) / dt;
    }
    lastY = y;
    lastTime = now;

    currentOffset = startOffset + (y - startY);
    scrollEl.style.transform = `translateY(${currentOffset}px)`;

    const val = getValue(snap(currentOffset));
    updateActiveItem(scrollEl, val, count);
  }

  function onEnd() {
    if (!isDragging) return;
    isDragging = false;

    let finalOffset = snap(currentOffset + velocity * 150);
    const val = getValue(finalOffset);

    scrollEl.style.transition = "transform 0.3s ease-out";
    scrollEl.style.transform = `translateY(${finalOffset}px)`;

    updateActiveItem(scrollEl, val, count);
    onChange(val);

    setTimeout(() => {
      const middleOffset = teleportToMiddle(finalOffset);
      if (middleOffset !== finalOffset) {
        scrollEl.style.transition = "none";
        scrollEl.style.transform = `translateY(${middleOffset}px)`;
      }
    }, 320);
  }

  pickerEl.addEventListener(
    "touchstart",
    (e) => {
      onStart(e.touches[0].clientY);
    },
    { passive: true },
  );

  pickerEl.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      onMove(e.touches[0].clientY);
    },
    { passive: false },
  );

  pickerEl.addEventListener("touchend", () => onEnd());

  pickerEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    onStart(e.clientY);
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) onMove(e.clientY);
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) onEnd();
  });
}

// Initialize pickers
const minuteScroll = document.getElementById("minuteScroll");
const secondScroll = document.getElementById("secondScroll");

const MINUTE_COUNT = 61;
const SECOND_COUNT = 60;

buildPicker(minuteScroll, MINUTE_COUNT, minuteValue);
buildPicker(secondScroll, SECOND_COUNT, secondValue);

setupPickerDrag(
  document.getElementById("minutePicker"),
  minuteScroll,
  MINUTE_COUNT,
  (val) => {
    minuteValue = val;
    localStorage.setItem("gong_minutes", val);
  },
);

setupPickerDrag(
  document.getElementById("secondPicker"),
  secondScroll,
  SECOND_COUNT,
  (val) => {
    secondValue = val;
    localStorage.setItem("gong_seconds", val);
  },
);

// -------------------------------------------------------
// LJUD - iOS kräver att Audio skapas och "låses upp"
// direkt i ett användarklick. Vi gör det vid Start-knappen
// och sparar sedan samma Audio-objekt för senare uppspelning.
// -------------------------------------------------------
function unlockAndPreloadGong() {
  gongAudio = new Audio("gongong.wav");
  gongAudio.load();

  // Spela en bråkdels sekund tyst - detta låser upp iOS Audio-kontexten
  gongAudio.volume = 1;
  const unlockPromise = gongAudio.play();
  if (unlockPromise !== undefined) {
    unlockPromise
      .then(() => {
        gongAudio.pause();
        gongAudio.currentTime = 0;
      })
      .catch(() => {
        // Tyst fel - spelar ingen roll, vi försöker ändå sen
      });
  }
}

function playGong() {
  if (gongAudio) {
    gongAudio.currentTime = 0;
    gongAudio.play().catch((err) => {
      console.log("Kunde inte spela ljud:", err);
    });
  }
  soundIndicator.classList.add("active");
  setTimeout(() => {
    soundIndicator.classList.remove("active");
  }, 4000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function showFinished() {
  localStorage.removeItem("gong_endTime");
  clearInterval(timerInterval);
  timerInterval = null;
  endTime = null;
  startBtn.style.display = "none";
  pauseBtn.style.display = "none";
  resetBtn.style.display = "inline-block";
}

function tick() {
  remainingSeconds = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  timeDisplay.textContent = formatTime(remainingSeconds);

  if (remainingSeconds === 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    playGong();
    setTimeout(showFinished, 100);
  }
}

function beginCountdown() {
  localStorage.setItem("gong_endTime", endTime);
  timerInterval = setInterval(tick, 500);
}

function startTimer() {
  totalSeconds = minuteValue * 60 + secondValue;

  if (totalSeconds === 0) {
    alert("Ställ in en tid större än 0");
    return;
  }

  // Lås upp ljud direkt vid användarklick - kritiskt för iOS
  unlockAndPreloadGong();

  remainingSeconds = totalSeconds;

  setupView.style.display = "none";
  timerView.classList.add("active");

  timeDisplay.textContent = formatTime(remainingSeconds);

  startBtn.style.display = "none";
  pauseBtn.style.display = "inline-block";
  resetBtn.style.display = "inline-block";

  endTime = Date.now() + remainingSeconds * 1000;
  beginCountdown();
}

function pauseTimer() {
  if (isPaused) {
    endTime = Date.now() + remainingSeconds * 1000;
    beginCountdown();
    pauseBtn.querySelector(".btn-text").textContent = "Paus";
    isPaused = false;
  } else {
    clearInterval(timerInterval);
    timerInterval = null;
    localStorage.removeItem("gong_endTime");
    pauseBtn.querySelector(".btn-text").textContent = "Fortsätt";
    isPaused = true;
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  localStorage.removeItem("gong_endTime");
  timerInterval = null;
  endTime = null;
  isPaused = false;
  gongAudio = null; // Släpp audio-objektet så det låses upp på nytt nästa gång

  setupView.style.display = "block";
  timerView.classList.remove("active");

  startBtn.style.display = "inline-block";
  pauseBtn.style.display = "none";
  resetBtn.style.display = "none";
  pauseBtn.querySelector(".btn-text").textContent = "Paus";
}

function restoreTimer() {
  const saved = localStorage.getItem("gong_endTime");
  if (!saved) return;

  const savedEnd = parseInt(saved);
  const remaining = Math.ceil((savedEnd - Date.now()) / 1000);

  if (remaining > 0) {
    endTime = savedEnd;
    remainingSeconds = remaining;
    totalSeconds = remaining;

    setupView.style.display = "none";
    timerView.classList.add("active");
    timeDisplay.textContent = formatTime(remainingSeconds);
    startBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
    resetBtn.style.display = "inline-block";
    beginCountdown();
    // OBS: gongAudio är null här - användaren måste interagera för att låsa upp ljud igen
    // Det är en iOS-begränsning vi inte kan kringgå utan interaktion
  } else {
    // Timern gick ut medan appen var i bakgrunden
    setupView.style.display = "none";
    timerView.classList.add("active");
    timeDisplay.textContent = "00:00";
    // Ljud kan inte spelas här utan användarinteraktion - visa istället en tydlig signal
    showFinished();
    // Pulsera tidsdisplayen för att signalera att det är klart
    timeDisplay.style.animation = "none";
    timeDisplay.style.color = "var(--clay)";
  }
}

restoreTimer();

function resumeFromBackground() {
  if (!isPaused && endTime) {
    clearInterval(timerInterval);
    timerInterval = setInterval(tick, 500);
    tick(); // Kör en tick direkt så displayen uppdateras omedelbart
  }
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) resumeFromBackground();
});

window.addEventListener("focus", resumeFromBackground);

window.addEventListener("pageshow", (e) => {
  if (e.persisted) resumeFromBackground();
});

// Extra lyssnare för PWA på iOS
window.addEventListener("resume", resumeFromBackground);

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
