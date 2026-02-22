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
      defaultEndpoint: "https://script.google.com/macros/s/AKfycbzWFScvKQyBYWnPIcVj17wUF0XsGBITJz3TdKl-DgeeARrzpnUxn2nZDLkKyRD2HaX4PA/exec",
      endpoints: {
        grant_application: "https://script.google.com/macros/s/AKfycbzWFScvKQyBYWnPIcVj17wUF0XsGBITJz3TdKl-DgeeARrzpnUxn2nZDLkKyRD2HaX4PA/exec?action=grant_application",
        support_donation: "https://script.google.com/macros/s/AKfycbzWFScvKQyBYWnPIcVj17wUF0XsGBITJz3TdKl-DgeeARrzpnUxn2nZDLkKyRD2HaX4PA/exec?action=support_donation",
        golf_registration: "https://script.google.com/macros/s/AKfycbzWFScvKQyBYWnPIcVj17wUF0XsGBITJz3TdKl-DgeeARrzpnUxn2nZDLkKyRD2HaX4PA/exec?action=precheckout",
        golf_sponsorship: "https://script.google.com/macros/s/AKfycbzWFScvKQyBYWnPIcVj17wUF0XsGBITJz3TdKl-DgeeARrzpnUxn2nZDLkKyRD2HaX4PA/exec?action=precheckout",
        golf_bbq: "https://script.google.com/macros/s/AKfycbzWFScvKQyBYWnPIcVj17wUF0XsGBITJz3TdKl-DgeeARrzpnUxn2nZDLkKyRD2HaX4PA/exec?action=precheckout"
      },
      apiKey: "",
      authToken: "",
      headers: {}
    },
    contact: {
      endpoint: "https://script.google.com/macros/s/AKfycbzWFScvKQyBYWnPIcVj17wUF0XsGBITJz3TdKl-DgeeARrzpnUxn2nZDLkKyRD2HaX4PA/exec?action=contact",
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

  async function submitJsonForm(form, endpoint, headers, payloadOverride) {
    const payload = payloadOverride || formDataToObject(form);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        // Use simple request content type for Apps Script web apps (avoids CORS preflight)
        "Content-Type": "text/plain;charset=utf-8",
        ...headers
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseJson = null;
    try {
      responseJson = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      responseJson = null;
    }

    if (!response.ok) {
      throw new Error((responseJson && responseJson.error) || responseText || `Request failed: ${response.status}`);
    }
    if (responseJson && responseJson.ok === false) {
      throw new Error(responseJson.error || "Submission failed.");
    }

    return responseJson || response;
  }

  function getNotificationIssue(result) {
    if (!result || typeof result !== "object" || !result.notification) return "";
    const notification = result.notification;
    if (notification.sent === false) {
      return notification.error || notification.reason || "email notification failed";
    }
    return "";
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
   * Golf outing checkout forms
   */
  const golfOutingPage = document.querySelector('.golf-outing-page');
  if (golfOutingPage) {
    const precheckoutForms = golfOutingPage.querySelectorAll('form[data-form-service="precheckout"]');

    function getGoogleCloudHeaders() {
      const headers = {
        ...integrations.googleCloud.headers
      };
      if (integrations.googleCloud.apiKey) {
        headers["x-api-key"] = integrations.googleCloud.apiKey;
      }
      if (integrations.googleCloud.authToken) {
        headers["Authorization"] = `Bearer ${integrations.googleCloud.authToken}`;
      }
      return headers;
    }

    function resolvePrecheckoutEndpoint(form) {
      const formName = String(form.dataset.formName || "").toLowerCase();
      let endpointKey = "";
      if (formName.indexOf("registration") !== -1) endpointKey = "golf_registration";
      if (formName.indexOf("sponsorship") !== -1) endpointKey = "golf_sponsorship";
      if (formName.indexOf("bbq") !== -1) endpointKey = "golf_bbq";

      const mappedEndpoint = endpointKey ? integrations.googleCloud.endpoints[endpointKey] : "";
      if (mappedEndpoint) return mappedEndpoint;

      const base = integrations.googleCloud.defaultEndpoint || "";
      if (!base) return "";
      if (base.indexOf("action=") !== -1) return base;
      return base.indexOf("?") === -1 ? `${base}?action=precheckout` : `${base}&action=precheckout`;
    }

    function readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read uploaded logo file."));
        reader.readAsDataURL(file);
      });
    }

    function clearStatus(form) {
      const status = form.querySelector(".form-status");
      if (!status) return;
      status.textContent = "";
      status.classList.remove("is-success", "is-error", "is-pending");
    }

    function resetSubmissionConfirmation(form) {
      const confirmation = form.querySelector(".submission-confirmation");
      if (confirmation) {
        confirmation.classList.add("d-none");
      }
    }

    function hideCardPayPalWrappers(form) {
      const card = form.closest(".golf-pay-card, .bbq-card");
      if (!card) return;
      card.querySelectorAll("[data-paypal-wrapper]").forEach((wrapper) => {
        wrapper.classList.add("d-none");
      });
    }

    function setupImagePreview(input) {
      const previewSelector = input.dataset.imagePreviewTarget || "";
      if (!previewSelector) return;
      const preview = document.querySelector(previewSelector);
      if (!preview) return;
      const wrapperSelector = input.dataset.imagePreviewWrap || "";
      const wrapper = wrapperSelector
        ? document.querySelector(wrapperSelector)
        : preview.closest(".sponsor-logo-preview-wrap");

      const clearPreview = () => {
        preview.removeAttribute("src");
        if (wrapper) {
          wrapper.classList.add("d-none");
        }
      };

      input.addEventListener("change", () => {
        const file = input.files && input.files[0] ? input.files[0] : null;
        if (!file || !file.type.startsWith("image/")) {
          clearPreview();
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          preview.src = String(reader.result || "");
          if (wrapper) {
            wrapper.classList.remove("d-none");
          }
        };
        reader.onerror = clearPreview;
        reader.readAsDataURL(file);
      });
    }

    async function renderHostedButton(wrapper) {
      if (!wrapper) return;
      if (wrapper.dataset.rendered === "true") return;
      const buttonId = wrapper.dataset.paypalButtonId || "";
      const containerSelector = wrapper.dataset.paypalContainer || "";
      if (!buttonId || !containerSelector) return;
      if (!window.paypal || !window.paypal.HostedButtons) {
        throw new Error("PayPal failed to load. Refresh the page and try again.");
      }
      await window.paypal.HostedButtons({
        hostedButtonId: buttonId
      }).render(containerSelector);
      wrapper.dataset.rendered = "true";
    }

    function getSelectMetadata(form) {
      const select = form.querySelector("[data-paypal-selector-source]");
      if (!select) {
        return {
          paypalButtonId: form.dataset.paypalButtonId || "",
          paypalTarget: form.dataset.paypalTarget || "",
          amount: form.dataset.amount || "",
          optionLabel: "",
          hasSelect: false
        };
      }

      const selected = select.options[select.selectedIndex];
      if (!selected) {
        return {
          paypalButtonId: "",
          paypalTarget: "",
          amount: "",
          optionLabel: "",
          hasSelect: true
        };
      }

      return {
        paypalButtonId: selected.dataset.paypalButtonId || "",
        paypalTarget: selected.dataset.paypalTarget || "",
        amount: selected.dataset.amount || "",
        optionLabel: selected.value || selected.textContent || "",
        hasSelect: true
      };
    }

    golfOutingPage.querySelectorAll('input[type="file"][data-image-preview-target]').forEach((input) => {
      setupImagePreview(input);
    });

    precheckoutForms.forEach((form) => {
      const select = form.querySelector("[data-paypal-selector-source]");
      if (select) {
        select.addEventListener("change", () => {
          clearStatus(form);
          resetSubmissionConfirmation(form);
          hideCardPayPalWrappers(form);
        });
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        clearStatus(form);
        resetSubmissionConfirmation(form);
        hideCardPayPalWrappers(form);

        const selectMeta = getSelectMetadata(form);
        if (!selectMeta.paypalButtonId || !selectMeta.paypalTarget) {
          setStatus(form, "Select a checkout option to continue.", "error");
          return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
        }
        setStatus(form, "Saving details and loading PayPal/Venmo checkout...", "pending");

        try {
          const precheckoutEndpoint = resolvePrecheckoutEndpoint(form);
          if (!precheckoutEndpoint) {
            throw new Error("Pre-checkout endpoint is not configured.");
          }

          const payload = formDataToObject(form);
          if (payload.logoFile && typeof payload.logoFile === "object") {
            delete payload.logoFile;
          }
          payload.checkoutType = form.dataset.checkoutType || payload.checkoutType || "";
          payload.paypalButtonId = selectMeta.paypalButtonId;
          payload.amount = selectMeta.amount || form.dataset.amount || payload.amount || "";
          payload.checkoutOption = selectMeta.optionLabel || "";
          payload.pageUrl = window.location.href;
          payload.userAgent = navigator.userAgent || "";

          const logoInput = form.querySelector('input[type="file"][name="logoFile"]');
          const logoFile = logoInput && logoInput.files && logoInput.files[0] ? logoInput.files[0] : null;
          if (logoFile && logoFile.type.startsWith("image/")) {
            payload.logoFilename = logoFile.name;
            payload.logoDataUrl = await readFileAsDataUrl(logoFile);
          }

          await submitJsonForm(form, precheckoutEndpoint, getGoogleCloudHeaders(), payload);

          const wrapper = document.querySelector(selectMeta.paypalTarget);
          if (!wrapper) {
            throw new Error("Unable to load checkout for this option.");
          }

          wrapper.classList.remove("d-none");
          await renderHostedButton(wrapper);
          wrapper.scrollIntoView({ behavior: "smooth", block: "center" });

          const confirmation = form.querySelector(".submission-confirmation");
          if (confirmation) {
            confirmation.classList.remove("d-none");
          } else {
            setStatus(form, "Checkout is ready. Complete payment to confirm your order.", "success");
          }
        } catch (error) {
          setStatus(form, error.message || "Failed to load checkout.", "error");
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
          }
        }
      });
    });
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
        const result = await submitJsonForm(form, endpoint, headers);
        const notificationIssue = getNotificationIssue(result);
        setInlineState(form, "success", "Thanks! We received your submission.");
        if (notificationIssue) {
          setStatus(form, `Submission saved, but notification email failed: ${notificationIssue}`, "pending");
        } else {
          setStatus(form, "Thanks! We received your submission.", "success");
        }
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
        const result = await submitJsonForm(form, integrations.contact.endpoint, headers);
        const notificationIssue = getNotificationIssue(result);
        setInlineState(form, "success", "Your message has been sent. Thank you!");
        if (notificationIssue) {
          setStatus(form, `Message saved, but notification email failed: ${notificationIssue}`, "pending");
        } else {
          setStatus(form, "Your message has been sent. Thank you!", "success");
        }
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
