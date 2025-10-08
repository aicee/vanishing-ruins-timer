(function () {
  const DURATION_SECONDS = 60;

  const timers = Array.from(document.querySelectorAll('.timer')).map(
    (timerElement) => ({
      element: timerElement,
      display: timerElement.querySelector('.timer-display'),
      duration: DURATION_SECONDS,
      remaining: DURATION_SECONDS,
      intervalId: null,
      flashTimeout: null,
    })
  );

  let audioContext = null;

  function ensureAudioContext() {
    const AudioContextConstructor =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioContextConstructor();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    return audioContext;
  }

  function playCompletionSound() {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.45);

    oscillator.addEventListener('ended', () => {
      oscillator.disconnect();
      gain.disconnect();
    });
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateDisplay(timer) {
    timer.display.textContent = formatTime(timer.remaining);
  }

  function clearTimer(timer) {
    if (timer.intervalId !== null) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }
    if (timer.flashTimeout !== null) {
      clearTimeout(timer.flashTimeout);
      timer.flashTimeout = null;
    }
  }

  function removeHighlight(timer) {
    timer.element.classList.remove('expired');
  }

  function startTimer(index) {
    const timer = timers[index];
    if (!timer) return;

    clearTimer(timer);
    removeHighlight(timer);

    timer.remaining = timer.duration;
    updateDisplay(timer);

    ensureAudioContext();

    timer.intervalId = window.setInterval(() => {
      timer.remaining -= 1;
      if (timer.remaining <= 0) {
        timer.remaining = 0;
        updateDisplay(timer);
        finishTimer(timer);
      } else {
        updateDisplay(timer);
      }
    }, 1000);
  }

  function finishTimer(timer) {
    clearTimer(timer);
    timer.element.classList.add('expired');
    playCompletionSound();
    timer.flashTimeout = window.setTimeout(() => {
      removeHighlight(timer);
      timer.flashTimeout = null;
    }, 1000);
  }

  document.addEventListener('keydown', (event) => {
    if (['1', '2', '3'].includes(event.key)) {
      const index = Number(event.key) - 1;
      startTimer(index);
    }
  });

  timers.forEach((timer, index) => {
    updateDisplay(timer);
    timer.element.addEventListener('click', () => {
      startTimer(index);
    });
    timer.element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        startTimer(index);
      }
    });
  });
})();
