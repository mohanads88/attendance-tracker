// ─────────────────────────────────────────────────────────────
// Step 1: Claude reads raw names from screenshots (vision)
// Step 2: JavaScript matches them to the roster (deterministic)
// ─────────────────────────────────────────────────────────────

const TRANS = {
  alkatheri:"الكثيري", alkhatheri:"الكثيري",
  alharbi:"الحربي", alharby:"الحربي",
  alrowaily:"الرويلي", alruwaily:"الرويلي", alruwaili:"الرويلي",
  alaqeel:"العقيل", alaqil:"العقيل",
  alaqal:"العقل", alaqel:"العقل", alaql:"العقل",
  aldalbahi:"الدلبحي", aldlbahi:"الدلبحي",
  alomiri:"العميري", alomeri:"العميري", alomary:"العميري",
  alqahtani:"القحطاني", qahtani:"القحطاني",
  alsiyari:"السياري", alsaiari:"السياري", alsayari:"السياري",
  almadhi:"الماضي", almaathy:"الماضي",
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
  bander:"بندر", bandar:"بندر",
  khalid:"خالد", khaled:"خالد",
  mohammed:"محمد", mohammad:"محمد", muhammad:"محمد",
  abdullah:"عبدالله", abdulla:"عبدالله",
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
};

function normalize(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[\u0622\u0623\u0625]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064a")
    .replace(/[\u064b-\u065f]/g, "")
    .replace(/\u0627\u0644/g, "")
    .replace(/\bبن\b|\bبنت\b/g, "")
    .replace(/^(م|د|eng|dr|mr)\s*[.\s]/gi, "")
    .replace(/[.\-_,،()\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lev(a, b) {
  const m=a.length, n=b.length;
  if(m===0) return n; if(n===0) return m;
  const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}

function translateToken(token) {
  const t=token.toLowerCase().replace(/[^a-z]/g,"");
  return TRANS[t]||token;
}

function translateName(rawName) {
  const clean=rawName.replace(/\(.*?\)/g,"").replace(/\S+@\S+/g,"").trim();
  return clean.split(/\s+/).map(translateToken).join(" ");
}

function scoreTokenPair(src, tgt) {
  if(!src||!tgt) return 0;
  if(src===tgt) return 100;
  // Strict mode for short tokens — العقل vs العقيل
  const shorter=Math.min(src.length,tgt.length);
  const longer=Math.max(src.length,tgt.length);
  if(shorter<=4) {
    // Allow max 1 char difference only
    return lev(src,tgt)<=1 ? 82 : 0;
  }
  if(tgt.includes(src)||src.includes(tgt)) {
    const ratio=shorter/longer;
    // Only accept substring if lengths are close (within 2 chars)
    return longer-shorter<=2 ? Math.round(80*ratio) : Math.round(55*ratio);
  }
  const dist=lev(src,tgt);
  const ratio=1-dist/longer;
  return ratio>=0.78 ? Math.round(ratio*80) : 0;
}

function scoreMatch(rawName, member) {
  const translated=normalize(translateName(rawName));
  const target=normalize(member.name);
  if(!translated||!target) return 0;
  const srcTokens=translated.split(" ").filter(t=>t.length>=2);
  const tgtTokens=target.split(" ").filter(t=>t.length>=2);
  if(!srcTokens.length||!tgtTokens.length) return 0;
  let totalScore=0, matchedCount=0;
  for(const src of srcTokens) {
    let best=0;
    for(const tgt of tgtTokens) best=Math.max(best,scoreTokenPair(src,tgt));
    if(best>0){totalScore+=best;matchedCount++;}
  }
  if(matchedCount===0) return 0;
  const avg=totalScore/matchedCount;
  const coverage=matchedCount/srcTokens.length;
  return Math.round(avg*(0.65+0.35*coverage));
}

function matchName(rawName, roster) {
  const CONFIDENT=76, CANDIDATE=50, GAP=22;
  const scores=roster.map(m=>({member:m,score:scoreMatch(rawName,m)})).sort((a,b)=>b.score-a.score);
  const top=scores[0], second=scores[1];
  if(!top||top.score<CANDIDATE) return{type:"outOfList"};
  if(top.score>=CONFIDENT&&(top.score-(second?.score||0))>=GAP)
    return{type:"confident",num:top.member.id,score:top.score};
  const candidates=scores.filter(s=>s.score>=CANDIDATE&&s.score>=top.score-GAP);
  return{type:"uncertain",candidates:candidates.slice(0,4).map(s=>({num:s.member.id,name:s.member.name,score:s.score,reason:`تطابق ${s.score}%`}))};
}

export default async function handler(req, res) {
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  const key=process.env.ANTHROPIC_API_KEY;
  if(!key) return res.status(500).json({error:"ANTHROPIC_API_KEY غير مضبوط في إعدادات Vercel"});

  try {
    const body=req.body||{};
    const{rosterJson,images,previousPresent}=body;
    if(!Array.isArray(images)||images.length===0) return res.status(400).json({error:"لا توجد لقطات للتحليل"});
    if(JSON.stringify(body).length>4000000) return res.status(413).json({error:"حجم اللقطات كبير جداً — قلّل عدد اللقطات"});

    const prevContext=Array.isArray(previousPresent)&&previousPresent.length>0
      ?`\nهؤلاء ظهروا في الفترة السابقة:\n${previousPresent.map(p=>`"${p.rawName}"`).join("، ")}\n`:"";

    const extractPrompt=`مهمتك الوحيدة: اقرأ كل اسم في قائمة المشاركين من هذه اللقطات واكتبه كما هو تماماً.

## تعليمات القراءة الدقيقة — مهمة جداً

الأسماء العربية تتشابه بصرياً — اقرأ كل حرف بعناية:
- "العقل" ≠ "العقيل" — الاثنان موجودان وهما أشخاص مختلفون تماماً
- "السياري" ≠ "السواري" — الياء والواو مختلفتان
- "الدلبحي" ≠ "الدلبجي" — الحاء والجيم مختلفتان  
- "الذييب" يحتوي على ياءين — لا تحذف واحدة
- إذا رأيت "..." في نهاية الاسم فهذا يعني أن النص مقطوع — اكتب ما يظهر فقط ولا تكمل من خيالك

تجاهل هذه الكلمات كلياً — ليست أسماء:
Me، Host، Presenter، Unverified، المضيف، أنا، وأي بريد إلكتروني مثل alriyadh.gov.sa أو gmail.com
${prevContext}
الإخراج — JSON فقط:
{"names": ["الاسم الأول كما ظهر في اللقطة", "الاسم الثاني كما ظهر"]}`;

    const content=[
      {type:"text",text:extractPrompt},
      ...images.map(im=>({type:"image",source:{type:"base64",media_type:im.mimeType||"image/jpeg",data:im.data}})),
      {type:"text",text:"اقرأ الأسماء بدقة وأعِد JSON فقط."},
    ];

    const claudeResp=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2048,messages:[{role:"user",content}]}),
    });

    const claudeData=await claudeResp.json();
    if(!claudeResp.ok) return res.status(502).json({error:"خطأ من خدمة Claude",detail:claudeData?.error?.message||""});

    const rawText=(claudeData.content||[]).map(b=>b.type==="text"?b.text:"").join("").trim();
    const cleanText=rawText.replace(/```json/gi,"").replace(/```/g,"").trim();
    const s=cleanText.indexOf("{"),e=cleanText.lastIndexOf("}");
    if(s===-1||e===-1) return res.status(502).json({error:"رد غير متوقع من Claude",raw:rawText.slice(0,200)});

    const extracted=JSON.parse(cleanText.slice(s,e+1));
    const rawNames=(extracted.names||[]).filter(n=>n&&n.trim().length>1);

    const roster=Array.isArray(rosterJson)?rosterJson:[];
    const present=[],uncertain=[],outOfList=[];
    const usedIds=new Set();

    for(const rawName of rawNames){
      const result=matchName(rawName,roster);
      if(result.type==="outOfList"){
        outOfList.push(rawName);
      } else if(result.type==="confident"){
        if(!usedIds.has(result.num)){
          present.push({num:result.num,rawName,confident:true});
          usedIds.add(result.num);
        }
      } else {
        const available=result.candidates.filter(c=>!usedIds.has(c.num));
        if(available.length===0) outOfList.push(rawName);
        else if(available.length===1){
          present.push({num:available[0].num,rawName,confident:true});
          usedIds.add(available[0].num);
        } else {
          uncertain.push({
            rawName,
            possibleMatches:available.map(c=>({num:c.num,name:c.name,reason:c.reason})),
            issue:`"${rawName}" يتشابه مع ${available.length} مدعوين في القائمة`,
            suggestedAction:"اختر الشخص الصحيح من الخيارات أدناه",
          });
        }
      }
    }

    return res.status(200).json({present,uncertain,outOfList,flags:[],extractedCount:rawNames.length});

  } catch(err){
    console.error("Crash:",err);
    return res.status(500).json({error:"فشل التحليل",detail:String(err?.message||err)});
  }
}
