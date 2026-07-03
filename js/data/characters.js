// نظام الشخصيات - شخصيات فردية باسم لها سمات وعلاقات وتفاعلات
// السمات الخاصة المتاحة
const TRAITS = {
  econ_expert: { name: 'خبير اقتصادي', desc: 'يحسّن فعالية القرارات الاقتصادية في قطاعه.' },
  diplomat: { name: 'دبلوماسي محنك', desc: 'يحسّن العلاقات الدولية عند التكليف بمهام خارجية.' },
  charismatic: { name: 'قائد كاريزمي', desc: 'يرفع الشعبية والرضا الشعبي بوجوده في منصبه.' },
  military_strategist: { name: 'استراتيجي عسكري', desc: 'يحسّن الأداء الأمني في منصبه.' },
  negotiator: { name: 'مفاوض بارع', desc: 'يحسّن نتائج التفاوض والمهام الدبلوماسية.' },
  wide_network: { name: 'شبكة علاقات واسعة', desc: 'يرفع النفوذ ويقلل تراجع الولاء مع الوقت.' },
  tech_expert: { name: 'خبير تقني', desc: 'يحسّن كفاءة مشاريع البنية التحتية.' },
  loyal_patriot: { name: 'مخلص للوطن', desc: 'مقاومة أعلى للفساد، ولاء أكثر ثباتاً.' },
  corrupt_prone: { name: 'ميال للفساد', desc: 'يزيد تسرّب الميزانية في قطاعه مع الوقت.' }
};

// المناصب الوزارية القابلة للتعيين وربطها بمؤشر/قطاع تتأثر به كفاءة الوزير
const MINISTRIES = [
  { id: 'pm', name: 'رئيس الوزراء', effectKey: 'politicalStability', sector: null },
  { id: 'finance', name: 'وزير المالية', effectKey: 'budgetBalance', sector: 'economicDev' },
  { id: 'foreign', name: 'وزير الخارجية', effectKey: 'internationalSupport', sector: null },
  { id: 'defense', name: 'وزير الدفاع', effectKey: 'security', sector: 'security' },
  { id: 'interior', name: 'وزير الداخلية', effectKey: 'security', sector: 'security' },
  { id: 'oil', name: 'وزير النفط', effectKey: 'oilProduction', sector: 'oilSector' },
  { id: 'education', name: 'وزير التعليم', effectKey: 'educationLevel', sector: 'education' },
  { id: 'health', name: 'وزير الصحة', effectKey: 'healthLevel', sector: 'health' },
  { id: 'development', name: 'وزير التنمية', effectKey: 'infrastructureLevel', sector: 'infrastructure' },
  { id: 'agriculture', name: 'وزيرة الزراعة', effectKey: 'agricultureLevel', sector: 'agricultureSector' },
  { id: 'industry', name: 'وزير الصناعة', effectKey: 'industryLevel', sector: 'industrySector' }
];

const CHARACTERS = [
  // ------- الحكومة -------
  { id: 'zenati', name: 'محمد الزناتي', role: 'رئيس الوزراء', category: 'government', ministry: 'pm',
    bio: 'سياسي مخضرم من طرابلس، خبرة طويلة في الإدارة العامة.',
    stats: { loyalty: 70, competence: 85, popularity: 60, influence: 75, ambition: 80, corruption: 40 },
    politicalLean: 'معتدل', region: 'west', traits: ['diplomat', 'wide_network'] },
  { id: 'misrati', name: 'خالد المصراتي', role: 'وزير المالية', category: 'government', ministry: 'finance',
    bio: 'اقتصادي بارز من مصراتة، عمل سابقاً في صندوق النقد الدولي.',
    stats: { loyalty: 65, competence: 90, popularity: 50, influence: 70, ambition: 60, corruption: 30 },
    politicalLean: 'ليبرالي', region: 'west', traits: ['econ_expert', 'negotiator'] },
  { id: 'suwaidi', name: 'أمينة السويدي', role: 'وزيرة الخارجية', category: 'government', ministry: 'foreign',
    bio: 'دبلوماسية سابقة عملت في عدة بعثات ليبية بالخارج.',
    stats: { loyalty: 60, competence: 80, popularity: 45, influence: 65, ambition: 55, corruption: 20 },
    politicalLean: 'معتدل', region: 'east', traits: ['diplomat'] },
  { id: 'gharyani', name: 'اللواء صالح الغرياني', role: 'وزير الدفاع', category: 'government', ministry: 'defense',
    bio: 'ضابط سابق بالجيش، معروف بصرامته وولائه المؤسسي.',
    stats: { loyalty: 68, competence: 75, popularity: 55, influence: 80, ambition: 50, corruption: 25 },
    politicalLean: 'محافظ', region: 'east', traits: ['military_strategist'] },
  { id: 'obeidi', name: 'ياسين العبيدي', role: 'وزير الداخلية', category: 'government', ministry: 'interior',
    bio: 'ضابط شرطة سابق، متمرس في ملفات الأمن الداخلي.',
    stats: { loyalty: 62, competence: 70, popularity: 48, influence: 60, ambition: 55, corruption: 35 },
    politicalLean: 'محافظ', region: 'west', traits: ['military_strategist'] },
  { id: 'ftaisi', name: 'د. سالم الفطيسي', role: 'وزير النفط', category: 'government', ministry: 'oil',
    bio: 'مهندس بترول سابق في المؤسسة الوطنية للنفط.',
    stats: { loyalty: 58, competence: 82, popularity: 40, influence: 70, ambition: 65, corruption: 45 },
    politicalLean: 'براغماتي', region: 'east', traits: ['econ_expert', 'corrupt_prone'] },
  { id: 'abusetta', name: 'د. نجاة أبوستة', role: 'وزيرة التعليم', category: 'government', ministry: 'education',
    bio: 'أكاديمية سابقة برئاسة إحدى الجامعات الليبية.',
    stats: { loyalty: 70, competence: 78, popularity: 58, influence: 45, ambition: 40, corruption: 15 },
    politicalLean: 'معتدل', region: 'west', traits: ['loyal_patriot'] },
  { id: 'tarhouni', name: 'د. منير الترهوني', role: 'وزير الصحة', category: 'government', ministry: 'health',
    bio: 'طبيب واستشاري سابق قبل دخوله العمل الحكومي.',
    stats: { loyalty: 66, competence: 80, popularity: 55, influence: 42, ambition: 45, corruption: 20 },
    politicalLean: 'معتدل', region: 'south', traits: ['loyal_patriot'] },
  { id: 'sallabi', name: 'م. هدى الصلابي', role: 'وزيرة التنمية', category: 'government', ministry: 'development',
    bio: 'مهندسة مدنية عملت في مشاريع بنية تحتية كبرى.',
    stats: { loyalty: 60, competence: 76, popularity: 50, influence: 40, ambition: 55, corruption: 25 },
    politicalLean: 'براغماتي', region: 'west', traits: ['tech_expert'] },
  { id: 'fezzani', name: 'د. فوزية الفزانية', role: 'وزيرة الزراعة', category: 'government', ministry: 'agriculture',
    bio: 'خبيرة اقتصاد زراعي، أشرفت على مشاريع استصلاح أراضٍ في الجنوب قبل تعيينها.',
    stats: { loyalty: 64, competence: 74, popularity: 52, influence: 38, ambition: 45, corruption: 20 },
    politicalLean: 'معتدل', region: 'south', traits: ['loyal_patriot'] },
  { id: 'marghani', name: 'م. طارق المرغني', role: 'وزير الصناعة', category: 'government', ministry: 'industry',
    bio: 'مهندس صناعي من مصراتة، قاد توسعة مصانع الحديد والصلب قبل دخوله الحكومة.',
    stats: { loyalty: 58, competence: 79, popularity: 46, influence: 50, ambition: 62, corruption: 30 },
    politicalLean: 'براغماتي', region: 'west', traits: ['tech_expert'] },

  // ------- قادة القبائل -------
  { id: 'warfalla_chief', name: 'عبدالله الورفلي', role: 'زعيم قبيلة ورفلة', category: 'tribal', tribe: 'warfalla',
    bio: 'زعيم تقليدي لإحدى أكبر القبائل الليبية، نفوذ واسع في المنطقة الشرقية.',
    stats: { loyalty: 60, competence: 70, popularity: 85, influence: 90, ambition: 75, corruption: 50 },
    politicalLean: 'محافظ', region: 'east', traits: ['charismatic', 'wide_network'] },
  { id: 'magarha_chief', name: 'سالم المقارحي', role: 'زعيم قبيلة المقارحة', category: 'tribal', tribe: 'magarha',
    bio: 'شيخ قبلي معروف بعلاقاته الواسعة مع النخب السياسية.',
    stats: { loyalty: 55, competence: 65, popularity: 75, influence: 78, ambition: 60, corruption: 45 },
    politicalLean: 'محافظ', region: 'east', traits: ['wide_network'] },
  { id: 'zintan_chief', name: 'مفتاح الزنتاني', role: 'زعيم قبيلة الزنتان', category: 'tribal', tribe: 'zintan',
    bio: 'قائد عسكري وقبلي سابق ذو ثقل في الغرب الليبي.',
    stats: { loyalty: 50, competence: 72, popularity: 70, influence: 82, ambition: 70, corruption: 40 },
    politicalLean: 'محافظ', region: 'west', traits: ['military_strategist'] },
  { id: 'misrata_chief', name: 'عمر المصراتي', role: 'ممثل مصراتة', category: 'tribal', tribe: 'misrata',
    bio: 'شخصية اقتصادية وعسكرية مؤثرة تمثل مدينة مصراتة.',
    stats: { loyalty: 58, competence: 75, popularity: 72, influence: 80, ambition: 65, corruption: 35 },
    politicalLean: 'براغماتي', region: 'west', traits: ['econ_expert'] },
  { id: 'tebu_chief', name: 'إبراهيم التبو', role: 'زعيم التبو', category: 'tribal', tribe: 'tebu',
    bio: 'زعيم قبلي من الجنوب يطالب بمزيد من التمثيل والموارد.',
    stats: { loyalty: 45, competence: 60, popularity: 65, influence: 55, ambition: 60, corruption: 30 },
    politicalLean: 'مستقل', region: 'south', traits: [] },
  { id: 'tuareg_chief', name: 'موسى الطارقي', role: 'زعيم الطوارق', category: 'tribal', tribe: 'tuareg',
    bio: 'زعيم قبلي من الجنوب الغربي، نفوذ في مناطق الحدود.',
    stats: { loyalty: 45, competence: 58, popularity: 62, influence: 52, ambition: 55, corruption: 30 },
    politicalLean: 'مستقل', region: 'south', traits: [] },

  // ------- رجال الأعمال -------
  { id: 'benghazi_biz', name: 'فيصل البنغازي', role: 'رجل أعمال (نفط وغاز)', category: 'business',
    bio: 'رجل أعمال ناجح في قطاع النفط والغاز، استثمارات داخل وخارج ليبيا.',
    stats: { loyalty: 50, competence: 85, popularity: 60, influence: 80, ambition: 90, corruption: 70 },
    politicalLean: 'براغماتي', region: 'east', traits: ['econ_expert', 'wide_network'] },
  { id: 'tripoli_banker', name: 'ليلى القذافي الشريف', role: 'مديرة مصرف كبير', category: 'business',
    bio: 'مصرفية بارزة تدير أحد أكبر البنوك التجارية في البلاد.',
    stats: { loyalty: 52, competence: 80, popularity: 45, influence: 65, ambition: 70, corruption: 40 },
    politicalLean: 'ليبرالي', region: 'west', traits: ['econ_expert'] },
  { id: 'sabha_trader', name: 'محمود الفزاني', role: 'صاحب شركة استيراد وتصدير', category: 'business',
    bio: 'تاجر مؤثر في تجارة الجنوب الليبي وطرق العبور الحدودية.',
    stats: { loyalty: 48, competence: 68, popularity: 50, influence: 55, ambition: 65, corruption: 55 },
    politicalLean: 'مستقل', region: 'south', traits: [] },

  // ------- قادة الرأي والإعلام -------
  { id: 'media_anchor', name: 'رانية العبيدي', role: 'مقدمة برامج تلفزيونية', category: 'media',
    bio: 'إعلامية مؤثرة ذات قاعدة جماهيرية واسعة.',
    stats: { loyalty: 45, competence: 70, popularity: 80, influence: 70, ambition: 60, corruption: 20 },
    politicalLean: 'مستقل', region: 'west', traits: ['charismatic'] },
  { id: 'journalist', name: 'يوسف بشير', role: 'صحفي استقصائي', category: 'media',
    bio: 'صحفي معروف بتحقيقاته حول الفساد والشأن العام.',
    stats: { loyalty: 35, competence: 75, popularity: 60, influence: 55, ambition: 50, corruption: 10 },
    politicalLean: 'ليبرالي', region: 'east', traits: ['loyal_patriot'] },

  // ------- المعارضة -------
  { id: 'opp_leader', name: 'د. عادل الشريف', role: 'زعيم حزب معارض', category: 'opposition',
    bio: 'سياسي معارض يقود تياراً مطالباً بإصلاحات سياسية جذرية.',
    stats: { loyalty: 20, competence: 72, popularity: 55, influence: 60, ambition: 85, corruption: 25 },
    politicalLean: 'ليبرالي', region: 'west', traits: ['charismatic'] },
  { id: 'activist_leader', name: 'كريم الساحلي', role: 'قائد حركة احتجاجية شبابية', category: 'opposition',
    bio: 'ناشط شبابي يقود حراكاً مطلبياً حول الوظائف والحريات.',
    stats: { loyalty: 25, competence: 55, popularity: 65, influence: 45, ambition: 70, corruption: 10 },
    politicalLean: 'ليبرالي', region: 'east', traits: [] },

  // ------- قادة دينيون -------
  { id: 'mufti', name: 'الشيخ إدريس الككلي', role: 'مفتي الدولة', category: 'religious',
    bio: 'عالم دين معتدل يحظى باحترام واسع في الأوساط الدينية.',
    stats: { loyalty: 55, competence: 65, popularity: 75, influence: 70, ambition: 30, corruption: 15 },
    politicalLean: 'محافظ', region: 'west', traits: ['loyal_patriot'] },
  { id: 'imam_hardline', name: 'الشيخ ناصر الجبلي', role: 'قائد تيار إسلامي', category: 'religious',
    bio: 'قائد ديني ذو خطاب أكثر تشدداً وتأثير في بعض المناطق.',
    stats: { loyalty: 35, competence: 60, popularity: 55, influence: 60, ambition: 65, corruption: 20 },
    politicalLean: 'إسلامي', region: 'east', traits: [] },

  // ------- المجتمع المدني -------
  { id: 'rights_activist', name: 'سمية الطرابلسي', role: 'ناشطة حقوقية', category: 'civil',
    bio: 'محامية وناشطة في حقوق الإنسان وحقوق المرأة، تأثير كبير في المجتمع المدني.',
    stats: { loyalty: 40, competence: 80, popularity: 75, influence: 65, ambition: 70, corruption: 20 },
    politicalLean: 'ليبرالي', region: 'west', traits: ['loyal_patriot', 'wide_network'] },
  { id: 'ngo_leader', name: 'حسن الزوي', role: 'مدير منظمة إغاثة', category: 'civil',
    bio: 'يدير شبكة منظمات إغاثية نشطة في مناطق متعددة من البلاد.',
    stats: { loyalty: 50, competence: 68, popularity: 60, influence: 50, ambition: 40, corruption: 25 },
    politicalLean: 'مستقل', region: 'south', traits: [] },

  // ------- ممثلو القوى الأجنبية -------
  { id: 'amb_usa', name: 'السفير الأمريكي', role: 'سفير الولايات المتحدة', category: 'foreign', country: 'usa',
    bio: 'يمثل مصالح واشنطن السياسية والأمنية في ليبيا.',
    stats: { loyalty: 30, competence: 85, popularity: 30, influence: 85, ambition: 50, corruption: 10 },
    politicalLean: '-', region: null, traits: ['diplomat'] },
  { id: 'amb_eu', name: 'مبعوث الاتحاد الأوروبي', role: 'مبعوث الاتحاد الأوروبي', category: 'foreign', country: 'eu',
    bio: 'يتابع ملفات الهجرة والطاقة والتعاون الاقتصادي.',
    stats: { loyalty: 35, competence: 80, popularity: 35, influence: 75, ambition: 45, corruption: 10 },
    politicalLean: '-', region: null, traits: ['diplomat'] },
  { id: 'amb_russia', name: 'السفير الروسي', role: 'سفير روسيا', category: 'foreign', country: 'russia',
    bio: 'يعزز التعاون العسكري والطاقي بين البلدين.',
    stats: { loyalty: 30, competence: 75, popularity: 25, influence: 70, ambition: 55, corruption: 20 },
    politicalLean: '-', region: null, traits: ['negotiator'] },
  { id: 'amb_china', name: 'السفير الصيني', role: 'سفير الصين', category: 'foreign', country: 'china',
    bio: 'يركز على مشاريع البنية التحتية والاستثمار طويل الأمد.',
    stats: { loyalty: 32, competence: 78, popularity: 28, influence: 68, ambition: 50, corruption: 10 },
    politicalLean: '-', region: null, traits: ['tech_expert'] }
];

const CHARACTER_CATEGORIES = [
  { id: 'government', name: 'الحكومة والوزراء' },
  { id: 'tribal', name: 'قادة القبائل' },
  { id: 'business', name: 'رجال الأعمال' },
  { id: 'media', name: 'قادة الرأي والإعلام' },
  { id: 'opposition', name: 'المعارضة' },
  { id: 'religious', name: 'القادة الدينيون' },
  { id: 'civil', name: 'المجتمع المدني' },
  { id: 'foreign', name: 'ممثلو القوى الأجنبية' }
];

// شبكة العلاقات بين الشخصيات (غير موجهة): موجب = تحالف، سالب = خصومة، مقياس 100-100-
const CHARACTER_RELATIONS = [
  { a: 'zenati', b: 'misrati', value: 60 },
  { a: 'zenati', b: 'suwaidi', value: 45 },
  { a: 'zenati', b: 'opp_leader', value: -55 },
  { a: 'misrati', b: 'tripoli_banker', value: 50 },
  { a: 'misrati', b: 'benghazi_biz', value: -30 },
  { a: 'ftaisi', b: 'benghazi_biz', value: 65 },
  { a: 'ftaisi', b: 'journalist', value: -50 },
  { a: 'gharyani', b: 'obeidi', value: 55 },
  { a: 'gharyani', b: 'zintan_chief', value: 40 },
  { a: 'obeidi', b: 'activist_leader', value: -45 },
  { a: 'warfalla_chief', b: 'magarha_chief', value: 35 },
  { a: 'warfalla_chief', b: 'zintan_chief', value: -25 },
  { a: 'misrata_chief', b: 'zintan_chief', value: -40 },
  { a: 'misrata_chief', b: 'benghazi_biz', value: 30 },
  { a: 'tebu_chief', b: 'tuareg_chief', value: 50 },
  { a: 'tebu_chief', b: 'sabha_trader', value: 35 },
  { a: 'rights_activist', b: 'journalist', value: 55 },
  { a: 'rights_activist', b: 'imam_hardline', value: -60 },
  { a: 'rights_activist', b: 'mufti', value: 20 },
  { a: 'opp_leader', b: 'activist_leader', value: 50 },
  { a: 'opp_leader', b: 'media_anchor', value: 25 },
  { a: 'journalist', b: 'benghazi_biz', value: -55 },
  { a: 'mufti', b: 'imam_hardline', value: -35 },
  { a: 'mufti', b: 'warfalla_chief', value: 30 },
  { a: 'media_anchor', b: 'sallabi', value: 20 },
  { a: 'ngo_leader', b: 'rights_activist', value: 40 },
  { a: 'amb_usa', b: 'amb_russia', value: -50 },
  { a: 'amb_usa', b: 'suwaidi', value: 30 },
  { a: 'amb_china', b: 'sallabi', value: 35 },
  { a: 'amb_russia', b: 'gharyani', value: 25 },
  { a: 'amb_eu', b: 'rights_activist', value: 30 },
  { a: 'tripoli_banker', b: 'zenati', value: 35 },
  { a: 'sabha_trader', b: 'obeidi', value: -20 },
  { a: 'abusetta', b: 'rights_activist', value: 25 },
  { a: 'tarhouni', b: 'ngo_leader', value: 30 }
];

function getCharacterRelations(state, charId) {
  return state.characterRelations
    .filter(r => r.a === charId || r.b === charId)
    .map(r => {
      const otherId = r.a === charId ? r.b : r.a;
      return { otherId, value: r.value };
    })
    .sort((x, y) => Math.abs(y.value) - Math.abs(x.value));
}

// مولّد شخصيات خلَف عند تقاعد/استبدال شخصية بمرور الوقت
const NAME_POOL_FIRST = ['محمد', 'علي', 'عبدالله', 'خالد', 'سالم', 'يوسف', 'إبراهيم', 'عمر', 'فيصل', 'ياسين', 'منى', 'ليلى', 'سمية', 'آمنة', 'هدى', 'رانية', 'نجاة', 'كريم'];
const NAME_POOL_LAST = ['الطرابلسي', 'البنغازي', 'الفزاني', 'المصراتي', 'الزنتاني', 'الورفلي', 'الساحلي', 'الجبلي', 'العبيدي', 'الشريف', 'القبائلي', 'الككلي'];

function generateSuccessor(baseChar) {
  const first = NAME_POOL_FIRST[Math.floor(Math.random() * NAME_POOL_FIRST.length)];
  const last = NAME_POOL_LAST[Math.floor(Math.random() * NAME_POOL_LAST.length)];
  const jitter = () => Math.round((Math.random() - 0.5) * 20);
  const stats = {};
  Object.entries(baseChar.stats).forEach(([k, v]) => { stats[k] = Math.max(10, Math.min(90, v + jitter())); });
  return {
    id: baseChar.id + '_gen' + Date.now() + Math.floor(Math.random() * 1000),
    name: `${first} ${last}`,
    role: baseChar.role,
    category: baseChar.category,
    tribe: baseChar.tribe, region: baseChar.region, country: baseChar.country,
    bio: `خَلَف جديد تولى دور "${baseChar.role}" بعد ${baseChar.name}.`,
    stats, politicalLean: baseChar.politicalLean,
    traits: Math.random() < 0.4 ? [Object.keys(TRAITS)[Math.floor(Math.random() * Object.keys(TRAITS).length)]] : [],
    ministry: null, cooldownUntil: 0, busyUntil: 0
  };
}
