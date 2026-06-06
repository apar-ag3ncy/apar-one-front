import { NextResponse } from "next/server";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Payload = {
  name?: string;
  email?: string;
  company?: string;
  services?: string[];
  budget?: string;
  message?: string;
};

/**
 * Project-enquiry / contact endpoint for the /start form.
 *
 * This validates the submission and acknowledges it. There is no email
 * provider or backend wired into this front-end repo yet, so for now the
 * enquiry is logged server-side — the submit flow works end-to-end without
 * any secrets. To deliver enquiries for real, plug a provider in where the
 * TODO is below (e.g. Resend / SendGrid, or POST to the apar-one-backend).
 */
export async function POST(req: Request) {
  let data: Payload;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const name = data.name?.trim();
  const email = data.email?.trim();
  const message = data.message?.trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "Please provide your name, email and a short message." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "That email address looks off." }, { status: 400 });
  }

  // TODO: deliver the enquiry — e.g. await resend.emails.send({...}) to
  // info@apar.agency, or forward to the apar-one-backend. Until then we log it.
  console.log("[contact] new enquiry", {
    name,
    email,
    company: data.company?.trim() || undefined,
    services: data.services?.length ? data.services : undefined,
    budget: data.budget || undefined,
    message,
  });

  return NextResponse.json({ ok: true });
}
