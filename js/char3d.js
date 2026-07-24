// مجسمات الشخصيات: مصنع شخصيات low-poly إجرائي بالكامل (بلا أي ملفات نماذج خارجية) -
// مظهر كل شخصية حتمي ثابت مشتق من معرّفها (بذرة hash)، فيبدو محمد الزناتي هو نفسه في كل مكان وكل جلسة.
// الزي يعكس الدور فعلياً: زي عسكري لقادة الأمن والدفاع، زي تقليدي لوجهاء القبائل والمشايخ، بدلة رسمية للبقية.
// نظام الأفاتار يلتقط لقطة واحدة لكل شخصية عبر عارض مشترك خفي ويعيد استخدامها كصورة - لا عشرات سياقات WebGL.

const Char3D = {
  _cache: {}, // charKey -> dataURL
  _renderer: null,
  supported: typeof THREE !== 'undefined',

  // مولّد أرقام حتمي من بذرة نصية - نفس المعرّف يعطي دوماً نفس الملامح
  _rng(seedStr) {
    let h = 1779033703;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  },

  SKIN_TONES: [0xf1c9a5, 0xe0ac7e, 0xc68e5e, 0xa9713f, 0x8d5a2b],
  SUIT_COLORS: [0x2b3446, 0x3a3a3a, 0x27343a, 0x40323a, 0x1f2c26, 0x333d55],
  TIE_COLORS: [0xa93226, 0x1a5276, 0x196f3d, 0x7d6608, 0x6c3483, 0xc9a227],
  TRAD_COLORS: [0xd9cfc0, 0xc9bda8, 0xb9ad96, 0xe4ddd0],

  // هيئة الشخصية من بياناتها الفعلية: عسكري/تقليدي/مدني - لا اختياراً عشوائياً بحتاً
  _styleFor(char) {
    const role = (char.role || '') + (char.traits || []).join('');
    if (role.includes('لواء') || role.includes('دفاع') || role.includes('داخلية') || (char.traits || []).includes('military_strategist')) return 'military';
    if (char.category === 'tribal' || char.category === 'religious') return 'traditional';
    return 'suit';
  },

  // بناء مجسم شخصية كاملة - يُستخدم للأفاتارات الساكنة ولمشاهد القصر الحية معاً
  buildFigure(char, opts) {
    const rnd = this._rng(char.id || char.name || 'x');
    const style = (opts && opts.style) || this._styleFor(char);
    const skin = this.SKIN_TONES[Math.floor(rnd() * this.SKIN_TONES.length)];
    const suitColor = style === 'military' ? 0x4b5320
      : style === 'traditional' ? this.TRAD_COLORS[Math.floor(rnd() * this.TRAD_COLORS.length)]
      : this.SUIT_COLORS[Math.floor(rnd() * this.SUIT_COLORS.length)];

    const group = new THREE.Group();
    const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 });

    // الجذع (سترة) + قميص
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.95, 8), mat(suitColor));
    torso.position.y = 1.15;
    group.add(torso);
    const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 6), mat(0xe8e6df));
    shirt.position.set(0, 1.32, 0.19);
    group.add(shirt);
    if (style === 'suit') {
      const tie = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 4), mat(this.TIE_COLORS[Math.floor(rnd() * this.TIE_COLORS.length)]));
      tie.rotation.x = Math.PI;
      tie.position.set(0, 1.22, 0.26);
      group.add(tie);
    }
    if (style === 'military') {
      // نياشين على الصدر ورتب على الكتف - تفاصيل صغيرة تصنع "هيبة" الزي فعلياً
      for (let i = 0; i < 3; i++) {
        const medal = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.02), mat([0xc9a227, 0xa93226, 0x1a5276][i]));
        medal.position.set(-0.14 + i * 0.09, 1.42, 0.32);
        group.add(medal);
      }
      const epaulet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.16), mat(0x3a411a));
      epaulet.position.y = 1.62;
      group.add(epaulet);
    }

    // الذراعان
    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.8, 6), mat(suitColor));
      arm.position.set(side * 0.44, 1.18, 0);
      arm.rotation.z = side * 0.12;
      group.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(skin));
      hand.position.set(side * 0.49, 0.76, 0);
      group.add(hand);
    });

    // الساقان (تُخفيان في وضع الجلوس بمشهد مجلس الوزراء)
    if (!opts || !opts.seated) {
      [-1, 1].forEach(side => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.7, 6), mat(style === 'traditional' ? suitColor : 0x22252c));
        leg.position.set(side * 0.16, 0.35, 0);
        group.add(leg);
      });
    }

    // الرأس والملامح
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), mat(skin));
    head.position.y = 1.92;
    group.add(head);
    const isFemale = /ة\b|أمينة|نجاة|هدى|فوزية|رانيا|ليلى|آمنة/.test(char.name || '');
    const hairColor = rnd() < 0.25 ? 0x777777 : 0x1d1712;
    if (style === 'military') {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.14, 10), mat(0x3a411a));
      cap.position.y = 2.12;
      group.add(cap);
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 0.18), mat(0x23290f));
      visor.position.set(0, 2.05, 0.22);
      group.add(visor);
    } else if (style === 'traditional') {
      const shash = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.18, 10), mat(0xefeae0));
      shash.position.y = 2.12;
      group.add(shash);
    } else if (isFemale) {
      const hijab = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.72), mat(0x4a5568 + Math.floor(rnd() * 0x202020)));
      hijab.position.y = 1.94;
      group.add(hijab);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), mat(hairColor));
      hair.position.y = 1.97;
      group.add(hair);
    }
    if (!isFemale && rnd() < 0.45 && style !== 'military') {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.35), mat(hairColor));
      beard.position.y = 1.86;
      beard.position.z = 0.06;
      group.add(beard);
    }
    if (rnd() < 0.3) {
      [-1, 1].forEach(side => {
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), mat(0x222222));
        lens.position.set(side * 0.1, 1.94, 0.23);
        group.add(lens);
      });
    }
    return group;
  },

  // لقطة أفاتار (رأس وكتفان) تُحفظ كصورة وتُعاد من الذاكرة المؤقتة في كل استخدام لاحق
  avatarDataURL(char) {
    if (!this.supported) return null;
    const key = char.id || char.name;
    if (this._cache[key]) return this._cache[key];
    try {
      if (!this._renderer) {
        const canvas = document.createElement('canvas');
        canvas.width = 144; canvas.height = 168;
        this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
        this._renderer.setSize(144, 168, false);
        this._scene = new THREE.Scene();
        this._camera = new THREE.PerspectiveCamera(34, 144 / 168, 0.1, 20);
        this._camera.position.set(0.35, 2.05, 1.7);
        this._camera.lookAt(0, 1.78, 0);
        this._scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const key1 = new THREE.DirectionalLight(0xfff3d6, 0.9);
        key1.position.set(2, 3, 2);
        this._scene.add(key1);
      }
      const figure = this.buildFigure(char, {});
      this._scene.add(figure);
      this._renderer.render(this._scene, this._camera);
      const url = this._renderer.domElement.toDataURL('image/png');
      this._scene.remove(figure);
      this._cache[key] = url;
      return url;
    } catch (e) {
      this.supported = false; // فشل WebGL - تتراجع كل الأفاتارات بهدوء للحروف الأولى القديمة
      return null;
    }
  },

  // وسم صورة أفاتار جاهز للإدراج، أو null ليستخدم المستدعي بديله النصي القديم
  avatarImg(char, cls) {
    const url = this.avatarDataURL(char);
    return url ? `<img class="${cls || 'avatar3d'}" src="${url}" alt="">` : null;
  }
};
