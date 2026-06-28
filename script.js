const details = {
  bride: "Priya",
  groom: "Jay",
  dateLabel: "08.07.26",
  countdownTarget: "2026-07-08T12:00:00",
  mapUrl: "https://maps.google.com",
};

const hasGsap = typeof window.gsap !== "undefined";
let scratchReady = false;

function setText(selector, text) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = text;
  });
}

function hydrateDetails() {
  setText("[data-bride]", details.bride);
  setText("[data-groom]", details.groom);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === id);
  });

  const active = document.getElementById(id);
  if (hasGsap) {
    gsap.fromTo(active, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, ease: "power2.out" });
  }

  observeReveals(active);

  if (id === "invite-screen") {
    if (!scratchReady) {
      window.setTimeout(setupScratchCard, 80);
    }
    if (typeof ScrollTrigger !== "undefined") {
      window.setTimeout(() => ScrollTrigger.refresh(), 100);
    }
  }
}

function beginIntro() {
  const video = document.getElementById("intro-video");
  video.style.cursor = "default";

  video.playbackRate = 2;
  video.play().catch((e) => console.error("Video playback failed:", e));

  video.addEventListener("ended", () => {
    const card = document.getElementById("intro-card");
    if (hasGsap) {
      const timeline = gsap.timeline();
      timeline
        .set(card, { className: "intro-card is-visible", attr: { "aria-hidden": "false" } })
        .fromTo(card, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out" })
        .fromTo(".intro-card > *", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.8, ease: "power2.out" }, 0.15);
    } else {
      card.classList.add("is-visible");
      card.setAttribute("aria-hidden", "false");
      card.style.opacity = "1";
    }
  });
}

function updateCountdown() {
  const target = new Date(details.countdownTarget).getTime();
  const distance = Math.max(0, target - Date.now());
  const units = {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000),
  };

  Object.entries(units).forEach(([unit, value]) => {
    const node = document.querySelector(`[data-count="${unit}"]`);
    if (node) {
      node.textContent = String(value).padStart(2, "0");
    }
  });
}

function observeReveals(root = document) {
  const revealItems = root.querySelectorAll(".reveal:not(.in-view)");

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupScratchCard() {
  const canvas = document.getElementById("scratch-canvas");
  const card = document.getElementById("scratch-card");
  if (!canvas || !card) {
    return;
  }

  const context = canvas.getContext("2d", { willReadFrequently: true });
  let drawing = false;

  function paintCover() {
    const rect = card.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#b3cde3");
    gradient.addColorStop(0.42, "#f4f8fc");
    gradient.addColorStop(0.72, "#90b4ce");
    gradient.addColorStop(1, "#334e68");
    context.globalCompositeOperation = "source-over";
    context.fillStyle = gradient;
    context.fillRect(0, 0, rect.width, rect.height);
    context.fillStyle = "rgba(255,255,255,0.32)";
    for (let i = 0; i < 520; i += 1) {
      context.fillRect(Math.random() * rect.width, Math.random() * rect.height, Math.random() * 3, 1);
    }
    context.fillStyle = "#334e68";
    context.font = `700 ${Math.max(15, rect.width * 0.045)}px Georgia, serif`;
    context.textAlign = "center";
    context.fillText("Scratch to Reveal", rect.width / 2, rect.height / 2 + 5);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const pointer = event.touches ? event.touches[0] : event;
    return {
      x: pointer.clientX - rect.left,
      y: pointer.clientY - rect.top,
    };
  }

  function scratch(event) {
    if (!drawing) {
      return;
    }

    event.preventDefault();
    const point = pointerPosition(event);
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(point.x, point.y, 28, 0, Math.PI * 2);
    context.fill();

    const image = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < image.length; i += 4) {
      if (image[i] < 128) {
        cleared += 1;
      }
    }

    if (cleared / (image.length / 4) > 0.5) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      burst(window.innerWidth / 2, window.innerHeight * 0.55);
    }
  }

  paintCover();
  scratchReady = true;
  window.addEventListener("resize", paintCover);

  canvas.addEventListener("mousedown", () => {
    drawing = true;
  });
  canvas.addEventListener("mouseup", () => {
    drawing = false;
  });
  canvas.addEventListener("mouseleave", () => {
    drawing = false;
  });
  canvas.addEventListener("mousemove", scratch);
  canvas.addEventListener("touchstart", () => {
    drawing = true;
  }, { passive: true });
  canvas.addEventListener("touchend", () => {
    drawing = false;
  }, { passive: true });
  canvas.addEventListener("touchmove", scratch, { passive: false });
}

function burst(x, y) {
  const colors = ["#90b4ce", "#334e68", "#f4f8fc", "#ffffff", "#5294c1"];
  for (let i = 0; i < 36; i += 1) {
    const spark = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 90;
    spark.className = "spark";
    spark.style.setProperty("--x", `${x}px`);
    spark.style.setProperty("--y", `${y}px`);
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    spark.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
    document.body.appendChild(spark);
    window.setTimeout(() => spark.remove(), 950);
  }
}

function spawnButterflies(event) {
  if (event.target.closest("button") || event.target.closest("[data-no-butterfly]") || event.target.closest("canvas")) {
    return;
  }

  const colors = ["#5294c1", "#334e68", "#90b4ce", "#7aafdb", "#b3cde3"];
  for (let i = 0; i < 2; i += 1) {
    const butterfly = document.createElement("span");
    const side = i === 0 ? -1 : 1;
    butterfly.className = "butterfly";
    butterfly.style.setProperty("--start-x", `${event.clientX + (Math.random() - 0.5) * 18}px`);
    butterfly.style.setProperty("--start-y", `${event.clientY + (Math.random() - 0.5) * 18}px`);
    butterfly.style.setProperty("--size", `${36 + Math.random() * 12}px`);
    butterfly.style.setProperty("--wing", colors[Math.floor(Math.random() * colors.length)]);
    butterfly.style.setProperty("--fly-x", `${side * (90 + Math.random() * 120)}px`);
    butterfly.style.setProperty("--fly-y", `${-(150 + Math.random() * 220)}px`);
    butterfly.style.setProperty("--rotate", `${side * (20 + Math.random() * 20)}deg`);
    butterfly.style.setProperty("--duration", `${2 + Math.random() * 0.7}s`);
    document.body.appendChild(butterfly);
    window.setTimeout(() => butterfly.remove(), 3000);
  }
}

function openMemories() {
  const button = document.getElementById("memories-button");
  const rect = button.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  window.setTimeout(() => showScreen("memory-screen"), 720);
}

function setupChoiceToggle() {
  const toggle = document.getElementById("choice-toggle");
  const note = document.getElementById("choice-note");
  if (!toggle || !note) {
    return;
  }

  function toggleChoice() {
    const isBoy = toggle.classList.toggle("is-boy");
    note.textContent = isBoy ? "Boy side says forever starts with one brave yes." : "Girl side says love wins softly.";
  }

  toggle.addEventListener("click", toggleChoice);
  toggle.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleChoice();
    }
  });
}



document.addEventListener("DOMContentLoaded", () => {
  hydrateDetails();
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  const video = document.getElementById("intro-video");
  const isPortrait = window.innerHeight > window.innerWidth;
  video.src = isPortrait ? "source-video/bg-ph.mp4" : "source-video/bg-16.mp4";
  video.style.cursor = "pointer";
  video.addEventListener("click", beginIntro, { once: true });

  document.getElementById("explore-button").addEventListener("click", () => showScreen("invite-screen"));
  document.getElementById("map-button").addEventListener("click", () => window.open(details.mapUrl, "_blank"));
  document.getElementById("memories-button").addEventListener("click", openMemories);
  document.getElementById("back-button").addEventListener("click", () => showScreen("invite-screen"));

  document.getElementById("invite-scroll").addEventListener("click", spawnButterflies);
  document.getElementById("memory-scroll").addEventListener("click", spawnButterflies);
  setupChoiceToggle();
});
