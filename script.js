(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Welcome
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

  // Theme
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

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Modal
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
        if (welcome && welcome.classList.contains("is-open")) {
          closeWelcome({ remember: !!(welcomeRemember && welcomeRemember.checked) });
        } else {
          closeModal();
        }
      }
    });
  }

  const photoGrid = $("#photoGrid");
  const photoGridEmpty = $("#photoGridEmpty");
  let galleryFirstApply = true;

  const setActiveFilterButton = (filterButtons, activeBtn) => {
    filterButtons.forEach((b) => {
      const isActive = b === activeBtn;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const animateVisiblePhotos = (filter) => {
    const visible = photoFigures.filter((fig) => (fig.getAttribute("data-category") || "") === filter);
    if (prefersReducedMotion) {
      visible.forEach((fig) => fig.classList.add("photo--show"));
      return;
    }
    if (galleryFirstApply) {
      galleryFirstApply = false;
      visible.forEach((fig) => fig.classList.add("photo--show"));
      return;
    }
    visible.forEach((fig) => fig.classList.remove("photo--show"));
    visible.forEach((fig, i) => {
      window.setTimeout(() => fig.classList.add("photo--show"), i * 52);
    });
  };

  const applyFilter = (filter, filterButtons) => {
    photoFigures.forEach((fig) => {
      const cat = fig.getAttribute("data-category") || "";
      const shouldShow = cat === filter;
      fig.classList.toggle("is-hidden", !shouldShow);
      if (!shouldShow) fig.classList.remove("photo--show");
    });

    const visibleCount = photoFigures.filter((f) => !f.classList.contains("is-hidden")).length;
    if (photoGridEmpty && photoGrid) {
      const empty = visibleCount === 0;
      photoGridEmpty.hidden = !empty;
      photoGrid.hidden = empty;
    }

    animateVisiblePhotos(filter);

    if (filterButtons) {
      const activeBtn = filterButtons.find((b) => (b.getAttribute("data-filter") || "") === filter);
      if (activeBtn) setActiveFilterButton(filterButtons, activeBtn);
    }
  };

  const galleryFilters = $("#galleryFilters");
  if (galleryFilters) {
    const filterButtons = $$("[data-filter]", galleryFilters);
    const defaultFilter = "portrait";

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-filter") || defaultFilter;
        setActiveFilterButton(filterButtons, btn);
        applyFilter(filter, null);
      });
    });

    applyFilter(defaultFilter, filterButtons);
  }

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

  // Trust cards: subtle follow + press
  const trustCards = $$("[data-trust-card]");
  trustCards.forEach((card) => {
    const inner = card.querySelector(".trust-card__inner");
    if (!inner) return;

    const reset = () => {
      inner.style.setProperty("--tx", "0px");
      inner.style.setProperty("--ty", "0px");
    };

    if (!prefersReducedMotion) {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (e.clientY - cy) / (rect.height / 2);
        const dx = Math.max(-5, Math.min(5, nx * 5));
        const dy = Math.max(-5, Math.min(5, ny * 5));
        inner.style.setProperty("--tx", `${dx}px`);
        inner.style.setProperty("--ty", `${dy}px`);
      });
      card.addEventListener("mouseleave", reset);
    }

    const press = () => {
      card.classList.add("is-pressed");
      window.setTimeout(() => card.classList.remove("is-pressed"), 360);
    };
    card.addEventListener("mousedown", press);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        press();
      }
    });
  });

  // Scroll reveal
  const revealEls = $$("[data-reveal]");
  if (revealEls.length && !prefersReducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-inview");
            io.unobserve(en.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-inview"));
  }

  // Contact form
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
      const timeoutId = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch("https://formsubmit.co/ajax/mik-viktor@yandex.ru", {
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
            "Сервис отправки временно недоступен. Попробуйте позже или свяжитесь по почте mik-viktor@yandex.ru / телефону +7 (985) 997-54-72."
        );
      } finally {
        window.clearTimeout(timeoutId);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText || "Отправить";
        }
      }
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      const target = e.target;
      if (target && target.getAttribute && target.getAttribute("data-close") !== null) {
        closeModal();
      }
    });
  }

  if (modal) {
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "ArrowLeft") showPhotoByOffset(-1);
      if (e.key === "ArrowRight") showPhotoByOffset(1);
    });
  }

  // Мягкое свечение в зонах с классом .text-glow-zone (следует за курсором, чуть сильнее при движении)
  const glowZones = $$(".text-glow-zone");
  if (glowZones.length && !prefersReducedMotion) {
    glowZones.forEach((zone) => {
      let lastX = 0;
      let lastY = 0;
      let lastT = performance.now();
      zone.addEventListener("mouseenter", (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = performance.now();
        const r = zone.getBoundingClientRect();
        const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
        const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
        zone.style.setProperty("--gx", `${x.toFixed(2)}%`);
        zone.style.setProperty("--gy", `${y.toFixed(2)}%`);
        zone.classList.add("is-glow-active");
      });
      zone.addEventListener("mousemove", (e) => {
        const r = zone.getBoundingClientRect();
        const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
        const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
        zone.style.setProperty("--gx", `${x.toFixed(2)}%`);
        zone.style.setProperty("--gy", `${y.toFixed(2)}%`);

        const t = performance.now();
        const dt = Math.max(10, t - lastT);
        const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = t;
        const boost = Math.min(1, 0.32 + speed * 5.5);
        zone.style.setProperty("--glow-boost", String(boost));
        zone.classList.add("is-glow-active");
      });
      zone.addEventListener("mouseleave", () => {
        zone.classList.remove("is-glow-active");
      });
    });
  }
})();
