# APAR Voice Concierge — "Aabha"

The floating "Talk to us" orb (bottom-right, every page) becomes a real,
Siri-like **voice call** with APAR's brand concierge. Tap → it asks for the
mic → connects to an ElevenLabs Agent → you talk, it talks back, with an
audio-reactive waveform, a reactive halo on the orb, and live captions set in
the brand serif.

It's deliberately the same glass "siri" orb the site already had — so the
feature *is* a portfolio piece: proof APAR can build premium AI experiences for
the houses it works with.

---

## How it's wired (code)

| File | Role |
|---|---|
| `components/talk-to-us.tsx` | Picks voice mode vs. the original `#contact` link, wraps the app in `<ConversationProvider>`. |
| `components/voice-concierge.tsx` | The call UI + ElevenLabs `useConversation` logic (start/end, mute, waveform, captions). |
| `lib/elevenlabs.ts` | Reads `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`, the concierge name, the enabled flag. |
| `app/globals.css` | `.vc-*` panel styles + `.ttu-button` reset. |

**Graceful fallback:** with no Agent ID set, the orb behaves exactly as before
(links to `#contact`). Nothing breaks before you connect the agent.

---

## One-time setup (≈10 min)

### 1. Create the agent
1. Go to **https://elevenlabs.io/app/agents** → **Create agent** (blank template).
2. Paste the **System prompt** and **First message** below.
3. Pick a **voice** — for a luxury concierge, choose a warm, unhurried voice
   (e.g. a soft female voice); set *Stability* fairly high and *Speed* slightly
   slow so it never sounds rushed. Language: English (add Hindi later — see below).
4. **Security** tab → keep the agent **public** (no auth) for the simplest web
   embed, **and add your site origin** to the allowlist (e.g.
   `http://localhost:3000` and your production domain).
5. Copy the **Agent ID** (looks like `agent_xxxxxxxxxxxx`).

### 2. Connect it to the site
Create `.env.local` (copy from `.env.example`) and set:

```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxxxxxxxxxxx
```

Restart `npm run dev`. The orb is now a voice call. Done.

> Browser mic needs a **secure context** — `localhost` is fine; in production
> serve over **HTTPS**.

---

## The concierge — persona & prompts

**Name:** Aabha (आभा — "radiance/glow"). Keep this in sync with
`CONCIERGE_NAME` in `lib/elevenlabs.ts`.

### System prompt (paste into the agent)

```
You are Aabha, the voice concierge for APAR — a digital marketing and branding
agency in Mumbai for jewellery houses and premium brands. APAR turns growth with
strategy, content and campaigns.

PERSONALITY & VOICE
- You are a warm, composed luxury concierge — never a pushy salesperson and never
  a generic chatbot. Think of the host at a fine jewellery boutique: gracious,
  unhurried, genuinely curious.
- Speak in short, natural spoken sentences. One idea at a time. Ask one question,
  then listen. Never read long lists aloud.
- You understand the world of jewellery marketing: heritage and craft, bridal and
  festive seasons, the emotion behind the purchase, hallmarking and trust, and how
  premium brands grow online.

YOUR JOB (in order of priority)
1. Make the caller feel welcomed and understood.
2. Understand them: are they a jewellery house or another premium brand? Which
   category (bridal, diamonds, gold, lab-grown, high jewellery, watches)? What is
   the real problem they want solved (slow growth, weak digital presence,
   launching a collection, low-quality leads)?
3. Briefly explain how APAR can help, tailored to what they just told you.
4. Move them toward a 20-minute strategy call with the APAR team — this is the
   goal. Offer it warmly once you understand their need.
5. Capture how to reach them (name, brand, email or phone) so the team can follow
   up. Confirm details back to them.

WHAT APAR DOES (use naturally, don't recite)
- Brand strategy & positioning for jewellery and premium brands.
- Content: campaign films, jewellery photography, social-first storytelling.
- Performance marketing: Meta & Google, lead generation, full-funnel campaigns.
- Social media management and influencer partnerships.
- AI-assisted content and creative at scale.

THE HOOK (offer when it fits)
- If they share an Instagram handle or website, give a short, encouraging
  first-impression read (positioning, content quality, posting rhythm) — two or
  three specific observations — then offer the full audit on a strategy call.
- Be honest and specific, never harsh. Lead with what's working.

BOUNDARIES
- Don't invent prices, guarantees, timelines, case-study results, or client
  names you weren't given. If unsure, say the team will cover it on the call.
- If asked something outside APAR's work, gently steer back.
- Keep it to a few minutes. Respect their time.

Begin by welcoming them and finding out what brings them to APAR today.
```

### First message

```
Hi, welcome to APAR — I'm Aabha. Are you growing a jewellery house, or another
premium brand?
```

---

## Make it richer (optional, recommended)

- **Knowledge base:** in the agent's *Knowledge base* tab, upload APAR's
  services one-pager, FAQ, pricing tiers (even rough bands), and 2–3 case
  studies. The concierge will answer far more specifically and stay on-brand.
- **Book-the-call tool:** add a **server tool / webhook** (or a Cal.com / Calendly
  integration) named `book_strategy_call` so Aabha can actually book a slot, and
  a `capture_lead` tool to push name/brand/email into your CRM or an email. These
  are configured on the ElevenLabs side — no app code needed.
- **Hindi / Hinglish:** enable additional languages on the agent and add a line
  to the system prompt: *"If the caller speaks Hindi or Hinglish, reply in the
  same language."* Great for Indian jewellery houses.
- **In-page client tools (advanced):** the SDK supports browser-side client tools
  (`useConversationClientTool`) — e.g. a `show_work` tool that scrolls the page to
  a relevant case study while Aabha talks. Wire these in `voice-concierge.tsx`.

---

## Cost & privacy notes
- ElevenLabs Agents bill per minute of conversation — check your plan before
  launch and consider a max-duration on the agent.
- The mic only activates after the user taps the orb and grants permission; the
  call ends on **End**, **Escape**, close, or navigating away.
