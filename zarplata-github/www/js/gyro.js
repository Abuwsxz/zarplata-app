const scene = document.getElementById("scene");
const gyroBtn = document.getElementById("gyro-btn");
const layers = scene ? [...scene.querySelectorAll(".layer[data-depth]")] : [];

let enabled = false;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
let rafId = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function needsPermission() {
  return (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  );
}

function supportsOrientation() {
  return "DeviceOrientationEvent" in window;
}

function applyTransforms() {
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  layers.forEach((layer) => {
    const depth = parseFloat(layer.dataset.depth) || 0;
    const moveX = currentX * depth * 40;
    const moveY = currentY * depth * 40;
    layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
  });

  if (enabled) {
    rafId = requestAnimationFrame(applyTransforms);
  }
}

function onOrientation(event) {
  const gamma = event.gamma ?? 0;
  const beta = event.beta ?? 0;

  targetX = Math.max(-1, Math.min(1, gamma / 30));
  targetY = Math.max(-1, Math.min(1, (beta - 45) / 30));
}

function enableGyro() {
  if (enabled || prefersReducedMotion) return;

  enabled = true;
  document.body.classList.remove("no-gyro");
  window.addEventListener("deviceorientation", onOrientation, true);

  if (!rafId) {
    rafId = requestAnimationFrame(applyTransforms);
  }

  if (gyroBtn) {
    gyroBtn.hidden = true;
  }
}

async function requestAccess() {
  if (needsPermission()) {
    try {
      const state = await DeviceOrientationEvent.requestPermission();
      if (state === "granted") {
        enableGyro();
      }
    } catch {
      /* user declined */
    }
    return;
  }

  enableGyro();
}

function initGyro() {
  if (prefersReducedMotion || !supportsOrientation()) {
    document.body.classList.add("no-gyro");
    return;
  }

  if (needsPermission()) {
    document.body.classList.add("no-gyro");
    if (gyroBtn) {
      gyroBtn.hidden = false;
      gyroBtn.addEventListener("click", requestAccess);
    }
    return;
  }

  enableGyro();
}

initGyro();
