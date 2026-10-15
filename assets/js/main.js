/* =========================================================
   Felipe Trevisol — scripts do site (sem dependências)
   ========================================================= */
(() => {
  "use strict";

  const WHATSAPP_NUMBER = "5545999469868";
  const root = document.documentElement;
  root.classList.add("js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktopQuery = window.matchMedia("(min-width: 1024px)");

  /* ---------- Header: fundo e sombra ao fixar ---------- */
  const header = document.querySelector("[data-header]");
  const topbar = document.querySelector(".topbar");

  const updateHeader = () => {
    if (!header) return;
    const limit = topbar ? topbar.offsetHeight : 0;
    header.classList.toggle("is-stuck", window.scrollY > limit + 4);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Menu mobile acessível ---------- */
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const backdrop = document.querySelector("[data-menu-backdrop]");
  const inertTargets = [
    document.querySelector("main"),
    document.querySelector(".footer"),
    document.querySelector(".topbar"),
    document.querySelector("[data-whatsapp-float]")
  ].filter(Boolean);

  const isMenuOpen = () => menuToggle && menuToggle.getAttribute("aria-expanded") === "true";

  const setMenu = (open, { returnFocus = false } = {}) => {
    if (!menuToggle || !menu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menu.classList.toggle("is-open", open);
    if (backdrop) backdrop.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    inertTargets.forEach((element) => {
      if (open) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
    });

    if (open) {
      const firstLink = menu.querySelector("a");
      if (firstLink) firstLink.focus();
    } else if (returnFocus) {
      menuToggle.focus();
    }
  };

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => setMenu(!isMenuOpen()));
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a") && isMenuOpen()) setMenu(false);
    });
    if (backdrop) backdrop.addEventListener("click", () => setMenu(false, { returnFocus: true }));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMenuOpen()) setMenu(false, { returnFocus: true });
    });
    desktopQuery.addEventListener("change", (event) => {
      if (event.matches && isMenuOpen()) setMenu(false);
    });
  }

  /* ---------- Animações de entrada ---------- */
  const revealItems = [...document.querySelectorAll("[data-reveal]")];

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const group = entry.target.parentElement ? [...entry.target.parentElement.children].filter((el) => el.hasAttribute("data-reveal")) : [];
        const index = Math.max(0, group.indexOf(entry.target));
        entry.target.style.transitionDelay = `${Math.min(index, 4) * 0.1}s`;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ---------- FAQ: apenas uma resposta aberta por vez ---------- */
  const faqItems = [...document.querySelectorAll("[data-faq] details")];
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item && other.open) other.open = false;
      });
    });
  });

  /* ---------- Formulário de triagem ---------- */
  const form = document.querySelector("[data-triage-form]");

  if (form) {
    const status = form.querySelector("[data-form-status]");
    const counter = form.querySelector("[data-counter]");
    const fields = {
      nome: form.elements.nome,
      telefone: form.elements.telefone,
      cidade: form.elements.cidade,
      area: form.elements.area,
      resumo: form.elements.resumo,
      consentimento: form.elements.consentimento
    };

    const onlyDigits = (value) => value.replace(/\D/g, "");
    const clean = (value) => value.replace(/\s+/g, " ").trim();

    const formatPhone = (value) => {
      let digits = onlyDigits(value);
      if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
      digits = digits.slice(0, 11);
      if (digits.length <= 2) return digits.length ? `(${digits}` : "";
      if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    };

    const validators = {
      nome: (field) => {
        const value = clean(field.value);
        if (!value) return "Informe seu nome completo.";
        if (value.length < 3 || value.split(" ").length < 2) return "Informe nome e sobrenome.";
        return "";
      },
      telefone: (field) => {
        const digits = onlyDigits(field.value);
        if (!digits) return "Informe um telefone para contato.";
        if (digits.length < 10 || digits.length > 13) return "Informe um telefone válido com DDD.";
        return "";
      },
      cidade: (field) => {
        const value = clean(field.value);
        if (!value) return "Informe sua cidade e estado.";
        if (value.length < 3) return "Informe a cidade e o estado (ex.: Cascavel/PR).";
        return "";
      },
      area: (field) => (field.value ? "" : "Selecione a área relacionada ao caso."),
      resumo: (field) => {
        const value = field.value.trim();
        if (!value) return "Escreva um breve resumo do caso.";
        if (value.length < 20) return "Escreva um pouco mais (mínimo de 20 caracteres).";
        if (value.length > 1000) return "O resumo deve ter no máximo 1000 caracteres.";
        return "";
      },
      consentimento: (field) => (field.checked ? "" : "É necessário autorizar o uso das informações para continuar.")
    };

    const showError = (name, message) => {
      const field = fields[name];
      const error = document.getElementById(`${field.id}-erro`);
      if (message) {
        field.setAttribute("aria-invalid", "true");
        if (error) { error.textContent = message; error.hidden = false; }
      } else {
        field.removeAttribute("aria-invalid");
        if (error) { error.textContent = ""; error.hidden = true; }
      }
    };

    const validateField = (name) => {
      const message = validators[name](fields[name]);
      showError(name, message);
      return !message;
    };

    const setStatus = (type, html) => {
      if (!status) return;
      status.className = `form-status field--full${type ? ` is-${type}` : ""}`;
      status.innerHTML = html;
    };

    const updateCounter = () => {
      if (counter) counter.textContent = String(fields.resumo.value.length);
    };

    fields.telefone.addEventListener("input", () => {
      fields.telefone.value = formatPhone(fields.telefone.value);
    });

    fields.resumo.addEventListener("input", updateCounter);
    updateCounter();

    Object.keys(fields).forEach((name) => {
      const field = fields[name];
      const eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "blur";
      field.addEventListener(eventName, () => {
        if (field.type !== "checkbox" && field.tagName !== "SELECT" && !field.value && !field.hasAttribute("aria-invalid")) return;
        validateField(name);
      });
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(name);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const invalid = Object.keys(fields).filter((name) => !validateField(name));

      if (invalid.length) {
        setStatus("error", "Revise os campos obrigatórios antes de continuar.");
        fields[invalid[0]].focus();
        return;
      }

      const message = [
        "Olá, Dr. Felipe! Gostaria de solicitar um atendimento.",
        "",
        `Nome: ${clean(fields.nome.value)}`,
        `Telefone: ${clean(fields.telefone.value)}`,
        `Cidade/Estado: ${clean(fields.cidade.value)}`,
        `Área relacionada: ${fields.area.value}`,
        "",
        "Resumo do caso:",
        fields.resumo.value.trim(),
        "",
        "Enviei essas informações pelo formulário do site."
      ].join("\n");

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

      setStatus(
        "success",
        `<span>Você será direcionado ao WhatsApp para concluir o envio. Se a conversa não abrir, <a href="${url}" target="_blank" rel="noopener noreferrer">toque aqui para abrir o WhatsApp</a>.</span>`
      );

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    /* Botões "Falar sobre esta área" pré-selecionam a área */
    document.querySelectorAll("[data-area]").forEach((button) => {
      button.addEventListener("click", () => {
        const area = button.getAttribute("data-area");
        const option = [...fields.area.options].find((opt) => opt.value === area || opt.text === area);
        if (option) {
          fields.area.value = option.value;
          showError("area", "");
        }
        window.setTimeout(() => fields.nome.focus({ preventScroll: true }), reducedMotion ? 0 : 700);
      });
    });
  }

  /* ---------- Botão flutuante: some sobre o formulário ---------- */
  const floatButton = document.querySelector("[data-whatsapp-float]");
  const triageSection = document.getElementById("triagem");

  const heroSection = document.querySelector(".hero");

  if (floatButton && "IntersectionObserver" in window) {
    const hiddenBy = new Set();
    const floatObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const ratioNeeded = entry.target === heroSection ? 0.35 : 0;
        if (entry.isIntersecting && entry.intersectionRatio > ratioNeeded) hiddenBy.add(entry.target);
        else hiddenBy.delete(entry.target);
      });
      floatButton.classList.toggle("is-hidden", hiddenBy.size > 0);
    }, { threshold: [0, 0.05, 0.35, 0.5] });
    [heroSection, triageSection].filter(Boolean).forEach((section) => floatObserver.observe(section));
  }
})();
