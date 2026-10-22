// Regression tests for name matching, built from real Webex participant lists.
// Run: npm test
//
// Each case: [name as read from the screenshot, expected result]
//   "<text>"    → must match exactly one invitee whose roster name contains <text>
//   null        → must NOT match any invitee (goes to the extra-attendees list)
//   "uncertain" → genuinely ambiguous; must ask the user
//
// When a new mismatch is found in a real meeting, add it here first, then fix
// lib/match.js until every case passes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { matchName, matchAll } from "../lib/match.js";
import { DEFAULT_ROSTER } from "../src/roster.js";

const CASES = [
  // ── Invitees written in Arabic ──
  ["م.محمد العقل", "العقل"],
  ["م. خالد بن سليمان الرويشد", "الرويشد"],
  ["م. محمد الربيعة", "الربيعة"],
  ["محمد الربيعة", "الربيعة"],
  ["م.بندر عبدالله الحربي", "الحربي"],
  ["فلاح الدوسري", "فلاح"],
  ["هياء الماضي", "هياء"],
  ["م . خلف بن ذعار الدلبحي", "الدلبحي"],
  ["م. خالد العميري", "العميري"],
  ["معاذ العقيلي", "معاذ"],
  ["هيفاء النصار (alriyadh)", "النصار"],
  ["م.بندر الزهراني مدير عام مدينتي المغرزات", "بخيت الزهراني"],
  ["بندر الكريديس", "الكريديس"],
  ["عبدالله السويلم", "سويلم"],
  ["د. لمياء البكر", "لمياء"],
  ["لمياء البكر", "لمياء"],
  ["عبدالله سعود الطلاسي ( مدينتي النفل)", "الطلاسي"],
  ["م عبدالرحمن العجلان", "العجلان"],
  ["خالد محمد القحطاني", "خالد بن محمد القحطاني"],
  ["خالد القحطاني", "خالد بن محمد القحطاني"],
  ["عَبْدُ الله بن نَافِع الشَّمَّري", "نافع الشمري"],
  ["خالد الذييب", "الذييب"],
  ["م. سعد بن عبدالله", "سعد"],
  ["فيصل العنزي", "شائم العنزي"],
  ["ابراهيم البكري", "البكري"],
  ["م معنى بن محمد الفهد", "الفهد"],
  ["مانع كرحان", "كرحان"],
  ["نايف السبيعي", "عبد الرحمن السبيعي"],
  ["م.تركي الزهراني-", "تركي"],
  ["أسامة الدعيلج-قطاع الشمال", "الدعيلج"],
  ["محمد اليوسف", "اليوسف"],
  ["م يوسف الزهراني - تنمية المدينة...", "يوسف"],
  ["محمد يحيى البنية التحتية شرق", "يحيى القحطاني"],
  ["م انيس البركاتي", "بركاتي"],
  ["م- نمر العتيبي", "نمر"],
  ["عبدالملك البراك", "البراك"],
  ["م. فواز الغامدي", "الغامدي"],
  ["فواز", "الغامدي"],
  ["محمد بن إبراهيم السياري", "السياري"],
  ["محمد بن ابراهيم السياري", "السياري"],
  ["د. فيصل العصيمي", "العصيمي"],

  // ── Invitees written in English ──
  ["Mahdi Alhaydar", "آل حيدر"],
  ["Abdulaziz Alaqeel", "بن عقيل"],
  ["ABDULLAH ALMADHI", "عبد المحسن الماضي"],
  ["Abdullah A. Almadhi", "عبد المحسن الماضي"],
  ["Bander Alkatheri (alriyadh)", "الكثيري"],
  ["Eng. Ahmad AlRowaily", "الرويلي"],
  ["Haifa", "هيفاء"],
  ["Haya Almadhi هياء الماضي", "هياء"],
  ["khalid altheeyab", "الذييب"],
  ["Majed Almutair", "المطيري"],
  ["Majed Alsubaie", "ماجد بن عبد الله السبيعي"],
  ["MESHARI ALANAZI", "مشاري"],
  ["Mohmmed Alasmari", "الأسمري"],
  ["NEMR ALOTAIBI", "نمر"],
  ["Turkii", "تركي"],
  ["zamil", "زامل بن عوض"],
  ["zamil alshammari", "زامل"],
  ["yahya", "يحيى بن موسى"],
  ["Tagheed F", "تغريد"],
  ["taghreed Faqih", "تغريد"],
  ["tfaqih@alriyadh.gov.sa", "تغريد"],
  ["Moath Al-Okaili", "معاذ"],
  ["Khaled mohammed", "خالد بن محمد القحطاني"],
  // spellings not in the dictionary (matched by consonant skeleton)
  ["Khalid Althiyab", "الذييب"],
  ["Fawaz Alghamdi", "الغامدي"],
  ["Saad Aldosari", "سعد"],
  ["Sultan Bawazir", "باوزير"],
  ["Nimr Alotaibi", "نمر"],
  ["Qais Alotaibi", "قيس"],
  ["Anees Barkati", "بركاتي"],

  // ── Genuinely ambiguous (two invitees named محمد القحطاني) ──
  ["Mohammed ALQahtani", "uncertain"],
  ["م/ محمد القحطاني", "uncertain"],

  // ── Not invitees ──
  ["HALA SAAD", null],
  ["م. مهند السراء", null],
  ["مهند السراء", null],
  ["Salman Alqahtani (Muthol)", null],
  ["متعب الدوسري", null],
  ["جواهر الدوسري", null],
  ["م. خالد الغفيلي", null],
  ["Khalid Alghofaili", null],
  ["منيره الهزاني", null],
  ["نوره الهزاني", null],
  ["نورة الهزاني", null],
  ["نوف البطحي", null],
  ["العنود العمرو", null],
  ["م.صالح الخليفي", null],
  ["SAlkhulayfi@alriyadh.gov.sa", null],
  ["م.فهد ال رجب", null],
  ["عبدالرحمن الشهري مكتب مدينتي قرطبة", null],
  ["م/ محمد المهنا - مدير الأراضي بالشمال", null],
  ["محمد الشويعر", null],
  ["محمد منصور الشويعر", null],
  ["نايف الدوخي", null],
  ["ندى المالك", null],
  ["Mohammed bin safyan", null],
  ["Abdullah Altowijry (Muthol)", null],
  ["Abdullah Alhunaidi", null],
  ["Abdulmalik bin khudair", null],
  ["Fatima A. ALJafari - Muthol", null],
  ["TURKI ALMATRFI", null],
  ["م محمد الشمراني", null],
  ["م. أحمد بن عبدالله عسيري", null],
  ["م محمد السويدا", null],
  ["عمر الباحوث", null],
  ["سلمان معيني", null],
  ["فيصل وراد الوراد", null],
  ["Nouf Alhefdhi", null],
  ["Noura ALHamed", null],
  ["Nora Alsubaie", null],
  ["Wejdan Alsaleem - Muthol", null],
  ["Ibtihal Alshatri - Muthol", null],
  ["maha alasgah", null],
  ["مها محمد الاصقه", null],
  ["مي الحماد", null],
  ["Dr. Walid Aljarbou", null],
  ["م. احمد الخميس", null],
  ["م - نواف العتيبي", null],
  ["م حسن ناصر الهمامي", null],
  ["م. حسن الهمامي | دعم القطاعات", null],
  ["Mohammed Albelaies - Muthol", null],
];

const nameOf = (num) => DEFAULT_ROSTER.find((m) => m.id === num)?.name;

for (const [raw, expected] of CASES) {
  test(`${raw} → ${expected ?? "خارج القائمة"}`, () => {
    const r = matchName(raw, DEFAULT_ROSTER);
    const got = r.type === "confident" ? nameOf(r.num)
      : r.type === "uncertain" ? `uncertain(${r.candidates.map((c) => c.name).join(" | ")})`
      : "outOfList";
    if (expected === null) assert.equal(r.type, "outOfList", `got ${got}`);
    else if (expected === "uncertain") assert.equal(r.type, "uncertain", `got ${got}`);
    else {
      assert.equal(r.type, "confident", `got ${got}`);
      assert.ok(nameOf(r.num).includes(expected), `got ${got}`);
    }
  });
}

test("a person on two devices is counted once", () => {
  const { present } = matchAll(["معاذ العقيلي", "معاذ العقيلي", "Moath Al-Okaili"], DEFAULT_ROSTER);
  assert.equal(present.length, 1);
});

test("a confident match is never taken by an ambiguous name listed before it", () => {
  const { present, uncertain } = matchAll(["Mohammed ALQahtani", "م. محمد علي القحطاني"], DEFAULT_ROSTER);
  assert.ok(present.some((p) => nameOf(p.num).includes("علي القحطاني")));
  assert.equal(uncertain.length, 1);
  assert.equal(uncertain[0].possibleMatches.length, 1);
});
