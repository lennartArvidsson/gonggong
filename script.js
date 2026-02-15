// Timer state
let totalSeconds = 0;
let remainingSeconds = 0;
let timerInterval = null;
let isPaused = false;
let gongAudio = null;

// DOM elements
const setupView = document.getElementById('setupView');
const timerView = document.getElementById('timerView');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const timeDisplay = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const progressCircle = document.querySelector('.progress-ring-circle');
const progressRing = document.querySelector('.progress-ring');
const soundIndicator = document.getElementById('soundIndicator');

// Preload gong sound (call from user gesture to unlock audio)
function preloadGong() {
    gongAudio = new Audio('gongong.mp3');
    gongAudio.load();
}

// Play gong sound from MP3 file
function playGong() {
    if (gongAudio) {
        gongAudio.currentTime = 0;
        gongAudio.play().catch(err => {
            console.log('Kunde inte spela ljud:', err);
        });
    }

    // Show sound indicator
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

// Update progress circle
function updateProgress() {
    const radius = window.innerWidth <= 480 ? 85 : 100;
    const circumference = 2 * Math.PI * radius;
    const progress = remainingSeconds / totalSeconds;
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;
}

// Timer tick
function tick() {
    remainingSeconds--;
    timeDisplay.textContent = formatTime(remainingSeconds);
    updateProgress();
    
    // Play gong when timer ends
    if (remainingSeconds === 0) {
        clearInterval(timerInterval);
        playGong();
        progressRing.classList.remove('pulse');
        
        // Show completion state
        setTimeout(() => {
            timeDisplay.textContent = '00:00';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            resetBtn.style.display = 'inline-block';
        }, 100);
    }
    
    // Warning gong at 10 seconds
    if (remainingSeconds === 10) {
        playGong();
    }
}

// Start timer
function startTimer() {
    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;
    
    totalSeconds = minutes * 60 + seconds;

    // Preload audio during user gesture so playback is allowed later
    preloadGong();

    if (totalSeconds === 0) {
        alert('Ställ in en tid större än 0');
        return;
    }
    
    remainingSeconds = totalSeconds;
    
    // Switch views
    setupView.style.display = 'none';
    timerView.classList.add('active');
    
    // Update display
    timeDisplay.textContent = formatTime(remainingSeconds);
    updateProgress();
    
    // Show controls
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    resetBtn.style.display = 'inline-block';
    
    // Start pulsing animation
    progressRing.classList.add('pulse');
    
    // Start countdown
    timerInterval = setInterval(tick, 1000);
}

// Pause timer
function pauseTimer() {
    if (isPaused) {
        // Resume
        timerInterval = setInterval(tick, 1000);
        pauseBtn.querySelector('.btn-text').textContent = 'Paus';
        progressRing.classList.add('pulse');
        isPaused = false;
    } else {
        // Pause
        clearInterval(timerInterval);
        pauseBtn.querySelector('.btn-text').textContent = 'Fortsätt';
        progressRing.classList.remove('pulse');
        isPaused = true;
    }
}

// Reset timer
function resetTimer() {
    clearInterval(timerInterval);
    isPaused = false;
    
    // Reset views
    setupView.style.display = 'block';
    timerView.classList.remove('active');
    
    // Reset controls
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    pauseBtn.querySelector('.btn-text').textContent = 'Paus';
    
    // Reset progress
    progressRing.classList.remove('pulse');
    progressCircle.style.strokeDashoffset = 0;
}

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Allow Enter key to start
minutesInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startTimer();
});

secondsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startTimer();
});
