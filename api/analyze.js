export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY غير مضبوط في إعدادات Vercel" });

  try {
    const { rosterText, images, previousPresent } = req.body || {};
    if (!rosterText || !Array.isArray(images) || images.length === 0)
      return res.status(400).json({ error: "بيانات ناقصة" });

    const prevSection = previousPresent && previousPresent.length > 0
      ? `\n## سياق الفترة السابقة\nهؤلاء ظهروا في الفترة الأولى بالفعل (أرقامهم من قائمة المدعوين):\n${previousPresent.map(p => `- رقم ${p.num}: ${p.name} (ظهر في اللقطة باسم: "${p.rawName}")`).join("\n")}\nإذا ظهر نفس الشخص مجدداً في هذه الفترة، أكّده في present بنفس رقمه.\n`
      : "";

    const instruction = `أنت خبير دقيق في قراءة أسماء المشاركين من لقطات شاشة اجتماعات Webex وTeams ومطابقتها مع قوائم المدعوين.

## الخطوة ١: استخرج كل الأسماء من اللقطات بدقة
- اقرأ كل اسم مرئي في قائمة المشاركين
- تجاهل تمامًا: Me، Host، Presenter، Unverified، المضيف، أنا — هذه تسميات النظام
- احتفظ بالاسم كما هو مكتوب تمامًا (عربي أو إنجليزي)

## الخطوة ٢: طابق كل اسم مع قائمة المدعوين
قواعد المطابقة (مرتبة من الأعلى يقيناً للأدنى):

**مطابقة مؤكدة (confident: true):**
- تطابق اسم العائلة + أي جزء من الاسم الأول
- تحويل صوتي واضح: Turkii=تركي، Haifa=هيفاء، Zamil=زامل، Khalid=خالد، Faisal=فيصل، Abdullah=عبدالله، Mohammed/Mohammad=محمد، Bander=بندر، Nayef=نايف، Majed=ماجد، Ahmad=أحمد، Nouf=نوف، Lamia=لمياء، Haya/Hayaa=هياء، Taghreed=تغريد، Abdulaziz=عبدالعزيز، Abdulrahman=عبدالرحمن، Abdulmalik=عبدالملك، Meshari=مشاري، Osama=أسامة، Ibrahim=إبراهيم، Nawaf=نواف، Saud=سعود، Mazen/Muath=معاذ، Salman=سلمان، Khalf=خلف، Mana=مانع، Meana/Moana=معنى، Youssef=يوسف، Nemer/Namer=نمر، Anes=أنيس، Sultan=سلطان، Yahya=يحيى، Waleed=وليد، Falah=فلاح
- اسم مختصر + لقب المكتب/القطاع بعده (مثل "تركي - مدينتي المغرزات")

**مطابقة غير مؤكدة (confident: false) — تحتاج مراجعة المستخدم:**
- اسم أول فقط بدون عائلة وهناك أكثر من مدعو بنفس الاسم الأول
- شخص يحمل لقب مكتب/قطاع مدعو معين لكن باسم مختلف تمامًا (نائب محتمل)
- أي تشابه يجعلك غير متأكد 100%
${prevSection}

## الخطوة ٣: صنّف كل حضور خارج القائمة
إذا ظهر شخص لا يطابق أي مدعو، ضعه في outOfList.

## الإخراج — JSON فقط بالشكل التالي بالضبط:
{
  "present": [
    {"num": 1, "rawName": "الاسم كما ظهر في اللقطة تماماً", "confident": true}
  ],
  "uncertain": [
    {
      "rawName": "الاسم كما ظهر في اللقطة",
      "possibleMatches": [
        {"num": 13, "name": "م. محمد علي القحطاني", "reason": "تشابه الاسم"},
        {"num": 43, "name": "م. محمد يحيى القحطاني", "reason": "تشابه الاسم"}
      ],
      "issue": "وصف المشكلة باختصار — لماذا هذا غير مؤكد؟",
      "suggestedAction": "ما الذي يجب على المستخدم فعله؟"
    }
  ],
  "outOfList": ["اسم ظهر وليس من المدعوين ولا يحتمل أنه نائب"],
  "flags": ["ملاحظة عامة إن وجدت"]
}

قائمة المدعوين:
${rosterText}`;

    const content = [
      { type: "text", text: instruction },
      ...images.map((im) => ({
        type: "image",
        source: { type: "base64", media_type: im.mimeType || "image/jpeg", data: im.data },
      })),
      { type: "text", text: "حلّل اللقطات الآن وأعِد JSON فقط بدون أي نص قبله أو بعده." },
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
      return res.status(502).json({ error: "خطأ من خدمة Claude", detail: data?.error?.message || "" });
    }

    const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
    if (s === -1 || e === -1) return res.status(502).json({ error: "رد غير متوقع من Claude", raw: text.slice(0, 300) });

    const parsed = JSON.parse(clean.slice(s, e + 1));
    return res.status(200).json({
      present: parsed.present || [],
      uncertain: parsed.uncertain || [],
      outOfList: parsed.outOfList || [],
      flags: parsed.flags || [],
    });

  } catch (err) {
    console.error("Function error:", err);
    return res.status(500).json({ error: "فشل التحليل", detail: String(err?.message || err) });
  }
}
