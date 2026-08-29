// Vercel serverless function — uses Claude API for screenshot analysis.
 
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
 
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY غير مضبوط في إعدادات Vercel" });
 
  try {
    const { rosterText, images } = req.body || {};
    if (!rosterText || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "بيانات ناقصة" });
    }
 
    const instruction = `أنت مساعد لرصد حضور الاجتماعات. لديك قائمة المدعوين المرقّمة، ولقطات شاشة لقائمة المشاركين في اجتماع مرئي (Webex/Teams).
مهمتك: حدّد أي المدعوين (بالرقم) يظهرون في اللقطات. طابِق رغم اختلاف الصيغة: إنجليزي مقابل عربي، تحويل صوتي، اختصار الاسم، أو إضافة اسم المكتب بعد الاسم.
أعِد JSON فقط بالشكل التالي بالضبط، بدون أي نص إضافي:
{"present":[{"num":1,"name":"الاسم كما ظهر في اللقطة"}],"outOfList":["اسم ظهر وليس من المدعوين"],"flags":["ملاحظة عن أي حالة غير مؤكدة"]}
قواعد:
- لا تُدرج المدعو في present إلا إذا ظهر فعلاً في اللقطات.
- إذا ظهر اسمان متشابهان لمدعوَّين مختلفين دون ما يميّز بينهما، أضِف ملاحظة في flags.
- إذا بدا أحد الحاضرين نائبًا عن مدعو، ضعه في outOfList وأضِف ملاحظة في flags.
قائمة المدعوين:
${rosterText}`;
 
    const content = [
      { type: "text", text: instruction },
      ...images.map((im) => ({
        type: "image",
        source: { type: "base64", media_type: im.mimeType || "image/jpeg", data: im.data },
      })),
      { type: "text", text: "حلّل اللقطات وأعِد JSON فقط." },
    ];
 
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content }],
      }),
    });
 
    const data = await response.json();
 
    if (!response.ok) {
      console.error("Claude API error:", JSON.stringify(data));
      return res.status(502).json({ error: "خطأ من خدمة Claude", detail: data?.error?.message || "" });
    }
 
    const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = clean.indexOf("{");
    const e = clean.lastIndexOf("}");
    if (s === -1 || e === -1) return res.status(502).json({ error: "رد غير متوقع من Claude" });
 
    const parsed = JSON.parse(clean.slice(s, e + 1));
    return res.status(200).json({
      present: parsed.present || [],
      outOfList: parsed.outOfList || [],
      flags: parsed.flags || [],
    });
 
  } catch (err) {
    console.error("Function error:", err);
    return res.status(500).json({ error: "فشل التحليل", detail: String(err?.message || err) });
  }
}
