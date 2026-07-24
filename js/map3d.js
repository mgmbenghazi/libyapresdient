// الخريطة المجسمة التفاعلية: مشهد three.js (مضمَّن محلياً في assets/vendor بلا أي CDN) يستبدل الخريطة
// المسطحة بأقاليم مبثوقة قابلة للتدوير والإمالة والنقر، مع مجسمات حية تعكس حالة اللعبة الفعلية:
// منصات نفط تشتعل عند الحصار، مدن تضيء بحسب التنمية، ووحدات عسكرية على خط التماس بحسب ميزان السيادة.
// كل التلوين يمر عبر regionLayerValue نفسها المستخدمة في الخريطة المسطحة - مصدر حقيقة واحد للطبقتين.

const Map3D = {
  ready: false,
  supported: true,
  visible: false,
  layer: 'loyalty',
  _raf: null,
  _cinematic: null,

  // نفس مضلعات الخريطة المسطحة (viewBox 400×300) - تُحوَّل لإحداثيات عالم ثلاثي مركزها الصفر
  REGION_POLYS: {
    west: [[20, 40], [190, 30], [200, 170], [120, 270], [30, 220]],
    east: [[200, 30], [380, 50], [370, 210], [260, 260], [200, 170]],
    south: [[30, 220], [120, 270], [200, 170], [260, 260], [200, 290], [60, 280]]
  },
  CITIES: [
    { id: 'tripoli', name: 'طرابلس', region: 'west', x: 95, y: 75 },
    { id: 'benghazi', name: 'بنغازي', region: 'east', x: 300, y: 80 },
    { id: 'sebha', name: 'سبها', region: 'south', x: 140, y: 235 }
  ],
  OIL_RIGS: [{ x: 235, y: 105 }, { x: 262, y: 130 }, { x: 288, y: 155 }], // الهلال النفطي شرقاً

  _toWorld(x, y) { return { x: (x - 200) / 20, z: (y - 150) / 20 }; },

  STATUS_COLORS: { good: 0x3fbf5e, medium: 0xe0a72b, bad: 0xe5484d },

  init() {
    if (this.ready || !this.supported) return this.ready;
    const canvas = document.getElementById('libya-map-3d');
    if (!canvas || typeof THREE === 'undefined') { this.supported = false; return false; }
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      this.supported = false;
      return false;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0c1410, 30, 60);
    this.camera = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 100);
    this.orbit = { yaw: 0, pitch: 0.85, radius: 18 };
    this._applyOrbit();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff3d6, 0.9);
    sun.position.set(8, 14, 6);
    this.scene.add(sun);

    // قاعدة بحرية/صحراوية خفيفة تحت الأقاليم تمنح إحساس كتلة أرضية لا مضلعات معلقة في فراغ
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(16, 17.5, 0.5, 48),
      new THREE.MeshStandardMaterial({ color: 0x11241b, roughness: 0.95 })
    );
    base.position.y = -0.55;
    this.scene.add(base);

    this.regionMeshes = {};
    Object.entries(this.REGION_POLYS).forEach(([id, poly]) => {
      const shape = new THREE.Shape();
      poly.forEach(([x, y], i) => {
        const w = this._toWorld(x, y);
        if (i === 0) shape.moveTo(w.x, w.z); else shape.lineTo(w.x, w.z);
      });
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
      // مادتان منفصلتان: سطح علوي بلون الطبقة وجوانب أغمق منه - هذا ما يجعل كل إقليم كتلة مجسمة مقروءة لا بقعة مسطحة
      const topMat = new THREE.MeshStandardMaterial({ color: 0x2c3a2a, roughness: 0.8, metalness: 0.05 });
      const sideMat = new THREE.MeshStandardMaterial({ color: 0x16201a, roughness: 0.9, metalness: 0.05 });
      const mesh = new THREE.Mesh(geo, [topMat, sideMat]);
      mesh.rotation.x = Math.PI / 2; // من مستوى XY (شكل مسطح) إلى الأرض XZ مع البثق للأعلى
      mesh.position.y = 0.7;
      mesh.userData.regionId = id;
      this.scene.add(mesh);
      this.regionMeshes[id] = mesh;
    });

    // المدن: صناديق مضيئة يزداد توهجها مع التنمية الفعلية للعبة
    this.cityMeshes = this.CITIES.map(c => {
      const w = this._toWorld(c.x, c.y);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.5, 0.45),
        new THREE.MeshStandardMaterial({ color: 0xc9a227, emissive: 0xc9a227, emissiveIntensity: 0.6 })
      );
      mesh.position.set(w.x, 1.0, w.z);
      mesh.userData.regionId = c.region;
      this.scene.add(mesh);
      return mesh;
    });

    // منصات النفط: أسطوانة + برج، ولهب متوهج يعمل في الوضع الطبيعي وينطفئ رمادياً عند الحصار
    this.rigGroups = this.OIL_RIGS.map(r => {
      const w = this._toWorld(r.x, r.y);
      const group = new THREE.Group();
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.14, 0.9, 6),
        new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.6, metalness: 0.5 })
      );
      tower.position.y = 0.45;
      group.add(tower);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.42, 8),
        new THREE.MeshBasicMaterial({ color: 0xff8c2b, transparent: true, opacity: 0.95 })
      );
      flame.position.y = 1.1;
      group.add(flame);
      group.userData.flame = flame;
      group.userData.regionId = 'east';
      group.position.set(w.x, 0.75, w.z);
      this.scene.add(group);
      return group;
    });

    // وحدات عسكرية على خط التماس (الحد الغربي/الشرقي): مخاريط خضراء لقواتك غرباً وحمراء للسلطة الموازية شرقاً
    this.playerUnits = [];
    this.rivalUnits = [];
    for (let i = 0; i < 4; i++) {
      const zPos = -4.5 + i * 2.6;
      const mk = side => {
        const unit = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.55, 5),
          new THREE.MeshStandardMaterial({ color: side === 'player' ? 0x3fbf5e : 0xe5484d, roughness: 0.5 })
        );
        unit.position.set(side === 'player' ? -0.8 : 0.8, 1.0, zPos);
        unit.rotation.z = side === 'player' ? -0.35 : 0.35;
        unit.userData.regionId = side === 'player' ? 'west' : 'east';
        this.scene.add(unit);
        return unit;
      };
      this.playerUnits.push(mk('player'));
      this.rivalUnits.push(mk('rival'));
    }

    this.raycaster = new THREE.Raycaster();
    this._bindInteraction(canvas);
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this.ready = true;
    return true;
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
    const height = this._cinematic ? wrap.clientHeight : 300;
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
      this.orbit.yaw -= dx * 0.008;
      this.orbit.pitch = Math.max(0.25, Math.min(1.35, this.orbit.pitch + dy * 0.006));
      this._applyOrbit();
    });
    canvas.addEventListener('pointerup', e => {
      dragging = false;
      if (moved < 6 && !this._cinematic) this._handleClick(e, canvas); // نقرة حقيقية لا نهاية سحب
    });
    canvas.addEventListener('wheel', e => {
      if (this._cinematic) return;
      e.preventDefault();
      this.orbit.radius = Math.max(9, Math.min(30, this.orbit.radius + (e.deltaY > 0 ? 1.4 : -1.4)));
      this._applyOrbit();
    }, { passive: false });
  },

  _handleClick(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj && !obj.userData.regionId) obj = obj.parent;
      if (obj && obj.userData.regionId) {
        if (typeof openRegionModal === 'function') openRegionModal(obj.userData.regionId);
        return;
      }
    }
  },

  // مزامنة المشهد مع حالة اللعبة الفعلية - تُستدعى من renderLibyaMap مع كل إعادة رسم للواجهة
  update(state, layer) {
    if (!this.init()) return;
    this.layer = layer || this.layer;
    REGIONS.forEach(r => {
      const val = regionLayerValue(state, r.id, this.layer);
      const status = indicatorColor('satisfaction', val);
      const mesh = this.regionMeshes[r.id];
      if (mesh) {
        const hex = this.STATUS_COLORS[status] || 0x2c3a2a;
        mesh.material[0].color.setHex(hex);
        mesh.material[1].color.setHex(hex).multiplyScalar(0.35);
      }
    });

    const dev = Math.max(0.15, Math.min(1.4, state.indicators.economicDevelopment / 55));
    this.cityMeshes.forEach(m => { m.material.emissiveIntensity = 0.25 + dev * 0.6; });

    const blockade = state.sovereignty && state.sovereignty.oilBlockade && state.sovereignty.oilBlockade.active;
    this.rigGroups.forEach(g => {
      g.userData.flame.material.color.setHex(blockade ? 0x555555 : 0xff8c2b);
      g.userData.blockade = blockade;
    });

    // كثافة القوات على خط التماس تعكس ميزان السيادة الفعلي: سيطرة أوسع = وحدات أكثر ظهوراً لصالحك
    const sov = state.sovereignty || { territoryControl: 50, rivalMilitaryStrength: 50 };
    this.playerUnits.forEach((u, i) => { u.visible = i < Math.round(sov.territoryControl / 25); });
    this.rivalUnits.forEach((u, i) => { u.visible = i < Math.round(sov.rivalMilitaryStrength / 25); });
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
    const tick = (t) => {
      this._raf = requestAnimationFrame(tick);
      // نبض اللهب وارتفاعه المتمايل - يتوقف رمادياً ساكناً أثناء الحصار
      this.rigGroups.forEach((g, i) => {
        const flame = g.userData.flame;
        if (g.userData.blockade) { flame.scale.setScalar(0.6); flame.material.opacity = 0.4; }
        else {
          const pulse = 0.85 + Math.sin(t / 180 + i * 2) * 0.25;
          flame.scale.setScalar(pulse);
          flame.material.opacity = 0.75 + Math.sin(t / 140 + i) * 0.2;
        }
      });
      this.cityMeshes.forEach((m, i) => {
        m.material.emissiveIntensity += Math.sin(t / 700 + i * 1.7) * 0.004;
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
  // تنقل الكانفس مؤقتاً لطبقة ملء شاشة (إعادة التموضع في DOM لا تُفقد سياق WebGL) ثم تعيده لمكانه
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
    const tripoli = this._toWorld(95, 75);
    const startTime = performance.now();
    const DURATION = 3600;

    const flash = new THREE.PointLight(kind === 'coup' ? 0xff2222 : kind === 'unify' ? 0x3fbf5e : 0xffd75e, 0, 18);
    flash.position.set(kind === 'coup' || kind === 'election' ? tripoli.x : 0, 5, kind === 'coup' || kind === 'election' ? tripoli.z : 0);
    this.scene.add(flash);

    this._cinematic = () => {
      const t = Math.min(1, (performance.now() - startTime) / DURATION);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (kind === 'coup') {
        // انقضاض نحو العاصمة مع اهتزاز متصاعد وومضة حمراء
        this.orbit.radius = 18 - ease * 10;
        this.orbit.pitch = 0.85 - ease * 0.35;
        this.orbit.yaw = startOrbit.yaw + ease * 0.6;
        this._applyOrbit();
        const shake = t > 0.4 ? (1 - t) * 0.25 : 0;
        this.camera.position.x += (Math.random() - 0.5) * shake;
        this.camera.position.y += (Math.random() - 0.5) * shake;
        flash.intensity = t > 0.35 ? (0.6 + Math.sin(performance.now() / 90) * 0.5) * 2.2 : 0;
      } else if (kind === 'unify') {
        // دورة كاملة بطيئة فوق البلاد الموحدة مع اخضرار متدرج لكل الأقاليم
        this.orbit.yaw = startOrbit.yaw + ease * Math.PI * 2;
        this.orbit.radius = 18 - Math.sin(t * Math.PI) * 5;
        this._applyOrbit();
        flash.intensity = Math.sin(t * Math.PI) * 1.6;
        Object.values(this.regionMeshes).forEach(m => m.material[0].color.lerp(new THREE.Color(0x3fbf5e), 0.015));
      } else {
        // فوز انتخابي: دوران احتفالي هادئ وإضاءة ذهبية فوق العاصمة
        this.orbit.yaw = startOrbit.yaw + ease * Math.PI;
        this.orbit.pitch = 0.85 - Math.sin(t * Math.PI) * 0.2;
        this._applyOrbit();
        flash.intensity = Math.sin(t * Math.PI) * 2.0;
      }
      if (t >= 1) {
        this._cinematic = null;
        this.scene.remove(flash);
        this.orbit = startOrbit;
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
