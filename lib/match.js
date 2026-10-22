// ─────────────────────────────────────────────────────────────
// Deterministic name matching: raw names (as read from screenshots)
// → members of the invitee roster.
//
// Rules (agreed with the tool owner):
//  • Position matters: first name ↔ first name, family name ↔ family name.
//    A father's name never matches a first name.
//  • Names that merely look alike are different names (مهند ≠ محمد).
//    Only a one-letter slip is tolerated, and only in longer names.
//  • A shared family name alone is not a match when the first names differ.
//  • "name + father" (خالد سليمان) is accepted as a slightly weaker match.
//  • English spellings: known ones via TRANS; unknown ones compared by
//    consonant skeleton (altheeyab ≈ الذييب, nemr ≈ نمر).
// ─────────────────────────────────────────────────────────────

export const TRANS = {
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
  okaili:"العقيلي", okaely:"العقيلي", alokaili:"العقيلي",
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
  tfaqih:"تغريد فقيه", tagheed:"تغريد",
  mohmmed:"محمد", mohamed:"محمد", mohamad:"محمد", mhmd:"محمد",
  nemr:"نمر", nora:"نوره", noura:"نوره", nourah:"نوره",
  altheeyab:"الذييب", aldheeyab:"الذييب", altheyab:"الذييب",
  alhunaidi:"الحنيدي",
};


const LATIN_DROP = new Set(["al", "el", "bin", "bint", "ibn", "eng", "dr", "mr", "mrs", "ms"]);

const POSITION_WORDS = new Set([
  "مدير", "رئيس", "نائب", "وكيل", "مساعد", "مشرف", "ممثل", "مستشار",
  "مكتب", "قطاع", "قطاعات", "اداره", "وكاله", "امانه", "مدينتي",
  "تنميه", "رقابه", "استدامه", "بنيه", "تحتيه", "دعم", "اراضي",
  "شمال", "جنوب", "شرق", "غرب", "وسط",
  "director", "manager", "head", "chief", "deputy", "assistant", "muthol",
]);

const isLatin = (t) => /[a-z]/i.test(t);

// Light Arabic letter-form normalization (no token logic).
function letters(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[آأإٱ]/g, "ا")   // آ أ إ ٱ → ا
    .replace(/ة/g, "ه")                        // ة → ه
    .replace(/ى/g, "ي")                        // ى → ي
    .replace(/[ً-ٰٟـ]/g, "");       // tashkeel + tatweel
}

// Bare form of a word for keyword checks: no ال / بال prefix.
function bare(word) {
  const w = letters(word).replace(/[^؀-ۿa-z]/g, "");
  if (/^بال/.test(w) && w.length > 4) return w.slice(3);
  if (/^ال/.test(w) && w.length > 3) return w.slice(2);
  return w;
}

// ── Remove a job title / office that follows the name ──
// "م.بندر الزهراني مدير عام مدينتي…"  → "م.بندر الزهراني"
// "محمد يحيى البنية التحتية شرق"       → "محمد يحيى"
// "نوره السبيعي - مكتب الحائر"          → "نوره السبيعي"
// "Moath Al-Okaili" is kept whole (no spaces around the dash).
export function stripPosition(raw) {
  let s = String(raw || "").replace(/\(.*?\)/g, " ").replace(/[()]/g, " ");
  const sep = s.search(/\s[-–—|]\s|\|/);
  if (sep >= 3) s = s.slice(0, sep);
  const tokens = s.trim().split(/\s+/);
  const out = [];
  for (const tok of tokens) {
    // a token can carry a glued keyword: "الدعيلج-قطاع"
    const parts = tok.split(/[-–—]/);
    let stop = false;
    const keep = [];
    for (const p of parts) {
      if (out.length + keep.length >= 1 && POSITION_WORDS.has(bare(p))) { stop = true; break; }
      keep.push(p);
    }
    if (keep.length) out.push(keep.join("-"));
    if (stop) break;
  }
  return out.join(" ").trim();
}

// ── Normalize to comparable tokens ──
export function tokens(str) {
  const s = letters(str)
    .replace(/[.\-_,،()\[\]\/|:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const raw = s ? s.split(" ") : [];
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    let t = raw[i];
    // join "عبد الله" → "عبدالله", "عبد العزيز" → "عبدالعزيز"
    if (t === "عبد" && raw[i + 1] && raw[i + 1].startsWith("ال")) { t = "عبد" + raw[i + 1]; i++; }
    if (t === "ال" || t === "بن" || t === "بنت" || t === "ابن") continue; // آل / ال / بن
    if (LATIN_DROP.has(t)) continue;
    if (/^ال/.test(t) && t.length >= 5) t = t.slice(2);        // العقيل → عقيل (not الله)
    t = t.replace(/(.)\1+/g, "$1");                             // الذييب = الذيب
    if (t.length >= 2) out.push(t);
  }
  return out;
}

// ── English → Arabic via the dictionary ──
function translateToken(token) {
  const t = token.toLowerCase().replace(/[^a-z]/g, "");
  if (!t) return token;                       // Arabic token: keep as is
  return TRANS[t] || t;
}

export function translateName(rawName) {
  const withLocal = String(rawName || "").replace(/(\S+)@\S+/g, "$1"); // tfaqih@x → tfaqih
  return stripPosition(withLocal).split(/\s+/).map(translateToken).join(" ");
}

// ── Consonant skeletons: compare an unknown English token to Arabic ──
const AR_SKEL = {
  "ب":"b","ت":"t","ث":"D","ج":"j","ح":"h","خ":"X","د":"D","ذ":"D","ر":"r","ز":"z",
  "س":"s","ش":"S","ص":"s","ض":"D","ط":"t","ظ":"D","غ":"G","ف":"f","ق":"K","ك":"K",
  "ل":"l","م":"m","ن":"n","ه":"h",
};
function arSkel(t) {
  let s = "";
  for (const ch of t) s += AR_SKEL[ch] || "";
  s = s.replace(/(.)\1+/g, "$1");
  return s.length > 2 ? s.replace(/h$/, "") : s;
}
function laSkel(t) {
  let s = t.toLowerCase().replace(/[^a-z]/g, "");
  if (/^(al|el)/.test(s) && s.length > 4) s = s.slice(2);
  s = s.replace(/kh/g, "X").replace(/gh/g, "G").replace(/sh/g, "S")
       .replace(/th|dh/g, "D").replace(/[qkc]/g, "K").replace(/d/g, "D")
       .replace(/g/g, "j").replace(/v/g, "f").replace(/p/g, "b")
       .replace(/[aeiouwy]/g, "");
  s = s.replace(/(.)\1+/g, "$1");
  return s.length > 2 ? s.replace(/h$/, "") : s;
}

// ── Levenshtein ──
export function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
    prev = cur;
  }
  return prev[n];
}

// ── Score two tokens (0–100). src from the screenshot, tgt from the roster ──
export function scoreTokenPair(src, tgt) {
  if (!src || !tgt) return 0;
  if (src === tgt) return 100;
  if (isLatin(src)) {
    const a = laSkel(src), b = arSkel(tgt);
    if (a.length < 2 || b.length < 2) return 0;
    if (a === b) return 90;
    if (Math.min(a.length, b.length) >= 4 && lev(a, b) <= 1) return 78;
    return 0;
  }
  // Arabic vs Arabic: different names stay different (مهند ≠ محمد)
  const shorter = Math.min(src.length, tgt.length);
  const d = lev(src, tgt);
  if (shorter >= 4 && d <= 1) return 85;   // one-letter slip in a longer name
  return 0;
}

// ── Score a raw name against one roster member (0–100) ──
export function scoreMatch(rawName, member) {
  const src = tokens(translateName(rawName));
  const tgt = tokens(member.name);
  if (!src.length || !tgt.length) return 0;

  const tFirst = tgt[0], tLast = tgt[tgt.length - 1];
  const tMid = tgt.slice(1, -1);

  // One word only ("Turkii", "zamil", "Haifa"): first name, else family name.
  if (src.length === 1) {
    const f = scoreTokenPair(src[0], tFirst);
    if (f) return f;
    return tgt.length > 1 ? Math.round(scoreTokenPair(src[0], tLast) * 0.9) : 0;
  }

  const sFirst = src[0], sLast = src[src.length - 1];
  const sMid = src.slice(1, -1);
  const first = scoreTokenPair(sFirst, tFirst);
  if (!first) return 0;                       // different first name → different person

  // Case A: first + family
  let a = 0;
  const last = scoreTokenPair(sLast, tLast);
  if (last) {
    a = last * 0.55 + first * 0.45;
    // a middle name that contradicts the roster lowers confidence
    if (sMid.length && tMid.length) {
      const midOk = sMid.some((m) => tMid.some((t) => scoreTokenPair(m, t)));
      if (!midOk) a *= 0.8;
    }
  }

  // Case B: first + father only ("خالد سليمان" → "خالد بن سليمان الرويشد")
  let b = 0;
  if (tMid.length) {
    const father = Math.max(...tMid.map((t) => scoreTokenPair(sLast, t)));
    if (father) b = (first * 0.5 + father * 0.5) * 0.88;
  }

  return Math.round(Math.max(a, b));
}

export const THRESHOLDS = { CONFIDENT: 76, CANDIDATE: 50, GAP: 15 };

export function matchName(rawName, roster) {
  const { CONFIDENT, CANDIDATE, GAP } = THRESHOLDS;
  const scores = roster
    .map((m) => ({ member: m, score: scoreMatch(rawName, m) }))
    .sort((x, y) => y.score - x.score);
  const top = scores[0], second = scores[1];
  if (!top || top.score < CANDIDATE) return { type: "outOfList" };
  if (top.score >= CONFIDENT && top.score - (second?.score || 0) >= GAP)
    return { type: "confident", num: top.member.id, score: top.score };
  const candidates = scores.filter((s) => s.score >= CANDIDATE && s.score >= top.score - GAP);
  return {
    type: "uncertain",
    candidates: candidates.slice(0, 4).map((s) => ({
      num: s.member.id, name: s.member.name, score: s.score, reason: `تطابق ${s.score}%`,
    })),
  };
}

// ── Match a whole screenshot's names. Confident matches are placed first so
// they are never taken by an ambiguous name; a person seen on two devices
// counts once. ──
export function matchAll(rawNames, roster) {
  const results = rawNames.map((rawName) => ({ rawName, r: matchName(rawName, roster) }));
  const present = [], uncertain = [], outOfList = [];
  const used = new Set();
  const scores = {};

  for (const { rawName, r } of results) {
    if (r.type !== "confident" || used.has(r.num)) continue;
    present.push({ num: r.num, rawName, confident: true, score: r.score });
    scores[r.num] = r.score;
    used.add(r.num);
  }
  for (const { rawName, r } of results) {
    if (r.type === "outOfList") { outOfList.push(rawName); continue; }
    if (r.type !== "uncertain") continue;
    const available = r.candidates.filter((c) => !used.has(c.num));
    if (!available.length) continue; // every candidate already present → same person, another device
    // One option left (others already present) may still be a second device: ask.
    uncertain.push({
      rawName,
      possibleMatches: available.map((c) => ({ num: c.num, name: c.name, reason: c.reason })),
      issue: `"${rawName}" يتشابه مع ${available.length > 1 ? available.length + " مدعوين" : "مدعو واحد"} في القائمة`,
      suggestedAction: "اختر الشخص الصحيح من الخيارات أدناه",
    });
  }
  return { present, uncertain, outOfList, scores };
}
