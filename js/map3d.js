// الخريطة المجسمة التفاعلية: مشهد three.js (مضمَّن محلياً في assets/vendor بلا أي CDN) يعرض ليبيا
// بحدودها الجغرافية الحقيقية وتضاريسها الفعلية - سهل ساحلي، جبل نفوسة غرباً، الجبل الأخضر شرقاً،
// الحرّوج البركاني وسطاً، سفوح تيبستي جنوباً، وبحور الرمال (أوباري ومرزق) - مبنية من شبكة ارتفاعات
// مقصوصة على مضلع الدولة نفسه، مع بحر متوسط متموج وقبة سماء وضباب جوي وظلال ناعمة.
// كل التلوين يمر عبر regionLayerValue نفسها المستخدمة في الخريطة المسطحة - مصدر حقيقة واحد للطبقتين.

const Map3D = {
  ready: false,
  supported: true,
  visible: false,
  layer: 'loyalty',
  _raf: null,
  _cinematic: null,

  // ------- الجغرافيا الحقيقية (خط الطول، دائرة العرض) -------
  // حدود ليبيا مبسّطة لكنها واقعية: الساحل المتوسطي بخليج سرت، ثم الحدود المصرية جنوباً،
  // فالحدود السودانية/التشادية/النيجرية جنوباً، ثم الجزائرية وتونس شمالاً
  LIBYA_OUTLINE: [
    [11.50, 33.18], [12.10, 32.92], [12.70, 32.80], [13.19, 32.90], [13.80, 32.75],
    [14.50, 32.60], [15.10, 32.38], [15.30, 31.80], [15.75, 31.35], [16.60, 31.20],
    [17.50, 30.95], [18.50, 30.60], [19.20, 30.40], [19.80, 30.62], [20.00, 31.10],
    [20.05, 31.65], [20.07, 32.12], [20.60, 32.55], [21.50, 32.85], [22.20, 32.95],
    [22.64, 32.77], [23.30, 32.55], [23.95, 32.09], [24.70, 31.90], [25.15, 31.63],
    [25.15, 30.00], [25.00, 29.00], [25.00, 25.00], [25.00, 22.00],
    [24.00, 20.00], [23.50, 19.60], [23.00, 19.50], [20.00, 21.50], [18.50, 21.80],
    [16.00, 23.00], [15.50, 23.20], [15.00, 23.40], [14.20, 22.60], [13.50, 23.00],
    [12.00, 23.50], [11.50, 24.30], [10.80, 24.50], [10.30, 24.20],
    [9.40, 26.00], [9.50, 27.00], [9.80, 28.00], [9.30, 29.00], [9.50, 30.20],
    [9.80, 30.40], [10.30, 30.80], [10.10, 31.50], [10.30, 32.00], [10.60, 32.50],
    [11.00, 32.90]
  ],

  // الأقاليم الثلاثة تُقسّم الدولة فعلياً: طرابلس والغرب، بنغازي والشرق، فزان والجنوب
  REGION_POLYS: {
    west: [
      [11.50, 33.18], [12.10, 32.92], [12.70, 32.80], [13.19, 32.90], [13.80, 32.75],
      [14.50, 32.60], [15.10, 32.38], [15.30, 31.80], [15.75, 31.35], [16.60, 31.20],
      [16.60, 29.00], [9.35, 29.00], [9.50, 30.20], [9.80, 30.40], [10.30, 30.80],
      [10.10, 31.50], [10.30, 32.00], [10.60, 32.50], [11.00, 32.90]
    ],
    east: [
      [16.60, 31.20], [17.50, 30.95], [18.50, 30.60], [19.20, 30.40], [19.80, 30.62],
      [20.00, 31.10], [20.05, 31.65], [20.07, 32.12], [20.60, 32.55], [21.50, 32.85],
      [22.20, 32.95], [22.64, 32.77], [23.30, 32.55], [23.95, 32.09], [24.70, 31.90],
      [25.15, 31.63], [25.15, 30.00], [25.00, 29.00], [16.60, 29.00]
    ],
    south: [
      [9.35, 29.00], [16.60, 29.00], [25.00, 29.00], [25.00, 25.00], [25.00, 22.00],
      [24.00, 20.00], [23.50, 19.60], [23.00, 19.50], [20.00, 21.50], [18.50, 21.80],
      [16.00, 23.00], [15.50, 23.20], [15.00, 23.40], [14.20, 22.60], [13.50, 23.00],
      [12.00, 23.50], [11.50, 24.30], [10.80, 24.50], [10.30, 24.20],
      [9.40, 26.00], [9.50, 27.00], [9.80, 28.00], [9.30, 29.00]
    ]
  },

  // تضاريس ليبيا الفعلية: مرتفعات حقيقية بمواقعها ونطاقاتها التقريبية
  RELIEF: [
    { lon: 12.8, lat: 31.9, r: 1.35, h: 0.55 },  // جبل نفوسة
    { lon: 21.6, lat: 32.35, r: 1.50, h: 0.52 }, // الجبل الأخضر
    { lon: 17.5, lat: 27.2, r: 2.20, h: 0.46 },  // الحرّوج الأسود البركاني
    { lon: 23.2, lat: 21.6, r: 2.90, h: 1.15 },  // سفوح تيبستي (أعلى نقطة في البلاد)
    { lon: 10.6, lat: 24.9, r: 1.70, h: 0.62 },  // جبال أكاكوس/تدرارت
    { lon: 11.6, lat: 29.6, r: 2.00, h: 0.34 },  // حمادة الحمراء
    { lon: 21.5, lat: 24.5, r: 2.40, h: 0.30 }   // هضبة الكفرة
  ],
  // بحور الرمال: تموّج كثبان أنعم وأوسع بدل قمم صخرية حادة
  DUNE_SEAS: [
    { lon: 12.5, lat: 26.5, r: 2.2, h: 0.20 },   // بحر الرمال الأوباري
    { lon: 13.6, lat: 24.6, r: 2.0, h: 0.18 }    // بحر رمال مرزق
  ],

  CITIES: [
    { id: 'tripoli', name: 'طرابلس', region: 'west', lon: 13.19, lat: 32.88, size: 1.0 },
    { id: 'benghazi', name: 'بنغازي', region: 'east', lon: 20.07, lat: 32.12, size: 0.9 },
    { id: 'sebha', name: 'سبها', region: 'south', lon: 14.43, lat: 27.04, size: 0.7 },
    { id: 'misrata', name: 'مصراتة', region: 'west', lon: 15.09, lat: 32.38, size: 0.65 },
    { id: 'tobruk', name: 'طبرق', region: 'east', lon: 23.95, lat: 32.09, size: 0.55 },
    { id: 'sirte', name: 'سرت', region: 'west', lon: 16.59, lat: 31.20, size: 0.55 }
  ],
  LABELED_CITIES: ['tripoli', 'benghazi', 'sebha'],

  // الهلال النفطي: حقول وموانئ التصدير الحقيقية شرق خليج سرت
  OIL_FIELDS: [
    { lon: 18.20, lat: 30.20 }, // مرافق السدرة/راس لانوف
    { lon: 19.60, lat: 29.10 }, // حقول الواحة
    { lon: 21.10, lat: 28.20 }, // حقول السرير/المسلة
    { lon: 20.30, lat: 30.60 }  // البريقة
  ],

  // ------- الإسقاط: مركز ليبيا مع تصحيح تقارب خطوط الطول -------
  CENTER_LON: 17.3, CENTER_LAT: 26.4, SCALE: 1.62, ELEV_SCALE: 2.9,
  _proj(lon, lat) {
    return {
      x: (lon - this.CENTER_LON) * Math.cos(this.CENTER_LAT * Math.PI / 180) * this.SCALE,
      z: -(lat - this.CENTER_LAT) * this.SCALE
    };
  },
  _unproj(x, z) {
    return {
      lon: x / (Math.cos(this.CENTER_LAT * Math.PI / 180) * this.SCALE) + this.CENTER_LON,
      lat: -z / this.SCALE + this.CENTER_LAT
    };
  },

  _pointInPoly(lon, lat, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  },

  // أقرب مسافة (بالدرجات) إلى حدود الدولة - تُستخدم لجعل الأرض تنحدر طبيعياً نحو الساحل بدل جرف عمودي
  _distToOutline(lon, lat) {
    let best = Infinity;
    const o = this.LIBYA_OUTLINE;
    const kx = Math.cos(lat * Math.PI / 180);
    for (let i = 0, j = o.length - 1; i < o.length; j = i++) {
      const ax = (o[j][0] - lon) * kx, ay = o[j][1] - lat;
      const bx = (o[i][0] - lon) * kx, by = o[i][1] - lat;
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      let t = len2 > 0 ? -(ax * dx + ay * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = ax + dx * t, py = ay + dy * t;
      const d2 = px * px + py * py;
      if (d2 < best) best = d2;
    }
    return Math.sqrt(best);
  },

  _elevation(lon, lat) {
    let h = 0.26; // قاعدة الهضبة الصحراوية - يجب أن تعلو سعة موج البحر بوضوح
    const kx = Math.cos(lat * Math.PI / 180);
    this.RELIEF.forEach(r => {
      const dx = (lon - r.lon) * kx, dy = lat - r.lat;
      h += r.h * Math.exp(-(dx * dx + dy * dy) / (r.r * r.r));
    });
    this.DUNE_SEAS.forEach(d => {
      const dx = (lon - d.lon) * kx, dy = lat - d.lat;
      const fall = Math.exp(-(dx * dx + dy * dy) / (d.r * d.r));
      h += fall * (d.h + 0.045 * Math.sin(lon * 6.1) * Math.cos(lat * 5.3));
    });
    // تفاصيل دقيقة تكسر الملمس المثالي وتمنح السطح إحساس صحراء حقيقية
    h += 0.022 * Math.sin(lon * 2.4 + 1.1) * Math.cos(lat * 2.8);
    h += 0.012 * Math.sin(lon * 5.7 + lat * 4.1);
    h += 0.007 * Math.sin(lon * 11.3 + 2.0) * Math.sin(lat * 9.7);
    h += 0.004 * Math.cos(lon * 17.1 + lat * 13.9);
    return h;
  },

  _regionAt(lon, lat) {
    if (this._pointInPoly(lon, lat, this.REGION_POLYS.south)) return 'south';
    if (this._pointInPoly(lon, lat, this.REGION_POLYS.west)) return 'west';
    if (this._pointInPoly(lon, lat, this.REGION_POLYS.east)) return 'east';
    return lat < 29 ? 'south' : (lon < 16.6 ? 'west' : 'east');
  },

  STATUS_COLORS: { good: 0x4fbf6a, medium: 0xe0a72b, bad: 0xe5484d },
  REGION_IDS: ['west', 'east', 'south'],

  init() {
    if (this.ready || !this.supported) return this.ready;
    const canvas = document.getElementById('libya-map-3d');
    if (!canvas || typeof THREE === 'undefined') { this.supported = false; return false; }
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch (e) {
      this.supported = false;
      return false;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    // إخراج سينمائي: تعيين نغمي ACES ومساحة ألوان sRGB وظلال ناعمة - الفارق الأكبر في "الإحساس" البصري
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.86;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false; // تُحدَّث يدوياً عند تغيّر الحالة فقط لا في كل إطار

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x9fb6c4, 0.014);
    this.camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.5, 300);
    this.orbit = { yaw: 0, pitch: 0.72, radius: 30 };
    this.orbitTarget = { ...this.orbit }; // هدف يُلاحَق بتنعيم - حركة كاميرا سلسة لا قفزات
    this._applyOrbit();

    this._buildSky();
    this._buildLights();
    this._buildTerrain();
    this._buildSea();
    this._buildBorders();
    this._buildCities();
    this._buildOilFields();
    this._buildUnits();

    this.raycaster = new THREE.Raycaster();
    this._bindInteraction(canvas);
    if (typeof IntersectionObserver !== 'undefined') {
      const wrap = document.getElementById('map-3d-wrap');
      if (wrap) new IntersectionObserver(es => { this._offscreen = !es[0].isIntersecting; }, { threshold: 0.02 }).observe(wrap);
    }
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this.ready = true;
    return true;
  },

  _buildSky() {
    const cv = document.createElement('canvas');
    cv.width = 8; cv.height = 128;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0.00, '#1a3a5c');
    g.addColorStop(0.42, '#5b86a8');
    g.addColorStop(0.68, '#c2cfd4');
    g.addColorStop(1.00, '#e6d9c2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(140, 24, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })
    );
    this.scene.add(this.sky);
  },

  _buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xa9c6dc, 0x5d4f37, 0.22));
    const sun = new THREE.DirectionalLight(0xfff0d4, 0.88);
    sun.position.set(-14, 26, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    const s = sun.shadow.camera;
    s.left = -22; s.right = 22; s.top = 22; s.bottom = -22; s.near = 1; s.far = 70;
    sun.shadow.bias = -0.0016;
    this.scene.add(sun);
    this.sun = sun;
    const rim = new THREE.DirectionalLight(0x8fb8d8, 0.22);
    rim.position.set(12, 8, -16);
    this.scene.add(rim);
  },

  // الأرض: شبكة ارتفاعات مقصوصة على مضلع ليبيا نفسه - المثلثات خارج الحدود تُسقَط كلياً،
  // فينتج شكل الدولة الحقيقي بتضاريسه بدل مضلع مبثوق مسطح
  _buildTerrain() {
    const GW = 196, GH = 172;
    const lon0 = 9.0, lon1 = 25.4, lat0 = 19.2, lat1 = 33.4;
    const vCount = (GW + 1) * (GH + 1);
    const pos = new Float32Array(vCount * 3);
    const col = new Float32Array(vCount * 3);
    const inside = new Uint8Array(vCount);
    const regionIdx = new Uint8Array(vCount);
    const baseRGB = new Float32Array(vCount * 3);
    const shade = new Float32Array(vCount);

    for (let j = 0; j <= GH; j++) {
      const lat = lat0 + (lat1 - lat0) * (j / GH);
      for (let i = 0; i <= GW; i++) {
        const lon = lon0 + (lon1 - lon0) * (i / GW);
        const vi = j * (GW + 1) + i;
        const isIn = this._pointInPoly(lon, lat, this.LIBYA_OUTLINE);
        inside[vi] = isIn ? 1 : 0;
        const p = this._proj(lon, lat);
        let y = 0;
        if (isIn) {
          // انحدار طبيعي نحو الحدود: الأرض تنزل تدريجياً حتى مستوى البحر عند الساحل
          const d = this._distToOutline(lon, lat);
          const edge = Math.min(1, d / 0.85);
          const edgeFade = edge * edge * (3 - 2 * edge);
          y = this._elevation(lon, lat) * edgeFade * this.ELEV_SCALE;
          regionIdx[vi] = this.REGION_IDS.indexOf(this._regionAt(lon, lat));
        }
        pos[vi * 3] = p.x; pos[vi * 3 + 1] = y; pos[vi * 3 + 2] = p.z;

        // لون الأرض الأساسي: رمال ساحلية فاتحة ← صخر داكن مع الارتفاع، وخضرة خفيفة على الجبل الأخضر
        const t = Math.min(1, Math.max(0, (y - 0.55) / (this.ELEV_SCALE * 0.95)));
        let r = 0.76 - t * 0.34, g2 = 0.62 - t * 0.30, b = 0.38 - t * 0.16;
        const greenBelt = Math.exp(-(Math.pow(lon - 21.6, 2) + Math.pow(lat - 32.35, 2)) / 2.2)
          + Math.exp(-(Math.pow(lon - 12.8, 2) + Math.pow(lat - 31.9, 2)) / 2.0);
        r -= greenBelt * 0.16; g2 += greenBelt * 0.06; b -= greenBelt * 0.10;
        baseRGB[vi * 3] = Math.max(0.12, r);
        baseRGB[vi * 3 + 1] = Math.max(0.12, g2);
        baseRGB[vi * 3 + 2] = Math.max(0.08, b);
        shade[vi] = 0.72 + 0.55 * t;
      }
    }

    const idx = [];
    for (let j = 0; j < GH; j++) {
      for (let i = 0; i < GW; i++) {
        const a = j * (GW + 1) + i, b = a + 1, c = a + (GW + 1), d = c + 1;
        // ترتيب الرؤوس عكس عقارب الساعة نظراً لأن z يتناقص مع تقدّم الصفوف شمالاً - وإلا اتجهت
        // الأوجه للأسفل وقُصّت بالكامل (backface culling) فبدت الأرض غائبة والبحر ظاهراً مكانها
        const n = inside[a] + inside[b] + inside[c] + inside[d];
        if (n === 4) {
          idx.push(a, b, c, b, d, c);
        } else if (n === 3) {
          // ربع حدّي: نُبقي مثلث الرؤوس الثلاثة الداخلية فيتبع الساحل أدقّ بدل قفزة مربعة كاملة
          if (!inside[d]) idx.push(a, b, c);
          else if (!inside[c]) idx.push(a, b, d);
          else if (!inside[b]) idx.push(a, d, c);
          else idx.push(b, d, c);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    this.terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.94, metalness: 0.0, flatShading: false
    }));
    this.terrain.castShadow = false; // الظل الذاتي للتضاريس أغلى بكثير مما يضيفه بصرياً
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    this._terrainData = { baseRGB, regionIdx, shade, inside, vCount, GW, GH, lon0, lon1, lat0, lat1 };
    this.regionColors = { west: new THREE.Color(0x2c3a2a), east: new THREE.Color(0x2c3a2a), south: new THREE.Color(0x2c3a2a) };
  },

  // ارتفاع الأرض عند نقطة - يُستخدم لوضع المدن والمنصات والوحدات فوق السطح بدقة لا معلقة في الهواء
  _terrainHeight(lon, lat) {
    if (!this._pointInPoly(lon, lat, this.LIBYA_OUTLINE)) return 0;
    const d = this._distToOutline(lon, lat);
    const edge = Math.min(1, d / 0.85);
    return this._elevation(lon, lat) * (edge * edge * (3 - 2 * edge)) * this.ELEV_SCALE;
  },

  _buildSea() {
    const geo = new THREE.PlaneGeometry(150, 150, 26, 26);
    geo.rotateX(-Math.PI / 2);
    this.sea = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0x134963, roughness: 0.18, metalness: 0.5, transparent: true, opacity: 0.94
    }));
    this.sea.position.y = 0.0;
    this.sea.receiveShadow = true;
    this.scene.add(this.sea);
    this._seaBase = Float32Array.from(geo.attributes.position.array);
  },

  // خطوط حدود الأقاليم متوهجة فوق السطح مباشرة - تُبرز التقسيم الفعلي دون طمس التضاريس
  _buildBorders() {
    this.borderLines = {};
    Object.entries(this.REGION_POLYS).forEach(([id, poly]) => {
      const pts = [];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const STEPS = 14; // تقسيم كل ضلع كي يتبع الخط تموّج الأرض تحته
        for (let s = 0; s < STEPS; s++) {
          const t = s / STEPS;
          const lon = a[0] + (b[0] - a[0]) * t, lat = a[1] + (b[1] - a[1]) * t;
          const p = this._proj(lon, lat);
          pts.push(new THREE.Vector3(p.x, this._terrainHeight(lon, lat) + 0.09, p.z));
        }
      }
      pts.push(pts[0].clone());
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfff4cf, transparent: true, opacity: 0.9 }));
      this.scene.add(line);
      this.borderLines[id] = line;
    });
  },

  _makeLabelSprite(text) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const ctx = cv.getContext('2d');
    ctx.font = 'bold 34px "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,.75)';
    ctx.strokeText(text, 128, 34);
    ctx.fillStyle = '#fff6df';
    ctx.fillText(text, 128, 34);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false }));
    sp.scale.set(3.4, 0.85, 1);
    return sp;
  },

  _buildCities() {
    this.cityGroups = this.CITIES.map(c => {
      const p = this._proj(c.lon, c.lat);
      const y = this._terrainHeight(c.lon, c.lat);
      const group = new THREE.Group();
      group.position.set(p.x, y, p.z);
      group.userData.regionId = c.region;

      // عمران متعدد الكتل بدل مكعب واحد - يقرأ كمدينة فعلية من أي زاوية
      const blocks = [];
      const n = Math.round(4 + c.size * 5);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + i * 0.7;
        const rad = 0.09 + (i % 3) * 0.07 * c.size;
        const hgt = (0.16 + ((i * 37) % 10) / 26) * c.size;
        const b = new THREE.Mesh(
          new THREE.BoxGeometry(0.13 * c.size + 0.04, hgt, 0.13 * c.size + 0.04),
          new THREE.MeshStandardMaterial({ color: 0xd8cdb4, roughness: 0.75, emissive: 0xffc46b, emissiveIntensity: 0.25 })
        );
        b.position.set(Math.cos(a) * rad, hgt / 2, Math.sin(a) * rad);
        b.castShadow = true;
        group.add(b);
        blocks.push(b);
      }
      group.userData.blocks = blocks;

      // هالة ضوء أرضية تنبض مع مستوى التنمية
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(0.42 * c.size + 0.16, 20),
        new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.16, depthWrite: false })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.02;
      group.add(glow);
      group.userData.glow = glow;

      if (this.LABELED_CITIES.includes(c.id)) {
        const label = this._makeLabelSprite(c.name);
        label.position.y = 1.15;
        group.add(label);
      }
      this.scene.add(group);
      return group;
    });
  },

  _buildOilFields() {
    // نسيج دخان ناعم لجسيمات الاشتعال
    const sc = document.createElement('canvas');
    sc.width = sc.height = 32;
    const sx = sc.getContext('2d');
    const rg = sx.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,255,255,.9)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    sx.fillStyle = rg;
    sx.fillRect(0, 0, 32, 32);
    const smokeTex = new THREE.CanvasTexture(sc);

    this.rigGroups = this.OIL_FIELDS.map(f => {
      const p = this._proj(f.lon, f.lat);
      const y = this._terrainHeight(f.lon, f.lat);
      const group = new THREE.Group();
      group.position.set(p.x, y, p.z);
      group.userData.regionId = this._regionAt(f.lon, f.lat);

      // برج حفر هرمي بأرجل مائلة - صورة منصة نفط مقروءة فوراً
      const legMat = new THREE.MeshStandardMaterial({ color: 0x99a3ad, roughness: 0.5, metalness: 0.65 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.03, 0.72, 5), legMat);
        leg.position.set(Math.cos(a) * 0.075, 0.36, Math.sin(a) * 0.075);
        leg.rotation.x = Math.sin(a) * 0.17;
        leg.rotation.z = -Math.cos(a) * 0.17;
        leg.castShadow = true;
        group.add(leg);
      }
      const derrick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.055, 0.34, 5), legMat);
      derrick.position.y = 0.86;
      group.add(derrick);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.06, 10),
        new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: 0.9 }));
      base.position.y = 0.03;
      base.receiveShadow = true;
      group.add(base);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.075, 0.28, 8),
        new THREE.MeshBasicMaterial({ color: 0xff8c2b, transparent: true, opacity: 0.95, fog: false })
      );
      flame.position.y = 1.14;
      group.add(flame);
      const flameGlow = new THREE.PointLight(0xff7b21, 1.1, 2.4);
      flameGlow.position.y = 1.16;
      group.add(flameGlow);

      // عمود دخان: جسيمات تصعد وتتلاشى ثم تُعاد للأسفل
      const N = 26;
      const sp = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        sp[i * 3] = (Math.random() - 0.5) * 0.1;
        sp[i * 3 + 1] = 1.2 + Math.random() * 1.5;
        sp[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      }
      const sgeo = new THREE.BufferGeometry();
      sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      const smoke = new THREE.Points(sgeo, new THREE.PointsMaterial({
        map: smokeTex, size: 0.34, transparent: true, opacity: 0.3, depthWrite: false, color: 0x50505a
      }));
      group.add(smoke);

      group.userData.flame = flame;
      group.userData.flameGlow = flameGlow;
      group.userData.smoke = smoke;
      this.scene.add(group);
      return group;
    });
  },

  // وحدات عسكرية على خط التماس الفعلي حول سرت - المكان الذي تجمّدت عنده الجبهة واقعياً
  _buildUnits() {
    this.playerUnits = [];
    this.rivalUnits = [];
    const FRONT = [[16.05, 31.05], [16.15, 30.20], [16.30, 29.35], [16.45, 28.45]];
    FRONT.forEach(([lon, lat]) => {
      const mk = side => {
        const offset = side === 'player' ? -0.42 : 0.42;
        const p = this._proj(lon + offset, lat);
        const y = this._terrainHeight(lon + offset, lat);
        const g = new THREE.Group();
        g.position.set(p.x, y, p.z);
        g.userData.regionId = side === 'player' ? 'west' : 'east';
        const color = side === 'player' ? 0x3fbf5e : 0xe5484d;
        // خيمة/موقع ميداني + سارية علم صغيرة
        const tent = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.26, 4),
          new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
        tent.position.y = 0.13;
        tent.rotation.y = Math.PI / 4;
        tent.castShadow = true;
        g.add(tent);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4),
          new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.4 }));
        mast.position.set(0.13, 0.15, 0);
        g.add(mast);
        const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.07),
          new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.8 }));
        pennant.position.set(0.19, 0.27, 0);
        g.add(pennant);
        this.scene.add(g);
        return g;
      };
      this.playerUnits.push(mk('player'));
      this.rivalUnits.push(mk('rival'));
    });
  },

  _applyOrbit() {
    const { yaw, pitch, radius } = this.orbit;
    this.camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * radius,
      Math.sin(pitch) * radius,
      Math.cos(yaw) * Math.cos(pitch) * radius
    );
    this.camera.lookAt(0, 0, 0);
  },

  _resize() {
    const wrap = document.getElementById('map-3d-wrap');
    if (!wrap || !this.renderer) return;
    const width = wrap.clientWidth || 400;
    const height = this._cinematic ? wrap.clientHeight : 340;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  },

  _bindInteraction(canvas) {
    let dragging = false, moved = 0, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', e => {
      if (this._cinematic) return;
      dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!dragging || this._cinematic) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX; lastY = e.clientY;
      this.orbitTarget.yaw -= dx * 0.008;
      this.orbitTarget.pitch = Math.max(0.18, Math.min(1.4, this.orbitTarget.pitch + dy * 0.006));
    });
    canvas.addEventListener('pointerup', e => {
      dragging = false;
      if (moved < 6 && !this._cinematic) this._handleClick(e, canvas);
    });
    canvas.addEventListener('wheel', e => {
      if (this._cinematic) return;
      e.preventDefault();
      this.orbitTarget.radius = Math.max(13, Math.min(48, this.orbitTarget.radius + (e.deltaY > 0 ? 2.2 : -2.2)));
    }, { passive: false });
  },

  // النقر يُسقط شعاعاً على التضاريس ثم يحوّل نقطة الاصطدام إلى إحداثيات جغرافية لتحديد الإقليم فعلياً
  _handleClick(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const hit of hits) {
      if (hit.object === this.sea || hit.object === this.sky) continue;
      if (hit.object === this.terrain) {
        const g = this._unproj(hit.point.x, hit.point.z);
        if (typeof openRegionModal === 'function') openRegionModal(this._regionAt(g.lon, g.lat));
        return;
      }
      let obj = hit.object;
      while (obj && !obj.userData.regionId) obj = obj.parent;
      if (obj && obj.userData.regionId) {
        if (typeof openRegionModal === 'function') openRegionModal(obj.userData.regionId);
        return;
      }
    }
  },

  _paintTerrain() {
    const d = this._terrainData;
    if (!d) return;
    const colAttr = this.terrain.geometry.attributes.color;
    const arr = colAttr.array;
    // تعميق الصبغة: ألوان الواجهة مُعايَرة لخلفية داكنة، وعلى سطح مضاء تبدو باهتة إن لم تُعمَّق
    const tints = this.REGION_IDS.map(id => this.regionColors[id].clone().multiplyScalar(0.72));
    for (let i = 0; i < d.vCount; i++) {
      if (!d.inside[i]) continue;
      const t = tints[d.regionIdx[i]];
      const s = d.shade[i];
      // مزج لون الحالة مع لون الأرض الطبيعي بدل طلاء مسطح - تبقى التضاريس مقروءة تحت التلوين
      let r = d.baseRGB[i * 3] * 0.38 + t.r * 0.62;
      let g = d.baseRGB[i * 3 + 1] * 0.38 + t.g * 0.62;
      let b = d.baseRGB[i * 3 + 2] * 0.38 + t.b * 0.62;
      // رفع التشبع بإبعاد القنوات عن متوسطها الرمادي - مزج الرمل بالصبغة يُنتج لوناً باهتاً بطبيعته
      const avg = (r + g + b) / 3;
      r = avg + (r - avg) * 1.45; g = avg + (g - avg) * 1.45; b = avg + (b - avg) * 1.45;
      arr[i * 3] = Math.max(0, r) * s;
      arr[i * 3 + 1] = Math.max(0, g) * s;
      arr[i * 3 + 2] = Math.max(0, b) * s;
    }
    colAttr.needsUpdate = true;
  },

  // مزامنة المشهد مع حالة اللعبة الفعلية - تُستدعى من renderLibyaMap مع كل إعادة رسم للواجهة
  update(state, layer) {
    if (!this.init()) return;
    this.layer = layer || this.layer;
    REGIONS.forEach(r => {
      const val = regionLayerValue(state, r.id, this.layer);
      const status = indicatorColor('satisfaction', val);
      this.regionColors[r.id].setHex(this.STATUS_COLORS[status] || 0x2c3a2a);
    });
    this._paintTerrain();

    const dev = Math.max(0.15, Math.min(1.5, state.indicators.economicDevelopment / 55));
    this.cityGroups.forEach(g => {
      g.userData.blocks.forEach(b => { b.material.emissiveIntensity = 0.12 + dev * 0.55; });
      g.userData.glow.material.opacity = 0.07 + dev * 0.14;
    });

    const blockade = state.sovereignty && state.sovereignty.oilBlockade && state.sovereignty.oilBlockade.active;
    this.rigGroups.forEach(g => {
      g.userData.flame.material.color.setHex(blockade ? 0x555555 : 0xff8c2b);
      g.userData.flameGlow.intensity = blockade ? 0 : 1.1;
      g.userData.smoke.material.opacity = blockade ? 0.06 : 0.3;
      g.userData.blockade = blockade;
    });

    const sov = state.sovereignty || { territoryControl: 50, rivalMilitaryStrength: 50 };
    this.playerUnits.forEach((u, i) => { u.visible = i < Math.round(sov.territoryControl / 25); });
    this.rivalUnits.forEach((u, i) => { u.visible = i < Math.round(sov.rivalMilitaryStrength / 25); });
    this.renderer.shadowMap.needsUpdate = true;
  },

  setVisible(v) {
    this.visible = v;
    if (v && this.init()) {
      this._resize();
      this._startLoop();
    } else {
      this._stopLoop();
    }
  },

  _startLoop() {
    if (this._raf) return;
    this._lastFrame = 0;
    const tick = (t) => {
      this._raf = requestAnimationFrame(tick);
      if (!this._cinematic) {
        if (t - this._lastFrame < 33) return; // سقف ~30 إطاراً/ثانية يكفي تماماً لمشهد بهذا الهدوء
        if (this._offscreen) return;
      }
      this._lastFrame = t;

      // ملاحقة ناعمة لهدف الكاميرا - إحساس ثقل ورشاقة بدل استجابة حادة
      if (!this._cinematic) {
        const o = this.orbit, ot = this.orbitTarget;
        o.yaw += (ot.yaw - o.yaw) * 0.12;
        o.pitch += (ot.pitch - o.pitch) * 0.12;
        o.radius += (ot.radius - o.radius) * 0.1;
        this._applyOrbit();
      }

      // موج البحر المتوسط
      if (this.sea) {
        const p = this.sea.geometry.attributes.position, b = this._seaBase;
        for (let i = 0; i < p.count; i++) {
          const x = b[i * 3], z = b[i * 3 + 2];
          p.array[i * 3 + 1] = Math.sin(x * 0.35 + t / 900) * 0.035 + Math.cos(z * 0.42 + t / 700) * 0.028;
        }
        p.needsUpdate = true;
      }

      this.rigGroups.forEach((g, i) => {
        const flame = g.userData.flame, smoke = g.userData.smoke;
        if (g.userData.blockade) {
          flame.scale.setScalar(0.55);
          flame.material.opacity = 0.35;
        } else {
          const pulse = 0.85 + Math.sin(t / 170 + i * 2) * 0.28;
          flame.scale.set(pulse, 0.9 + Math.sin(t / 120 + i) * 0.3, pulse);
          flame.material.opacity = 0.78 + Math.sin(t / 140 + i) * 0.2;
        }
        const sp = smoke.geometry.attributes.position;
        const rise = g.userData.blockade ? 0.0006 : 0.0035;
        for (let k = 0; k < sp.count; k++) {
          let y = sp.array[k * 3 + 1] + rise * 16;
          if (y > 3.4) y = 1.2;
          sp.array[k * 3 + 1] = y;
          sp.array[k * 3] += Math.sin(t / 600 + k) * 0.0016;
        }
        sp.needsUpdate = true;
      });

      if (this._cinematic) this._cinematic(t);
      this.renderer.render(this.scene, this.camera);
    };
    this._raf = requestAnimationFrame(tick);
  },

  _stopLoop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  },

  // ------- المشاهد السينمائية للحظات الكبرى: تحليق كاميرا مبرمج فوق الخريطة المجسمة -------
  playCinematic(kind, onDone) {
    const done = onDone || (() => {});
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !this.init() || this._cinematic) { done(); return; }

    const canvas = document.getElementById('libya-map-3d');
    const wrap = document.getElementById('map-3d-wrap');
    const overlay = document.createElement('div');
    overlay.className = 'cinematic-overlay';
    const caption = document.createElement('div');
    caption.className = 'cinematic-caption';
    caption.textContent = kind === 'coup' ? '⚠️ تحرك عسكري في العاصمة'
      : kind === 'unify' ? '🇱🇾 ليبيا تتوحد من جديد'
      : '🗳️ الشعب يقول كلمته';
    overlay.appendChild(caption);
    document.body.appendChild(overlay);
    overlay.appendChild(canvas);
    this._resizeToOverlay(overlay);

    const wasVisible = this.visible;
    if (!this._raf) this._startLoop();

    const startOrbit = { ...this.orbit };
    const tp = this._proj(13.19, 32.88); // طرابلس
    const startTime = performance.now();
    const DURATION = 4000;

    const flash = new THREE.PointLight(kind === 'coup' ? 0xff2222 : kind === 'unify' ? 0x3fbf5e : 0xffd75e, 0, 26);
    flash.position.set(kind === 'unify' ? 0 : tp.x, 6, kind === 'unify' ? 0 : tp.z);
    this.scene.add(flash);
    const unifyStart = this.REGION_IDS.map(id => this.regionColors[id].clone());

    this._cinematic = () => {
      const t = Math.min(1, (performance.now() - startTime) / DURATION);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (kind === 'coup') {
        this.orbit.radius = 30 - ease * 17;
        this.orbit.pitch = 0.72 - ease * 0.34;
        this.orbit.yaw = startOrbit.yaw + ease * 0.7;
        this._applyOrbit();
        const shake = t > 0.4 ? (1 - t) * 0.3 : 0;
        this.camera.position.x += (Math.random() - 0.5) * shake;
        this.camera.position.y += (Math.random() - 0.5) * shake;
        flash.intensity = t > 0.35 ? (0.6 + Math.sin(performance.now() / 90) * 0.5) * 4 : 0;
      } else if (kind === 'unify') {
        this.orbit.yaw = startOrbit.yaw + ease * Math.PI * 2;
        this.orbit.pitch = 0.72 + Math.sin(t * Math.PI) * 0.22;
        this.orbit.radius = 30 - Math.sin(t * Math.PI) * 8;
        this._applyOrbit();
        flash.intensity = Math.sin(t * Math.PI) * 3;
        // اخضرار تدريجي يجتاح كل الأقاليم مع دوران الكاميرا - توحّد مرئي لا نص فقط
        const green = new THREE.Color(0x3fbf5e);
        this.REGION_IDS.forEach((id, i) => this.regionColors[id].copy(unifyStart[i]).lerp(green, ease));
        this._paintTerrain();
      } else {
        this.orbit.yaw = startOrbit.yaw + ease * Math.PI;
        this.orbit.pitch = 0.72 - Math.sin(t * Math.PI) * 0.24;
        this.orbit.radius = 30 - Math.sin(t * Math.PI) * 9;
        this._applyOrbit();
        flash.intensity = Math.sin(t * Math.PI) * 3.4;
      }
      if (t >= 1) {
        this._cinematic = null;
        this.scene.remove(flash);
        this.orbit = { ...startOrbit };
        this.orbitTarget = { ...startOrbit };
        this._applyOrbit();
        wrap.appendChild(canvas);
        overlay.remove();
        this._resize();
        if (!wasVisible) this._stopLoop();
        done();
      }
    };
  },

  _resizeToOverlay(overlay) {
    const width = overlay.clientWidth, height = overlay.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
};
