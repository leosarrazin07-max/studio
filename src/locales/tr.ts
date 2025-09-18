
export default {
  common: {
    cancel: 'İptal',
  },
  welcomeScreen: {
    title: 'PrEPy\'ye Hoş Geldiniz',
    subtitle: 'Akıllı isteğe bağlı PrEP yardımcınız. Dozlarınızı takip edin, korunun ve seanslarınızı güvenle yönetin.',
    cta: 'Bir PrEP seansı başlatın',
  },
  welcomeDialog: {
    title: 'Bildirimleri Etkinleştir',
    description: {
      part1: 'Güvenliğiniz için bildirimleri etkinleştirmeniz şiddetle tavsiye edilir. Bu, PrEPy\'nin size hap dozlarınız için hatırlatıcılar göndermesini sağlayacaktır.',
      part2: 'Bir hatırlatıcıyı kaçırmak korumanızı tehlikeye atabilir.',
    },
    confirm: 'Anladım, bildirimleri etkinleştir',
  },
  settings: {
    title: 'Ayarlar',
    description: 'Verilerinizi ve tercihlerinizi yönetin.',
    notifications: {
      title: 'Bildirimler',
      description: 'Korumanızı sağlamak için her doz için bir hatırlatıcı alın.',
      enabled: 'Bildirimler etkinleştirildi',
      disabled: 'Bildirimler devre dışı bırakıldı',
      loading: 'Yükleniyor...',
      denied: 'Bildirimleri engellediniz. Yeniden etkinleştirmek için, tarayıcı ayarlarınızda bu site için bildirimlere izin vermeli, ardından sayfayı yeniden yüklemelisiniz.',
      disabledWarning: 'Doz hatırlatıcıları devre dışı bırakıldı. Herhangi bir bildirim almayacaksınız, bu da dozların kaçırılmasına neden olabilir.',
    },
    language: {
      title: 'Dil',
      description: 'Uygulamanın görüntüleme dilini seçin.',
      select: 'Bir dil seçin',
    },
    theme: {
      title: "Görüntüleme Modu",
      description: "Açık ve koyu tema arasında seçim yapın."
    },
    clearHistory: {
      button: 'Geçmişimi sil',
      dialog: {
        title: 'Kesinlikle emin misiniz?',
        description: 'Bu eylem geri alınamaz. Tüm oturum verileriniz ve hap geçmişiniz kalıcı olarak silinecektir.',
        confirm: 'Evet, verilerimi sil',
      },
    },
  },
  logDoseDialog: {
    initial: {
      title: 'Seansınızı başlatın',
      description: '2 hapla başlayacaksınız. İlk dozunuzu ne zaman aldığınızı onaylayın.',
    },
    regular: {
      title: 'Dozunuzu kaydedin',
      description: 'Hapınızı ne zaman aldığınızı onaylayın.',
    },
    missed: {
      title: 'Kaçırılan doz',
      description: 'Görünüşe göre bir dozu kaçırdınız. Durumunuzu güncellemek için bir seçenek seçin.',
      earlier: '1 hapı daha önce aldım',
      restart: '2 hapla yeniden başlat',
    },
    picker: {
      description: '{count} hapın alınma tarihini ve saatini seçin.',
      confirm: 'Saati onayla',
    },
    pills: {
      earlier: '{count} hapı daha önce aldım',
      now: '{count} hapı şimdi aldım',
    },
  },
  doseHistory: {
    title: 'Kayıt defteri',
    description: 'Son 90 gündeki etkinlikleriniz.',
    event: {
      start: 'Seans başlatıldı',
      dose: 'Hap alındı',
      stop: 'Seans sona erdi',
      unknown: 'Bilinmeyen etkinlik',
    },
    empty: {
      title: 'Hiçbir etkinlik kaydedilmedi.',
      subtitle: 'Başlamak için bir seans başlatın.',
    },
  },
  status: {
    inactive: 'Etkin değil',
    loading: 'Koruma bekleniyor...',
    effective: 'Koruma etkili',
    missed: 'Doz kaçırıldı',
    lapsed: 'Koruma sona erdi',
    ended: 'Seans sona erdi',
    loadingClient: 'Yükleniyor...',
    riskWarning: 'Koruma süresi dışında korunmasız cinsel ilişkide bulunduysanız, lütfen test yaptırın.',
  },
  protection: {
    startsIn: '{time} içinde aktif olacak',
    text: {
      lapsed: 'Bir veya daha fazla dozu kaçırdınız. Korumanız artık garanti değil.',
      lessThan3doses: '{dateTroisiemeJour} tarihine kadar dozları almaya devam ederseniz, {datePriseDemarrage} ve {dateLendemain} arasındaki ilişkileriniz korunacaktır.',
      moreThan3doses: '{dateAvantDernierePrise} öncesindeki ilişkileriniz PrEP ile korunmaktadır.',
    },
  },
  dose: {
    nextIn: 'Sonraki doz {time} içinde',
    timeLeft: 'Bir hap almak için {time} süreniz var',
    now: 'Hapınızı şimdi alın!',
  },
  dashboard: {
    logDose: 'Dozumu aldım',
    endSession: 'Seansı bitir',
    startSession: 'Yeni seans başlat',
    stopPrepInfo: 'PrEP\'i durdurmak için, son cinsel ilişkinizden sonraki 2 gün boyunca günde 1 hap almaya devam edin.',
    endSessionDialog: {
      title: 'PrEP seansını bitirilsin mi?',
      description: 'Bu, bildirim hatırlatıcılarını durduracaktır. Korumanız son dozunuza göre hesaplanacaktır.',
      confirm: 'Evet, bitir',
    },
  },
  session: {
    end: {
      toast: {
        title: 'Seans sona erdi',
        description: 'Bildirim hatırlatıcıları şimdi durduruldu.',
      },
    },
    clear: {
      toast: {
        dev: 'Test verileri yeniden yüklendi',
        title: 'Veriler temizlendi',
        description: 'Geçmişiniz ve tercihleriniz silindi.',
      },
    },
  },
  notifications: {
    toast: {
      unsupported: 'Tarayıcı uyumlu değil',
      denied: {
        title: 'Bildirimler reddedildi',
        description: 'Tarayıcı ayarlarınızdan yeniden etkinleştirebilirsiniz.',
      },
      configError: {
        title: 'Yapılandırma hatası',
        description: 'Bildirim anahtarı eksik.',
      },
      enabled: 'Bildirimler etkinleştirildi!',
      tokenError: 'Token alınamadı',
      subscriptionError: 'Abonelik hatası',
      disabled: 'Bildirimler devre dışı bırakıldı.',
      unsubscribeError: 'Abonelikten çıkarken hata oluştu',
    },
  },
} as const;
