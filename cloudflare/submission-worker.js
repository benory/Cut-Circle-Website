const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://cutcircle.org",
  "https://www.cutcircle.org",
  "https://benory.github.io",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "http://localhost:4001",
  "http://127.0.0.1:4001",
];

const DEFAULT_ALLOWED_HOSTNAMES = [
  "cutcircle.org",
  "www.cutcircle.org",
  "benory.github.io",
  "localhost",
  "127.0.0.1",
];

const GOOGLE_FORM_ENTRY_ENV = {
  category: "GOOGLE_FORM_ENTRY_CATEGORY",
  name: "GOOGLE_FORM_ENTRY_NAME",
  first_name: "GOOGLE_FORM_ENTRY_FIRST_NAME",
  last_name: "GOOGLE_FORM_ENTRY_LAST_NAME",
  email: "GOOGLE_FORM_ENTRY_EMAIL",
  message: "GOOGLE_FORM_ENTRY_MESSAGE",
  source: "GOOGLE_FORM_ENTRY_SOURCE",
  user_agent: "GOOGLE_FORM_ENTRY_USER_AGENT",
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = getCorsOrigin(origin, env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: corsOrigin ? 204 : 403,
        headers: corsHeaders(corsOrigin),
      });
    }

    if (origin && !corsOrigin) {
      return jsonResponse({ ok: false, error: "Origin not allowed" }, 403, corsOrigin);
    }

    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405, corsOrigin);
    }

    if (!isWorkerConfigured(env)) {
      return jsonResponse({ ok: false, error: "Worker is not configured" }, 500, corsOrigin);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > 100_000) {
      return jsonResponse({ ok: false, error: "Submission too large" }, 413, corsOrigin);
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (_error) {
      return jsonResponse({ ok: false, error: "Invalid form data" }, 400, corsOrigin);
    }

    // Silently accept bot submissions that fill the hidden field.
    if (readString(formData, "website")) {
      return jsonResponse({ ok: true }, 200, corsOrigin);
    }

    const submission = readSubmission(formData);
    const validationError = validateSubmission(submission);
    if (validationError) {
      return jsonResponse({ ok: false, error: validationError }, 400, corsOrigin);
    }

    const turnstileToken = readString(formData, "cf-turnstile-response");
    if (!turnstileToken || turnstileToken.length > 2048) {
      return jsonResponse({ ok: false, error: "Missing verification token" }, 400, corsOrigin);
    }

    const turnstileResult = await verifyTurnstile(
      turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      request.headers.get("CF-Connecting-IP")
    );
    const expectedAction = submission.category.toLowerCase();
    const allowedHostnames = parseList(env.ALLOWED_HOSTNAMES, DEFAULT_ALLOWED_HOSTNAMES);

    if (
      !turnstileResult.success ||
      turnstileResult.action !== expectedAction ||
      !allowedHostnames.includes(turnstileResult.hostname)
    ) {
      return jsonResponse({ ok: false, error: "Verification failed" }, 400, corsOrigin);
    }

    let googleResponse;
    try {
      googleResponse = await fetch(env.GOOGLE_FORM_POST_URL, {
        method: "POST",
        body: buildGoogleFormData(submission, env),
        redirect: "follow",
      });
    } catch (_error) {
      return jsonResponse({ ok: false, error: "Submission service unavailable" }, 502, corsOrigin);
    }

    if (!googleResponse.ok) {
      return jsonResponse({ ok: false, error: "Google Form submission failed" }, 502, corsOrigin);
    }

    return jsonResponse({ ok: true }, 200, corsOrigin);
  },
};

function isWorkerConfigured(env) {
  if (!env.GOOGLE_FORM_POST_URL || !env.TURNSTILE_SECRET_KEY) return false;
  return Object.values(GOOGLE_FORM_ENTRY_ENV).every((envName) => Boolean(env[envName]));
}

function readSubmission(formData) {
  const rawCategory = readString(formData, "category").toLowerCase();
  const category = rawCategory === "subscribe"
    ? "Subscribe"
    : rawCategory === "contact"
      ? "Contact"
      : "";

  return {
    category,
    name: readString(formData, "name"),
    first_name: readString(formData, "first_name"),
    last_name: readString(formData, "last_name"),
    email: readString(formData, "email"),
    message: readString(formData, "message"),
    source: readString(formData, "source"),
    user_agent: readString(formData, "user_agent"),
  };
}

function validateSubmission(submission) {
  if (!submission.category) return "Invalid submission category";
  if (!isValidEmail(submission.email)) return "Invalid email address";
  if (submission.email.length > 254) return "Email address is too long";
  if (submission.source.length > 1000 || submission.user_agent.length > 500) {
    return "Invalid submission context";
  }

  if (submission.category === "Subscribe") {
    if (!submission.first_name || !submission.last_name) return "Missing required fields";
    if (submission.first_name.length > 80 || submission.last_name.length > 80) {
      return "Name is too long";
    }
  }

  if (submission.category === "Contact") {
    if (!submission.name || !submission.message) return "Missing required fields";
    if (submission.name.length > 120 || submission.message.length > 5000) {
      return "Submission is too long";
    }
  }

  return "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readString(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function buildGoogleFormData(submission, env) {
  const googleFormData = new FormData();
  for (const fieldName of Object.keys(GOOGLE_FORM_ENTRY_ENV)) {
    const googleEntryName = env[GOOGLE_FORM_ENTRY_ENV[fieldName]];
    googleFormData.append(googleEntryName, submission[fieldName] || "");
  }
  googleFormData.append("fvv", "1");
  googleFormData.append("pageHistory", "0");
  return googleFormData;
}

async function verifyTurnstile(token, secret, remoteIp) {
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (remoteIp) formData.append("remoteip", remoteIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) return { success: false };
    return response.json();
  } catch (_error) {
    return { success: false };
  }
}

function getCorsOrigin(origin, configuredOrigins) {
  if (!origin) return "*";
  const allowedOrigins = parseList(configuredOrigins, DEFAULT_ALLOWED_ORIGINS);
  return allowedOrigins.includes(origin) ? origin : "";
}

function parseList(configuredValues, fallback) {
  if (!configuredValues) return fallback;
  return configuredValues.split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Vary": "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
