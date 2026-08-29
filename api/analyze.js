// Vercel serverless function — keeps the Gemini key server-side.
// Receives { rosterText, images:[{mimeType,data}] } and returns { present, outOfList, flags }.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "GEMINI_API_KEY غير مضبوط في إعدادات Vercel" });
  }

  try {
    const { rosterText, images } = req.body || {};
    if (!rosterText || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "بيانات ناقصة: يلزم قائمة المدعوين ولقطة واحدة على الأقل" });
    }

    const instruction =
`أنت مساعد لرصد حضور الاجتماعات. لديك قائمة المدعوين المرقّمة، ولقطات شاشة لقائمة المشاركين في اجتماع مرئي (Webex/Teams).
مهمتك: حدّد أي المدعوين (بالرقم) يظهرون في اللقطات. طابِق رغم اختلاف الصيغة: إنجليزي مقابل عربي، تحويل صوتي (transliteration)، اختصار الاسم أو اللقب، أو إضافة اسم المكتب/القطاع بعد الاسم.
أعِد JSON فقط بالشكل التالي بالضبط:
{"present":[{"num":1,"name":"الاسم كما ظهر في اللقطة"}],"outOfList":["اسم ظهر وليس من المدعوين"],"flags":["ملاحظة عن أي حالة غير مؤكدة"]}
قواعد:
- لا تُدرج المدعو في present إلا إذا ظهر فعلاً في اللقطات.
- إذا ظهر اسمان متشابهان لمدعوَّين مختلفين دون ما يميّز بينهما، أضِف ملاحظة في flags.
- إذا بدا أحد الحاضرين نائبًا عن مدعو (يحمل لقب المكتب لكن باسم شخص مختلف)، ضعه في outOfList وأضِف ملاحظة في flags، ولا تحسب المدعو الأصلي حاضرًا.
قائمة المدعوين:
${rosterText}`;

    const parts = [
      { text: instruction },
      ...images.map((im) => ({ inlineData: { mimeType: im.mimeType || "image/jpeg", data: im.data } })),
      { text: "حلّل اللقطات وأعِد JSON فقط." },
    ];

    const body = {
      contents: [{ parts }],
      generationConfig: { temperature: 0, maxOutputTokens: 4096, responseMimeType: "application/json" },
    };

    // Model id can change over time; swap here if Google renames it.
    const MODEL = "gemini-2.5-flash-preview-05-20";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

    const gr = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await gr.json();
    if (!gr.ok) {
  console.error("Gemini error:", JSON.stringify(data));
  return res.status(502).json({ error: "خطأ من خدمة Gemini", detail: data?.error?.message || JSON.stringify(data) });
}
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = clean.indexOf("{");
    const e = clean.lastIndexOf("}");
    if (s === -1 || e === -1) {
      return res.status(502).json({ error: "رد غير متوقع من Gemini" });
    }
    const parsed = JSON.parse(clean.slice(s, e + 1));
    return res.status(200).json({
      present: parsed.present || [],
      outOfList: parsed.outOfList || [],
      flags: parsed.flags || [],
    });
  } catch (err) {
    return res.status(500).json({ error: "فشل التحليل", detail: String(err && err.message || err) });
  }
}
