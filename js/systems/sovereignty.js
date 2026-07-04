// السيادة المنقسمة: سلطة موازية حقيقية بجيشها وداعميها الأجانب (لا مجرد منافس انتخابي)، ومؤسستان
// سياديتان منقسمتان (المصرف المركزي وشركة النفط) تُستخدمان كأداة ضغط سياسي، ومسار انتخابات موحدة
// قابل للانهيار مراراً - يُحسب مرة كل شهر إلى جانب المحرك الاقتصادي، ويعيد تسجيل بعض تأثيراته
// كسطور شفافية سببية داخل monthlyEconomicTick (انظر economy.js) بدل مصفوفة منفصلة

function averageCountryRelation(state, ids) {
  const countries = ids.map(id => state.relations.countries.find(c => c.id === id)).filter(Boolean);
  return countries.length ? countries.reduce((a, c) => a + c.relation, 0) / countries.length : 50;
}

function monthlySovereigntyTick(state) {
  const sov = state.sovereignty;
  if (!sov) return;
  const ind = state.indicators;

  // 1) قوة السلطة الموازية: كلما ساءت علاقتك بداعميها الأجانب (روسيا/مصر/الخليج) زاد شعورهم بالحاجة
  // لتقويتها كثقل موازن، وكلما تحسنت هذه العلاقة خفّ اندفاعهم - هذا هو منطق الدعم بالوكالة فعلياً
  const avgRivalBackerRelation = averageCountryRelation(state, sov.rivalBackers);
  const rivalBackingDrift = (50 - avgRivalBackerRelation) / 40;
  sov.rivalMilitaryStrength = Math.max(5, Math.min(95, sov.rivalMilitaryStrength + rivalBackingDrift + rnd(-1, 1)));

  // 2) السيطرة الفعلية على الأرض: أمنك ودعم حليفك الخارجي (تركيا) يوسّعانها، وقوة الخصم المتصاعدة تُضيّقها
  const avgPlayerBackerRelation = averageCountryRelation(state, sov.playerBackers);
  const playerBackingBonus = (avgPlayerBackerRelation - 50) / 30;
  const controlDrift = (ind.security - 50) / 200 + playerBackingBonus * 0.3 - (sov.rivalMilitaryStrength - 50) / 250;
  sov.territoryControl = Math.max(15, Math.min(95, sov.territoryControl + controlDrift));

  // 3) الحصار النفطي: تهديد حقيقي لا نص سردي - يتصاعد احتماله فقط عند توتر حقيقي (خصم قوي + عدم استقرار
  // سياسي)، وعدّاد أشهر متتالية من التوتر المرتفع (لا رمية نرد شهرية معزولة) يفتح حدثاً يمنح اللاعب خياراً فعلياً
  if (!sov.oilBlockade) sov.oilBlockade = { active: false, monthsLeft: 0 };
  if (sov.oilBlockade.active) {
    sov.oilBlockade.monthsLeft--;
    if (sov.oilBlockade.monthsLeft <= 0) sov.oilBlockade = { active: false, monthsLeft: 0 };
  }
  if (!state.engineStreaks) state.engineStreaks = { austerity: 0, securityNeglect: 0, fxReserveCrisis: 0, sovereigntyTension: 0 };
  const tensionScore = sov.rivalMilitaryStrength * 0.5 + (100 - ind.politicalStability) * 0.3 + (100 - sov.territoryControl) * 0.2;
  if (!sov.oilBlockade.active && tensionScore > 60) {
    state.engineStreaks.sovereigntyTension = (state.engineStreaks.sovereigntyTension || 0) + 1;
  } else {
    state.engineStreaks.sovereigntyTension = 0;
  }
  if (state.engineStreaks.sovereigntyTension === 3) {
    scheduleFollowUp(state, { id: 'oil_blockade_crisis', kind: 'event', monthsFromNow: 1 });
  }

  // 4) مسار الانتخابات الموحدة: يتقدم ببطء مع الاستقرار، وقد ينهار فجأة كما حدث فعلياً أكثر من مرة
  // منذ تأجيل انتخابات ديسمبر 2021 - القوة العسكرية للخصم تزيد احتمال الانهيار حين يقترب الاستحقاق
  if (sov.unifiedElectionsProgress < 100) {
    sov.unifiedElectionsProgress = Math.min(100, sov.unifiedElectionsProgress + 0.4 + (ind.politicalStability - 50) / 300);
    const derailChance = 0.01 + Math.max(0, sov.rivalMilitaryStrength - 50) / 3000;
    if (sov.unifiedElectionsProgress > 30 && Math.random() < derailChance) {
      sov.unifiedElectionsProgress = Math.max(0, sov.unifiedElectionsProgress - 25);
      sov.unifiedElectionsDerailments = (sov.unifiedElectionsDerailments || 0) + 1;
    }
  }
}

// اللحظة الحاسمة: إعادة توحيد ليبيا فعلياً بعد اكتمال مسار الانتخابات الموحدة - نتيجة حقيقية تُحسم من
// ميزان القوى الفعلي على الأرض (سيطرتك مقابل قوة السلطة الموازية)، لا رمية حظ عشوائية على استحقاق تاريخي
function resolveUnification(state) {
  const sov = state.sovereignty;
  const success = sov.territoryControl > sov.rivalMilitaryStrength + 10;
  if (success) {
    sov.territoryControl = Math.min(96, sov.territoryControl + 30);
    sov.rivalMilitaryStrength = Math.max(5, sov.rivalMilitaryStrength - 30);
    sov.centralBankSplit = false;
    sov.nocSplit = false;
    sov.reunified = true;
    applyEffects(state, { politicalStability: 15, internationalSupport: 10, satisfaction: 8 });
  } else {
    sov.unifiedElectionsProgress = 0;
    sov.unifiedElectionsDerailments = (sov.unifiedElectionsDerailments || 0) + 1;
    sov.rivalMilitaryStrength = Math.min(95, sov.rivalMilitaryStrength + 10);
    applyEffects(state, { politicalStability: -12, satisfaction: -6 });
  }
  return { success, territoryControl: Math.round(sov.territoryControl), rivalMilitaryStrength: Math.round(sov.rivalMilitaryStrength) };
}
