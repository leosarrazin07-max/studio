
export default {
  common: {
    cancel: 'إلغاء',
  },
  welcomeScreen: {
    title: 'أهلاً بك في PrEPy',
    subtitle: 'رفيقك الذكي عند الطلب. تتبع جرعاتك، ابق محمياً، وأدر جلساتك بثقة.',
    cta: 'ابدأ جلسة PrEP',
  },
  welcomeDialog: {
    title: 'تفعيل الإشعارات',
    description: {
      part1: 'من أجل سلامتك، يوصى بشدة بتفعيل الإشعارات. سيسمح هذا لـ PrEPy بإرسال تذكيرات لك بجرعات الأقراص.',
      part2: 'قد يؤدي تفويت تذكير إلى تعريض حمايتك للخطر.',
    },
    confirm: 'فهمت، قم بتفعيل الإشعارات',
  },
  settings: {
    title: 'الإعدادات',
    description: 'إدارة بياناتك وتفضيلاتك.',
    notifications: {
      title: 'الإشعارات',
      description: 'تلقي تذكير لكل جرعة لضمان حمايتك.',
      enabled: 'الإشعارات مفعلة',
      disabled: 'الإشعارات معطلة',
      loading: 'جار التحميل...',
      denied: 'لقد حظرت الإشعارات. لإعادة تفعيلها، يجب السماح بالإشعارات لهذا الموقع في إعدادات متصفحك ثم إعادة تحميل الصفحة.',
      disabledWarning: 'تذكيرات الجرعات معطلة. لن تتلقى أي إشعارات، مما قد يؤدي إلى تفويت جرعات.',
    },
    language: {
      title: 'اللغة',
      description: 'اختر لغة العرض للتطبيق.',
      select: 'اختر لغة',
    },
    theme: {
      title: "وضع العرض",
      description: "اختر بين المظهر الفاتح والمظلم."
    },
    clearHistory: {
      button: 'حذف سجلي',
      dialog: {
        title: 'هل أنت متأكد تماماً؟',
        description: 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات جلستك وسجل الأقراص نهائياً.',
        confirm: 'نعم، احذف بياناتي',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'ابدأ جلستك',
      description: 'ستبدأ بقرصين. قم بتأكيد موعد تناول جرعتك الأولية.',
    },
    regular: {
      title: 'سجل جرعتك',
      description: 'قم بتأكيد موعد تناول قرصك.',
    },
    missed: {
      title: 'جرعة فائتة',
      description: 'يبدو أنك فوتت جرعة. اختر خياراً لتحديث حالتك.',
      earlier: 'لقد تناولت قرصاً واحداً في وقت سابق',
      restart: 'إعادة البدء بقرصين',
    },
    picker: {
      description: 'اختر تاريخ ووقت تناول {count} قرص/أقراص.',
      confirm: 'تأكيد الوقت',
    },
    pills: {
      earlier: 'لقد تناولت {count} قرص/أقراص في وقت سابق',
      now: 'لقد تناولت {count} قرص/أqras الآن',
    },
  },
  doseHistory: {
    title: 'سجل',
    description: 'أنشطتك في آخر 90 يوماً.',
    event: {
      start: 'بدء الجلسة',
      dose: 'تناول القرص',
      stop: 'نهاية الجلسة',
      unknown: 'حدث غير معروف',
    },
    empty: {
      title: 'لم يتم تسجيل أي نشاط.',
      subtitle: 'ابدأ جلسة للبدء.',
    },
  },
  status: {
    inactive: 'غير نشط',
    loading: 'الحماية قيد التقدم...',
    effective: 'الحماية فعالة',
    missed: 'جرعة فائتة',
    lapsed: 'الحماية متوقفة',
    ended: 'الجلسة منتهية',
    loadingClient: 'جار التحميل...',
    riskWarning: 'إذا كان لديك اتصال جنسي غير محمي خارج فترة الحماية، يرجى إجراء اختبار.',
  },
  protection: {
    startsIn: 'ستكون فعالة خلال {time}',
    text: {
      lapsed: 'لقد فوتت جرعة واحدة أو أكثر. حمايتك لم تعد مضمونة.',
      lessThan3doses: 'إذا واصلت تناول الجرعات حتى {dateTroisiemeJour}، فإن علاقاتك بين {datePriseDemarrage} و{dateLendemain} ستكون محمية.',
      moreThan3doses: 'علاقاتك قبل {dateAvantDernierePrise} محمية بواسطة PrEP.',
    },
  },
  dose: {
    nextIn: 'الجرعة التالية خلال {time}',
    timeLeft: 'لديك {time} لتناول قرص',
    now: 'تناول قرصك الآن!',
  },
  dashboard: {
    logDose: 'لقد تناولت جرعتي',
    endSession: 'إنهاء الجلسة',
    startSession: 'بدء جلسة جديدة',
    stopPrepInfo: 'لإيقاف PrEP، استمر في تناول قرص واحد يومياً لمدة يومين بعد آخر اتصال جنسي لك.',
    endSessionDialog: {
      title: 'إنهاء جلسة PrEP؟',
      description: 'سيؤدي هذا إلى إيقاف تذكيرات الإشعارات. سيتم حساب حمايتك بناءً na آخر جرعة تناولتها.',
      confirm: 'نعم، إنهاء',
    },
  },
  session: {
    end: {
      toast: {
        title: 'الجلسة منتهية',
        description: 'تم إيقاف تذكيرات الإشعارات الآن.',
      },
    },
    clear: {
      toast: {
        dev: 'تم إعادة تحميل بيانات الاختبار',
        title: 'تم مسح البيانات',
        description: 'تم حذف سجلك وتفضيلاتك.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'المتصفح غير متوافق',
      denied: {
        title: 'تم رفض الإشعارات',
        description: 'يمكنك إعادة تفعيلها في إعدادات متصفحك.',
      },
      configError: {
        title: 'خطأ في التكوين',
        description: 'مفتاح الإشعار مفقود.',
      },
      enabled: 'تم تفعيل الإشعارات!',
      tokenError: 'لا يمكن استرداد الرمز',
      subscriptionError: 'خطأ في الاشتراك',
      disabled: 'تم تعطيل الإشعارات.',
      unsubscribeError: 'خطأ أثناء إلغاء الاشتراك',
    },
  },
} as const;
