// مشاهد القصر الرئاسي الحية: (1) مشهد التنصيب في شاشة المقدمة - قصر بأعمدة وعلم ليبيا يرفرف
// بتموج قمم فعلي والرئيس واقف على المنصة، (2) قاعة مجلس الوزراء في تبويب الحكومة - يجلس حول
// الطاولة الوزراء المعيَّنون فعلياً (بمجسماتهم الشخصية الثابتة من Char3D) وتبقى مقاعد الشواغر خالية.
// كل مشهد يملك عارضه الخاص ويعمل بحلقة رسم فقط عندما يكون ظاهراً فعلاً - لا استهلاك خلفي صامت.

const Palace3D = {
  scenes: {}, // sceneId -> {renderer, scene, camera, raf, tick}
  supported: typeof THREE !== 'undefined',

  _mkScene(canvas, width, height) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    // نفس معالجة الصورة السينمائية المستخدمة في الخريطة المجسمة - كي تبدو كل مشاهد اللعبة من عالم واحد
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xc8dcf0, 0x4a4436, 0.35));
    const sun = new THREE.DirectionalLight(0xfff3d6, 0.85);
    sun.position.set(5, 11, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 32;
    sun.shadow.bias = -0.0014;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9ab4d0, 0.28);
    fill.position.set(-6, 4, -5);
    scene.add(fill);
    return { renderer, scene, camera };
  },

  // علم ليبيا (أحمر/أسود/أخضر + هلال ونجمة) مرسوم على قماش إجرائي يرفرف بإزاحة قمم جيبية حقيقية
  _mkLibyaFlag() {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 64;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#e70013'; ctx.fillRect(0, 0, 128, 16);
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 16, 128, 32);
    ctx.fillStyle = '#239e46'; ctx.fillRect(0, 48, 128, 16);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(60, 32, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(63, 32, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 4 / 5);
      const x = 72 + Math.cos(a) * 5, y = 32 + Math.sin(a) * 5;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    const geo = new THREE.PlaneGeometry(1.6, 0.9, 16, 8);
    const flag = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
    flag.userData.wave = t => {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setZ(i, Math.sin(x * 3.2 + t / 260) * 0.09 * ((x + 0.8) / 1.6));
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    };
    return flag;
  },

  // ------- مشهد التنصيب: قصر + علم + الرئيس على المنصة -------
  mountIntro(canvasId, presidentName, backgroundId) {
    if (!this.supported) return false;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return false;
    this.unmount('intro');
    const width = canvas.parentElement.clientWidth || 640;
    let ctx;
    try { ctx = this._mkScene(canvas, width, 280); } catch (e) { this.supported = false; return false; }
    const { scene, camera } = ctx;

    // أرضية الساحة
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.3, 32), new THREE.MeshStandardMaterial({ color: 0x3d3a33, roughness: 0.95 }));
    plaza.position.y = -0.15;
    plaza.receiveShadow = true;
    scene.add(plaza);

    // واجهة القصر: جسم + صف أعمدة + إفريز
    const palaceMat = new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.85 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(7.5, 2.6, 1.4), palaceMat);
    body.position.set(0, 1.3, -3.2);
    body.castShadow = true; body.receiveShadow = true;
    scene.add(body);
    for (let i = 0; i < 6; i++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 2.2, 10), palaceMat);
      col.position.set(-3 + i * 1.2, 1.1, -2.35);
      col.castShadow = true;
      scene.add(col);
    }
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 1.8), new THREE.MeshStandardMaterial({ color: 0xbfb49a, roughness: 0.85 }));
    cornice.position.set(0, 2.75, -3.1);
    scene.add(cornice);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x239e46, roughness: 0.6, metalness: 0.2 }));
    dome.position.set(0, 2.9, -3.2);
    scene.add(dome);

    // سارية العلم + العلم المرفرف
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.4, 8), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35 }));
    pole.position.set(2.7, 2.2, -1.4);
    scene.add(pole);
    const flag = this._mkLibyaFlag();
    flag.position.set(3.55, 3.9, -1.4);
    scene.add(flag);

    // المنصة والرئيس - مظهره الحتمي مشتق من اسمه وخلفيته السياسية عبر نفس مصنع الشخصيات
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.05, 8), new THREE.MeshStandardMaterial({ color: 0x5b4632, roughness: 0.7 }));
    podium.position.set(0, 0.52, 0.6);
    scene.add(podium);
    const president = Char3D.buildFigure(
      { id: 'president_' + (presidentName || ''), name: presidentName || 'الرئيس', role: backgroundId === 'military' ? 'لواء' : 'رئيس', category: 'government', traits: [] },
      { style: backgroundId === 'military' ? 'military' : 'suit' }
    );
    president.position.set(0, 0.28, 0.15);
    president.scale.setScalar(0.85);
    president.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(president);

    camera.position.set(0, 2.1, 6.4);
    camera.lookAt(0, 1.5, -0.5);

    ctx.tick = t => {
      flag.userData.wave(t);
      camera.position.x = Math.sin(t / 5200) * 0.9;
      camera.lookAt(0, 1.5, -0.5);
    };
    this.scenes.intro = ctx;
    this._startLoop('intro');
    return true;
  },

  // ------- قاعة مجلس الوزراء: مقعد لكل وزارة، يشغله المجسم الفعلي للوزير المعيَّن -------
  mountCabinet(canvasId, state) {
    if (!this.supported) return false;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return false;
    this.unmount('cabinet');
    const width = canvas.parentElement.clientWidth || 640;
    let ctx;
    try { ctx = this._mkScene(canvas, width, 250); } catch (e) { this.supported = false; return false; }
    const { scene, camera } = ctx;

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.2, 28), new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.9 }));
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);
    const table = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.16, 24), new THREE.MeshStandardMaterial({ color: 0x6b4f2f, roughness: 0.55 }));
    table.position.y = 0.85;
    table.castShadow = true; table.receiveShadow = true;
    scene.add(table);
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.85, 10), new THREE.MeshStandardMaterial({ color: 0x543d2a, roughness: 0.7 }));
    tableLeg.position.y = 0.42;
    scene.add(tableLeg);

    const seats = MINISTRIES.length;
    MINISTRIES.forEach((m, i) => {
      const angle = (i / seats) * Math.PI * 2;
      const x = Math.cos(angle) * 3.4, z = Math.sin(angle) * 3.4;
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), new THREE.MeshStandardMaterial({ color: 0x3a3128, roughness: 0.8 }));
      chair.position.set(x, 0.55, z);
      scene.add(chair);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a3128, roughness: 0.8 }));
      back.position.set(x * 1.09, 0.95, z * 1.09);
      back.lookAt(0, 0.95, 0);
      scene.add(back);

      const holderId = state.cabinet[m.id];
      const holder = holderId ? getCharacter(state, holderId) : null;
      if (holder) {
        const fig = Char3D.buildFigure(holder, { seated: true });
        fig.position.set(x, 0.35, z);
        fig.scale.setScalar(0.62);
        fig.lookAt(0, 0.35, 0);
        fig.traverse(o => { if (o.isMesh) o.castShadow = true; });
        scene.add(fig);
      }
    });

    camera.position.set(0, 5.2, 7.2);
    camera.lookAt(0, 0.6, 0);
    ctx.tick = t => {
      camera.position.x = Math.sin(t / 9000) * 7.2;
      camera.position.z = Math.cos(t / 9000) * 7.2;
      camera.lookAt(0, 0.6, 0);
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
