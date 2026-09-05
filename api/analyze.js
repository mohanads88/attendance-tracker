// Step 1: Claude reads raw names from screenshots (Sonnet vision)
// Step 2: JavaScript matches them to the roster (deterministic)
//
// Visual confusion rules applied in normalize() cover ALL similar future cases:
// Rule A: ع ↔ ح  (عسيري/حسيري, عمر/حمر, عبدالله/حبدالله ...)
// Rule B: ش ↔ ث  (الشمراني/الثمراني, شائم/ثائم ...)
// Rule C: ح ↔ ج  (الدلبحي/الدلبجي, محمد/مجمد ...)
// Rule D: ي ↔ و  (السياري/السواري, يوسف/ووسف ...)
// Rule E: collapse repeated letters (الذييب=الذيب, الرويلي=الرويلي ...)
// Rule F: آل = ال  (آل حيدر/ال حيدر ...)
// Rule G: short-token strict matching prevents العقل/العقيل confusion

const TRANS = {
  // Family names
  alkatheri:"الكثيري", alkhatheri:"الكثيري",
  alharbi:"الحربي", alharby:"الحربي",
  alrowaily:"الرويلي", alruwaily:"الرويلي", alruwaili:"الرويلي",
  alaqeel:"العقيل", alaqil:"العقيل",
  alaqal:"العقل", alaqel:"العقل", alaql:"العقل", alaqle:"العقل",
  alaqle:"العقل", alaqll:"العقل", alaaqal:"العقل", alaaql:"العقل",
  aldalbahi:"الدلبحي", aldlbahi:"الدلبحي",
  alomiri:"العميري", alomeri:"العميري", alomary:"العميري",
  alqahtani:"القحطاني", qahtani:"القحطاني",
  alsiyari:"السياري", alsaiari:"السياري", alsayari:"السياري",
  almadhi:"الماضي", almaathy:"الماضي", almathy:"الماضي", almadhy:"الماضي",
  alnassar:"النصار", alnasser:"النصار",
  alzahrani:"الزهراني",
  alkreidis:"الكريديس", alkriidis:"الكريديس",
  alsuwailem:"السويلم", alsuwayylem:"السويلم",
  alanazi:"العنزي", alenazi:"العنزي",
  albaker:"البكر", albakar:"البكر",
  altlasi:"الطلاسي", althalasi:"الطلاسي",
  alajlan:"العجلان",
  aldhayib:"الذييب", aldhyib:"الذييب", aldhiib:"الذييب",
  faqih:"فقيه", alfaqih:"فقيه",
  alasmari:"الأسمري",
  aldosari:"الدوسري", aldossari:"الدوسري",
  alsabiee:"السبيعي", alsobiee:"السبيعي",
  alfahd:"الفهد",
  alotaibi:"العتيبي", alataibi:"العتيبي", alotaybi:"العتيبي",
  karhaan:"كرحان", karhan:"كرحان",
  alshammari:"الشمري", alshammary:"الشمري",
  alshammrani:"الشمراني", alshamrani:"الشمراني",
  alyousif:"اليوسف", alyousef:"اليوسف",
  alissa:"العيسى", aleisa:"العيسى",
  barkati:"بركاتي",
  bawazer:"باوزير", bawazeer:"باوزير",
  ateeq:"عتيق", atiq:"عتيق",
  okaili:"العقيلي", okaely:"العقيلي", alukaily:"العقيلي", alukaili:"العقيلي",
  alghofaili:"الغفيلي", alghufaili:"الغفيلي",
  alanazi:"العنزي", alaanazi:"العنزي",
  alsubaie:"السبيعي", alsubaei:"السبيعي",
  almutairi:"المطيري", almutair:"المطيري",
  albarrak:"البراك",
  alnassian:"النصيان", alnasian:"النصيان",
  aldagfaq:"الدغفق", aldaghfaq:"الدغفق",
  alghamdi:"الغامدي",
  alrabiah:"الربيعة", alrabea:"الربيعة",
  alosaimi:"العصيمي", osaimi:"العصيمي",
  alhaydar:"آل حيدر", alhaidar:"آل حيدر", haider:"حيدر",
  alhaydr:"آل حيدر", haydar:"حيدر", haidar:"حيدر",
  alhayder:"آل حيدر", haydr:"حيدر", hedar:"حيدر", hyder:"حيدر",
  // First names
  bander:"بندر", bandar:"بندر",
  khalid:"خالد", khaled:"خالد",
  mohammed:"محمد", mohammad:"محمد", muhammad:"محمد",
  abdullah:"عبدالله", abdulla:"عبدالله", abdullahh:"عبدالله",
  faisal:"فيصل", faysal:"فيصل",
  nayef:"نايف", naif:"نايف",
  majed:"ماجد", maajed:"ماجد",
  ahmad:"أحمد", ahmed:"أحمد",
  abdulaziz:"عبدالعزيز", abdulrahman:"عبدالرحمن", abdulmalik:"عبدالملك",
  meshari:"مشاري", osama:"أسامة",
  ibrahim:"إبراهيم", ebrahim:"إبراهيم",
  falah:"فلاح", khalf:"خلف", khalaf:"خلف",
  mana:"مانع", mane:"مانع",
  nemer:"نمر", namer:"نمر",
  sultan:"سلطان", yahya:"يحيى", yahia:"يحيى",
  turkii:"تركي", turki:"تركي",
  haifa:"هيفاء", haifaa:"هيفاء",
  zamil:"زامل", zamel:"زامل",
  lamia:"لمياء", lamya:"لمياء",
  haya:"هياء", hayaa:"هياء",
  taghreed:"تغريد", tagrid:"تغريد",
  nouf:"نوف", noof:"نوف",
  saud:"سعود", nawaf:"نواف",
  muath:"معاذ", muaadh:"معاذ",
  meana:"معنى", moana:"معنى", maana:"معنى",
  anes:"أنيس", anis:"أنيس",
  youssef:"يوسف", yousef:"يوسف",
  salman:"سلمان", waleed:"وليد", walid:"وليد",
  omar:"عمر", muhannad:"مهند", mohannad:"مهند",
  mahdi:"مهدي", mahdee:"مهدي",
  tfaqih:"تغريد فقيه", faqih:"فقيه",
  moath:"معاذ", muath:"معاذ",
  meshari:"مشاري", mishary:"مشاري",
};

// ── Visual confusion normalization ──
// These rules convert BOTH the raw name AND the roster name to the same
// canonical form before comparison — so ANY future name with these
// visual confusions will be handled automatically.
function applyVisualRules(str) {
  return str
    // Rule F: آل (family prefix) → ال before stripping
    .replace(/آل\s*/g, "ال")
    // Rule A: ع ↔ ح — unify to ع
    // Covers: عسيري/حسيري, عمر/حمر, عبدالعزيز/حبدالعزيز ...
    .replace(/ح/g, "ع")
    // Rule B: ش ↔ ث — unify to ش
    // Covers: الشمراني/الثمراني, شائم/ثائم, الشهري/الثهري ...
    .replace(/ث/g, "ش")
    // Rule C: ج ↔ ح already covered by Rule A (ح→ع, ج stays)
    // But we also need ج ↔ ح visually: unify ج → ع as well for comparison
    .replace(/ج/g, "ع")
    // Rule D: ي ↔ و — unify to ي
    // Covers: السياري/السواري, يوسف/ووسف, يحيى/وحيى ...
    .replace(/و/g, "ي")
    // Rule E: collapse repeated identical letters (max 1 of each)
    // Covers: الذييب/الذيب, الرويلي stays correct, عقيل/عقل ...
    .replace(/(.)\1+/g, "$1");
}

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    // Standard Arabic normalization
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")   // أ إ آ → ا
    .replace(/\u0629/g, "\u0647")                  // ة → ه
    .replace(/\u0649/g, "\u064a")                  // ى → ي
    .replace(/[\u064b-\u065f]/g, "")               // strip tashkeel
    .replace(/\u0627\u0644/g, "")                  // strip ال
    .replace(/\bبن\b|\bبنت\b/g, "")               // strip بن/بنت
    .replace(/^(م|د|eng|dr|mr)\s*[.\s]/gi, "")    // strip titles
    // Apply all visual confusion rules
    .pipe ? str : (() => {
      let s = str
        .toLowerCase()
        .replace(/[\u0622\u0623\u0625]/g, "\u0627")
        .replace(/\u0629/g, "\u0647")
        .replace(/\u0649/g, "\u064a")
        .replace(/[\u064b-\u065f]/g, "")
        .replace(/\u0627\u0644/g, "")
        .replace(/\bبن\b|\bبنت\b/g, "")
        .replace(/^(م|د|eng|dr|mr)\s*[.\s]/gi, "");
      s = applyVisualRules(s);
      return s.replace(/[.\-_,،()\[\]]/g, " ").replace(/\s+/g, " ").trim();
    })();
}

// Rewrite normalize properly (above had a syntax issue)
function norm(str) {
  if (!str) return "";
  let s = str
    .toLowerCase()
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064a")
    .replace(/[\u064b-\u065f]/g, "")
    .replace(/\u0627\u0644/g, "")
    .replace(/\bبن\b|\bبنت\b/g, "")
    .replace(/^(م|د|eng|dr|mr)\s*[.\s]/gi, "");
  s = applyVisualRules(s);
  return s.replace(/[.\-_,،()\[\]]/g, " ").replace(/\s+/g, " ").trim();
}

function lev(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}

function translateToken(token) {
  // Handle email: extract username before @
  if (token.includes("@")) token = token.split("@")[0];
  const t = token.toLowerCase().replace(/[^a-z]/g, "");
  return TRANS[t] || token;
}

function translateName(rawName) {
  const clean = rawName.replace(/\(.*?\)/g, "").replace(/\S+@\S+/g, "").trim();
  return clean.split(/\s+/).map(translateToken).join(" ");
}

function scoreTokenPair(src, tgt) {
  if (!src || !tgt) return 0;
  if (src === tgt) return 100;
  const shorter = Math.min(src.length, tgt.length);
  const longer  = Math.max(src.length, tgt.length);
  // Rule G: strict matching for short tokens prevents العقل/العقيل confusion
  if (shorter <= 3) return lev(src, tgt) <= 1 ? 82 : 0;
  if (shorter <= 5) return lev(src, tgt) <= 2 ? 80 : 0;
  // Substring match (close lengths only)
  if (tgt.includes(src) || src.includes(tgt)) {
    const ratio = shorter / longer;
    return longer - shorter <= 2 ? Math.round(80 * ratio) : Math.round(55 * ratio);
  }
  // Levenshtein for longer tokens
  const dist  = lev(src, tgt);
  const ratio = 1 - dist / longer;
  return ratio >= 0.78 ? Math.round(ratio * 80) : 0;
}

function scoreMatch(rawName, member) {
  const translated = norm(translateName(rawName));
  const target     = norm(member.name);
  if (!translated || !target) return 0;
  const srcTokens = translated.split(" ").filter(t => t.length >= 2);
  const tgtTokens = target.split(" ").filter(t => t.length >= 2);
  if (!srcTokens.length || !tgtTokens.length) return 0;

  // Full match: every source token vs every target token
  let totalScore = 0, matchedCount = 0;
  for (const src of srcTokens) {
    let best = 0;
    for (const tgt of tgtTokens) best = Math.max(best, scoreTokenPair(src, tgt));
    if (best > 0) { totalScore += best; matchedCount++; }
  }
  const fullScore = matchedCount === 0 ? 0 :
    Math.round((totalScore / matchedCount) * (0.65 + 0.35 * matchedCount / srcTokens.length));

  // First+Last match: compare only first and last tokens of src vs tgt
  // Handles cases where middle names differ (e.g. "محمد العقل" vs "محمد بن عبدالله العقل")
  let flScore = 0;
  if (srcTokens.length >= 2 && tgtTokens.length >= 2) {
    const srcFL = [srcTokens[0], srcTokens[srcTokens.length - 1]];
    const tgtFL = [tgtTokens[0], tgtTokens[tgtTokens.length - 1]];
    let flTotal = 0, flMatched = 0;
    for (const src of srcFL) {
      let best = 0;
      for (const tgt of tgtFL) best = Math.max(best, scoreTokenPair(src, tgt));
      if (best > 0) { flTotal += best; flMatched++; }
    }
    // Only use FL score if both first AND last matched well
    if (flMatched === 2) flScore = Math.round((flTotal / 2) * 0.92);
  }

  return Math.max(fullScore, flScore);
}

function matchName(rawName, roster) {
  const CONFIDENT = 76, CANDIDATE = 50, GAP = 22;
  const scores = roster
    .map(m => ({ member: m, score: scoreMatch(rawName, m) }))
    .sort((a, b) => b.score - a.score);
  const top = scores[0], second = scores[1];
  if (!top || top.score < CANDIDATE) return { type: "outOfList" };
  if (top.score >= CONFIDENT && (top.score - (second?.score || 0)) >= GAP)
    return { type: "confident", num: top.member.id, score: top.score };
  const candidates = scores.filter(s => s.score >= CANDIDATE && s.score >= top.score - GAP);
  return {
    type: "uncertain",
    candidates: candidates.slice(0, 4).map(s => ({
      num: s.member.id, name: s.member.name,
      score: s.score, reason: `تطابق ${s.score}%`,
    })),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
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
قبل أي شيء، عُدّ عدد الأسماء الظاهرة في اللقطة تقريباً، ثم تأكد أن JSON النهائي يحتوي نفس العدد تقريباً.

**الخطوة ٢: لكل سطر في القائمة استخرج الاسم**
- إذا كان السطر يحتوي اسماً عربياً → اكتبه
- إذا كان السطر يحتوي اسماً إنجليزياً → اكتبه
- إذا كان السطر يحتوي بريداً إلكترونياً مثل "tfaqih@alriyadh.gov.sa" → اكتب البريد كاملاً (سيُعالَج لاحقاً)
- إذا كان السطر يحتوي "Unverified" أو "alriyadh.gov.sa" كنص ثانوي فقط → تجاهله، اقرأ الاسم فوقه

**الخطوة ٣: تجاهل هذه الكلمات كلياً — ليست أسماء**
Me، Host، Presenter، Unverified، المضيف، أنا

**تنبيهات القراءة — أزواج تتشابه بصرياً:**
| ع (عين) | يُخطأ بـ ح | عسيري/حسيري |
| ش (شين) | يُخطأ بـ ث | الشمراني/الثمراني |
| ح (حاء) | يُخطأ بـ ج | الدلبحي/الدلبجي |
| ي (ياء) | يُخطأ بـ و | السياري/السواري |

تنبيهات خاصة:
- "آل" (كما في آل حيدر) جزء من العائلة — لا تكتبها "ال"
- الذييب يحتوي ياءين
- العقل ≠ العقيل
${prevContext}
**الإخراج — JSON فقط:**
{"names": ["الاسم الأول كما ظهر", "الاسم الثاني"]}`;

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

    const rawText   = (claudeData.content || []).map(b => b.type === "text" ? b.text : "").join("").trim();
    const cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = cleanText.indexOf("{"), e = cleanText.lastIndexOf("}");
    if (s === -1 || e === -1)
      return res.status(502).json({ error: "رد غير متوقع من Claude", raw: rawText.slice(0, 200) });

    const extracted = JSON.parse(cleanText.slice(s, e + 1));
    const rawNames  = (extracted.names || []).filter(n => n && n.trim().length > 1);

    const roster   = Array.isArray(rosterJson) ? rosterJson : [];
    const present  = [], uncertain = [], outOfList = [];
    const usedIds  = new Set();

    for (const rawName of rawNames) {
      const result = matchName(rawName, roster);
      if (result.type === "outOfList") {
        outOfList.push(rawName);
      } else if (result.type === "confident") {
        if (!usedIds.has(result.num)) {
          present.push({ num: result.num, rawName, confident: true });
          usedIds.add(result.num);
        }
      } else {
        const available = result.candidates.filter(c => !usedIds.has(c.num));
        if (available.length === 0) {
          outOfList.push(rawName);
        } else if (available.length === 1) {
          present.push({ num: available[0].num, rawName, confident: true });
          usedIds.add(available[0].num);
        } else {
          uncertain.push({
            rawName,
            possibleMatches: available.map(c => ({ num: c.num, name: c.name, reason: c.reason })),
            issue: `"${rawName}" يتشابه مع ${available.length} مدعوين في القائمة`,
            suggestedAction: "اختر الشخص الصحيح من الخيارات أدناه",
          });
        }
      }
    }

    return res.status(200).json({ present, uncertain, outOfList, flags: [], extractedCount: rawNames.length });

  } catch (err) {
    console.error("Crash:", err);
    return res.status(500).json({ error: "فشل التحليل", detail: String(err?.message || err) });
  }
}
