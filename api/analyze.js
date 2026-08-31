// ─────────────────────────────────────────────
// Step 1: Claude reads raw names from screenshots
// Step 2: JavaScript matches them to the roster
// ─────────────────────────────────────────────

// ── Transliteration table (en → ar fragments) ──
const TRANS = {
  // Family names
  alkatheri:"الكثيري", alkhatheri:"الكثيري", alkhulaifi:"الكثيري",
  alharbi:"الحربي", alharby:"الحربي",
  alrowaily:"الرويلي", alruwaily:"الرويلي", alruwaili:"الرويلي",
  alaqeel:"العقيل", alaqil:"العقيل",
  aldalbahi:"الدلبحي", aldlbahi:"الدلبحي", dalbahi:"الدلبحي",
  alomiri:"العميري", alomeri:"العميري", alomary:"العميري", alomari:"العميري",
  alqahtani:"القحطاني", alqahtany:"القحطاني", qahtani:"القحطاني",
  alsiyari:"السياري", alsaiari:"السياري", alsayari:"السياري", siyari:"السياري",
  almadhi:"الماضي", almaathy:"الماضي", almathy:"الماضي",
  alnassar:"النصار", alnasser:"النصار", nassar:"النصار",
  alzahrani:"الزهراني", zahrani:"الزهراني",
  alkreidis:"الكريديس", alkriidis:"الكريديس", kraydes:"الكريديس",
  alsuwailem:"السويلم", alsuwayylem:"السويلم", suwailem:"السويلم",
  alanazi:"العنزي", alenazi:"العنزي", alunazi:"العنزي", enazi:"العنزي",
  albaker:"البكر", albakar:"البكر", baker:"البكر",
  altlasi:"الطلاسي", althalasi:"الطلاسي", tlasi:"الطلاسي",
  alajlan:"العجلان", ajlan:"العجلان",
  aldhayib:"الذييب", aldhyib:"الذييب", aldhiib:"الذييب", dhayib:"الذييب",
  faqih:"فقيه", alfaqih:"فقيه",
  alasmari:"الأسمري", asmari:"الأسمري",
  aldosari:"الدوسري", aldossari:"الدوسري", dosari:"الدوسري",
  alsabiee:"السبيعي", alsobiee:"السبيعي", alsabyee:"السبيعي", sabiee:"السبيعي",
  alfahd:"الفهد", fahd:"الفهد",
  alotaibi:"العتيبي", alataibi:"العتيبي", alotaybi:"العتيبي", otaibi:"العتيبي",
  karhaan:"كرحان", karhan:"كرحان", karkhan:"كرحان",
  alshammari:"الشمري", alshammary:"الشمري", shammari:"الشمري",
  alyousif:"اليوسف", alyousef:"اليوسف", alyousuf:"اليوسف", yousif:"اليوسف",
  alissa:"العيسى", aleisa:"العيسى", aleissa:"العيسى", eisa:"العيسى",
  barkati:"بركاتي", barkaty:"بركاتي",
  bawazer:"باوزير", bawazeer:"باوزير", bawazeir:"باوزير",
  ateeq:"عتيق", atiq:"عتيق", ateiq:"عتيق",
  almutairi:"المطيري", almutair:"المطيري", almutairy:"المطيري",
  albarrak:"البراك", barrak:"البراك",
  alnassian:"النصيان", alnasian:"النصيان", alnasyan:"النصيان",
  aldagfaq:"الدغفق", aldaghfaq:"الدغفق", aldughfaq:"الدغفق",
  alghamdi:"الغامدي", alghamddi:"الغامدي",
  alrabiah:"الربيعة", alrabea:"الربيعة", alrabia:"الربيعة", rabiah:"الربيعة",
  alsobiee:"السبيعي",
  alhunaidi:"الحنيدي", hunaidi:"الحنيدي",
  almaghrazat:"المغرزات",
  almahzat:"المعذر",
  // First names
  bander:"بندر", bandar:"بندر",
  khalid:"خالد", khaled:"خالد",
  mohammed:"محمد", mohammad:"محمد", muhammad:"محمد", mohamad:"محمد",
  abdullah:"عبدالله", abdulla:"عبدالله",
  faisal:"فيصل", faysal:"فيصل", feisal:"فيصل",
  nayef:"نايف", naif:"نايف", nayif:"نايف",
  majed:"ماجد", maajed:"ماجد", majid:"ماجد",
  ahmad:"أحمد", ahmed:"أحمد",
  abdulaziz:"عبدالعزيز", abdulazez:"عبدالعزيز",
  abdulrahman:"عبدالرحمن", abdurahman:"عبدالرحمن",
  abdulmalik:"عبدالملك", abdulmalek:"عبدالملك",
  meshari:"مشاري", mishary:"مشاري",
  osama:"أسامة", usama:"أسامة",
  ibrahim:"إبراهيم", ebrahim:"إبراهيم",
  falah:"فلاح",
  khalf:"خلف", khalaf:"خلف",
  mana:"مانع", mane:"مانع", manea:"مانع",
  nemer:"نمر", namer:"نمر", namir:"نمر",
  sultan:"سلطان", soltan:"سلطان",
  yahya:"يحيى", yahia:"يحيى",
  turkii:"تركي", turki:"تركي", turkey:"تركي",
  haifa:"هيفاء", haifaa:"هيفاء", hayfa:"هيفاء",
  zamil:"زامل", zamel:"زامل",
  lamia:"لمياء", lmyaa:"لمياء", lamya:"لمياء",
  haya:"هياء", hayaa:"هياء", haia:"هياء",
  taghreed:"تغريد", tagrid:"تغريد",
  nouf:"نوف", noof:"نوف",
  saud:"سعود", saood:"سعود",
  nawaf:"نواف", nawwaf:"نواف",
  muath:"معاذ", muaadh:"معاذ", moaz:"معاذ",
  meana:"معنى", moana:"معنى", maana:"معنى",
  anes:"أنيس", anis:"أنيس", aniis:"أنيس",
  youssef:"يوسف", yousef:"يوسف", yusuf:"يوسف",
  salman:"سلمان",
  waleed:"وليد", walid:"وليد",
  hessa:"حصة", hisa:"حصة",
  omar:"عمر", omer:"عمر",
  sami:"سامي", samee:"سامي",
  muhannad:"مهند", mohannad:"مهند",
  maher:"ماهر",
  hala:"هالة", halah:"هالة",
  mahdi:"مهدي", mahdee:"مهدي",
  safyan:"سفيان", safian:"سفيان",
};

// ── Normalize a string for comparison ──
function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[\u0622\u0623\u0625]/g, "\u0627") // أ إ آ → ا
    .replace(/\u0629/g, "\u0647")               // ة → ه
    .replace(/\u0649/g, "\u064a")               // ى → ي
    .replace(/[\u064b-\u065f]/g, "")            // strip tashkeel
    .replace(/\u0627\u0644/g, "")               // strip ال
    .replace(/^(م|د|eng|dr|mr|a)\s*[.\s]/gi, "")  // strip titles
    .replace(/[.\-_,،()\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Levenshtein distance ──
function lev(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}

// ── Translate a single token (en→ar if found, else return as-is) ──
function translateToken(token) {
  const t = token.toLowerCase().replace(/[^a-z\u0600-\u06ff]/g, "");
  return TRANS[t] || token;
}

// ── Translate a full raw name → mixed Arabic/English string ──
function translateName(rawName) {
  // strip email domains and parenthetical suffixes
  const clean = rawName.replace(/\(.*?\)/g, "").replace(/\S+@\S+/g, "").trim();
  const tokens = clean.split(/\s+/);
  return tokens.map(translateToken).join(" ");
}

// ── Score how well a rawName matches a roster member ──
// Returns a score 0–100 (higher = better match)
function scoreMatch(rawName, member) {
  const translated = normalize(translateName(rawName));
  const target = normalize(member.name);

  if (!translated || !target) return 0;

  // Split into tokens
  const srcTokens = translated.split(" ").filter(Boolean);
  const tgtTokens = target.split(" ").filter(Boolean);

  if (srcTokens.length === 0 || tgtTokens.length === 0) return 0;

  // For each source token, find best match in target tokens
  let totalScore = 0;
  let matchedTokens = 0;

  for (const src of srcTokens) {
    if (src.length < 2) continue; // skip single chars
    let best = 0;
    for (const tgt of tgtTokens) {
      if (tgt.length < 2) continue;
      // Exact match
      if (src === tgt) { best = 100; break; }
      // Contains match
      if (tgt.includes(src) || src.includes(tgt)) { best = Math.max(best, 85); continue; }
      // Levenshtein (for short tokens, require closer match)
      const maxLen = Math.max(src.length, tgt.length);
      const dist = lev(src, tgt);
      const ratio = 1 - dist / maxLen;
      if (ratio > 0.7) best = Math.max(best, Math.round(ratio * 80));
    }
    if (best > 40) { totalScore += best; matchedTokens++; }
  }

  if (matchedTokens === 0) return 0;

  // Average score weighted by how many tokens matched
  const avg = totalScore / matchedTokens;
  const coverage = matchedTokens / Math.max(srcTokens.filter(t => t.length > 1).length, 1);
  return Math.round(avg * (0.7 + 0.3 * coverage));
}

// ── Match one raw name against the full roster ──
// Returns { type: "confident"|"uncertain"|"outOfList", num?, matches? }
function matchName(rawName, roster) {
  const scores = roster.map(m => ({ member: m, score: scoreMatch(rawName, m) }));
  scores.sort((a, b) => b.score - a.score);

  const TOP_CONFIDENT = 72;   // score threshold for confident single match
  const TOP_UNCERTAIN = 45;   // score threshold to appear as possible match
  const GAP_CONFIDENT = 18;   // min gap between top and second for confident

  const top = scores[0];
  const second = scores[1];

  if (top.score < TOP_UNCERTAIN) {
    return { type: "outOfList" };
  }

  // Confident: top score high enough AND gap to second is wide enough
  if (top.score >= TOP_CONFIDENT && (top.score - second.score) >= GAP_CONFIDENT) {
    return { type: "confident", num: top.member.id, score: top.score };
  }

  // Uncertain: multiple close matches
  const candidates = scores.filter(s => s.score >= TOP_UNCERTAIN && s.score >= top.score - GAP_CONFIDENT);
  return {
    type: "uncertain",
    candidates: candidates.slice(0, 4).map(s => ({
      num: s.member.id,
      name: s.member.name,
      score: s.score,
      reason: `تطابق ${s.score}%`,
    })),
  };
}

// ════════════════════════════════════════════════
// Main handler
// ════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY غير مضبوط في إعدادات Vercel" });

  try {
    const body = req.body || {};
    const { rosterText, rosterJson, images, previousPresent } = body;

    if (!Array.isArray(images) || images.length === 0)
      return res.status(400).json({ error: "لا توجد لقطات للتحليل" });

    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > 4000000)
      return res.status(413).json({ error: `حجم اللقطات كبير جداً (${Math.round(payloadSize/1024)}KB) — قلّل عدد اللقطات` });

    // ── Step 1: Claude extracts raw names from screenshots ──
    const prevContext = Array.isArray(previousPresent) && previousPresent.length > 0
      ? `\nللمرجعية — هؤلاء ظهروا في الفترة السابقة:\n${previousPresent.map(p => `"${p.rawName}"`).join("، ")}\n`
      : "";

    const extractPrompt = `مهمتك الوحيدة: استخرج كل الأسماء الظاهرة في قائمة المشاركين من هذه اللقطات.
${prevContext}
القواعد:
- اقرأ كل اسم كما هو مكتوب تماماً (عربي أو إنجليزي)
- تجاهل تماماً: Me، Host، Presenter، Unverified، المضيف، أنا، وأي عنوان بريد إلكتروني
- أعِد JSON فقط بهذا الشكل بالضبط:
{"names": ["الاسم الأول كما ظهر", "الاسم الثاني كما ظهر"]}`;

    const content = [
      { type: "text", text: extractPrompt },
      ...images.map(im => ({
        type: "image",
        source: { type: "base64", media_type: im.mimeType || "image/jpeg", data: im.data },
      })),
      { type: "text", text: "استخرج الأسماء وأعِد JSON فقط." },
    ];

    const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content }],
      }),
    });

    const claudeData = await claudeResp.json();
    if (!claudeResp.ok) {
      return res.status(502).json({ error: "خطأ من خدمة Claude", detail: claudeData?.error?.message || "" });
    }

    const rawText = (claudeData.content || []).map(b => b.type === "text" ? b.text : "").join("").trim();
    const cleanText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const s = cleanText.indexOf("{"), e = cleanText.lastIndexOf("}");
    if (s === -1 || e === -1) return res.status(502).json({ error: "رد غير متوقع من Claude", raw: rawText.slice(0,200) });

    const extracted = JSON.parse(cleanText.slice(s, e + 1));
    const rawNames = (extracted.names || []).filter(n => n && n.trim().length > 1);

    // ── Step 2: JavaScript matches each raw name to the roster ──
    const roster = Array.isArray(rosterJson) ? rosterJson : [];

    const present = [];
    const uncertain = [];
    const outOfList = [];

    // Track which roster IDs already matched (avoid double-matching)
    const usedIds = new Set();

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
        // Filter out already-used candidates
        const available = result.candidates.filter(c => !usedIds.has(c.num));
        if (available.length === 0) {
          outOfList.push(rawName);
        } else if (available.length === 1) {
          // Only one candidate left after filtering → treat as confident
          present.push({ num: available[0].num, rawName, confident: true });
          usedIds.add(available[0].num);
        } else {
          uncertain.push({
            rawName,
            possibleMatches: available.map(c => ({
              num: c.num,
              name: c.name,
              reason: c.reason,
            })),
            issue: `"${rawName}" يتشابه مع ${available.length} مدعوين في القائمة`,
            suggestedAction: "اختر الشخص الصحيح من الخيارات أدناه",
          });
        }
      }
    }

    return res.status(200).json({ present, uncertain, outOfList, flags: [], extractedCount: rawNames.length });

  } catch (err) {
    console.error("Function crash:", err);
    return res.status(500).json({ error: "فشل التحليل", detail: String(err?.message || err) });
  }
}
