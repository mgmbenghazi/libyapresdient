// سيناريوهات بداية اللعبة
const SCENARIOS = [
  {
    id: 'stable',
    name: 'ليبيا المستقرة',
    difficulty: 'متوسطة',
    description: 'البلاد في حالة استقرار نسبي، لكنها تواجه تحديات اقتصادية هيكلية وضغوطاً متزايدة لتنويع مصادر الدخل.',
    startIndicators: {
      satisfaction: 55, budgetBalance: -5, treasury: 8000, gdpGrowth: 2.0,
      unemployment: 19, inflation: 6, forexReserves: 70000, publicDebt: 35,
      poverty: 24, politicalStability: 60, internationalSupport: 55,
      oilProduction: 1100, educationLevel: 52, healthLevel: 50,
      infrastructureLevel: 48, security: 62, economicDevelopment: 45
    },
    startTreasuryNote: 'خزينة الدولة في وضع مقبول مع عجز طفيف قابل للإدارة.'
  },
  {
    id: 'post-crisis',
    name: 'ليبيا ما بعد الأزمة',
    difficulty: 'صعبة',
    description: 'البلاد خارجة للتو من أزمة سياسية وأمنية حادة. التحديات الأمنية والاقتصادية كبيرة، والثقة الشعبية بالحكومة منخفضة.',
    startIndicators: {
      satisfaction: 35, budgetBalance: -18, treasury: 3000, gdpGrowth: -1.5,
      unemployment: 28, inflation: 14, forexReserves: 35000, publicDebt: 55,
      poverty: 38, politicalStability: 32, internationalSupport: 40,
      oilProduction: 650, educationLevel: 40, healthLevel: 38,
      infrastructureLevel: 30, security: 35, economicDevelopment: 28
    },
    startTreasuryNote: 'خزينة شبه فارغة وعجز كبير في الميزانية.'
  },
  {
    id: 'oil-boom',
    name: 'ليبيا الازدهار النفطي',
    difficulty: 'سهلة',
    description: 'ارتفاع حاد في أسعار النفط العالمية يمنح البلاد فرصة ذهبية للتنمية، لكن مع ضغوط دولية متزايدة وترقب من القوى الكبرى.',
    startIndicators: {
      satisfaction: 62, budgetBalance: 12, treasury: 25000, gdpGrowth: 5.5,
      unemployment: 15, inflation: 5, forexReserves: 140000, publicDebt: 18,
      poverty: 16, politicalStability: 65, internationalSupport: 58,
      oilProduction: 1500, educationLevel: 55, healthLevel: 55,
      infrastructureLevel: 52, security: 60, economicDevelopment: 55
    },
    startTreasuryNote: 'فائض مالي مريح بفضل ارتفاع عائدات النفط.'
  },
  {
    id: 'future',
    name: 'ليبيا المستقبل',
    difficulty: 'صعبة',
    description: 'سيناريو مستقبلي حيث بدأت مصادر الطاقة البديلة تهدد الطلب العالمي على النفط. تنويع الاقتصاد أصبح ضرورة وجودية لا خياراً.',
    startIndicators: {
      satisfaction: 48, budgetBalance: -10, treasury: 6000, gdpGrowth: 1.0,
      unemployment: 24, inflation: 8, forexReserves: 50000, publicDebt: 42,
      poverty: 27, politicalStability: 50, internationalSupport: 50,
      oilProduction: 900, educationLevel: 58, healthLevel: 54,
      infrastructureLevel: 50, security: 55, economicDevelopment: 40
    },
    startTreasuryNote: 'الاعتماد على النفط وحده لم يعد خياراً آمناً للمستقبل.'
  }
];

const POLITICAL_BACKGROUNDS = [
  { id: 'military', name: 'عسكري', desc: 'خلفية عسكرية تمنحك دعماً أمنياً أولياً وثقة أعلى من المؤسسة العسكرية.', bonus: { security: 8, politicalStability: 3 }, malus: { internationalSupport: -3 } },
  { id: 'technocrat', name: 'تكنوقراط', desc: 'خبير اقتصادي سابق، يمنحك فهماً أعمق للملفات الاقتصادية.', bonus: { economicDevelopment: 6, internationalSupport: 4 }, malus: { satisfaction: -2 } },
  { id: 'tribal', name: 'زعيم قبلي', desc: 'ينحدر من عائلة ذات نفوذ قبلي واسع، يمنحك دعماً شعبياً أولياً في المناطق التقليدية.', bonus: { satisfaction: 6, politicalStability: 4 }, malus: { internationalSupport: -4 } },
  { id: 'diplomat', name: 'دبلوماسي', desc: 'عمل سابقاً في السلك الدبلوماسي، يمنحك علاقات دولية أفضل منذ البداية.', bonus: { internationalSupport: 8 }, malus: { security: -3 } },
  { id: 'revolutionary', name: 'ثوري سابق', desc: 'شارك في التغيير السياسي، يحظى بشعبية عالية بين الشباب لكن يثير قلق النخب التقليدية.', bonus: { satisfaction: 8 }, malus: { politicalStability: -5 } }
];

const ADVISOR_POOL = [
  { id: 'econ', role: 'المستشار الاقتصادي', names: ['د. منير الككلي', 'د. سالم الترهوني', 'د. آمنة المسماري'] },
  { id: 'pol', role: 'المستشار السياسي', names: ['أ. خالد الفيتوري', 'أ. رانيا العبيدي', 'أ. يوسف بشير'] },
  { id: 'sec', role: 'المستشار الأمني', names: ['اللواء عادل الشريف', 'اللواء نجاة الورفلي'] },
  { id: 'dip', role: 'المستشار الدبلوماسي', names: ['السفير هشام القذافي زوي', 'السفيرة ليلى بن عامر'] }
];
