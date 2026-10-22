// Signed, expiring session tokens for the shared access password.
// The signing key is derived from ACCESS_PASSWORD, so changing the password
// in Vercel signs everyone out.
import crypto from "node:crypto";

const TTL_HOURS = 12;

function key() {
  const p = process.env.ACCESS_PASSWORD;
  return p ? crypto.createHash("sha256").update("rased-v1:" + p).digest() : null;
}

function sign(payload) {
  return crypto.createHmac("sha256", key()).update(payload).digest("base64url");
}

// Constant-time string comparison (hash first so lengths always match).
export function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function passwordConfigured() {
  return !!process.env.ACCESS_PASSWORD;
}

export function checkPassword(password) {
  return passwordConfigured() && safeEqual(password || "", process.env.ACCESS_PASSWORD);
}

export function issueToken() {
  const exp = String(Date.now() + TTL_HOURS * 3600 * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token) {
  if (!passwordConfigured() || typeof token !== "string") return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

// Returns true when the request carries a valid token; otherwise answers 401.
export function requireAuth(req, res) {
  const h = req.headers?.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (verifyToken(token)) return true;
  res.status(401).json({ error: "انتهت الجلسة — أدخل رمز الدخول مرة أخرى" });
  return false;
}
