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
