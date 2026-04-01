(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Welcome landing screen
  const welcome = $("#welcome");
  const welcomeEnter = $("#welcomeEnter");
  const welcomeToContact = $("#welcomeToContact");
  const welcomeRemember = $("#welcomeRemember");
  const welcomeCloseEls = $$("[data-welcome-close]");
  const WELCOME_STORAGE_KEY = "welcome-hidden";

  const openWelcome = () => {
    if (!welcome) return;
    welcome.classList.add("is-open");
    welcome.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (welcomeEnter) welcomeEnter.focus();
  };

  const closeWelcome = ({ remember = false } = {}) => {
    if (!welcome) return;
    welcome.classList.remove("is-open");
    welcome.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (remember) localStorage.setItem(WELCOME_STORAGE_KEY, "1");
    sessionStorage.setItem("welcome-seen", "1");
  };

  // Show only when not hidden permanently and not yet seen in current tab
  const shouldShowWelcome =
    !!welcome &&
    localStorage.getItem(WELCOME_STORAGE_KEY) !== "1" &&
    sessionStorage.getItem("welcome-seen") !== "1";

  if (shouldShowWelcome) openWelcome();

  welcomeCloseEls.forEach((el) => {
    el.addEventListener("click", () => {
      closeWelcome({ remember: !!(welcomeRemember && welcomeRemember.checked) });
    });
  });
  if (welcomeEnter) {
    welcomeEnter.addEventListener("click", () => {
      closeWelcome({ remember: !!(welcomeRemember && welcomeRemember.checked) });
    });
  }
  if (welcomeToContact) {
    welcomeToContact.addEventListener("click", () => {
      closeWelcome({ remember: !!(welcomeRemember && welcomeRemember.checked) });
    });
  }

  // Theme toggle (dark/light) with persistence
  const themeToggle = $("#themeToggle");
  const STORAGE_THEME_KEY = "site-theme";
  const rootEl = document.documentElement;
  const preferredTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  const initialTheme = localStorage.getItem(STORAGE_THEME_KEY) || preferredTheme;

  const applyTheme = (theme) => {
    rootEl.setAttribute("data-theme", theme);
    if (themeToggle) {
      const isLight = theme === "light";
      themeToggle.textContent = isLight ? "☀️" : "🌙";
      themeToggle.setAttribute("aria-label", isLight ? "Включить тёмную тему" : "Включить светлую тему");
      themeToggle.setAttribute("title", isLight ? "Включить тёмную тему" : "Включить светлую тему");
    }
  };

  applyTheme(initialTheme);
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = rootEl.getAttribute("data-theme") || "dark";
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
      localStorage.setItem(STORAGE_THEME_KEY, nextTheme);
    });
  }

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Modal image viewer
  const modal = $("#modal");
  const modalImg = $("#modalImg");
  const modalCaption = $("#modalCaption");
  const closeButtons = $$("[data-close]", modal);
  const photoFigures = $$("#photoGrid .photo");
  const photoButtons = $$("#photoGrid .photo__btn");
  let activePhotoIndex = -1;

  const openModal = ({ src, caption }) => {
    if (!modal || !modalImg) return;
    const cleanCaption = String(caption || "").replace(/\s+\d+$/, "").trim();
    modalImg.src = src;
    modalImg.alt = cleanCaption || "Фото";
    modalCaption.textContent = cleanCaption || "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    // Clear to avoid screen readers reading old alt
    if (modalImg) modalImg.removeAttribute("src");
  };

  photoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activePhotoIndex = photoButtons.indexOf(btn);
      openModal({
        src: btn.getAttribute("data-full"),
        caption: btn.getAttribute("data-caption"),
      });
    });
  });

  closeButtons.forEach((btn) => btn.addEventListener("click", closeModal));
  if (modal) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // If welcome is open — close it first, otherwise close modal
        if (welcome && welcome.classList.contains("is-open")) {
          closeWelcome({ remember: !!(welcomeRemember && welcomeRemember.checked) });
        } else {
          closeModal();
        }
      }
    });
  }

  // Gallery filters
  const galleryFilters = $("#galleryFilters");
  if (galleryFilters) {
    const filterButtons = $$("[data-filter]", galleryFilters);

    const setActiveFilterButton = (activeBtn) => {
      filterButtons.forEach((b) => {
        const isActive = b === activeBtn;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };

    const applyFilter = (filter) => {
      photoFigures.forEach((fig) => {
        const cat = fig.getAttribute("data-category") || "all";
        const shouldShow = filter === "all" || cat === filter;
        fig.classList.toggle("is-hidden", !shouldShow);
      });
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveFilterButton(btn);
        applyFilter(btn.getAttribute("data-filter") || "all");
      });
    });
  }

  // Modal navigation with keyboard (←/→) through currently visible photos
  const getVisibleButtons = () =>
    photoButtons.filter((btn) => {
      const fig = btn.closest(".photo");
      return fig && !fig.classList.contains("is-hidden");
    });

  const showPhotoByOffset = (dir) => {
    if (!modal || !modal.classList.contains("is-open")) return;
    const visible = getVisibleButtons();
    if (visible.length === 0) return;

    const currentBtn = photoButtons[activePhotoIndex];
    const currentVisibleIndex = Math.max(0, visible.indexOf(currentBtn));
    const nextVisibleIndex = (currentVisibleIndex + dir + visible.length) % visible.length;
    const nextBtn = visible[nextVisibleIndex];
    activePhotoIndex = photoButtons.indexOf(nextBtn);

    openModal({
      src: nextBtn.getAttribute("data-full"),
      caption: nextBtn.getAttribute("data-caption"),
    });
  };

  // Contact form: background submit for any visitor (no mail client required).
  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправка...";
      }

      const formData = new FormData(contactForm);
      const payload = {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        message: String(formData.get("message") || ""),
        _subject: String(formData.get("_subject") || "Новая заявка с сайта фотографа"),
        _captcha: "false",
        _template: "table",
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch("https://formsubmit.co/ajax/toursol8@gmail.com", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        alert("Сообщение отправлено. Спасибо! Я свяжусь с вами в ближайшее время.");
        contactForm.reset();
      } catch (err) {
        const statusMessage = err && err.message ? ` (${err.message})` : "";
        alert(
          `Не удалось отправить сообщение через форму${statusMessage}. ` +
          "Сервис отправки временно недоступен. Попробуйте еще раз чуть позже или свяжитесь по почте toursol8@gmail.com / телефону +7 (985) 997-54-72."
        );
      } finally {
        clearTimeout(timeoutId);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText || "Отправить";
        }
      }
    });
  }

  // Close modal on click outside dialog (overlay already has data-close, but keep it safe)
  if (modal) {
    modal.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.getAttribute && target.getAttribute("data-close") !== null) {
        closeModal();
      }
    });
  }

  // Keyboard navigation (left/right) while modal is open
  if (modal) {
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "ArrowLeft") showPhotoByOffset(-1);
      if (e.key === "ArrowRight") showPhotoByOffset(1);
    });
  }
})();

