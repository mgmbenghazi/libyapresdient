// مشاهد القصر الرئاسي الحية: (1) مشهد التنصيب في شاشة المقدمة - قصر بعمارة حقيقية (درج ومنصة
// وصف أعمدة بقواعد وتيجان وأخاديد، وجملون مثلث، وقبة على رقبة يعلوها هلال) وساحة مبلَّطة وسجادة
// حمراء ونخيل وحرس شرف، وعلمان يرفرفان بتموج قمم فعلي؛ (2) قاعة مجلس الوزراء - قاعة مغلقة بجدران
// وإفريز خشبي وسجادة وثريا، طاولة بيضاوية عليها لوحات أسماء وأوراق وأكواب، ومقاعد بمساند يجلس
// عليها الوزراء المعيَّنون فعلياً بمجسماتهم الشخصية، والمقاعد الخالية شواغر حقيقية.
// كل مشهد يملك عارضه الخاص ويعمل بحلقة رسم فقط عندما يكون ظاهراً فعلاً - لا استهلاك خلفي صامت.

const Palace3D = {
  scenes: {}, // sceneId -> {renderer, scene, camera, raf, tick}
  supported: typeof THREE !== 'undefined',

  _M(c, r, m) { return new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.8 : r, metalness: m || 0 }); },

  _mkScene(canvas, width, height, opts) {
    const o = opts || {};
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    // نفس معالجة الصورة السينمائية المستخدمة في الخريطة المجسمة - كي تبدو كل مشاهد اللعبة من عالم واحد
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = o.exposure || 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(o.fov || 40, width / height, 0.1, 200);
    return { renderer, scene, camera };
  },

  // قبة سماء متدرجة تمنح المشهد الخارجي عمقاً وأفقاً بدل خلفية مسطحة
  _addSky(scene, top, mid, bottom) {
    const cv = document.createElement('canvas');
    cv.width = 8; cv.height = 128;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 128);
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(90, 20, 14),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false })));
  },

  _mkLibyaFlag() {
    const cv = document.createElement('canvas');
    cv.width = 192; cv.height = 96;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#e70013'; ctx.fillRect(0, 0, 192, 24);
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 24, 192, 48);
    ctx.fillStyle = '#239e46'; ctx.fillRect(0, 72, 192, 24);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(90, 48, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(95, 48, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 4 / 5);
      const x = 110 + Math.cos(a) * 8, y = 48 + Math.sin(a) * 8;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    const geo = new THREE.PlaneGeometry(1.7, 0.95, 20, 10);
    const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.92 }));
    flag.castShadow = true;
    flag.userData.wave = t => {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        const k = (x + 0.85) / 1.7; // السعة تتزايد كلما ابتعدنا عن السارية
        pos.setZ(i, (Math.sin(x * 3.4 + t / 240) * 0.11 + Math.sin(y * 2.1 + t / 190) * 0.04) * k);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    };
    return flag;
  },

  // عمود كلاسيكي كامل: قاعدة مدرّجة + بدن مخدَّد + تاج - الأسطوانة الملساء هي ما يجعل أي مبنى
  // يبدو بدائياً، والأخاديد والتاج والقاعدة هي ما يحوّله إلى عمارة
  _column(h, rad) {
    const grp = new THREE.Group();
    const stone = this._M(0xd9cfb8, 0.88);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(rad * 3.0, 0.10, rad * 3.0), stone);
    b1.position.y = 0.05; grp.add(b1);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.28, rad * 1.42, 0.11, 14), stone);
    b2.position.y = 0.155; grp.add(b2);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.9, rad, h, 16), stone);
    shaft.position.y = 0.21 + h / 2; grp.add(shaft);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const fl = new THREE.Mesh(new THREE.BoxGeometry(rad * 0.16, h * 0.97, rad * 0.16), this._M(0xcabfa6, 0.9));
      fl.position.set(Math.cos(a) * rad * 0.93, 0.21 + h / 2, Math.sin(a) * rad * 0.93);
      fl.rotation.y = -a;
      grp.add(fl);
    }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.02, rad * 0.9, 0.07, 14), stone);
    neck.position.y = 0.21 + h + 0.035; grp.add(neck);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(rad * 2.9, 0.15, rad * 2.9), stone);
    cap.position.y = 0.21 + h + 0.14; grp.add(cap);
    grp.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return grp;
  },

  _palm(scale) {
    const grp = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 2.6, 8), this._M(0x6b543a, 0.92));
    trunk.position.y = 1.3; grp.add(trunk);
    for (let i = 0; i < 6; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105 - i * 0.006, 0.016, 5, 10), this._M(0x5c4830, 0.95));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.35 + i * 0.38; grp.add(ring);
    }
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.5, 4), this._M(0x3f6b32, 0.9));
      frond.position.set(Math.cos(a) * 0.52, 2.72, Math.sin(a) * 0.52);
      frond.rotation.set(Math.cos(a) * 1.05, -a, Math.sin(a) * 1.05 + Math.PI);
      frond.scale.z = 0.32;
      grp.add(frond);
    }
    const dates = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), this._M(0xa8792c, 0.85));
    dates.position.y = 2.6; dates.scale.y = 0.6; grp.add(dates);
    grp.scale.setScalar(scale || 1);
    grp.traverse(m => { if (m.isMesh) m.castShadow = true; });
    return grp;
  },

  // ------- مشهد التنصيب: قصر + ساحة + علمان + الرئيس على المنصة -------
  mountIntro(canvasId, presidentName, backgroundId) {
    if (!this.supported) return false;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return false;
    this.unmount('intro');
    const width = canvas.parentElement.clientWidth || 640;
    let ctx;
    try { ctx = this._mkScene(canvas, width, 300, { fov: 38, exposure: 0.98 }); }
    catch (e) { this.supported = false; return false; }
    const { scene, camera } = ctx;

    this._addSky(scene, '#1d4a78', '#7ba3c4', '#e8d6b4');
    scene.fog = new THREE.Fog(0xcbd8dd, 26, 72);
    scene.add(new THREE.HemisphereLight(0xbfd8f0, 0x6b5c44, 0.42));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.15);
    sun.position.set(7, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -10; sc.near = 1; sc.far = 42;
    sun.shadow.bias = -0.0012;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9dc0e0, 0.3);
    fill.position.set(-8, 5, 4);
    scene.add(fill);

    const stone = this._M(0xd9cfb8, 0.88);
    const stoneDark = this._M(0xc3b89e, 0.9);

    // ساحة مبلَّطة بنمط شطرنجي خفيف
    const plaza = new THREE.Mesh(new THREE.BoxGeometry(32, 0.3, 24), this._M(0x9a948a, 0.95));
    plaza.position.set(0, -0.15, 2);
    plaza.receiveShadow = true;
    scene.add(plaza);
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 7; j++) {
        if ((i + j) % 2) continue;
        const tile = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 1.5), this._M(0xaea79a, 0.95));
        tile.position.set(-6.4 + i * 1.6, 0.005, -1.4 + j * 1.6);
        tile.receiveShadow = true;
        scene.add(tile);
      }
    }

    // درج صاعد إلى القصر
    for (let i = 0; i < 4; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(11 - i * 0.5, 0.16, 1.0 - i * 0.12), stoneDark);
      step.position.set(0, 0.08 + i * 0.16, -1.4 - i * 0.42);
      step.castShadow = true; step.receiveShadow = true;
      scene.add(step);
    }

    // كتلة القصر وجناحاه بنوافذ مقوّسة غائرة
    const podiumBase = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.7, 4.6), stoneDark);
    podiumBase.position.set(0, 0.35, -4.6);
    podiumBase.castShadow = true; podiumBase.receiveShadow = true;
    scene.add(podiumBase);
    const body = new THREE.Mesh(new THREE.BoxGeometry(11, 3.1, 3.2), stone);
    body.position.set(0, 2.25, -5.1);
    body.castShadow = true; body.receiveShadow = true;
    scene.add(body);
    const doorway = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 0.14), this._M(0x4a3520, 0.6));
    doorway.position.set(0, 1.75, -3.55); scene.add(doorway);
    const doorArch = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.14, 16, 1, false, 0, Math.PI), this._M(0x4a3520, 0.6));
    doorArch.rotation.x = Math.PI / 2; doorArch.rotation.z = Math.PI;
    doorArch.position.set(0, 2.8, -3.55); scene.add(doorArch);
    [-1, 1].forEach(sd => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 3.6), stone);
      wing.position.set(sd * 6.6, 1.95, -4.9);
      wing.castShadow = true; wing.receiveShadow = true;
      scene.add(wing);
      for (let w = 0; w < 3; w++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.95, 0.1), this._M(0x2c3d4a, 0.35, 0.4));
        win.position.set(sd * 6.6 - 0.95 + w * 0.95, 2.1, -3.06);
        scene.add(win);
        const wa = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 12, 1, false, 0, Math.PI), this._M(0x2c3d4a, 0.35, 0.4));
        wa.rotation.x = Math.PI / 2; wa.rotation.z = Math.PI;
        wa.position.set(sd * 6.6 - 0.95 + w * 0.95, 2.58, -3.06);
        scene.add(wa);
      }
    });

    // صف الأعمدة أمام الواجهة
    for (let i = 0; i < 6; i++) {
      const col = this._column(2.55, 0.20);
      col.position.set(-4.4 + i * 1.76, 0.7, -3.35);
      scene.add(col);
    }

    // العتب والإفريز والجملون المثلث والشعار
    const entab = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.42, 1.5), stone);
    entab.position.set(0, 3.72, -3.35); entab.castShadow = true; scene.add(entab);
    const frieze = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.3, 1.62), stoneDark);
    frieze.position.set(0, 4.06, -3.35); frieze.castShadow = true; scene.add(frieze);
    // جملون مثلث: منشور ثلاثي محوره على العمق - يُدوَّر على مستوى الهندسة نفسها (لا على المجسم)
    // كي تشير قمته للأعلى بدقة، فدوران أويلر المركّب كان يقلبه إلى كتلة معترضة تحجب الواجهة
    const pedGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.5, 3);
    pedGeo.rotateX(-Math.PI / 2);
    const pediment = new THREE.Mesh(pedGeo, stone);
    pediment.scale.set(7.35, 1, 1);
    pediment.position.set(0, 4.66, -3.35);
    pediment.castShadow = true; scene.add(pediment);
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.30, 20), this._M(0xc9a227, 0.4, 0.6));
    emblem.position.set(0, 4.72, -2.62); scene.add(emblem);

    // القبة على رقبة مطوَّقة يعلوها هلال
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.45, 1.0, 20), stone);
    drum.position.set(0, 4.3, -5.1); drum.castShadow = true; scene.add(drum);
    const drumRing = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.07, 8, 24), this._M(0xc9a227, 0.5, 0.5));
    drumRing.rotation.x = Math.PI / 2;
    drumRing.position.set(0, 4.82, -5.1); scene.add(drumRing);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.42, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2), this._M(0x1f8b45, 0.42, 0.25));
    dome.position.set(0, 4.8, -5.1); dome.castShadow = true; scene.add(dome);
    const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8), this._M(0xc9a227, 0.4, 0.7));
    finial.position.set(0, 6.5, -5.1); scene.add(finial);
    const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.038, 8, 18, Math.PI * 1.35), this._M(0xc9a227, 0.35, 0.75));
    crescent.position.set(0, 6.95, -5.1); crescent.rotation.z = -0.6; scene.add(crescent);

    // سجادة حمراء بحاشية ذهبية
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.03, 7.2), this._M(0x8e1f24, 0.95));
    carpet.position.set(0, 0.02, 1.6); carpet.receiveShadow = true; scene.add(carpet);
    [-1, 1].forEach(sd => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 7.2), this._M(0xc9a227, 0.6, 0.3));
      edge.position.set(sd * 0.98, 0.025, 1.6); scene.add(edge);
    });

    // ساريتا علم
    [-1, 1].forEach(sd => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 5.6, 10), this._M(0xb9bec4, 0.35, 0.75));
      pole.position.set(sd * 4.3, 2.8, -0.6);
      pole.castShadow = true; scene.add(pole);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), this._M(0xc9a227, 0.35, 0.8));
      knob.position.set(sd * 4.3, 5.68, -0.6); scene.add(knob);
      const flag = this._mkLibyaFlag();
      flag.position.set(sd * 4.3 + 0.87, 5.05, -0.6);
      scene.add(flag);
      if (sd === 1) ctx.flag = flag; else ctx.flag2 = flag;
    });

    // منصة الخطابة بميكروفون + الرئيس
    const podium = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.62), this._M(0x6b4a2e, 0.7));
    podium.position.set(0, 0.53, 1.15);
    podium.castShadow = true; podium.receiveShadow = true; scene.add(podium);
    const podTop = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.08, 0.74), this._M(0x54381f, 0.6));
    podTop.position.set(0, 1.09, 1.15); podTop.castShadow = true; scene.add(podTop);
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6), this._M(0x2a2a2e, 0.5, 0.4));
    mic.rotation.x = 0.4; mic.position.set(0.12, 1.28, 1.05); scene.add(mic);
    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this._M(0x1a1a1e, 0.6));
    micHead.position.set(0.12, 1.47, 0.98); scene.add(micHead);

    const president = Char3D.buildFigure(
      { id: 'president_' + (presidentName || ''), name: presidentName || 'الرئيس', role: backgroundId === 'military' ? 'لواء' : 'رئيس', category: 'government', traits: [] },
      { style: backgroundId === 'military' ? 'military' : 'suit' }
    );
    president.position.set(0, 0, 1.75);
    president.scale.setScalar(0.86);
    scene.add(president);

    // حرس شرف على جانبي السجادة
    [-1, 1].forEach(sd => {
      const guard = Char3D.buildFigure({ id: 'guard' + sd, name: 'حرس', role: 'لواء', category: 'government', traits: [] }, { style: 'military', lod: true });
      guard.position.set(sd * 1.8, 0, -0.5);
      guard.scale.setScalar(0.8);
      guard.rotation.y = -sd * 0.35;
      scene.add(guard);
    });

    // نخيل يؤطر الساحة
    [[-8.4, 2.2, 1.05], [8.4, 2.2, 1.05], [-9.6, -1.4, 0.85], [9.6, -1.4, 0.85]].forEach(([x, z, s]) => {
      const p = this._palm(s);
      p.position.set(x, 0, z);
      scene.add(p);
    });

    camera.position.set(0.5, 3.9, 13.6);
    camera.lookAt(0, 2.9, -3.4);
    ctx.tick = t => {
      if (ctx.flag) ctx.flag.userData.wave(t);
      if (ctx.flag2) ctx.flag2.userData.wave(t + 800);
      camera.position.x = Math.sin(t / 6000) * 1.8;
      camera.position.y = 3.9 + Math.sin(t / 8000) * 0.22;
      camera.lookAt(0, 2.9, -3.4);
    };
    this.scenes.intro = ctx;
    this._startLoop('intro');
    return true;
  },

  // ------- قاعة مجلس الوزراء: قاعة حقيقية بمقعد لكل وزارة يشغله المجسم الفعلي للوزير -------
  mountCabinet(canvasId, state) {
    if (!this.supported) return false;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return false;
    this.unmount('cabinet');
    const width = canvas.parentElement.clientWidth || 640;
    let ctx;
    try { ctx = this._mkScene(canvas, width, 270, { fov: 42, exposure: 1.0 }); }
    catch (e) { this.supported = false; return false; }
    const { scene, camera } = ctx;

    scene.add(new THREE.HemisphereLight(0xdce6f2, 0x3a2f22, 0.45));
    const key = new THREE.DirectionalLight(0xffeccd, 0.95);
    key.position.set(4, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const kc = key.shadow.camera;
    kc.left = -8; kc.right = 8; kc.top = 8; kc.bottom = -8; kc.near = 1; kc.far = 26;
    key.shadow.bias = -0.0014;
    scene.add(key);
    const warm = new THREE.PointLight(0xffd9a0, 0.8, 18);
    warm.position.set(0, 4.0, 0);
    scene.add(warm);

    // القاعة: أرضية خشبية + سجادة، جدار دائري بإفريز خشبي، سقف
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 0.2, 36), this._M(0x4a3d2c, 0.95));
    floor.position.y = -0.1; floor.receiveShadow = true; scene.add(floor);
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.7, 0.03, 36), this._M(0x6d2b30, 0.96));
    rug.position.y = 0.015; rug.receiveShadow = true; scene.add(rug);
    const rugRing = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.06, 6, 40), this._M(0xb08d1f, 0.7, 0.2));
    rugRing.rotation.x = Math.PI / 2; rugRing.position.y = 0.035; scene.add(rugRing);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 4.6, 36, 1, true), this._M(0xcfc3ab, 0.92));
    wall.material.side = THREE.BackSide;
    wall.position.y = 2.3; wall.receiveShadow = true; scene.add(wall);
    const wainscot = new THREE.Mesh(new THREE.CylinderGeometry(7.15, 7.15, 1.4, 36, 1, true), this._M(0x5b4028, 0.85));
    wainscot.material.side = THREE.BackSide;
    wainscot.position.y = 0.7; scene.add(wainscot);
    const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 0.2, 36), this._M(0xe0d6c2, 0.95));
    ceiling.position.y = 4.7; scene.add(ceiling);

    // ثريا معلّقة
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), this._M(0x8a7a55, 0.5, 0.5));
    rod.position.y = 4.2; scene.add(rod);
    const chand = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 24), this._M(0xc9a227, 0.4, 0.7));
    chand.rotation.x = Math.PI / 2; chand.position.y = 3.78; scene.add(chand);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe6b8 }));
      bulb.position.set(Math.cos(a) * 0.72, 3.86, Math.sin(a) * 0.72);
      scene.add(bulb);
    }

    // شعار الدولة على الجدار + علم على حامل
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.72, 24), this._M(0xc9a227, 0.45, 0.55));
    emblem.position.set(0, 2.6, -6.85); scene.add(emblem);
    const emblemRing = new THREE.Mesh(new THREE.TorusGeometry(0.80, 0.06, 8, 28), this._M(0x6b4a2e, 0.6));
    emblemRing.position.set(0, 2.6, -6.86); scene.add(emblemRing);
    const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 3.0, 10), this._M(0xb9bec4, 0.4, 0.7));
    standPole.position.set(-2.7, 1.5, -5.6); scene.add(standPole);
    const wallFlag = this._mkLibyaFlag();
    wallFlag.scale.setScalar(0.72);
    wallFlag.position.set(-2.1, 2.55, -5.6);
    scene.add(wallFlag);
    ctx.flag = wallFlag;

    // طاولة بيضاوية بسطح مصقول وحافة وقاعدة
    const table = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.14, 40), this._M(0x7a5732, 0.35, 0.1));
    table.scale.z = 0.78;
    table.position.y = 0.86; table.castShadow = true; table.receiveShadow = true; scene.add(table);
    const tEdge = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.075, 8, 44), this._M(0x5b3f22, 0.5));
    tEdge.rotation.x = Math.PI / 2; tEdge.scale.z = 0.78; tEdge.position.y = 0.86; scene.add(tEdge);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.72, 0.86, 14), this._M(0x543d2a, 0.75));
    pedestal.position.y = 0.43; pedestal.castShadow = true; scene.add(pedestal);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.1, 20), this._M(0x4a3524, 0.8));
    foot.position.y = 0.05; foot.receiveShadow = true; scene.add(foot);

    const seats = MINISTRIES.length;
    MINISTRIES.forEach((m, i) => {
      const angle = (i / seats) * Math.PI * 2;
      const x = Math.cos(angle) * 3.55, z = Math.sin(angle) * 3.05; // توزيع بيضاوي يطابق الطاولة

      // مقعد بمسند ظهر ووسادة وأربع أرجل
      const chair = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.11, 0.6), this._M(0x3d3128, 0.75));
      seat.position.y = 0.56; seat.castShadow = true; chair.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.1), this._M(0x4a3a2c, 0.75));
      back.position.set(0, 1.02, 0.3); back.castShadow = true; chair.add(back);
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.07, 0.5), this._M(0x6d2b30, 0.9));
      cushion.position.y = 0.625; chair.add(cushion);
      [[-0.25, -0.24], [0.25, -0.24], [-0.25, 0.24], [0.25, 0.24]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.56, 6), this._M(0x2e251d, 0.7));
        leg.position.set(lx, 0.28, lz); chair.add(leg);
      });
      chair.position.set(x, 0, z);
      chair.lookAt(0, 0, 0);
      scene.add(chair);

      // لوحة اسم وأوراق وكوب ماء أمام كل مقعد
      const tx = Math.cos(angle) * 2.25, tz = Math.sin(angle) * 1.85;
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.05), this._M(0x2b2b2f, 0.5));
      plate.position.set(tx, 0.98, tz); plate.lookAt(0, 0.98, 0); scene.add(plate);
      const papers = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.012, 0.22), this._M(0xf0ece2, 0.85));
      papers.position.set(tx * 0.86, 0.936, tz * 0.86); papers.rotation.y = -angle; scene.add(papers);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.13, 10),
        new THREE.MeshStandardMaterial({ color: 0xbcd8e8, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.65 }));
      glass.position.set(tx * 0.9 + 0.2, 0.995, tz * 0.9); scene.add(glass);

      const holderId = state.cabinet[m.id];
      const holder = holderId ? getCharacter(state, holderId) : null;
      if (holder) {
        const fig = Char3D.buildFigure(holder, { seated: true, lod: true });
        fig.scale.setScalar(0.68);
        fig.position.set(x, 0.02, z); // أسفل الجذع (1.13-0.18)×0.68 ينزل على سطح المقعد عند 0.66
        fig.lookAt(0, 0.02, 0);
        scene.add(fig);
      }
    });

    camera.position.set(0, 3.4, 5.8);
    camera.lookAt(0, 1.05, 0);
    ctx.tick = t => {
      if (ctx.flag) ctx.flag.userData.wave(t);
      const a = t / 13000;
      // نصف قطر أصغر من نصف قطر القاعة كي تبقى الكاميرا داخلها دوماً
      camera.position.set(Math.sin(a) * 5.8, 3.4 + Math.sin(a * 1.7) * 0.3, Math.cos(a) * 5.8);
      camera.lookAt(0, 1.05, 0);
    };
    this.scenes.cabinet = ctx;
    this._startLoop('cabinet');
    return true;
  },

  _startLoop(id) {
    const ctx = this.scenes[id];
    if (!ctx || ctx.raf) return;
    ctx.last = 0;
    const loop = t => {
      ctx.raf = requestAnimationFrame(loop);
      if (t - ctx.last < 33) return; // سقف ~30 إطاراً/ثانية
      // لا نرسم مشهداً مخفياً: قاعة المجلس تبقى مركّبة حتى وأنت في تبويب آخر، وكان رسمها
      // المتواصل يلتهم المعالجة بلا أي فائدة ويُبطئ اللعبة كلها
      if (ctx.renderer.domElement.offsetParent === null) return;
      ctx.last = t;
      if (ctx.tick) ctx.tick(t);
      ctx.renderer.render(ctx.scene, ctx.camera);
    };
    ctx.raf = requestAnimationFrame(loop);
  },

  unmount(id) {
    const ctx = this.scenes[id];
    if (!ctx) return;
    if (ctx.raf) cancelAnimationFrame(ctx.raf);
    ctx.renderer.dispose();
    delete this.scenes[id];
  }
};
