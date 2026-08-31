import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Users, ScanLine, ClipboardList, Plus, Trash2, Download, Loader2,
  Check, X, AlertTriangle, Upload, Pencil, RotateCcw, CloudOff,
  RefreshCw, ChevronDown, ChevronUp, HelpCircle, CheckCircle2
} from "lucide-react";
import { loadRoster, saveRoster, watchRoster } from "./firebase";

const DEFAULT_ROSTER = [
  ["م. محمد بن عبد الله العقل","مساعد الأمين للقطاعات البلدية"],
  ["م. خالد بن سليمان الرويشد","الرئيس التنفيذي لقطاع الأمانة وسط الرياض"],
  ["م. محمد بن عبد الله الربيعة","الرئيس التنفيذي لقطاع الأمانة شمال الرياض"],
  ["م. بندر بن عبد الله الحربي","الرئيس التنفيذي لقطاع الأمانة شرق الرياض"],
  ["د. فلاح بن عبد الله الدوسري","الرئيس التنفيذي لقطاع الأمانة جنوب الرياض"],
  ["م. عبد الله بن عبد المحسن الماضي","الرئيس التنفيذي لقطاع الأمانة غرب الرياض"],
  ["ماجد عثمان الدغفق","المشرف العام على مركز تجربة العميل"],
  ["م. عبد العزيز أحمد بن عقيل","نائب الرئيس التنفيذي لقطاع الأمانة شمال الرياض"],
  ["محمد إبراهيم السياري","نائب الرئيس التنفيذي لقطاع الأمانة وسط الرياض"],
  ["هياء عبد الله الماضي","نائب الرئيس التنفيذي لقطاع الأمانة جنوب الرياض"],
  ["م. خلف ذعار الدلبحي","نائب الرئيس التنفيذي لقطاع الأمانة غرب الرياض"],
  ["م. خالد العميري","نائب الرئيس التنفيذي لقطاع الأمانة شرق الرياض"],
  ["م. محمد علي القحطاني","مستشار مركز تجربة العميل"],
  ["معاذ سليمان العقيلي","مدير عام دعم القطاعات البلدية"],
  ["م. فواز علي الغامدي","مدير عام تطوير القطاعات البلدية"],
  ["هيفاء حمدان النصار","مدير عام مكتب التميز التشغيلي"],
  ["م. بندر بخيت الزهراني","مدير عام مكتب مدينتي المغرزات"],
  ["د. بندر فهد الكريديس","مدير عام مكتب مدينتي المعذر"],
  ["عبد الله محمد ال سويلم","مدير عام مكتب مدينتي المنصورة"],
  ["مشاري عواد العنزي","مدير عام مكتب مدينتي طويق"],
  ["د. لمياء ناصر البكر","مدير عام مكتب مدينتي العقيق"],
  ["م. عبد الله سعود الطلاسي","مدير عام مكتب مدينتي النفل"],
  ["م. عبد الرحمن إبراهيم العجلان","مدير عام مكتب مدينتي قرطبة"],
  ["خالد محمد القحطاني","مدير عام مكتب مدينتي الخليج"],
  ["عبد الله نافع الشمري","مدير عام مكتب مدينتي السلام"],
  ["خالد ابراهيم الذييب","مدير عام مكتب مدينتي الحائر"],
  ["تغريد عبد اللطيف فقيه","مدير عام مكتب مدينتي ظهرة لبن"],
  ["محمد علي الأسمري","مدير عام مكتب مدينتي عكاظ"],
  ["م. سعد بن عبد الله الدوسري","مدير عام تنمية المدينة - وسط الرياض"],
  ["م. فيصل شائم العنزي","مدير عام الاستدامة البيئية - وسط الرياض"],
  ["م. ماجد عبد الله السبيعي","مدير عام البنية التحتية - وسط الرياض"],
  ["م. إبراهيم عبد العزيز البكري","مدير عام الرقابة - وسط الرياض"],
  ["م. معنى محمد الفهد","مدير عام تنمية المدينة - غرب الرياض"],
  ["م. قيس جميل العتيبي","مدير عام الاستدامة البيئية - غرب الرياض"],
  ["م. مانع صالح كرحان","مدير عام البنية التحتية - غرب الرياض"],
  ["نايف عبد الرحمن السبيعي","مدير عام الرقابة - غرب الرياض"],
  ["م. تركي احمد الزهراني","مدير عام تنمية المدينة - شمال الرياض"],
  ["م. أسامة حمد الدعيلج","مدير عام الاستدامة البيئية - شمال الرياض"],
  ["م. زامل عوض الشمري","مدير عام البنية التحتية - شمال الرياض"],
  ["م. محمد سليمان اليوسف","مدير عام الرقابة - شمال الرياض"],
  ["م. يوسف صالح الزهراني","مدير عام تنمية المدينة - شرق الرياض"],
  ["م. نايف إبراهيم العيسى","مدير عام الاستدامة البيئية - شرق الرياض"],
  ["م. محمد يحيى القحطاني","مدير عام البنية التحتية - شرق الرياض"],
  ["م. أنيس زامل بركاتي","مدير عام الرقابة - شرق الرياض"],
  ["م. سلطان محمد باوزير","مدير عام تنمية المدينة - جنوب الرياض"],
  ["م. يحيى موسى عتيق","مدير عام الاستدامة البيئية - جنوب الرياض"],
  ["م. نمر قزعان العتيبي","مدير عام البنية التحتية - جنوب الرياض"],
  ["د. ماجد غانم المطيري","مدير عام الرقابة - جنوب الرياض"],
  ["م. عبدالملك بن سليمان البراك","رئيس غرفة العمليات المشتركة"],
  ["م. عبدالله النصيان","مدير مكتب التحول البلدي"],
  ["م. أحمد اشريدة الرويلي","مدير إدارة الموائمة التشغيلية"],
  ["م. بندر عبد العزيز الكثيري","وكالة التحول الرقمي والمدن الذكية"],
].map(([name,position],i)=>({id:i+1,name,position}));

const C={
  ink:"#0f2620",green:"#0b6b4f",greenDark:"#084d39",greenSoft:"#e6f2ec",
  gold:"#c8891b",goldSoft:"#fbf1dc",bg:"#f6f5f1",card:"#ffffff",line:"#e2e0d8",
  present:"#0b6b4f",presentSoft:"#e6f2ec",absent:"#b23b3b",absentSoft:"#f8e8e8",
  muted:"#6b6f6a",blue:"#1d6fa4",blueSoft:"#e8f2fa",orange:"#c05c00",orangeSoft:"#fdf0e6",
};
const FONT=`'Tajawal', system-ui, sans-serif`;

function downscale(file,maxDim=1200,quality=0.78){
  return new Promise((resolve,reject)=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      const scale=Math.min(1,maxDim/Math.max(img.width,img.height));
      const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
      const canvas=document.createElement("canvas");
      canvas.width=w;canvas.height=h;
      canvas.getContext("2d").drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg",quality));
    };
    img.onerror=reject;img.src=url;
  });
}
async function fileToImage(file){
  const dataUrl=await downscale(file);
  return{name:file.name,dataUrl,b64:dataUrl.split(",")[1],mediaType:"image/jpeg"};
}

// periodPresent = [{num, rawName}] from already-resolved period 1 (passed to period 2)
async function analyzePeriod(images,roster,periodPresent=[]){
  const rosterText=roster.map(m=>`${m.id}. ${m.name} — ${m.position}`).join("\n");
  const rosterJson=roster.map(m=>({id:m.id,name:m.name,position:m.position}));
  const resp=await fetch("/api/analyze",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      rosterText,
      rosterJson,
      images:images.map(im=>({mimeType:im.mediaType,data:im.b64})),
      previousPresent:periodPresent,
    }),
  });
  const data=await resp.json();
  if(!resp.ok) throw new Error(data.error||"تعذّر التحليل");
  return{
    present:data.present||[],       // [{num, rawName, confident}]
    uncertain:data.uncertain||[],   // [{rawName, possibleMatches, issue, suggestedAction}]
    outOfList:data.outOfList||[],
    flags:data.flags||[],
  };
}

// State shape for each period
const EMPTY_PERIOD={
  images:[],
  // raw from API
  present:[],       // [{num, rawName, confident}]
  uncertain:[],     // [{rawName, possibleMatches, issue, suggestedAction}]
  outOfList:[],
  flags:[],
  // resolved by user
  resolved:{},      // { rawName -> num | "outOfList" | "skip" }
  analyzing:false,
  analyzed:false,
  error:null,
};

// Build the final present map {num -> rawName} after user resolutions
function buildPresent(period){
  const map={};
  // Confident matches go straight in
  period.present.forEach(p=>{if(p.num) map[p.num]=p.rawName||"";});
  // User-resolved uncertain
  Object.entries(period.resolved).forEach(([rawName,decision])=>{
    if(typeof decision==="number") map[decision]=rawName;
    // "outOfList" and "skip" → don't add to present
  });
  return map;
}

function pendingUncertain(period){
  return period.uncertain.filter(u=>period.resolved[u.rawName]===undefined);
}

export default function App(){
  const[tab,setTab]=useState("analyze");
  const[roster,setRoster]=useState(DEFAULT_ROSTER);
  const[loaded,setLoaded]=useState(false);
  const[offline,setOffline]=useState(false);
  const[p1,setP1]=useState(EMPTY_PERIOD);
  const[p2,setP2]=useState(EMPTY_PERIOD);
  const[overrides,setOverrides]=useState({});

  useEffect(()=>{
    setLoaded(true);
    let unsub=()=>{};
    (async()=>{
      try{
        const items=await loadRoster();
        if(items&&items.length) setRoster(items);
        else await saveRoster(DEFAULT_ROSTER);
        unsub=watchRoster(its=>{if(its&&its.length) setRoster(its);});
      }catch(e){setOffline(true);}
    })();
    return()=>unsub();
  },[]);

  const persist=async next=>{setRoster(next);try{await saveRoster(next);}catch(e){setOffline(true);}};
  const resetMeeting=()=>{setP1(EMPTY_PERIOD);setP2(EMPTY_PERIOD);setOverrides({});};

  // final maps used in merged
  const p1Present=useMemo(()=>buildPresent(p1),[p1]);
  const p2Present=useMemo(()=>buildPresent(p2),[p2]);

  const merged=useMemo(()=>roster.map(m=>{
    const o=overrides[m.id]||{};
    const inP1=o.p1!==undefined?o.p1:!!p1Present[m.id];
    const inP2=o.p2!==undefined?o.p2:!!p2Present[m.id];
    const rawP1=p1Present[m.id]||"";
    const rawP2=p2Present[m.id]||"";
    const evidence=[rawP1,rawP2].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(" / ");
    return{...m,inP1,inP2,present:inP1||inP2,evidence};
  }),[roster,p1Present,p2Present,overrides]);

  const stats=useMemo(()=>{
    const present=merged.filter(m=>m.present).length;
    return{
      total:roster.length,present,absent:roster.length-present,
      both:merged.filter(m=>m.inP1&&m.inP2).length,
      only1:merged.filter(m=>m.inP1&&!m.inP2).length,
      only2:merged.filter(m=>!m.inP1&&m.inP2).length,
      pct:roster.length?Math.round((present/roster.length)*1000)/10:0,
    };
  },[merged,roster]);

  const outOfList=useMemo(()=>{
    const set=new Map();
    [...p1.outOfList,...p2.outOfList].forEach(n=>{const k=String(n).trim();if(k)set.set(k,k);});
    // user-resolved as outOfList
    Object.entries(p1.resolved).forEach(([n,d])=>{if(d==="outOfList")set.set(n,n);});
    Object.entries(p2.resolved).forEach(([n,d])=>{if(d==="outOfList")set.set(n,n);});
    return[...set.values()];
  },[p1,p2]);

  const hasResults=p1.analyzed||p2.analyzed;
  const p1Pending=pendingUncertain(p1).length;
  const p2Pending=pendingUncertain(p2).length;
  const totalPending=p1Pending+p2Pending;

  const setOverride=(id,period,val)=>setOverrides(prev=>({...prev,[id]:{...(prev[id]||{}),[period]:val}}));

  if(!loaded) return<div dir="rtl" style={{fontFamily:FONT,padding:40,textAlign:"center",color:C.muted}}>جارٍ التحميل…</div>;

  return(
    <div dir="rtl" style={{fontFamily:FONT,background:C.bg,minHeight:"100vh",color:C.ink}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        *{box-sizing:border-box}button{font-family:inherit;cursor:pointer}input{font-family:inherit}
        @keyframes spin{to{transform:rotate(360deg)}}
        .row-hover:hover{filter:brightness(0.97)}
        ::-webkit-scrollbar{height:8px;width:8px}::-webkit-scrollbar-thumb{background:#cfcdc4;border-radius:8px}`}</style>

      <header style={{background:`linear-gradient(120deg,${C.greenDark},${C.green})`,color:"#fff",padding:"20px 22px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:46,height:46,borderRadius:12,background:"rgba(255,255,255,0.14)",display:"grid",placeItems:"center"}}><ClipboardList size={24}/></div>
          <div style={{flex:1}}>
            <h1 style={{margin:0,fontSize:22,fontWeight:800}}>راصد الحضور</h1>
            <p style={{margin:"2px 0 0",fontSize:13,opacity:0.85}}>مطابقة ذكية للقطات الاجتماع مع قائمة المدعوين</p>
          </div>
          {hasResults&&<button onClick={resetMeeting} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:600}}><RefreshCw size={14}/> اجتماع جديد</button>}
          {offline&&<span style={{display:"flex",alignItems:"center",gap:6,fontSize:12,background:"rgba(255,255,255,0.15)",padding:"5px 10px",borderRadius:20}}><CloudOff size={14}/> غير متصل</span>}
        </div>
      </header>

      <nav style={{background:C.card,borderBottom:`1px solid ${C.line}`,position:"sticky",top:0,zIndex:5}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",gap:2,padding:"0 12px"}}>
          {[
            ["analyze","التحليل",ScanLine,totalPending>0?totalPending:null,"orange"],
            ["results","النتيجة",ClipboardList,hasResults?stats.present:null,"green"],
            ["roster","قائمة المدعوين",Users,null,null],
          ].map(([key,label,Icon,badge,badgeColor])=>(
            <button key={key} onClick={()=>setTab(key)} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",padding:"14px 16px",fontSize:15,fontWeight:700,color:tab===key?C.green:C.muted,borderBottom:tab===key?`3px solid ${C.green}`:"3px solid transparent",marginBottom:-1}}>
              <Icon size={17}/>{label}
              {badge!=null&&<span style={{background:badgeColor==="orange"?C.orangeSoft:C.greenSoft,color:badgeColor==="orange"?C.orange:C.green,borderRadius:20,padding:"1px 9px",fontSize:12,fontWeight:700}}>{badge}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"22px 16px 60px"}}>
        {tab==="analyze"&&<AnalyzeTab roster={roster} p1={p1} setP1={setP1} p2={p2} setP2={setP2} p1Present={p1Present} onDone={()=>setTab("results")}/>}
        {tab==="results"&&<ResultsTab merged={merged} stats={stats} outOfList={outOfList} setOverride={setOverride} p1={p1} p2={p2} roster={roster} onGoAnalyze={()=>setTab("analyze")}/>}
        {tab==="roster"&&<RosterTab roster={roster} persist={persist}/>}
      </main>
    </div>
  );
}

// ======================== Analyze Tab ========================
function AnalyzeTab({roster,p1,setP1,p2,setP2,p1Present,onDone}){
  const p1Done=p1.analyzed&&pendingUncertain(p1).length===0;
  const p2CanStart=p1Done;

  return(
    <div>
      {/* Step 1 */}
      <StepHeader n={1} label="الفترة الأولى" done={p1Done}/>
      <PeriodCard state={p1} setState={setP1} roster={roster} previousPresent={[]}/>

      {/* Uncertain resolver for P1 */}
      {p1.analyzed&&p1.uncertain.length>0&&(
        <UncertainResolver period={p1} setPeriod={setP1} roster={roster}/>
      )}

      {/* Step 2 — unlocks after P1 resolved */}
      <StepHeader n={2} label="الفترة الثانية" done={p2.analyzed&&pendingUncertain(p2).length===0} locked={!p1Done}/>
      {!p1Done&&(
        <div style={{...card,textAlign:"center",color:C.muted,padding:"24px",marginBottom:20}}>
          أكمل تحليل الفترة الأولى وحلّ جميع الحالات الغامضة أولاً — ثم تُفتح الفترة الثانية.
        </div>
      )}
      {p1Done&&(
        <>
          <PeriodCard state={p2} setState={setP2} roster={roster}
            previousPresent={Object.entries(p1Present).map(([num,rawName])=>({num:parseInt(num),rawName}))}/>
          {p2.analyzed&&p2.uncertain.length>0&&(
            <UncertainResolver period={p2} setPeriod={setP2} roster={roster}/>
          )}
        </>
      )}

      {/* Go to results */}
      {p1Done&&p2.analyzed&&pendingUncertain(p2).length===0&&(
        <div style={{textAlign:"center",marginTop:20}}>
          <button onClick={onDone} style={btnPrimary}>عرض النتيجة النهائية ←</button>
        </div>
      )}
    </div>
  );
}

function StepHeader({n,label,done,locked}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0 10px"}}>
      <div style={{width:32,height:32,borderRadius:"50%",background:done?C.green:locked?"#ccc":C.greenDark,color:"#fff",display:"grid",placeItems:"center",fontWeight:800,fontSize:15,flexShrink:0}}>
        {done?<Check size={16}/>:n}
      </div>
      <h2 style={{margin:0,fontSize:18,fontWeight:800,color:locked?C.muted:C.ink}}>{label}</h2>
      {done&&<span style={{fontSize:13,color:C.green,fontWeight:600}}>✓ مكتمل</span>}
      {locked&&<span style={{fontSize:13,color:C.muted}}>مقفل — أكمل الفترة الأولى أولاً</span>}
    </div>
  );
}

function PeriodCard({state,setState,roster,previousPresent}){
  const inputRef=useRef();
  const onFiles=async files=>{
    const arr=await Promise.all([...files].map(fileToImage));
    setState(s=>({...s,images:[...s.images,...arr]}));
  };
  const run=async()=>{
    setState(s=>({...s,analyzing:true,error:null}));
    try{
      const r=await analyzePeriod(state.images,roster,previousPresent);
      setState(s=>({...s,...r,resolved:{},analyzing:false,analyzed:true}));
    }catch(e){
      setState(s=>({...s,analyzing:false,error:e.message||"فشل التحليل — تحقق من عدد اللقطات أو اتصالك بالإنترنت"}));
    }
  };
  const removeImage=i=>setState(s=>({...s,images:s.images.filter((_,idx)=>idx!==i)}));
  const confidentCount=state.present.filter(p=>p.confident).length;
  const uncertainCount=state.uncertain.length;

  return(
    <div style={{...card,marginBottom:uncertainCount>0&&state.analyzed?0:16,borderBottomLeftRadius:uncertainCount>0&&state.analyzed?0:16,borderBottomRightRadius:uncertainCount>0&&state.analyzed?0:16}}>
      {/* Drop zone */}
      <div onClick={()=>inputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onFiles(e.dataTransfer.files);}}
        style={{border:`2px dashed ${C.line}`,borderRadius:12,padding:"16px",textAlign:"center",cursor:"pointer",background:C.bg,marginBottom:state.images.length?12:0}}>
        <Upload size={20} color={C.green}/>
        <div style={{marginTop:5,fontSize:14,fontWeight:600}}>اسحب اللقطات أو اضغط للرفع</div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>PNG أو JPG — يمكن إضافة المزيد وإعادة التحليل</div>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={e=>onFiles(e.target.files)}/>
      </div>

      {state.images.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {state.images.map((im,i)=>(
            <div key={i} style={{position:"relative"}}>
              <img src={im.dataUrl} alt="" style={{width:54,height:54,objectFit:"cover",borderRadius:8,border:`1px solid ${C.line}`}}/>
              <button onClick={()=>removeImage(i)} style={{position:"absolute",top:-6,left:-6,width:18,height:18,borderRadius:"50%",background:C.absent,border:"none",color:"#fff",display:"grid",placeItems:"center",padding:0,fontSize:11}}>×</button>
            </div>
          ))}
        </div>
      )}

      {state.error&&<div style={{marginBottom:12,background:C.absentSoft,color:C.absent,padding:"10px 12px",borderRadius:10,fontSize:13}}>{state.error}</div>}

      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={run} disabled={state.analyzing||state.images.length===0}
          style={{...btnPrimary,flex:1,justifyContent:"center",opacity:state.analyzing||!state.images.length?0.55:1,background:state.analyzed?C.blue:C.green}}>
          {state.analyzing?<><Loader2 size={17} style={{animation:"spin 1s linear infinite"}}/> جارٍ التحليل…</>
            :state.analyzed?<><RefreshCw size={17}/> إعادة التحليل</>
            :<><ScanLine size={17}/> حلّل الفترة</>}
        </button>
        {state.analyzed&&(
          <div style={{fontSize:13,color:C.muted,whiteSpace:"nowrap"}}>
            <span style={{color:C.green,fontWeight:700}}>{confidentCount} مؤكد</span>
            {uncertainCount>0&&<span style={{color:C.orange,fontWeight:700}}> · {uncertainCount} غامض</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== Uncertain Resolver ========================
function UncertainResolver({period,setPeriod,roster}){
  const pending=pendingUncertain(period);
  const resolved=Object.keys(period.resolved).length;
  const total=period.uncertain.length;

  const resolve=(rawName,decision)=>{
    setPeriod(p=>({...p,resolved:{...p.resolved,[rawName]:decision}}));
  };

  if(pending.length===0&&total>0){
    return(
      <div style={{background:C.greenSoft,border:`1px solid ${C.green}40`,borderRadius:"0 0 16px 16px",padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:10,fontSize:14,color:C.green,fontWeight:700}}>
        <CheckCircle2 size={18}/> تم حل جميع الحالات الغامضة ({total})
      </div>
    );
  }

  return(
    <div style={{borderTop:"none",border:`1px solid ${C.line}`,borderTop:"none",borderRadius:"0 0 16px 16px",marginBottom:16,overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:C.orangeSoft,borderTop:`2px solid ${C.orange}`,padding:"12px 18px",display:"flex",alignItems:"center",gap:10}}>
        <HelpCircle size={18} color={C.orange}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15,color:C.orange}}>حالات تحتاج قرارك — {pending.length} متبقية من {total}</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>اختر الإجراء المناسب لكل اسم ظهر في اللقطة</div>
        </div>
        <div style={{fontSize:13,color:C.muted}}>{resolved}/{total} تم</div>
      </div>

      {/* Pending items */}
      {pending.map((u,i)=>(
        <div key={i} style={{padding:"16px 18px",borderBottom:`1px solid ${C.line}`,background:"#fff"}}>
          {/* Raw name badge */}
          <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12}}>
            <span style={{background:"#f0f0ee",borderRadius:8,padding:"4px 10px",fontSize:14,fontWeight:700,color:C.ink,whiteSpace:"nowrap"}}>"{u.rawName}"</span>
            <div>
              <div style={{fontSize:13,color:C.muted,marginBottom:3}}>{u.issue}</div>
              <div style={{fontSize:12,color:C.blue,fontWeight:600}}>{u.suggestedAction}</div>
            </div>
          </div>

          {/* Possible matches */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(u.possibleMatches||[]).map((m,j)=>(
              <button key={j} onClick={()=>resolve(u.rawName,m.num)}
                style={{display:"flex",alignItems:"center",gap:12,background:C.greenSoft,border:`1.5px solid ${C.green}40`,borderRadius:10,padding:"10px 14px",textAlign:"right",cursor:"pointer"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:C.green,color:"#fff",display:"grid",placeItems:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{m.num}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                  <div style={{fontSize:12,color:C.muted}}>{roster.find(r=>r.id===m.num)?.position||""}</div>
                  {m.reason&&<div style={{fontSize:11,color:C.green,marginTop:2}}>{m.reason}</div>}
                </div>
                <Check size={16} color={C.green}/>
              </button>
            ))}

            {/* Out of list option */}
            <button onClick={()=>resolve(u.rawName,"outOfList")}
              style={{display:"flex",alignItems:"center",gap:12,background:C.goldSoft,border:`1.5px solid ${C.gold}40`,borderRadius:10,padding:"10px 14px",textAlign:"right",cursor:"pointer"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:C.gold,color:"#fff",display:"grid",placeItems:"center",flexShrink:0}}><Users size={14}/></div>
              <div style={{flex:1,fontWeight:600,fontSize:14,color:"#7a5300"}}>ليس من المدعوين — إضافة لقائمة الحضور الإضافي</div>
            </button>

            {/* Skip option */}
            <button onClick={()=>resolve(u.rawName,"skip")}
              style={{display:"flex",alignItems:"center",gap:12,background:"#f5f5f3",border:`1.5px solid ${C.line}`,borderRadius:10,padding:"10px 14px",textAlign:"right",cursor:"pointer"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:C.muted,color:"#fff",display:"grid",placeItems:"center",flexShrink:0}}><X size={14}/></div>
              <div style={{flex:1,fontWeight:600,fontSize:14,color:C.muted}}>تجاهل — لا يُعدّ حاضراً</div>
            </button>
          </div>
        </div>
      ))}

      {/* Already resolved items (collapsed summary) */}
      {resolved>0&&pending.length>0&&(
        <div style={{padding:"10px 18px",background:"#fafaf8",fontSize:13,color:C.muted}}>
          ✓ تم حل {resolved} حالة سابقاً
        </div>
      )}
    </div>
  );
}

// ======================== Results Tab ========================
function ResultsTab({merged,stats,outOfList,setOverride,p1,p2,roster,onGoAnalyze}){
  const[filter,setFilter]=useState("all");
  const[showOut,setShowOut]=useState(false);

  const filtered=useMemo(()=>merged.filter(m=>{
    if(filter==="present") return m.present;
    if(filter==="absent") return!m.present;
    return true;
  }),[merged,filter]);

  const exportExcel=()=>{
    const header=["م","الاسم","المنصب","الفترة الأولى","الفترة الثانية","الحالة","الاسم في اللقطة"];
    const body=merged.map(m=>[m.id,m.name,m.position,m.inP1?"حضر":"—",m.inP2?"حضر":"—",m.present?"حضر":"لم يحضر",m.evidence||""]);
    const summary=[[],["الملخص"],["إجمالي المدعوين",stats.total],["الحاضرون",stats.present],["الغائبون",stats.absent],["حضر في الفترتين",stats.both],["الفترة الأولى فقط",stats.only1],["الفترة الثانية فقط",stats.only2],["نسبة الحضور",stats.pct/100]];
    const extra=outOfList.length?[[],["حضور إضافي"],...outOfList.map((n,i)=>[i+1,n])]:[];
    const ws=XLSX.utils.aoa_to_sheet([header,...body,...summary,...extra]);
    ws["!cols"]=[{wch:5},{wch:30},{wch:42},{wch:12},{wch:12},{wch:10},{wch:34}];
    const pctCell=`B${1+body.length+10}`;if(ws[pctCell])ws[pctCell].z="0.0%";
    const wb=XLSX.utils.book_new();wb.Workbook={Views:[{RTL:true}]};
    XLSX.utils.book_append_sheet(wb,ws,"الحضور");
    XLSX.writeFile(wb,"كشف_حضور_الاجتماع.xlsx");
  };

  const noData=!p1.analyzed&&!p2.analyzed;

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
        <Stat n={stats.present} label="حاضر" color={C.present} bg={C.presentSoft} active={filter==="present"} onClick={()=>setFilter(f=>f==="present"?"all":"present")}/>
        <Stat n={stats.absent} label="غائب" color={C.absent} bg={C.absentSoft} active={filter==="absent"} onClick={()=>setFilter(f=>f==="absent"?"all":"absent")}/>
        <Stat n={`${stats.pct}%`} label="نسبة الحضور" color={C.gold} bg={C.goldSoft}/>
        <Stat n={stats.total} label="إجمالي المدعوين" color={C.ink} bg="#eeece5" active={filter==="all"} onClick={()=>setFilter("all")}/>
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:C.muted}}>الفترتان <b style={{color:C.ink}}>{stats.both}</b> · الأولى فقط <b style={{color:C.ink}}>{stats.only1}</b> · الثانية فقط <b style={{color:C.ink}}>{stats.only2}</b></div>
        <div style={{display:"flex",gap:8,marginInlineStart:"auto"}}>
          <button onClick={onGoAnalyze} style={btnGhost}><RefreshCw size={15}/> تعديل اللقطات</button>
          <button onClick={exportExcel} disabled={noData} style={{...btnPrimary,opacity:noData?0.5:1}}><Download size={17}/> تصدير Excel</button>
        </div>
      </div>

      {noData&&<div style={{...card,textAlign:"center",color:C.muted,padding:"40px 20px",marginBottom:16}}>لا توجد نتائج بعد. <button onClick={onGoAnalyze} style={{background:"none",border:"none",color:C.green,fontWeight:700,cursor:"pointer",fontSize:"inherit"}}>ارفع اللقطات وحلّل →</button></div>}

      <div style={{...card,padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead>
              <tr style={{background:C.greenDark,color:"#fff"}}>
                <th style={{...th,width:42}}>م</th>
                <th style={th}>الاسم</th>
                <th style={{...th,textAlign:"center",width:70}}>ف١</th>
                <th style={{...th,textAlign:"center",width:70}}>ف٢</th>
                <th style={{...th,textAlign:"center",width:90}}>الحالة</th>
                <th style={th}>الاسم في اللقطة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m=>(
                <tr key={m.id} className="row-hover" style={{background:m.present?C.presentSoft:C.absentSoft,borderBottom:`1px solid ${C.line}`}}>
                  <td style={{...td,textAlign:"center",color:C.muted,fontSize:12}}>{m.id}</td>
                  <td style={td}><div style={{fontWeight:700}}>{m.name}</div><div style={{fontSize:11,color:C.muted}}>{m.position}</div></td>
                  <td style={{...td,textAlign:"center"}}><Toggle on={m.inP1} onClick={()=>setOverride(m.id,"p1",!m.inP1)}/></td>
                  <td style={{...td,textAlign:"center"}}><Toggle on={m.inP2} onClick={()=>setOverride(m.id,"p2",!m.inP2)}/></td>
                  <td style={{...td,textAlign:"center"}}><span style={{fontWeight:800,fontSize:13,color:m.present?C.present:C.absent}}>{m.present?"حضر":"لم يحضر"}</span></td>
                  <td style={{...td,fontSize:12,color:m.evidence?C.ink:C.muted,fontStyle:m.evidence?"normal":"italic"}}>{m.evidence||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {outOfList.length>0&&(
        <div style={{...card,marginTop:16}}>
          <button onClick={()=>setShowOut(v=>!v)} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:15,color:C.gold,cursor:"pointer",width:"100%",textAlign:"right"}}>
            حضور إضافي خارج القائمة ({outOfList.length}){showOut?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
          </button>
          {showOut&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>{outOfList.map((n,i)=><span key={i} style={{background:C.goldSoft,border:"1px solid #ecd9a8",borderRadius:20,padding:"5px 12px",fontSize:13,color:"#6f4e12"}}>{n}</span>)}</div>}
        </div>
      )}
    </div>
  );
}

function Toggle({on,onClick}){
  return<button onClick={onClick} style={{width:30,height:30,borderRadius:8,border:`1.5px solid ${on?C.present:C.line}`,background:on?C.present:"#fff",color:on?"#fff":C.line,display:"grid",placeItems:"center",transition:"all 0.15s"}}>{on?<Check size={16}/>:<X size={14}/>}</button>;
}
function Stat({n,label,color,bg,active,onClick}){
  return<div onClick={onClick} style={{background:bg,borderRadius:14,padding:"16px 18px",cursor:onClick?"pointer":"default",outline:active?`2px solid ${color}`:"none",transition:"outline 0.15s"}}><div style={{fontSize:28,fontWeight:800,color,lineHeight:1}}>{n}</div><div style={{fontSize:13,color:C.muted,marginTop:6}}>{label}</div></div>;
}

// ======================== Roster Tab ========================
function RosterTab({roster,persist}){
  const[editId,setEditId]=useState(null);
  const[draft,setDraft]=useState({name:"",position:""});
  const add=()=>{const id=(roster.reduce((mx,r)=>Math.max(mx,r.id),0)||0)+1;persist([...roster,{id,name:"اسم جديد",position:""}]);setEditId(id);setDraft({name:"اسم جديد",position:""});};
  const remove=id=>persist(roster.filter(r=>r.id!==id));
  const startEdit=r=>{setEditId(r.id);setDraft({name:r.name,position:r.position});};
  const save=()=>{persist(roster.map(r=>r.id===editId?{...r,name:draft.name.trim()||r.name,position:draft.position}:r));setEditId(null);};
  const resetDefault=()=>{if(confirm("استرجاع قائمة المدعوين الأصلية (52)؟")) persist(DEFAULT_ROSTER);};
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontSize:14,color:C.muted}}>عدد المدعوين: <b style={{color:C.ink}}>{roster.length}</b> — تُحفظ وتُشارَك تلقائيًا</div>
        <button onClick={add} style={{...btnPrimary,marginInlineStart:"auto"}}><Plus size={16}/> إضافة مدعو</button>
        <button onClick={resetDefault} style={btnGhost}><RotateCcw size={15}/> استرجاع الأصلية</button>
      </div>
      <div style={{...card,padding:0,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
          <thead><tr style={{background:C.greenDark,color:"#fff"}}><th style={{...th,width:42}}>م</th><th style={th}>الاسم</th><th style={th}>المنصب</th><th style={{...th,width:90}}></th></tr></thead>
          <tbody>
            {roster.map(r=>(
              <tr key={r.id} style={{borderBottom:`1px solid ${C.line}`}}>
                <td style={{...td,textAlign:"center",color:C.muted}}>{r.id}</td>
                {editId===r.id
                  ?<><td style={td}><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} style={inp}/></td><td style={td}><input value={draft.position} onChange={e=>setDraft({...draft,position:e.target.value})} style={inp}/></td><td style={{...td,whiteSpace:"nowrap"}}><button onClick={save} style={{...iconBtn,color:C.present}}><Check size={16}/></button><button onClick={()=>setEditId(null)} style={iconBtn}><X size={16}/></button></td></>
                  :<><td style={{...td,fontWeight:700}}>{r.name}</td><td style={{...td,color:C.muted,fontSize:13}}>{r.position}</td><td style={{...td,whiteSpace:"nowrap"}}><button onClick={()=>startEdit(r)} style={iconBtn}><Pencil size={15}/></button><button onClick={()=>remove(r.id)} style={{...iconBtn,color:C.absent}}><Trash2 size={15}/></button></td></>
                }
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const card={background:C.card,border:`1px solid ${C.line}`,borderRadius:16,padding:18};
const th={textAlign:"right",padding:"11px 12px",fontWeight:700,fontSize:13};
const td={padding:"10px 12px",verticalAlign:"middle"};
const inp={width:"100%",padding:"7px 9px",border:`1px solid ${C.line}`,borderRadius:8,fontSize:14};
const btnPrimary={display:"inline-flex",alignItems:"center",gap:8,background:C.green,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:15,fontWeight:700};
const btnGhost={display:"inline-flex",alignItems:"center",gap:6,background:"#fff",color:C.ink,border:`1px solid ${C.line}`,borderRadius:10,padding:"9px 14px",fontSize:14,fontWeight:600};
const iconBtn={background:"none",border:"none",padding:6,color:C.muted,borderRadius:8};
