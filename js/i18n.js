// i18n.js — four-language support (English, Arabic, Urdu, Hindi) for the
// equipment checklist feature.
//
// Scope note: this covers the checklist pages and their shared chrome. The
// original assessment/permit pages are still English-only — translating the
// load-chart engineering wording is a separate job that should be done with a
// competent person who works in those languages, not bolted on here.
//
// Arabic and Urdu are right-to-left. Setting the language flips the whole
// document direction (see the [dir="rtl"] rules in css/styles.css) rather than
// trying to mirror individual components.
//
// IMPORTANT — translations are a working draft. They were written to be
// technically accurate, but before these checklists are used to brief a crew on
// site, have a native speaker who works in the trade read them. A mistranslated
// inspection item on a crane is not a cosmetic problem.

const I18n = (function () {

  const STORAGE_KEY = 'cla_lang';

  const LANGS = [
    { code: 'en', label: 'English',  native: 'English',  dir: 'ltr' },
    { code: 'ar', label: 'Arabic',   native: 'العربية',   dir: 'rtl' },
    { code: 'ur', label: 'Urdu',     native: 'اردو',      dir: 'rtl' },
    { code: 'hi', label: 'Hindi',    native: 'हिन्दी',     dir: 'ltr' }
  ];

  const STRINGS = {

    // ---- Page / navigation ----
    'nav.checklist':        { en: 'Equipment checklist', ar: 'قائمة فحص المعدات', ur: 'آلات چیک لسٹ', hi: 'उपकरण चेकलिस्ट' },
    'nav.checklists':       { en: 'Checklist records', ar: 'سجلات الفحص', ur: 'چیک لسٹ ریکارڈ', hi: 'चेकलिस्ट रिकॉर्ड' },
    'page.checklist.title': { en: 'Monthly equipment checklist', ar: 'قائمة الفحص الشهري للمعدات', ur: 'ماہانہ آلات چیک لسٹ', hi: 'मासिक उपकरण चेकलिस्ट' },
    'page.checklist.crumb': { en: 'Earthmoving machinery & cranes — monthly inspection and maintenance', ar: 'معدات الحفر والرافعات — الفحص والصيانة الشهرية', ur: 'زمین کھودنے والی مشینری اور کرینیں — ماہانہ معائنہ اور دیکھ بھال', hi: 'अर्थमूविंग मशीनरी और क्रेन — मासिक निरीक्षण और रखरखाव' },
    'page.records.title':   { en: 'Checklist records', ar: 'سجلات قوائم الفحص', ur: 'چیک لسٹ ریکارڈ', hi: 'चेकलिस्ट रिकॉर्ड' },
    'page.records.crumb':   { en: 'All saved monthly inspections, by colour code', ar: 'جميع عمليات الفحص الشهرية المحفوظة، حسب رمز اللون', ur: 'تمام محفوظ ماہانہ معائنے، رنگ کوڈ کے مطابق', hi: 'सभी सहेजे गए मासिक निरीक्षण, रंग कोड के अनुसार' },

    // ---- Language switcher ----
    'lang.label':   { en: 'Language', ar: 'اللغة', ur: 'زبان', hi: 'भाषा' },

    // ---- Equipment details ----
    'sec.equipment':     { en: 'Equipment details', ar: 'بيانات المعدة', ur: 'مشین کی تفصیلات', hi: 'उपकरण विवरण' },
    'f.equipmentType':   { en: 'Equipment type', ar: 'نوع المعدة', ur: 'مشین کی قسم', hi: 'उपकरण का प्रकार' },
    'f.make':            { en: 'Make', ar: 'الصانع', ur: 'بنانے والا', hi: 'निर्माता' },
    'f.model':           { en: 'Model', ar: 'الطراز', ur: 'ماڈل', hi: 'मॉडल' },
    'f.serial':          { en: 'Serial / chassis no.', ar: 'الرقم التسلسلي / الشاسيه', ur: 'سیریل / چیسس نمبر', hi: 'सीरियल / चेसिस नं.' },
    'f.assetNo':         { en: 'Asset / fleet no.', ar: 'رقم الأصل / الأسطول', ur: 'اثاثہ / فلیٹ نمبر', hi: 'एसेट / फ्लीट नं.' },
    'f.plateNo':         { en: 'Plate no.', ar: 'رقم اللوحة', ur: 'نمبر پلیٹ', hi: 'प्लेट नं.' },
    'f.capacity':        { en: 'Rated capacity', ar: 'السعة المقننة', ur: 'مقررہ صلاحیت', hi: 'रेटेड क्षमता' },
    'f.hourMeter':       { en: 'Hour meter', ar: 'عداد الساعات', ur: 'آور میٹر', hi: 'आवर मीटर' },
    'f.odometer':        { en: 'Odometer (km)', ar: 'عداد المسافة (كم)', ur: 'اوڈومیٹر (کلومیٹر)', hi: 'ओडोमीटर (किमी)' },
    'f.location':        { en: 'Site / location', ar: 'الموقع', ur: 'سائٹ / مقام', hi: 'साइट / स्थान' },
    'f.project':         { en: 'Project', ar: 'المشروع', ur: 'پروجیکٹ', hi: 'परियोजना' },
    'f.contractor':      { en: 'Owner / contractor', ar: 'المالك / المقاول', ur: 'مالک / ٹھیکیدار', hi: 'स्वामी / ठेकेदार' },
    'f.month':           { en: 'Inspection month', ar: 'شهر الفحص', ur: 'معائنہ کا مہینہ', hi: 'निरीक्षण माह' },
    'f.inspectionDate':  { en: 'Inspection date', ar: 'تاريخ الفحص', ur: 'معائنہ کی تاریخ', hi: 'निरीक्षण तिथि' },
    'f.nextDue':         { en: 'Next inspection due', ar: 'موعد الفحص القادم', ur: 'اگلا معائنہ', hi: 'अगला निरीक्षण देय' },
    'f.inspector':       { en: 'Inspected by', ar: 'تم الفحص بواسطة', ur: 'معائنہ کرنے والا', hi: 'निरीक्षणकर्ता' },
    'f.inspectorId':     { en: 'Inspector ID / trade', ar: 'رقم/مهنة الفاحص', ur: 'انسپکٹر شناخت / پیشہ', hi: 'निरीक्षक आईडी / ट्रेड' },
    'f.supervisor':      { en: 'Reviewed by (supervisor)', ar: 'روجع بواسطة (المشرف)', ur: 'جائزہ لینے والا (سپروائزر)', hi: 'समीक्षक (पर्यवेक्षक)' },
    'f.operator':        { en: 'Operator name', ar: 'اسم المشغّل', ur: 'آپریٹر کا نام', hi: 'ऑपरेटर का नाम' },
    'f.remarks':         { en: 'Remarks', ar: 'ملاحظات', ur: 'تبصرہ', hi: 'टिप्पणी' },
    'f.optional':        { en: 'optional', ar: 'اختياري', ur: 'اختیاری', hi: 'वैकल्पिक' },
    'f.selectPlaceholder': { en: '— select —', ar: '— اختر —', ur: '— منتخب کریں —', hi: '— चुनें —' },

    // ---- Item status ----
    'st.ok':      { en: 'Satisfactory', ar: 'مُرضٍ', ur: 'تسلی بخش', hi: 'संतोषजनक' },
    'st.monitor': { en: 'Minor defect — monitor', ar: 'عيب بسيط — للمراقبة', ur: 'معمولی خرابی — نگرانی', hi: 'मामूली खराबी — निगरानी' },
    'st.defect':  { en: 'Major defect — rectify', ar: 'عيب جسيم — يجب الإصلاح', ur: 'بڑی خرابی — درستگی لازم', hi: 'बड़ी खराबी — सुधार आवश्यक' },
    'st.na':      { en: 'Not applicable', ar: 'لا ينطبق', ur: 'لاگو نہیں', hi: 'लागू नहीं' },
    'st.short.ok':      { en: 'OK', ar: 'سليم', ur: 'ٹھیک', hi: 'ठीक' },
    'st.short.monitor': { en: 'Monitor', ar: 'مراقبة', ur: 'نگرانی', hi: 'निगरानी' },
    'st.short.defect':  { en: 'Defect', ar: 'عيب', ur: 'خرابی', hi: 'खराबी' },
    'st.short.na':      { en: 'N/A', ar: 'غ/م', ur: 'لاگو نہیں', hi: 'लागू नहीं' },

    // ---- Overall verdict ----
    'sec.verdict':     { en: 'Overall result', ar: 'النتيجة الإجمالية', ur: 'مجموعی نتیجہ', hi: 'समग्र परिणाम' },
    'v.fit':           { en: 'Fit for service', ar: 'صالحة للخدمة', ur: 'سروس کے لیے موزوں', hi: 'सेवा के लिए उपयुक्त' },
    'v.conditional':   { en: 'Fit with conditions', ar: 'صالحة بشروط', ur: 'مشروط طور پر موزوں', hi: 'शर्तों के साथ उपयुक्त' },
    'v.unfit':         { en: 'Out of service — DO NOT USE', ar: 'خارج الخدمة — لا تستخدم', ur: 'سروس سے باہر — استعمال نہ کریں', hi: 'सेवा से बाहर — उपयोग न करें' },
    'v.autoNote':      { en: 'Suggested automatically from the item results — you can override it.', ar: 'مُقترح تلقائياً من نتائج البنود — يمكنك تغييره.', ur: 'آئٹمز کے نتائج سے خودکار تجویز — آپ تبدیل کر سکتے ہیں۔', hi: 'आइटम परिणामों से स्वतः सुझाया गया — आप बदल सकते हैं।' },

    // ---- Colour coding ----
    'sec.colour':        { en: 'Colour code', ar: 'رمز اللون', ur: 'رنگ کوڈ', hi: 'रंग कोड' },
    'c.monthCode':       { en: 'This month\'s colour code', ar: 'رمز لون هذا الشهر', ur: 'اس مہینے کا رنگ کوڈ', hi: 'इस माह का रंग कोड' },
    'c.scheme':          { en: 'Colour scheme', ar: 'نظام الألوان', ur: 'رنگ اسکیم', hi: 'रंग योजना' },
    'c.scheme.monthly':  { en: 'Monthly (12 colours)', ar: 'شهري (12 لوناً)', ur: 'ماہانہ (12 رنگ)', hi: 'मासिक (12 रंग)' },
    'c.scheme.quarterly':{ en: 'Quarterly (4 colours)', ar: 'ربع سنوي (4 ألوان)', ur: 'سہ ماہی (4 رنگ)', hi: 'त्रैमासिक (4 रंग)' },
    'c.tagFitted':       { en: 'Colour-code tag fitted to the machine', ar: 'تم تركيب بطاقة رمز اللون على المعدة', ur: 'مشین پر رنگ کوڈ ٹیگ لگا دیا گیا', hi: 'मशीन पर रंग कोड टैग लगाया गया' },
    'c.explain':         { en: 'Equipment that passes this month\'s inspection carries this month\'s colour tag. Anyone on site can then see at a glance whether a machine\'s inspection is current — a machine carrying last month\'s colour has not been inspected this month and should not be worked.', ar: 'المعدة التي تجتاز فحص هذا الشهر تحمل بطاقة لون هذا الشهر. عندها يستطيع أي شخص في الموقع أن يرى بنظرة واحدة ما إذا كان فحص المعدة سارياً — فالمعدة التي تحمل لون الشهر الماضي لم يتم فحصها هذا الشهر ولا يجوز تشغيلها.', ur: 'جو مشین اس مہینے کا معائنہ پاس کرتی ہے اس پر اس مہینے کے رنگ کا ٹیگ لگتا ہے۔ اس طرح سائٹ پر ہر شخص ایک نظر میں دیکھ سکتا ہے کہ مشین کا معائنہ موجودہ ہے یا نہیں — جس مشین پر پچھلے مہینے کا رنگ ہو اس کا اس مہینے معائنہ نہیں ہوا اور اسے نہیں چلانا چاہیے۔', hi: 'जो मशीन इस माह का निरीक्षण पास करती है उस पर इस माह के रंग का टैग लगता है। इससे साइट पर कोई भी एक नज़र में देख सकता है कि मशीन का निरीक्षण वर्तमान है या नहीं — जिस मशीन पर पिछले माह का रंग हो, उसका इस माह निरीक्षण नहीं हुआ है और उसे नहीं चलाना चाहिए।' },

    // ---- Summary ----
    'sum.title':      { en: 'Summary', ar: 'الملخص', ur: 'خلاصہ', hi: 'सारांश' },
    'sum.total':      { en: 'Items', ar: 'البنود', ur: 'آئٹمز', hi: 'आइटम' },
    'sum.checked':    { en: 'Completed', ar: 'مكتملة', ur: 'مکمل', hi: 'पूर्ण' },
    'sum.ok':         { en: 'Satisfactory', ar: 'مُرضٍ', ur: 'تسلی بخش', hi: 'संतोषजनक' },
    'sum.monitor':    { en: 'Monitor', ar: 'للمراقبة', ur: 'نگرانی', hi: 'निगरानी' },
    'sum.defect':     { en: 'Defects', ar: 'عيوب', ur: 'خرابیاں', hi: 'खराबियाँ' },
    'sum.na':         { en: 'N/A', ar: 'لا ينطبق', ur: 'لاگو نہیں', hi: 'लागू नहीं' },
    'sum.incomplete': { en: 'Not yet answered', ar: 'لم تتم الإجابة بعد', ur: 'ابھی جواب نہیں دیا', hi: 'अभी उत्तर नहीं दिया' },

    // ---- Buttons ----
    'btn.save':        { en: 'Save checklist', ar: 'حفظ القائمة', ur: 'چیک لسٹ محفوظ کریں', hi: 'चेकलिस्ट सहेजें' },
    'btn.markAllOk':   { en: 'Mark all satisfactory', ar: 'تحديد الكل كمُرضٍ', ur: 'سب کو تسلی بخش نشان زد کریں', hi: 'सभी को संतोषजनक चिह्नित करें' },
    'btn.clearAll':    { en: 'Clear all answers', ar: 'مسح جميع الإجابات', ur: 'تمام جوابات صاف کریں', hi: 'सभी उत्तर हटाएँ' },
    'btn.print':       { en: 'Print / save as PDF', ar: 'طباعة / حفظ كـ PDF', ur: 'پرنٹ / PDF محفوظ کریں', hi: 'प्रिंट / PDF सहेजें' },
    'btn.email':       { en: 'Forward by email', ar: 'إرسال بالبريد الإلكتروني', ur: 'ای میل سے بھیجیں', hi: 'ईमेल द्वारा भेजें' },
    'btn.view':        { en: 'View', ar: 'عرض', ur: 'دیکھیں', hi: 'देखें' },
    'btn.delete':      { en: 'Delete', ar: 'حذف', ur: 'حذف کریں', hi: 'हटाएँ' },
    'btn.close':       { en: 'Close', ar: 'إغلاق', ur: 'بند کریں', hi: 'बंद करें' },
    'btn.newChecklist':{ en: '+ New checklist', ar: '+ قائمة فحص جديدة', ur: '+ نئی چیک لسٹ', hi: '+ नई चेकलिस्ट' },
    'btn.records':     { en: 'Checklist records', ar: 'سجلات الفحص', ur: 'چیک لسٹ ریکارڈ', hi: 'चेकलिस्ट रिकॉर्ड' },
    'btn.exportCsv':   { en: 'Export CSV', ar: 'تصدير CSV', ur: 'CSV برآمد کریں', hi: 'CSV निर्यात' },

    // ---- Email ----
    'em.title':      { en: 'Forward checklist by email', ar: 'إرسال قائمة الفحص بالبريد الإلكتروني', ur: 'چیک لسٹ ای میل سے بھیجیں', hi: 'चेकलिस्ट ईमेल द्वारा भेजें' },
    'em.from':       { en: 'From', ar: 'من', ur: 'منجانب', hi: 'प्रेषक' },
    'em.to':         { en: 'To', ar: 'إلى', ur: 'بنام', hi: 'प्रति' },
    'em.cc':         { en: 'Cc', ar: 'نسخة إلى', ur: 'کاپی', hi: 'प्रतिलिपि' },
    'em.subject':    { en: 'Subject', ar: 'الموضوع', ur: 'موضوع', hi: 'विषय' },
    'em.body':       { en: 'Message', ar: 'الرسالة', ur: 'پیغام', hi: 'संदेश' },
    'em.multiHint':  { en: 'Separate multiple addresses with a comma or semicolon', ar: 'افصل بين العناوين المتعددة بفاصلة أو فاصلة منقوطة', ur: 'ایک سے زیادہ پتے کوما یا سیمی کولن سے الگ کریں', hi: 'एक से अधिक पते अल्पविराम या अर्धविराम से अलग करें' },
    'em.regenerate': { en: 'Generate a different draft', ar: 'إنشاء مسودة مختلفة', ur: 'مختلف مسودہ بنائیں', hi: 'अलग मसौदा बनाएँ' },
    'em.openClient': { en: 'Open in email app', ar: 'فتح في تطبيق البريد', ur: 'ای میل ایپ میں کھولیں', hi: 'ईमेल ऐप में खोलें' },
    'em.copy':       { en: 'Copy message', ar: 'نسخ الرسالة', ur: 'پیغام کاپی کریں', hi: 'संदेश कॉपी करें' },
    'em.download':   { en: 'Download .eml (recommended)', ar: 'تنزيل ملف .eml (مستحسن)', ur: '.eml ڈاؤن لوڈ کریں (تجویز کردہ)', hi: '.eml डाउनलोड करें (अनुशंसित)' },
    'em.copied':     { en: 'Copied to clipboard ✓', ar: 'تم النسخ ✓', ur: 'کاپی ہو گیا ✓', hi: 'कॉपी हो गया ✓' },
    'em.needTo':     { en: 'Enter at least one valid recipient address.', ar: 'أدخل عنوان مستلم صالح واحد على الأقل.', ur: 'کم از کم ایک درست وصول کنندہ پتہ درج کریں۔', hi: 'कम से कम एक वैध प्राप्तकर्ता पता दर्ज करें।' },
    'em.badAddress': { en: 'These addresses don\'t look valid:', ar: 'هذه العناوين لا تبدو صالحة:', ur: 'یہ پتے درست نہیں لگتے:', hi: 'ये पते वैध नहीं लगते:' },
    'em.note':       { en: 'This app has no mail server, so it cannot send email itself. It prepares the message and hands it to your own email app. The .eml download keeps the From, To and full message intact — "Open in email app" is quicker but some mail apps truncate long messages.', ar: 'لا يملك هذا التطبيق خادم بريد، لذا لا يمكنه إرسال البريد بنفسه. هو يُعدّ الرسالة ويسلّمها إلى تطبيق البريد لديك. تنزيل ملف .eml يحافظ على حقول "من" و"إلى" والرسالة كاملة — أما "فتح في تطبيق البريد" فأسرع لكن بعض التطبيقات تقتطع الرسائل الطويلة.', ur: 'اس ایپ کا کوئی میل سرور نہیں، اس لیے یہ خود ای میل نہیں بھیج سکتی۔ یہ پیغام تیار کر کے آپ کی ای میل ایپ کے حوالے کرتی ہے۔ .eml ڈاؤن لوڈ میں منجانب، بنام اور مکمل پیغام محفوظ رہتا ہے — "ای میل ایپ میں کھولیں" تیز ہے مگر کچھ ایپس طویل پیغام کاٹ دیتی ہیں۔', hi: 'इस ऐप का कोई मेल सर्वर नहीं है, इसलिए यह स्वयं ईमेल नहीं भेज सकता। यह संदेश तैयार करके आपके ईमेल ऐप को सौंप देता है। .eml डाउनलोड में प्रेषक, प्राप्तकर्ता और पूरा संदेश सुरक्षित रहता है — "ईमेल ऐप में खोलें" तेज़ है पर कुछ ऐप लंबे संदेश काट देते हैं।' },
    'em.attachNote': { en: 'Print the checklist to PDF first if the recipient needs a signed copy — the email carries the text of the record, not a file attachment.', ar: 'اطبع القائمة كملف PDF أولاً إذا كان المستلم يحتاج نسخة موقّعة — البريد يحمل نص السجل وليس مرفقاً.', ur: 'اگر وصول کنندہ کو دستخط شدہ نقل چاہیے تو پہلے چیک لسٹ کو PDF میں پرنٹ کریں — ای میل میں ریکارڈ کا متن ہوتا ہے، منسلک فائل نہیں۔', hi: 'यदि प्राप्तकर्ता को हस्ताक्षरित प्रति चाहिए तो पहले चेकलिस्ट को PDF में प्रिंट करें — ईमेल में रिकॉर्ड का पाठ होता है, संलग्न फ़ाइल नहीं।' },

    // ---- Records list ----
    'r.month':      { en: 'Month', ar: 'الشهر', ur: 'مہینہ', hi: 'माह' },
    'r.equipment':  { en: 'Equipment', ar: 'المعدة', ur: 'مشین', hi: 'उपकरण' },
    'r.result':     { en: 'Result', ar: 'النتيجة', ur: 'نتیجہ', hi: 'परिणाम' },
    'r.defects':    { en: 'Defects', ar: 'العيوب', ur: 'خرابیاں', hi: 'खराबियाँ' },
    'r.inspector':  { en: 'Inspector', ar: 'الفاحص', ur: 'انسپکٹر', hi: 'निरीक्षक' },
    'r.colour':     { en: 'Colour', ar: 'اللون', ur: 'رنگ', hi: 'रंग' },
    'r.none':       { en: 'No checklists saved yet.', ar: 'لا توجد قوائم فحص محفوظة بعد.', ur: 'ابھی کوئی چیک لسٹ محفوظ نہیں۔', hi: 'अभी कोई चेकलिस्ट सहेजी नहीं गई।' },
    'r.allEquipment': { en: 'All equipment types', ar: 'جميع أنواع المعدات', ur: 'تمام اقسام', hi: 'सभी उपकरण प्रकार' },
    'r.allResults':   { en: 'All results', ar: 'جميع النتائج', ur: 'تمام نتائج', hi: 'सभी परिणाम' },
    'r.allMonths':    { en: 'All months', ar: 'جميع الأشهر', ur: 'تمام مہینے', hi: 'सभी महीने' },
    'r.search':       { en: 'Search asset no., make, model, inspector…', ar: 'ابحث برقم الأصل أو الصانع أو الطراز أو الفاحص…', ur: 'اثاثہ نمبر، ساز، ماڈل، انسپکٹر تلاش کریں…', hi: 'एसेट नं., निर्माता, मॉडल, निरीक्षक खोजें…' },

    // ---- Messages ----
    'msg.saved':        { en: 'Checklist saved ✓', ar: 'تم حفظ القائمة ✓', ur: 'چیک لسٹ محفوظ ہو گئی ✓', hi: 'चेकलिस्ट सहेजी गई ✓' },
    'msg.needType':     { en: 'Select the equipment type first.', ar: 'اختر نوع المعدة أولاً.', ur: 'پہلے مشین کی قسم منتخب کریں۔', hi: 'पहले उपकरण का प्रकार चुनें।' },
    'msg.needInspector':{ en: 'Enter the name of the person carrying out the inspection.', ar: 'أدخل اسم الشخص الذي أجرى الفحص.', ur: 'معائنہ کرنے والے کا نام درج کریں۔', hi: 'निरीक्षण करने वाले व्यक्ति का नाम दर्ज करें।' },
    'msg.needAsset':    { en: 'Enter the asset / fleet number so the record can be identified.', ar: 'أدخل رقم الأصل / الأسطول ليمكن تمييز السجل.', ur: 'ریکارڈ کی شناخت کے لیے اثاثہ / فلیٹ نمبر درج کریں۔', hi: 'रिकॉर्ड की पहचान के लिए एसेट / फ्लीट नंबर दर्ज करें।' },
    'msg.incomplete':   { en: 'items have not been answered. Save anyway?', ar: 'بنداً لم تتم الإجابة عليه. الحفظ على أي حال؟', ur: 'آئٹمز کا جواب نہیں دیا گیا۔ پھر بھی محفوظ کریں؟', hi: 'आइटम का उत्तर नहीं दिया गया। फिर भी सहेजें?' },
    'msg.confirmDelete':{ en: 'Delete this checklist record? This cannot be undone.', ar: 'حذف سجل الفحص هذا؟ لا يمكن التراجع.', ur: 'یہ چیک لسٹ ریکارڈ حذف کریں؟ واپس نہیں ہو سکتا۔', hi: 'यह चेकलिस्ट रिकॉर्ड हटाएँ? इसे वापस नहीं किया जा सकता।' },
    'msg.confirmClear': { en: 'Clear every answer on this checklist?', ar: 'مسح جميع الإجابات في هذه القائمة؟', ur: 'اس چیک لسٹ کے تمام جوابات صاف کریں؟', hi: 'इस चेकलिस्ट के सभी उत्तर हटाएँ?' },

    // ---- Disclaimer ----
    'disc.title': { en: 'This checklist does not replace statutory inspection.', ar: 'لا تُغني قائمة الفحص هذه عن الفحص القانوني.', ur: 'یہ چیک لسٹ قانونی معائنے کا متبادل نہیں۔', hi: 'यह चेकलिस्ट वैधानिक निरीक्षण का विकल्प नहीं है।' },
    'disc.body':  { en: 'It is a routine monthly check by a competent person. It does not replace the statutory third-party examination, the manufacturer\'s service schedule, or a load test. Any item marked as a major defect means the machine is taken out of service until it is rectified and re-checked.', ar: 'هي فحص شهري روتيني يقوم به شخص مؤهل. ولا تُغني عن الفحص القانوني من طرف ثالث، أو جدول الصيانة الخاص بالصانع، أو اختبار التحميل. أي بند يُؤشَّر كعيب جسيم يعني إخراج المعدة من الخدمة حتى يتم إصلاحه وإعادة فحصه.', ur: 'یہ ایک اہل شخص کا معمول کا ماہانہ معائنہ ہے۔ یہ قانونی تھرڈ پارٹی معائنے، بنانے والے کے سروس شیڈول، یا لوڈ ٹیسٹ کا متبادل نہیں۔ جس آئٹم پر بڑی خرابی درج ہو، مشین کو درستگی اور دوبارہ جانچ تک سروس سے باہر رکھا جائے۔', hi: 'यह एक सक्षम व्यक्ति द्वारा नियमित मासिक जाँच है। यह वैधानिक थर्ड-पार्टी परीक्षण, निर्माता के सर्विस शेड्यूल, या लोड टेस्ट का विकल्प नहीं है। जिस आइटम पर बड़ी खराबी दर्ज हो, मशीन को सुधार और पुनः जाँच तक सेवा से बाहर रखा जाए।' },
    'disc.translation': { en: 'Translations are a working draft — have a native speaker who works in the trade check them before using these to brief a crew.', ar: 'الترجمات مسودة عمل — اطلب من متحدث أصلي يعمل في المجال مراجعتها قبل استخدامها في توجيه الطاقم.', ur: 'تراجم ابتدائی مسودہ ہیں — عملے کو بریف کرنے سے پہلے کسی پیشہ ور مقامی زبان دان سے جانچ کرائیں۔', hi: 'अनुवाद एक कार्यशील मसौदा है — चालक दल को ब्रीफ करने से पहले इस पेशे के किसी मातृभाषी से जाँच करवाएँ।' }
  };

  let current = 'en';

  function detect() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && STRINGS['lang.label'][saved]) return saved;
    } catch (e) { /* storage blocked */ }
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return ['en', 'ar', 'ur', 'hi'].includes(nav) ? nav : 'en';
  }

  // t('f.make') → the string in the current language, falling back to English
  // then to the key itself, so a missing translation is visible rather than blank.
  function t(key, lang) {
    const l = lang || current;
    const entry = STRINGS[key];
    if (!entry) return key;
    return entry[l] || entry.en || key;
  }

  // Picks the right field out of a { en, ar, ur, hi } object — used for the
  // checklist item text in js/checklist-data.js.
  function pick(obj, lang) {
    if (!obj) return '';
    const l = lang || current;
    return obj[l] || obj.en || '';
  }

  function dirFor(lang) {
    const e = LANGS.find(x => x.code === (lang || current));
    return e ? e.dir : 'ltr';
  }

  function isRtl(lang) { return dirFor(lang) === 'rtl'; }

  function get() { return current; }

  function set(lang) {
    if (!STRINGS['lang.label'][lang]) lang = 'en';
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    applyDocument();
    apply();
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  }

  function applyDocument() {
    const html = document.documentElement;
    html.setAttribute('lang', current);
    html.setAttribute('dir', dirFor(current));
    html.classList.toggle('lang-ar', current === 'ar');
    html.classList.toggle('lang-ur', current === 'ur');
    html.classList.toggle('lang-hi', current === 'hi');
  }

  // Translates any element carrying data-i18n / data-i18n-placeholder /
  // data-i18n-title. Safe to call as often as you like.
  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
  }

  // Renders the language switcher into a container element.
  function mountSwitcher(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.className = 'lang-switch no-print';
    el.innerHTML = `
      <span class="lang-switch-label" data-i18n="lang.label"></span>
      <div class="lang-switch-btns" role="group">
        ${LANGS.map(l => `
          <button type="button" class="lang-btn ${l.code === current ? 'active' : ''}"
                  data-lang="${l.code}" lang="${l.code}" dir="${l.dir}"
                  aria-pressed="${l.code === current}">${l.native}</button>`).join('')}
      </div>`;
    el.querySelectorAll('.lang-btn').forEach(b => {
      b.addEventListener('click', () => {
        set(b.getAttribute('data-lang'));
        el.querySelectorAll('.lang-btn').forEach(x => {
          const on = x.getAttribute('data-lang') === current;
          x.classList.toggle('active', on);
          x.setAttribute('aria-pressed', String(on));
        });
      });
    });
    apply(el);
  }

  current = detect();

  return { LANGS, STRINGS, t, pick, get, set, apply, applyDocument, mountSwitcher, dirFor, isRtl };
})();
