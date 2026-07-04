// المسار الدستوري: ثلاثة محاور لا رجعة فيها تُحسم مرة واحدة أول اللعبة، وتُقفل/تفتح قرارات وأحداث حصرية لاحقاً
const CONSTITUTION_AXES = [
  { key: 'governmentType', label: 'نظام الحكم', options: [
    { value: 'presidential', label: 'رئاسي' }, { value: 'parliamentary', label: 'برلماني' }
  ] },
  { key: 'decentralization', label: 'هيكل الدولة', options: [
    { value: 'centralized', label: 'مركزي' }, { value: 'federal', label: 'فدرالي' }
  ] },
  { key: 'stateCharacter', label: 'طابع الدولة', options: [
    { value: 'secular', label: 'علماني' }, { value: 'religious', label: 'ديني' }
  ] }
];

// بنك القرارات - كل قرار: عنوان، وصف، فئة، نوع، خيارات بتأثيرات فورية/متوسطة/طويلة المدى
// أنواع القرارات: strategic (استراتيجي), tactical (تكتيكي), emergency (طارئ), diplomatic (دبلوماسي)
const DECISIONS = [
  {
    id: 'constitution_government_type', category: 'political', type: 'strategic', title: 'صياغة الدستور: نظام الحكم',
    description: 'قبل أن تمضي في الحكم، يجب حسم شكل النظام السياسي للدولة - قرار تأسيسي لا رجعة فيه يحدد مسار الشرعية طوال فترتك.',
    pivotal: true, minMonth: 1, oneTime: true, forcedByMonth: 1,
    options: [
      { label: 'نظام رئاسي: سلطة تنفيذية مركزة بيدك', advisor: 'المستشار السياسي: قرارات أسرع، لكن الأزمات تُحاسبك أنت شخصياً دون غطاء برلماني.',
        immediate: { politicalStability: 2 }, constitutionEffect: { axis: 'governmentType', value: 'presidential' } },
      { label: 'نظام برلماني: حكومة ائتلافية مسؤولة أمام البرلمان', advisor: 'المستشار السياسي: يوزّع المسؤولية، لكن ائتلافك قد ينهار في أي أزمة.',
        immediate: { internationalSupport: 3 }, constitutionEffect: { axis: 'governmentType', value: 'parliamentary' } }
    ]
  },
  {
    id: 'constitution_decentralization', category: 'political', type: 'strategic', title: 'صياغة الدستور: هيكل الدولة',
    description: 'هل تُدار البلاد بسلطة مركزية موحدة، أم تُمنح الأقاليم صلاحيات حكم ذاتي واسعة؟ قرار لا رجعة فيه يعيد تشكيل علاقتك بالمناطق طوال حكمك.',
    pivotal: true, minMonth: 1, oneTime: true, forcedByMonth: 1,
    options: [
      { label: 'دولة مركزية موحدة القرار', advisor: 'المستشار السياسي: سيطرة أحكم على الموارد، لكن الأقاليم المهمَلة قد تنفجر غضباً دون متنفس.',
        immediate: { politicalStability: 2 }, constitutionEffect: { axis: 'decentralization', value: 'centralized' } },
      { label: 'دولة فدرالية بحكم ذاتي إقليمي واسع', advisor: 'المستشار السياسي: يمتص غضب الأطراف، لكنه يُضعف قبضتك المركزية على القرار.',
        immediate: { satisfaction: 2 }, constitutionEffect: { axis: 'decentralization', value: 'federal' } }
    ]
  },
  {
    id: 'constitution_state_character', category: 'political', type: 'strategic', title: 'صياغة الدستور: طابع الدولة',
    description: 'هل ينص الدستور على دولة علمانية تفصل الدين عن التشريع، أم دولة ذات مرجعية دينية تُشرك رجال الدين في القرار العام؟',
    pivotal: true, minMonth: 1, oneTime: true, forcedByMonth: 1,
    options: [
      { label: 'دولة علمانية: القانون المدني مرجعية التشريع', advisor: 'المستشار السياسي: يرضي التيارات الليبرالية والمجتمع الدولي، ويثير حفيظة التيار المحافظ.',
        immediate: { internationalSupport: 3 }, constitutionEffect: { axis: 'stateCharacter', value: 'secular' } },
      { label: 'دولة ذات مرجعية دينية راسخة', advisor: 'المستشار السياسي: يمنحك شرعية شعبية واسعة في أوساط محافظة، بثمن حذر دولي.',
        immediate: { satisfaction: 3 }, constitutionEffect: { axis: 'stateCharacter', value: 'religious' } }
    ]
  },
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
    description: 'تحتاج حقول النفط استثمارات لرفع الإنتاج والحفاظ على الإيرادات الرئيسية للدولة. اختيارك هنا يضبط سياسة القطاع بشكل دائم من تبويب "الاقتصاد ← القطاعات الإنتاجية"، لا أثراً لمرة واحدة فقط.',
    minMonth: 1, cooldown: 18,
    options: [
      { label: 'استثمار حكومي مباشر في الحقول', advisor: 'وزير النفط: يبقي العوائد كاملة للدولة لكن نمواً أبطأ وأكثر بيروقراطية.',
        immediate: { budgetBalance: -3, treasury: -1500 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'oil', ownership: 'state', investDelta: 6 } },
      { label: 'جذب شركات نفط عالمية بعقود شراكة', advisor: 'وزير النفط: نمو أسرع وخبرة أجنبية، لكن بحصة أقل من العوائد.',
        immediate: { internationalSupport: 3 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'oil', ownership: 'partnership', investDelta: 4 } },
      { label: 'شراكة بين القطاعين العام والخاص', advisor: 'وزير النفط: توازن جيد بين المخاطرة والعائد.',
        immediate: { budgetBalance: -1 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'oil', ownership: 'partnership', investDelta: 2 } },
      { label: 'التركيز أولاً على تطوير الكوادر المحلية', advisor: 'وزير النفط: استثمار بشري طويل الأمد يقلل الاعتماد على الأجانب.',
        immediate: { educationLevel: 2 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'oil', ownership: 'state', investDelta: 3 } }
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
    description: 'يرى مستشاروك أن النظام الضريبي الحالي غير فعال في تحصيل الإيرادات. القرار يضبط معدل ضريبة الشركات الدائم من تبويب "الاقتصاد ← السياسة الاقتصادية"، لا أثراً لمرة واحدة فقط.',
    minMonth: 8, cooldown: 12,
    options: [
      { label: 'رفع الضرائب على الشركات الكبرى', advisor: 'المستشار الاقتصادي: يرفع الإيرادات دون التأثير المباشر على المواطن العادي، لكنه يُبطئ نمو الصناعة تدريجياً.',
        immediate: {}, medium: {}, long: {}, macroPolicyEffect: { rateKey: 'corporateTaxRate', delta: 8 } },
      { label: 'تبسيط الإجراءات الضريبية ومكافحة التهرب', advisor: 'المستشار الاقتصادي: يحسن التحصيل بدون رفع النسب الرسمية.',
        immediate: { budgetBalance: 2 }, medium: { budgetBalance: 3 }, long: {} },
      { label: 'خفض الضرائب لتحفيز الاستثمار الخاص', advisor: 'المستشار الاقتصادي: يضحي بإيراد فوري مقابل نمو أسرع للقطاع الخاص.',
        immediate: {}, medium: {}, long: {}, macroPolicyEffect: { rateKey: 'corporateTaxRate', delta: -6 } }
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
    id: 'counter_terrorism', severity: 'crisis', category: 'security', type: 'tactical', title: 'استراتيجية مكافحة الإرهاب',
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
        immediate: { forexReserves: 15000, satisfaction: -4, internationalSupport: 5 }, medium: { budgetBalance: 3 }, long: { economicDevelopment: 3 },
        relationsEffect: { type: 'org', id: 'imf', delta: 18 } },
      { label: 'التفاوض على شروط أخف', advisor: 'المستشار الدبلوماسي: نتيجة وسطية تستغرق وقتاً أطول.',
        immediate: { forexReserves: 7000, internationalSupport: 2 }, medium: {}, long: {},
        relationsEffect: { type: 'org', id: 'imf', delta: 6 } },
      { label: 'رفض البرنامج والاعتماد على الذات', advisor: 'المستشار السياسي: يحافظ على السيادة الاقتصادية لكن يفوت فرصة سيولة.',
        immediate: { internationalSupport: -3, politicalStability: 2 }, medium: {}, long: {},
        relationsEffect: { type: 'org', id: 'imf', delta: -12 } }
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
        immediate: { internationalSupport: 4, oilProduction: -50 }, medium: {}, long: { budgetBalance: 2 },
        relationsEffect: { type: 'org', id: 'opec', delta: 15 } },
      { label: 'التزام جزئي مع مرونة وطنية', advisor: 'وزير النفط: توازن بين المصلحة الوطنية والتضامن الدولي.',
        immediate: { internationalSupport: 1 }, medium: {}, long: {},
        relationsEffect: { type: 'org', id: 'opec', delta: 4 } },
      { label: 'رفع الإنتاج خارج الحصص المتفق عليها', advisor: 'وزير النفط: عوائد أعلى فوراً لكن توتر مع أعضاء أوبك.',
        immediate: { oilProduction: 100, internationalSupport: -5 }, medium: { budgetBalance: 3 }, long: {},
        relationsEffect: { type: 'org', id: 'opec', delta: -18 } }
    ]
  },
  {
    id: 'un_rights_report', category: 'diplomatic', type: 'diplomatic', title: 'تقرير أممي حول أوضاع حقوق الإنسان',
    description: 'تصدر الأمم المتحدة تقريراً دورياً يقيّم أوضاع حقوق الإنسان والحريات المدنية في البلاد، ويطالب بإصلاحات محددة خلال مهلة زمنية.',
    minMonth: 7, cooldown: 14,
    options: [
      { label: 'التعاون الكامل وتنفيذ التوصيات المطلوبة', advisor: 'المستشار الدبلوماسي: يحسّن الصورة الدولية لكنه قد يواجه معارضة داخلية محافظة.',
        immediate: { internationalSupport: 4, satisfaction: -1 }, medium: {}, long: {},
        relationsEffect: { type: 'org', id: 'un', delta: 16 } },
      { label: 'قبول جزئي مع تحفظات سيادية', advisor: 'المستشار الدبلوماسي: موقف متوازن يحفظ ماء الوجه للطرفين.',
        immediate: { internationalSupport: 1 }, medium: {}, long: {},
        relationsEffect: { type: 'org', id: 'un', delta: 5 } },
      { label: 'رفض التقرير بوصفه تدخلاً في الشأن الداخلي', advisor: 'المستشار السياسي: يحافظ على السيادة لكن يثير انتقاداً دولياً واسعاً.',
        immediate: { internationalSupport: -4, politicalStability: 2 }, medium: {}, long: {},
        relationsEffect: { type: 'org', id: 'un', delta: -14 } }
    ]
  },
  {
    id: 'privatization', category: 'economic', type: 'strategic', title: 'برنامج الخصخصة',
    description: 'يقترح مستشاروك خصخصة الشركات الصناعية المملوكة للدولة لتحسين الكفاءة وتوفير إيرادات فورية. القرار يضبط نموذج ملكية القطاع الصناعي بشكل دائم.',
    minMonth: 10, oneTime: true,
    options: [
      { label: 'خصخصة واسعة لعدة قطاعات', advisor: 'المستشار الاقتصادي: عائد مالي كبير فوري لكن مخاطر بطالة واحتجاجات، وحصة أقل من عوائد الصناعة لاحقاً.',
        immediate: { treasury: 8000, satisfaction: -5, unemployment: 2 }, medium: { economicDevelopment: 2 }, long: {},
        sectorPolicyEffect: { sector: 'industry', ownership: 'privatized' } },
      { label: 'خصخصة جزئية وتدريجية', advisor: 'المستشار الاقتصادي: أكثر توازناً - شراكة بدل بيع كامل.',
        immediate: { treasury: 3000, satisfaction: -1 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'industry', ownership: 'partnership' } },
      { label: 'الإبقاء على الملكية العامة الكاملة', advisor: 'المستشار السياسي: يحافظ على السلم الاجتماعي لكن يبقي الكفاءة منخفضة.',
        immediate: {}, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'industry', ownership: 'state' } }
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
  },

  // ------- قطاعات جديدة: زراعة، سياحة، صناعة، تجارة -------
  {
    id: 'agriculture_investment', category: 'economic', type: 'tactical', title: 'الاستثمار في القطاع الزراعي',
    description: 'تعاني الأراضي الزراعية في الجبل الأخضر وسهل الجفارة وواحات فزان من ضعف الاستثمار وشبكات الري القديمة. القرار يرفع أو يخفض سطر استثمار القطاع بشكل دائم في الميزانية.',
    minMonth: 3, cooldown: 12,
    options: [
      { label: 'مشاريع استصلاح أراضٍ وري حديث واسعة', advisor: 'مستشار الزراعة: أثر كبير لكنه يحتاج تمويلاً ضخماً.',
        immediate: { budgetBalance: -5, poverty: -1 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'agriculture', investDelta: 7 } },
      { label: 'دعم المزارعين بالتقاوي والمعدات', advisor: 'مستشار الزراعة: تكلفة معقولة بنتائج متوسطة.',
        immediate: { budgetBalance: -2, satisfaction: 1 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'agriculture', investDelta: 3 } },
      { label: 'تجاهل القطاع الزراعي حالياً', advisor: 'مستشار الزراعة: استمرار الاعتماد على الاستيراد الغذائي.',
        immediate: {}, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'agriculture', investDelta: -2 } }
    ]
  },
  {
    id: 'tourism_development', category: 'economic', type: 'tactical', title: 'تطوير القطاع السياحي',
    description: 'مواقع أثرية مثل لبدة وصبراتة وشحات، إلى جانب واحات غدامس وغات، تحمل إمكانات سياحية كبيرة لم تُستغل بعد - لكن أي استثمار سياحي يبقى محدود الأثر دون أمن مستقر.',
    minMonth: 4, cooldown: 12,
    options: [
      { label: 'ترميم المواقع الأثرية وتطوير بنية سياحية متكاملة', advisor: 'مستشار السياحة: استثمار كبير بعائد متوسط المدى - رهين بمستوى الأمن الحالي.',
        immediate: { budgetBalance: -5 }, medium: {}, long: { internationalSupport: 2 },
        sectorPolicyEffect: { sector: 'tourism', investDelta: 7 } },
      { label: 'حملات ترويجية دولية محدودة التكلفة', advisor: 'مستشار السياحة: خطوة أولى منخفضة المخاطر.',
        immediate: { budgetBalance: -1 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'tourism', investDelta: 3 } },
      { label: 'تأجيل الاستثمار السياحي لحين تحسن الأمن', advisor: 'مستشار السياحة: قرار حذر لكنه يفوّت فرصاً.',
        immediate: {}, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'tourism', investDelta: -2 } }
    ]
  },
  {
    id: 'industrial_zones', category: 'economic', type: 'strategic', title: 'إنشاء مناطق صناعية متكاملة',
    description: 'يقترح مستشاروك إنشاء مناطق صناعية متكاملة لتصنيع مواد البناء والمعادن والمنسوجات وتقليل الاعتماد على الاستيراد.',
    minMonth: 8, oneTime: true,
    options: [
      { label: 'إنشاء مناطق صناعية كبرى بشراكة حكومية-خاصة', advisor: 'المستشار الاقتصادي: يخلق وظائف صناعية حقيقية.',
        immediate: { budgetBalance: -6, unemployment: -1 }, medium: {}, long: { tradeBalance: 2 },
        sectorPolicyEffect: { sector: 'industry', ownership: 'partnership', investDelta: 6 } },
      { label: 'حوافز ضريبية لمستثمرين صناعيين محليين', advisor: 'المستشار الاقتصادي: أقل تكلفة مباشرة على الخزينة.',
        immediate: { budgetBalance: -1 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'industry', investDelta: 3 } },
      { label: 'التركيز على الصناعات البتروكيماوية فقط', advisor: 'وزير النفط: يستغل الغاز الطبيعي كمادة خام رخيصة - كلما ارتفع إنتاج النفط استفادت الصناعة تلقائياً.',
        immediate: { budgetBalance: -3 }, medium: {}, long: {},
        sectorPolicyEffect: { sector: 'industry', investDelta: 4 } }
    ]
  },
  {
    id: 'trade_agreements', category: 'diplomatic', type: 'diplomatic', title: 'اتفاقيات تجارة حرة إقليمية',
    description: 'تعرض عدة دول جوار وأعضاء في اتحاد المغرب العربي توقيع اتفاقيات تجارة حرة مع ليبيا.',
    minMonth: 6, cooldown: 14,
    options: [
      { label: 'توقيع اتفاقيات تجارة حرة واسعة', advisor: 'المستشار الدبلوماسي: يفتح أسواقاً جديدة للصادرات غير النفطية.',
        immediate: { internationalSupport: 3 }, medium: { tradeBalance: 3 }, long: { tradeBalance: 4, industryLevel: 2 } },
      { label: 'اتفاقيات محدودة مع دول مختارة فقط', advisor: 'المستشار الدبلوماسي: أكثر حذراً وأقل مخاطرة.',
        immediate: { internationalSupport: 1 }, medium: { tradeBalance: 1 }, long: {} },
      { label: 'تأجيل الملف والتركيز على السوق المحلي', advisor: 'المستشار الاقتصادي: حماية مؤقتة للصناعات المحلية الناشئة.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'customs_reform', category: 'economic', type: 'tactical', title: 'إصلاح النظام الجمركي',
    description: 'تعاني الموانئ والمنافذ الحدودية من بطء إجراءات جمركية وتسرب إيرادات كبير عبر التهريب.',
    minMonth: 10, cooldown: 12,
    options: [
      { label: 'أتمتة كاملة للإجراءات الجمركية في الموانئ الكبرى', advisor: 'وزير المالية: يرفع الإيرادات ويقلل الفساد على المدى المتوسط.',
        immediate: { budgetBalance: -3 }, medium: { budgetBalance: 4, tradeBalance: 2 }, long: { tradeBalance: 3 } },
      { label: 'حملة مكافحة تهريب مكثفة على الحدود', advisor: 'وزير الداخلية: نتائج سريعة لكنها تحتاج تعزيزاً أمنياً مستمراً.',
        immediate: { budgetBalance: -2, security: 1 }, medium: { budgetBalance: 3 }, long: {} },
      { label: 'الإبقاء على النظام الحالي', advisor: 'وزير المالية: استمرار تسرب الإيرادات.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'mining_sector', category: 'economic', type: 'tactical', title: 'استغلال الثروة المعدنية',
    description: 'تشير مسوحات جيولوجية إلى وجود احتياطيات واعدة من الحديد والمنغنيز والذهب والفوسفات في مناطق مختلفة.',
    minMonth: 12, cooldown: 16,
    options: [
      { label: 'إطلاق مسح جيولوجي شامل وجذب استثمار تعديني', advisor: 'المستشار الاقتصادي: استثمار طويل الأمد بعائد مؤجل.',
        immediate: { budgetBalance: -4 }, medium: { industryLevel: 2 }, long: { industryLevel: 4, tradeBalance: 3 } },
      { label: 'منح تراخيص تعدين محدودة لشركات محلية', advisor: 'المستشار الاقتصادي: مخاطر أقل، عائد أبطأ.',
        immediate: {}, medium: { industryLevel: 1 }, long: { industryLevel: 2 } },
      { label: 'تأجيل استغلال الثروة المعدنية', advisor: 'المستشار الاقتصادي: يحافظ على الموارد لكنه يفوّت دخلاً محتملاً.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'sovereign_wealth_fund', category: 'economic', type: 'strategic', title: 'إنشاء صندوق الثروة السيادي',
    description: 'يقترح وزير المالية إنشاء صندوق سيادي لاستثمار فوائض النفط بعيداً عن الإنفاق الجاري، لضمان استدامة مالية للأجيال القادمة.',
    minMonth: 6, oneTime: true,
    condition: (s) => s.indicators.treasury > 5000,
    options: [
      { label: 'تخصيص نسبة كبيرة من الفوائض للصندوق السيادي', advisor: 'وزير المالية: استدامة مالية قوية لكنها تقلل الإنفاق الحالي المتاح.',
        immediate: { treasury: -6000, forexReserves: 6000 }, medium: { economicDevelopment: 2 }, long: { publicDebt: -5, economicDevelopment: 4 } },
      { label: 'تخصيص نسبة معتدلة', advisor: 'وزير المالية: توازن بين الحاضر والمستقبل.',
        immediate: { treasury: -2500, forexReserves: 2500 }, medium: {}, long: { economicDevelopment: 2 } },
      { label: 'عدم إنشاء الصندوق حالياً', advisor: 'وزير المالية: مرونة إنفاق أكبر الآن، لا حماية مستقبلية.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'free_trade_zone', category: 'economic', type: 'strategic', title: 'إنشاء منطقة تجارة حرة في ميناء رئيسي',
    description: 'يقترح مستثمرون أجانب إنشاء منطقة تجارة حرة في أحد الموانئ الكبرى لجذب الصناعات التصديرية.',
    minMonth: 14, oneTime: true,
    options: [
      { label: 'الموافقة وتقديم حوافز ضريبية كبيرة', advisor: 'المستشار الاقتصادي: جاذبية استثمارية عالية بكلفة إيرادات ضريبية مؤجلة.',
        immediate: { internationalSupport: 3 }, medium: { industryLevel: 3, tradeBalance: 2 }, long: { industryLevel: 4, tradeBalance: 4 } },
      { label: 'الموافقة بشروط وحوافز محدودة', advisor: 'المستشار الاقتصادي: أكثر توازناً في الإيرادات المتوقعة.',
        immediate: {}, medium: { industryLevel: 1, tradeBalance: 1 }, long: { industryLevel: 2 } },
      { label: 'رفض المشروع حفاظاً على السيطرة الوطنية الكاملة', advisor: 'المستشار السياسي: يحمي السيادة لكنه يفوّت استثمارات كبرى.',
        immediate: {}, medium: {}, long: {} }
    ]
  },

  // ------- سياسية ومؤسسية -------
  {
    id: 'coalition_government', category: 'political', type: 'strategic', title: 'تشكيل حكومة ائتلافية',
    description: 'تتصاعد الدعوات لتوسيع قاعدة الحكومة بضم ممثلين عن تيارات ومناطق مختلفة لتعزيز الشرعية الداخلية.',
    minMonth: 5, oneTime: true,
    options: [
      { label: 'تشكيل حكومة ائتلاف وطني واسعة', advisor: 'المستشار السياسي: يعزز الشرعية لكنه يبطئ اتخاذ القرار.',
        immediate: { politicalStability: 5, satisfaction: 2 }, medium: { politicalStability: 3 }, long: {} },
      { label: 'ضم عدد محدود من الوزراء المستقلين', advisor: 'المستشار السياسي: خطوة رمزية متوسطة الأثر.',
        immediate: { politicalStability: 2 }, medium: {}, long: {} },
      { label: 'الإبقاء على حكومة متجانسة سياسياً', advisor: 'المستشار السياسي: قرار أسرع تنفيذاً لكنه أقل تمثيلاً.',
        immediate: { politicalStability: -2 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'judicial_reform', category: 'political', type: 'strategic', title: 'إصلاح النظام القضائي',
    description: 'يعاني القضاء من بطء التقاضي وضعف الاستقلالية، ما يؤثر على الثقة العامة ومناخ الاستثمار.',
    minMonth: 9, oneTime: true,
    options: [
      { label: 'إصلاح شامل يعزز استقلال القضاء', advisor: 'المستشار السياسي: يحسن الشرعية والاستثمار على المدى الطويل.',
        immediate: { budgetBalance: -2, politicalStability: 3 }, medium: { internationalSupport: 3 }, long: { economicDevelopment: 3 } },
      { label: 'إصلاحات جزئية لتسريع التقاضي فقط', advisor: 'المستشار السياسي: تحسن محدود لكنه أسرع تنفيذاً.',
        immediate: { budgetBalance: -1 }, medium: { satisfaction: 1 }, long: {} },
      { label: 'تأجيل الإصلاح القضائي', advisor: 'المستشار السياسي: يتجنب صداماً مع النخب القضائية الحالية.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'decentralization', category: 'political', type: 'strategic', title: 'اللامركزية الإدارية',
    description: 'تطالب مناطق عديدة، خصوصاً في الشرق والجنوب، بصلاحيات إدارية ومالية أوسع بدل المركزية الكاملة من طرابلس.',
    minMonth: 10, oneTime: true,
    options: [
      { label: 'منح صلاحيات إدارية ومالية واسعة للمناطق', advisor: 'المستشار السياسي: يرضي المطالب الإقليمية لكنه يضعف المركز.',
        immediate: { politicalStability: 4, satisfaction: 3 }, medium: {}, long: { politicalStability: -2 } },
      { label: 'لامركزية إدارية محدودة مع إبقاء المالية مركزية', advisor: 'المستشار السياسي: حل وسط مدروس.',
        immediate: { politicalStability: 2 }, medium: {}, long: {} },
      { label: 'الإبقاء على المركزية الكاملة', advisor: 'المستشار السياسي: يحافظ على السيطرة لكنه يغذي الاستياء الإقليمي.',
        immediate: { politicalStability: -3 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'digital_economy', category: 'economic', type: 'tactical', title: 'الاستثمار في الاقتصاد الرقمي',
    description: 'يقترح مستشاروك دفع التحول الرقمي للخدمات الحكومية والتجارة الإلكترونية كرافعة اقتصادية جديدة.',
    minMonth: 16, cooldown: 16,
    options: [
      { label: 'إطلاق استراتيجية تحول رقمي شاملة', advisor: 'مستشار البنية التحتية: استثمار عصري بعائد متوسط المدى.',
        immediate: { budgetBalance: -3 }, medium: { industryLevel: 2, infrastructureLevel: 2 }, long: { economicDevelopment: 3 } },
      { label: 'رقمنة خدمة حكومية واحدة كتجربة أولى', advisor: 'مستشار البنية التحتية: خطوة صغيرة منخفضة المخاطر.',
        immediate: { budgetBalance: -1 }, medium: { infrastructureLevel: 1 }, long: {} },
      { label: 'تأجيل التحول الرقمي', advisor: 'مستشار البنية التحتية: يوفر المال لكنه يبقي الخدمات بطيئة.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'disaster_preparedness', category: 'social', type: 'tactical', title: 'صندوق التأهب للكوارث',
    description: 'يقترح مستشاروك إنشاء صندوق طوارئ دائم للاستجابة السريعة للكوارث الطبيعية بدل الارتجال في كل أزمة.',
    minMonth: 7, oneTime: true,
    options: [
      { label: 'إنشاء صندوق طوارئ دائم بتمويل سنوي ثابت', advisor: 'مستشار الصحة: استعداد أفضل للأزمات المستقبلية.',
        immediate: { budgetBalance: -2 }, medium: {}, long: { satisfaction: 2 } },
      { label: 'الاعتماد على التمويل الطارئ عند الحاجة فقط', advisor: 'وزير المالية: يوفر المال لكنه يبطئ الاستجابة.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'cultural_heritage', category: 'social', type: 'tactical', title: 'دعم الإنتاج الثقافي والإعلامي',
    description: 'يقترح مستشار الثقافة دعم صناعة الأفلام والدراما والفنون الليبية لتعزيز الهوية الوطنية والسياحة الثقافية.',
    minMonth: 18, cooldown: 16,
    options: [
      { label: 'صندوق دعم حكومي للإنتاج الثقافي', advisor: 'مستشار الثقافة: يعزز الهوية الوطنية والسياحة الثقافية.',
        immediate: { budgetBalance: -2, satisfaction: 2 }, medium: { tourismLevel: 1 }, long: {} },
      { label: 'دعم رمزي محدود فقط', advisor: 'مستشار الثقافة: أثر محدود.',
        immediate: { satisfaction: 1 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'rival_dialogue_channel', category: 'political', type: 'strategic', title: 'قناة حوار سياسي مع الإدارة الموازية',
    description: 'تقترح الأمم المتحدة استئناف جولة حوار مباشرة بين وفدك ووفد السلطة الموازية شرقاً حول الملفات العالقة: توحيد المؤسسات السيادية، تقاسم عائدات النفط، وخارطة طريق انتخابية.',
    minMonth: 4, cooldown: 8,
    options: [
      { label: 'تقديم تنازلات حقيقية مقابل تقدّم ملموس في مسار التوحيد', advisor: 'المستشار الدبلوماسي: يُضعف موقفك التفاوضي الفوري لكنه الطريق الوحيد الواقعي لإنهاء الانقسام فعلياً.',
        immediate: { politicalStability: -1 }, sovereigntyEffect: { unifiedElectionsProgressDelta: 12, rivalMilitaryStrengthDelta: -3 } },
      { label: 'موقف تفاوضي متوازن دون تنازلات كبرى', immediate: {}, sovereigntyEffect: { unifiedElectionsProgressDelta: 4 } },
      { label: 'رفض الجلوس مع طرف تعتبره غير شرعي', advisor: 'المستشار السياسي: يُرضي المتشددين في صفك لكنه يُجمّد أي أفق لحل سياسي، ويُبقي الانقسام كما هو.',
        immediate: { internationalSupport: -3 }, sovereigntyEffect: { rivalMilitaryStrengthDelta: 2 } }
    ]
  },
  {
    id: 'unified_elections_breakthrough', category: 'political', type: 'strategic', title: 'مسار توحيد ليبيا: استحقاق تاريخي',
    description: 'بعد مسار طويل من الحوار والوساطة الدولية، اقترب مسار الانتخابات الموحدة التي تشمل كل البلاد من الاكتمال فعلياً - أول استحقاق حقيقي من نوعه منذ أكثر من عقد من الانقسام. اللحظة حاسمة ولا تحتمل التردد الطويل.',
    pivotal: true, condition: s => s.sovereignty.unifiedElectionsProgress >= 100 && !s.sovereignty.reunified,
    cooldown: 6,
    options: [
      { label: 'المضي في الاستحقاق الموحد الآن بمراقبة دولية كاملة', advisor: 'المستشار الدبلوماسي: النتيجة تُحسم فعلياً من ميزان القوى الحقيقي على الأرض، لا من حسن النوايا وحده.',
        unifyResolution: true },
      { label: 'التريث لتحسين موقفك التفاوضي والعسكري أولاً', advisor: 'اللواء الأمني: تأجيل حكيم إن كانت الكفة لا تزال مائلة لصالح الطرف الآخر - لكن كل تأخير يمنحه وقتاً للتعزز أيضاً.',
        immediate: { politicalStability: -1 }, sovereigntyEffect: { unifiedElectionsProgressDelta: -20 } }
    ]
  },
  {
    id: 'election_call', category: 'political', type: 'strategic', title: 'الدعوة لانتخابات برلمانية منتصف المدة',
    description: 'حان موعد استحقاق دستوري لتجديد الشرعية عبر صناديق الاقتراع في منتصف فترتك الرئاسية - نتيجة هذا الاستحقاق تُحسم فعلياً من شعبيتك الحقيقية مقابل شعبية منافسك، لا شكلاً بروتوكولياً.',
    pivotal: true, minMonth: 20, oneTime: true,
    forcedByMonth: 22,
    options: [
      { label: 'إجراء الانتخابات في موعدها بنزاهة كاملة', advisor: 'المستشار السياسي: نتيجة حقيقية تعكس شعبيتك الفعلية مقابل منافسك - مكسب مضاعف إن فزت، وضربة موجعة إن خسرت.',
        electionResolution: { rig: false } },
      { label: 'التلاعب بنتيجة الانتخابات لضمان الفوز', advisor: 'المستشار الأمني: يضمن فوزاً معلناً، لكن انكشاف التزوير - خصوصاً إن ضعف قبضتك الأمنية - يكلفك شرعيتك الدولية والداخلية معاً.',
        electionResolution: { rig: true } },
      { label: 'تأجيل الانتخابات بذريعة الظروف الأمنية', advisor: 'المستشار الأمني: يتجنب خوض استحقاق فعلي، لكنه يمنح منافسك زخماً شعبياً كمن حُرم من فرصته العادلة.',
        immediate: { internationalSupport: -6, politicalStability: -2 }, medium: { politicalStability: -3 }, rivalApprovalDelta: 12 }
    ]
  },

  // ------- قرارات تمنح الوضع السياسي الداخلي والدولي تأثيراً فعلياً -------
  {
    id: 'tribal_reconciliation_summit', category: 'political', type: 'strategic', title: 'مؤتمر مصالحة قبلية شامل',
    description: 'تراجع ولاء القبائل بشكل عام بشكل ملحوظ في الآونة الأخيرة. مستشاروك يقترحون عقد مؤتمر مصالحة وطني يجمع شيوخ القبائل الكبرى لاحتواء الاستياء قبل أن يتفاقم.',
    condition: (s) => avgTribalLoyalty(s) < 45,
    cooldown: 14,
    options: [
      { label: 'مؤتمر مصالحة كبير بحضور رئاسي شخصي', advisor: 'المستشار السياسي: أقوى أثر ممكن، لكنه يستهلك وقتاً ورأس مال سياسياً.',
        immediate: { budgetBalance: -4, politicalStability: 3 }, medium: { politicalStability: 3 }, long: {},
        relationsEffect: { type: 'allTribes', delta: 12 } },
      { label: 'تفويض وزير الداخلية لإدارة الحوار', advisor: 'وزير الداخلية: أقل تكلفة سياسية لكن الأثر أضعف.',
        immediate: { budgetBalance: -2 }, medium: {}, long: {},
        relationsEffect: { type: 'allTribes', delta: 6 } },
      { label: 'تجاهل الدعوات لعقد المؤتمر', advisor: 'المستشار السياسي: توفير فوري للموارد بثمن تراكم الاستياء القبلي.',
        immediate: { politicalStability: -2 }, medium: {}, long: {},
        relationsEffect: { type: 'allTribes', delta: -3 } }
    ]
  },
  {
    id: 'neighbor_relations_crisis', category: 'diplomatic', type: 'diplomatic', title: 'توتر متصاعد مع {target}',
    description: 'تدهورت العلاقات مع {target} إلى مستوى مقلق، وسط تقارير عن حشود حدودية وتصريحات إعلامية متبادلة حادة. مستشاروك يطالبون بموقف واضح قبل أن يخرج الملف عن السيطرة.',
    dynamicTarget: 'lowestNeighborRelation',
    cooldown: 10,
    options: [
      { label: 'إيفاد وفد دبلوماسي رفيع لتهدئة التوتر', advisor: 'المستشار الدبلوماسي: يحتاج تنازلات لكنه يمنع التصعيد.',
        immediate: { internationalSupport: 2 }, medium: {}, long: {},
        relationsEffect: { type: 'country', delta: 20 } },
      { label: 'اقتراح لجنة حدودية مشتركة لضبط الخلاف', advisor: 'المستشار الدبلوماسي: حل متوازن يحفظ ماء الوجه للطرفين.',
        immediate: {}, medium: { internationalSupport: 1 }, long: {},
        relationsEffect: { type: 'country', delta: 10 } },
      { label: 'تصعيد الخطاب الرسمي ورفض التنازل', advisor: 'المستشار الأمني: يرضي الرأي العام الداخلي لكنه يخاطر بأزمة حقيقية.',
        immediate: { politicalStability: 2, security: -3 }, medium: {}, long: {},
        relationsEffect: { type: 'country', delta: -15 } }
    ]
  },
  {
    id: 'deepen_strategic_alliance', category: 'diplomatic', type: 'diplomatic', title: 'عرض لتعميق التحالف الاستراتيجي مع {target}',
    description: 'بلغت العلاقة مع {target} مستوى متيناً غير معتاد، وتعرض هذه الدولة توقيع اتفاقية شراكة استراتيجية شاملة تشمل التعاون الأمني والاقتصادي طويل الأمد.',
    dynamicTarget: 'highestGlobalRelation',
    cooldown: 16,
    options: [
      { label: 'توقيع اتفاقية شراكة استراتيجية شاملة', advisor: 'المستشار الدبلوماسي: التزام كبير طويل الأمد بعائد استراتيجي كبير.',
        immediate: { economicDevelopment: 3, security: 2 }, medium: { internationalSupport: 3 }, long: {},
        relationsEffect: { type: 'country', delta: 10 } },
      { label: 'اتفاقية تعاون محدودة دون التزامات شاملة', advisor: 'المستشار الدبلوماسي: يحافظ على مرونة السياسة الخارجية.',
        immediate: { economicDevelopment: 1 }, medium: {}, long: {},
        relationsEffect: { type: 'country', delta: 5 } },
      { label: 'الحفاظ على التوازن ورفض التقارب الأعمق', advisor: 'المستشار السياسي: يجنّب الانحياز الكامل لطرف دولي واحد.',
        immediate: {}, medium: {}, long: {}, relationsEffect: { type: 'country', delta: -3 } }
    ]
  },
  {
    id: 'party_outreach', category: 'political', type: 'tactical', title: 'تراجع حاد في دعم {target}',
    description: 'يشهد تيار "{target}" تراجعاً حاداً في مستوى دعمه وتعاونه مع الحكومة، وسط أصوات داخله تطالب بمراجعة الموقف من الرئاسة.',
    dynamicTarget: 'lowestPartySupport',
    cooldown: 10,
    options: [
      { label: 'اجتماع مباشر مع قيادات التيار وتقديم تنازلات', advisor: 'المستشار السياسي: يحتاج مرونة سياسية حقيقية.',
        immediate: { budgetBalance: -1 }, medium: {}, long: {},
        relationsEffect: { type: 'party', delta: 15 } },
      { label: 'التواصل الإعلامي دون تنازلات فعلية', advisor: 'المستشار السياسي: قد لا يقنع القاعدة الحزبية.',
        immediate: {}, medium: {}, long: {}, relationsEffect: { type: 'party', delta: 5 } },
      { label: 'تجاهل الأمر باعتباره مناورة سياسية عابرة', advisor: 'المستشار السياسي: خطر تحول هذا التيار إلى معارضة فعلية.',
        immediate: {}, medium: {}, long: {}, relationsEffect: { type: 'party', delta: -8 } }
    ]
  },

  // ------- توسعة إضافية لبنك القرارات لتقليل التكرار على مدى فترة كاملة -------
  {
    id: 'women_empowerment', category: 'social', type: 'tactical', title: 'برنامج تمكين المرأة اقتصادياً',
    description: 'تقترح مستشارتك برنامجاً وطنياً لتمكين المرأة في سوق العمل وريادة الأعمال.',
    minMonth: 6, cooldown: 14,
    options: [
      { label: 'برنامج تمويل وتدريب واسع لرائدات الأعمال', advisor: 'المستشار الاقتصادي: يوسع القاعدة الإنتاجية للاقتصاد.',
        immediate: { budgetBalance: -2, satisfaction: 2 }, medium: { unemployment: -1, economicDevelopment: 2 }, long: {} },
      { label: 'حصص توظيف في القطاع العام فقط', advisor: 'المستشار السياسي: أثر رمزي أسرع لكنه محدود اقتصادياً.',
        immediate: { satisfaction: 1 }, medium: { unemployment: -1 }, long: {} },
      { label: 'تأجيل البرنامج لأولويات أخرى', advisor: 'المستشار السياسي: يوفر الميزانية لكنه يثير انتقادات حقوقية.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'veterans_reintegration', category: 'security', type: 'tactical', title: 'إعادة دمج المقاتلين السابقين',
    description: 'يقترح وزير الدفاع برنامجاً لإعادة دمج مقاتلي الميليشيات السابقين في الحياة المدنية والوظائف الحكومية.',
    minMonth: 8, cooldown: 14,
    options: [
      { label: 'برنامج تأهيل وتوظيف حكومي واسع', advisor: 'وزير الدفاع: يقلل مخاطر تحول المسرحين إلى تهديد أمني.',
        immediate: { budgetBalance: -4, security: 3 }, medium: { unemployment: -1 }, long: {} },
      { label: 'تعويضات مالية دون برنامج تأهيل', advisor: 'وزير المالية: أسرع تنفيذاً لكن أقل استدامة.',
        immediate: { budgetBalance: -3, security: 1 }, medium: {}, long: {} },
      { label: 'ترك الأمر لكل منطقة لتدبيره محلياً', advisor: 'وزير الداخلية: يوفر المال لكنه يخاطر بتفاوت كبير بين المناطق.',
        immediate: {}, medium: { security: -2 }, long: {} }
    ]
  },
  {
    id: 'water_infrastructure', category: 'economic', type: 'tactical', title: 'تحلية المياه وشبكات المياه',
    description: 'تعاني مناطق ساحلية وداخلية من نقص متكرر في المياه الصالحة للشرب، ما يستدعي الاستثمار في محطات تحلية وشبكات جديدة.',
    minMonth: 5, cooldown: 12,
    options: [
      { label: 'بناء محطات تحلية كبرى على الساحل', advisor: 'مستشار البنية التحتية: حل جذري بتكلفة عالية.',
        immediate: { budgetBalance: -6, satisfaction: 3 }, medium: { infrastructureLevel: 4 }, long: { infrastructureLevel: 3 } },
      { label: 'صيانة وتوسعة الشبكات القائمة فقط', advisor: 'مستشار البنية التحتية: أرخص وأسرع لكن أثره محدود.',
        immediate: { budgetBalance: -2, satisfaction: 1 }, medium: { infrastructureLevel: 2 }, long: {} },
      { label: 'تأجيل المشروع لضيق الموازنة', advisor: 'وزير المالية: يوفر المال بثمن استمرار أزمات المياه الدورية.',
        immediate: { satisfaction: -2 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'anti_corruption_commission', category: 'political', type: 'strategic', title: 'إنشاء هيئة مستقلة لمكافحة الفساد',
    description: 'تتصاعد الضغوط الشعبية والدولية لإنشاء هيئة رقابية مستقلة تحقق في قضايا الفساد داخل مؤسسات الدولة.',
    minMonth: 10, oneTime: true,
    options: [
      { label: 'هيئة مستقلة بصلاحيات واسعة وحصانة قانونية', advisor: 'المستشار السياسي: يعزز الثقة لكنه قد يطال شخصيات نافذة داخل الحكومة.',
        immediate: { satisfaction: 4, internationalSupport: 3, politicalStability: -3 }, medium: { politicalStability: 4 }, long: {} },
      { label: 'هيئة استشارية محدودة الصلاحيات', advisor: 'المستشار السياسي: خطوة رمزية بمخاطرة أقل.',
        immediate: { satisfaction: 1 }, medium: {}, long: {} },
      { label: 'الاكتفاء بالأطر الرقابية الحالية', advisor: 'المستشار السياسي: يتجنب المواجهة الداخلية لكنه يخيب الآمال الشعبية.',
        immediate: { satisfaction: -3, internationalSupport: -2 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'refugee_displaced_support', category: 'social', type: 'tactical', title: 'دعم النازحين داخلياً',
    description: 'لا تزال أعداد من النازحين داخلياً بسبب أحداث سابقة تعيش في ظروف صعبة وتنتظر حلولاً للإسكان والخدمات.',
    minMonth: 4, cooldown: 12,
    options: [
      { label: 'برنامج إسكان وعودة طوعية مدعوم بالكامل', advisor: 'مستشار الشؤون الاجتماعية: حل شامل بتكلفة كبيرة.',
        immediate: { budgetBalance: -4, satisfaction: 3, poverty: -2 }, medium: {}, long: {} },
      { label: 'مساعدات إغاثية دورية دون حل دائم', advisor: 'مستشار الشؤون الاجتماعية: يخفف المعاناة دون معالجة الجذر.',
        immediate: { budgetBalance: -2, satisfaction: 1 }, medium: {}, long: {} },
      { label: 'ترك الملف لمنظمات الإغاثة الدولية', advisor: 'المستشار الدبلوماسي: يوفر المال المحلي لكنه يعكس ضعف تعامل الدولة مع الملف.',
        immediate: { internationalSupport: -1 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'tech_park_investment', category: 'economic', type: 'tactical', title: 'إنشاء مجمع تقني للشركات الناشئة',
    description: 'يقترح مستشاروك إنشاء مجمع تقني يستقطب الشركات الناشئة الليبية والإقليمية، استكمالاً لجهود التحول الرقمي.',
    minMonth: 18, cooldown: 16,
    options: [
      { label: 'مجمع تقني كامل مع حوافز ضريبية للشركات', advisor: 'المستشار الاقتصادي: استثمار طموح يستهدف اقتصاد المعرفة.',
        immediate: { budgetBalance: -3 }, medium: { industryLevel: 2, unemployment: -1 }, long: { economicDevelopment: 3 } },
      { label: 'حاضنة أعمال صغيرة كتجربة أولى', advisor: 'المستشار الاقتصادي: خطوة متواضعة منخفضة المخاطر.',
        immediate: { budgetBalance: -1 }, medium: { industryLevel: 1 }, long: {} },
      { label: 'عدم الاستثمار في هذا المجال حالياً', advisor: 'وزير المالية: أولويات أخرى أكثر إلحاحاً.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'media_regulation_reform', category: 'political', type: 'tactical', title: 'مراجعة تنظيم القطاع الإعلامي',
    description: 'يتزايد الجدل حول ترخيص القنوات الفضائية والمواقع الإخبارية المحلية وحدود التنظيم الحكومي لها.',
    minMonth: 9, cooldown: 14,
    options: [
      { label: 'تحرير الترخيص الإعلامي مع معايير مهنية واضحة', advisor: 'المستشار السياسي: يحسن السمعة الدولية بمخاطرة نقد داخلي أوسع.',
        immediate: { internationalSupport: 2, politicalStability: -1 }, medium: {}, long: {} },
      { label: 'إبقاء الترخيص الحالي مع تحديثات طفيفة', advisor: 'المستشار السياسي: تغيير شكلي دون أثر يُذكر.',
        immediate: {}, medium: {}, long: {} },
      { label: 'تشديد شروط الترخيص الإعلامي', advisor: 'المستشار الأمني: يحد من الانتقادات لكنه يضر بالسمعة الدولية.',
        immediate: { internationalSupport: -3, politicalStability: 2 }, medium: {}, long: {} }
    ]
  },
  {
    id: 'agricultural_export_push', category: 'economic', type: 'tactical', title: 'دفعة لتصدير المنتجات الزراعية',
    description: 'تحقق بعض المحاصيل الليبية جودة تنافسية إقليمياً، ويقترح مستشاروك دعم تصديرها بدل الاكتفاء بالسوق المحلي.',
    minMonth: 16, cooldown: 14,
    condition: (s) => s.indicators.agricultureLevel > 40,
    options: [
      { label: 'دعم لوجستي وتسويقي كامل للمصدرين الزراعيين', advisor: 'المستشار الاقتصادي: يحول الزراعة إلى مصدر عملة صعبة حقيقي.',
        immediate: { budgetBalance: -2 }, medium: { tradeBalance: 2 }, long: { tradeBalance: 3, agricultureLevel: 2 } },
      { label: 'تسهيلات جمركية محدودة فقط', advisor: 'المستشار الاقتصادي: خطوة أولى منخفضة الكلفة.',
        immediate: {}, medium: { tradeBalance: 1 }, long: {} },
      { label: 'الإبقاء على التركيز على السوق المحلي', advisor: 'المستشار الاقتصادي: يحمي الأمن الغذائي المحلي أولاً.',
        immediate: {}, medium: {}, long: {} }
    ]
  },
  {
    id: 'housing_market_reform', category: 'economic', type: 'tactical', title: 'تنظيم سوق العقارات',
    description: 'يشهد سوق العقارات في المدن الكبرى ارتفاعاً حاداً في الأسعار نتيجة المضاربة، ما يصعّب حصول الشباب على سكن.',
    minMonth: 12, cooldown: 14,
    options: [
      { label: 'ضريبة على العقارات الشاغرة والمضاربة العقارية', advisor: 'المستشار الاقتصادي: يهدئ السوق لكنه يواجه معارضة من كبار الملاك.',
        immediate: { satisfaction: 2, economicDevelopment: -1 }, medium: { poverty: -1 }, long: {} },
      { label: 'تحفيز البناء السكني الجديد لزيادة العرض', advisor: 'مستشار البنية التحتية: حل تدريجي يحتاج وقتاً لينضج.',
        immediate: { budgetBalance: -2 }, medium: { infrastructureLevel: 1 }, long: { satisfaction: 2 } },
      { label: 'ترك السوق دون تدخل حكومي', advisor: 'المستشار الاقتصادي: يحافظ على حرية السوق لكنه يفاقم أزمة السكن.',
        immediate: { satisfaction: -2 }, medium: {}, long: {} }
    ]
  }
];
