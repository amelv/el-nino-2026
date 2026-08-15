function initAccordions(root) {
  root.querySelectorAll("[data-accordion-trigger]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const expanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!expanded));
      const panel = document.getElementById(trigger.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = expanded;
        panel.classList.toggle("is-open", !expanded);
      }
      const indicator = trigger.querySelector("[data-accordion-indicator]");
      if (indicator) indicator.textContent = expanded ? "+" : "−";
    });
  });
}

initAccordions(document);
