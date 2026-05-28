/**
 * INEXC — نظام الإشعارات الموحّد
 * يدعم: EmailJS / WhatsApp / تنبيهات المسؤول
 */
(function (global) {
  'use strict';

  /* ── إعدادات EmailJS ── */
  const EMAILJS_PUBLIC_KEY   = window.EMAILJS_PUBLIC_KEY   || 'gc0MqAK4Mwebs_GOg';
  const EMAILJS_SERVICE_ID   = window.EMAILJS_SERVICE_ID   || 'service_58hjcoc';
  const TEMPLATE_CONFIRM     = window.EMAILJS_TEMPLATE_ID  || 'template_fq8l9x8';
  const TEMPLATE_REMINDER    = 'template_reminder_01';   // أنشئه في لوحة EmailJS إن أردت
  const TEMPLATE_ADMIN_ALERT = 'template_admin_alert_01'; // أنشئه في لوحة EmailJS

  const ADMIN_EMAIL = 'admin@inexctraining.com'; // عدّل حسب الحاجة
  const WA_PHONE    = '971543475500';            // رقم واتساب INEXC

  /* ─────────────────────────────────────────────
     الدالة المساعدة: إرسال عبر EmailJS
  ───────────────────────────────────────────── */
  async function sendEmail(templateId, params) {
    if (!window.emailjs) {
      console.warn('[INEXC Notifications] EmailJS غير محمّل');
      return { ok: false, error: 'EmailJS not loaded' };
    }
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, templateId, params, EMAILJS_PUBLIC_KEY);
      return { ok: true };
    } catch (err) {
      console.error('[INEXC Notifications] خطأ EmailJS:', err);
      return { ok: false, error: err };
    }
  }

  /* ─────────────────────────────────────────────
     1. تأكيد التسجيل للمتدرب
  ───────────────────────────────────────────── */
  async function sendRegistrationConfirmation(data) {
    /* data: { name, email, courseName, courseType, price, registrationId, accessToken } */
    const params = {
      to_name:         data.name       || 'المتدرب/ة',
      to_email:        data.email      || '',
      course_name:     data.courseName || 'الدورة التدريبية',
      course_type:     data.courseType === 'free' ? 'مجانية' : 'مدفوعة',
      amount:          data.courseType === 'free' ? 'مجاناً' : (data.price + ' د.إ'),
      registration_id: String(data.registrationId || ''),
      access_link:     data.accessToken
        ? `https://www.inexctraining.com/account.html?token=${data.accessToken}`
        : 'https://www.inexctraining.com/account.html',
      year:            new Date().getFullYear(),
    };
    return sendEmail(TEMPLATE_CONFIRM, params);
  }

  /* ─────────────────────────────────────────────
     2. تنبيه المسؤول بتسجيل جديد
  ───────────────────────────────────────────── */
  async function sendAdminNewRegistrationAlert(data) {
    /* data: { name, email, phone, courseName, courseType, price, registrationId } */
    const params = {
      to_name:         'إدارة INEXC',
      to_email:        ADMIN_EMAIL,
      trainee_name:    data.name       || '—',
      trainee_email:   data.email      || '—',
      trainee_phone:   data.phone      || '—',
      course_name:     data.courseName || '—',
      course_type:     data.courseType === 'free' ? 'مجانية' : 'مدفوعة',
      amount:          data.courseType === 'free' ? 'مجاناً' : (data.price + ' د.إ'),
      registration_id: String(data.registrationId || ''),
      registered_at:   new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Dubai' }),
      admin_link:      'https://www.inexctraining.com/admin.html',
    };
    return sendEmail(TEMPLATE_ADMIN_ALERT, params);
  }

  /* ─────────────────────────────────────────────
     3. إرسال تذكير قبل بدء الدورة
  ───────────────────────────────────────────── */
  async function sendCourseReminder(data) {
    /* data: { name, email, courseName, startDate, daysLeft, accessToken } */
    const params = {
      to_name:      data.name       || 'المتدرب/ة',
      to_email:     data.email      || '',
      course_name:  data.courseName || 'الدورة التدريبية',
      start_date:   data.startDate  || '',
      days_left:    String(data.daysLeft || 1),
      access_link:  data.accessToken
        ? `https://www.inexctraining.com/account.html?token=${data.accessToken}`
        : 'https://www.inexctraining.com/account.html',
    };
    return sendEmail(TEMPLATE_REMINDER, params);
  }

  /* ─────────────────────────────────────────────
     4. توليد رابط واتساب مخصص
  ───────────────────────────────────────────── */
  function generateWhatsAppLink(message, phone) {
    const num = (phone || WA_PHONE).replace(/\D/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${num}?text=${encoded}`;
  }

  /* ─────────────────────────────────────────────
     5. رسائل واتساب جاهزة
  ───────────────────────────────────────────── */
  const WhatsAppTemplates = {
    /* إرسال من المسؤول للمتدرب عند قبول تسجيله */
    registrationApproved: (data) =>
      `السلام عليكم ${data.name || ''}،\n\nتهانينا! تم قبول تسجيلك في دورة:\n*${data.courseName}*\n\nيمكنك الدخول لبوابتك عبر:\nhttps://www.inexctraining.com/account.html?token=${data.accessToken || ''}\n\nفريق INEXC 🎓`,

    /* تذكير بالدورة */
    courseReminder: (data) =>
      `السلام عليكم ${data.name || ''}،\n\nتذكير: دورة *${data.courseName}* تبدأ خلال ${data.daysLeft} ${data.daysLeft === 1 ? 'يوم' : 'أيام'}.\n\nاستعد واطّلع على بوابتك:\nhttps://www.inexctraining.com/account.html\n\nفريق INEXC 🎓`,

    /* إشعار صدور شهادة */
    certificateIssued: (data) =>
      `السلام عليكم ${data.name || ''}،\n\n🎉 تهانينا! تم إصدار شهادتك في:\n*${data.courseName}*\n\nرقم الشهادة: ${data.certNumber || ''}\n\nللتحقق: https://www.inexctraining.com/certificate.html?n=${data.certNumber || ''}\n\nفريق INEXC 🏆`,

    /* تأكيد الدفع */
    paymentConfirmed: (data) =>
      `السلام عليكم ${data.name || ''}،\n\n✅ تم استلام دفعتك بنجاح.\nالمبلغ: ${data.amount} د.إ\nالدورة: *${data.courseName}*\n\nسيتواصل معك فريقنا قريباً.\n\nفريق INEXC 💼`,
  };

  /* ─────────────────────────────────────────────
     6. فتح واتساب مع رسالة جاهزة
  ───────────────────────────────────────────── */
  function openWhatsApp(templateName, data, phone) {
    const template = WhatsAppTemplates[templateName];
    if (!template) { console.warn('[INEXC Notifications] قالب غير موجود:', templateName); return; }
    const link = generateWhatsAppLink(template(data), phone);
    window.open(link, '_blank', 'noopener');
  }

  /* ─────────────────────────────────────────────
     7. إرسال مجمّع عبر EmailJS لقائمة متدربين
     data: مصفوفة من كائنات { name, email, ... }
  ───────────────────────────────────────────── */
  async function sendBulkEmail(templateId, dataList, onProgress) {
    const results = [];
    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i];
      const result = await sendEmail(templateId, item);
      results.push({ ...item, ...result });
      if (onProgress) onProgress(i + 1, dataList.length, result);
      /* فاصل 500ms بين كل إرسال لتجنب حد المعدل */
      if (i < dataList.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    return results;
  }

  /* ─────────────────────────────────────────────
     8. تسجيل زيارة الرسالة (Pixel Tracking)
  ───────────────────────────────────────────── */
  async function trackEmailOpen(messageId) {
    const url = window.TRACK_EMAIL_OPEN_URL;
    if (!url || !messageId) return;
    try {
      await fetch(`${url}?id=${messageId}`, { method: 'GET', mode: 'no-cors' });
    } catch (e) { /* تجاهل أخطاء التتبع */ }
  }

  /* ── التصدير ── */
  global.InexcNotifications = {
    sendRegistrationConfirmation,
    sendAdminNewRegistrationAlert,
    sendCourseReminder,
    generateWhatsAppLink,
    openWhatsApp,
    sendBulkEmail,
    trackEmailOpen,
    WhatsAppTemplates,
    ADMIN_EMAIL,
    WA_PHONE,
  };

})(window);
