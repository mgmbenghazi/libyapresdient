// رسوم بيانية بسيطة عبر Canvas بدون أي مكتبات خارجية
function drawLineChart(canvas, series, opts) {
  opts = opts || {};
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 120;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  if (!series || series.length < 2) {
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('لا توجد بيانات كافية بعد', 10, cssH / 2);
    return;
  }

  const pad = 8;
  const min = opts.min !== undefined ? opts.min : Math.min(...series);
  const max = opts.max !== undefined ? opts.max : Math.max(...series);
  const range = (max - min) || 1;

  ctx.strokeStyle = opts.color || '#2e7d32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  series.forEach((v, i) => {
    const x = pad + (i / (series.length - 1)) * (cssW - pad * 2);
    const y = cssH - pad - ((v - min) / range) * (cssH - pad * 2);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // منطقة تحت الخط
  ctx.lineTo(cssW - pad, cssH - pad);
  ctx.lineTo(pad, cssH - pad);
  ctx.closePath();
  ctx.fillStyle = (opts.color || '#2e7d32') + '22';
  ctx.fill();
}

// شرارة مصغّرة (sparkline) داخل صف مؤشر واحد - بلا محاور أو شبكة، فقط الاتجاه
function drawSparkline(canvas, series, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 54;
  const cssH = canvas.clientHeight || 22;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (!series || series.length < 2) return;

  const pad = 2;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = (max - min) || 1;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  series.forEach((v, i) => {
    const x = pad + (i / (series.length - 1)) * (cssW - pad * 2);
    const y = cssH - pad - ((v - min) / range) * (cssH - pad * 2);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // نقطة تُبرز آخر قيمة
  const lastX = cssW - pad;
  const lastY = cssH - pad - ((series[series.length - 1] - min) / range) * (cssH - pad * 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
  ctx.fill();
}

// رسم عدة سلاسل متراكبة بألوان مختلفة (لوحة الاتجاهات القابلة للاختيار) مع شبكة خفيفة
function drawMultiLineChart(canvas, seriesList, colors) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 150;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const validSeries = seriesList.filter(s => s && s.length >= 2);
  if (validSeries.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('اختر مؤشراً واحداً على الأقل', 10, cssH / 2);
    return;
  }

  const pad = 10;

  ctx.strokeStyle = 'rgba(255,255,255,.06)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const y = pad + (i / 4) * (cssH - pad * 2);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke();
  }

  // كل مؤشر يُقاس بمداه الخاص (لا مدى مشترك) - وإلا فإن مؤشراً كالدين العام (مدى ضيق)
  // يظهر شبه مسطح عند مقارنته بمؤشر كرضا الشعب (مدى واسع) رغم أن حركته الفعلية قد تكون كبيرة نسبياً
  validSeries.forEach((series, si) => {
    const color = colors[si % colors.length];
    const sMin = Math.min(...series);
    const sMax = Math.max(...series);
    const sRange = (sMax - sMin) || 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    series.forEach((v, i) => {
      const x = pad + (i / (series.length - 1)) * (cssW - pad * 2);
      const y = cssH - pad - ((v - sMin) / sRange) * (cssH - pad * 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    const lastX = cssW - pad;
    const lastY = cssH - pad - ((series[series.length - 1] - sMin) / sRange) * (cssH - pad * 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// رسم خطين متراكبين (مثل الإيرادات مقابل النفقات) بمقياس مشترك
function drawDualLineChart(canvas, seriesA, seriesB, colorA, colorB) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 300;
  const cssH = canvas.clientHeight || 120;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  if (!seriesA || seriesA.length < 2) {
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('لا توجد بيانات كافية بعد', 10, cssH / 2);
    return;
  }

  const pad = 8;
  const all = [...seriesA, ...seriesB];
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 1);
  const range = (max - min) || 1;

  function drawLine(series, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    series.forEach((v, i) => {
      const x = pad + (i / (series.length - 1)) * (cssW - pad * 2);
      const y = cssH - pad - ((v - min) / range) * (cssH - pad * 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  drawLine(seriesA, colorA);
  drawLine(seriesB, colorB);
}

function drawGauge(canvas, value, min, max, color) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 100;
  const cssH = canvas.clientHeight || 60;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const cx = cssW / 2, cy = cssH - 5, r = Math.min(cssW / 2, cssH) - 8;
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.stroke();

  ctx.strokeStyle = color || '#2e7d32';
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI + pct * Math.PI);
  ctx.stroke();
}
