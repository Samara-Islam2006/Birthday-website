const enterBtn = document.querySelector("#enterBtn");
const finalBtn = document.querySelector("#finalBtn");
const finalMessage = document.querySelector("#finalMessage");
const loader = document.querySelector("#loader");
const music = document.querySelector("#bgMusic");
const musicToggle = document.querySelector("#musicToggle");
const musicText = musicToggle.querySelector(".music-text");
const musicIcon = musicToggle.querySelector(".music-icon");
const muteToggle = document.querySelector("#muteToggle");
const muteText = muteToggle.querySelector(".mute-text");
const soundEffects = {
  click: document.querySelector("#clickSound"),
  hover: document.querySelector("#hoverSound"),
  chime: document.querySelector("#chimeSound"),
  typewriter: document.querySelector("#typeSound")
};
const typewriter = document.querySelector("[data-typewriter]");
const revealSections = document.querySelectorAll(".reveal");
const quizButtons = document.querySelectorAll(".options button");
const countdownParts = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds")
};
const confettiColors = ["#fff3a8", "#ff9fb8", "#91d183", "#78c7ff", "#ffc88f", "#9bd477"];
const confettiShapes = ["confetti--square", "confetti--heart", "confetti--star"];
let fadeTimer;
let soundMuted = false;
let audioContext;
let lastHoverSound = 0;
let lastTypeSound = 0;
let musicStarted = false;

function setSoundMuted(muted) {
  soundMuted = muted;
  music.muted = muted;

  Object.values(soundEffects).forEach(sound => {
    if (sound) {
      sound.muted = muted;
    }
  });

  muteToggle.classList.toggle("is-muted", muted);
  muteToggle.setAttribute("aria-label", muted ? "Unmute all sound" : "Mute all sound");
  muteText.textContent = muted ? "Muted" : "Sound On";
}

async function startMusicSoftly() {
  if (musicStarted || soundMuted) {
    return;
  }

  music.volume = 0;

  try {
    await music.play();
    musicStarted = true;
    musicToggle.classList.add("is-playing");
    musicToggle.setAttribute("aria-label", "Pause background music");
    musicText.textContent = "Pause Music";
    musicIcon.textContent = "II";
    fadeMusic(0.52);
  } catch (error) {
    musicStarted = false;
  }
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return null;
    }

    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function playFallbackTone(name, volume) {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const toneMap = {
    hover: [660, 0.045],
    click: [440, 0.06],
    typewriter: [760, 0.035],
    chime: [740, 0.18]
  };
  const [frequency, duration] = toneMap[name] || toneMap.click;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(volume * 0.12, context.currentTime + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);

  if (name === "chime") {
    setTimeout(() => playFallbackTone("hover", volume * 0.7), 95);
  }
}

function playSound(name, volume = 0.18) {
  if (soundMuted) {
    return;
  }

  const now = Date.now();

  if (name === "hover" && now - lastHoverSound < 180) {
    return;
  }

  if (name === "typewriter" && now - lastTypeSound < 70) {
    return;
  }

  if (name === "hover") {
    lastHoverSound = now;
  }

  if (name === "typewriter") {
    lastTypeSound = now;
  }

  const sound = soundEffects[name];

  if (!sound) {
    playFallbackTone(name, volume);
    return;
  }

  sound.pause();
  sound.currentTime = 0;
  sound.volume = volume;
  sound.play().catch(() => playFallbackTone(name, volume));
}

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.18 }
);

revealSections.forEach(section => observer.observe(section));

function launchConfetti(amount = 170) {
  for (let index = 0; index < amount; index += 1) {
    const piece = document.createElement("span");
    const shape = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];

    piece.className = `confetti ${shape}`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = color;
    piece.style.color = color;
    piece.style.animationDelay = `${Math.random() * 0.9}s`;
    piece.style.scale = `${0.75 + Math.random() * 0.75}`;
    document.body.append(piece);

    setTimeout(() => piece.remove(), 4200);
  }
}

function typeText(element) {
  const text = element.dataset.typewriter || "";
  let index = 0;

  element.textContent = "";

  const timer = setInterval(() => {
    const character = text.charAt(index);
    element.textContent += character;

    if (character.trim()) {
      playSound("typewriter", 0.07);
    }

    index += 1;

    if (index >= text.length) {
      clearInterval(timer);
      element.classList.add("is-done");
    }
  }, 80);
}

function getBirthdayTarget() {
  const now = new Date();
  const pakistanParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(now);
  const pakistanYear = Number(pakistanParts.find(part => part.type === "year").value);
  const birthdayStart = Date.UTC(pakistanYear, 5, 5, 19, 0, 0);
  const birthdayEnd = Date.UTC(pakistanYear, 5, 6, 18, 59, 59);

  if (now.getTime() > birthdayEnd) {
    return new Date(Date.UTC(pakistanYear + 1, 5, 5, 19, 0, 0));
  }

  return new Date(birthdayStart);
}

function updateCountdown() {
  const now = new Date();
  const target = getBirthdayTarget();
  const distance = Math.max(0, target - now);
  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance % 86400000) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);

  countdownParts.days.textContent = String(days).padStart(2, "0");
  countdownParts.hours.textContent = String(hours).padStart(2, "0");
  countdownParts.minutes.textContent = String(minutes).padStart(2, "0");
  countdownParts.seconds.textContent = String(seconds).padStart(2, "0");
}

function fadeMusic(targetVolume, onComplete) {
  clearInterval(fadeTimer);

  fadeTimer = setInterval(() => {
    const nextVolume = music.volume + (targetVolume > music.volume ? 0.04 : -0.04);
    const reachedTarget = targetVolume > music.volume
      ? nextVolume >= targetVolume
      : nextVolume <= targetVolume;

    music.volume = reachedTarget ? targetVolume : Math.max(0, Math.min(1, nextVolume));

    if (reachedTarget) {
      clearInterval(fadeTimer);
      if (onComplete) {
        onComplete();
      }
    }
  }, 90);
}

async function toggleMusic() {
  playSound("click", 0.14);

  if (music.paused) {
    music.volume = 0;

    try {
      await music.play();
      musicStarted = true;
      musicToggle.classList.add("is-playing");
      musicToggle.setAttribute("aria-label", "Pause background music");
      musicText.textContent = "Pause Music";
      musicIcon.textContent = "II";
      fadeMusic(0.52);
    } catch (error) {
      musicText.textContent = "Add music";
      musicIcon.textContent = "!";
      setTimeout(() => {
        musicText.textContent = "Play Music";
        musicIcon.textContent = "\u266A";
      }, 2200);
    }
  } else {
    musicToggle.classList.remove("is-playing");
    musicStarted = false;
    musicToggle.setAttribute("aria-label", "Play background music");
    musicText.textContent = "Play Music";
    musicIcon.textContent = "\u266A";
    fadeMusic(0, () => music.pause());
  }
}

window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    startMusicSoftly();
    if (typewriter) {
      typeText(typewriter);
    }
  }, 900);
});

["pointerdown", "keydown"].forEach(eventName => {
  window.addEventListener(eventName, startMusicSoftly, { once: true });
});

updateCountdown();
setInterval(updateCountdown, 1000);
setSoundMuted(false);

enterBtn.addEventListener("click", () => {
  playSound("click", 0.14);
  document.querySelector("#facts").scrollIntoView({ behavior: "smooth" });
});

music.volume = 0;
music.pause();
musicToggle.addEventListener("click", toggleMusic);

muteToggle.addEventListener("click", () => {
  setSoundMuted(!soundMuted);
  if (!soundMuted) {
    playSound("chime", 0.16);
  }
});

document.querySelectorAll("button").forEach(button => {
  button.addEventListener("pointerenter", () => playSound("hover", 0.06));
});

quizButtons.forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest(".quiz-card");
    const answer = card.querySelector(".answer");

    card.querySelectorAll("button").forEach(option => option.classList.remove("is-picked"));
    button.classList.add("is-picked");
    answer.classList.add("is-visible");
    playSound("click", 0.12);
    playSound("chime", 0.14);
  });
});

finalBtn.addEventListener("click", () => {
  playSound("click", 0.14);
  playSound("chime", 0.22);
  launchConfetti();
  finalMessage.classList.add("is-visible");
  finalMessage.scrollIntoView({ behavior: "smooth" });
});
