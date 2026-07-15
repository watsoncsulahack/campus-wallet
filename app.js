const toast = document.querySelector("#toast");
let toastTimer;
function showDemoMessage(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
document.querySelector("#demoButton").addEventListener("click", () => {
  document.querySelector(".wallet-card").scrollIntoView({ behavior: "smooth", block: "center" });
  showDemoMessage("This sprint is a visual prototype—no real wallet or funds are created.");
});
document.querySelectorAll("[data-demo-action]").forEach((button) => {
  button.addEventListener("click", () => showDemoMessage(`${button.dataset.demoAction} will be explored in the next sprint.`));
});
