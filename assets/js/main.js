/**
* Template Name: iLanding
* Template URL: https://bootstrapmade.com/ilanding-bootstrap-landing-page-template/
* Updated: Nov 12 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Integration configuration (update when keys/endpoints are ready)
   */
  const integrationDefaults = {
    googleCloud: {
      defaultEndpoint: "",
      // TODO: add real endpoints when cloud project goes live
      endpoints: {
        grant_application: "",
        support_donation: "",
        golf_registration: "",
        golf_sponsorship: "",
        golf_bbq: ""
      },
      apiKey: "",
      authToken: "",
      headers: {}
    },
    contact: {
      endpoint: "",
      apiKey: "",
      authToken: "",
      headers: {}
    },
    mailchimp: {
      formAction: "",
      hiddenFields: {
        u: "",
        id: "",
        f_id: ""
      }
    }
  };

  // remember: keep secrets out of this file
  const integrations = window.EFBRIntegrations || integrationDefaults;
  window.EFBRIntegrations = integrations;

  function ensureStatus(form) {
    let status = form.querySelector(".form-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "form-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      form.appendChild(status);
    }
    return status;
  }

  function setStatus(form, message, type) {
    const status = ensureStatus(form);
   status.textContent = message;
    status.classList.remove("is-success", "is-error", "is-pending");
    if (type) {
      status.classList.add(`is-${type}`);
    }
  }

  function setInlineState(form, state, message) {
    const loading = form.querySelector(".loading");
    const error = form.querySelector(".error-message");
    const success = form.querySelector(".sent-message");

    if (loading) {
      loading.classList.toggle("d-block", state === "loading");
    }
    if (error) {
      error.classList.toggle("d-block", state === "error");
      if (state === "error" && message) {
        error.textContent = message;
      }
    }
    if (success) {
      success.classList.toggle("d-block", state === "success");
      if (state === "success" && message) {
        success.textContent = message;
      }
    }
  }

  function formDataToObject(form) {
    const data = new FormData(form);
    const payload = {};
    data.forEach((value, key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        if (!Array.isArray(payload[key])) {
          payload[key] = [payload[key]];
        }
        payload[key].push(value);
      } else {
        payload[key] = value;
      }
    });
    payload.form_name = form.dataset.formName || form.getAttribute("name") || form.id || "form";
    payload.page_url = window.location.href;
    payload.timestamp = new Date().toISOString();
    return payload;
  }

  function applyHiddenFields(form, fields) {
    Object.entries(fields || {}).forEach(([name, value]) => {
      if (!value) return;
      let input = form.querySelector(`input[name="${name}"]`);
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.appendChild(input);
      }
      input.value = value;
    });
  }

  async function submitJsonForm(form, endpoint, headers) {
    const payload = formDataToObject(form);
   const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed: ${response.status}`);
    }
    return response;
  }

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    // note: keeps header styling consistent on scroll
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
   document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );
      // todo: revisit carousel speed if sponsors request it

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Donation amount selector (Support Us page)
   */
  const donateSection = document.querySelector('.donate-section');
  if (donateSection) {
    const amountButtons = donateSection.querySelectorAll('.donate-chip');
    const otherInput = donateSection.querySelector('#donate-other');
    const selectedDisplay = donateSection.querySelector('#donate-selected-display');
    const paypalDisplay = donateSection.querySelector('#paypal-amount-display');
    const amountField = donateSection.querySelector('#donation-amount');
    // note: default button controls initial amount
    const defaultButton = donateSection.querySelector('.donate-chip.active') || amountButtons[0];
    let lastChipAmount = defaultButton ? defaultButton.dataset.amount : null;

    function formatAmount(value) {
      return '$' + value.toLocaleString('en-US', {
        minimumFractionDigits: value % 1 ? 2 : 0,
        maximumFractionDigits: 2
      });
    }

    function clearActiveButtons() {
      amountButtons.forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
    }

    function setAmount(value, source) {
      const amount = parseFloat(value);
      if (!Number.isFinite(amount) || amount <= 0) return;
      const formatted = formatAmount(amount);

      if (selectedDisplay) selectedDisplay.textContent = formatted;
      if (paypalDisplay) paypalDisplay.textContent = formatted;
      if (amountField) amountField.value = amount.toFixed(2);

      if (source === 'chip') {
        amountButtons.forEach((btn) => {
          const isActive = btn.dataset.amount === String(value);
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        if (otherInput) otherInput.value = '';
      } else {
        clearActiveButtons();
      }
    }

    if (defaultButton) {
      setAmount(defaultButton.dataset.amount, 'chip');
    }

    amountButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        lastChipAmount = btn.dataset.amount;
        setAmount(btn.dataset.amount, 'chip');
      });
    });

    if (otherInput) {
      otherInput.addEventListener('input', () => {
        if (!otherInput.value) {
          if (lastChipAmount) {
            setAmount(lastChipAmount, 'chip');
          }
          return;
        }
        setAmount(otherInput.value, 'input');
      });
    }
  }

  /**
   * Golf outing pricing summaries
   */
  const golfOutingPage = document.querySelector('.golf-outing-page');
  if (golfOutingPage) {
    const formatCurrency = (value) => {
      const amount = Number(value) || 0;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: amount % 1 ? 2 : 0,
        maximumFractionDigits: 2
      }).format(amount);
    };

    const registrationSelect = document.querySelector('#golf-registration-type');
    const registrationQty = document.querySelector('#golf-registration-qty');
    const registrationTotal = document.querySelector('#golf-total');
    const registrationUnit = document.querySelector('#golf-unit');
    const registrationAmount = document.querySelector('#golf-amount');

  const updateRegistrationTotal = () => {
    if (!registrationSelect || !registrationQty) return;
    const option = registrationSelect.options[registrationSelect.selectedIndex];
    const price = parseFloat(option.dataset.price || 0);
    const unitLabel = option.dataset.unit || 'per registrant';
    // note: qty stays at least 1 to avoid zero totals
    const qty = Math.max(1, parseInt(registrationQty.value || 1, 10));
      const total = price * qty;
      if (registrationUnit) {
        registrationUnit.textContent = `${formatCurrency(price)} ${unitLabel}`;
      }
      if (registrationTotal) {
        registrationTotal.textContent = formatCurrency(total);
      }
      if (registrationAmount) {
        registrationAmount.value = total.toFixed(2);
      }
    };

    if (registrationSelect) {
      registrationSelect.addEventListener('change', updateRegistrationTotal);
    }
    if (registrationQty) {
      registrationQty.addEventListener('input', updateRegistrationTotal);
    }
    updateRegistrationTotal();

    const sponsorSelect = document.querySelector('#sponsor-level');
    const sponsorAmountInput = document.querySelector('#sponsor-amount');
    const sponsorTotal = document.querySelector('#sponsor-total');
    const sponsorAmountHidden = document.querySelector('#sponsor-amount-hidden');

    const updateSponsorTotal = () => {
      if (!sponsorAmountInput) return;
      const amount = Math.max(0, parseFloat(sponsorAmountInput.value || 0));
      if (sponsorTotal) {
        sponsorTotal.textContent = formatCurrency(amount);
      }
      if (sponsorAmountHidden) {
        sponsorAmountHidden.value = amount.toFixed(2);
      }
    };

    const updateSponsorAmountFromSelect = () => {
      if (!sponsorSelect || !sponsorAmountInput) return;
      const option = sponsorSelect.options[sponsorSelect.selectedIndex];
      const amount = parseFloat(option.dataset.amount || 0);
      if (Number.isFinite(amount) && amount > 0) {
        sponsorAmountInput.value = amount;
      }
      updateSponsorTotal();
    };

    if (sponsorSelect) {
      sponsorSelect.addEventListener('change', updateSponsorAmountFromSelect);
    }
    if (sponsorAmountInput) {
      sponsorAmountInput.addEventListener('input', updateSponsorTotal);
    }
    updateSponsorAmountFromSelect();
  }

  /**
   * Integration-ready form handlers
   */
  document.querySelectorAll('form[data-form-service="gcloud"]').forEach((form) => {
    // note: gcloud endpoint mapping is controlled by data-form-name
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const endpointKey = form.dataset.formName || "";
      const endpoint =
        integrations.googleCloud.endpoints[endpointKey] ||
        integrations.googleCloud.defaultEndpoint;

      if (!endpoint) {
        setInlineState(form, "error", "Submission is not connected yet. Add the Google Cloud endpoint to enable this form.");
        setStatus(form, "Submission is not connected yet. Add the Google Cloud endpoint to enable this form.", "pending");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      setInlineState(form, "loading");
      setStatus(form, "Submitting...", "pending");

      const headers = {
        ...integrations.googleCloud.headers
      };
      if (integrations.googleCloud.apiKey) {
        headers["x-api-key"] = integrations.googleCloud.apiKey;
      }
      if (integrations.googleCloud.authToken) {
        headers["Authorization"] = `Bearer ${integrations.googleCloud.authToken}`;
      }

      try {
        await submitJsonForm(form, endpoint, headers);
        setInlineState(form, "success", "Thanks! We received your submission.");
        setStatus(form, "Thanks! We received your submission.", "success");
        form.reset();
      } catch (error) {
        setInlineState(form, "error", error.message || "Submission failed.");
        setStatus(form, error.message || "Submission failed.", "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  });

  document.querySelectorAll('form[data-form-service="contact"]').forEach((form) => {
    // todo: add captcha hook if spam becomes an issue
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (!integrations.contact.endpoint) {
        setInlineState(form, "error", "Contact service is not connected yet. Add the SMTP endpoint to enable this form.");
        setStatus(form, "Contact service is not connected yet. Add the SMTP endpoint to enable this form.", "pending");
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      setInlineState(form, "loading");
      setStatus(form, "Sending...", "pending");

      const headers = {
        ...integrations.contact.headers
      };
      if (integrations.contact.apiKey) {
        headers["x-api-key"] = integrations.contact.apiKey;
      }
      if (integrations.contact.authToken) {
        headers["Authorization"] = `Bearer ${integrations.contact.authToken}`;
      }

      try {
        await submitJsonForm(form, integrations.contact.endpoint, headers);
        setInlineState(form, "success", "Your message has been sent. Thank you!");
        setStatus(form, "Your message has been sent. Thank you!", "success");
        form.reset();
      } catch (error) {
        setInlineState(form, "error", error.message || "Message failed to send.");
        setStatus(form, error.message || "Message failed to send.", "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  });

  document.querySelectorAll('form[data-form-service="mailchimp"]').forEach((form) => {
    const config = integrations.mailchimp;
    if (config.formAction) {
      // note: hidden fields come from Mailchimp embed
      form.setAttribute("action", config.formAction);
      form.setAttribute("method", "post");
      form.setAttribute("novalidate", "novalidate");
      applyHiddenFields(form, config.hiddenFields);
    } else {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        setStatus(form, "Mailchimp integration is not connected yet. Add the form action URL to enable signups.", "pending");
      });
    }
  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        // note: small delay keeps layout settled before scroll
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();
