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
 
    const instruction = `أنت خبير في مطابقة أسماء المشاركين في الاجتماعات. مهمتك دقيقة جداً وتتطلب خبرة في أسماء عربية وإنجليزية.
 
## الخطوة ١: استخرج كل الأسماء من اللقطات
اقرأ كل اسم ظاهر في قائمة المشاركين بدقة، بما في ذلك:
- الأسماء العربية الكاملة
- الأسماء الإنجليزية أو المكتوبة بحروف لاتينية
- الأسماء المختصرة أو التي تحتوي على لقب المكتب/القطاع بعدها
- الأسماء التي تبدأ بـ م. أو د. أو Eng. أو Dr.
- تجاهل: Me، Host، Presenter، Unverified — هذه تسميات النظام وليست أسماء
 
## الخطوة ٢: طابق مع قائمة المدعوين
لكل اسم استخرجته، ابحث عن أقرب مدعو في القائمة باتباع هذه القواعد:
 
**قواعد المطابقة:**
- تجاهل الألقاب: م. / د. / Eng. / Dr. / Mr. لا تؤثر على المطابقة
- تجاهل كلمات القطاع: "مدير عام / مكتب / قطاع / شمال / جنوب / شرق / غرب" التي تُضاف بعد الاسم
- التحويل الصوتي: Turkii=تركي، Haifa=هيفاء، Zamil=زامل، Khalid=خالد، Faisal=فيصل، Abdullah=عبدالله، Mohammed=محمد، Bander=بندر، Nayef=نايف، Majed=ماجد، Salman=سلمان، Omar=عمر، Ahmad=أحمد، Nouf=نوف، Lamia=لمياء، Haya=هياء، Taghreed=تغريد، Wejdan=وجدان، Abdulaziz=عبدالعزيز، Abdulrahman=عبدالرحمن، Abdulmalik=عبدالملك، Meshari=مشاري، Nawaf=نواف، Osama=أسامة، Ibrahim=إبراهيم، Mazen=معاذ، Saud=سعود، Talal=طلال
- اسم العائلة كافٍ: إذا تطابق اسم العائلة مع مدعو واسمه الأول مشابه، اعتبرهم نفس الشخص
- الاسم المختصر: "محمد السياري" يطابق "محمد إبراهيم السياري"
- الأسماء المكررة: إذا ظهر اسمان يحتملان نفس المدعو، أضف ملاحظة في flags
 
**حالات خاصة مهمة:**
- إذا ظهر شخص باسم مختلف لكن يحمل لقب مكتب مدعو معين → ضعه في outOfList وأضف ملاحظة في flags (نائب محتمل)
- إذا ظهر "Mohammed Alqahtani" وفي القائمة محمد علي القحطاني ومحمد يحيى القحطاني → أضف ملاحظة في flags لأنه غير محدد
- الأسماء المكتوبة بأحرف صغيرة كلها مثل "zamil" أو "turkii" → طابقها بنفس الجهد
 
## الخطوة ٣: أعِد النتيجة
أعِد JSON فقط بالشكل التالي بالضبط، بدون أي نص أو markdown قبله أو بعده:
{"present":[{"num":1,"name":"الاسم كما ظهر في اللقطة"}],"outOfList":["اسم ظهر وليس من المدعوين"],"flags":["ملاحظة واضحة عن أي حالة غير مؤكدة"]}
 
قائمة المدعوين (الأرقام مهمة — استخدمها في present.num):
${rosterText}`;
 
    const content = [
      { type: "text", text: instruction },
      ...images.map((im) => ({
        type: "image",
        source: { type: "base64", media_type: im.mimeType || "image/jpeg", data: im.data },
      })),
      { type: "text", text: "الآن حلّل اللقطات بدقة واستخرج كل الأسماء ثم طابقها. أعِد JSON فقط." },
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
 
