'use strict';

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const welcome = $('#welcome');
  const gifts = $('#gifts');
  const finale = $('#finale');
  const fireworksCanvas = $('#fireworks-canvas');
  const pianoAudio = $('#piano-audio');


  // Canvas sao chuyển động
  const starsCanvas = document.getElementById('stars-canvas');
  const scCtx = starsCanvas.getContext('2d');

  const finaleTextEl = document.getElementById('finale-text');
  const finaleMessage = 'Cảm ơn Mỹ vì đã là một phần thanh xuân của tụi mình. Chúc bạn luôn hạnh phúc, bình yên và được yêu thương.';

  // Lời chúc cho từng hộp
  const boxMessages = {
    1: 'Mỹ à, trong những lúc mọi thứ rối tung, bạn luôn là người giúp cả nhóm bình tĩnh lại. Giống như ngọn hải đăng không bao giờ tắt, bạn âm thầm soi sáng và dẫn đường. Tuổi mới mong bạn cũng tìm thấy ánh sáng riêng cho mình, để mỗi ngày đều tràn đầy bình yên và niềm vui.',
    2: 'Bạn không hay nói ra, nhưng mỗi hành động của bạn đều khiến tụi mình cảm nhận được sự quan tâm. Cảm ơn Mỹ vì những lúc giúp đỡ mà chẳng bao giờ kể công. Chúc bạn luôn nhận lại được sự ấm áp gấp nhiều lần những gì bạn đã cho đi.',
    3: 'Đôi khi vẻ lạnh lùng của bạn khiến người khác e dè, nhưng ai hiểu rồi sẽ thấy bên trong là một trái tim biết yêu thương và quan tâm sâu sắc. Mong tuổi mới, bạn gặp được những người đủ kiên nhẫn và chân thành để ở lại bên bạn, cùng bạn chia sẻ mọi điều.',
    4: 'Mỹ ơi, phía trước bạn còn cả một hành trình dài với bao điều chờ đón. Chúc bạn bước đi với sự tự tin, mở lòng đón nhận yêu thương, và dũng cảm thử những điều mới. Dù bạn đi đâu, tụi mình vẫn sẽ luôn ở đây — bên cạnh và ủng hộ bạn.'
  };

  // Ảnh màn kết: hỗ trợ nhiều ảnh trong assets/photos/ (slideshow), fallback group.jpg
  const groupPhoto = document.getElementById('group-photo');
  const finalePhotos = [];
  const finalePhotosSet = new Set();
  let finalePhotoIndex = 0;
  let finaleSlideTimer = null;

  function tryPreload(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (!finalePhotosSet.has(url)) {
          finalePhotosSet.add(url);
          finalePhotos.push(url);
        }
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function reorderFinalePhotos() {
    const preferredOrder = ['photo04','photo05','photo06','photo01','photo02','photo03'];
    const lastItem = 'photo07';

    const toBaseNoExt = (u) => {
      const file = u.split('/').pop().toLowerCase();
      const dot = file.lastIndexOf('.');
      return dot > 0 ? file.slice(0, dot) : file;
    };

    const seen = new Set();
    const byKey = new Map();
    finalePhotos.forEach(u => byKey.set(toBaseNoExt(u), u));

    const ordered = [];

    // push preferred in order if present
    preferredOrder.forEach(key => {
      if (byKey.has(key)) {
        const url = byKey.get(key);
        if (!seen.has(url)) { ordered.push(url); seen.add(url); }
      }
    });

    // push all others except lastItem
    finalePhotos.forEach(u => {
      const key = toBaseNoExt(u);
      if (key !== lastItem && !preferredOrder.includes(key)) {
        if (!seen.has(u)) { ordered.push(u); seen.add(u); }
      }
    });

    // push lastItem at the very end if present
    if (byKey.has(lastItem)) {
      const url = byKey.get(lastItem);
      if (!seen.has(url)) { ordered.push(url); seen.add(url); }
    }

    // apply
    finalePhotos.length = 0;
    ordered.forEach(u => finalePhotos.push(u));
  }

  async function preloadFinalePhotos() {
    const exts = ['jpg','png','jpeg','webp'];
    const prefixes = ['', 'photo', 'img', 'image', 'pic', 'group', 'anh', 'hinh', 'mem'];
    const tasks = [];
    // Thử tối đa 50 ảnh theo nhiều mẫu: N, NN, prefixN, prefixNN
    for (let i = 1; i <= 50; i++) {
      const n1 = String(i);
      const n2 = String(i).padStart(2, '0');
      for (const e of exts) {
        // tên chỉ số: 1.jpg, 01.jpg
        tasks.push(tryPreload(`assets/photos/${n1}.${e}`));
        tasks.push(tryPreload(`assets/photos/${n2}.${e}`));
        // các tiền tố phổ biến
        for (const p of prefixes) {
          tasks.push(tryPreload(`assets/photos/${p}${n1}.${e}`));
          tasks.push(tryPreload(`assets/photos/${p}${n2}.${e}`));
        }
      }
    }
    await Promise.all(tasks);
    if (finalePhotos.length === 0) {
      await tryPreload('assets/group.jpg');
    }
    reorderFinalePhotos();
  }

  function startFinaleSlideshow() {
    if (!groupPhoto || finalePhotos.length === 0) return;
    if (finaleSlideTimer) { clearInterval(finaleSlideTimer); }
    // Bắt đầu từ ảnh đầu tiên theo thứ tự đã sắp xếp
    finalePhotoIndex = 0;
    groupPhoto.style.opacity = '0';
    const first = finalePhotos[finalePhotoIndex];
    const pre = new Image();
    pre.onload = () => {
      groupPhoto.src = first;
      groupPhoto.style.display = 'block';
      requestAnimationFrame(() => { groupPhoto.style.opacity = '1'; });
    };
    pre.onerror = () => { groupPhoto.style.display = 'none'; };
    pre.src = first;

    finaleSlideTimer = setInterval(() => {
      if (finalePhotos.length <= 1) return;
      const nextIndex = (finalePhotoIndex + 1) % finalePhotos.length;
      const nextUrl = finalePhotos[nextIndex];
      groupPhoto.style.opacity = '0';
      const img = new Image();
      img.onload = () => {
        groupPhoto.src = nextUrl;
        requestAnimationFrame(() => { groupPhoto.style.opacity = '1'; });
        finalePhotoIndex = nextIndex;
      };
      img.onerror = () => {};
      img.src = nextUrl;
    }, 4000);
  }

  preloadFinalePhotos();

  // Khởi tạo pháo hoa trên canvas
  const fwCtx = fireworksCanvas.getContext('2d');
  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let fireworksRunning = false;
  let fireworksBursts = [];

  function resizeCanvas() {
    const { innerWidth: w, innerHeight: h } = window;
    // Fireworks
    fireworksCanvas.width = Math.floor(w * dpr);
    fireworksCanvas.height = Math.floor(h * dpr);
    fireworksCanvas.style.width = w + 'px';
    fireworksCanvas.style.height = h + 'px';
    fwCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Stars
    starsCanvas.width = Math.floor(w * dpr);
    starsCanvas.height = Math.floor(h * dpr);
    starsCanvas.style.width = w + 'px';
    starsCanvas.style.height = h + 'px';
    scCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  class Particle {
    constructor(x, y, color) {
      this.x = x; this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 0;
      this.lifeMax = 60 + Math.floor(Math.random() * 30);
      this.size = 1 + Math.random() * 2;
      this.color = color;
    }
    step() {
      this.life++;
      this.vy += 0.03; // gravity
      this.vx *= 0.99; this.vy *= 0.99; // air drag
      this.x += this.vx; this.y += this.vy;
      return this.life < this.lifeMax;
    }
    draw(ctx) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class Burst {
    constructor(x, y, color) {
      this.x = x; this.y = y; this.color = color;
      this.particles = Array.from({ length: 60 + Math.floor(Math.random() * 30) }, () => new Particle(x, y, color));
    }
    step(ctx) {
      this.particles = this.particles.filter(p => p.step());
      this.particles.forEach(p => p.draw(ctx));
      return this.particles.length > 0;
    }
  }

  function randomColor() {
    const colors = ['#ff98d7','#8be9fd','#ffd36e','#7ef0c9','#c39bff','#ffad8e'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function spawnFireworkAt(x, y) {
    fireworksBursts.push(new Burst(x, y, randomColor()));
    if (!fireworksRunning) {
      fireworksRunning = true;
      requestAnimationFrame(tickFireworks);
    }
  }

  function spawnFireworkRandom(times = 1) {
    const { innerWidth: w, innerHeight: h } = window;
    for (let i = 0; i < times; i++) {
      const rx = 60 + Math.random() * (w - 120);
      const ry = 60 + Math.random() * (h * 0.6);
      spawnFireworkAt(rx, ry);
    }
  }

  function tickFireworks() {
    if (!fireworksRunning) return;
    fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    fireworksBursts = fireworksBursts.filter(b => b.step(fwCtx));
    if (fireworksBursts.length === 0) {
      fireworksRunning = false;
      return;
    }
    requestAnimationFrame(tickFireworks);
  }

  // ==== Sao chuyển động & sao băng ====
  const starLayers = [
    { count: 90, speedY: 0.03, size: [0.6, 1.2], alpha: [0.35, 0.7] },
    { count: 70, speedY: 0.06, size: [0.8, 1.6], alpha: [0.45, 0.85] },
    { count: 50, speedY: 0.1, size: [1.0, 2.0], alpha: [0.55, 0.95] }
  ];
  let stars = [];
  function randBetween(min, max) { return min + Math.random() * (max - min); }

  function initStars() {
    const { innerWidth: w, innerHeight: h } = window;
    stars = [];
    starLayers.forEach((layer, li) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: randBetween(layer.size[0], layer.size[1]),
          a: randBetween(layer.alpha[0], layer.alpha[1]),
          vy: layer.speedY + Math.random() * layer.speedY * 0.6,
          twinkle: Math.random() * Math.PI * 2,
          layer: li
        });
      }
    });
  }
  initStars();

  // Sao băng
  const shootingStars = [];
  function spawnShootingStar() {
    const { innerWidth: w, innerHeight: h } = window;
    const startX = randBetween(-80, w * 0.6);
    const startY = randBetween(-140, -40);
    const len = randBetween(90, 180);
    const speed = randBetween(7, 12);
    // hướng đổ chéo xuống phải (top-left -> bottom-right)
    const angle = randBetween(0.62, 0.82);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed; // > 0 (đi xuống)
    shootingStars.push({ x: startX, y: startY, vx, vy, len, life: 0, lifeMax: randBetween(45, 85) });
  }

  let nextShootAt = performance.now() + 700 + Math.random() * 1200;

  function tickStars(now) {
    const { innerWidth: w, innerHeight: h } = window;
    scCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);

    // vẽ sao nền
    scCtx.save();
    scCtx.globalCompositeOperation = 'lighter';
    stars.forEach(s => {
      s.y += s.vy;
      if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
      const tw = (Math.sin(s.twinkle + now * 0.0015) + 1) * 0.5; // 0..1
      const alpha = s.a * (0.6 + 0.4 * tw);
      scCtx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      scCtx.beginPath();
      scCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      scCtx.fill();
    });
    scCtx.restore();

    // sao băng
    if (now > nextShootAt && shootingStars.length < 6) {
      const burst = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < burst; i++) spawnShootingStar();
      nextShootAt = now + 700 + Math.random() * 1200;
    }
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const st = shootingStars[i];
      st.life++;
      st.x += st.vx; st.y += st.vy;
      const t = st.life / st.lifeMax;
      const opacity = Math.max(0, 1 - t);
      const trailLen = st.len * (0.6 + 0.4 * (1 - t));

      scCtx.strokeStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
      scCtx.lineWidth = 2;
      scCtx.beginPath();
      scCtx.moveTo(st.x, st.y);
      scCtx.lineTo(st.x - st.vx * 2 - trailLen * Math.sign(st.vx), st.y - st.vy * 2 - trailLen * Math.sign(st.vy));
      scCtx.stroke();

      if (st.life > st.lifeMax || st.x < -200 || st.x > w + 200 || st.y > h + 200) {
        shootingStars.splice(i, 1);
      }
    }

    requestAnimationFrame(tickStars);
  }
  requestAnimationFrame(tickStars);

  // Hiệu ứng gõ chữ
  function typeText(el, text, speed = 24) {
    el.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'type-cursor';
    cursor.textContent = '▋';
    el.appendChild(cursor);

    let i = 0;
    function step() {
      if (i < text.length) {
        cursor.insertAdjacentText('beforebegin', text[i]);
        i++;
        setTimeout(step, Math.max(14, speed + (Math.random() * 30 - 15)));
      } else {
        cursor.remove();
      }
    }
    step();
  }

  // Âm thanh pop nhỏ bằng WebAudio (không cần file)
  function playPopSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  }

  // Cấu hình audio lặp từ đầu đến cuối
  if (pianoAudio) {
    pianoAudio.loop = true;
    pianoAudio.volume = 0.7;
  }


  function tryPlayAudio() {
    if (!pianoAudio) return Promise.resolve(false);
    const p = pianoAudio.play();
    if (p && typeof p.then === 'function') {
      return p.then(() => true).catch(() => false);
    }
    return Promise.resolve(!!p);
  }

  // Thử phát ngay lập tức, không chờ sự kiện
  tryPlayAudio();

  function bindAutoplayOnInteraction() {
    if (!pianoAudio) return;
    const events = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel', 'scroll'];
    let done = false;
    const onInteract = async () => {
      if (done) return;
      const ok = await tryPlayAudio();
      if (ok || !pianoAudio.paused) {
        done = true;
        events.forEach(ev => window.removeEventListener(ev, onInteract, true));
      }
    };
    events.forEach(ev => window.addEventListener(ev, onInteract, { passive: true, capture: true }));
  }

  // Thử autoplay khi trang tải + các sự kiện liên quan
  window.addEventListener('DOMContentLoaded', async () => {
    if (!pianoAudio) return;
    await tryPlayAudio();
    bindAutoplayOnInteraction();
  });
  window.addEventListener('pageshow', () => { if (pianoAudio && pianoAudio.paused) tryPlayAudio(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && pianoAudio && pianoAudio.paused) tryPlayAudio(); });


  // Điều hướng sang mở quà
  $('#start-btn').addEventListener('click', async () => {
    welcome.classList.remove('visible');
    gifts.classList.add('visible');
    spawnFireworkRandom(2);

    // Nếu autoplay bị chặn, thử phát khi có tương tác
    if (pianoAudio && pianoAudio.paused) {
      await tryPlayAudio();
    }
  });

  // Hộp quà logic
  const opened = new Set();
  $$('.gift-box').forEach(box => {
    const id = Number(box.getAttribute('data-box-id'));
    const messageEl = $('.message', box);

    function openBox() {
      if (opened.has(id)) return;
      opened.add(id);
      box.classList.add('open');
      playPopSound();

      // Vị trí hộp để bắn pháo hoa gần đó
      const rect = box.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height * 0.1;
      spawnFireworkAt(x, y);

      // Gõ chữ
      typeText(messageEl, boxMessages[id]);

      // Nếu mở đủ 4 hộp => màn kết thúc
      if (opened.size === 4) {
        setTimeout(showFinale, 700);
      }
    }

    box.addEventListener('click', openBox);
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBox();
      }
    });
  });

  function showFinale() {
    finale.classList.add('visible');

    // Đảm bảo ẩn ảnh ngay khi vào màn kết và reset slideshow
    if (groupPhoto) { groupPhoto.style.display = 'none'; groupPhoto.style.opacity = '0'; }
    if (finaleSlideTimer) { clearInterval(finaleSlideTimer); finaleSlideTimer = null; }

    // Gõ thông điệp kết thúc chậm rãi
    if (finaleTextEl) {
      typeText(finaleTextEl, finaleMessage, 38);
    }

    // Khởi động slideshow ảnh sau 8 giây
    setTimeout(startFinaleSlideshow, 8000);

    // Bắn pháo hoa liên tục trong 10s
    let t = 0;
    const duration = 10000; // 10s
    const startAt = performance.now();

    function loop(now) {
      t = now - startAt;
      spawnFireworkRandom(2 + Math.floor(Math.random() * 3));
      if (t < duration) {
        setTimeout(() => requestAnimationFrame(loop), 220 + Math.random() * 160);
      }
    }
    requestAnimationFrame(loop);

    // Không dừng nhạc ở cuối nữa, nhạc chạy liên tục đến khi người dùng tắt
  }
})(); 