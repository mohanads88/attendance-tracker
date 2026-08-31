export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY غير مضبوط في إعدادات Vercel" });

  try {
    const body = req.body || {};
    const { rosterText, images, previousPresent } = body;

    if (!rosterText) return res.status(400).json({ error: "قائمة المدعوين مفقودة" });
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: "لا توجد لقطات للتحليل" });

    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 4000000) {
      return res.status(413).json({
        error: `حجم اللقطات كبير جداً (${Math.round(payloadSize/1024)}KB) — قلّل عدد اللقطات`,
      });
    }

    const prevSection = Array.isArray(previousPresent) && previousPresent.length > 0
      ? `\n## الفترة الأولى (مرجع)\nهؤلاء تأكّد حضورهم في الفترة الأولى — إذا ظهروا مجدداً أكّدهم مباشرة:\n${previousPresent.map(p => `- رقم ${p.num}: "${p.rawName}"`).join("\n")}\n`
      : "";

    const instruction = `أنت خبير في مطابقة أسماء المشاركين في اجتماعات Webex/Teams مع قوائم المدعوين.

## قاعدة المطابقة الأساسية — اسم العائلة أولاً
**المعيار الأول والأهم هو اسم العائلة (اللقب)**، وليس الاسم الأول.
- "Bander Alkatheri" → ابحث عمن لقبه "الكثيري" في القائمة (= بندر الكثيري)، وليس كل من اسمه "بندر"
- "Bander Alharbi" → ابحث عمن لقبه "الحربي" (= بندر الحربي)
- "Mohammed Alqahtani" → ابحث عمن لقبه "القحطاني" — قد يكون أكثر من شخص فتضعه uncertain
- "zamil alshammari" → لقبه "الشمري" = زامل الشمري
- "Turkii" → اسم أول فقط بلا لقب → uncertain إن كان هناك أكثر من تركي، مؤكد إن كان واحداً

## جدول التحويل الصوتي للألقاب (اسم العائلة)
Alkatheri=الكثيري، Alharbi=الحربي، Alrowaily/Alruwaily=الرويلي، Alaqeel=العقيل، Alhunaidi=الحنيدي، 
Aldalbahi/Aldlbahi=الدلبحي، Alomari=العميري، Alqahtani=القحطاني، Alaqeel=العقيل،
Alsaiari/Alsayari=السياري، Almadhi/Almaathy=الماضي، Aldalbahi=الدلبحي، Alomiri/Alomeri=العميري،
Alaqeel=العقيل، Alnassar/Alnasser=النصار، Alzahrani=الزهراني، Alkriidis/Alkreidis=الكريديس،
Alsuwailem/Alsuwayylem=السويلم، Alanazi/Alenazi=العنزي، Albaker/Albakar=البكر،
Altlasi/Althalasi=الطلاسي، Alajlan/Alajlaan=العجلان، Aldhayib/Aldhyib=الذييب،
Alfaqih/Faqih=فقيه، Alasmari=الأسمري، Aldosari/Aldossari=الدوسري، Alsabiee/Alsobiee=السبيعي،
Alfahd=الفهد، Alotaibi/Alataibi=العتيبي، Karhaan/Karhan=كرحان، Alshammari=الشمري،
Alyousif/Alyousef=اليوسف، Alissa/Aleisa=العيسى، Barkati/Barkati=بركاتي، Bawazer/Bawazeer=باوزير،
Ateeq/Atiq=عتيق، Almutairi/Almutair=المطيري، Albarrak=البراك، Alnassian/Alnasian=النصيان،
Alruwaili/Alrowaily=الرويلي، Alkhlaifi/Alkhulaifi=الكثيري، Alkatheri=الكثيري،
Aldagfaq/Aldaghfaq=الدغفق، Alghamdi=الغامدي

## جدول التحويل الصوتي للأسماء الأولى
Bander=بندر، Khalid/Khaled=خالد، Mohammed/Mohammad/Muhammad=محمد، Abdullah=عبدالله،
Faisal/Faysal=فيصل، Nayef/Naif=نايف، Majed/Maajed=ماجد، Ahmad/Ahmed=أحمد،
Abdulaziz=عبدالعزيز، Abdulrahman=عبدالرحمن، Abdulmalik=عبدالملك، Meshari=مشاري،
Osama=أسامة، Ibrahim=إبراهيم، Falah=فلاح، Khalf=خلف، Mana/Mane=مانع،
Nemer/Namer=نمر، Sultan=سلطان، Yahya=يحيى، Waleed=وليد، Turkii/Turki=تركي،
Haifa/Haifaa=هيفاء، Zamil/Zamel=زامل، Lamia/Lmyaa=لمياء، Haya/Hayaa=هياء،
Taghreed/Tagrid=تغريد، Nouf=نوف، Saud=سعود، Nawaf=نواف, Muath/Muaadh=معاذ,
Meana/Moana/Maana=معنى، Anes/Anis=أنيس، Youssef/Yousef=يوسف، Salman=سلمان
${prevSection}
## الخطوة ١: استخرج كل الأسماء من اللقطات
- اقرأ كل اسم في قائمة المشاركين بدقة
- تجاهل: Me، Host، Presenter، Unverified، المضيف، أنا
- احتفظ بالاسم كما كُتب تماماً

## الخطوة ٢: لكل اسم طابق باستخدام قاعدة اسم العائلة أولاً
1. استخرج اسم العائلة من الاسم الظاهر في اللقطة
2. ابحث في القائمة عمن لقبه يطابق هذا اللقب (بعد التحويل الصوتي)
3. إن وجدت شخصاً واحداً → present مؤكد (confident: true)
4. إن وجدت أكثر من شخص بنفس اللقب → uncertain
5. إن لم يوجد أي لقب (اسم أول فقط) وهناك أكثر من مدعو بهذا الاسم → uncertain
6. إن لم يطابق أي مدعو → outOfList

## الخطوة ٣: الإخراج — JSON فقط بلا أي نص آخر
{
  "present": [{"num": 52, "rawName": "Bander Alkatheri (alriyadh)", "confident": true}],
  "uncertain": [{
    "rawName": "الاسم كما ظهر",
    "possibleMatches": [{"num": 13, "name": "م. محمد علي القحطاني", "reason": "نفس اللقب القحطاني"}],
    "issue": "وصف المشكلة",
    "suggestedAction": "ماذا يفعل المستخدم؟"
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
      { type: "text", text: "حلّل الآن — اسم العائلة أولاً — وأعِد JSON فقط." },
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
    const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
    if (s === -1 || e === -1) {
      console.error("Unexpected response:", text.slice(0, 300));
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
