// Checks the shared access password and returns a signed session token.
import { checkPassword, issueToken, passwordConfigured } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!passwordConfigured())
    return res.status(500).json({ error: "ACCESS_PASSWORD غير مضبوط في إعدادات Vercel" });

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: "الرمز مطلوب" });

  if (checkPassword(password)) return res.status(200).json({ ok: true, token: issueToken() });

  // slow down guessing
  await new Promise((r) => setTimeout(r, 600));
  return res.status(401).json({ error: "رمز غير صحيح" });
}
