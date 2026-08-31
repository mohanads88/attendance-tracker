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
      ? `\n## الفترة الأولى (مرجع)\nهؤلاء تأكّد حضورهم مسبقاً — إذا ظهروا مجدداً أكّدهم مباشرة:\n${previousPresent.map(p => `- رقم ${p.num}: "${p.rawName}"`).join("\n")}\n`
      : "";

    const instruction = `أنت خبير في مطابقة أسماء المشاركين في اجتماعات Webex/Teams مع قوائم المدعوين.

## مبدأ المطابقة الأساسي: الاسم الكامل يُحسم — الاسم الجزئي يُشكّك

**الخطوة الأولى دائماً: اجمع كل أجزاء الاسم معاً**
الاسم الكامل يتكوّن من: الاسم الأول + الاسم الأوسط (إن وُجد) + اسم العائلة (اللقب).
جميع هذه الأجزاء مجتمعة هي ما يُحدّد الشخص، وليس جزء واحد منها.

**قرار المطابقة بالترتيب:**

١. **ابحث بالاسم الكامل أولاً**
   - حوّل كل جزء من الاسم الظاهر إلى مقابله العربي
   - ابحث في القائمة عمن تتطابق معه أكبر عدد من أجزاء اسمه
   - إن وجدت شخصاً واحداً فقط تطابقت معه → **confident: true**
   - مثال: "Bander Alkatheri" = بندر + الكثيري → بندر عبد العزيز الكثيري (رقم 52) ✓ مؤكد
   - مثال: "zamil alshammari" = زامل + الشمري → زامل عوض الشمري (رقم 39) ✓ مؤكد
   - مثال: "Mohammed Alrabiah" = محمد + الربيعة → محمد بن عبد الله الربيعة (رقم 3) ✓ مؤكد

٢. **إن تطابق اسم العائلة مع شخص واحد فقط → confident: true**
   - حتى لو الاسم الأول مختصر أو مختلف قليلاً
   - مثال: "خالد الذييب" → الذييب موجود لدى شخص واحد فقط في القائمة (رقم 26) ✓ مؤكد

٣. **إن تطابق اسم العائلة مع أكثر من شخص → uncertain**
   - مثال: "محمد القحطاني" → القحطاني موجود عند رقم 13 ورقم 24 ورقم 43
   - أدرج كل الاحتمالات في possibleMatches مع سبب كل احتمال

٤. **إن ظهر اسم أول فقط بلا عائلة**
   - إن كان الاسم فريداً في القائمة → confident: true
   - إن كان مشتركاً → uncertain مع كل الاحتمالات

٥. **إن لم يطابق أي شخص في القائمة → outOfList**

## جدول التحويل الصوتي — الألقاب (اسم العائلة)
Alkatheri=الكثيري، Alharbi=الحربي، Alrowaily/Alruwaily=الرويلي،
Alaqeel=العقيل، Aldalbahi/Aldlbahi=الدلبحي، Alomiri/Alomeri/Alomari=العميري،
Alqahtani=القحطاني، Alsaiari/Alsayari/Alsiyari=السياري، Almadhi/Almaathy=الماضي،
Alnassar/Alnasser=النصار، Alzahrani=الزهراني، Alkreidis/Alkriidis=الكريديس،
Alsuwailem/Alsuwayylem=السويلم، Alanazi/Alenazi=العنزي، Albaker/Albakar=البكر،
Altlasi/Althalasi=الطلاسي، Alajlan/Alajlaan=العجلان، Aldhayib/Aldhyib/Aldhiib=الذييب،
Faqih/Alfaqih=فقيه، Alasmari=الأسمري، Aldosari/Aldossari=الدوسري،
Alsabiee/Alsobiee/Alsabyee=السبيعي، Alfahd=الفهد، Alotaibi/Alataibi/Alotaybi=العتيبي،
Karhaan/Karhan/Karkhan=كرحان، Alshammari/Alshammary=الشمري،
Alyousif/Alyousef/Alyousuf=اليوسف، Alissa/Aleisa/Aleissa=العيسى،
Barkati/Barkati=بركاتي، Bawazer/Bawazeer/Bawazeir=باوزير،
Ateeq/Atiq/Ateiq=عتيق، Almutairi/Almutair/Almutairy=المطيري،
Albarrak/Albarakat=البراك، Alnassian/Alnasian/Alnasyan=النصيان،
Aldagfaq/Aldaghfaq/Aldughfaq=الدغفق، Alghamdi/Alghaamdi=الغامدي،
Alsabiee/Alsabiei=السبيعي، Alrabiah/Alrabea/Alrabia=الربيعة،
Alzahrani=الزهراني، Alwohaibi=الوهيبي، Alkhlaifi/Alkhulaifi=الخليفي،
Almuhaini/Almuhayni=المهيني، Alshowaier/Alshuwaier=الشويعر،
Aldakhil/Aldokhil=الدوخي، Almalak/Almalik=المالك

## جدول التحويل الصوتي — الأسماء الأولى
Bander/Bandar=بندر، Khalid/Khaled=خالد، Mohammed/Mohammad/Muhammad=محمد،
Abdullah/Abdulla=عبدالله، Faisal/Faysal/Feisal=فيصل، Nayef/Naif/Nayif=نايف،
Majed/Maajed/Majid=ماجد، Ahmad/Ahmed=أحمد، Abdulaziz/Abdulazez=عبدالعزيز،
Abdulrahman/Abdurahman=عبدالرحمن، Abdulmalik/Abdulmalek=عبدالملك،
Meshari/Mishary=مشاري، Osama/Usama=أسامة، Ibrahim/Ebrahim=إبراهيم،
Falah=فلاح، Khalf/Khalaf=خلف، Mana/Mane/Manea=مانع،
Nemer/Namer/Namir=نمر، Sultan/Soltan=سلطان، Yahya/Yahia=يحيى،
Turkii/Turki/Turkey=تركي، Haifa/Haifaa/Hayfa=هيفاء، Zamil/Zamel=زامل،
Lamia/Lmyaa/Lamya=لمياء، Haya/Hayaa/Haia=هياء، Taghreed/Tagrid=تغريد،
Nouf/Noof=نوف، Saud/Saood=سعود، Nawaf/Nawwaf=نواف، Muath/Muaadh/Moaz=معاذ،
Meana/Moana/Maana/Mana=معنى، Anes/Anis/Aniis=أنيس، Youssef/Yousef/Yusuf=يوسف،
Salman=سلمان، Waleed/Walid=وليد، Hessa/Hisa=حصة، Taghreed=تغريد،
Sami/Samee=سامي، Omar/Omer=عمر
${prevSection}
## الخطوة ١: استخرج كل الأسماء من اللقطات
- اقرأ كل اسم في قائمة المشاركين بدقة تامة
- تجاهل تماماً: Me، Host، Presenter، Unverified، المضيف، أنا، alriyadh.gov.sa وأي بريد إلكتروني
- احتفظ بالاسم الكامل كما كُتب

## الخطوة ٢: لكل اسم — طبّق منطق المطابقة الكامل أعلاه

## الخطوة ٣: أعِد JSON فقط — لا نص قبله أو بعده
{
  "present": [
    {"num": 52, "rawName": "Bander Alkatheri (alriyadh)", "confident": true}
  ],
  "uncertain": [
    {
      "rawName": "Mohammed Alqahtani",
      "possibleMatches": [
        {"num": 13, "name": "م. محمد علي القحطاني", "reason": "اللقب القحطاني + الاسم محمد يتطابقان"},
        {"num": 43, "name": "م. محمد يحيى القحطاني", "reason": "اللقب القحطاني + الاسم محمد يتطابقان"}
      ],
      "issue": "اللقب القحطاني مشترك بين مدعوَّين كلاهما اسمه محمد",
      "suggestedAction": "تحقق من البريد الإلكتروني أو اللقب الوظيفي لتحديد أيهما"
    }
  ],
  "outOfList": ["هالة سعد"],
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
      { type: "text", text: "طبّق منطق الاسم الكامل وأعِد JSON فقط." },
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
