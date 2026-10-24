# MiroProbe AI — Autonomous Visitor Scenario Discovery & Behavioral Load Simulator
## مشروع تخرج: منصة اكتشاف سيناريوهات الزوار بالذكاء الاصطناعي ومحاكاة التحمل السلوكي

### 1. فكرة المشروع (Project Overview)
يحل هذا المشروع مشكلة جوهرية في هندسة البرمجيات واختبار الأداء (Performance & QA Engineering):
بدلاً من إرسال طلبات تقليدية صماء للصفحة الرئيسية فقط، يقوم **MiroProbe AI** بدمج مرحلتين:
1. **المرحلة الأولى (AI Autonomous Scenario Discovery — على غرار MonkeyTest / MiroFish):**
   تحليل بنية الموقع واستنتاج شخصيات زوار واقعية (AI Personas) ومسارات التصفح والبحث والشراء والتسجيل التي يسلكها المستخدم الحقيقي دون الحاجة لكتابة السيناريوهات يدوياً.
2. **المرحلة الثانية (Behavioral Load & Capacity Simulation — على غرار Loadster / Grafana k6):**
   التحكم في معدل تدفق الزوار في الدقيقة (**Visitors Per Minute - VPM**) ومحاكاة طوابير الانتظار (M/M/c Queuing Theory & Little's Law) لاكتشاف نقاط الاختناق (Bottlenecks) وتوليد أكواد اختبار حقيقية بـ **Playwright** و **Grafana k6**.

---

### 2. محتويات المجلد (Project Structure)
- `start-miroprobe.bat` : ملف التشغيل التلقائي على ويندوز (يقوم بتثبيت حزم Node ومتصفح Chromium تلقائياً).
- `playwright.config.ts` : إعدادات متصفح الاختبار التلقائي.
- `server.js` : خادم لوحة التحكم المحلية على اللابتوب (`http://localhost:3000`).
- `playwright-personas.spec.ts` : سيناريوهات المتصفح الحقيقي (Playwright E2E Personas) المكتشفة للموقع.
- `k6-load-scenarios.js` : سكريبت اختبار التحمل المتزامن بواسطة Grafana k6 بمعدل **180 زائر/دقيقة**.
- `discovered-scenarios.json` : ملف البيانات المهيكلة للشخصيات والمسارات المكتشفة.

---

### 3. طريقة التشغيل على اللابتوب (How to Run on Windows Laptop)
1. قم بفك ضغط ملف الـ ZIP في أي مجلد على جهازك.
2. اضغط مرتين على ملف **`start-miroprobe.bat`** (في أول مرة سيقوم تلقائياً بتحميل متصفح Chromium عبر `npx playwright install chromium`).
3. ستظهر لك قائمة تفاعلية لتشغيل:
   - **[1]** فتح واجهة التحكم المحلية على المتصفح (`http://localhost:3000`).
   - **[2]** تشغيل متصفح Chromium حقيقي عبر Playwright لتنفيذ رحلات الزوار أمامك.
   - **[3]** تشغيل 4 متصفحات Chromium متزامنة في نفس الوقت لمحاكاة موجة زوار حقيقية.
   - **[4]** تشغيل اختبار التحمل والضغط المصرح به عبر Grafana k6.

---

### 4. ملخص نتائج المحاكاة الحالية (Current Simulation Snapshot)
- **الموقع المستهدف:** `https://demo-store.graduation-project.edu`
- **معدل الزوار المحدد:** `180 زائر / دقيقة`
- **المستخدمون المتزامنون (Concurrent VUs):** `23`
- **زمن الاستجابة (p95 Latency):** `586 ms`
- **مؤشر جودة الأداء (Apdex Score):** `1`

> **تنبيه أخلاقي وأكاديمي هام:** يجب استخدام سكريبتات الاختبار المرفقة فقط على المواقع والبيئات التجريبية الخاصة بك أو التي تملك تصريحاً رسمياً باختبارها.
