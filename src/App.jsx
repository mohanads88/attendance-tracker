import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { Users, ScanLine, ClipboardList, Plus, Trash2, Download, Loader2, Check, X, AlertTriangle, Upload, Pencil, RotateCcw, CloudOff } from "lucide-react";
import { authReady, loadRoster, saveRoster, watchRoster } from "./firebase";

const DEFAULT_ROSTER = [
  ["م. محمد بن عبد الله العقل", "مساعد الأمين للقطاعات البلدية"],
  ["م. خالد بن سليمان الرويشد", "الرئيس التنفيذي لقطاع الأمانة وسط الرياض"],
  ["م. محمد بن عبد الله الربيعة", "الرئيس التنفيذي لقطاع الأمانة شمال الرياض"],
  ["م. بندر بن عبد الله الحربي", "الرئيس التنفيذي لقطاع الأمانة شرق الرياض"],
  ["د. فلاح بن عبد الله الدوسري", "الرئيس التنفيذي لقطاع الأمانة جنوب الرياض"],
  ["م. عبد الله بن عبد المحسن الماضي", "الرئيس التنفيذي لقطاع الأمانة غرب الرياض"],
  ["ماجد عثمان الدغفق", "المشرف العام على مركز تجربة العميل"],
  ["م. عبد العزيز أحمد بن عقيل", "نائب الرئيس التنفيذي لقطاع الأمانة شمال الرياض"],
  ["محمد إبراهيم السياري", "نائب الرئيس التنفيذي لقطاع الأمانة وسط الرياض"],
  ["هياء عبد الله الماضي", "نائب الرئيس التنفيذي لقطاع الأمانة جنوب الرياض"],
  ["م. خلف ذعار الدلبحي", "نائب الرئيس التنفيذي لقطاع الأمانة غرب الرياض"],
  ["م. خالد العميري", "نائب الرئيس التنفيذي لقطاع الأمانة شرق الرياض"],
  ["م. محمد علي القحطاني", "مستشار مركز تجربة العميل"],
  ["معاذ سليمان العقيلي", "مدير عام دعم القطاعات البلدية"],
  ["م. فواز علي الغامدي", "مدير عام تطوير القطاعات البلدية"],
  ["هيفاء حمدان النصار", "مدير عام مكتب التميز التشغيلي"],
  ["م. بندر بخيت الزهراني", "مدير عام مكتب مدينتي المغرزات"],
  ["د. بندر فهد الكريديس", "مدير عام مكتب مدينتي المعذر"],
  ["عبد الله محمد ال سويلم", "مدير عام مكتب مدينتي المنصورة"],
  ["مشاري عواد العنزي", "مدير عام مكتب مدينتي طويق"],
  ["د. لمياء ناصر البكر", "مدير عام مكتب مدينتي العقيق"],
  ["م. عبد الله سعود الطلاسي", "مدير عام مكتب مدينتي النفل"],
  ["م. عبد الرحمن إبراهيم العجلان", "مدير عام مكتب مدينتي قرطبة"],
  ["خالد محمد القحطاني", "مدير عام مكتب مدينتي الخليج"],
  ["عبد الله نافع الشمري", "مدير عام مكتب مدينتي السلام"],
  ["خالد ابراهيم الذييب", "مدير عام مكتب مدينتي الحائر"],
  ["تغريد عبد اللطيف فقيه", "مدير عام مكتب مدينتي ظهرة لبن"],
  ["محمد علي الأسمري", "مدير عام مكتب مدينتي عكاظ"],
  ["م. سعد بن عبد الله الدوسري", "مدير عام تنمية المدينة - وسط الرياض"],
  ["م. فيصل شائم العنزي", "مدير عام الاستدامة البيئية - وسط الرياض"],
  ["م. ماجد عبد الله السبيعي", "مدير عام البنية التحتية - وسط الرياض"],
  ["م. إبراهيم عبد العزيز البكري", "مدير عام الرقابة - وسط الرياض"],
  ["م. معنى محمد الفهد", "مدير عام تنمية المدينة - غرب الرياض"],
  ["م. قيس جميل العتيبي", "مدير عام الاستدامة البيئية - غرب الرياض"],
  ["م. مانع صالح كرحان", "مدير عام البنية التحتية - غرب الرياض"],
  ["نايف عبد الرحمن السبيعي", "مدير عام الرقابة - غرب الرياض"],
  ["م. تركي احمد الزهراني", "مدير عام تنمية المدينة - شمال الرياض"],
  ["م. أسامة حمد الدعيلج", "مدير عام الاستدامة البيئية - شمال الرياض"],
  ["م. زامل عوض الشمري", "مدير عام البنية التحتية - شمال الرياض"],
  ["م. محمد سليمان اليوسف", "مدير عام الرقابة - شمال الرياض"],
  ["م. يوسف صالح الزهراني", "مدير عام تنمية المدينة - شرق الرياض"],
  ["م. نايف إبراهيم العيسى", "مدير عام الاستدامة البيئية - شرق الرياض"],
  ["م. محمد يحيى القحطاني", "مدير عام البنية التحتية - شرق الرياض"],
  ["م. أنيس زامل بركاتي", "مدير عام الرقابة - شرق الرياض"],
  ["م. سلطان محمد باوزير", "مدير عام تنمية المدينة - جنوب الرياض"],
  ["م. يحيى موسى عتيق", "مدير عام الاستدامة البيئية - جنوب الرياض"],
  ["م. نمر قزعان العتيبي", "مدير عام البنية التحتية - جنوب الرياض"],
  ["د. ماجد غانم المطيري", "مدير عام الرقابة - جنوب الرياض"],
  ["م. عبدالملك بن سليمان البراك", "رئيس غرفة العمليات المشتركة"],
  ["م. عبدالله النصيان", "مدير مكتب التحول البلدي"],
  ["م. أحمد اشريدة الرويلي", "مدير إدارة الموائمة التشغيلية"],
  ["م. بندر عبد العزيز الكثيري", "وكالة التحول الرقمي والمدن الذكية"],
].map(([name, position], i) => ({ id: i + 1, name, position }));

const C = {
  ink: "#0f2620", green: "#0b6b4f", greenDark: "#084d39", greenSoft: "#e6f2ec",
  gold: "#c8891b", goldSoft: "#fbf1dc", bg: "#f6f5f1", card: "#ffffff", line: "#e2e0d8",
  present: "#0b6b4f", presentSoft: "#e6f2ec", absent: "#b23b3b", absentSoft: "#f8e8e8", muted: "#6b6f6a",
};
const FONT = `'Tajawal', system-ui, sans-serif`;

// ---- client-side image downscale (keeps Vercel payload small) ----
function downscale(file, maxDim = 1200, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}
async function fileToImage(file) {
  const dataUrl = await downscale(file);
  return { name: file.name, dataUrl, b64: dataUrl.split(",")[1], mediaType: "image/jpeg" };
}

async function analyzePeriod(images, roster) {
  const rosterText = roster.map((m) => `${m.id}. ${m.name} — ${m.position}`).join("\n");
  const resp = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rosterText, images: images.map((im) => ({ mimeType: im.mediaType, data: im.b64 })) }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "تعذّر التحليل");
  const present = {};
  (data.present || []).forEach((p) => { if (p && p.num) present[p.num] = p.name || "ظهر في اللقطة"; });
  return { present, outOfList: data.outOfList || [], flags: data.flags || [] };
}

export default function App() {
  const [tab, setTab] = useState("analyze");
  const [roster, setRoster] = useState(DEFAULT_ROSTER);
  const [loaded, setLoaded] = useState(false);
  const [offline, setOffline] = useState(false);
  const [p1, setP1] = useState({ images: [], present: {}, outOfList: [], flags: [], analyzing: false, error: null });
  const [p2, setP2] = useState({ images: [], present: {}, outOfList: [], flags: [], analyzing: false, error: null });
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await authReady;
        const items = await loadRoster();
        if (items && items.length) setRoster(items);
        else await saveRoster(DEFAULT_ROSTER);
        unsub = watchRoster((its) => { if (its && its.length) setRoster(its); });
      } catch (e) {
        setOffline(true); // Firebase not configured — fall back to local default
      }
      setLoaded(true);
    })();
    return () => unsub();
  }, []);

  const persist = async (next) => {
    setRoster(next);
    try { await saveRoster(next); } catch (e) { setOffline(true); }
  };

  const merged = useMemo(() => roster.map((m) => {
    const o = overrides[m.id] || {};
    const inP1 = o.p1 !== undefined ? o.p1 : !!p1.present[m.id];
    const inP2 = o.p2 !== undefined ? o.p2 : !!p2.present[m.id];
    return { ...m, inP1, inP2, present: inP1 || inP2, evidence: p2.present[m.id] || p1.present[m.id] || "" };
  }), [roster, p1, p2, overrides]);

  const stats = useMemo(() => {
    const present = merged.filter((m) => m.present).length;
    return {
      total: roster.length, present, absent: roster.length - present,
      both: merged.filter((m) => m.inP1 && m.inP2).length,
      only1: merged.filter((m) => m.inP1 && !m.inP2).length,
      only2: merged.filter((m) => !m.inP1 && m.inP2).length,
      pct: roster.length ? Math.round((present / roster.length) * 1000) / 10 : 0,
    };
  }, [merged, roster]);

  const outOfList = useMemo(() => {
    const set = new Map();
    [...p1.outOfList, ...p2.outOfList].forEach((n) => { const k = String(n).trim(); if (k) set.set(k, k); });
    return [...set.values()];
  }, [p1.outOfList, p2.outOfList]);
  const allFlags = useMemo(() => [...new Set([...p1.flags, ...p2.flags])], [p1.flags, p2.flags]);

  const setOverride = (id, period, val) => setOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [period]: val } }));

  if (!loaded) return <div dir="rtl" style={{ fontFamily: FONT, padding: 40, textAlign: "center", color: C.muted }}>جارٍ التحميل…</div>;

  return (
    <div dir="rtl" style={{ fontFamily: FONT, background: C.bg, minHeight: "100vh", color: C.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        *{box-sizing:border-box} button{font-family:inherit;cursor:pointer} input{font-family:inherit}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{height:8px;width:8px}::-webkit-scrollbar-thumb{background:#cfcdc4;border-radius:8px}`}</style>

      <header style={{ background: `linear-gradient(120deg, ${C.greenDark}, ${C.green})`, color: "#fff", padding: "20px 22px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.14)", display: "grid", placeItems: "center" }}><ClipboardList size={24} /></div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>راصد الحضور</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, opacity: 0.85 }}>مطابقة لقطات الاجتماع مع قائمة المدعوين على فترتين</p>
          </div>
          {offline && <span title="القائمة المشتركة غير مفعّلة — تُستخدم النسخة الافتراضية" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, background: "rgba(255,255,255,0.15)", padding: "5px 10px", borderRadius: 20 }}><CloudOff size={14} /> غير متصل بالقائمة المشتركة</span>}
        </div>
      </header>

      <nav style={{ background: C.card, borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", gap: 2, padding: "0 12px" }}>
          {[["analyze", "التحليل", ScanLine], ["results", "النتيجة", ClipboardList], ["roster", "قائمة المدعوين", Users]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: "14px 16px", fontSize: 15, fontWeight: 700, color: tab === key ? C.green : C.muted, borderBottom: tab === key ? `3px solid ${C.green}` : "3px solid transparent", marginBottom: -1 }}>
              <Icon size={17} /> {label}
              {key === "results" && <span style={{ background: C.greenSoft, color: C.green, borderRadius: 20, padding: "1px 9px", fontSize: 12 }}>{stats.present}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "22px 16px 60px" }}>
        {tab === "analyze" && <AnalyzeTab roster={roster} p1={p1} setP1={setP1} p2={p2} setP2={setP2} onDone={() => setTab("results")} />}
        {tab === "results" && <ResultsTab merged={merged} stats={stats} outOfList={outOfList} flags={allFlags} setOverride={setOverride} />}
        {tab === "roster" && <RosterTab roster={roster} persist={persist} />}
      </main>
    </div>
  );
}

function AnalyzeTab({ roster, p1, setP1, p2, setP2, onDone }) {
  return (
    <div>
      <p style={{ marginTop: 0, color: C.muted, fontSize: 14, lineHeight: 1.7 }}>ارفع لقطات قائمة المشاركين لكل فترة ثم اضغط «حلّل الفترة». تُطابَق الأسماء تلقائيًا مع قائمة المدعوين، ويمكنك تعديل أي نتيجة يدويًا في صفحة النتيجة.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <PeriodCard label="الفترة الأولى" state={p1} setState={setP1} roster={roster} />
        <PeriodCard label="الفترة الثانية" state={p2} setState={setP2} roster={roster} />
      </div>
      {(Object.keys(p1.present).length > 0 || Object.keys(p2.present).length > 0) && (
        <div style={{ marginTop: 20, textAlign: "center" }}><button onClick={onDone} style={btnPrimary}>عرض النتيجة المدمجة ←</button></div>
      )}
    </div>
  );
}

function PeriodCard({ label, state, setState, roster }) {
  const inputRef = useRef();
  const count = Object.keys(state.present).length;
  const onFiles = async (files) => {
    const arr = await Promise.all([...files].map(fileToImage));
    setState((s) => ({ ...s, images: [...s.images, ...arr] }));
  };
  const run = async () => {
    setState((s) => ({ ...s, analyzing: true, error: null }));
    try { const r = await analyzePeriod(state.images, roster); setState((s) => ({ ...s, ...r, analyzing: false })); }
    catch (e) { setState((s) => ({ ...s, analyzing: false, error: e.message || "حدث خطأ" })); }
  };
  const clearImages = () => setState((s) => ({ ...s, images: [], present: {}, outOfList: [], flags: [] }));
  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{label}</h3>
        {count > 0 && <span style={{ background: C.greenSoft, color: C.green, borderRadius: 20, padding: "3px 12px", fontSize: 13, fontWeight: 700 }}>{count} مطابقة</span>}
      </div>
      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }} style={{ border: `2px dashed ${C.line}`, borderRadius: 14, padding: "22px 14px", textAlign: "center", cursor: "pointer", background: C.bg }}>
        <Upload size={22} color={C.green} />
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>اسحب اللقطات هنا أو اضغط للرفع</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>صور PNG أو JPG</div>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
      {state.images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {state.images.map((im, i) => <img key={i} src={im.dataUrl} alt="" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.line}` }} />)}
          <button onClick={clearImages} title="مسح" style={{ ...iconBtn, alignSelf: "center" }}><Trash2 size={16} /></button>
        </div>
      )}
      {state.error && <div style={{ marginTop: 12, background: C.absentSoft, color: C.absent, padding: "10px 12px", borderRadius: 10, fontSize: 13 }}>{state.error} — يمكنك المحاولة ثانية أو تحديد الحضور يدويًا في صفحة النتيجة.</div>}
      <button onClick={run} disabled={state.analyzing || state.images.length === 0} style={{ ...btnPrimary, width: "100%", marginTop: 14, opacity: state.analyzing || !state.images.length ? 0.55 : 1 }}>
        {state.analyzing ? <><Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> جارٍ التحليل…</> : <><ScanLine size={17} /> حلّل الفترة</>}
      </button>
    </section>
  );
}

function ResultsTab({ merged, stats, outOfList, flags, setOverride }) {
  const exportExcel = () => {
    const header = ["م", "الاسم", "المنصب", "الفترة الأولى", "الفترة الثانية", "الحالة", "الدليل"];
    const body = merged.map((m) => [m.id, m.name, m.position, m.inP1 ? "حضر" : "—", m.inP2 ? "حضر" : "—", m.present ? "حضر" : "لم يحضر", m.evidence || ""]);
    const summary = [[], ["الملخص"], ["إجمالي المدعوين", stats.total], ["الحاضرون", stats.present], ["الغائبون", stats.absent], ["حضر في الفترتين", stats.both], ["حضر في الفترة الأولى فقط", stats.only1], ["حضر في الفترة الثانية فقط", stats.only2], ["نسبة الحضور", stats.pct / 100]];
    const extra = outOfList.length ? [[], ["حضور إضافي (خارج القائمة)"], ...outOfList.map((n, i) => [i + 1, n])] : [];
    const ws = XLSX.utils.aoa_to_sheet([header, ...body, ...summary, ...extra]);
    ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 42 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 34 }];
    const pctCell = `B${1 + body.length + 10}`;
    if (ws[pctCell]) ws[pctCell].z = "0.0%";
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, "الحضور");
    XLSX.writeFile(wb, "كشف_حضور_الاجتماع.xlsx");
  };
  const noData = stats.present === 0 && outOfList.length === 0;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
        <Stat n={stats.present} label="حاضر" color={C.present} bg={C.presentSoft} />
        <Stat n={stats.absent} label="غائب" color={C.absent} bg={C.absentSoft} />
        <Stat n={`${stats.pct}%`} label="نسبة الحضور" color={C.gold} bg={C.goldSoft} />
        <Stat n={stats.total} label="إجمالي المدعوين" color={C.ink} bg="#eeece5" />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.muted }}>الفترتان <b style={{ color: C.ink }}>{stats.both}</b> · الأولى فقط <b style={{ color: C.ink }}>{stats.only1}</b> · الثانية فقط <b style={{ color: C.ink }}>{stats.only2}</b></div>
        <button onClick={exportExcel} disabled={noData} style={{ ...btnPrimary, marginInlineStart: "auto", opacity: noData ? 0.5 : 1 }}><Download size={17} /> تصدير Excel</button>
      </div>
      {flags.length > 0 && (
        <div style={{ background: C.goldSoft, border: "1px solid #ecd9a8", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#8a5d0e", marginBottom: 6 }}><AlertTriangle size={16} /> نقاط تحتاج مراجعتك</div>
          <ul style={{ margin: 0, paddingInlineStart: 20, fontSize: 13, color: "#6f4e12", lineHeight: 1.7 }}>{flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
        </div>
      )}
      {noData && <div style={{ ...card, textAlign: "center", color: C.muted, padding: "40px 20px", marginBottom: 16 }}>لا توجد نتائج بعد. ارفع اللقطات في صفحة «التحليل» أو حدّد الحضور يدويًا من الجدول أدناه.</div>}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.greenDark, color: "#fff" }}>
              <th style={{ ...th, width: 42 }}>م</th><th style={th}>الاسم</th>
              <th style={{ ...th, textAlign: "center", width: 74 }}>ف1</th><th style={{ ...th, textAlign: "center", width: 74 }}>ف2</th>
              <th style={{ ...th, textAlign: "center", width: 96 }}>الحالة</th><th style={th}>الدليل</th>
            </tr></thead>
            <tbody>
              {merged.map((m) => (
                <tr key={m.id} style={{ background: m.present ? C.presentSoft : C.absentSoft, borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ ...td, textAlign: "center", color: C.muted }}>{m.id}</td>
                  <td style={td}><div style={{ fontWeight: 700 }}>{m.name}</div><div style={{ fontSize: 12, color: C.muted }}>{m.position}</div></td>
                  <td style={{ ...td, textAlign: "center" }}><Toggle on={m.inP1} onClick={() => setOverride(m.id, "p1", !m.inP1)} /></td>
                  <td style={{ ...td, textAlign: "center" }}><Toggle on={m.inP2} onClick={() => setOverride(m.id, "p2", !m.inP2)} /></td>
                  <td style={{ ...td, textAlign: "center" }}><span style={{ fontWeight: 800, color: m.present ? C.present : C.absent }}>{m.present ? "حضر" : "لم يحضر"}</span></td>
                  <td style={{ ...td, fontSize: 12, color: C.muted }}>{m.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {outOfList.length > 0 && (
        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: C.gold }}>حضور إضافي خارج القائمة ({outOfList.length})</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{outOfList.map((n, i) => <span key={i} style={{ background: C.goldSoft, border: "1px solid #ecd9a8", borderRadius: 20, padding: "5px 12px", fontSize: 13, color: "#6f4e12" }}>{n}</span>)}</div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onClick }) {
  return <button onClick={onClick} title={on ? "حاضر — اضغط للتغيير" : "غائب — اضغط للتغيير"} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${on ? C.present : C.line}`, background: on ? C.present : "#fff", color: on ? "#fff" : C.line, display: "grid", placeItems: "center" }}>{on ? <Check size={17} /> : <X size={15} />}</button>;
}
function Stat({ n, label, color, bg }) {
  return <div style={{ background: bg, borderRadius: 14, padding: "16px 18px" }}><div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{n}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{label}</div></div>;
}

function RosterTab({ roster, persist }) {
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ name: "", position: "" });
  const add = () => { const id = (roster.reduce((mx, r) => Math.max(mx, r.id), 0) || 0) + 1; persist([...roster, { id, name: "اسم جديد", position: "" }]); setEditId(id); setDraft({ name: "اسم جديد", position: "" }); };
  const remove = (id) => persist(roster.filter((r) => r.id !== id));
  const startEdit = (r) => { setEditId(r.id); setDraft({ name: r.name, position: r.position }); };
  const save = () => { persist(roster.map((r) => (r.id === editId ? { ...r, name: draft.name.trim() || r.name, position: draft.position } : r))); setEditId(null); };
  const resetDefault = () => { if (confirm("استرجاع قائمة المدعوين الأصلية (52)؟ سيُستبدل التعديل الحالي.")) persist(DEFAULT_ROSTER); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, color: C.muted }}>عدد المدعوين: <b style={{ color: C.ink }}>{roster.length}</b> — تُحفظ التعديلات وتُشارَك مع الجميع تلقائيًا.</div>
        <button onClick={add} style={{ ...btnPrimary, marginInlineStart: "auto" }}><Plus size={16} /> إضافة مدعو</button>
        <button onClick={resetDefault} style={btnGhost}><RotateCcw size={15} /> استرجاع الأصلية</button>
      </div>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr style={{ background: C.greenDark, color: "#fff" }}><th style={{ ...th, width: 42 }}>م</th><th style={th}>الاسم</th><th style={th}>المنصب</th><th style={{ ...th, width: 96 }}></th></tr></thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={{ ...td, textAlign: "center", color: C.muted }}>{r.id}</td>
                {editId === r.id ? (
                  <><td style={td}><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inp} /></td>
                  <td style={td}><input value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} style={inp} /></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}><button onClick={save} style={{ ...iconBtn, color: C.present }}><Check size={16} /></button><button onClick={() => setEditId(null)} style={iconBtn}><X size={16} /></button></td></>
                ) : (
                  <><td style={{ ...td, fontWeight: 700 }}>{r.name}</td><td style={{ ...td, color: C.muted, fontSize: 13 }}>{r.position}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}><button onClick={() => startEdit(r)} style={iconBtn}><Pencil size={15} /></button><button onClick={() => remove(r.id)} style={{ ...iconBtn, color: C.absent }}><Trash2 size={15} /></button></td></>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 };
const th = { textAlign: "right", padding: "11px 12px", fontWeight: 700, fontSize: 13 };
const td = { padding: "10px 12px", verticalAlign: "middle" };
const inp = { width: "100%", padding: "7px 9px", border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 14 };
const btnPrimary = { display: "inline-flex", alignItems: "center", gap: 8, background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 15, fontWeight: 700 };
const btnGhost = { display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 14px", fontSize: 14, fontWeight: 600 };
const iconBtn = { background: "none", border: "none", padding: 6, color: C.muted, borderRadius: 8 };
