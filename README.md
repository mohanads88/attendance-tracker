# راصد الحضور — دليل النشر

أداة ويب تُطابق لقطات قائمة المشاركين (Webex/Teams) مع قائمة المدعوين على فترتين، وتُصدّر كشف حضور Excel. القراءة التلقائية للقطات تعمل عبر **Gemini (الطبقة المجانية)**، والقائمة مشتركة بين الفريق عبر **Firebase**، والاستضافة على **Vercel** — الكل ضمن الطبقات المجانية.

الفكرة كاملة مثل لوحة PMO: **أنت** تنشئ الحسابات وتضغط الأزرار، والكود جاهز هنا.

---

## المتطلبات (حسابات مجانية)
- حساب GitHub
- حساب Vercel (سجّل الدخول عبر GitHub)
- مشروع Firebase (نفس حسابك المستخدم في لوحة PMO يصلح)
- مفتاح Gemini من Google AI Studio

---

## الخطوة ١ — مفتاح Gemini المجاني
1. ادخل على **aistudio.google.com** بحساب Google.
2. اضغط **Get API key** ← **Create API key**. لا يتطلب بطاقة ائتمان.
3. انسخ المفتاح واحفظه مؤقتًا (سنضعه في Vercel لاحقًا).

## الخطوة ٢ — مشروع Firebase (القائمة المشتركة)
1. من **console.firebase.google.com** أنشئ مشروعًا (أو استخدم مشروع PMO).
2. **Build ← Firestore Database ← Create database** (ابدأ بوضع Production).
3. **Build ← Authentication ← Get started ← Sign-in method**، فعّل **Anonymous**.
4. في **Firestore ← Rules** الصق التالي ثم **Publish**:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /attendance/{doc} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
5. **Project settings (⚙️) ← General ← Your apps ← Web (</>)**، سجّل تطبيق ويب، وانسخ قيم `firebaseConfig` الستة (apiKey، authDomain، projectId، storageBucket، messagingSenderId، appId).

## الخطوة ٣ — ارفع الكود إلى GitHub
1. أنشئ مستودعًا جديدًا فارغًا على GitHub باسم `attendance-tracker`.
2. ارفع محتويات هذا المجلد إليه (عبر واجهة GitHub «Upload files» أو Git). **لا ترفع** مجلد `node_modules`.

## الخطوة ٤ — انشر على Vercel
1. من **vercel.com ← Add New ← Project**، اختر مستودع `attendance-tracker`.
2. يكتشف Vercel إعداد Vite تلقائيًا — لا تغيّر شيئًا.
3. افتح **Environment Variables** وأضِف المتغيرات التالية:

   | الاسم | القيمة |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | من إعداد Firebase |
   | `VITE_FIREBASE_AUTH_DOMAIN` | من إعداد Firebase |
   | `VITE_FIREBASE_PROJECT_ID` | من إعداد Firebase |
   | `VITE_FIREBASE_STORAGE_BUCKET` | من إعداد Firebase |
   | `VITE_FIREBASE_SENDER_ID` | من إعداد Firebase (messagingSenderId) |
   | `VITE_FIREBASE_APP_ID` | من إعداد Firebase |
   | `GEMINI_API_KEY` | مفتاح Gemini (بدون بادئة VITE) |

4. اضغط **Deploy**. بعد دقيقة يعطيك رابطًا مثل `https://attendance-tracker-xxx.vercel.app` — هذا الرابط توزّعه على زملائك.

> أي تعديل مستقبلي: ادفعه إلى GitHub، ويُعيد Vercel النشر تلقائيًا.

---

## تشغيل محلي (اختياري، للتجربة قبل النشر)
```
npm install
# أنشئ ملف .env.local وضع فيه المتغيرات (انظر .env.example)
npm run dev
```
ملاحظة: دالة `/api/analyze` تعمل على Vercel. محليًا استخدم `vercel dev` بدل `npm run dev` لتشغيل التحليل التلقائي، أو اكتفِ بالتحديد اليدوي.

---

## ملاحظات مهمة
- **اسم نموذج Gemini:** الكود يستخدم `gemini-2.5-flash` (مجاني ويقرأ الصور). إن غيّرت Google الاسم لاحقًا، عدّل السطر `const MODEL` في `api/analyze.js`.
- **الحدود المجانية:** الطبقة المجانية تكفي فريقًا صغيرًا (مئات الطلبات يوميًا). عند تجاوزها يظهر خطأ مؤقت — انتظر أو حدّد الحضور يدويًا.
- **الخصوصية:** الطبقة المجانية من Gemini قد تستخدم المحتوى لتحسين نماذج Google. اللقطات لا تحوي بيانات حساسة عادةً، لكن انتبه لهذا إن كان مهمًّا؛ الطبقة المدفوعة تلغي ذلك.
- **تلوين Excel:** الملف المُصدَّر يحمل البيانات كاملة بصيغة RTL، لكن التلوين (أخضر/أحمر) يظهر داخل الأداة فقط لا في الملف — لقيود مكتبة التصدير داخل المتصفح.
- **الأمان:** القواعد أعلاه تسمح لأي زائر للرابط بالقراءة والكتابة على القائمة (عبر تسجيل مجهول). للفريق الداخلي هذا كافٍ؛ إن أردت تقييدًا أدق حسب الأدوار أخبرني.
