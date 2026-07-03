// بنك القرارات - كل قرار: عنوان، وصف، فئة، نوع، خيارات بتأثيرات فورية/متوسطة/طويلة المدى
// أنواع القرارات: strategic (استراتيجي), tactical (تكتيكي), emergency (طارئ), diplomatic (دبلوماسي)
const DECISIONS = [
  {
    id: 'subsidy_reform', category: 'economic', type: 'strategic', title: 'إصلاح نظام الدعم',
    description: 'يستهلك دعم السلع الأساسية والوقود جزءاً كبيراً من الميزانية العامة. مستشاروك يرون أن الإصلاح بات ضرورياً، لكن الطريقة تحدد ردة فعل الشارع.',
    minMonth: 1, oneTime: true,
    options: [
      { label: 'الإبقاء على النظام الحالي', advisor: 'المستشار الاقتصادي: نزيف مستمر للميزانية لكنه آمن سياسياً.',
        immediate: { budgetBalance: -3, satisfaction: 1 }, medium: { publicDebt: 2 }, long: {} },
      { label: 'رفع الدعم تدريجياً', advisor: 'المستشار الاقتصادي: خيار متوازن يخفف الصدمة الشعبية.',
        immediate: { budgetBalance: 4, satisfaction: -4, inflation: 2 }, medium: { budgetBalance: 3, economicDevelopment: 3 }, long: { publicDebt: -4 } },
      { label: 'رفع الدعم مع دعم نقدي مباشر للفقراء', advisor: 'المستشار السياسي: الأفضل اجتماعياً رغم التكلفة الإدارية.',
        immediate: { budgetBalance: 2, satisfaction: -1, poverty: -2 }, medium: { budgetBalance: 4, poverty: -3 }, long: { economicDevelopment: 4 } },
      { label: 'إلغاء الدعم بشكل كامل ومفاجئ', advisor: 'المستشار السياسي: تحذير شديد! خطر اضطرابات شعبية واسعة.',
        immediate: { budgetBalance: 10, satisfaction: -14, politicalStability: -8, inflation: 5 }, medium: { satisfaction: -4 }, long: { publicDebt: -8 } }
    ]
  },
  {
    id: 'security_restructure', category: 'security', type: 'strategic', title: 'إعادة هيكلة القطاع الأمني',
    description: 'تتوزع القوة الأمنية بين الجيش والشرطة وميليشيات محلية متعددة. مستشاروك يطرحون خيارات لتوحيد المنظومة الأمنية.',
    minMonth: 1, oneTime: true,
    options: [
      { label: 'الدمج الشامل لكل الميليشيات في الجيش والشرطة', advisor: 'المستشار الأمني: طموح لكنه قد يستفز مراكز قوى.',
        immediate: { security: 6, budgetBalance: -6, politicalStability: -5 }, medium: { security: 8, politicalStability: 6 }, long: { economicDevelopment: 5 } },
      { label: 'الاستيعاب الانتقائي وتسريح الباقي', advisor: 'المستشار الأمني: أكثر واقعية، لكن المسرحون قد يتحولون لتهديد.',
        immediate: { security: 3, budgetBalance: -3 }, medium: { security: 4, politicalStability: -2 }, long: { security: 3 } },
      { label: 'التدرج الإقليمي في إعادة الهيكلة', advisor: 'المستشار السياسي: بطيء لكنه يقلل المخاطر.',
        immediate: { security: 1 }, medium: { security: 5, politicalStability: 3 }, long: { security: 6 } },
      { label: 'نموذج فيدرالي بقوات أمن إقليمية تحت إشراف مركزي', advisor: 'المستشار السياسي: يرضي الأطراف الإقليمية لكنه يضعف المركزية.',
        immediate: { politicalStability: 4, security: -2 }, medium: { security: 2 }, long: { politicalStability: 5 } }
    ]
  },
  {
    id: 'economic_diversification', category: 'economic', type: 'strategic', title: 'استراتيجية تنويع الاقتصاد',
    description: 'الاعتماد شبه الكلي على النفط يجعل الاقتصاد هشاً أمام تقلبات الأسعار العالمية. حان وقت اختيار مسار التنويع.',
    minMonth: 1, oneTime: true,
    options: [
      { label: 'التصنيع - الاستثمار في الصناعات التحويلية', advisor: 'المستشار الاقتصادي: يخلق وظائف لكنه يحتاج بنية تحتية قوية.',
        immediate: { budgetBalance: -5, economicDevelopment: 2 }, medium: { unemployment: -3, economicDevelopment: 5 }, long: { gdpGrowth: 2 } },
      { label: 'السياحة - تطوير السياحة التاريخية والصحراوية', advisor: 'المستشار الاقتصادي: عوائد أسرع لكنها حساسة للأمن.',
        immediate: { budgetBalance: -3 }, medium: { economicDevelopment: 3, satisfaction: 2 }, long: { gdpGrowth: 1.5 } },
      { label: 'الخدمات المالية - تحويل ليبيا لمركز مالي إقليمي', advisor: 'المستشار الاقتصادي: طموح كبير يتطلب استقراراً طويل الأمد.',
        immediate: { budgetBalance: -4, internationalSupport: 2 }, medium: { economicDevelopment: 2 }, long: { gdpGrowth: 2.5, economicDevelopment: 6 } },
      { label: 'الطاقة المتجددة - الاستثمار في الشمس والرياح', advisor: 'المستشار الاقتصادي: استثمار مستقبلي واعد بيئياً واقتصادياً.',
        immediate: { budgetBalance: -4 }, medium: { infrastructureLevel: 3, economicDevelopment: 3 }, long: { gdpGrowth: 2, economicDevelopment: 5 } }
    ]
  },
  {
    id: 'education_reform', category: 'social', type: 'strategic', title: 'إصلاح شامل لنظام التعليم',
    description: 'تراجعت جودة التعليم على مدى سنوات. الفرصة سانحة لإطلاق استراتيجية إصلاح شاملة.',
    minMonth: 1, oneTime: true,
    options: [
      { label: 'إصلاح المناهج وطرق التدريس', advisor: 'مستشار التعليم: نتائج تظهر بعد سنوات لكنها جذرية.',
        immediate: { budgetBalance: -2 }, medium: { educationLevel: 4 }, long: { educationLevel: 8, economicDevelopment: 3 } },
      { label: 'تطوير وتدريب المعلمين', advisor: 'مستشار التعليم: استثمار مباشر في جودة التعليم اليومية.',
        immediate: { budgetBalance: -2, satisfaction: 1 }, medium: { educationLevel: 5 }, long: { educationLevel: 6 } },
      { label: 'تحسين البنية التحتية للمدارس', advisor: 'مستشار البنية التحتية: مرئي وملموس للمواطنين بسرعة.',
        immediate: { budgetBalance: -4, satisfaction: 3 }, medium: { educationLevel: 3, infrastructureLevel: 2 }, long: { educationLevel: 4 } },
      { label: 'التركيز على التعليم المهني والتقني', advisor: 'المستشار الاقتصادي: يربط التعليم مباشرة بسوق العمل.',
        immediate: { budgetBalance: -3 }, medium: { unemployment: -2, educationLevel: 2 }, long: { unemployment: -4, economicDevelopment: 3 } }
    ]
  },
  {
    id: 'deficit_management', category: 'economic', type: 'tactical', title: 'إدارة عجز الميزانية',
    description: 'سجلت الميزانية عجزاً هذا العام يتطلب قراراً عاجلاً بشأن كيفية تغطيته.',
    condition: (s) => s.indicators.budgetBalance < -8,
    cooldown: 12,
    options: [
      { label: 'خفض الإنفاق الحكومي', advisor: 'المستشار الاقتصادي: يحسن الميزانية لكنه يضر بالخدمات.',
        immediate: { budgetBalance: 6, satisfaction: -3, infrastructureLevel: -1 }, medium: {}, long: {} },
      { label: 'زيادة الإيرادات الضريبية', advisor: 'المستشار الاقتصادي: عادل نسبياً لكنه يثير القطاع الخاص.',
        immediate: { budgetBalance: 5, satisfaction: -2, economicDevelopment: -1 }, medium: {}, long: {} },
      { label: 'الاقتراض الداخلي أو الخارجي', advisor: 'المستشار الاقتصادي: حل سريع لكنه يراكم الديون.',
        immediate: { budgetBalance: 8, publicDebt: 5 }, medium: { publicDebt: 3 }, long: {} },
      { label: 'استخدام الاحتياطيات النقدية', advisor: 'المستشار الاقتصادي: يحل المشكلة الآن لكنه يضعف الحماية المستقبلية.',
        immediate: { budgetBalance: 7, forexReserves: -8000 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'public_salaries', category: 'economic', type: 'tactical', title: 'سياسة الرواتب في القطاع العام',
    description: 'يطالب موظفو القطاع العام بمراجعة الرواتب في ظل ارتفاع الأسعار.',
    minMonth: 6, cooldown: 12,
    options: [
      { label: 'زيادة الرواتب بنسبة تفوق التضخم', advisor: 'المستشار الاقتصادي: يرضي الموظفين لكنه يضغط على الميزانية والتضخم.',
        immediate: { satisfaction: 5, budgetBalance: -6, inflation: 3 }, medium: {}, long: {} },
      { label: 'زيادة تتناسب مع التضخم فقط', advisor: 'المستشار الاقتصادي: متوازن ومعقول.',
        immediate: { satisfaction: 2, budgetBalance: -3 }, medium: {}, long: {} },
      { label: 'تجميد الرواتب مع حوافز إنتاجية', advisor: 'المستشار الاقتصادي: يحافظ على الميزانية لكنه غير شعبي.',
        immediate: { satisfaction: -3, budgetBalance: 1, economicDevelopment: 1 }, medium: {}, long: {} },
      { label: 'تخفيض عدد الموظفين وزيادة رواتب الباقين', advisor: 'المستشار السياسي: خطر اجتماعي كبير رغم الفائدة المالية.',
        immediate: { satisfaction: -6, budgetBalance: 3, unemployment: 3 }, medium: {}, long: { budgetBalance: 2 } }
    ]
  },
  {
    id: 'oil_investment', category: 'economic', type: 'strategic', title: 'تطوير قطاع النفط',
    description: 'تحتاج حقول النفط استثمارات لرفع الإنتاج والحفاظ على الإيرادات الرئيسية للدولة.',
    minMonth: 1, cooldown: 18,
    options: [
      { label: 'استثمار حكومي مباشر في الحقول', advisor: 'وزير النفط: يبقي العوائد للدولة لكنه يستنزف الخزينة.',
        immediate: { budgetBalance: -8, treasury: -4000 }, medium: { oilProduction: 100 }, long: { oilProduction: 150, budgetBalance: 5 } },
      { label: 'جذب شركات نفط عالمية بعقود شراكة', advisor: 'وزير النفط: أسرع تنفيذاً لكن بحصة أقل من العوائد.',
        immediate: { internationalSupport: 3 }, medium: { oilProduction: 120 }, long: { oilProduction: 100, budgetBalance: 3 } },
      { label: 'شراكة بين القطاعين العام والخاص', advisor: 'وزير النفط: توازن جيد بين المخاطرة والعائد.',
        immediate: { budgetBalance: -3 }, medium: { oilProduction: 80 }, long: { oilProduction: 100, budgetBalance: 4 } },
      { label: 'التركيز أولاً على تطوير الكوادر المحلية', advisor: 'وزير النفط: استثمار بشري طويل الأمد يقلل الاعتماد على الأجانب.',
        immediate: { budgetBalance: -2, educationLevel: 1 }, medium: { oilProduction: 30 }, long: { oilProduction: 60, economicDevelopment: 3 } }
    ]
  },
  {
    id: 'housing_program', category: 'social', type: 'tactical', title: 'برنامج الإسكان الاجتماعي',
    description: 'أزمة سكن متفاقمة في المدن الكبرى تدفع بعض المواطنين للمطالبة ببرنامج إسكان حكومي.',
    minMonth: 3, cooldown: 12,
    options: [
      { label: 'إطلاق برنامج إسكان اجتماعي واسع', advisor: 'مستشار البنية التحتية: مكلف لكنه يخفف الضغط الاجتماعي بشكل كبير.',
        immediate: { budgetBalance: -7, satisfaction: 5 }, medium: { poverty: -3, infrastructureLevel: 2 }, long: {} },
      { label: 'تسهيلات تمويل عقاري للقطاع الخاص', advisor: 'المستشار الاقتصادي: أقل تكلفة على الدولة، أبطأ في النتائج.',
        immediate: { budgetBalance: -2 }, medium: { satisfaction: 2, economicDevelopment: 1 }, long: {} },
      { label: 'تأجيل المشروع لأولويات أخرى', advisor: 'المستشار السياسي: يوفر المال لكنه يراكم الاستياء الشعبي.',
        immediate: { satisfaction: -3 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'health_investment', category: 'social', type: 'tactical', title: 'تطوير القطاع الصحي',
    description: 'تعاني المستشفيات العامة من نقص التجهيزات والكوادر الطبية المدربة.',
    minMonth: 3, cooldown: 12,
    options: [
      { label: 'بناء مستشفيات ومراكز صحية جديدة', advisor: 'مستشار الصحة: أثر كبير وملموس لكنه مكلف.',
        immediate: { budgetBalance: -6, satisfaction: 3 }, medium: { healthLevel: 5 }, long: { healthLevel: 4 } },
      { label: 'استيراد أدوية وتجهيزات طبية', advisor: 'مستشار الصحة: حل سريع لتحسين الخدمة الحالية.',
        immediate: { budgetBalance: -3, satisfaction: 2 }, medium: { healthLevel: 3 }, long: {} },
      { label: 'برنامج تدريب وتوظيف كوادر طبية', advisor: 'مستشار الصحة: استثمار بشري مستدام على المدى الطويل.',
        immediate: { budgetBalance: -2 }, medium: { healthLevel: 2, unemployment: -1 }, long: { healthLevel: 5 } }
    ]
  },
  {
    id: 'tax_system', category: 'economic', type: 'tactical', title: 'مراجعة النظام الضريبي',
    description: 'يرى مستشاروك أن النظام الضريبي الحالي غير فعال في تحصيل الإيرادات.',
    minMonth: 8, cooldown: 12,
    options: [
      { label: 'رفع الضرائب على الشركات الكبرى', advisor: 'المستشار الاقتصادي: يرفع الإيرادات دون التأثير المباشر على المواطن العادي.',
        immediate: { budgetBalance: 5, economicDevelopment: -1 }, medium: {}, long: {} },
      { label: 'تبسيط الإجراءات الضريبية ومكافحة التهرب', advisor: 'المستشار الاقتصادي: يحسن التحصيل بدون رفع النسب.',
        immediate: { budgetBalance: 2 }, medium: { budgetBalance: 3 }, long: {} },
      { label: 'الإبقاء على النظام الحالي', advisor: 'المستشار الاقتصادي: لا تغيير، لا مخاطرة، لا تحسن.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'press_freedom', category: 'political', type: 'strategic', title: 'حرية الإعلام والصحافة',
    description: 'تتزايد الأصوات المطالبة بتوسيع هامش حرية الإعلام، بينما يحذر بعض المستشارين من المخاطر الأمنية.',
    minMonth: 4, oneTime: true,
    options: [
      { label: 'توسيع حرية الصحافة والإعلام', advisor: 'المستشار السياسي: يحسن السمعة الدولية لكنه يزيد النقد الداخلي.',
        immediate: { internationalSupport: 5, politicalStability: -3 }, medium: { satisfaction: 3 }, long: {} },
      { label: 'إبقاء قيود معقولة مع انفتاح تدريجي', advisor: 'المستشار السياسي: خيار متوازن.',
        immediate: { internationalSupport: 2 }, medium: { satisfaction: 1 }, long: {} },
      { label: 'تشديد الرقابة الإعلامية', advisor: 'المستشار الأمني: يحمي الاستقرار قصير المدى بكلفة السمعة الدولية.',
        immediate: { politicalStability: 4, internationalSupport: -6, satisfaction: -3 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'elections_decision', category: 'political', type: 'strategic', title: 'الدعوة إلى انتخابات',
    description: 'تتصاعد المطالب الداخلية والدولية بالدعوة لانتخابات برلمانية جديدة.',
    minMonth: 12, oneTime: true,
    options: [
      { label: 'الدعوة لانتخابات فورية', advisor: 'المستشار السياسي: يعزز الشرعية لكنه يحمل مخاطر عدم اليقين.',
        immediate: { politicalStability: -4, internationalSupport: 6 }, medium: { politicalStability: 8, satisfaction: 4 }, long: {} },
      { label: 'تأجيل الانتخابات لحين استقرار الأوضاع', advisor: 'المستشار الأمني: أكثر أماناً لكنه يثير شكوكاً حول النوايا.',
        immediate: { internationalSupport: -4 }, medium: { politicalStability: 2 }, long: {} },
      { label: 'انتخابات محلية أولاً كخطوة تدريجية', advisor: 'المستشار السياسي: مسار وسطي حذر.',
        immediate: { politicalStability: 1, satisfaction: 2 }, medium: { politicalStability: 3 }, long: {} }
    ]
  },
  {
    id: 'tribal_relations', category: 'political', type: 'tactical', title: 'إدارة العلاقات مع القبائل',
    description: 'تطالب بعض زعامات القبائل الكبرى بمزيد من التمثيل والموارد لمناطقها.',
    minMonth: 2, cooldown: 10,
    options: [
      { label: 'عقد مؤتمر مصالحة قبلية شامل', advisor: 'المستشار السياسي: يبني ثقة طويلة الأمد.',
        immediate: { budgetBalance: -2, politicalStability: 4 }, medium: { politicalStability: 3 }, long: {} },
      { label: 'زيادة تخصيصات التنمية للمناطق القبلية', advisor: 'المستشار الاقتصادي: مكلف لكنه فعّال.',
        immediate: { budgetBalance: -4, satisfaction: 3 }, medium: { politicalStability: 3 }, long: {} },
      { label: 'تجاهل المطالب حالياً', advisor: 'المستشار السياسي: خطر تصاعد التوتر القبلي.',
        immediate: { politicalStability: -5 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'border_security', category: 'security', type: 'tactical', title: 'تأمين الحدود الجنوبية',
    description: 'تقارير أمنية تشير إلى تزايد أنشطة التهريب والهجرة غير الشرعية عبر الحدود الجنوبية.',
    minMonth: 3, cooldown: 10,
    options: [
      { label: 'نشر قوات إضافية على الحدود', advisor: 'المستشار الأمني: يحسن الأمن لكنه مكلف.',
        immediate: { budgetBalance: -4, security: 5 }, medium: {}, long: {} },
      { label: 'تعاون أمني مع دول الجوار', advisor: 'المستشار الدبلوماسي: أقل كلفة ويحسن العلاقات الإقليمية.',
        immediate: { security: 3, internationalSupport: 3 }, medium: {}, long: {} },
      { label: 'الاستثمار في تقنيات المراقبة الحدودية', advisor: 'المستشار الأمني: حل مستدام يحتاج وقتاً لينضج.',
        immediate: { budgetBalance: -5 }, medium: { security: 6 }, long: { security: 4 } }
    ]
  },
  {
    id: 'counter_terrorism', category: 'security', type: 'tactical', title: 'استراتيجية مكافحة الإرهاب',
    description: 'يطلب مستشارك الأمني تبني استراتيجية واضحة للتعامل مع خلايا متطرفة نشطة في بعض المناطق.',
    condition: (s) => s.indicators.security < 45,
    cooldown: 12,
    options: [
      { label: 'حملة عسكرية أمنية مكثفة', advisor: 'المستشار الأمني: نتائج سريعة لكن مخاطر ضحايا مدنيين وردة فعل سلبية.',
        immediate: { security: 8, budgetBalance: -5, satisfaction: -2 }, medium: { security: 3 }, long: {} },
      { label: 'برامج وقائية لمكافحة التطرف الفكري', advisor: 'مستشار الثقافة: أبطأ لكنه يعالج الجذور.',
        immediate: { budgetBalance: -3 }, medium: { security: 4 }, long: { security: 6, satisfaction: 2 } },
      { label: 'تعاون استخباراتي دولي', advisor: 'المستشار الدبلوماسي: فعال ويحسن العلاقات مع الحلفاء.',
        immediate: { security: 4, internationalSupport: 3 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'imf_negotiation', category: 'diplomatic', type: 'diplomatic', title: 'مفاوضات مع صندوق النقد الدولي',
    description: 'يعرض صندوق النقد الدولي برنامج دعم مالي مشروطاً بإصلاحات اقتصادية هيكلية.',
    condition: (s) => s.indicators.budgetBalance < -10 || s.indicators.forexReserves < 30000,
    cooldown: 18,
    options: [
      { label: 'قبول البرنامج والالتزام بالإصلاحات', advisor: 'المستشار الاقتصادي: يوفر سيولة عاجلة بكلفة سياسية.',
        immediate: { forexReserves: 15000, satisfaction: -4, internationalSupport: 5 }, medium: { budgetBalance: 3 }, long: { economicDevelopment: 3 } },
      { label: 'التفاوض على شروط أخف', advisor: 'المستشار الدبلوماسي: نتيجة وسطية تستغرق وقتاً أطول.',
        immediate: { forexReserves: 7000, internationalSupport: 2 }, medium: {}, long: {} },
      { label: 'رفض البرنامج والاعتماد على الذات', advisor: 'المستشار السياسي: يحافظ على السيادة الاقتصادية لكن يفوت فرصة سيولة.',
        immediate: { internationalSupport: -3, politicalStability: 2 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'neighbor_treaty', category: 'diplomatic', type: 'diplomatic', title: 'اتفاقية تعاون مع دولة جوار',
    description: 'تقترح إحدى دول الجوار اتفاقية تعاون اقتصادي وأمني ثنائية.',
    minMonth: 5, cooldown: 14,
    options: [
      { label: 'توقيع اتفاقية شاملة (اقتصادية وأمنية)', advisor: 'المستشار الدبلوماسي: يعزز العلاقات الثنائية بقوة.',
        immediate: { internationalSupport: 5, security: 2, economicDevelopment: 2 }, medium: {}, long: {} },
      { label: 'اتفاقية اقتصادية محدودة فقط', advisor: 'المستشار الدبلوماسي: أكثر حذراً وأقل التزاماً.',
        immediate: { internationalSupport: 2, economicDevelopment: 1 }, medium: {}, long: {} },
      { label: 'تأجيل التوقيع لمزيد من الدراسة', advisor: 'المستشار الدبلوماسي: يفوت فرصة لكنه يتجنب التزامات متسرعة.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'opec_coordination', category: 'diplomatic', type: 'diplomatic', title: 'التنسيق مع منظمة أوبك',
    description: 'تطلب أوبك التنسيق بشأن مستويات إنتاج النفط لدعم استقرار الأسعار العالمية.',
    minMonth: 6, cooldown: 12,
    options: [
      { label: 'الالتزام الكامل بحصص الإنتاج', advisor: 'وزير النفط: يعزز مكانة ليبيا الدولية لكنه يحد من الإيرادات القصوى.',
        immediate: { internationalSupport: 4, oilProduction: -50 }, medium: {}, long: { budgetBalance: 2 } },
      { label: 'التزام جزئي مع مرونة وطنية', advisor: 'وزير النفط: توازن بين المصلحة الوطنية والتضامن الدولي.',
        immediate: { internationalSupport: 1 }, medium: {}, long: {} },
      { label: 'رفع الإنتاج خارج الحصص المتفق عليها', advisor: 'وزير النفط: عوائد أعلى فوراً لكن توتر مع أعضاء أوبك.',
        immediate: { oilProduction: 100, internationalSupport: -5 }, medium: { budgetBalance: 3 }, long: {} }
    ]
  },
  {
    id: 'privatization', category: 'economic', type: 'strategic', title: 'برنامج الخصخصة',
    description: 'يقترح مستشاروك خصخصة بعض الشركات المملوكة للدولة لتحسين الكفاءة وتوفير إيرادات.',
    minMonth: 10, oneTime: true,
    options: [
      { label: 'خصخصة واسعة لعدة قطاعات', advisor: 'المستشار الاقتصادي: عائد مالي كبير لكن مخاطر بطالة واحتجاجات.',
        immediate: { treasury: 8000, satisfaction: -5, unemployment: 2 }, medium: { economicDevelopment: 4 }, long: { economicDevelopment: 3 } },
      { label: 'خصخصة جزئية وتدريجية', advisor: 'المستشار الاقتصادي: أكثر توازناً.',
        immediate: { treasury: 3000, satisfaction: -1 }, medium: { economicDevelopment: 2 }, long: {} },
      { label: 'الإبقاء على الملكية العامة الكاملة', advisor: 'المستشار السياسي: يحافظ على السلم الاجتماعي لكن يبقي الكفاءة منخفضة.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'renewable_energy_push', category: 'economic', type: 'tactical', title: 'دفعة نحو الطاقة المتجددة',
    description: 'تتوفر فرصة تمويل دولي لمشاريع الطاقة الشمسية في الجنوب الليبي.',
    minMonth: 14, cooldown: 16,
    options: [
      { label: 'قبول التمويل وإطلاق مشاريع شمسية كبرى', advisor: 'مستشار البنية التحتية: فرصة ممتازة لتنويع مصادر الطاقة.',
        immediate: { budgetBalance: -2, internationalSupport: 3 }, medium: { infrastructureLevel: 4 }, long: { economicDevelopment: 3, infrastructureLevel: 3 } },
      { label: 'مشاريع محدودة تجريبية فقط', advisor: 'مستشار البنية التحتية: خطوة حذرة أولى.',
        immediate: {}, medium: { infrastructureLevel: 1 }, long: {} },
      { label: 'رفض العرض والتركيز على النفط والغاز', advisor: 'المستشار الاقتصادي: يفوت فرصة تنويع طويلة الأمد.',
        immediate: {}, medium: {}, long: {} }
    ]
  }
];
