(function() {
  "use strict";

  // ----- CONFIGURATION -----
  const SCREEN1_FADE_MS = 800;
  const SCREEN2_FADE_DELAY_MS = 250;

  const PARTICLE1_COUNT = 60;
  const PARTICLE2_COUNT = 28;

  const TYPE_SPEED = 80;
  const PAUSE_AFTER_TYPE = 900;
  const DELETE_SPEED = 40;
  const PAUSE_AFTER_DELETE = 600;
  const TYPING_STRING = "Academy Under Construction";

  // DOM elements
  const screen1 = document.getElementById('screen1');
  const screen2 = document.getElementById('screen2');
  const headline1 = document.getElementById('headline1');
  const particles1 = document.getElementById('particles1');
  const particles2 = document.getElementById('particles2');
  const typedHeadlineEl = document.getElementById('typed-headline');

  // State
  let typingLoopTimeout = null;
  let isScreen2Active = false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- PARTICLES GENERATION -----
  function createParticles(container, type, count) {
    if (!container) return;
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = `particle ${type === 'dot' ? 'particle-dot' : 'particle-bar'}`;
      
      // Random horizontal position
      const left = Math.random() * 100;
      particle.style.left = left + '%';
      
      // Random animation duration and delay
      const duration = type === 'dot' ? (6 + Math.random() * 10) : (3 + Math.random() * 5);
      const delay = Math.random() * 4;
      
      // Random horizontal drift
      const driftX = (Math.random() - 0.5) * 40;
      particle.style.animation = `floatUp ${duration}s linear ${delay}s infinite`;
      particle.style.setProperty('--drift', driftX + 'px');
      
      fragment.appendChild(particle);
    }
    
    container.appendChild(fragment);
  }

  // Initialize particles for screen 1
  createParticles(particles1, 'dot', PARTICLE1_COUNT);

  // Generate particles for screen 2 (only when needed)
  function generateParticles2() {
    if (particles2.children.length === 0) {
      createParticles(particles2, 'bar', PARTICLE2_COUNT);
    }
  }

  // ----- TYPING LOOP -----
  function startTypingLoop() {
    if (!typedHeadlineEl) return;
    if (typingLoopTimeout) clearTimeout(typingLoopTimeout);

    // If user prefers reduced motion, just show full text
    if (prefersReducedMotion) {
      typedHeadlineEl.textContent = TYPING_STRING;
      typedHeadlineEl.style.borderRight = 'none';
      return;
    }

    let index = 0;
    let isDeleting = false;

    function updateTyping() {
      const full = TYPING_STRING;
      
      if (!isDeleting) {
        // Typing forward
        if (index < full.length) {
          typedHeadlineEl.textContent = full.substring(0, index + 1);
          index++;
          typingLoopTimeout = setTimeout(updateTyping, TYPE_SPEED);
        } else {
          // Finished typing, pause then delete
          isDeleting = true;
          typingLoopTimeout = setTimeout(updateTyping, PAUSE_AFTER_TYPE);
        }
      } else {
        // Deleting
        if (index > 0) {
          index--;
          typedHeadlineEl.textContent = full.substring(0, index);
          typingLoopTimeout = setTimeout(updateTyping, DELETE_SPEED);
        } else {
          // Fully deleted, pause then restart
          isDeleting = false;
          typingLoopTimeout = setTimeout(updateTyping, PAUSE_AFTER_DELETE);
        }
      }
    }

    // Start the loop
    typedHeadlineEl.textContent = '';
    index = 0;
    isDeleting = false;
    updateTyping();
  }

  function stopTypingLoop() {
    if (typingLoopTimeout) {
      clearTimeout(typingLoopTimeout);
      typingLoopTimeout = null;
    }
  }

  // ----- TRANSITION: SCREEN 1 -> SCREEN 2 -----
  function activateScreen2() {
    if (isScreen2Active) return;
    isScreen2Active = true;

    // Fade out screen 1
    screen1.style.opacity = '0';
    screen1.style.pointerEvents = 'none';

    setTimeout(() => {
      // Hide screen 1 completely
      screen1.classList.add('hidden');
      
      // Generate and show screen 2 particles
      generateParticles2();
      particles2.style.opacity = '1';
      
      // Show screen 2
      screen2.style.opacity = '1';
      screen2.style.pointerEvents = 'auto';

      // Start typing after a short buffer
      setTimeout(() => {
        startTypingLoop();
      }, SCREEN2_FADE_DELAY_MS);
    }, SCREEN1_FADE_MS);
  }

  // ----- EVENT LISTENERS FOR HEADLINE -----
  function onHeadlineActivate(e) {
    // Handle keyboard events (Enter or Space)
    if (e.type === 'keydown') {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // Prevent page scroll on space
    }
    
    // Prevent double-firing on touch devices
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    
    activateScreen2();
  }

  // Add event listeners
  headline1.addEventListener('click', onHeadlineActivate);
  headline1.addEventListener('touchstart', onHeadlineActivate, { passive: false });
  headline1.addEventListener('keydown', onHeadlineActivate);

  // ----- PERFORMANCE OPTIMIZATION FOR LOW-MEMORY DEVICES -----
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    setTimeout(() => {
      // Reduce particle count for screen 1
      createParticles(particles1, 'dot', 30);
      
      // Override screen 2 particle generation to use fewer particles
      const originalGen = generateParticles2;
      generateParticles2 = function() {
        if (particles2.children.length === 0) {
          createParticles(particles2, 'bar', 15);
        }
      };
    }, 100);
  }

  // Ensure screen 2 is not interactive until activated
  screen2.style.pointerEvents = 'none';
})();
