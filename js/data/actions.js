// إجراءات رئاسية يبادر بها اللاعب بنفسه في أي شهر - بخلاف القرارات/الأحداث التي تُعرض عليه فقط،
// هذه أدوات استباقية تُستهلك من "رأس المال السياسي" (state.politicalCapital) ولها تبريد خاص بها
// (state.actionCooldowns)، فتحوّل اللعبة من رد فعل بحت إلى مبادرة فعلية من الرئيس
function mostCorruptCabinetMember(state) {
  const holders = Object.values(state.cabinet).filter(Boolean).map(id => getCharacter(state, id)).filter(Boolean);
  if (!holders.length) return null;
  return holders.reduce((max, c) => (c.stats.corruption > max.stats.corruption ? c : max));
}

function leastLoyalCabinetMember(state) {
  const holders = Object.values(state.cabinet).filter(Boolean).map(id => getCharacter(state, id)).filter(Boolean);
  if (!holders.length) return null;
  return holders.reduce((min, c) => (c.stats.loyalty < min.stats.loyalty ? c : min));
}

const ACTIONS = [
  {
    id: 'media_campaign', name: 'حملة إعلامية', icon: '📢', cost: 20, cooldown: 3,
    description: 'حملة دعائية مكثفة لتحسين صورتك أمام الرأي العام - أثر فوري لكن مؤقت إن لم يدعمه إنجاز حقيقي.',
    execute(state) {
      applyEffects(state, { satisfaction: 5 });
      scheduleEffects(state, { satisfaction: -2 }, 3); // الأثر الدعائي البحت يتلاشى إن لم يُسانده تحسن فعلي
      return { message: 'ارتفع الرضا الشعبي مؤقتاً بفعل الحملة الإعلامية.' };
    }
  },
  {
    id: 'corruption_probe', name: 'تحقيق فساد', icon: '🔍', cost: 30, cooldown: 6,
    description: 'تفتح تحقيقاً رسمياً ضد أكثر أعضاء حكومتك تورطاً بشبهات فساد - نجاحه يطهّر الإدارة، وفشله يكلفك سياسياً.',
    condition: s => Object.values(s.cabinet).some(Boolean),
    execute(state) {
      const target = mostCorruptCabinetMember(state);
      if (!target) return { message: 'لا يوجد وزراء حاليون لفتح تحقيق ضدهم.' };
      const successChance = 0.4 + (state.indicators.security / 250);
      if (Math.random() < successChance) {
        target.stats.corruption = clampStat(target.stats.corruption - 25);
        applyEffects(state, { satisfaction: 3, politicalStability: 1 });
        return { message: `كشف التحقيق فساد ${target.name} وأُجبر على إصلاح ممارساته - ثقة الشارع تتحسن.` };
      }
      applyEffects(state, { politicalStability: -3, satisfaction: -1 });
      target.stats.loyalty = clampStat(target.stats.loyalty - 10);
      return { message: `تعثّر التحقيق في إثبات فساد ${target.name}، وارتدّ الأمر عليك سياسياً.` };
    }
  },
  {
    id: 'emergency_legislation', name: 'مبادرة تشريعية عاجلة', icon: '📜', cost: 25, cooldown: 8,
    description: 'تستخدم نفوذك لتمرير إصلاح إداري عاجل متجاوزاً الإجراءات الاعتيادية - يُسرّع التنمية بثمن استياء سياسي من تجاوز المؤسسات.',
    execute(state) {
      applyEffects(state, { economicDevelopment: 3, politicalStability: -2 });
      return { message: 'مُرِّر الإصلاح الإداري العاجل بأمر رئاسي مباشر.' };
    }
  },
  {
    id: 'secret_deal', name: 'صفقة سرية', icon: '🤝', cost: 35, cooldown: 6,
    description: 'تفتح قناة تفاوض سرية مع الجهة الأقل تجاوباً معك دولياً أو إقليمياً لتحسين العلاقة فوراً دون انتظار مهلة التواصل المعتادة.',
    execute(state) {
      const target = lowestCountryInGroup(state, 'neighbor') || lowestCountryInGroup(state, 'global');
      if (!target) return { message: 'لا توجد جهة مناسبة حالياً لعقد صفقة معها.' };
      applyRelationsEffect(state, { type: 'country', id: target.id, delta: 15 });
      return { message: `أثمرت القناة السرية عن تحسّن ملموس في العلاقة مع ${target.name}.` };
    }
  },
  {
    id: 'reward_loyalty', name: 'دعم حليف في الحكومة', icon: '🎖️', cost: 15, cooldown: 4,
    description: 'تمنح امتيازات ومكافآت مباشرة لأقل أعضاء حكومتك ولاءً، محاولاً استعادة ثقته قبل أن ينقلب عليك.',
    condition: s => Object.values(s.cabinet).some(Boolean),
    execute(state) {
      const target = leastLoyalCabinetMember(state);
      if (!target) return { message: 'لا يوجد وزراء حاليون لدعمهم.' };
      target.stats.loyalty = clampStat(target.stats.loyalty + 15);
      return { message: `منحت ${target.name} امتيازات خاصة لتعزيز ولائه - تحسّن ولاؤه ملموساً.` };
    }
  },
  {
    id: 'intelligence_sweep', name: 'تحرّك استخباراتي', icon: '🕵️', cost: 25, cooldown: 3,
    description: 'تكلّف جهاز الاستخبارات بمسح دقيق بحثاً عن أي مؤامرة أو تخطيط سري ضد حكمك قبل أن يستفحل.',
    execute(state) {
      return revealActiveScheme(state);
    }
  },
  {
    id: 'fx_intervention', name: 'تدخل مباشر في سوق الصرف', icon: '💱', cost: 25, cooldown: 4,
    description: 'يبيع المصرف المركزي جزءاً من احتياطي النقد الأجنبي مباشرة في السوق لدعم العملة المحلية وكبح التضخم فوراً - أداة سريعة لكنها تستهلك مورداً محدوداً.',
    condition: s => s.indicators.forexReserves > 1000,
    execute(state) {
      const reservesSpent = Math.min(state.indicators.forexReserves, 4000);
      state.indicators.forexReserves = Math.max(0, state.indicators.forexReserves - reservesSpent);
      const inflationCut = (reservesSpent / 4000) * 3;
      state.indicators.inflation = clampIndicator('inflation', state.indicators.inflation - inflationCut);
      state.indicators.politicalStability = clampIndicator('politicalStability', state.indicators.politicalStability + 1);
      return { message: `أنفق المصرف المركزي ${Math.round(reservesSpent)} مليون د.ل من الاحتياطي لدعم العملة، فتراجع التضخم فوراً بمقدار ${inflationCut.toFixed(1)} نقطة.` };
    }
  }
];

// تجدد شهري لرأس المال السياسي - يرتفع مع الرضا والاستقرار، وينخفض تلقائياً في الأزمات
// (سقف 150 كي لا يتحول لمورد لا نهائي يُغني عن أي مفاضلة استراتيجية)
function updatePoliticalCapital(state) {
  const ind = state.indicators;
  const regen = 4 + (ind.satisfaction - 50) / 20 + (ind.politicalStability - 50) / 25;
  state.politicalCapital = Math.max(0, Math.min(150, state.politicalCapital + regen));
}

function getAvailableActions(state) {
  return ACTIONS.filter(a => !a.condition || a.condition(state));
}

function applyAction(state, actionId) {
  const action = ACTIONS.find(a => a.id === actionId);
  if (!action) return { ok: false, reason: 'إجراء غير معروف.' };
  if (state.actionCooldowns[actionId] && state.month < state.actionCooldowns[actionId]) {
    return { ok: false, reason: 'هذا الإجراء ما زال في فترة التبريد.' };
  }
  if (state.politicalCapital < action.cost) {
    return { ok: false, reason: 'رأس المال السياسي غير كافٍ لهذا الإجراء.' };
  }
  state.politicalCapital = Math.max(0, state.politicalCapital - action.cost);
  state.actionCooldowns[actionId] = state.month + action.cooldown;
  const result = action.execute(state) || {};
  if (!state.actionsLog) state.actionsLog = [];
  state.actionsLog.push({ month: state.month, year: state.year, actionId, title: action.name, message: result.message || '' });
  return { ok: true, message: result.message || '' };
}
