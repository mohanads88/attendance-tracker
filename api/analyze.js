// Vercel function: Claude reads the participant names from the screenshots,
// then lib/match.js matches them to the invitee roster (deterministic code).
import { matchAll } from "../lib/match.js";
import { requireAuth } from "../lib/auth.js";

// ════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!requireAuth(req, res)) return;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY غير مضبوط في إعدادات Vercel" });

  try {
    const body = req.body || {};
    const { rosterJson, images, previousPresent } = body;
    if (!Array.isArray(images) || images.length === 0)
      return res.status(400).json({ error: "لا توجد لقطات للتحليل" });
    if (JSON.stringify(body).length > 4000000)
      return res.status(413).json({ error: "حجم اللقطات كبير جداً — قلّل عدد اللقطات" });

    const prevContext = Array.isArray(previousPresent) && previousPresent.length > 0
      ? `\nهؤلاء ظهروا في الفترة السابقة:\n${previousPresent.map(p => `"${p.rawName}"`).join("، ")}\n`
      : "";

    const extractPrompt = `مهمتك الوحيدة: استخرج كل اسم في قائمة المشاركين من هذه اللقطات.

## المنهجية — اتبع هذه الخطوات بالترتيب

**الخطوة ١: امسح اللقطة من أعلى إلى أسفل بالكامل**
عُدّ عدد الأسماء الظاهرة تقريباً، ثم تأكد أن JSON النهائي يحتوي نفس العدد تقريباً.

**الخطوة ٢: لكل سطر استخرج الاسم كما هو**
- اسم عربي → اكتبه بالعربية
- اسم إنجليزي → اكتبه بالإنجليزية
- بريد إلكتروني مثل tfaqih@alriyadh.gov.sa → اكتبه كاملاً
- "Unverified" أو alriyadh.gov.sa كنص ثانوي فقط → تجاهله

**تجاهل كلياً:** Me، Host، Presenter، Unverified، المضيف، أنا

**تنبيهات القراءة — أحرف تتشابه بصرياً:**
| الخطأ الشائع | الصحيح |
|---|---|
| حسيري | عسيري (ح ↔ ع) |
| الثمراني | الشمراني (ث ↔ ش) |
| الدلبجي | الدلبحي (ج ↔ ح) |
| العقيل | العقل (حرف زائد) |
| الذيب | الذييب (ياءان) |
| ال حيدر | آل حيدر |
${prevContext}
**الإخراج — JSON فقط:**
{"names": ["الاسم الأول", "الاسم الثاني"]}`;

    const content = [
      { type: "text", text: extractPrompt },
      ...images.map(im => ({
        type: "image",
        source: { type: "base64", media_type: im.mimeType || "image/jpeg", data: im.data },
      })),
      { type: "text", text: "اقرأ الأسماء بدقة وأعِد JSON فقط." },
    ];

    const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content }],
      }),
    });

    const claudeData = await claudeResp.json();
    if (!claudeResp.ok)
      return res.status(502).json({ error: "خطأ من خدمة Claude", detail: claudeData?.error?.message || "" });

    const rawText  = (claudeData.content || []).map(b => b.type === "text" ? b.text : "").join("").trim();
    const cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = cleanText.indexOf("{"), e = cleanText.lastIndexOf("}");
    if (s === -1 || e === -1) {
      console.error("Claude raw response:", rawText.slice(0, 500));
      return res.status(502).json({ error: "رد غير متوقع من Claude", raw: rawText.slice(0, 300) });
    }

    const extracted = JSON.parse(cleanText.slice(s, e + 1));
    const rawNames  = (extracted.names || []).filter(n => n && n.trim().length > 1);

    const roster = Array.isArray(rosterJson) ? rosterJson : [];
    const { present, uncertain, outOfList, scores } = matchAll(rawNames, roster);

    return res.status(200).json({
      present, uncertain, outOfList, flags: [],
      extractedCount: rawNames.length,
      scores,
    });

  } catch (err) {
    console.error("Crash:", err);
    return res.status(500).json({ error: "فشل التحليل", detail: String(err?.message || err) });
  }
}
