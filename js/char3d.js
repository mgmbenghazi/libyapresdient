// مجسمات الشخصيات: مصنع شخصيات إجرائي بالكامل (بلا أي ملفات نماذج خارجية) بنِسَب بشرية حقيقية -
// رأس بحجم واقعي (نحو سُبع الطول) وعنق وكتفان منحوتان وصدر متناقص نحو الخصر وأطراف بمفاصل
// وأحذية وملامح وجه فعلية. مظهر كل شخصية حتمي ثابت مشتق من معرّفها (بذرة hash)، فيبدو الوزير
// نفسه في كل مكان وكل جلسة. الزي يعكس الدور فعلياً: بذلة عسكرية بنياشين، زي تقليدي بعباءة، أو بدلة رسمية.
// نظام الأفاتار يلتقط لقطة واحدة لكل شخصية عبر عارض مشترك خفي ويعيد استخدامها كصورة - لا عشرات سياقات WebGL.

const Char3D = {
  _cache: {},
  _renderer: null,
  supported: typeof THREE !== 'undefined',

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

  SKIN_TONES: [0xf0c8a0, 0xdda87c, 0xc4895c, 0xa87045, 0x8a5a33],
  SUIT_COLORS: [0x243044, 0x2e3238, 0x1f3038, 0x382c32, 0x1c2a24, 0x2c3550, 0x3d3a33],
  TIE_COLORS: [0x9e2f26, 0x1a5276, 0x196f3d, 0x8a6d0b, 0x5f3470, 0xb08d1f, 0x7a1f2b],
  ROBE_COLORS: [0xe6ddcb, 0xd8ccb4, 0xc9bda2, 0xefe8da],
  HAIR_COLORS: [0x1a1410, 0x2b1d14, 0x4a3526, 0x6e6a63, 0x9c9890],

  _styleFor(char) {
    const role = (char.role || '') + (char.traits || []).join('');
    if (role.includes('لواء') || role.includes('دفاع') || role.includes('داخلية') || (char.traits || []).includes('military_strategist')) return 'military';
    if (char.category === 'tribal' || char.category === 'religious') return 'traditional';
    return 'suit';
  },

  _isFemale(name) { return /ة\s|ة$|أمينة|نجاة|هدى|فوزية|رانيا|ليلى|آمنة|سعاد|مريم|فاطمة/.test(name || ''); },

  // يبني شخصية كاملة بارتفاع ~2.2 وحدة (القدم عند 0) - opts.seated يحذف الساقين، opts.lod يبسّط
  // التفاصيل الدقيقة للمجسمات البعيدة (الجالسون حول الطاولة) فلا تُهدَر آلاف المضلعات بلا فائدة
  buildFigure(char, opts) {
    const o = opts || {};
    const rnd = this._rng(char.id || char.name || 'x');
    const style = o.style || this._styleFor(char);
    const detail = !o.lod;
    const female = this._isFemale(char.name);

    const skin = this.SKIN_TONES[Math.floor(rnd() * this.SKIN_TONES.length)];
    const hairCol = this.HAIR_COLORS[Math.floor(rnd() * this.HAIR_COLORS.length)];
    const cloth = style === 'military' ? 0x4a5240
      : style === 'traditional' ? this.ROBE_COLORS[Math.floor(rnd() * this.ROBE_COLORS.length)]
      : this.SUIT_COLORS[Math.floor(rnd() * this.SUIT_COLORS.length)];
    const build = 0.92 + rnd() * 0.18; // تفاوت البنية بين نحيف وممتلئ

    const g = new THREE.Group();
    const M = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.78 : r, metalness: m || 0 });
    const skinMat = M(skin, 0.62);
    const clothMat = M(cloth, style === 'traditional' ? 0.88 : 0.7);
    const hairMat = M(hairCol, 0.85);
    const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };

    // ---- الجذع: صدر عريض يتناقص نحو الخصر ثم وركان - لا أسطوانة واحدة ----
    const chest = add(new THREE.Mesh(new THREE.CylinderGeometry(0.205 * build, 0.178 * build, 0.44, 14), clothMat), 0, 1.53, 0);
    chest.scale.z = 0.72; // مقطع بيضاوي لا دائري - الفرق بين جذع بشري وأنبوب
    const waist = add(new THREE.Mesh(new THREE.CylinderGeometry(0.178 * build, 0.196 * build, 0.36, 14), clothMat), 0, 1.13, 0);
    waist.scale.z = 0.74;

    // كتفان منحوتان: أسطوانة أفقية + كرتا دالية تعطيان خط كتف حقيقي
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.40 * build, 12), clothMat);
    shoulder.rotation.z = Math.PI / 2;
    shoulder.scale.z = 0.8;
    add(shoulder, 0, 1.73, 0);
    [-1, 1].forEach(sd => {
      const delt = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), clothMat);
      delt.scale.set(1, 0.95, 0.82);
      add(delt, sd * 0.20 * build, 1.73, 0);
    });

    // ---- العنق والرأس ----
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.072, 0.13, 10), skinMat), 0, 1.845, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 16), skinMat);
    head.scale.set(0.94, 1.13, 1.0);
    add(head, 0, 2.00, 0);
    // فك/ذقن يمنح الوجه بنية بدل كرة صمّاء
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 10), skinMat);
    jaw.scale.set(0.94, 0.72, 0.95);
    add(jaw, 0, 1.915, 0.018);

    if (detail) {
      // ملامح الوجه: عينان بحدقتين، حاجبان، أنف - الأفاتار لقطة قريبة فالملامح هي كل شيء
      [-1, 1].forEach(sd => {
        const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), M(0xf4f1ea, 0.35));
        eyeW.scale.set(1, 0.78, 0.6);
        add(eyeW, sd * 0.058, 2.015, 0.128);
        add(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), M(0x2a1c12, 0.3)), sd * 0.060, 2.013, 0.147);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.014, 0.02), hairMat);
        brow.rotation.z = sd * 0.10;
        add(brow, sd * 0.060, 2.062, 0.138);
      });
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.072, 6), skinMat);
      nose.rotation.x = Math.PI / 2.05;
      add(nose, 0, 1.985, 0.145);
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.011, 0.015), M(0x8a5348, 0.6));
      add(mouth, 0, 1.925, 0.132);
      // أذنان
      [-1, 1].forEach(sd => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), skinMat);
        ear.scale.set(0.45, 1, 0.7);
        add(ear, sd * 0.145, 2.00, 0.01);
      });
    }

    // ---- غطاء الرأس/الشعر حسب الزي ----
    if (style === 'military') {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.176, 0.085, 16), M(0x3b4232, 0.7)), 0, 2.135, 0);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.168, 0.022, 16), M(0x2c3126, 0.6)), 0, 2.088, 0);
      const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.018, 16, 1, false, -0.9, 1.8), M(0x22271c, 0.45));
      visor.scale.z = 1.35;
      add(visor, 0, 2.078, 0.075);
      add(new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), M(0xc9a227, 0.4, 0.6)), 0, 2.135, 0.172).rotation.y = 0;
    } else if (style === 'traditional') {
      // عمامة/شاش ملفوف بطبقات
      for (let i = 0; i < 3; i++) {
        const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.135 - i * 0.012, 0.042, 8, 18), M(0xefe9dc, 0.9));
        wrap.rotation.x = Math.PI / 2;
        wrap.rotation.z = i * 0.5;
        add(wrap, 0, 2.10 + i * 0.045, 0);
      }
    } else if (female) {
      const hijab = new THREE.Mesh(new THREE.SphereGeometry(0.182, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.78), M(0x3f4a5c + Math.floor(rnd() * 0x151515), 0.85));
      hijab.scale.set(1, 1.08, 1.02);
      add(hijab, 0, 2.00, -0.012);
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.24, 0.30, 14, 1, true), M(0x3f4a5c, 0.85));
      drape.material.side = THREE.DoubleSide;
      add(drape, 0, 1.80, -0.02);
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.163, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
      hair.scale.set(1, 1.06, 1);
      add(hair, 0, 2.005, -0.01);
      if (rnd() < 0.3) { // انحسار الشعر عند الصدغين لبعض الشخصيات
        hair.scale.set(0.96, 0.9, 0.96);
        hair.position.z = -0.03;
      }
    }
    if (!female && rnd() < 0.5) {
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.132, 14, 12, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.44), hairMat);
      beard.scale.set(0.98, 0.95, 1.0);
      add(beard, 0, 1.945, 0.012);
    }
    if (detail && rnd() < 0.28) { // نظارات بإطار وعدستين
      [-1, 1].forEach(sd => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.008, 6, 16), M(0x1e1e22, 0.4, 0.3));
        add(rim, sd * 0.060, 2.015, 0.142);
      });
      add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.007, 0.007), M(0x1e1e22, 0.4, 0.3)), 0, 2.015, 0.145);
    }

    // ---- ملابس: طية سترة/قميص أو عباءة ----
    if (style === 'suit' || style === 'military') {
      const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.115, 0.34, 10), M(0xeceae2, 0.6));
      shirt.scale.z = 0.55;
      add(shirt, 0, 1.58, 0.115);
      const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.16, 0.02), clothMat);
      collarL.rotation.z = 0.30; add(collarL, -0.075, 1.66, 0.135);
      const collarR = collarL.clone(); collarR.rotation.z = -0.30; add(collarR, 0.075, 1.66, 0.135);
      if (style === 'suit') {
        const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.048, 0.30, 4), M(this.TIE_COLORS[Math.floor(rnd() * this.TIE_COLORS.length)], 0.55));
        tie.scale.z = 0.4;
        add(tie, 0, 1.53, 0.148);
        add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.035), tie.material), 0, 1.685, 0.145);
      } else {
        // نياشين ورتب كتف
        for (let i = 0; i < 4; i++) {
          const medal = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.05, 0.012), M([0xc9a227, 0x9e2f26, 0x1a5276, 0x196f3d][i], 0.45, 0.4));
          add(medal, -0.115 + i * 0.052, 1.585, 0.152);
        }
        [-1, 1].forEach(sd => {
          const ep = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.022, 0.085), M(0x2f3527, 0.6));
          add(ep, sd * 0.185, 1.795, 0);
          add(new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.008), M(0xc9a227, 0.4, 0.55)), sd * 0.20, 1.808, 0.03);
        });
      }
    } else {
      // عباءة تنسدل من الكتفين إلى القدمين
      const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.40, 1.35, 16, 1, true), clothMat);
      robe.material.side = THREE.DoubleSide;
      add(robe, 0, 1.02, 0);
      const trim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.014, 6, 20), M(0xc9a227, 0.5, 0.35));
      trim.rotation.x = Math.PI / 2;
      add(trim, 0, 1.70, 0.02);
    }

    // ---- الذراعان بمفصل مرفق حقيقي ----
    [-1, 1].forEach(sd => {
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.056, 0.36, 10), clothMat);
      upper.rotation.z = sd * 0.10;
      add(upper, sd * 0.235 * build, 1.53, 0);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.056, 8, 8), clothMat), sd * 0.253 * build, 1.35, 0);
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.046, 0.34, 10), clothMat);
      fore.rotation.z = sd * (o.seated ? 0.55 : 0.06);
      fore.rotation.x = o.seated ? -0.85 : 0; // الجالس يضع ساعديه على الطاولة
      add(fore, sd * (o.seated ? 0.30 : 0.265) * build, o.seated ? 1.22 : 1.17, o.seated ? 0.14 : 0);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 8), skinMat);
      hand.scale.set(0.85, 1, 0.65);
      add(hand, sd * (o.seated ? 0.33 : 0.272) * build, o.seated ? 1.10 : 0.99, o.seated ? 0.30 : 0);
    });

    // ---- الساقان والحذاء ----
    if (!o.seated) {
      [-1, 1].forEach(sd => {
        const trouserMat = style === 'traditional' ? clothMat : M(0x1e222a, 0.75);
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.072, 0.50, 10), trouserMat), sd * 0.093, 0.72, 0);
        add(new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 8), trouserMat), sd * 0.093, 0.47, 0);
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.058, 0.44, 10), trouserMat), sd * 0.093, 0.24, 0);
        const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.062, 0.215), M(0x141416, 0.42, 0.15));
        add(shoe, sd * 0.093, 0.031, 0.038);
      });
    }

    g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return g;
  },

  avatarDataURL(char) {
    if (!this.supported) return null;
    const key = char.id || char.name;
    if (this._cache[key]) return this._cache[key];
    try {
      if (!this._renderer) {
        const canvas = document.createElement('canvas');
        canvas.width = 168; canvas.height = 196;
        this._renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
        this._renderer.setSize(168, 196, false);
        this._renderer.outputEncoding = THREE.sRGBEncoding;
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.0;
        this._scene = new THREE.Scene();
        // تأطير رأس وكتفين عن قرب - النِسَب الجديدة تتطلب كاميرا أقرب بكثير من السابق
        this._camera = new THREE.PerspectiveCamera(34, 168 / 196, 0.05, 20);
        this._camera.position.set(0.30, 2.05, 1.02);
        this._camera.lookAt(0, 1.94, 0);
        this._scene.add(new THREE.HemisphereLight(0xcfe2f5, 0x4a4238, 0.5));
        const key1 = new THREE.DirectionalLight(0xfff2dc, 1.05);
        key1.position.set(1.6, 2.6, 2.2);
        this._scene.add(key1);
        const fill = new THREE.DirectionalLight(0x9dc0e0, 0.42);
        fill.position.set(-1.8, 1.2, 1.0);
        this._scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffe9c4, 0.5);
        rim.position.set(-0.6, 2.2, -1.8);
        this._scene.add(rim);
      }
      const figure = this.buildFigure(char, {});
      this._scene.add(figure);
      this._renderer.render(this._scene, this._camera);
      const url = this._renderer.domElement.toDataURL('image/png');
      this._scene.remove(figure);
      this._cache[key] = url;
      return url;
    } catch (e) {
      this.supported = false;
      return null;
    }
  },

  avatarImg(char, cls) {
    const url = this.avatarDataURL(char);
    return url ? `<img class="${cls || 'avatar3d'}" src="${url}" alt="">` : null;
  }
};
