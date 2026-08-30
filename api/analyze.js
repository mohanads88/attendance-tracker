export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY غير مضبوط في إعدادات Vercel" });

  try {
    const body = req.body || {};
    const { rosterText, images, previousPresent } = body;

    // Validate inputs
    if (!rosterText) return res.status(400).json({ error: "قائمة المدعوين مفقودة" });
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: "لا توجد لقطات للتحليل" });

    // Check payload size — Vercel limit is 4.5MB
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 4000000) {
      return res.status(413).json({
        error: "حجم اللقطات كبير جداً — قلّل عدد اللقطات أو استخدم صوراً بدقة أقل",
        detail: `حجم الطلب: ${Math.round(payloadSize/1024)}KB (الحد الأقصى: ~4000KB)`
      });
    }

    // Build previous period context (text only — no images)
    const prevSection = Array.isArray(previousPresent) && previousPresent.length > 0
      ? `\n## سياق الفترة الأولى (للمرجعية فقط)
هؤلاء تأكّد حضورهم في الفترة الأولى:
${previousPresent.map(p => `- رقم ${p.num}: ${p.rawName}`).join("\n")}
إذا ظهر نفس الشخص في هذه الفترة، أكّده في present بنفس رقمه مباشرةً (confident: true).\n`
      : "";

    const instruction = `أنت خبير دقيق في قراءة أسماء المشاركين من لقطات شاشة اجتماعات Webex وTeams ومطابقتها مع قوائم المدعوين.

## الخطوة ١: استخرج كل الأسماء من اللقطات
- اقرأ كل اسم مرئي في قائمة المشاركين بدقة
- تجاهل تمامًا: Me، Host، Presenter، Unverified، المضيف، أنا
- احتفظ بالاسم كما هو مكتوب تمامًا
${prevSection}
## الخطوة ٢: طابق مع قائمة المدعوين

**مؤكد (confident: true) عند:**
- تطابق اسم العائلة + جزء من الاسم الأول
- تحويل صوتي واضح: Turkii=تركي، Haifa=هيفاء، Zamil=زامل، Khalid=خالد، Faisal=فيصل، Abdullah=عبدالله، Mohammed=محمد، Bander=بندر، Nayef=نايف، Majed=ماجد، Ahmad=أحمد، Lamia=لمياء، Haya=هياء، Taghreed=تغريد، Abdulaziz=عبدالعزيز، Abdulrahman=عبدالرحمن، Meshari=مشاري، Osama=أسامة، Ibrahim=إبراهيم، Falah=فلاح، Khalf=خلف، Mana=مانع، Nemer=نمر، Sultan=سلطان، Yahya=يحيى
- اسم مختصر + لقب المكتب/القطاع

**غير مؤكد (confident: false) عند:**
- اسم أول فقط وهناك أكثر من مدعو بنفسه
- شخص يحمل لقب مكتب مدعو لكن باسم مختلف (نائب محتمل)
- أي تشابه غير واضح 100%

## الخطوة ٣: الإخراج
أعِد JSON فقط — لا نص قبله ولا بعده:
{
  "present": [{"num": 1, "rawName": "الاسم كما ظهر", "confident": true}],
  "uncertain": [{
    "rawName": "الاسم كما ظهر",
    "possibleMatches": [{"num": 13, "name": "م. محمد علي القحطاني", "reason": "سبب التشابه"}],
    "issue": "وصف المشكلة باختصار",
    "suggestedAction": "ماذا يجب على المستخدم أن يفعل؟"
  }],
  "outOfList": ["اسم ليس من المدعوين"],
  "flags": []
}

قائمة المدعوين:
${rosterText}`;

    const content = [
      { type: "text", text: instruction },
      ...images.map(im => ({
        type: "image",
        source: { type: "base64", media_type: im.mimeType || "image/jpeg", data: im.data },
      })),
      { type: "text", text: "حلّل الآن وأعِد JSON فقط." },
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
      console.error("Claude error:", JSON.stringify(data));
      return res.status(502).json({
        error: "خطأ من خدمة Claude",
        detail: data?.error?.message || JSON.stringify(data).slice(0, 200),
      });
    }

    const text = (data.content || []).map(b => b.type === "text" ? b.text : "").join("").trim();
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = clean.indexOf("{");
    const e = clean.lastIndexOf("}");
    if (s === -1 || e === -1) {
      console.error("Unexpected Claude response:", text.slice(0, 300));
      return res.status(502).json({ error: "رد غير متوقع من Claude", raw: text.slice(0, 200) });
    }

    const parsed = JSON.parse(clean.slice(s, e + 1));
    return res.status(200).json({
      present:   parsed.present   || [],
      uncertain: parsed.uncertain || [],
      outOfList: parsed.outOfList || [],
      flags:     parsed.flags     || [],
    });

  } catch (err) {
    console.error("Function crash:", err);
    return res.status(500).json({
      error: "فشل التحليل",
      detail: String(err?.message || err),
    });
  }
}
