// Vercel serverless function — validates the access password
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { password } = req.body || {};
  const correct = process.env.ACCESS_PASSWORD;

  if (!correct) return res.status(500).json({ error: "ACCESS_PASSWORD غير مضبوط في إعدادات Vercel" });
  if (!password) return res.status(400).json({ error: "الرمز مطلوب" });

  if (password === correct) {
    return res.status(200).json({ ok: true });
  } else {
    return res.status(401).json({ error: "رمز غير صحيح" });
  }
}
