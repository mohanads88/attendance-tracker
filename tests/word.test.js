// Tests for the Word export (fills public/templates/attendance.docx).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { buildDocx } from "../src/wordExport.js";
import { DEFAULT_ROSTER } from "../src/roster.js";

const tpl = new Uint8Array(readFileSync(new URL("../public/templates/attendance.docx", import.meta.url)));
const docXml = (bytes) => strFromU8(unzipSync(bytes)["word/document.xml"]);
const members = DEFAULT_ROSTER.map((m, i) => ({ ...m, present: i !== 1 }));

test("every invitee gets a row, in roster order, with status", () => {
  const xml = docXml(buildDocx(tpl, { members, extra: [], info: {} }));
  assert.equal((xml.match(/<w:tr[ >]/g) || []).length, members.length + 2); // + title box + header
  assert.ok(xml.indexOf(">1<") < xml.indexOf(">54<"));
  assert.ok(xml.includes("لم يحضر"));
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(xml), "no placeholders left");
  assert.ok(!xml.includes("الحضور الإضافي"), "no extra section when empty");
});

test("extra attendees and meeting info are written and escaped", () => {
  const xml = docXml(buildDocx(tpl, {
    members, extra: ["HALA SAAD", "A & <B>"], info: { num: "83", day: "الأربعاء" },
  }));
  assert.ok(xml.includes("الحضور الإضافي"));
  assert.ok(xml.includes("A &amp; &lt;B&gt;"));
  assert.ok(xml.includes("اجتماع رقم 83"));
  assert.ok(!xml.includes("<!--"));
});
