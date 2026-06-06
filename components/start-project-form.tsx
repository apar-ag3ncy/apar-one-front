"use client";

import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/reveal";
import { Magnetic } from "@/components/magnetic";
import { cn } from "@/lib/utils";

const SERVICES = ["Branding", "Digital Marketing", "AI Content", "Strategy & Campaigns"];
const BUDGETS = ["< ₹1L", "₹1–3L", "₹3–8L", "₹8L+", "Not sure yet"];
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Errors = Partial<Record<"name" | "email" | "message", string>>;
type Status = "idle" | "submitting" | "error";

export function StartProjectForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const toggleService = (s: string) =>
    setServices((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Tell us your name.";
    if (!email.trim()) e.email = "We need an email to reply.";
    else if (!EMAIL_RE.test(email.trim())) e.email = "That email looks off.";
    if (message.trim().length < 10) e.message = "A line or two about the project, please.";
    return e;
  };

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      // Move focus to the first invalid field so screen readers announce the
      // error (via its aria-describedby) and the user lands where to fix it.
      const firstErr = (["name", "email", "message"] as const).find((k) => e[k]);
      if (firstErr) document.getElementById(`cf-${firstErr}`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, services, budget, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (done) {
    return (
      <Reveal className="form-success" role="status" aria-live="polite">
        <div className="fs-mark">✓</div>
        <h3>Message on its way.</h3>
        <p>
          Thanks{name ? `, ${name.split(" ")[0]}` : ""} — we&apos;ve got your enquiry and will be in
          touch within one working day. In a hurry? Email{" "}
          <a href="mailto:info@apar.agency">info@apar.agency</a> directly.
        </p>
      </Reveal>
    );
  }

  return (
    <Reveal i={1}>
      <form className="start-form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <div className={cn("field", errors.name && "invalid")}>
          <label htmlFor="cf-name">
            Name<span className="req">*</span>
          </label>
          <input
            id="cf-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-err" : undefined}
          />
          {errors.name && (
            <span className="field-err" id="cf-name-err">
              {errors.name}
            </span>
          )}
        </div>

        <div className={cn("field", errors.email && "invalid")}>
          <label htmlFor="cf-email">
            Email<span className="req">*</span>
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@brand.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-email-err" : undefined}
          />
          {errors.email && (
            <span className="field-err" id="cf-email-err">
              {errors.email}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="cf-company">Company / brand</label>
        <input
          id="cf-company"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Optional"
          autoComplete="organization"
        />
      </div>

      <fieldset className="field-chips">
        <legend>What do you need?</legend>
        <div className="chip-row">
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              className={cn("chip", services.includes(s) && "sel")}
              aria-pressed={services.includes(s)}
              onClick={() => toggleService(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field-chips">
        <legend>Ballpark budget</legend>
        <div className="chip-row">
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              className={cn("chip", budget === b && "sel")}
              aria-pressed={budget === b}
              onClick={() => setBudget((cur) => (cur === b ? "" : b))}
            >
              {b}
            </button>
          ))}
        </div>
      </fieldset>

      <div className={cn("field", errors.message && "invalid")}>
        <label htmlFor="cf-message">
          About the project<span className="req">*</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What are you building, and what does success look like?"
          rows={6}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-err" : undefined}
        />
        {errors.message && (
          <span className="field-err" id="cf-message-err">
            {errors.message}
          </span>
        )}
      </div>

      {status === "error" && serverError && (
        <div className="form-status err" role="alert">
          {serverError}
        </div>
      )}

      <div className="form-actions">
        <Magnetic>
          <button
            className="btn"
            type="submit"
            disabled={status === "submitting"}
            data-cursor-label="Send"
          >
            <span>{status === "submitting" ? "Sending…" : "Send enquiry"}</span>
            <span className="arr">↗</span>
          </button>
        </Magnetic>
        <span className="form-note">
          Or email <a href="mailto:info@apar.agency">info@apar.agency</a>
        </span>
      </div>
      </form>
    </Reveal>
  );
}
