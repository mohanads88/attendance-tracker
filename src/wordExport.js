// Word (.docx) export based on the office's attendance template
// (public/templates/attendance.docx, built by scripts/build_word_template.py).
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Bounds of the element <tag ...>…</tag> that encloses position `at`.
function enclosing(xml, tag, at) {
  const start = Math.max(xml.lastIndexOf(`<${tag} `, at), xml.lastIndexOf(`<${tag}>`, at));
  const end = xml.indexOf(`</${tag}>`, at) + tag.length + 3;
  return [start, end];
}

// Repeat the table row holding `marker` once per item.
function repeatRow(xml, marker, items, fill) {
  const at = xml.indexOf(marker);
  if (at < 0) return xml;
  const [s, e] = enclosing(xml, "w:tr", at);
  const row = xml.slice(s, e);
  return xml.slice(0, s) + items.map((it, i) => fill(row, it, i)).join("") + xml.slice(e);
}

export function meetingInfoLine(info = {}) {
  const parts = [];
  if (info.num) parts.push(`اجتماع رقم ${info.num}`);
  if (info.day) parts.push(`يوم ${info.day}`);
  if (info.date) parts.push(`التاريخ ${info.date}`);
  if (info.time) parts.push(`الساعة ${info.time}`);
  if (info.period) parts.push(info.period);
  return parts.join("  |  ");
}

/**
 * Fill the template's document.xml.
 * @param {string} xml   word/document.xml of the template
 * @param {object} data  { members:[{id,name,position,present}], extra:[string], info:{num,day,date,time,period} }
 */
export function fillDocumentXml(xml, { members = [], extra = [], info = {} }) {
  // meeting info line (drop the paragraph when nothing was entered)
  const line = meetingInfoLine(info);
  if (line) xml = xml.replace("{{MEETING_INFO}}", esc(line));
  else {
    const [s, e] = enclosing(xml, "w:p", xml.indexOf("{{MEETING_INFO}}"));
    xml = xml.slice(0, s) + xml.slice(e);
  }

  xml = repeatRow(xml, "{{NAME}}", members, (row, m, i) =>
    row
      .replace("{{NUM}}", String(i + 1))
      .replace("{{NAME}}", esc(m.name))
      .replace("{{POSITION}}", esc(m.position))
      .replace("{{STATUS}}", m.present ? "حضر" : "لم يحضر")
  );

  // extra attendees section (removed entirely when empty)
  const a = xml.indexOf("<!--EXTRA_START-->"), b = xml.indexOf("<!--EXTRA_END-->");
  if (a >= 0 && b > a) {
    if (!extra.length) xml = xml.slice(0, a) + xml.slice(b + "<!--EXTRA_END-->".length);
    else {
      xml = repeatRow(xml, "{{XNAME}}", extra, (row, n, i) =>
        row.replace("{{XNUM}}", String(i + 1)).replace("{{XNAME}}", esc(n))
      );
      xml = xml.replace("<!--EXTRA_START-->", "").replace("<!--EXTRA_END-->", "");
    }
  }
  return xml;
}

export function buildDocx(templateBytes, data) {
  const files = unzipSync(templateBytes);
  files["word/document.xml"] = strToU8(fillDocumentXml(strFromU8(files["word/document.xml"]), data));
  return zipSync(files);
}

export async function exportWord(data, filename) {
  const resp = await fetch("/templates/attendance.docx");
  if (!resp.ok) throw new Error("تعذّر تحميل نموذج Word");
  const bytes = buildDocx(new Uint8Array(await resp.arrayBuffer()), data);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
