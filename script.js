const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");
const toast = document.querySelector("#toast");
let toastTimer;

function closeMenu() {
  menuToggle.classList.remove("open");
  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Öppna meny");
}

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.classList.toggle("open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Stäng meny" : "Öppna meny");
});

navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.querySelectorAll(".competition-button").forEach((button) => {
  button.addEventListener("click", () => {
    const competition = button.dataset.competition;
    clearTimeout(toastTimer);
    toast.textContent = `Du är anmäld till ${competition}! 🎣`;
    toast.classList.add("show");
    button.textContent = "Anmäld ✓";
    button.disabled = true;
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
  });
});

document.querySelector("#currentYear").textContent = new Date().getFullYear();
