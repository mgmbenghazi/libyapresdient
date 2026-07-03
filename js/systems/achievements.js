// نظام الإنجازات - يُفحص كل شهر، يُسجَّل الإنجاز مرة واحدة فقط لكل لعبة
function checkAchievements(state) {
  const unlocked = [];
  ACHIEVEMENTS.forEach(a => {
    if (state.achievements.includes(a.id)) return;
    if (a.check(state)) {
      state.achievements.push(a.id);
      unlocked.push(a);
    }
  });
  return unlocked;
}
