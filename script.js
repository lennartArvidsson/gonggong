// Timer state
let totalSeconds = 0;
let remainingSeconds = 0;
let timerInterval = null;
let isPaused = false;
let gongAudio = null;

// DOM elements
const setupView = document.getElementById('setupView');
const timerView = document.getElementById('timerView');
const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const soundIndicator = document.getElementById('soundIndicator');

// Picker state
const ITEM_HEIGHT = 50;
const savedMinutes = localStorage.getItem('gong_minutes');
const savedSeconds = localStorage.getItem('gong_seconds');
let minuteValue = savedMinutes !== null ? parseInt(savedMinutes) : 5;
let secondValue = savedSeconds !== null ? parseInt(savedSeconds) : 0;

// Build circular picker: 3 copies of items for seamless wrapping
function buildPicker(scrollEl, count, initialValue) {
    const padItem = () => {
        const div = document.createElement('div');
        div.className = 'picker-item';
        div.textContent = '';
        return div;
    };

    // Top padding so first item can center
    scrollEl.appendChild(padItem());

    // 3 copies: [0..count-1] [0..count-1] [0..count-1]
    for (let copy = 0; copy < 3; copy++) {
        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'picker-item';
            div.textContent = i.toString().padStart(2, '0');
            div.dataset.value = i;
            scrollEl.appendChild(div);
        }
    }

    scrollEl.appendChild(padItem());

    // Start in the middle copy
    const middleOffset = -(count + initialValue) * ITEM_HEIGHT;
    scrollEl.style.transform = `translateY(${middleOffset}px)`;
    updateActiveItem(scrollEl, initialValue, count);
}

function updateActiveItem(scrollEl, value, count) {
    const items = scrollEl.querySelectorAll('.picker-item');
    items.forEach((item) => {
        item.classList.toggle('active', item.dataset.value == value);
    });
}

// Touch/mouse drag handling for circular pickers
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

    // Get value from offset (accounting for middle copy start)
    function getValue(offset) {
        const index = Math.round(-offset / ITEM_HEIGHT);
        return ((index % count) + count) % count;
    }

    // Teleport to middle copy without visual change
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
        scrollEl.style.transition = 'none';
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

        // Apply momentum and snap
        let finalOffset = snap(currentOffset + velocity * 150);
        const val = getValue(finalOffset);

        // Animate to snapped position
        scrollEl.style.transition = 'transform 0.3s ease-out';
        scrollEl.style.transform = `translateY(${finalOffset}px)`;

        updateActiveItem(scrollEl, val, count);
        onChange(val);

        // After animation, silently teleport to middle copy
        setTimeout(() => {
            const middleOffset = teleportToMiddle(finalOffset);
            if (middleOffset !== finalOffset) {
                scrollEl.style.transition = 'none';
                scrollEl.style.transform = `translateY(${middleOffset}px)`;
            }
        }, 320);
    }

    // Touch events
    pickerEl.addEventListener('touchstart', (e) => {
        onStart(e.touches[0].clientY);
    }, { passive: true });

    pickerEl.addEventListener('touchmove', (e) => {
        e.preventDefault();
        onMove(e.touches[0].clientY);
    }, { passive: false });

    pickerEl.addEventListener('touchend', () => onEnd());

    // Mouse events
    pickerEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onStart(e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) onMove(e.clientY);
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) onEnd();
    });
}

// Initialize pickers
const minuteScroll = document.getElementById('minuteScroll');
const secondScroll = document.getElementById('secondScroll');

const MINUTE_COUNT = 61; // 0-60
const SECOND_COUNT = 60; // 0-59

buildPicker(minuteScroll, MINUTE_COUNT, minuteValue);
buildPicker(secondScroll, SECOND_COUNT, secondValue);

setupPickerDrag(
    document.getElementById('minutePicker'),
    minuteScroll, MINUTE_COUNT,
    (val) => { minuteValue = val; localStorage.setItem('gong_minutes', val); }
);

setupPickerDrag(
    document.getElementById('secondPicker'),
    secondScroll, SECOND_COUNT,
    (val) => { secondValue = val; localStorage.setItem('gong_seconds', val); }
);

// Preload gong sound
function preloadGong() {
    gongAudio = new Audio('gongong.wav');
    gongAudio.load();
}

// Play gong sound
function playGong() {
    if (gongAudio) {
        gongAudio.currentTime = 0;
        gongAudio.play().catch(err => {
            console.log('Kunde inte spela ljud:', err);
        });
    }
    soundIndicator.classList.add('active');
    setTimeout(() => {
        soundIndicator.classList.remove('active');
    }, 4000);
}

// Format time display
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Timer tick
function tick() {
    remainingSeconds--;
    timeDisplay.textContent = formatTime(remainingSeconds);

    if (remainingSeconds === 0) {
        clearInterval(timerInterval);
        playGong();

        setTimeout(() => {
            timeDisplay.textContent = '00:00';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            resetBtn.style.display = 'inline-block';
        }, 100);
    }

    if (remainingSeconds === 10) {
        playGong();
    }
}

// Start timer
function startTimer() {
    totalSeconds = minuteValue * 60 + secondValue;

    preloadGong();

    if (totalSeconds === 0) {
        alert('Ställ in en tid större än 0');
        return;
    }

    remainingSeconds = totalSeconds;

    setupView.style.display = 'none';
    timerView.classList.add('active');

    timeDisplay.textContent = formatTime(remainingSeconds);

    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';

    timerInterval = setInterval(tick, 1000);
}

// Pause timer
function pauseTimer() {
    if (isPaused) {
        timerInterval = setInterval(tick, 1000);
        pauseBtn.querySelector('.btn-text').textContent = 'Paus';
        isPaused = false;
    } else {
        clearInterval(timerInterval);
        pauseBtn.querySelector('.btn-text').textContent = 'Fortsätt';
        isPaused = true;
    }
}

// Reset timer
function resetTimer() {
    clearInterval(timerInterval);
    isPaused = false;

    setupView.style.display = 'block';
    timerView.classList.remove('active');

    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    pauseBtn.querySelector('.btn-text').textContent = 'Paus';
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
