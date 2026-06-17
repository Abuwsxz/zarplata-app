const grossInput = document.getElementById("gross");
const netEl = document.getElementById("net");
const netYearEl = document.getElementById("net-year");
const outGross = document.getElementById("out-gross");
const outTax = document.getElementById("out-tax");
const outNet = document.getElementById("out-net");
const taxHint = document.getElementById("tax-hint");
const taxButtons = document.querySelectorAll(".tax-btn");
const installBtn = document.getElementById("install-btn");
const footerNote = document.querySelector(".footer-note");
const isNativeApp = Boolean(window.Capacitor?.isNativePlatform?.());

let taxRate = 13;
let deferredInstallPrompt = null;

const formatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

function parseAmount(value) {
  const cleaned = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function formatInput(value) {
  const num = parseAmount(value);
  if (num <= 0) return "";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(num);
}

function flashResult() {
  netEl.classList.add("updating");
  requestAnimationFrame(() => {
    setTimeout(() => netEl.classList.remove("updating"), 120);
  });
}

function calculate() {
  const gross = parseAmount(grossInput.value);
  const tax = Math.round(gross * (taxRate / 100));
  const net = gross - tax;
  const netYear = net * 12;

  netEl.textContent = formatter.format(net);
  netYearEl.textContent = `${formatter.format(netYear)} в год`;
  outGross.textContent = formatter.format(gross);
  outTax.textContent = formatter.format(tax);
  outNet.textContent = formatter.format(net);

  flashResult();
}

grossInput.addEventListener("input", (e) => {
  const cursor = e.target.selectionStart;
  const before = e.target.value;
  const formatted = formatInput(before);
  e.target.value = formatted;

  const diff = formatted.length - before.length;
  const next = Math.max(0, (cursor || formatted.length) + diff);
  e.target.setSelectionRange(next, next);

  calculate();
});

taxButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    taxButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    taxRate = Number(btn.dataset.rate);

    taxHint.textContent =
      taxRate === 13
        ? "Стандартная ставка для большинства доходов"
        : "Повышенная ставка при годовом доходе свыше 5 млн ₽";

    calculate();
  });
});

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

if (isNativeApp) {
  if (installBtn) installBtn.hidden = true;
  if (footerNote) footerNote.textContent = "Android-приложение · Работает офлайн";
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

calculate();
