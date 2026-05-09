const PRECHECKOUT_SHEET = "PreCheckout";
const PAYPAL_EVENTS_SHEET = "PayPalEvents";
const CONTACT_SHEET = "ContactMessages";
const GRANTS_SHEET = "GrantApplications";
const DONATIONS_SHEET = "SupportDonations";
const FORM_SUBMISSION_TOKEN = "efbr-public-form-v2";
const ALLOWED_PAGE_HOSTS = [
  "www.edfoundbr.org",
  "edfoundbr.org",
  "breducationfoundation.vercel.app",
  "localhost",
  "127.0.0.1"
];

const PRECHECKOUT_HEADERS = [
  "timestamp",
  "submission_id",
  "status",
  "form_name",
  "client_timestamp",
  "checkout_type",
  "checkout_option",
  "registration_package",
  "sponsor_level",
  "guest_names",
  "paypal_button_id",
  "amount",
  "full_name",
  "email",
  "phone",
  "organization",
  "sponsor_text",
  "notes",
  "logo_filename_submitted",
  "logo_file_id",
  "logo_file_url",
  "logo_file_name",
  "page_url",
  "user_agent",
  "raw_payload_json"
];

const PAYPAL_HEADERS = [
  "timestamp",
  "event_id",
  "event_type",
  "event_time",
  "resource_id",
  "resource_status",
  "custom_id",
  "matched_button_id",
  "matched_button_label",
  "matched_program",
  "payer_name",
  "payer_email",
  "amount",
  "currency",
  "purchase_list",
  "purchase_units_json",
  "raw_event_json"
];

const CONTACT_HEADERS = [
  "timestamp",
  "name",
  "email",
  "subject",
  "message",
  "page_url",
  "user_agent",
  "raw_payload_json"
];

const GRANTS_HEADERS = [
  "timestamp",
  "grant_title",
  "grant_summary",
  "initiative_scope",
  "schools",
  "students_benefit",
  "contact_prefix",
  "contact_first_name",
  "contact_last_name",
  "contact_address",
  "contact_city",
  "contact_state",
  "contact_zip",
  "contact_phone",
  "contact_email",
  "co_applicants",
  "amount_requested",
  "budget_description",
  "start_date",
  "expected_length",
  "core_principles",
  "core_principles_explanation",
  "provide_media",
  "outside_funding",
  "principal_approval",
  "page_url",
  "form_name",
  "client_timestamp",
  "raw_payload_json"
];

const DONATIONS_HEADERS = [
  "timestamp",
  "donation_amount",
  "first_name",
  "last_name",
  "email",
  "dedication",
  "monthly_gift",
  "page_url",
  "user_agent",
  "raw_payload_json"
];

const COMPLETED_PAYPAL_EVENT_TYPES = [
  "PAYMENT.CAPTURE.COMPLETED",
  "CHECKOUT.ORDER.COMPLETED",
  "PAYMENT.SALE.COMPLETED"
];

const KNOWN_PAYPAL_BUTTONS = {
  "JXGD7Q2CWLYVN": {
    label: "Golf Registration - Foursome",
    program: "golf_outing"
  },
  "ZQK7S4U4T4LDW": {
    label: "Golf Registration - One Golfer",
    program: "golf_outing"
  },
  "YKLYJSK4YKQP8": {
    label: "$500 - $10K Hole-in-One Sponsor",
    program: "golf_outing"
  },
  "Q9CR5NS6W5FCE": {
    label: "$100 - 3 Hole Sponsor",
    program: "golf_outing"
  },
  "JKMRADQ3F9SCJ": {
    label: "$50 - 1 Hole Sponsor",
    program: "golf_outing"
  },
  "VNGH4WERSBPUA": {
    label: "BBQ Dinner",
    program: "golf_outing"
  },
  "G9GBYZCYQ8ABQ": {
    label: "Volleyball Title Sponsor",
    program: "club_volleyball"
  },
  "LMZ88RS8UQSQ8": {
    label: "Volleyball Event Sponsor",
    program: "club_volleyball"
  },
  "BWZS74CHRBNLL": {
    label: "Volleyball Spike Sponsor",
    program: "club_volleyball"
  },
  "XYXKKRKSN49BN": {
    label: "Volleyball 3 Sign Sponsor",
    program: "club_volleyball"
  },
  "Z85TGND7LA7QQ": {
    label: "Volleyball 1 Sign Sponsor",
    program: "club_volleyball"
  },
  "FVX9BUW6EAWMQ": {
    label: "Support Us Donation",
    program: "support_us"
  }
};

function doGet(e) {
  return json_({
    ok: true,
    message: "EFBR Apps Script endpoint is live",
    action: (e && e.parameter && e.parameter.action) || null
  });
}

function doPost(e) {
  try {
    const action = getAction_(e);

    if (action === "precheckout") {
      return handlePrecheckout_(e);
    }
    if (action === "paypal_webhook") {
      return handlePaypalWebhook_(e);
    }
    if (action === "paypal_return") {
      return handlePaypalReturn_(e);
    }
    if (action === "contact") {
      return handleContact_(e);
    }
    if (action === "grant_application") {
      return handleGrantApplication_(e);
    }
    if (action === "support_donation") {
      return handleSupportDonation_(e);
    }

    return json_({
      ok: false,
      error: "Unknown action.",
      supported_actions: [
        "precheckout",
        "paypal_webhook",
        "paypal_return",
        "contact",
        "grant_application",
        "support_donation"
      ]
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function getAction_(e) {
  const explicitAction = ((e && e.parameter && e.parameter.action) || "").toLowerCase();
  if (explicitAction) return explicitAction;

  let payload = {};
  try {
    payload = parsePayload_(e);
  } catch (err) {
    payload = {};
  }

  if (payload && payload.event_type && payload.resource) {
    return "paypal_webhook";
  }
  if (payload && (payload.transactionId || payload.tx || payload.transaction_id) && payload.status) {
    return "paypal_return";
  }

  return "";
}

function setupProject() {
  const cfg = getConfig_();
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  getOrCreateSheet_(ss, PRECHECKOUT_SHEET, PRECHECKOUT_HEADERS);
  getOrCreateSheet_(ss, PAYPAL_EVENTS_SHEET, PAYPAL_HEADERS);
  getOrCreateSheet_(ss, CONTACT_SHEET, CONTACT_HEADERS);
  getOrCreateSheet_(ss, GRANTS_SHEET, GRANTS_HEADERS);
  getOrCreateSheet_(ss, DONATIONS_SHEET, DONATIONS_HEADERS);
}

function handlePrecheckout_(e) {
  const payload = parsePayload_(e);
  const guard = guardPublicSubmission_(payload, "precheckout");
  if (!guard.ok) return rejectedSubmission_(guard);
  if (guard.duplicate) return json_({ ok: true, duplicate: true });

  const cfg = getConfig_();
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = getOrCreateSheet_(ss, PRECHECKOUT_SHEET, PRECHECKOUT_HEADERS);

  const submissionId = normalizeValue_(payload.submissionId) || Utilities.getUuid();

  let logoMeta = { id: "", url: "", name: "" };
  if (payload.logoDataUrl) {
    if (!cfg.logoFolderId) {
      throw new Error("Missing Script Property: LOGO_FOLDER_ID");
    }
    logoMeta = saveLogoFromDataUrl_(
      cfg.logoFolderId,
      payload.logoDataUrl,
      payload.logoFilename,
      submissionId
    );
  }

  sheet.appendRow([
    new Date(),
    submissionId,
    "checkout_started",
    normalizeValue_(payload.form_name),
    normalizeValue_(payload.timestamp),
    normalizeValue_(payload.checkoutType),
    normalizeValue_(payload.checkoutOption),
    normalizeValue_(payload.registrationPackage),
    normalizeValue_(payload.sponsorLevel),
    normalizeValue_(payload.guestNames),
    normalizeValue_(payload.paypalButtonId),
    normalizeValue_(payload.amount),
    normalizeValue_(payload.fullName),
    normalizeValue_(payload.email),
    normalizeValue_(payload.phone),
    normalizeValue_(payload.organization),
    normalizeValue_(payload.sponsorText),
    normalizeValue_(payload.notes),
    normalizeValue_(payload.logoFilename),
    logoMeta.id || "",
    logoMeta.url || "",
    logoMeta.name || "",
    normalizeValue_(payload.pageUrl || payload.page_url),
    normalizeValue_(payload.userAgent || payload.user_agent),
    serializePayloadForStorage_(payload)
  ]);

  return json_({
    ok: true,
    submissionId: submissionId,
    logoFileId: logoMeta.id || "",
    logoFileUrl: logoMeta.url || ""
  });
}

function handlePaypalWebhook_(e) {
  const cfg = getConfig_();
  const raw = (e.postData && e.postData.contents) ? e.postData.contents : "{}";
  let event = {};
  try {
    event = JSON.parse(raw);
  } catch (err) {
    event = {};
  }

  const resource = event.resource || {};
  const purchaseUnits = Array.isArray(resource.purchase_units) ? resource.purchase_units : [];
  const pu0 = purchaseUnits[0] || {};
  const capture0 = findFirstCapture_(resource);
  const amountObj = resource.amount || pu0.amount || capture0.amount || {};
  const payer = resource.payer || {};
  const payerName = [
    normalizeValue_(payer.name && payer.name.given_name),
    normalizeValue_(payer.name && payer.name.surname)
  ].filter(function(v) { return !!v; }).join(" ");
  const purchaseList = summarizePurchaseList_(purchaseUnits);
  const purchaseUnitsJson = purchaseUnits.length ? JSON.stringify(purchaseUnits) : "";
  const matchedButton = detectKnownPaypalButton_(event, raw);
  const customId = normalizeValue_(resource.custom_id || pu0.custom_id || capture0.custom_id || resource.invoice_id || pu0.invoice_id);

  const eventType = normalizeValue_(event.event_type).toUpperCase();
  const resourceStatus = normalizeValue_(resource.status || capture0.status || "").toUpperCase();
  const isCompleted = COMPLETED_PAYPAL_EVENT_TYPES.indexOf(eventType) !== -1 || resourceStatus === "COMPLETED";

  if (!isCompleted) {
    return json_({
      ok: true,
      skipped: true,
      reason: "not_completed_payment",
      event_type: eventType
    });
  }

  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = getOrCreateSheet_(ss, PAYPAL_EVENTS_SHEET, PAYPAL_HEADERS);

  const eventId = normalizeValue_(event.id);
  if (eventId && isExistingPaypalEventId_(sheet, eventId)) {
    return json_({
      ok: true,
      duplicate: true,
      event_id: eventId
    });
  }

  sheet.appendRow([
    new Date(),
    eventId,
    normalizeValue_(event.event_type),
    normalizeValue_(event.event_time || event.create_time),
    normalizeValue_(resource.id || capture0.id),
    normalizeValue_(resource.status || capture0.status),
    customId,
    normalizeValue_(matchedButton.id),
    normalizeValue_(matchedButton.label),
    normalizeValue_(matchedButton.program),
    normalizeValue_(payerName),
    normalizeValue_((resource.payer && resource.payer.email_address) || ""),
    normalizeValue_(amountObj.value),
    normalizeValue_(amountObj.currency_code),
    normalizeValue_(purchaseList),
    normalizeValue_(purchaseUnitsJson),
    raw
  ]);

  if (customId) {
    updatePrecheckoutStatus_(ss, customId, "payment_webhook_completed");
  }

  const notification = trySendPaypalEventNotification_(cfg, {
    eventId: eventId,
    eventType: normalizeValue_(event.event_type),
    eventTime: normalizeValue_(event.event_time || event.create_time),
    resourceId: normalizeValue_(resource.id || capture0.id),
    customId: customId,
    matchedButtonId: normalizeValue_(matchedButton.id),
    matchedButtonLabel: normalizeValue_(matchedButton.label),
    matchedProgram: normalizeValue_(matchedButton.program),
    payerName: normalizeValue_(payerName),
    payerEmail: normalizeValue_((resource.payer && resource.payer.email_address) || ""),
    amount: normalizeValue_(amountObj.value),
    currency: normalizeValue_(amountObj.currency_code),
    resourceStatus: normalizeValue_(resource.status || capture0.status),
    purchaseList: normalizeValue_(purchaseList),
    purchaseUnitsJson: normalizeValue_(purchaseUnitsJson),
    raw: raw
  });

  return json_({ ok: true, notification: notification });
}

function handlePaypalReturn_(e) {
  const payload = parsePayload_(e);
  const guard = guardPublicSubmission_(payload, "paypal_return");
  if (!guard.ok) return rejectedSubmission_(guard);
  if (guard.duplicate) return json_({ ok: true, duplicate: true });

  const cfg = getConfig_();
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = getOrCreateSheet_(ss, PAYPAL_EVENTS_SHEET, PAYPAL_HEADERS);
  const transactionId = normalizeValue_(payload.transactionId || payload.tx || payload.transaction_id);
  const status = normalizeValue_(payload.status || payload.st || "COMPLETED");
  const submissionId = normalizeValue_(payload.submissionId);
  const buttonId = normalizeValue_(payload.paypalButtonId);
  const buttonMeta = buttonId && KNOWN_PAYPAL_BUTTONS[buttonId] ? KNOWN_PAYPAL_BUTTONS[buttonId] : {};
  const checkoutLabel = normalizeValue_(
    payload.checkoutOption ||
    payload.registrationPackage ||
    payload.sponsorLevel ||
    buttonMeta.label ||
    payload.checkoutType
  );
  const eventId = transactionId ? "return:" + transactionId : "return:" + Utilities.getUuid();
  const eventType = "PAYPAL.RETURN.REPORTED_COMPLETED";

  if (isExistingPaypalEventId_(sheet, eventId)) {
    return json_({
      ok: true,
      duplicate: true,
      event_id: eventId
    });
  }

  const purchaseList = [
    normalizeValue_(payload.checkoutType),
    checkoutLabel,
    normalizeValue_(payload.registrationPackage),
    normalizeValue_(payload.sponsorLevel),
    normalizeValue_(payload.guestNames)
  ].filter(function(x, idx, arr) {
    return !!x && arr.indexOf(x) === idx;
  }).join(" | ");

  const raw = serializePayloadForStorage_(payload);
  sheet.appendRow([
    new Date(),
    eventId,
    eventType,
    normalizeValue_(payload.timestamp),
    transactionId,
    status,
    submissionId,
    buttonId,
    checkoutLabel,
    normalizeValue_(buttonMeta.program || "golf_outing"),
    normalizeValue_(payload.fullName),
    normalizeValue_(payload.email),
    normalizeValue_(payload.amount),
    normalizeValue_(payload.currency),
    purchaseList,
    normalizeValue_(payload.precheckout),
    raw
  ]);

  if (submissionId) {
    updatePrecheckoutStatus_(ss, submissionId, "paypal_return_seen");
  }

  const notification = trySendPaypalEventNotification_(cfg, {
    eventId: eventId,
    eventType: eventType,
    eventTime: normalizeValue_(payload.timestamp),
    resourceId: transactionId,
    customId: submissionId,
    matchedButtonId: buttonId,
    matchedButtonLabel: checkoutLabel,
    matchedProgram: normalizeValue_(buttonMeta.program || "golf_outing"),
    payerName: normalizeValue_(payload.fullName),
    payerEmail: normalizeValue_(payload.email),
    amount: normalizeValue_(payload.amount),
    currency: normalizeValue_(payload.currency),
    resourceStatus: status,
    purchaseList: purchaseList,
    purchaseUnitsJson: normalizeValue_(payload.precheckout),
    raw: raw
  });

  return json_({
    ok: true,
    event_id: eventId,
    precheckout_status_updated: !!submissionId,
    notification: notification
  });
}

function handleContact_(e) {
  const payload = parsePayload_(e);
  const guard = guardPublicSubmission_(payload, "contact");
  if (!guard.ok) return rejectedSubmission_(guard);
  if (guard.duplicate) return json_({ ok: true, duplicate: true });

  const cfg = getConfig_();
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = getOrCreateSheet_(ss, CONTACT_SHEET, CONTACT_HEADERS);

  sheet.appendRow([
    new Date(),
    normalizeValue_(payload.name),
    normalizeValue_(payload.email),
    normalizeValue_(payload.subject),
    normalizeValue_(payload.message),
    normalizeValue_(payload.page_url || payload.pageUrl),
    normalizeValue_(payload.user_agent || payload.userAgent),
    JSON.stringify(payload)
  ]);

  const notification = trySendContactNotification_(cfg, payload);
  return json_({ ok: true, notification: notification });
}

function handleGrantApplication_(e) {
  const payload = parsePayload_(e);
  const guard = guardPublicSubmission_(payload, "grant_application");
  if (!guard.ok) return rejectedSubmission_(guard);
  if (guard.duplicate) return json_({ ok: true, duplicate: true });

  const cfg = getConfig_();
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = getOrCreateSheet_(ss, GRANTS_SHEET, GRANTS_HEADERS);

  sheet.appendRow([
    new Date(),
    normalizeValue_(payload.grant_title),
    normalizeValue_(payload.grant_summary),
    normalizeValue_(payload.initiative_scope),
    normalizeValue_(payload.schools),
    normalizeValue_(payload.students_benefit),
    normalizeValue_(payload.contact_prefix),
    normalizeValue_(payload.contact_first_name),
    normalizeValue_(payload.contact_last_name),
    normalizeValue_(payload.contact_address),
    normalizeValue_(payload.contact_city),
    normalizeValue_(payload.contact_state),
    normalizeValue_(payload.contact_zip),
    normalizeValue_(payload.contact_phone),
    normalizeValue_(payload.contact_email),
    normalizeValue_(payload.co_applicants),
    normalizeValue_(payload.amount_requested),
    normalizeValue_(payload.budget_description),
    normalizeValue_(payload.start_date),
    normalizeValue_(payload.expected_length),
    normalizeValue_(payload.core_principles),
    normalizeValue_(payload.core_principles_explanation),
    normalizeValue_(payload.provide_media),
    normalizeValue_(payload.outside_funding),
    normalizeValue_(payload.principal_approval),
    normalizeValue_(payload.page_url || payload.pageUrl),
    normalizeValue_(payload.form_name),
    normalizeValue_(payload.timestamp),
    JSON.stringify(payload)
  ]);

  const notification = trySendGrantNotification_(cfg, payload);
  return json_({ ok: true, notification: notification });
}

function handleSupportDonation_(e) {
  const payload = parsePayload_(e);
  const guard = guardPublicSubmission_(payload, "support_donation");
  if (!guard.ok) return rejectedSubmission_(guard);
  if (guard.duplicate) return json_({ ok: true, duplicate: true });

  const cfg = getConfig_();
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = getOrCreateSheet_(ss, DONATIONS_SHEET, DONATIONS_HEADERS);

  sheet.appendRow([
    new Date(),
    normalizeValue_(payload.donation_amount),
    normalizeValue_(payload.first_name),
    normalizeValue_(payload.last_name),
    normalizeValue_(payload.email),
    normalizeValue_(payload.dedication),
    normalizeValue_(payload.monthly_gift),
    normalizeValue_(payload.page_url || payload.pageUrl),
    normalizeValue_(payload.user_agent || payload.userAgent),
    JSON.stringify(payload)
  ]);

  return json_({ ok: true });
}

function guardPublicSubmission_(payload, action) {
  const validationReason = validatePublicSubmission_(payload, action);
  if (validationReason) {
    return { ok: false, reason: validationReason };
  }

  const spamReason = detectSpamSubmission_(payload, action);
  if (spamReason) {
    return { ok: false, reason: spamReason };
  }

  const duplicateKey = buildDuplicateCacheKey_(payload, action);
  if (duplicateKey && isDuplicateSubmission_(duplicateKey, getDuplicateTtlSeconds_(action))) {
    return { ok: true, duplicate: true };
  }

  return { ok: true };
}

function rejectedSubmission_(guard) {
  return json_({
    ok: false,
    error: "Submission could not be accepted. Please review the form and try again."
  });
}

function validatePublicSubmission_(payload, action) {
  if (!payload || typeof payload !== "object") return "empty_payload";

  const token = normalizeValue_(payload.form_submission_token);
  if (token !== FORM_SUBMISSION_TOKEN) return "missing_form_token";

  if (hasFilledHoneypot_(payload)) return "honeypot_filled";

  if (!isAllowedPageUrl_(payload.page_url || payload.pageUrl)) {
    return "untrusted_page_url";
  }

  const startedAt = Date.parse(normalizeValue_(payload.form_started_at));
  if (!startedAt || isNaN(startedAt)) return "missing_form_started_at";
  const minimumAgeMs = getMinimumFormAgeMs_(action);
  if (Date.now() - startedAt < minimumAgeMs) return "submitted_too_quickly";

  if (action === "contact") {
    if (!hasText_(payload.name) || !hasText_(payload.email) || !hasText_(payload.subject) || !hasText_(payload.message)) {
      return "missing_contact_fields";
    }
    if (!isValidEmail_(payload.email)) return "invalid_email";
  }

  if (action === "precheckout") {
    if (!hasText_(payload.fullName) || !hasText_(payload.email) || !hasText_(payload.phone)) {
      return "missing_precheckout_contact_fields";
    }
    if (!isValidEmail_(payload.email)) return "invalid_email";
    if (!hasLikelyPhone_(payload.phone)) return "invalid_phone";
    if (!hasText_(payload.checkoutType) || !hasText_(payload.paypalButtonId) || !hasText_(payload.amount)) {
      return "missing_checkout_fields";
    }
    const buttonMeta = KNOWN_PAYPAL_BUTTONS[normalizeValue_(payload.paypalButtonId)];
    if (!buttonMeta || buttonMeta.program !== "golf_outing") return "unknown_golf_paypal_button";

    const formName = normalizeValue_(payload.form_name).toLowerCase();
    if (formName.indexOf("registration") !== -1 && !hasText_(payload.registrationPackage)) {
      return "missing_registration_package";
    }
    if (formName.indexOf("sponsorship") !== -1) {
      if (!hasText_(payload.sponsorLevel) || !hasText_(payload.organization) || !hasText_(payload.sponsorText)) {
        return "missing_sponsorship_fields";
      }
    }
  }

  if (action === "paypal_return") {
    if (!hasText_(payload.transactionId || payload.tx || payload.transaction_id)) return "missing_transaction_id";
    const status = normalizeValue_(payload.status || payload.st).toUpperCase();
    if (status && status !== "COMPLETED") return "paypal_return_not_completed";
  }

  if (action === "grant_application") {
    if (!hasText_(payload.grant_title) || !hasText_(payload.contact_email)) return "missing_grant_fields";
    if (!isValidEmail_(payload.contact_email)) return "invalid_email";
  }

  if (action === "support_donation") {
    if (hasText_(payload.email) && !isValidEmail_(payload.email)) return "invalid_email";
  }

  return "";
}

function hasFilledHoneypot_(payload) {
  const fields = ["website", "companyWebsite", "fax", "faxNumber", "url"];
  return fields.some(function(field) {
    return hasText_(payload[field]);
  });
}

function isAllowedPageUrl_(url) {
  const host = getHostFromUrl_(url);
  if (!host) return false;
  return ALLOWED_PAGE_HOSTS.indexOf(host) !== -1;
}

function getHostFromUrl_(url) {
  const match = normalizeValue_(url).match(/^https?:\/\/([^\/?#:]+)/i);
  return match ? match[1].toLowerCase() : "";
}

function getMinimumFormAgeMs_(action) {
  if (action === "grant_application") return 3000;
  if (action === "paypal_return") return 1000;
  return 1500;
}

function hasText_(value) {
  return normalizeValue_(value).trim().length > 0;
}

function isValidEmail_(email) {
  const value = normalizeValue_(email).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

function hasLikelyPhone_(phone) {
  return normalizeValue_(phone).replace(/\D/g, "").length >= 7;
}

function detectSpamSubmission_(payload, action) {
  const fields = [
    payload.name,
    payload.subject,
    payload.message,
    payload.fullName,
    payload.organization,
    payload.sponsorText,
    payload.notes,
    payload.guestNames
  ].map(normalizeValue_).filter(function(value) {
    return !!value;
  });

  const randomLookingCount = fields.filter(looksLikeRandomToken_).length;
  if (randomLookingCount >= 2) return "random_text_fields";

  if (action === "contact" && looksLikeRandomToken_(payload.name) && looksLikeRandomToken_(payload.subject)) {
    return "random_contact_fields";
  }

  if (action === "precheckout" && looksLikeRandomToken_(payload.fullName) && looksLikeRandomToken_(payload.guestNames || payload.notes || payload.organization)) {
    return "random_precheckout_fields";
  }

  return "";
}

function looksLikeRandomToken_(value) {
  const text = normalizeValue_(value).trim();
  if (text.length < 16 || /\s/.test(text)) return false;
  if (!/^[A-Za-z]+$/.test(text)) return false;

  const letters = text.split("");
  const uppercase = letters.filter(function(ch) { return ch >= "A" && ch <= "Z"; }).length;
  const lowercase = letters.filter(function(ch) { return ch >= "a" && ch <= "z"; }).length;
  if (uppercase < 3 || lowercase < 5) return false;

  let transitions = 0;
  for (var i = 1; i < letters.length; i++) {
    const prevUpper = letters[i - 1] >= "A" && letters[i - 1] <= "Z";
    const nextUpper = letters[i] >= "A" && letters[i] <= "Z";
    if (prevUpper !== nextUpper) transitions++;
  }

  const vowels = text.match(/[aeiou]/gi);
  const vowelRatio = vowels ? vowels.length / text.length : 0;
  return transitions >= 8 && vowelRatio < 0.45;
}

function buildDuplicateCacheKey_(payload, action) {
  const parts = [action];

  if (action === "contact") {
    parts.push(payload.email, payload.name, payload.subject, payload.message);
  } else if (action === "precheckout") {
    parts.push(payload.email, payload.fullName, payload.phone, payload.paypalButtonId, payload.checkoutOption, payload.registrationPackage, payload.sponsorLevel, payload.guestNames, payload.notes);
  } else if (action === "paypal_return") {
    parts.push(payload.transactionId || payload.tx || payload.transaction_id);
  } else if (action === "grant_application") {
    parts.push(payload.contact_email, payload.grant_title, payload.amount_requested);
  } else if (action === "support_donation") {
    parts.push(payload.email, payload.donation_amount, payload.first_name, payload.last_name);
  }

  const normalized = parts.map(function(part) {
    return normalizeValue_(part).trim().toLowerCase();
  }).join("|");

  if (normalized.length < 12) return "";
  return "efbr:" + action + ":" + sha256Hex_(normalized).slice(0, 40);
}

function getDuplicateTtlSeconds_(action) {
  if (action === "paypal_return") return 21600;
  if (action === "contact") return 600;
  if (action === "grant_application") return 3600;
  return 300;
}

function isDuplicateSubmission_(cacheKey, ttlSeconds) {
  try {
    const cache = CacheService.getScriptCache();
    if (cache.get(cacheKey)) return true;
    cache.put(cacheKey, "1", ttlSeconds);
  } catch (err) {
    return false;
  }
  return false;
}

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
  return bytes.map(function(byte) {
    const v = byte < 0 ? byte + 256 : byte;
    return ("0" + v.toString(16)).slice(-2);
  }).join("");
}

function parsePayload_(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return {};
}

function saveLogoFromDataUrl_(folderId, dataUrl, fileName, submissionId) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid logoDataUrl format");
  }

  const mimeType = match[1];
  const base64 = match[2];
  const bytes = Utilities.base64Decode(base64);
  const ext = mimeType.split("/")[1] || "bin";

  const safeName = (fileName || ("logo_" + submissionId + "." + ext))
    .replace(/[^\w.\-]+/g, "_")
    .slice(0, 120);

  const blob = Utilities.newBlob(bytes, mimeType, safeName);
  const folder = DriveApp.getFolderById(folderId);
  const file = folder.createFile(blob);

  return {
    id: file.getId(),
    url: file.getUrl(),
    name: file.getName()
  };
}

function normalizeValue_(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(String).join(" | ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function serializePayloadForStorage_(payload) {
  const copy = {};
  Object.keys(payload || {}).forEach(function(key) {
    copy[key] = payload[key];
  });

  if (copy.logoDataUrl) {
    copy.logoDataUrl = "[omitted_large_base64_logo_data]";
  }
  if (copy.logoFile && typeof copy.logoFile === "object") {
    copy.logoFile = "[omitted_file_object]";
  }
  if (copy.form_submission_token) {
    copy.form_submission_token = "[omitted_form_token]";
  }
  return JSON.stringify(copy);
}

function findFirstCapture_(resource) {
  if (!resource || typeof resource !== "object") return {};
  if (Array.isArray(resource.captures) && resource.captures.length) {
    return resource.captures[0] || {};
  }

  const purchaseUnits = Array.isArray(resource.purchase_units) ? resource.purchase_units : [];
  for (var i = 0; i < purchaseUnits.length; i++) {
    const payments = purchaseUnits[i] && purchaseUnits[i].payments ? purchaseUnits[i].payments : {};
    if (Array.isArray(payments.captures) && payments.captures.length) {
      return payments.captures[0] || {};
    }
  }

  return {};
}

function updatePrecheckoutStatus_(ss, submissionId, status) {
  if (!submissionId) return false;
  const sheet = ss.getSheetByName(PRECHECKOUT_SHEET);
  if (!sheet) return false;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const found = sheet
    .getRange(2, 2, lastRow - 1, 1)
    .createTextFinder(submissionId)
    .matchEntireCell(true)
    .findNext();

  if (!found) return false;
  sheet.getRange(found.getRow(), 3).setValue(status);
  return true;
}

function trySendContactNotification_(cfg, payload) {
  try {
    const recipients = getNotificationRecipients_(cfg);
    if (!recipients.length) {
      return {
        sent: false,
        skipped: true,
        reason: "Set Script Property NOTIFY_EMAIL or NOTIFY_EMAILS to enable email alerts."
      };
    }

    const subject = "[EFBR] New Contact Submission";
    const body = [
      "A new Contact form submission was received.",
      "",
      "Name: " + normalizeValue_(payload.name),
      "Email: " + normalizeValue_(payload.email),
      "Subject: " + normalizeValue_(payload.subject),
      "Message: " + normalizeValue_(payload.message),
      "Page URL: " + normalizeValue_(payload.page_url || payload.pageUrl),
      "Submitted At: " + new Date().toISOString()
    ].join("\n");

    const mailOptions = {
      to: recipients.join(","),
      subject: subject,
      body: body
    };

    const replyTo = normalizeValue_(payload.email);
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    MailApp.sendEmail(mailOptions);
    return { sent: true, recipients: recipients };
  } catch (err) {
    return { sent: false, error: humanizeMailError_(err) };
  }
}

function trySendGrantNotification_(cfg, payload) {
  try {
    const recipients = getNotificationRecipients_(cfg);
    if (!recipients.length) {
      return {
        sent: false,
        skipped: true,
        reason: "Set Script Property NOTIFY_EMAIL or NOTIFY_EMAILS to enable email alerts."
      };
    }

    const subject = "[EFBR] New Grant Application";
    const body = [
      "A new Grant Application was received.",
      "",
      "Grant Title: " + normalizeValue_(payload.grant_title),
      "Grant Summary: " + normalizeValue_(payload.grant_summary),
      "Initiative Scope: " + normalizeValue_(payload.initiative_scope),
      "Schools: " + normalizeValue_(payload.schools),
      "Students Benefited: " + normalizeValue_(payload.students_benefit),
      "Contact Prefix: " + normalizeValue_(payload.contact_prefix),
      "Contact First Name: " + normalizeValue_(payload.contact_first_name),
      "Contact Last Name: " + normalizeValue_(payload.contact_last_name),
      "Contact Address: " + normalizeValue_(payload.contact_address),
      "Contact City: " + normalizeValue_(payload.contact_city),
      "Contact State: " + normalizeValue_(payload.contact_state),
      "Contact ZIP: " + normalizeValue_(payload.contact_zip),
      "Contact Phone: " + normalizeValue_(payload.contact_phone),
      "Contact Email: " + normalizeValue_(payload.contact_email),
      "Co-applicants: " + normalizeValue_(payload.co_applicants),
      "Amount Requested: " + normalizeValue_(payload.amount_requested),
      "Budget Description: " + normalizeValue_(payload.budget_description),
      "Start Date: " + normalizeValue_(payload.start_date),
      "Expected Length: " + normalizeValue_(payload.expected_length),
      "Core Principles: " + normalizeValue_(payload.core_principles),
      "Core Principles Explanation: " + normalizeValue_(payload.core_principles_explanation),
      "Provide Media: " + normalizeValue_(payload.provide_media),
      "Outside Funding Required: " + normalizeValue_(payload.outside_funding),
      "Principal Approval: " + normalizeValue_(payload.principal_approval),
      "Page URL: " + normalizeValue_(payload.page_url || payload.pageUrl),
      "Form Name: " + normalizeValue_(payload.form_name),
      "Client Timestamp: " + normalizeValue_(payload.timestamp),
      "Submitted At: " + new Date().toISOString()
    ].join("\n");

    const mailOptions = {
      to: recipients.join(","),
      subject: subject,
      body: body
    };

    const replyTo = normalizeValue_(payload.contact_email);
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    MailApp.sendEmail(mailOptions);
    return { sent: true, recipients: recipients };
  } catch (err) {
    return { sent: false, error: humanizeMailError_(err) };
  }
}

function trySendPaypalEventNotification_(cfg, eventData) {
  try {
    const recipients = getNotificationRecipients_(cfg);
    if (!recipients.length) {
      return {
        sent: false,
        skipped: true,
        reason: "Set Script Property NOTIFY_EMAIL or NOTIFY_EMAILS to enable email alerts."
      };
    }

    const subject = "[EFBR] PayPal Payment Completed";
    const body = [
      "A completed PayPal payment webhook was received.",
      "",
      "Event ID: " + normalizeValue_(eventData.eventId),
      "Event Type: " + normalizeValue_(eventData.eventType),
      "Event Time: " + normalizeValue_(eventData.eventTime),
      "Resource ID: " + normalizeValue_(eventData.resourceId),
      "Custom ID: " + normalizeValue_(eventData.customId),
      "Matched Button ID: " + normalizeValue_(eventData.matchedButtonId),
      "Matched Button Label: " + normalizeValue_(eventData.matchedButtonLabel),
      "Matched Program: " + normalizeValue_(eventData.matchedProgram),
      "Payer Name: " + normalizeValue_(eventData.payerName),
      "Payer Email: " + normalizeValue_(eventData.payerEmail),
      "Amount: " + normalizeValue_(eventData.amount),
      "Currency: " + normalizeValue_(eventData.currency),
      "Resource Status: " + normalizeValue_(eventData.resourceStatus),
      "Purchase List: " + normalizeValue_(eventData.purchaseList),
      "",
      "Purchase Units JSON:",
      normalizeValue_(eventData.purchaseUnitsJson),
      "",
      "Received At: " + new Date().toISOString(),
      "",
      "Raw Event JSON:",
      normalizeValue_(eventData.raw)
    ].join("\n");

    MailApp.sendEmail({
      to: recipients.join(","),
      subject: subject,
      body: body
    });

    return { sent: true, recipients: recipients };
  } catch (err) {
    return { sent: false, error: humanizeMailError_(err) };
  }
}

function summarizePurchaseList_(purchaseUnits) {
  if (!Array.isArray(purchaseUnits) || !purchaseUnits.length) return "";
  const summaries = purchaseUnits.map(function(unit, idx) {
    const amount = (unit && unit.amount)
      ? [normalizeValue_(unit.amount.value), normalizeValue_(unit.amount.currency_code)].filter(function(x) { return !!x; }).join(" ")
      : "";
    const description = normalizeValue_(unit && unit.description);
    const items = Array.isArray(unit && unit.items) ? unit.items : [];
    const itemsSummary = items.map(function(item) {
      const qty = normalizeValue_(item && item.quantity) || "1";
      const name = normalizeValue_(item && item.name);
      const unitAmount = (item && item.unit_amount)
        ? [normalizeValue_(item.unit_amount.value), normalizeValue_(item.unit_amount.currency_code)].filter(function(x) { return !!x; }).join(" ")
        : "";
      return [qty + "x", name, unitAmount ? "(" + unitAmount + ")" : ""].filter(function(x) { return !!x; }).join(" ");
    }).join("; ");

    const chunks = [
      "PU#" + (idx + 1),
      description ? "desc=" + description : "",
      amount ? "amount=" + amount : "",
      itemsSummary ? "items=" + itemsSummary : ""
    ].filter(function(x) { return !!x; });

    return chunks.join(" | ");
  });
  return summaries.join(" || ");
}

function detectKnownPaypalButton_(event, raw) {
  const resource = event && event.resource ? event.resource : {};
  const purchaseUnits = Array.isArray(resource.purchase_units) ? resource.purchase_units : [];
  const sourceParts = [
    normalizeValue_(resource.custom_id),
    normalizeValue_(resource.invoice_id),
    normalizeValue_(resource.id),
    normalizeValue_(event && event.id),
    normalizeValue_(event && event.summary),
    normalizeValue_(event && event.resource_type)
  ];

  purchaseUnits.forEach(function(unit) {
    sourceParts.push(normalizeValue_(unit && unit.custom_id));
    sourceParts.push(normalizeValue_(unit && unit.invoice_id));
    sourceParts.push(normalizeValue_(unit && unit.reference_id));
    sourceParts.push(normalizeValue_(unit && unit.description));

    const items = Array.isArray(unit && unit.items) ? unit.items : [];
    items.forEach(function(item) {
      sourceParts.push(normalizeValue_(item && item.name));
      sourceParts.push(normalizeValue_(item && item.sku));
      sourceParts.push(normalizeValue_(item && item.description));
    });
  });

  sourceParts.push(normalizeValue_(raw));
  const haystack = sourceParts.join(" ").toUpperCase();
  const knownIds = Object.keys(KNOWN_PAYPAL_BUTTONS);

  for (var i = 0; i < knownIds.length; i++) {
    const buttonId = knownIds[i];
    if (haystack.indexOf(buttonId.toUpperCase()) !== -1) {
      const meta = KNOWN_PAYPAL_BUTTONS[buttonId] || {};
      return {
        id: buttonId,
        label: normalizeValue_(meta.label),
        program: normalizeValue_(meta.program)
      };
    }
  }

  return { id: "", label: "", program: "" };
}

function isExistingPaypalEventId_(sheet, eventId) {
  if (!eventId) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const eventIdRange = sheet.getRange(2, 2, lastRow - 1, 1);
  return !!eventIdRange
    .createTextFinder(eventId)
    .matchEntireCell(true)
    .findNext();
}

function getNotificationRecipients_(cfg) {
  const raw = cfg.notifyEmails || cfg.notifyEmail || "";
  const configured = String(raw)
    .replace(/;/g, ",")
    .split(",")
    .map(function(x) { return x.trim(); })
    .filter(function(x) { return !!x; });

  if (configured.length) return configured;

  const fallback = getEffectiveUserEmail_();
  return fallback ? [fallback] : [];
}

function getEffectiveUserEmail_() {
  try {
    const email = Session.getEffectiveUser().getEmail();
    return email ? String(email).trim() : "";
  } catch (err) {
    return "";
  }
}

function humanizeMailError_(err) {
  const raw = String(err || "");
  if (raw.indexOf("script.send_mail") !== -1 || raw.indexOf("MailApp.sendEmail") !== -1) {
    return "Mail scope is not authorized for this deployment. In Apps Script, run authorizeEmailNotifications() once and then redeploy web app with Execute as: Me.";
  }
  return raw;
}

function authorizeEmailNotifications() {
  const cfg = getConfig_();
  const recipients = getNotificationRecipients_(cfg);
  const to = recipients.length ? recipients[0] : "";
  if (!to) {
    throw new Error("Set Script Property NOTIFY_EMAIL or NOTIFY_EMAILS first, then run this function again.");
  }
  MailApp.sendEmail({
    to: to,
    subject: "[EFBR] Mail Authorization Check",
    body: "Mail scope is authorized and notification emails are enabled."
  });
  return { ok: true, authorized_for: to };
}

function getConfig_() {
  return {
    sheetId: getRequiredProp_("SHEET_ID"),
    logoFolderId: PropertiesService.getScriptProperties().getProperty("LOGO_FOLDER_ID") || "",
    notifyEmail: PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAIL") || "",
    notifyEmails: PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAILS") || ""
  };
}

function getRequiredProp_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error("Missing Script Property: " + key);
  return value;
}

function getOrCreateSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    return sh;
  }

  const width = Math.max(sh.getLastColumn(), headers.length, 1);
  const current = sh.getRange(1, 1, 1, width).getValues()[0];
  const needsHeaderUpdate = headers.some(function(header, idx) {
    return String(current[idx] || "").trim() !== header;
  });

  if (needsHeaderUpdate) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
