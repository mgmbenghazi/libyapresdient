// بنك الأحداث العشوائية - كل حدث: عنوان، وصف، فئة، احتمالية شهرية، خيارات استجابة (أو تأثير تلقائي)
const EVENTS = [
  // اقتصادية
  {
    id: 'oil_price_spike', category: 'economic', title: 'ارتفاع مفاجئ في أسعار النفط العالمية',
    description: 'شهدت أسواق النفط العالمية ارتفاعاً حاداً بسبب توترات جيوسياسية في منطقة أخرى من العالم.',
    weight: 6, minMonth: 2,
    options: [
      { label: 'استغلال الفرصة لزيادة الصادرات', immediate: { budgetBalance: 8, treasury: 5000, forexReserves: 6000 } },
      { label: 'الادخار الحذر في صندوق سيادي', immediate: { treasury: 3000, forexReserves: 4000, economicDevelopment: 2 } }
    ]
  },
  {
    id: 'oil_price_crash', severity: 'crisis', category: 'economic', title: 'انهيار أسعار النفط العالمية',
    description: 'تراجعت أسعار النفط العالمية بشكل حاد نتيجة تباطؤ الطلب العالمي، مما يهدد الإيرادات الرئيسية للدولة.',
    weight: 6, minMonth: 2,
    options: [
      { label: 'خفض النفقات فوراً لمواجهة الصدمة', immediate: { budgetBalance: 3, satisfaction: -3, treasury: -2000 } },
      { label: 'استخدام الاحتياطيات لتجنب التقشف', immediate: { forexReserves: -8000, satisfaction: 1 } },
      { label: 'تحمل الصدمة دون تدخل كبير', immediate: { budgetBalance: -10, treasury: -6000 } }
    ]
  },
  {
    id: 'global_financial_crisis', severity: 'crisis', category: 'economic', title: 'أزمة مالية عالمية', weight: 2, minMonth: 6,
    description: 'تجتاح أزمة مالية عالمية الأسواق، مما يؤثر على الاستثمارات الأجنبية والتجارة الدولية.',
    options: [
      { label: 'تشديد الرقابة المصرفية المحلية', immediate: { budgetBalance: -2, politicalStability: 2 } },
      { label: 'طلب مساعدة من المؤسسات المالية الدولية', immediate: { forexReserves: 4000, internationalSupport: 2, publicDebt: 3 } }
    ]
  },
  {
    id: 'foreign_investment_offer', category: 'economic', title: 'عرض استثماري أجنبي كبير', weight: 5, minMonth: 3,
    description: 'تتقدم مجموعة استثمارية دولية بعرض لتمويل مشروع بنية تحتية كبير.',
    options: [
      { label: 'قبول العرض بشروطه الحالية', immediate: { treasury: 4000, infrastructureLevel: 3, internationalSupport: 2 } },
      { label: 'التفاوض على شروط أفضل', immediate: { treasury: 2000, infrastructureLevel: 1 } },
      { label: 'رفض العرض حفاظاً على السيادة الاقتصادية', immediate: { politicalStability: 1 } }
    ]
  },
  // طبيعية
  {
    id: 'flood', category: 'natural', title: 'فيضانات في المنطقة الشرقية', weight: 3, minMonth: 1,
    description: 'تسببت أمطار غزيرة في فيضانات أضرت بالبنية التحتية والمزارع في مناطق شرقية.',
    options: [
      { label: 'إعلان حالة طوارئ وتخصيص إغاثة عاجلة', immediate: { budgetBalance: -4, satisfaction: 3, infrastructureLevel: -2 } },
      { label: 'استجابة محدودة لتوفير الموارد', immediate: { satisfaction: -4, infrastructureLevel: -3 } }
    ]
  },
  {
    id: 'drought', category: 'natural', title: 'موجة جفاف تضرب المناطق الزراعية', weight: 3, minMonth: 3,
    description: 'يعاني المزارعون من نقص حاد في المياه بسبب موجة جفاف طويلة.',
    options: [
      { label: 'دعم المزارعين وتوفير مصادر مياه بديلة', immediate: { budgetBalance: -3, satisfaction: 2 } },
      { label: 'ترك الأمر للتكيف الطبيعي', immediate: { satisfaction: -3, economicDevelopment: -1 } }
    ]
  },
  {
    id: 'epidemic', severity: 'crisis', category: 'natural', title: 'تفشي وباء صحي', weight: 2, minMonth: 4,
    description: 'ظهرت حالات مرضية معدية في إحدى المدن الكبرى وتنتشر بسرعة.',
    options: [
      { label: 'فرض إجراءات صحية صارمة وحجر جزئي', immediate: { healthLevel: 2, satisfaction: -5, budgetBalance: -3, economicDevelopment: -2 } },
      { label: 'حملة توعية وعلاج دون إغلاق', immediate: { healthLevel: -1, budgetBalance: -2, satisfaction: 1 } }
    ]
  },
  // سياسية وأمنية
  {
    id: 'neighbor_coup', category: 'political', title: 'انقلاب في دولة مجاورة', weight: 3, minMonth: 5,
    description: 'وقع انقلاب عسكري في إحدى دول الجوار، مما يثير قلقاً بشأن الاستقرار الإقليمي.',
    options: [
      { label: 'الاعتراف بالحكومة الجديدة والحفاظ على العلاقات', immediate: { internationalSupport: -1 } },
      { label: 'إدانة الانقلاب والمطالبة بعودة الشرعية', immediate: { internationalSupport: 2, security: -2 } },
      { label: 'اتخاذ موقف حيادي', immediate: {} }
    ]
  },
  {
    id: 'terror_attack', severity: 'crisis', category: 'security', title: 'هجوم إرهابي على منشأة حكومية', weight: 3, minMonth: 3,
    description: 'استهدف هجوم مسلح منشأة حكومية مما أسفر عن خسائر وأثار قلقاً أمنياً واسعاً.',
    options: [
      { label: 'حملة أمنية فورية وشاملة', immediate: { security: 4, budgetBalance: -4, satisfaction: -2 } },
      { label: 'تحقيق هادئ وتعزيز الاستخبارات', immediate: { security: 2, politicalStability: 1 } }
    ]
  },
  {
    id: 'tribal_clash', severity: 'crisis', category: 'security', title: 'اشتباكات قبلية في الجنوب', weight: 3, minMonth: 2,
    description: 'اندلعت اشتباكات مسلحة بين قبيلتين في منطقة فزان بسبب نزاع على موارد.',
    options: [
      { label: 'إرسال وسطاء ومجلس حكماء للمصالحة', immediate: { politicalStability: 2, budgetBalance: -1 } },
      { label: 'التدخل العسكري لفرض الأمن', immediate: { security: 1, politicalStability: -3, satisfaction: -2 } }
    ]
  },
  {
    id: 'protests', severity: 'crisis', category: 'political', title: 'مظاهرات شعبية في العاصمة', weight: 4,
    description: 'خرجت مظاهرات حاشدة في طرابلس للمطالبة بتحسين الخدمات ومحاربة الفساد.',
    condition: (s) => s.indicators.satisfaction < 40,
    options: [
      { label: 'الاستماع للمطالب والوعد بإصلاحات', immediate: { satisfaction: 4, politicalStability: 1 } },
      { label: 'فض المظاهرات بالقوة', immediate: { satisfaction: -8, politicalStability: -4, security: 2 } },
      { label: 'تجاهل المظاهرات', immediate: { satisfaction: -3 } }
    ]
  },
  // دولية
  {
    id: 'international_sanctions_threat', category: 'international', title: 'تهديد بفرض عقوبات دولية', weight: 2, minMonth: 8,
    description: 'تلوح قوى دولية بفرض عقوبات اقتصادية بسبب انتقادات لسياسات حكومتك.',
    options: [
      { label: 'تقديم تنازلات لتجنب العقوبات', immediate: { internationalSupport: 4, politicalStability: -2 } },
      { label: 'رفض الانصياع للضغوط', immediate: { internationalSupport: -6, politicalStability: 3 } }
    ]
  },
  {
    id: 'un_aid_offer', category: 'international', title: 'عرض مساعدات إنسانية من الأمم المتحدة', weight: 5,
    description: 'تعرض الأمم المتحدة حزمة مساعدات إنسانية وتنموية لدعم القطاعات الأساسية.',
    options: [
      { label: 'قبول المساعدات كاملة', immediate: { treasury: 2500, satisfaction: 2, internationalSupport: 2 } },
      { label: 'قبول جزئي مع شروط وطنية', immediate: { treasury: 1200, internationalSupport: 1 } }
    ]
  },
  {
    id: 'migration_crisis', category: 'international', title: 'تصاعد أزمة الهجرة غير الشرعية', weight: 4, minMonth: 4,
    description: 'يتزايد عدد المهاجرين غير الشرعيين العابرين عبر السواحل الليبية، مما يثير ضغوطاً أوروبية.',
    options: [
      { label: 'تشديد الرقابة الساحلية بدعم أوروبي', immediate: { security: 2, internationalSupport: 3, budgetBalance: -2 } },
      { label: 'التعامل الإنساني مع تحسين مراكز الإيواء', immediate: { budgetBalance: -3, internationalSupport: 2, satisfaction: 1 } },
      { label: 'تقليل الاهتمام بالملف', immediate: { internationalSupport: -3 } }
    ]
  },
  {
    id: 'regional_conference', category: 'international', title: 'دعوة لمؤتمر إقليمي مهم', weight: 4,
    description: 'تدعوك دولة كبرى لحضور مؤتمر إقليمي لبحث قضايا التعاون الاقتصادي والأمني.',
    options: [
      { label: 'المشاركة الفاعلة وطرح مبادرات ليبية', immediate: { internationalSupport: 4 } },
      { label: 'المشاركة الرمزية فقط', immediate: { internationalSupport: 1 } },
      { label: 'الاعتذار عن الحضور', immediate: { internationalSupport: -2 } }
    ]
  },
  // فرص
  {
    id: 'new_field_discovery', category: 'economic', title: 'اكتشاف حقل نفطي جديد', weight: 2, minMonth: 6,
    description: 'أعلنت فرق التنقيب عن اكتشاف حقل نفطي جديد واعد في الجنوب الليبي.',
    options: [
      { label: 'الإسراع في تطوير الحقل', immediate: { budgetBalance: -3, oilProduction: 60 }, },
      { label: 'دراسة الجدوى بعناية قبل التطوير', immediate: { oilProduction: 20 } }
    ]
  },
  {
    id: 'youth_initiative', category: 'social', title: 'مبادرة شبابية للابتكار والتشغيل', weight: 4,
    description: 'تقدم مجموعة من الشباب الليبي مبادرة لإنشاء حاضنة أعمال وطنية.',
    options: [
      { label: 'دعم المبادرة حكومياً بالكامل', immediate: { budgetBalance: -2, satisfaction: 3, unemployment: -1 } },
      { label: 'دعم رمزي ومعنوي فقط', immediate: { satisfaction: 1 } }
    ]
  },

  // ------- قطاعات جديدة -------
  {
    id: 'tourism_boom', category: 'economic', title: 'إقبال سياحي غير متوقع', weight: 3, minMonth: 8,
    description: 'شهدت المواقع الأثرية الليبية تغطية إعلامية دولية إيجابية أدت لإقبال سياحي مفاجئ.',
    options: [
      { label: 'استثمار سريع لتوسيع الطاقة الاستيعابية', immediate: { budgetBalance: -2, tourismLevel: 4 } },
      { label: 'ترك السوق يتكيف تدريجياً دون تدخل', immediate: { tourismLevel: 2 } }
    ]
  },
  {
    id: 'industrial_accident', category: 'economic', title: 'حادث صناعي في منطقة صناعية', weight: 2, minMonth: 10,
    description: 'وقع حادث سلامة في أحد المصانع أسفر عن إصابات وأثار تساؤلات حول معايير السلامة.',
    options: [
      { label: 'تحقيق فوري وتشديد معايير السلامة', immediate: { industryLevel: -1, satisfaction: 2, budgetBalance: -1 } },
      { label: 'تعويض المتضررين دون تغيير الأنظمة', immediate: { satisfaction: -2, budgetBalance: -1 } }
    ]
  },
  {
    id: 'trade_dispute', category: 'international', title: 'نزاع تجاري مع دولة جوار', weight: 3, minMonth: 6,
    description: 'أغلقت إحدى دول الجوار معبراً حدودياً مؤقتاً احتجاجاً على سياسات تجارية ليبية.',
    options: [
      { label: 'التفاوض الدبلوماسي السريع لإعادة فتح المعبر', immediate: { internationalSupport: 2, tradeBalance: 1 } },
      { label: 'الرد بإجراءات مقابلة على الحدود', immediate: { internationalSupport: -4, tradeBalance: -3 } }
    ]
  },
  {
    id: 'agricultural_pest', category: 'natural', title: 'انتشار آفة زراعية', weight: 2, minMonth: 5,
    description: 'انتشرت آفة زراعية في مناطق زراعية رئيسية مهددة بموسم الحصاد.',
    options: [
      { label: 'حملة مكافحة عاجلة بدعم حكومي', immediate: { budgetBalance: -2, agricultureLevel: 1 } },
      { label: 'ترك المزارعين يتعاملون مع الأزمة بأنفسهم', immediate: { agricultureLevel: -4, satisfaction: -2 } }
    ]
  },
  {
    id: 'mineral_discovery', category: 'economic', title: 'اكتشاف احتياطي معدني واعد', weight: 2, minMonth: 10,
    description: 'كشفت مسوحات جيولوجية عن احتياطي واعد من المعادن في منطقة نائية.',
    options: [
      { label: 'الإسراع في منح تراخيص استكشاف', immediate: { industryLevel: 2, internationalSupport: 1 } },
      { label: 'دراسة الجدوى البيئية أولاً', immediate: { industryLevel: 1 } }
    ]
  },
  {
    id: 'remittance_surge', category: 'economic', title: 'ارتفاع تحويلات المغتربين', weight: 3, minMonth: 4,
    description: 'سجلت تحويلات الليبيين المغتربين ارتفاعاً ملحوظاً هذا الموسم.',
    options: [
      { label: 'تسهيل قنوات التحويل الرسمية', immediate: { forexReserves: 3000, tradeBalance: 1 } },
      { label: 'عدم اتخاذ إجراء خاص', immediate: { forexReserves: 1200 } }
    ]
  },
  {
    id: 'corruption_scandal', category: 'political', title: 'فضيحة فساد في صفقة حكومية', weight: 3, minMonth: 6,
    description: 'كشف تحقيق صحفي عن شبهات فساد في إحدى الصفقات الحكومية الكبرى.',
    options: [
      { label: 'فتح تحقيق علني ومحاسبة المتورطين', immediate: { satisfaction: 3, politicalStability: -2 } },
      { label: 'التعامل مع الملف بهدوء دون ضجة إعلامية', immediate: { satisfaction: -5, internationalSupport: -2 } }
    ]
  },
  {
    id: 'cyber_attack', severity: 'crisis', category: 'security', title: 'هجوم إلكتروني على بنية تحتية حكومية', weight: 2, minMonth: 16,
    description: 'تعرضت أنظمة حكومية رقمية لهجوم إلكتروني أدى لتعطل مؤقت في بعض الخدمات.',
    options: [
      { label: 'استثمار عاجل في الأمن السيبراني', immediate: { budgetBalance: -2, infrastructureLevel: 1, security: 2 } },
      { label: 'إصلاح الأضرار دون استثمار إضافي', immediate: { infrastructureLevel: -2 } }
    ]
  },
  {
    id: 'cultural_festival_success', category: 'social', title: 'نجاح مهرجان ثقافي وطني', weight: 3, minMonth: 12,
    description: 'حقق مهرجان ثقافي وطني نجاحاً لافتاً وتفاعلاً إعلامياً إيجابياً واسعاً.',
    options: [
      { label: 'توسيع المهرجان ليصبح حدثاً سنوياً دولياً', immediate: { tourismLevel: 2, satisfaction: 2, internationalSupport: 1 } },
      { label: 'الاكتفاء بالنجاح الحالي دون توسع', immediate: { satisfaction: 1 } }
    ]
  },
  {
    id: 'diaspora_conference', category: 'international', title: 'مؤتمر الليبيين المغتربين', weight: 2, minMonth: 14,
    description: 'يقترح مستشاروك تنظيم مؤتمر دولي لجذب استثمارات وخبرات الليبيين المقيمين بالخارج.',
    options: [
      { label: 'تنظيم مؤتمر كبير بدعوة استثمارية مباشرة', immediate: { budgetBalance: -1, forexReserves: 2500, internationalSupport: 2 } },
      { label: 'الاكتفاء بمبادرات تواصل رقمية محدودة', immediate: { internationalSupport: 1 } }
    ]
  },

  // ------- أحداث نتيجة إهمال الوضع السياسي الداخلي أو الدولي - تمنح شبكة العلاقات ثمناً حقيقياً -------
  {
    id: 'tribal_unrest', severity: 'crisis', category: 'security', title: 'اضطرابات في مناطق {target}', weight: 5, minMonth: 3,
    description: 'بلغ استياء قبيلة {target} من تجاهل مطالبها حداً دفع شبابها للخروج في احتجاجات غاضبة وقطع طرق رئيسية في مناطق نفوذها.',
    dynamicTarget: 'lowestTribeLoyalty',
    cooldown: 8,
    options: [
      { label: 'إيفاد وفد مصالحة فوري وتلبية بعض المطالب', immediate: { budgetBalance: -2, security: -1 }, relationsEffect: { type: 'tribe', delta: 18 } },
      { label: 'حملة أمنية لفتح الطرق وفرض النظام', immediate: { security: 2, satisfaction: -3 }, relationsEffect: { type: 'tribe', delta: -10 } },
      { label: 'تجاهل الاحتجاجات باعتبارها مؤقتة', immediate: { satisfaction: -2 }, relationsEffect: { type: 'tribe', delta: -6 } }
    ]
  },
  {
    id: 'institution_legitimacy_crisis', severity: 'crisis', category: 'political', title: 'أزمة ثقة في {target}', weight: 3, minMonth: 6,
    description: 'تصاعدت الانتقادات الموجهة إلى {target} بعد سلسلة قرارات مثيرة للجدل، وسط دعوات لإصلاحها أو حتى حلّها بالكامل.',
    dynamicTarget: 'lowestInstitutionLegitimacy',
    cooldown: 10,
    options: [
      { label: 'إطلاق مراجعة إصلاحية شفافة للمؤسسة', immediate: { budgetBalance: -2, politicalStability: 2 }, relationsEffect: { type: 'institution', delta: 15 } },
      { label: 'تغيير قيادة المؤسسة دون إصلاح هيكلي', immediate: {}, relationsEffect: { type: 'institution', delta: 6 } },
      { label: 'الدفاع عن المؤسسة دون تغيير', immediate: { satisfaction: -2 }, relationsEffect: { type: 'institution', delta: -8 } }
    ]
  },
  {
    id: 'party_walkout', severity: 'crisis', category: 'political', title: 'انسحاب تيار "{target}" من التوافق الحكومي', weight: 3, minMonth: 5,
    description: 'أعلن قادة تيار "{target}" انسحابهم من دعم الحكومة احتجاجاً على تهميشهم في القرارات الأخيرة، في خطوة تنذر بأزمة سياسية أوسع.',
    dynamicTarget: 'lowestPartySupport',
    cooldown: 10,
    options: [
      { label: 'مفاوضات عاجلة لاحتواء الانسحاب', immediate: { politicalStability: -1 }, relationsEffect: { type: 'party', delta: 16 } },
      { label: 'المضي قدماً بدون هذا التيار', immediate: { politicalStability: -4 }, relationsEffect: { type: 'party', delta: -5 } }
    ]
  }
];
