/* Campaign tags + Meta Pixel events for the memory test.
   Privacy rules (do not loosen):
   - Browser pixel events carry NO personal data: no phone, no name, no level/track.
   - School students (Class 6–8, 9–12): their phone and name never go to Meta, browser or server.
   - Purchase is sent from the server (Razorpay -> Conversions API), never from the browser. */

const ATTRIB_KEY = "bd_mt_attrib_v1";
const DEFAULT_CAMPAIGN = "B_free_test";

function readParams() {
  const p = new URLSearchParams(location.search);
  const pick = (k) => (p.get(k) || "").slice(0, 120);
  return {
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_content: pick("utm_content"),
    utm_term: pick("utm_term"),
    ref: pick("ref"),
    fbclid: pick("fbclid"),
  };
}

/* First touch wins: a student who first came from an ad keeps that ad's tag,
   even if they later come back from a WhatsApp link. */
export function getAttrib() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(ATTRIB_KEY)); } catch (e) {}
  const now = readParams();
  if (!saved || (!saved.utm_campaign && now.utm_campaign)) {
    saved = Object.assign({}, now, {
      campaign: now.utm_campaign || DEFAULT_CAMPAIGN,
      landing: location.pathname,
      first_seen: new Date().toISOString(),
    });
    try { localStorage.setItem(ATTRIB_KEY, JSON.stringify(saved)); } catch (e) {}
  }
  return saved;
}

function cookie(name) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}
/* Meta's own browser IDs (not personal details). Sent to our server so a later Purchase
   from a competitive-exam student can be matched to the ad. Never used for school tracks. */
export function metaIds() {
  return { fbp: cookie("_fbp"), fbc: cookie("_fbc") };
}

const STANDARD = ["PageView", "Lead", "InitiateCheckout", "Purchase"];
/* Paid-first students (/memory-test/class) send no test events, so they never mix with
   the free-test campaign's Lead/checkout signals. */
let QUIET = false;
export function setQuiet(v) { QUIET = Boolean(v); }
export function pixel(name, extra) {
  try {
    if (QUIET || typeof window.fbq !== "function") return;
    const a = getAttrib();
    const params = Object.assign({ content_name: "memory_test", campaign: a.campaign }, extra || {});
    const opts = { eventID: name + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) };
    if (STANDARD.includes(name)) window.fbq("track", name, params, opts);
    else window.fbq("trackCustom", name, params, opts);
  } catch (e) {}
}

/* Adds the campaign tag to a brainodad.com link we hand out (share messages etc.). */
export function taggedLink(path, campaign) {
  return "https://brainodad.com" + path + "?utm_source=share&utm_medium=whatsapp&utm_campaign=" + encodeURIComponent(campaign);
}
