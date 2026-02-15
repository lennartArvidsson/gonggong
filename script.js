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
let minuteValue = 5;
let secondValue = 0;

// Build picker items
function buildPicker(scrollEl, count, initialValue) {
    // Add padding items so first/last can be centered
    const padItem = () => {
        const div = document.createElement('div');
        div.className = 'picker-item';
        div.textContent = '';
        return div;
    };
    scrollEl.appendChild(padItem());

    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'picker-item';
        div.textContent = i.toString().padStart(2, '0');
        div.dataset.value = i;
        scrollEl.appendChild(div);
    }
    scrollEl.appendChild(padItem());

    // Set initial position
    scrollEl.style.transform = `translateY(${-initialValue * ITEM_HEIGHT}px)`;
    updateActiveItem(scrollEl, initialValue);
}

function updateActiveItem(scrollEl, value) {
    const items = scrollEl.querySelectorAll('.picker-item');
    items.forEach((item, i) => {
        // i=0 is top padding, so value 0 = index 1
        item.classList.toggle('active', i === value + 1);
    });
}

function getValueFromOffset(offset) {
    return Math.round(-offset / ITEM_HEIGHT);
}

// Touch/mouse drag handling for pickers
function setupPickerDrag(pickerEl, scrollEl, maxValue, onChange) {
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

    function clampAndSnap(offset) {
        const minOffset = -(maxValue) * ITEM_HEIGHT;
        const maxOffset = 0;
        offset = Math.max(minOffset, Math.min(maxOffset, offset));
        return Math.round(offset / ITEM_HEIGHT) * ITEM_HEIGHT;
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

        const val = getValueFromOffset(clampAndSnap(currentOffset));
        updateActiveItem(scrollEl, val);
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        scrollEl.style.transition = 'transform 0.3s ease-out';

        // Apply momentum
        let finalOffset = currentOffset + velocity * 150;
        finalOffset = clampAndSnap(finalOffset);

        scrollEl.style.transform = `translateY(${finalOffset}px)`;
        const val = getValueFromOffset(finalOffset);
        updateActiveItem(scrollEl, val);
        onChange(val);
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

buildPicker(minuteScroll, 61, minuteValue);  // 0-60
buildPicker(secondScroll, 60, secondValue);   // 0-59

setupPickerDrag(
    document.getElementById('minutePicker'),
    minuteScroll, 60,
    (val) => { minuteValue = val; }
);

setupPickerDrag(
    document.getElementById('secondPicker'),
    secondScroll, 59,
    (val) => { secondValue = val; }
);

// Preload gong sound
function preloadGong() {
    gongAudio = new Audio('gongong.mp3');
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
