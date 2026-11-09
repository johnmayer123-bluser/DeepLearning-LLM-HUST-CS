const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
    return;
  }

  callback();
};

ready(() => {
  document.documentElement.classList.add("js");

  const menuButton = document.querySelector(".mobile-menu-toggle");
  const navigation = document.querySelector("#primary-navigation");
  const desktopMenu = window.matchMedia("(min-width: 56rem)");

  const setMenuOpen = (open, { restoreFocus = false } = {}) => {
    if (!menuButton || !navigation) return;

    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);

    if (!open && restoreFocus) menuButton.focus();
  };

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenuOpen(false);
    });

    document.addEventListener("pointerdown", (event) => {
      if (menuButton.getAttribute("aria-expanded") !== "true") return;
      if (navigation.contains(event.target) || menuButton.contains(event.target)) return;
      setMenuOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false, { restoreFocus: true });
      }
    });

    desktopMenu.addEventListener("change", (event) => {
      if (event.matches) setMenuOpen(false);
    });
  }

  const navigationLinks = navigation
    ? [...navigation.querySelectorAll('a[href^="#"]')].filter((link) => link.hash.length > 1)
    : [];
  const observedSections = navigationLinks
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter(Boolean);

  const setCurrentSection = (sectionId) => {
    navigationLinks.forEach((link) => {
      const isCurrent = decodeURIComponent(link.hash.slice(1)) === sectionId;
      link.classList.toggle("is-active", isCurrent);

      if (isCurrent) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  if (observedSections.length && "IntersectionObserver" in window) {
    const visibleSections = new Map();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.set(entry.target.id, entry.boundingClientRect.top);
          else visibleSections.delete(entry.target.id);
        });

        if (!visibleSections.size) return;

        const [currentId] = [...visibleSections.entries()].sort((a, b) => {
          const aDistance = Math.abs(a[1]);
          const bDistance = Math.abs(b[1]);
          return aDistance - bDistance;
        })[0];
        setCurrentSection(currentId);
      },
      { rootMargin: "-22% 0px -65%", threshold: 0 }
    );

    observedSections.forEach((section) => sectionObserver.observe(section));

    window.addEventListener(
      "scroll",
      () => {
        const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        if (atPageEnd) setCurrentSection(observedSections.at(-1).id);
      },
      { passive: true }
    );
  }

  const initialSection = window.location.hash.slice(1) || observedSections[0]?.id;
  if (initialSection) setCurrentSection(decodeURIComponent(initialSection));
});
