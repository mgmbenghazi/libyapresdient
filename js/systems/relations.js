// نظام العلاقات الداخلية والدولية - انجراف شهري بسيط يعكس الوضع العام
function monthlyRelationsTick(state) {
  const ind = state.indicators;

  state.relations.tribes.forEach(t => {
    t.loyalty = clampIndicator('security', t.loyalty * 0.95 + (ind.satisfaction * 0.5 + ind.politicalStability * 0.5) * 0.05 + (Math.random() - 0.5) * 2);
  });
  state.relations.parties.forEach(p => {
    p.support = clampIndicator('security', p.support * 0.95 + ind.politicalStability * 0.05 + (Math.random() - 0.5) * 2);
  });
  state.relations.institutions.forEach(i => {
    i.legitimacy = clampIndicator('security', i.legitimacy * 0.96 + ind.politicalStability * 0.04 + (Math.random() - 0.5) * 1.5);
  });
  state.relations.countries.forEach(c => {
    c.relation = clampIndicator('security', c.relation * 0.97 + ind.internationalSupport * 0.03 + (Math.random() - 0.5) * 1.5);
  });
  state.relations.orgs.forEach(o => {
    o.relation = clampIndicator('security', o.relation * 0.97 + ind.internationalSupport * 0.03 + (Math.random() - 0.5) * 1.5);
  });
}
