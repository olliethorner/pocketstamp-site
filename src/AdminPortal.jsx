import { useEffect, useMemo, useState } from "react";

const ADMIN_API_BASE_URL = import.meta.env.VITE_POCKETSTAMP_BACKEND_URL;
const ADMIN_API_SECRET = import.meta.env.VITE_ADMIN_API_SECRET;

const initialOnboardingForm = {
  cafeName: "",
  merchantSlug: "",
  locationName: "",
  address: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  salesNotes: "",
  rewardThreshold: 9,
  rewardText: "Collect 9 stamps and get your 10th coffee free.",
  programName: "",
  termsText: "",
  brandColor: "#26354f",
  backgroundColor: "#fff8ea",
  textColor: "#26211d",
  logoUpload: null,
  logoPreviewUrl: "",
  logoUrl: "",
  colorSuggestions: null,
  setupMode: "qr_only",
  staffDashboardAccess: true,
  createDemoCustomer: true,
};

const wizardSteps = [
  "Café details",
  "Loyalty offer",
  "Branding",
  "Hardware / setup",
  "Review",
];

function adminFetch(path, options = {}) {
  if (!ADMIN_API_BASE_URL) {
    throw new Error("Missing VITE_POCKETSTAMP_BACKEND_URL.");
  }

  if (!ADMIN_API_SECRET) {
    throw new Error("Missing VITE_ADMIN_API_SECRET.");
  }

  // TODO: Replace this temporary frontend secret with Supabase role-based auth
  // and a server-side proxy before any production admin launch.
  return fetch(`${ADMIN_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-pocketstamp-admin-secret": ADMIN_API_SECRET,
      ...options.headers,
    },
  }).then(async (response) => {
    const text = await response.text();
    let payload = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { message: text };
    }

    if (!response.ok) {
      const error = new Error(
        payload?.error ||
          payload?.message ||
          payload?.details?.[0]?.message ||
          "The admin API returned an error.",
      );
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  });
}

function safeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function makeLogoUpload(file, dataUrl) {
  if (!file || !dataUrl) return null;
  return {
    fileName: file.name,
    mimeType: file.type || "image/png",
    dataUrl,
  };
}

function formatDate(value) {
  if (!value) return "Not returned";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getMerchantId(merchant) {
  return pickFirst(merchant.id, merchant.merchantId, merchant._id, merchant.slug);
}

function getMerchantName(merchant) {
  return pickFirst(
    merchant.cafeName,
    merchant.displayName,
    merchant.merchantName,
    merchant.name,
    merchant.businessName,
    "Untitled café",
  );
}

function getMerchantSlug(merchant) {
  return pickFirst(merchant.merchantSlug, merchant.slug, merchant.handle);
}

function getContactEmail(merchant) {
  return pickFirst(merchant.contactEmail, merchant.contact?.email, merchant.email);
}

function getLogoUrl(merchant) {
  return pickFirst(merchant.logoUrl, merchant.logoPath, merchant.branding?.logoUrl, merchant.branding?.logoPath);
}

function extractMerchants(payload) {
  const candidates = [
    payload,
    payload?.merchants,
    payload?.cafes,
    payload?.items,
    payload?.data,
    payload?.data?.merchants,
    payload?.data?.items,
  ];

  return candidates.find(Array.isArray) || [];
}

function extractMerchant(payload) {
  return (
    payload?.merchant ||
    payload?.cafe ||
    payload?.result?.merchant ||
    payload?.data?.merchant ||
    payload?.data?.result?.merchant ||
    payload?.result ||
    payload?.data ||
    payload
  );
}

function extractLinks(payload, merchant = {}) {
  const links =
    payload?.links ||
    payload?.result?.links ||
    payload?.data?.links ||
    payload?.merchant?.links ||
    merchant.links ||
    {};
  const slug = getMerchantSlug(merchant);
  const origin = window.location.origin;

  return {
    joinUrl: pickFirst(
      links.joinUrl,
      payload?.joinUrl,
      payload?.result?.joinUrl,
      payload?.data?.joinUrl,
      payload?.data?.result?.joinUrl,
      merchant.joinUrl,
      slug ? `${origin}/join/${slug}` : null,
    ),
    merchantDashboardUrl: pickFirst(
      links.merchantDashboardUrl,
      payload?.merchantDashboardUrl,
      payload?.result?.merchantDashboardUrl,
      payload?.data?.merchantDashboardUrl,
      payload?.data?.result?.merchantDashboardUrl,
      merchant.merchantDashboardUrl,
      slug || getMerchantId(merchant) ? `${origin}/merchant` : null,
    ),
    staffDashboardUrl: pickFirst(
      links.staffDashboardUrl,
      payload?.staffDashboardUrl,
      payload?.result?.staffDashboardUrl,
      payload?.data?.staffDashboardUrl,
      payload?.data?.result?.staffDashboardUrl,
      merchant.staffDashboardUrl,
    ),
    demoPassUrl: pickFirst(
      links.demoPassUrl,
      payload?.demoPassUrl,
      payload?.result?.demoPassUrl,
      payload?.data?.demoPassUrl,
      payload?.data?.result?.demoPassUrl,
      merchant.demoPassUrl,
    ),
  };
}

function normalizeOnboardResponse(responseJson, formState = {}) {
  const response = responseJson || {};
  const data = response.data || {};
  const result = response.result || data.result || {};
  const welcomePack =
    response.welcomePack ||
    data.welcomePack ||
    result.welcomePack ||
    data.result?.welcomePack ||
    {};
  const merchant =
    response.merchant ||
    data.merchant ||
    result.merchant ||
    data.result?.merchant ||
    {};
  const links = {
    ...(response.links || {}),
    ...(data.links || {}),
    ...(result.links || {}),
    ...(welcomePack.links || {}),
    ...(merchant.links || {}),
  };
  const merchantId = pickFirst(
    response.merchantId,
    data.merchantId,
    result.merchantId,
    welcomePack.merchantId,
    merchant.merchantId,
    merchant.id,
    merchant._id,
  );
  const merchantSlug = pickFirst(
    response.merchantSlug,
    data.merchantSlug,
    result.merchantSlug,
    welcomePack.merchantSlug,
    merchant.merchantSlug,
    merchant.slug,
    merchant.handle,
  );
  const joinUrl = pickFirst(
    response.joinUrl,
    data.joinUrl,
    result.joinUrl,
    welcomePack.joinUrl,
    links.joinUrl,
    merchant.joinUrl,
    merchantSlug ? `${window.location.origin}/join/${merchantSlug}` : null,
  );
  const merchantDashboardUrl = pickFirst(
    response.merchantDashboardUrl,
    data.merchantDashboardUrl,
    result.merchantDashboardUrl,
    welcomePack.merchantDashboardUrl,
    links.merchantDashboardUrl,
    merchant.merchantDashboardUrl,
    merchantId || merchantSlug ? `${window.location.origin}/merchant` : null,
  );
  const staffDashboardUrl = pickFirst(
    response.staffDashboardUrl,
    data.staffDashboardUrl,
    result.staffDashboardUrl,
    welcomePack.staffDashboardUrl,
    links.staffDashboardUrl,
    merchant.staffDashboardUrl,
  );
  const demoPassUrl = pickFirst(
    response.demoPassUrl,
    data.demoPassUrl,
    result.demoPassUrl,
    welcomePack.demoPassUrl,
    links.demoPassUrl,
    merchant.demoPassUrl,
  );

  return {
    merchantId,
    merchantSlug,
    joinUrl,
    merchantDashboardUrl,
    staffDashboardUrl,
    demoPassUrl,
    welcomeEmailSubject: pickFirst(
      response.welcomeEmailSubject,
      data.welcomeEmailSubject,
      result.welcomeEmailSubject,
      welcomePack.welcomeEmailSubject,
      welcomePack.subject,
      buildWelcomeEmail(formState, { joinUrl, merchantDashboardUrl, staffDashboardUrl, demoPassUrl }).subject,
    ),
    welcomeEmailBody: pickFirst(
      response.welcomeEmailBody,
      data.welcomeEmailBody,
      result.welcomeEmailBody,
      welcomePack.welcomeEmailBody,
      welcomePack.body,
      buildWelcomeEmail(formState, { joinUrl, merchantDashboardUrl, staffDashboardUrl, demoPassUrl }).body,
    ),
  };
}

function buildWelcomeEmail(form, links) {
  const subject = `Welcome to PocketStamp, ${form.cafeName || "your café"}`;
  const body = [
    `Hi ${form.contactName || "there"},`,
    "",
    `${form.cafeName || "Your café"} is set up in PocketStamp.`,
    "",
    `Join URL: ${links.joinUrl || "Not returned"}`,
    `Merchant dashboard: ${links.merchantDashboardUrl || "Not returned"}`,
    links.staffDashboardUrl ? `Staff dashboard: ${links.staffDashboardUrl}` : null,
    links.demoPassUrl ? `Demo pass: ${links.demoPassUrl}` : null,
    "",
    "Next step: share the join QR with staff and test the customer Wallet flow.",
    "",
    "Thanks,",
    "PocketStamp",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { subject, body };
}

function AdminShell({ children, active }) {
  const navItems = [
    ["/admin/onboard", "Onboard Café"],
    ["/admin/cafes", "Cafés"],
    ["/admin/account", "My Account"],
  ];

  return (
    <main className="ps-dashboard min-h-screen text-[var(--ps-espresso)]">
      <header className="border-b border-[var(--ps-border)] bg-[rgba(255,253,248,0.92)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <a href="/admin/onboard" className="flex items-center gap-3 text-[var(--ps-espresso)] no-underline">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ps-espresso)] text-sm font-bold text-white">
              PS
            </span>
            <span>
              <span className="block text-lg font-semibold">PocketStamp Admin</span>
              <span className="block text-sm text-[var(--ps-muted)]">Internal sales portal</span>
            </span>
          </a>

          <nav className="flex flex-wrap gap-2">
            {navItems.map(([href, label]) => {
              const isActive = active === href;
              return (
                <a
                  key={href}
                  href={href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold no-underline transition ${
                    isActive
                      ? "bg-[var(--ps-blue)] text-white"
                      : "border border-[var(--ps-border)] bg-[var(--ps-card)] text-[var(--ps-espresso)] hover:border-stone-300"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--ps-espresso)]">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function TextInput({ multiline = false, ...props }) {
  const className = "ps-input min-h-[2.9rem]";

  if (multiline) {
    return <textarea {...props} rows={props.rows || 4} className={className} />;
  }

  return <input {...props} className={className} />;
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Not set"}
      </p>
    </div>
  );
}

function Alert({ tone = "amber", children }) {
  const classes =
    tone === "red"
      ? "bg-red-50 text-red-700 ring-red-100"
      : "bg-amber-50 text-amber-800 ring-amber-100";

  return <div className={`rounded-xl p-4 text-sm font-semibold ring-1 ${classes}`}>{children}</div>;
}

function PassPreview({ form }) {
  const threshold = Number(form.rewardThreshold) || 9;
  const logoSrc = form.logoPreviewUrl || form.logoUrl;

  return (
    <div
      className="mx-auto max-w-sm overflow-hidden rounded-[2rem] p-5 shadow-2xl shadow-stone-900/10 ring-1 ring-stone-200"
      style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
    >
      <div
        className="rounded-3xl p-5 text-white"
        style={{ backgroundColor: form.brandColor }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase opacity-70">Apple Wallet</p>
            <p className="mt-2 text-xl font-semibold">{form.cafeName || "Café name"}</p>
          </div>
          {logoSrc ? (
            <img src={logoSrc} alt="" className="h-12 w-12 rounded-xl bg-white/15 object-contain p-1" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-sm font-bold">
              PS
            </span>
          )}
        </div>

        <p className="mt-10 text-xs font-bold uppercase opacity-65">Stamps</p>
        <p className="mt-1 text-5xl font-semibold">0/{threshold}</p>
      </div>

      <div className="p-1 pt-5">
        <div className="grid grid-cols-5 gap-2.5" aria-label={`${threshold} empty stamp circles`}>
          {Array.from({ length: Math.min(Math.max(threshold, 1), 15) }).map((_, index) => (
            <span
              key={index}
              className="aspect-square rounded-full border border-stone-300 bg-white/55"
            />
          ))}
        </div>

        <div className="mt-6 border-t border-stone-950/10 pt-5">
          <p className="text-xs font-bold uppercase opacity-60">Reward</p>
          <p className="mt-1 font-semibold">{form.rewardText || "Reward text"}</p>
        </div>
      </div>
    </div>
  );
}

function OnboardCafePage() {
  const [form, setForm] = useState(initialOnboardingForm);
  const [step, setStep] = useState(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdPayload, setCreatedPayload] = useState(null);
  const [copyState, setCopyState] = useState("");

  const warnings = useMemo(() => {
    const items = [];
    if (!ADMIN_API_BASE_URL) items.push("VITE_POCKETSTAMP_BACKEND_URL is missing.");
    if (!ADMIN_API_SECRET) items.push("VITE_ADMIN_API_SECRET is missing.");
    if (!form.cafeName.trim()) items.push("Café name is required.");
    if (!form.merchantSlug.trim()) items.push("Merchant slug is required.");
    if (!form.locationName.trim()) items.push("Location name is required.");
    if (!form.contactEmail.trim()) items.push("Contact email is required.");
    if (!Number(form.rewardThreshold) || Number(form.rewardThreshold) < 1) {
      items.push("Reward threshold must be at least 1.");
    }
    return items;
  }, [form]);

  const normalizedCreated = normalizeOnboardResponse(createdPayload || {}, form);
  const welcomeEmail = {
    subject: normalizedCreated.welcomeEmailSubject,
    body: normalizedCreated.welcomeEmailBody,
  };
  const missingCreatedSlug = createdPayload && !normalizedCreated.merchantSlug;

  async function handleLogoFile(file) {
    if (!file) return;
    setError("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const logoUpload = makeLogoUpload(file, dataUrl);
      updateField("logoUpload", logoUpload);
      updateField("logoPreviewUrl", dataUrl);
      const payload = await adminFetch("/api/admin/logo-suggestions", {
        method: "POST",
        body: JSON.stringify({ logoUpload }),
      });
      updateField("colorSuggestions", payload?.suggestions || null);
    } catch (logoError) {
      setError(logoError.message || "Unable to read logo.");
    }
  }

  function applyColorSuggestions() {
    const suggestions = form.colorSuggestions;
    if (!suggestions) return;
    setForm((current) => ({
      ...current,
      brandColor: suggestions.brandColor || current.brandColor,
      backgroundColor: suggestions.backgroundColor || current.backgroundColor,
      textColor: suggestions.textColor || current.textColor,
    }));
  }

  function updateField(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "cafeName" && !slugEdited) {
        next.merchantSlug = safeSlug(value);
      }

      if (name === "merchantSlug") {
        next.merchantSlug = safeSlug(value);
      }

      return next;
    });
  }

  async function handleSubmit() {
    setError("");

    if (warnings.length) {
      setError("Fix the validation warnings before creating this café.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await adminFetch("/api/admin/onboard-merchant", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          rewardThreshold: Number(form.rewardThreshold),
        }),
      });
      const normalized = normalizeOnboardResponse(payload || {}, form);
      if (import.meta.env.DEV) {
        console.log("Admin onboard response", payload);
        console.log("Normalized admin onboard response", normalized);
      }
      setCreatedPayload(payload || {});
      setStep(5);
    } catch (submitError) {
      const details = submitError.payload?.details || submitError.payload?.errors;
      const detailText = Array.isArray(details)
        ? details.map((item) => item.message || item.error || String(item)).join(" ")
        : "";
      setError(
        [submitError.message, detailText].filter(Boolean).join(" ") ||
          "Unable to create café merchant.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyText(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(`${label} copied`);
    } catch {
      setCopyState(`${label} copy failed`);
    }
    window.setTimeout(() => setCopyState(""), 1800);
  }

  function resetWizard() {
    setForm(initialOnboardingForm);
    setStep(0);
    setSlugEdited(false);
    setError("");
    setCreatedPayload(null);
  }

  if (step === 5) {
    return (
      <AdminShell active="/admin/onboard">
        <section className="ps-flow-card">
          <p className="ps-eyebrow">Success / handoff</p>
          <h1 className="mt-3 text-3xl font-semibold">Café merchant created</h1>
          <p className="mt-2 text-[var(--ps-muted)]">
            Handoff links and starter email are ready for {form.cafeName}.
          </p>

          {missingCreatedSlug ? (
            <div className="mt-5">
              <Alert tone="amber">
                Merchant created, but no slug was returned. Check backend response.
                {normalizedCreated.merchantId ? ` Merchant ID: ${normalizedCreated.merchantId}` : ""}
              </Alert>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Detail label="Merchant ID" value={normalizedCreated.merchantId} />
            <Detail label="Merchant slug" value={normalizedCreated.merchantSlug} />
            <Detail label="Join URL" value={normalizedCreated.joinUrl} />
            <Detail label="Merchant dashboard URL" value={normalizedCreated.merchantDashboardUrl} />
            <Detail label="Staff dashboard URL" value={normalizedCreated.staffDashboardUrl} />
            <Detail label="Demo pass URL" value={normalizedCreated.demoPassUrl} />
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <Detail label="Welcome email subject" value={welcomeEmail.subject} />
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
              {welcomeEmail.body}
            </pre>
          </div>

          {copyState ? <p className="mt-4 text-sm font-semibold text-[var(--ps-blue)]">{copyState}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => copyText("Join URL", normalizedCreated.joinUrl)}
              className="ps-button-primary"
            >
              Copy join URL
            </button>
            <button
              type="button"
              onClick={() => copyText("Welcome email", `${welcomeEmail.subject}\n\n${welcomeEmail.body}`)}
              className="ps-button-secondary"
            >
              Copy welcome email
            </button>
            <a href={normalizedCreated.joinUrl} target="_blank" rel="noreferrer" className="ps-button-secondary">
              Open join page
            </a>
            <button type="button" onClick={resetWizard} className="ps-button-secondary">
              Create another café
            </button>
            <a href="/admin/cafes" className="ps-button-secondary">
              Go to cafés list
            </a>
          </div>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell active="/admin/onboard">
      <div className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
        <section className="ps-flow-card">
          <p className="ps-eyebrow">Onboard café</p>
          <h1 className="mt-3 text-3xl font-semibold">{wizardSteps[step]}</h1>

          <div className="mt-6 flex flex-wrap gap-2">
            {wizardSteps.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  index === step
                    ? "bg-[var(--ps-blue)] text-white"
                    : "bg-white text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {step === 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Café name">
                  <TextInput value={form.cafeName} onChange={(event) => updateField("cafeName", event.target.value)} />
                </Field>
                <Field label="Merchant slug">
                  <TextInput
                    value={form.merchantSlug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      updateField("merchantSlug", event.target.value);
                    }}
                  />
                </Field>
                <Field label="Location name">
                  <TextInput value={form.locationName} onChange={(event) => updateField("locationName", event.target.value)} />
                </Field>
                <Field label="Address">
                  <TextInput value={form.address} onChange={(event) => updateField("address", event.target.value)} />
                </Field>
                <Field label="Contact name">
                  <TextInput value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} />
                </Field>
                <Field label="Contact email">
                  <TextInput type="email" value={form.contactEmail} onChange={(event) => updateField("contactEmail", event.target.value)} />
                </Field>
                <Field label="Contact phone">
                  <TextInput value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} />
                </Field>
                <Field label="Sales notes">
                  <TextInput multiline value={form.salesNotes} onChange={(event) => updateField("salesNotes", event.target.value)} />
                </Field>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Reward threshold">
                  <TextInput
                    type="number"
                    min="1"
                    value={form.rewardThreshold}
                    onChange={(event) => updateField("rewardThreshold", event.target.value)}
                  />
                </Field>
                <Field label="Program name optional">
                  <TextInput value={form.programName} onChange={(event) => updateField("programName", event.target.value)} />
                </Field>
                <Field label="Reward text">
                  <TextInput multiline value={form.rewardText} onChange={(event) => updateField("rewardText", event.target.value)} />
                </Field>
                <Field label="Terms text optional">
                  <TextInput multiline value={form.termsText} onChange={(event) => updateField("termsText", event.target.value)} />
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-1">
                  <Field label="Brand color">
                    <TextInput type="color" value={form.brandColor} onChange={(event) => updateField("brandColor", event.target.value)} />
                  </Field>
                  <Field label="Background color">
                    <TextInput type="color" value={form.backgroundColor} onChange={(event) => updateField("backgroundColor", event.target.value)} />
                  </Field>
                  <Field label="Text color">
                    <TextInput type="color" value={form.textColor} onChange={(event) => updateField("textColor", event.target.value)} />
                  </Field>
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <p className="text-sm font-semibold text-[var(--ps-espresso)]">Logo</p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) => handleLogoFile(event.target.files?.[0])}
                      className="mt-3 block w-full text-sm"
                    />
                    {form.logoPreviewUrl ? (
                      <img src={form.logoPreviewUrl} alt="" className="mt-4 max-h-24 rounded-lg bg-[#fbfaf7] object-contain p-3 ring-1 ring-slate-100" />
                    ) : null}
                    {form.colorSuggestions ? (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {(form.colorSuggestions.palette || []).map((color) => (
                            <span key={color} className="h-7 w-7 rounded-full ring-1 ring-slate-200" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <button type="button" onClick={applyColorSuggestions} className="ps-button-secondary mt-3">
                          Apply suggested colours
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <PassPreview form={form} />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-5">
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-[var(--ps-espresso)]">Setup mode</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {[
                      ["qr_only", "QR only"],
                      ["vtap_later", "vTap later"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex items-center gap-3 rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
                        <input
                          type="radio"
                          name="setupMode"
                          value={value}
                          checked={form.setupMode === value}
                          onChange={(event) => updateField("setupMode", event.target.value)}
                        />
                        <span className="font-semibold">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-xl bg-white p-4 font-semibold ring-1 ring-slate-200">
                  <input
                    type="checkbox"
                    checked={form.staffDashboardAccess}
                    onChange={(event) => updateField("staffDashboardAccess", event.target.checked)}
                  />
                  Staff dashboard access
                </label>
                <label className="flex items-center gap-3 rounded-xl bg-white p-4 font-semibold ring-1 ring-slate-200">
                  <input
                    type="checkbox"
                    checked={form.createDemoCustomer}
                    onChange={(event) => updateField("createDemoCustomer", event.target.checked)}
                  />
                  Create demo customer
                </label>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-6">
                {warnings.length ? (
                  <Alert>
                    <ul className="space-y-1">
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </Alert>
                ) : (
                  <Alert tone="green">No validation warnings.</Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Detail label="Café name" value={form.cafeName} />
                  <Detail label="Slug" value={form.merchantSlug} />
                  <Detail label="Location" value={form.locationName} />
                  <Detail label="Address" value={form.address} />
                  <Detail label="Contact" value={`${form.contactName} ${form.contactEmail}`.trim()} />
                  <Detail label="Phone" value={form.contactPhone} />
                  <Detail label="Reward threshold" value={`${form.rewardThreshold} stamps`} />
                  <Detail label="Reward text" value={form.rewardText} />
                  <Detail label="Program name" value={form.programName} />
                  <Detail label="Terms" value={form.termsText} />
                  <Detail label="Setup mode" value={form.setupMode} />
                  <Detail label="Sales notes" value={form.salesNotes} />
                  <Detail label="Logo" value={form.logoUpload?.fileName || form.logoUrl} />
                </div>
              </div>
            ) : null}
          </div>

          {error ? <div className="mt-6"><Alert tone="red">{error}</Alert></div> : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
              className="ps-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(current + 1, 4))}
                className="ps-button-primary"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="ps-button-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating café..." : "Create Café Merchant"}
              </button>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="ps-dashboard-card rounded-2xl p-5">
            <p className="text-sm font-semibold text-[var(--ps-muted)]">Current slug</p>
            <p className="mt-2 break-all text-lg font-semibold">{form.merchantSlug || "not-set"}</p>
          </div>
          <div className="ps-dashboard-card rounded-2xl p-5">
            <p className="text-sm font-semibold text-[var(--ps-muted)]">Offer</p>
            <p className="mt-2 text-lg font-semibold">{form.rewardThreshold || 9} stamp reward</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ps-muted)]">{form.rewardText}</p>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function CafesListPage() {
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMerchants() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await adminFetch("/api/admin/merchants");
        if (isMounted) setMerchants(extractMerchants(payload));
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load cafés.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMerchants();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMerchants = merchants.filter((merchant) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;

    return [getMerchantName(merchant), getMerchantSlug(merchant), getContactEmail(merchant)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });

  return (
    <AdminShell active="/admin/cafes">
      <section className="ps-flow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ps-eyebrow">Cafés</p>
            <h1 className="mt-3 text-3xl font-semibold">Merchant list</h1>
          </div>
          <label className="w-full lg:max-w-sm">
            <span className="sr-only">Search cafés</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, slug or contact email"
              className="ps-input"
            />
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {isLoading ? (
            <div className="p-5 text-slate-600">Loading cafés...</div>
          ) : error ? (
            <div className="p-5"><Alert tone="red">{error}</Alert></div>
          ) : !filteredMerchants.length ? (
            <div className="p-5 text-slate-600">No cafés found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-[#fbfaf7] text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Café name</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Created by</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMerchants.map((merchant) => {
                    const merchantId = getMerchantId(merchant);
                    return (
                      <tr key={merchantId} className="align-top">
                        <td className="px-4 py-4 font-semibold text-slate-950">{getMerchantName(merchant)}</td>
                        <td className="px-4 py-4 text-slate-600">{getMerchantSlug(merchant)}</td>
                        <td className="px-4 py-4 text-slate-600">{getContactEmail(merchant) || "Not returned"}</td>
                        <td className="px-4 py-4 text-slate-600">{pickFirst(merchant.status, merchant.state, "Not returned")}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDate(pickFirst(merchant.createdAt, merchant.created_at))}</td>
                        <td className="px-4 py-4 text-slate-600">{pickFirst(merchant.createdBy, merchant.created_by, "Not returned")}</td>
                        <td className="px-4 py-4">
                          <a href={`/admin/cafes/${merchantId}`} className="font-semibold text-[var(--ps-blue)] no-underline">
                            View/Edit
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function MerchantDetailPage({ merchantId }) {
  const [merchant, setMerchant] = useState(null);
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMerchant() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await adminFetch(`/api/admin/merchants/${merchantId}`);
        const nextMerchant = extractMerchant(payload);
        if (!isMounted) return;
        setMerchant(nextMerchant);
        setForm({
          cafeName: getMerchantName(nextMerchant),
          contactName: pickFirst(nextMerchant.contactName, nextMerchant.contact?.name),
          contactEmail: getContactEmail(nextMerchant),
          contactPhone: pickFirst(nextMerchant.contactPhone, nextMerchant.contact?.phone),
          address: pickFirst(nextMerchant.address, nextMerchant.location?.address),
          salesNotes: pickFirst(nextMerchant.salesNotes, nextMerchant.notes),
          rewardThreshold: pickFirst(nextMerchant.rewardThreshold, nextMerchant.loyalty?.rewardThreshold),
          rewardText: pickFirst(nextMerchant.rewardText, nextMerchant.loyalty?.rewardText),
          brandColor: pickFirst(nextMerchant.brandColor, nextMerchant.branding?.brandColor),
          backgroundColor: pickFirst(nextMerchant.backgroundColor, nextMerchant.branding?.backgroundColor),
          textColor: pickFirst(nextMerchant.textColor, nextMerchant.branding?.textColor),
          status: pickFirst(nextMerchant.status, nextMerchant.state, "active"),
          logoUpload: null,
          logoPreviewUrl: "",
          logoUrl: getLogoUrl(nextMerchant),
          colorSuggestions: null,
        });
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load café.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMerchant();

    return () => {
      isMounted = false;
    };
  }, [merchantId]);

  if (isLoading) {
    return (
      <AdminShell active="/admin/cafes">
        <section className="ps-flow-card">Loading café...</section>
      </AdminShell>
    );
  }

  if (error || !merchant) {
    return (
      <AdminShell active="/admin/cafes">
        <section className="ps-flow-card"><Alert tone="red">{error || "Café not found."}</Alert></section>
      </AdminShell>
    );
  }

  const links = extractLinks({}, merchant);
  const editableFields = [
    ["cafeName", "Café/display name", "text"],
    ["contactName", "Contact name", "text"],
    ["contactEmail", "Contact email", "email"],
    ["contactPhone", "Contact phone", "text"],
    ["address", "Address", "textarea"],
    ["salesNotes", "Notes", "textarea"],
    ["status", "Status", "text"],
    ["rewardThreshold", "Reward threshold", "number"],
    ["rewardText", "Reward text", "textarea"],
    ["brandColor", "Brand color", "color"],
    ["backgroundColor", "Background color", "color"],
    ["textColor", "Text color", "color"],
  ];

  function updateForm(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleDetailLogoFile(file) {
    if (!file) return;
    setError("");

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const logoUpload = makeLogoUpload(file, dataUrl);
      setForm((current) => ({
        ...current,
        logoUpload,
        logoPreviewUrl: dataUrl,
      }));
      const payload = await adminFetch("/api/admin/logo-suggestions", {
        method: "POST",
        body: JSON.stringify({ logoUpload }),
      });
      setForm((current) => ({
        ...current,
        colorSuggestions: payload?.suggestions || null,
      }));
    } catch (logoError) {
      setError(logoError.message || "Unable to read logo.");
    }
  }

  function applyDetailColorSuggestions() {
    const suggestions = form.colorSuggestions;
    if (!suggestions) return;
    setForm((current) => ({
      ...current,
      brandColor: suggestions.brandColor || current.brandColor,
      backgroundColor: suggestions.backgroundColor || current.backgroundColor,
      textColor: suggestions.textColor || current.textColor,
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const payload = await adminFetch(`/api/admin/merchants/${merchantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          rewardThreshold: form.rewardThreshold ? Number(form.rewardThreshold) : undefined,
        }),
      });
      const nextMerchant = extractMerchant(payload);
      setMerchant(nextMerchant || { ...merchant, ...form });
      if (nextMerchant) {
        setForm((current) => ({
          ...current,
          cafeName: getMerchantName(nextMerchant),
          contactName: pickFirst(nextMerchant.contactName, nextMerchant.contact?.name),
          contactEmail: getContactEmail(nextMerchant),
          contactPhone: pickFirst(nextMerchant.contactPhone, nextMerchant.contact?.phone),
          address: pickFirst(nextMerchant.address, nextMerchant.location?.address),
          salesNotes: pickFirst(nextMerchant.salesNotes, nextMerchant.notes),
          rewardThreshold: pickFirst(nextMerchant.rewardThreshold, nextMerchant.loyalty?.rewardThreshold),
          rewardText: pickFirst(nextMerchant.rewardText, nextMerchant.loyalty?.rewardText),
          brandColor: pickFirst(nextMerchant.brandColor, nextMerchant.branding?.brandColor),
          backgroundColor: pickFirst(nextMerchant.backgroundColor, nextMerchant.branding?.backgroundColor),
          textColor: pickFirst(nextMerchant.textColor, nextMerchant.branding?.textColor),
          status: pickFirst(nextMerchant.status, nextMerchant.state, "active"),
          logoUpload: null,
          logoPreviewUrl: "",
          logoUrl: getLogoUrl(nextMerchant),
          colorSuggestions: null,
        }));
      }
      setIsEditing(false);
      setSaveMessage("Saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save café.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell active="/admin/cafes">
      <section className="ps-flow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ps-eyebrow">Café detail</p>
            <h1 className="mt-3 text-3xl font-semibold">{getMerchantName(merchant)}</h1>
            <p className="mt-2 text-[var(--ps-muted)]">Slug and merchant ID are read-only in Stage 1.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="ps-button-secondary"
          >
            {isEditing ? "Cancel edit" : "Edit safe fields"}
          </button>
        </div>

        {saveMessage ? <p className="mt-4 text-sm font-semibold text-[var(--ps-blue)]">{saveMessage}</p> : null}
        {error ? <div className="mt-4"><Alert tone="red">{error}</Alert></div> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Detail label="Merchant ID" value={pickFirst(merchant.id, merchant.merchantId, merchant._id)} />
          <Detail label="Slug" value={getMerchantSlug(merchant)} />
          <Detail label="Status" value={pickFirst(merchant.status, merchant.state)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Links</h2>
              <div className="mt-4 grid gap-3">
                <Detail label="Join URL" value={links.joinUrl} />
                <Detail label="Merchant dashboard URL" value={links.merchantDashboardUrl} />
                <Detail label="Staff dashboard URL" value={links.staffDashboardUrl} />
                <Detail label="Demo pass URL" value={links.demoPassUrl} />
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Overview</h2>
              <div className="mt-4 grid gap-3">
                <Detail label="Contact email" value={getContactEmail(merchant)} />
                <Detail label="Contact phone" value={pickFirst(merchant.contactPhone, merchant.contact?.phone)} />
                <Detail label="Address" value={pickFirst(merchant.address, merchant.location?.address)} />
                <Detail label="Reward" value={pickFirst(merchant.rewardText, merchant.loyalty?.rewardText)} />
                <Detail label="Notes" value={pickFirst(merchant.salesNotes, merchant.notes)} />
                <Detail label="Logo" value={getLogoUrl(merchant)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">Safe fields</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {editableFields.map(([name, label, type]) => (
                <Field key={name} label={label}>
                  {isEditing ? (
                    <TextInput
                      type={type === "textarea" ? undefined : type}
                      multiline={type === "textarea"}
                      value={form[name] || ""}
                      onChange={(event) => updateForm(name, event.target.value)}
                    />
                  ) : (
                    <div className="rounded-xl bg-[#fbfaf7] p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-100">
                      {form[name] || "Not returned"}
                    </div>
                  )}
                </Field>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-[#fbfaf7] p-4 ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-[var(--ps-espresso)]">Logo</p>
              {form.logoPreviewUrl || form.logoUrl ? (
                <img src={form.logoPreviewUrl || form.logoUrl} alt="" className="mt-3 max-h-24 rounded-lg bg-white object-contain p-3 ring-1 ring-slate-100" />
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-500">No logo uploaded.</p>
              )}
              {isEditing ? (
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => handleDetailLogoFile(event.target.files?.[0])}
                    className="block w-full text-sm"
                  />
                  {form.colorSuggestions ? (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {(form.colorSuggestions.palette || []).map((color) => (
                          <span key={color} className="h-7 w-7 rounded-full ring-1 ring-slate-200" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <button type="button" onClick={applyDetailColorSuggestions} className="ps-button-secondary mt-3">
                        Apply suggested colours
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {isEditing ? (
              <div className="mt-6">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="ps-button-primary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function AccountPlaceholderPage() {
  return (
    <AdminShell active="/admin/account">
      <section className="ps-flow-card">
        <p className="ps-eyebrow">My Account</p>
        <h1 className="mt-3 text-3xl font-semibold">Account placeholder</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[var(--ps-muted)]">
          Admin identity and permissions will move behind Supabase role-based auth before production.
        </p>
      </section>
    </AdminShell>
  );
}

export default function AdminPortal({ path }) {
  if (path === "/admin") {
    window.history.replaceState(null, "", "/admin/onboard");
    return <OnboardCafePage />;
  }

  if (path === "/admin/onboard") return <OnboardCafePage />;
  if (path === "/admin/cafes") return <CafesListPage />;
  if (path === "/admin/account") return <AccountPlaceholderPage />;

  const detailMatch = path.match(/^\/admin\/cafes\/([^/]+)$/);
  if (detailMatch) {
    return <MerchantDetailPage merchantId={decodeURIComponent(detailMatch[1])} />;
  }

  return (
    <AdminShell active="/admin/onboard">
      <section className="ps-flow-card">
        <h1 className="text-3xl font-semibold">Admin page not found</h1>
        <a href="/admin/onboard" className="ps-button-primary mt-6">
          Go to onboarding
        </a>
      </section>
    </AdminShell>
  );
}
