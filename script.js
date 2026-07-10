/**
 * B. Abishek & K. Kamali Jenifer
 * Christian Wedding Invitation Website Script
 */

document.addEventListener('DOMContentLoaded', () => {

    // Add loading class to body during loader screen
    document.body.classList.add('loading');

    // ==========================================
    // 1. LOADER SCREEN & AOS INITIALIZATION
    // ==========================================
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        const appContent = document.getElementById('app-content');
        
        // Remove hidden-content class to reveal page
        appContent.classList.remove('hidden-content');
        appContent.classList.add('fade-in');
        
        // Let the loader fade out
        setTimeout(() => {
            loader.classList.add('fade-out');
            document.body.classList.remove('loading');
            
            // Trigger AOS animations after loader is gone
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100,
                easing: 'ease-out-quad'
            });
            
            // Enable petals animation
            initPetalsCanvas();
        }, 1200);
    });

    // ==========================================
    // 2. BACK TO TOP BUTTON
    // ==========================================
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Handle scroll buttons navigation
    const scrollButtons = document.querySelectorAll('.btn-scroll');
    scrollButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('href');
            const targetSec = document.querySelector(targetId);
            if (targetSec) {
                targetSec.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ==========================================
    // 3. WEB AUDIO API - CLASSICAL CANON IN D SYNTH
    // ==========================================
    const musicBtn = document.getElementById('music-btn');
    const musicWaves = document.getElementById('music-waves');
    
    let audioCtx = null;
    let isPlaying = false;
    let synthInterval = null;
    let synthDelayNode = null;
    let synthMasterGain = null;
    
    // Notes frequencies (Hz) for Pachelbel's Canon in D progression
    const notes = {
        'D2': 73.42,  'D3': 146.83,  'D4': 293.66,  'D5': 587.33,
        'A2': 110.00, 'A3': 220.00,  'A4': 440.00,  'A5': 880.00,
        'B2': 123.47, 'B3': 246.94,  'B4': 493.88,  'B5': 987.77,
        'F#2': 92.50, 'F#3': 185.00, 'F#4': 369.99, 'F#5': 739.99,
        'G2': 98.00,  'G3': 196.00,  'G4': 392.00,  'G5': 783.99,
        'C#3': 138.59, 'C#4': 277.18, 'C#5': 554.37, 'C#6': 1108.73,
        'E3': 164.81,  'E4': 329.63,  'E5': 659.25,  'E6': 1318.51,
        'A5_octave': 880.00
    };

    // Progression of 8 Chords in Canon in D
    const progression = [
        { bass: 'D2', arpeggio: ['D3', 'F#3', 'A3', 'D4'], melody: 'F#5' },
        { bass: 'A2', arpeggio: ['A2', 'C#3', 'E3', 'A3'], melody: 'E5' },
        { bass: 'B2', arpeggio: ['B2', 'D3', 'F#3', 'B3'], melody: 'D5' },
        { bass: 'F#2', arpeggio: ['F#2', 'A2', 'C#3', 'F#3'], melody: 'C#5' },
        { bass: 'G2', arpeggio: ['G2', 'B2', 'D3', 'G3'], melody: 'B4' },
        { bass: 'D2', arpeggio: ['D2', 'F#2', 'A2', 'D3'], melody: 'A4' },
        { bass: 'G2', arpeggio: ['G2', 'B2', 'D3', 'G3'], melody: 'B4' },
        { bass: 'A2', arpeggio: ['A2', 'C#3', 'E3', 'A3'], melody: 'C#5' }
    ];

    let currentStep = 0;
    let tickCount = 0;

    function initAudio() {
        if (audioCtx) return;
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        // Master Gain
        synthMasterGain = audioCtx.createGain();
        synthMasterGain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Gentle soft volume
        
        // Reverb/Delay unit for Cathedral feel
        synthDelayNode = audioCtx.createDelay(1.0);
        synthDelayNode.delayTime.setValueAtTime(0.35, audioCtx.currentTime);
        
        const delayFeedback = audioCtx.createGain();
        delayFeedback.gain.setValueAtTime(0.4, audioCtx.currentTime); // Echo feedback
        
        // Connect feedback loops
        synthDelayNode.connect(delayFeedback);
        delayFeedback.connect(synthDelayNode);
        
        // Connections
        synthMasterGain.connect(audioCtx.destination);
        synthMasterGain.connect(synthDelayNode);
        synthDelayNode.connect(audioCtx.destination);
    }

    // Custom synthesis engine for a soft piano/plucked string sound
    function playTone(freq, startTime, duration, type = 'triangle', volume = 0.25) {
        if (!audioCtx) return;
        
        const osc = audioCtx.createOscillator();
        const oscBright = audioCtx.createOscillator(); // Subharmonic
        const gainNode = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        
        // Add octave higher sine wave for extra sparkle
        oscBright.type = 'sine';
        oscBright.frequency.setValueAtTime(freq * 2, startTime);
        
        // Gain Envelope (Soft Pluck/Piano decay)
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02); // Quick Attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Exp Decay
        
        // Connect
        osc.connect(gainNode);
        oscBright.connect(gainNode);
        gainNode.connect(synthMasterGain);
        
        // Start & Stop
        osc.start(startTime);
        oscBright.start(startTime);
        osc.stop(startTime + duration);
        oscBright.stop(startTime + duration);
    }

    // Sequencer tick function (tempo: 76 BPM)
    function tick() {
        if (!audioCtx || audioCtx.state === 'suspended') return;
        
        const time = audioCtx.currentTime;
        const beatDuration = 0.78; // 76 BPM -> ~0.78s per beat
        const chordIndex = currentStep % 8;
        const chordData = progression[chordIndex];
        
        // 1. Play Bass Note on beat 1 (every 4 beats)
        if (tickCount % 4 === 0) {
            playTone(notes[chordData.bass], time, beatDuration * 3.5, 'sine', 0.28);
        }
        
        // 2. Play Arpeggio pattern
        const noteIndex = tickCount % 4;
        const noteName = chordData.arpeggio[noteIndex];
        playTone(notes[noteName], time, beatDuration * 1.5, 'triangle', 0.12);
        
        // 3. Play Melody Line (starts after first cycle, i.e., step >= 8)
        if (currentStep >= 8 && tickCount % 4 === 0) {
            playTone(notes[chordData.melody], time + 0.1, beatDuration * 2.8, 'sine', 0.14);
        }
        
        tickCount++;
        if (tickCount % 4 === 0) {
            currentStep++;
        }
    }

    function startMusic() {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        isPlaying = true;
        musicBtn.classList.add('playing');
        
        // Schedule ticks
        const beatDuration = 780; // ms
        synthInterval = setInterval(tick, beatDuration);
        // Play first tick immediately
        tick();
    }

    function stopMusic() {
        isPlaying = false;
        musicBtn.classList.remove('playing');
        if (synthInterval) {
            clearInterval(synthInterval);
            synthInterval = null;
        }
        if (audioCtx) {
            audioCtx.suspend();
        }
    }

    function toggleMusic() {
        if (isPlaying) {
            stopMusic();
        } else {
            startMusic();
        }
    }

    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMusic();
    });

    // Start music on first click anywhere in the page (to satisfy autoplay restrictions)
    const playOnFirstClick = () => {
        if (!isPlaying) {
            startMusic();
        }
        document.removeEventListener('click', playOnFirstClick);
    };
    document.addEventListener('click', playOnFirstClick);


    // ==========================================
    // 4. HERO SECTION - PARALLAX EFFECT
    // ==========================================
    const heroSection = document.getElementById('hero');
    const parallaxBg = document.querySelector('.hero-bg-parallax');
    
    window.addEventListener('scroll', () => {
        const scrollOffset = window.scrollY;
        if (scrollOffset < window.innerHeight) {
            // Parallax scroll: bg moves slower than content
            parallaxBg.style.transform = `translateY(${scrollOffset * 0.35}px)`;
        }
    });


    // ==========================================
    // 5. LIVE COUNTDOWN TIMER
    // ==========================================
    const countdownTarget = new Date('August 22, 2026 10:00:00 GMT+0530').getTime();
    
    const daysVal = document.getElementById('days');
    const hoursVal = document.getElementById('hours');
    const minutesVal = document.getElementById('minutes');
    const secondsVal = document.getElementById('seconds');
    
    function updateCountdown() {
        const now = new Date().getTime();
        const difference = countdownTarget - now;
        
        if (difference < 0) {
            // Target date passed
            document.getElementById('timer').innerHTML = "<div class='countdown-tagline white-text' style='font-size: 1.5rem;'>Happy Wedding Day! K. Kamali Jenifer & B. Abishek!</div>";
            clearInterval(timerInterval);
            return;
        }
        
        // Calculations
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // Formatter (adds leading zero)
        daysVal.textContent = days < 10 ? '0' + days : days;
        hoursVal.textContent = hours < 10 ? '0' + hours : hours;
        minutesVal.textContent = minutes < 10 ? '0' + minutes : minutes;
        secondsVal.textContent = seconds < 10 ? '0' + seconds : seconds;
    }
    
    updateCountdown(); // Run immediately
    const timerInterval = setInterval(updateCountdown, 1000);





    // ==========================================
    // 8. CANVAS-BASED FLOATING PETALS ANIMATION
    // ==========================================
    function initPetalsCanvas() {
        const canvas = document.getElementById('petals-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        const petals = [];
        const maxPetals = 45; // Gentle balance
        
        // Resize listener
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });
        
        class Petal {
            constructor() {
                this.reset();
                this.y = Math.random() * height - height; // Start off-screen top
            }
            
            reset() {
                this.x = Math.random() * width;
                this.y = -20;
                this.size = Math.random() * 8 + 8; // Size: 8 to 16px
                this.speedY = Math.random() * 1.2 + 0.8; // Fall speed
                this.speedX = Math.random() * 1.5 - 0.75; // Drift speed
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 1.5 - 0.75;
                this.opacity = Math.random() * 0.4 + 0.4; // Opacity 0.4 - 0.8
                // 15% chance to be gold dust, otherwise blush pink
                this.isGold = Math.random() < 0.15;
            }
            
            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y / 30) * 0.3; // Swaying effect
                this.rotation += this.rotationSpeed;
                
                // Reset petal if it falls below canvas boundary
                if (this.y > height + 20 || this.x < -20 || this.x > width + 20) {
                    this.reset();
                }
            }
            
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                
                ctx.beginPath();
                // Draw leaf/petal curvature shape
                ctx.moveTo(0, -this.size / 2);
                ctx.quadraticCurveTo(-this.size, -this.size / 4, -this.size / 2, this.size / 2);
                ctx.quadraticCurveTo(0, this.size, this.size / 2, this.size / 2);
                ctx.quadraticCurveTo(this.size, -this.size / 4, 0, -this.size / 2);
                
                if (this.isGold) {
                    // Luxurious Gold
                    const grad = ctx.createLinearGradient(-this.size/2, -this.size/2, this.size/2, this.size/2);
                    grad.addColorStop(0, `rgba(223, 186, 115, ${this.opacity})`);
                    grad.addColorStop(1, `rgba(197, 160, 89, ${this.opacity})`);
                    ctx.fillStyle = grad;
                } else {
                    // Soft Blush Pink
                    const grad = ctx.createLinearGradient(-this.size/2, -this.size/2, this.size/2, this.size/2);
                    grad.addColorStop(0, `rgba(245, 214, 214, ${this.opacity})`);
                    grad.addColorStop(1, `rgba(232, 197, 200, ${this.opacity})`);
                    ctx.fillStyle = grad;
                }
                
                ctx.fill();
                ctx.restore();
            }
        }
        
        // Spawn petals
        for (let i = 0; i < maxPetals; i++) {
            petals.push(new Petal());
        }
        
        // Animation Loop
        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            petals.forEach(petal => {
                petal.update();
                petal.draw();
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
    }

});
