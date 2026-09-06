// Step 1: Claude reads raw names from screenshots (Sonnet vision)
// Step 2: JavaScript matches them to the roster (deterministic)
//
// Matching strategy:
// - Translate English tokens → Arabic via TRANS table
// - Normalize Arabic (strip ال، بن، titles، tashkeel)
// - Score using Levenshtein on token pairs
// - Use First+Last token matching for names with middle names
// - Visual confusion rules applied ONLY in the extraction prompt (not here)

const TRANS = {
  // Family names
  alkatheri:"الكثيري", alkhatheri:"الكثيري",
  alharbi:"الحربي", alharby:"الحربي",
  alrowaily:"الرويلي", alruwaily:"الرويلي", alruwaili:"الرويلي",
  alaqeel:"العقيل", alaqil:"العقيل",
  alaqal:"العقل", alaqel:"العقل", alaql:"العقل", alaqle:"العقل",
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
  almutairi:"المطيري", almutair:"المطيري",
  albarrak:"البراك",
  alnassian:"النصيان", alnasian:"النصيان",
  aldagfaq:"الدغفق", aldaghfaq:"الدغفق",
  alghamdi:"الغامدي",
  alrabiah:"الربيعة", alrabea:"الربيعة",
  alosaimi:"العصيمي", osaimi:"العصيمي",
  alhaydar:"آل حيدر", alhaidar:"آل حيدر", haider:"حيدر",
  alhaydr:"آل حيدر", haydar:"حيدر", haidar:"حيدر",
  alhayder:"آل حيدر",
  okaili:"العقيلي", okaely:"العقيلي",
  alghofaili:"الغفيلي", alghufaili:"الغفيلي",
  alsubaie:"السبيعي", alsubaei:"السبيعي",
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
  muath:"معاذ", muaadh:"معاذ", moath:"معاذ",
  meana:"معنى", moana:"معنى", maana:"معنى",
  anes:"أنيس", anis:"أنيس",
  youssef:"يوسف", yousef:"يوسف",
  salman:"سلمان", waleed:"وليد", walid:"وليد",
  omar:"عمر", muhannad:"مهند", mohannad:"مهند",
  mahdi:"مهدي", mahdee:"مهدي",
  tfaqih:"تغريد",
};

// ── Normalize Arabic string for comparison ──
// Does NOT apply visual confusion rules (those are for the prompt only)
function norm(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[\u0622\u0623\u0625\u0622]/g, "\u0627")  // أ إ آ → ا
    .replace(/\u0629/g, "\u0647")                        // ة → ه
    .replace(/\u0649/g, "\u064a")                        // ى → ي
    .replace(/[\u064b-\u065f]/g, "")                     // strip tashkeel
    // Normalize compound names written as two words → one word
    .replace(/عبد الله/g, "عبدالله")
    .replace(/عبد العزيز/g, "عبدالعزيز")
    .replace(/عبد الرحمن/g, "عبدالرحمن")
    .replace(/عبد الملك/g, "عبدالملك")
    .replace(/عبد المحسن/g, "عبدالمحسن")
    .replace(/آل\s*/g, "")                               // آل حيدر → حيدر
    .replace(/^\u0627\u0644/, "")                        // strip ال at start
    .replace(/ \u0627\u0644/g, " ")                         // strip ال after space
    .replace(/\bبن\b|\bبنت\b/g, "")                     // strip بن/بنت
    .replace(/^(م|د|eng|dr|mr)\s*[.\s]/gi, "")          // strip titles
    .replace(/[.\-_,،()\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Translate English token → Arabic ──
function translateToken(token) {
  if (token.includes("@")) token = token.split("@")[0];
  const t = token.toLowerCase().replace(/[^a-z]/g, "");
  return TRANS[t] || token;
}

function translateName(rawName) {
  const clean = rawName.replace(/\(.*?\)/g, "").replace(/\S+@\S+/g, "").trim();
  return clean.split(/\s+/).map(translateToken).join(" ");
}

// ── Levenshtein distance ──
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

// ── Score two normalized tokens ──
function scoreTokenPair(src, tgt) {
  if (!src || !tgt) return 0;
  if (src === tgt) return 100;
  const shorter = Math.min(src.length, tgt.length);
  const longer  = Math.max(src.length, tgt.length);
  // Short tokens: strict (avoid العقل/العقيل false match)
  if (shorter <= 3) return lev(src, tgt) <= 1 ? 82 : 0;
  if (shorter <= 5) return lev(src, tgt) <= 2 ? 80 : 0;
  // Substring match (close lengths)
  if (tgt.includes(src) || src.includes(tgt)) {
    const ratio = shorter / longer;
    return longer - shorter <= 2 ? Math.round(80 * ratio) : Math.round(55 * ratio);
  }
  // Levenshtein
  const dist = lev(src, tgt);
  const ratio = 1 - dist / longer;
  return ratio >= 0.78 ? Math.round(ratio * 80) : 0;
}

// ── Score raw name against a roster member ──
// Position-aware: first name matches first name, last name matches last name.
// "أحمد" as father name does NOT match "أحمد" as first name.
function scoreMatch(rawName, member) {
  const translated = norm(translateName(rawName));
  const target     = norm(member.name);
  if (!translated || !target) return 0;

  const srcTokens = translated.split(" ").filter(t => t.length >= 2);
  const tgtTokens = target.split(" ").filter(t => t.length >= 2);
  if (!srcTokens.length || !tgtTokens.length) return 0;

  // Single token (e.g. "Turkii") → match anywhere in target
  if (srcTokens.length === 1) {
    const best = Math.max(...tgtTokens.map(t => scoreTokenPair(srcTokens[0], t)));
    return best >= 76 ? best : 0;
  }

  const srcFirst = srcTokens[0];
  const srcLast  = srcTokens[srcTokens.length - 1];
  const tgtFirst = tgtTokens[0];
  const tgtLast  = tgtTokens[tgtTokens.length - 1];

  // ── Case A: name + family (standard) ──
  // First name matches first, family name matches last
  const firstScore = scoreTokenPair(srcFirst, tgtFirst);
  const lastScore  = scoreTokenPair(srcLast,  tgtLast);
  const scoreA = firstScore === 0 && lastScore === 0 ? 0
    : Math.round((lastScore * 0.55) + (firstScore * 0.45));

  // ── Case B: name + father only (e.g. "خالد سليمان" → "خالد بن سليمان الرويشد") ──
  // First name matches first, src last token matches one of the middle tokens (father)
  let scoreB = 0;
  if (tgtTokens.length >= 3) {
    const tgtMids = tgtTokens.slice(1, -1); // father name(s) in roster
    const fatherMatch = Math.max(...tgtMids.map(t => scoreTokenPair(srcLast, t)));
    if (firstScore > 0 && fatherMatch > 0) {
      // Slight penalty vs full match since family name not confirmed
      scoreB = Math.round(((firstScore * 0.50) + (fatherMatch * 0.50)) * 0.88);
    }
  }

  return Math.max(scoreA, scoreB);
}

// ── Match one raw name against roster ──
function matchName(rawName, roster) {
  const CONFIDENT = 76, CANDIDATE = 50, GAP = 15;
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

// ════════════════════════════════════════════════════════════
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
    if (s === -1 || e === -1)
      return res.status(502).json({ error: "رد غير متوقع من Claude", raw: rawText.slice(0, 200) });

    const extracted = JSON.parse(cleanText.slice(s, e + 1));
    const rawNames  = (extracted.names || []).filter(n => n && n.trim().length > 1);

    const roster   = Array.isArray(rosterJson) ? rosterJson : [];
    const present  = [], uncertain = [], outOfList = [];
    const usedIds  = new Set();
    const confidenceScores = {};

    for (const rawName of rawNames) {
      const result = matchName(rawName, roster);
      if (result.type === "outOfList") {
        outOfList.push(rawName);
      } else if (result.type === "confident") {
        if (!usedIds.has(result.num)) {
          present.push({ num: result.num, rawName, confident: true, score: result.score });
          confidenceScores[result.num] = result.score;
          usedIds.add(result.num);
        }
      } else {
        const available = result.candidates.filter(c => !usedIds.has(c.num));
        if (available.length === 0) {
          outOfList.push(rawName);
        } else if (available.length === 1) {
          present.push({ num: available[0].num, rawName, confident: true, score: available[0].score });
          confidenceScores[available[0].num] = available[0].score;
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

    return res.status(200).json({
      present, uncertain, outOfList, flags: [],
      extractedCount: rawNames.length,
      scores: confidenceScores,
    });

  } catch (err) {
    console.error("Crash:", err);
    return res.status(500).json({ error: "فشل التحليل", detail: String(err?.message || err) });
  }
}
