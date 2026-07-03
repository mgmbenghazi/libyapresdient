// الفاعلون الداخليون والدوليون - كل كيان له مؤشرات على مقياس 0-100
const TRIBES = [
  { id: 'warfalla', name: 'ورفلة', region: 'east', loyalty: 55 },
  { id: 'magarha', name: 'المقارحة', region: 'east', loyalty: 52 },
  { id: 'zintan', name: 'الزنتان', region: 'west', loyalty: 50 },
  { id: 'misrata', name: 'مصراتة', region: 'west', loyalty: 58 },
  { id: 'tebu', name: 'التبو', region: 'south', loyalty: 45 },
  { id: 'tuareg', name: 'الطوارق', region: 'south', loyalty: 45 }
];

const PARTIES = [
  { id: 'islamist', name: 'التيار الإسلامي', support: 45 },
  { id: 'liberal', name: 'التيار الليبرالي', support: 40 },
  { id: 'nationalist', name: 'التيار القومي', support: 42 },
  { id: 'conservative', name: 'التيار المحافظ', support: 48 }
];

const INSTITUTIONS = [
  { id: 'parliament', name: 'البرلمان', legitimacy: 50 },
  { id: 'judiciary', name: 'القضاء', legitimacy: 48 },
  { id: 'military', name: 'المؤسسة العسكرية', legitimacy: 55 },
  { id: 'central_bank', name: 'البنك المركزي', legitimacy: 52 }
];

const NEIGHBOR_COUNTRIES = [
  { id: 'egypt', name: 'مصر', group: 'neighbor', relation: 55 },
  { id: 'tunisia', name: 'تونس', group: 'neighbor', relation: 58 },
  { id: 'algeria', name: 'الجزائر', group: 'neighbor', relation: 52 },
  { id: 'chad', name: 'تشاد', group: 'neighbor', relation: 45 },
  { id: 'niger', name: 'النيجر', group: 'neighbor', relation: 45 },
  { id: 'sudan', name: 'السودان', group: 'neighbor', relation: 48 }
];

const REGIONAL_COUNTRIES = [
  { id: 'gulf', name: 'دول الخليج', group: 'regional', relation: 50 },
  { id: 'turkey', name: 'تركيا', group: 'regional', relation: 50 },
  { id: 'italy', name: 'إيطاليا', group: 'regional', relation: 55 }
];

const GLOBAL_POWERS = [
  { id: 'usa', name: 'الولايات المتحدة', group: 'global', relation: 48 },
  { id: 'eu', name: 'الاتحاد الأوروبي', group: 'global', relation: 50 },
  { id: 'russia', name: 'روسيا', group: 'global', relation: 45 },
  { id: 'china', name: 'الصين', group: 'global', relation: 48 }
];

const ORGANIZATIONS = [
  { id: 'un', name: 'الأمم المتحدة', relation: 52 },
  { id: 'african_union', name: 'الاتحاد الأفريقي', relation: 50 },
  { id: 'arab_league', name: 'جامعة الدول العربية', relation: 55 },
  { id: 'opec', name: 'منظمة أوبك', relation: 55 },
  { id: 'imf', name: 'صندوق النقد الدولي', relation: 45 }
];

const ALL_COUNTRIES = [...NEIGHBOR_COUNTRIES, ...REGIONAL_COUNTRIES, ...GLOBAL_POWERS];
