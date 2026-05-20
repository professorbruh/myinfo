// =====================================================
// HERO PIXEL-ART ANIMATION — Refined Minecraft-style
// =====================================================
(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  // Theme palette
  var C = {
    sky1: '#08090c',
    sky2: '#111318',
    sky3: '#1a1d21',
    gold: '#ffc800',
    goldDim: '#b38e00',
    goldSoft: 'rgba(255,200,0,0.08)',
    // Ground layers
    grass: '#2d6b1e',
    grassLight: '#3a8a28',
    dirt: '#6b4226',
    dirtDark: '#4a2e1a',
    stone: '#7a7a7a',
    stoneDark: '#5a5a5a',
    coal: '#333',
    goldOre: '#ffc800',
    // Character
    skin: '#c4956a',
    hair: '#3d2b1f',
    shirt: '#3ba3a1',
    shirtDark: '#2e8a88',
    pants: '#3b5998',
    pantsDark: '#2d4a80',
    shoes: '#4a4a4a'
  };

  var W, H, BLOCK, GROUND_H, GROUND_Y;
  var stars = [];
  var particles = [];
  var terrainCols = [];
  var bgMountains = [];
  var bgTrees = [];
  var clouds = [];
  var frame = 0;
  var scrollX = 0;
  var moon = { x: 0, y: 0 };

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    BLOCK = Math.max(3, Math.floor(W / 220));
    GROUND_H = 14;
    GROUND_Y = H - BLOCK * GROUND_H;

    moon.x = W * 0.78;
    moon.y = H * 0.18;

    // Stars — layered depths
    stars = [];
    for (var i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * GROUND_Y * 0.8,
        r: Math.random() * 1.8 + 0.3,
        speed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() < 0.15
      });
    }

    // Terrain columns — each has random height variation and ore
    terrainCols = [];
    var numCols = Math.ceil(W / BLOCK) + 40;
    for (var c = 0; c < numCols; c++) {
      var grassH = 1;
      var dirtH = 3 + Math.floor(Math.random() * 2);
      var stoneH = GROUND_H - grassH - dirtH;
      var oreType = Math.random();
      var oreRow = Math.floor(Math.random() * stoneH);
      terrainCols.push({
        grassH: grassH,
        dirtH: dirtH,
        stoneH: stoneH,
        oreRow: oreRow,
        oreType: oreType < 0.06 ? 'gold' : oreType < 0.15 ? 'coal' : null
      });
    }

    // Background mountains (parallax)
    bgMountains = [];
    for (var m = 0; m < 8; m++) {
      bgMountains.push({
        x: m * (W / 6) + Math.random() * 80,
        h: 40 + Math.random() * 60,
        w: 80 + Math.random() * 100,
        parallax: 0.08 + Math.random() * 0.05,
        color: Math.random() < 0.5 ? 'rgba(30,35,45,0.8)' : 'rgba(25,30,38,0.7)'
      });
    }

    // Background trees (parallax, behind terrain)
    bgTrees = [];
    for (var t = 0; t < Math.ceil(W / 100); t++) {
      bgTrees.push({
        x: t * 100 + Math.random() * 60,
        h: 4 + Math.floor(Math.random() * 4),
        parallax: 0.2 + Math.random() * 0.1
      });
    }

    // Clouds
    clouds = [];
    for (var cl = 0; cl < 4; cl++) {
      clouds.push({
        x: Math.random() * W * 1.2,
        y: H * 0.06 + Math.random() * H * 0.2,
        blocks: 3 + Math.floor(Math.random() * 4),
        speed: 0.12 + Math.random() * 0.15,
        opacity: 0.04 + Math.random() * 0.04
      });
    }
  }

  // Block helper
  function blk(x, y, s, col) {
    ctx.fillStyle = col;
    ctx.fillRect(x | 0, y | 0, s, s);
  }

  // Sky
  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.sky1);
    g.addColorStop(0.35, C.sky2);
    g.addColorStop(0.7, C.sky3);
    g.addColorStop(1, '#12141a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Moon
  function drawMoon() {
    var r = Math.min(W, H) * 0.045;
    // Glow
    var glow = ctx.createRadialGradient(moon.x, moon.y, r * 0.5, moon.x, moon.y, r * 4);
    glow.addColorStop(0, 'rgba(255,220,100,0.08)');
    glow.addColorStop(0.5, 'rgba(255,200,0,0.02)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(moon.x - r * 4, moon.y - r * 4, r * 8, r * 8);
    // Body
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f0e6b0';
    ctx.fill();
    // Craters
    ctx.beginPath();
    ctx.arc(moon.x - r * 0.3, moon.y - r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#e0d6a0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moon.x + r * 0.25, moon.y + r * 0.3, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = '#d8ce98';
    ctx.fill();
  }

  // Stars
  function drawStars() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = 0.3 + 0.7 * Math.abs(Math.sin(frame * s.speed + s.phase));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.gold ? C.gold : '#e8e4dc';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Clouds
  function drawClouds() {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x -= c.speed;
      if (c.x + c.blocks * BLOCK * 3 < -20) c.x = W + 60;
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = '#c8c8d0';
      var bk = BLOCK * 2;
      for (var b = 0; b < c.blocks; b++) {
        blk(c.x + b * bk, c.y, bk - 1, '#c8c8d0');
        if (b > 0 && b < c.blocks - 1) {
          blk(c.x + b * bk, c.y - bk, bk - 1, '#c8c8d0');
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Mountains
  function drawMountains(offset) {
    for (var i = 0; i < bgMountains.length; i++) {
      var m = bgMountains[i];
      var mx = ((m.x - offset * m.parallax) % (W + m.w * 2) + W + m.w * 2) % (W + m.w * 2) - m.w;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(mx - m.w / 2, GROUND_Y + BLOCK);
      ctx.lineTo(mx, GROUND_Y - m.h);
      ctx.lineTo(mx + m.w / 2, GROUND_Y + BLOCK);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Background trees
  function drawBgTrees(offset) {
    for (var i = 0; i < bgTrees.length; i++) {
      var t = bgTrees[i];
      var tx = ((t.x - offset * t.parallax) % (W + 100) + W + 100) % (W + 100) - 50;
      var base = GROUND_Y + BLOCK;
      var trunkW = BLOCK * 1.2;

      // Trunk
      ctx.fillStyle = '#2a1e12';
      ctx.fillRect(tx - trunkW / 2, base - t.h * BLOCK * 1.5, trunkW, t.h * BLOCK * 1.5);

      // Foliage — blocky layers
      ctx.fillStyle = '#1a4c2a';
      for (var ly = 0; ly < 3; ly++) {
        var lw = (4 - ly) * BLOCK;
        blk(tx - lw / 2, base - t.h * BLOCK * 1.5 - (3 - ly) * BLOCK * 1.2, lw, ly === 0 ? '#1a4c2a' : '#155522');
      }
      // Top
      blk(tx - BLOCK * 0.5, base - t.h * BLOCK * 1.5 - 3.8 * BLOCK, BLOCK, '#1a5c2a');
    }
  }

  // Terrain
  function drawTerrain(offset) {
    var startCol = Math.floor(offset / BLOCK);
    var subOffset = offset % BLOCK;
    var visible = Math.ceil(W / BLOCK) + 2;

    for (var i = 0; i < visible; i++) {
      var ci = (startCol + i) % terrainCols.length;
      if (ci < 0) ci += terrainCols.length;
      var col = terrainCols[ci];
      var bx = i * BLOCK - subOffset;
      var row = 0;

      // Grass layer
      for (var g = 0; g < col.grassH; g++, row++) {
        var gy = H - (GROUND_H - row) * BLOCK;
        blk(bx, gy, BLOCK, g === 0 ? C.grassLight : C.grass);
        // Grass tips — little pixel tufts on top row
        if (g === 0 && (ci + i) % 3 === 0) {
          ctx.fillStyle = C.grassLight;
          ctx.fillRect(bx + BLOCK * 0.3, gy - BLOCK * 0.3, BLOCK * 0.4, BLOCK * 0.3);
        }
      }

      // Dirt layer
      for (var d = 0; d < col.dirtH; d++, row++) {
        var dy = H - (GROUND_H - row) * BLOCK;
        blk(bx, dy, BLOCK, d % 2 === 0 ? C.dirt : C.dirtDark);
      }

      // Stone layer
      for (var s = 0; s < col.stoneH; s++, row++) {
        var sy = H - (GROUND_H - row) * BLOCK;
        var stoneCol = s % 2 === 0 ? C.stone : C.stoneDark;
        // Ore
        if (s === col.oreRow && col.oreType) {
          stoneCol = col.oreType === 'gold' ? C.goldOre : C.coal;
        }
        blk(bx, sy, BLOCK, stoneCol);
      }

      // Subtle grid lines
      for (var gr = 0; gr < GROUND_H; gr++) {
        var gry = H - (GROUND_H - gr) * BLOCK;
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.strokeRect(bx | 0, gry | 0, BLOCK, BLOCK);
      }
    }
  }

  // Character — refined proportions
  function drawChar(x, y, f) {
    var s = BLOCK * 2;
    var armSwing = (f % 2 === 0) ? 0 : s * 0.6;
    var legKick = (f === 1) ? s * 0.5 : (f === 3) ? -s * 0.5 : 0;
    var bob = (f % 2 === 0) ? 0 : -s * 0.15;

    y += bob;

    // Shadow
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x + s * 2, y + s * 10.2, s * 2.5, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Left leg
    blk(x + s * 0.5, y + s * 8 + legKick * 0.3, s, C.pants);
    blk(x + s * 0.5, y + s * 9 + legKick, s * 0.9, C.shoes);
    // Right leg
    blk(x + s * 2.5, y + s * 8 - legKick * 0.3, s, C.pants);
    blk(x + s * 2.5, y + s * 9 - legKick, s * 0.9, C.shoes);

    // Torso
    for (var ty = 5; ty <= 7; ty++) {
      blk(x + s * 0.5, y + s * ty, s * 3, ty === 6 ? C.shirtDark : C.shirt);
    }

    // Left arm
    blk(x - s * 0.5, y + s * 5 + armSwing, s, C.shirt);
    blk(x - s * 0.5, y + s * 6 + armSwing * 0.5, s, C.skin);
    // Right arm
    blk(x + s * 3.5, y + s * 5 - armSwing, s, C.shirt);
    blk(x + s * 3.5, y + s * 6 - armSwing * 0.5, s, C.skin);

    // Head — 4x4 blocks
    for (var hx = 0; hx < 4; hx++) {
      for (var hy = 0; hy < 4; hy++) {
        blk(x + s * hx, y + s * hy, s, C.skin);
      }
    }

    // Hair
    blk(x, y, s * 4, C.hair); // top row
    blk(x, y + s, s, C.hair); // left side
    blk(x + s * 3, y + s, s, C.hair); // right side

    // Eyes — white with dark pupils
    blk(x + s, y + s * 2, s, '#fff');
    blk(x + s * 2, y + s * 2, s, '#fff');
    ctx.fillStyle = '#222';
    ctx.fillRect(x + s * 1.4, y + s * 2.2, s * 0.45, s * 0.55);
    ctx.fillRect(x + s * 2.2, y + s * 2.2, s * 0.45, s * 0.55);

    // Mouth — slight smile
    ctx.fillStyle = '#a07050';
    ctx.fillRect(x + s * 1.2, y + s * 3.3, s * 1.6, s * 0.3);
  }

  // Particles — golden dust
  function spawnParticles(x, y) {
    for (var i = 0; i < 2; i++) {
      particles.push({
        x: x + Math.random() * BLOCK * 4,
        y: y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 2 - 0.5,
        life: 1,
        size: BLOCK * (0.4 + Math.random() * 0.8),
        gold: Math.random() < 0.4
      });
    }
  }

  function updateDrawParticles() {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.life -= 0.02;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = p.gold ? C.gold : '#8a7a5a';
      ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    if (particles.length > 50) particles.splice(0, particles.length - 50);
  }

  // Golden ambient glow at ground level
  function drawAmbientGlow() {
    var g = ctx.createLinearGradient(0, GROUND_Y - BLOCK * 4, 0, GROUND_Y + BLOCK * 2);
    g.addColorStop(0, 'transparent');
    g.addColorStop(1, 'rgba(255,200,0,0.03)');
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND_Y - BLOCK * 4, W, BLOCK * 6);
  }

  // Main loop
  var walkFrame = 0;
  var walkTimer = 0;
  var charX, charY;

  function loop() {
    frame++;
    scrollX += 1;
    walkTimer++;

    if (walkTimer % 9 === 0) {
      walkFrame = (walkFrame + 1) % 4;
      if (walkFrame === 1 || walkFrame === 3) {
        charX = W * 0.13;
        charY = GROUND_Y - BLOCK * 2 * 10.2;
        spawnParticles(charX + BLOCK * 2, charY + BLOCK * 2 * 9.5);
      }
    }

    charX = W * 0.13;
    charY = GROUND_Y - BLOCK * 2 * 10.2;

    drawSky();
    drawMoon();
    drawStars();
    drawClouds();
    drawMountains(scrollX);
    drawBgTrees(scrollX);
    drawTerrain(scrollX);
    drawChar(charX, charY, walkFrame);
    updateDrawParticles();
    drawAmbientGlow();

    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  loop();
})();
