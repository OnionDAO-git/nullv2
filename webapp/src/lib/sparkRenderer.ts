// sparkRenderer.ts — Faithful port of reference/spark_framework.html
// Renders the "Library of Souls" / "Archive Core" visualization onto a square canvas
// for use as a billboard texture in a THREE.js scene.

// ═══ UTILITY FUNCTIONS ═══

function hr(hex: string, a: number): string {
  return `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hash(a: number, b: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ═══ NULL CITY PALETTE ═══

const S_TEAL = '#58C0B4',
  S_BLUE = '#3D94C4',
  S_GREEN = '#4EAE6E',
  S_GOLD = '#E4B840',
  S_ROSE = '#D4707A',
  S_AMBER = '#F0B84C',
  S_MAUVE = '#B080A0',
  S_BONE = '#3A342C';
const PALETTE = [S_TEAL, S_BLUE, S_GREEN, S_GOLD, S_ROSE, S_AMBER, S_MAUVE, S_BONE];

// ═══ TYPES ═══

interface Vert {
  x: number;
  y: number;
}

interface CoreShard {
  verts: Vert[];
  color: string;
  opacity: number;
  seed: number;
  basePx: number;
  basePy: number;
  nx: number;
  ny: number;
  nz: number;
  facing: number;
  myR: number;
  coreR: number;
  coreCX: number;
  coreCY: number;
  layer: number;
  layerType: 'stone' | 'jewel';
  breathSpeed: number;
  breathAmp: number;
  breathPhase: number;
  rotSpeed: number;
  shardW: number;
  shardH: number;
  baseSize: number;
}

interface OrbitShard {
  localVerts: Vert[];
  color: string;
  seed: number;
  rx: number;
  ry: number;
  angle0: number;
  tilt: number;
  speed: number;
  cx: number;
  cy: number;
  sz: number;
  tumbleSpeed: number;
}

interface PillarShard {
  verts: Vert[];
  color: string;
  opacity: number;
  seed: number;
  py: number;
}

interface DustParticle {
  x: number;
  y: number;
  sz: number;
  speed: number;
  drift: number;
  color: string;
  opacity: number;
  seed: number;
}

// ═══ FACTORY ═══

export function createSparkRenderer(
  size: number,
  lowDetail: boolean
): { canvas: HTMLCanvasElement; render: (t: number) => void } {
  const S = size;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const cx = cv.getContext('2d')!;

  // Core geometry constants (matching reference)
  const coreCX = S * 0.5;
  const coreCY = S * 0.42; // H * HZ - H * .06 = H * (.48 - .06) = H * .42
  const coreR = S * 0.12; // Math.min(W,H) * .12, and S is the square dimension

  let coreShards: CoreShard[] = [];
  let orbitShards: OrbitShard[] = [];
  let pillarShards: PillarShard[] = [];
  let dustParticles: DustParticle[] = [];

  // Detail multiplier: 1.0 for full, ~0.5 for low
  const dm = lowDetail ? 0.5 : 1.0;

  // ═══════════════════════════════════════════
  // GENERATE CORE — Cathedral stained-glass sphere
  // Dense tessellated mosaic, dark grout lines like lead came,
  // backlit from within, full palette saturated fills.
  // ═══════════════════════════════════════════

  function generateCore(): void {
    coreShards = [];

    // ── MULTIPLE OVERLAPPING LAYERS ──
    // Stone layers: OPAQUE. These ARE the body. Full coverage, no gaps.
    // Jewel layers: semi-transparent cathedral glass on top.
    const layers: {
      r: number;
      count: number;
      sizeMin: number;
      sizeMax: number;
      opBase: number;
      type: 'stone' | 'jewel';
    }[] = [
      { r: coreR * 0.48, count: Math.round(180 * dm), sizeMin: 8, sizeMax: 22, opBase: 0.85, type: 'stone' },
      { r: coreR * 0.7, count: Math.round(220 * dm), sizeMin: 7, sizeMax: 20, opBase: 0.9, type: 'stone' },
      { r: coreR * 0.88, count: Math.round(260 * dm), sizeMin: 6, sizeMax: 18, opBase: 0.92, type: 'stone' },
      { r: coreR * 0.56, count: Math.round(50 * dm), sizeMin: 5, sizeMax: 14, opBase: 0.22, type: 'jewel' },
      { r: coreR * 0.76, count: Math.round(80 * dm), sizeMin: 5, sizeMax: 16, opBase: 0.28, type: 'jewel' },
      { r: coreR * 0.94, count: Math.round(110 * dm), sizeMin: 4, sizeMax: 14, opBase: 0.32, type: 'jewel' },
      { r: coreR * 1.04, count: Math.round(50 * dm), sizeMin: 3, sizeMax: 10, opBase: 0.18, type: 'jewel' }
    ];

    let globalIdx = 0;
    for (let li = 0; li < layers.length; li++) {
      const L = layers[li];
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < L.count; i++) {
        const seed = globalIdx + 2000;
        globalIdx++;

        // Fibonacci sphere distribution
        const y = 1 - (i / (L.count - 1)) * 2;
        const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = goldenAngle * i + li * 1.2; // offset each layer

        const nx = Math.cos(theta) * radiusAtY;
        const ny = y;
        const nz = Math.sin(theta) * radiusAtY;

        // Stone: keep everything on the front hemisphere + some wrap-around
        // Jewel: cull further back since they're transparent accents
        const cullThreshold = L.type === 'stone' ? -0.45 : -0.2;
        if (nz < cullThreshold) continue;

        const facing = clamp(nz + 0.45, 0, 1);

        // Each shard sits at this layer's radius + individual jitter
        const myR = L.r + (hash(seed, 20) - 0.5) * coreR * 0.12;
        const basePx = coreCX + nx * myR;
        const basePy = coreCY - ny * myR * 0.95;

        // ── SHARD SIZE — stone shards are BIG for full coverage ──
        const sv = hash(seed, 2);
        let baseSize: number;
        if (L.type === 'stone') {
          if (sv < 0.05) baseSize = L.sizeMin;
          else if (sv < 0.25) baseSize = lerp(L.sizeMin, L.sizeMax, 0.4 + hash(seed, 21) * 0.2);
          else if (sv < 0.7) baseSize = lerp(L.sizeMin, L.sizeMax, 0.6 + hash(seed, 21) * 0.3);
          else baseSize = L.sizeMax + hash(seed, 21) * 6;
        } else {
          if (sv < 0.1) baseSize = L.sizeMin;
          else if (sv < 0.4) baseSize = lerp(L.sizeMin, L.sizeMax, 0.3 + hash(seed, 21) * 0.2);
          else if (sv < 0.8) baseSize = lerp(L.sizeMin, L.sizeMax, 0.5 + hash(seed, 21) * 0.3);
          else baseSize = L.sizeMax + hash(seed, 21) * 4;
        }

        // Foreshorten at edges — stone shards stay wider to maintain coverage
        const edgeSquish = L.type === 'stone' ? 0.5 + facing * 0.5 : 0.3 + facing * 0.7;
        const shardW = baseSize * edgeSquish;
        const shardH = baseSize * (0.5 + hash(seed, 22) * 0.5);

        // ── IRREGULAR POLYGON — 3-7 vertices ──
        const nv = 3 + Math.floor(hash(seed, 3) * 5);
        const verts: Vert[] = [];
        const ba = hash(seed, 4) * Math.PI * 2;
        for (let v = 0; v < nv; v++) {
          const a = ba + (v / nv) * Math.PI * 2;
          const rJitter = 0.3 + hash(seed * 7 + v, 5) * 0.8;
          const rx = shardW * rJitter;
          const ry = shardH * (0.3 + hash(seed * 7 + v, 6) * 0.8);
          const aJitter = (hash(seed * 11 + v, 23) - 0.5) * (0.7 / nv);
          verts.push({
            x: Math.cos(a + aJitter) * rx,
            y: Math.sin(a + aJitter) * ry
          });
        }

        // ── COLOR ──
        const cr = hash(seed, 7);
        let color: string;
        if (L.type === 'stone') {
          if (cr < 0.18) color = '#3A342C';
          else if (cr < 0.32) color = '#2A2420';
          else if (cr < 0.44) color = '#1E1A18';
          else if (cr < 0.55) color = '#342D26';
          else if (cr < 0.65) color = '#443B30';
          else if (cr < 0.74) color = '#5C5040';
          else if (cr < 0.8) color = '#1A1614';
          else if (cr < 0.85) color = '#282218';
          else if (cr < 0.9) color = '#4A4238';
          else if (cr < 0.94) color = '#201C16';
          else if (cr < 0.97) color = '#3A3028';
          else color = '#141210';
        } else {
          if (cr < 0.14) color = S_TEAL;
          else if (cr < 0.24) color = S_BLUE;
          else if (cr < 0.32) color = S_ROSE;
          else if (cr < 0.4) color = S_GOLD;
          else if (cr < 0.48) color = S_MAUVE;
          else if (cr < 0.54) color = S_GREEN;
          else if (cr < 0.6) color = S_AMBER;
          else if (cr < 0.66) color = '#58C0B4';
          else if (cr < 0.72) color = '#2A6A90';
          else if (cr < 0.77) color = '#7A3A50';
          else if (cr < 0.82) color = '#C89030';
          else if (cr < 0.87) color = '#9878B0';
          else if (cr < 0.92) color = '#FFFFFF';
          else if (cr < 0.96) color = '#D4CDB8';
          else color = S_BONE;
        }

        // Stone: high opacity, minimal facing falloff
        // Jewel: semi-transparent with facing falloff
        const baseOp =
          L.type === 'stone'
            ? (L.opBase + hash(seed, 8) * 0.1) * (0.65 + facing * 0.35)
            : (L.opBase + hash(seed, 8) * 0.35) * (0.25 + facing * 0.75);

        // ── BREATHING PARAMS ──
        const isStone = L.type === 'stone';
        const breathSpeed = isStone
          ? 0.0002 + hash(seed, 9) * 0.0002
          : 0.0003 + hash(seed, 9) * 0.0004;
        const breathAmp = isStone
          ? 0.01 + hash(seed, 10) * 0.02
          : 0.02 + hash(seed, 10) * 0.05;
        const breathPhase = hash(seed, 11) * Math.PI * 2;
        const rotSpeed = isStone
          ? (hash(seed, 12) - 0.5) * 0.00004
          : (hash(seed, 12) - 0.5) * 0.00012;

        coreShards.push({
          verts,
          color,
          opacity: baseOp,
          seed,
          basePx,
          basePy,
          nx,
          ny,
          nz,
          facing,
          myR,
          coreR,
          coreCX,
          coreCY,
          layer: li,
          layerType: L.type,
          breathSpeed,
          breathAmp,
          breathPhase,
          rotSpeed,
          shardW,
          shardH,
          baseSize
        });
      }
    }

    // Sort: back layers first, then by z within layer
    coreShards.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.nz - b.nz;
    });
  }

  // ═══════════════════════════════════════════
  // ORBITAL SHARDS — Memory streams circling the core
  // ═══════════════════════════════════════════

  function generateOrbits(): void {
    orbitShards = [];
    const orbits = [
      {
        rx: S * 0.19,
        ry: S * 0.06,
        count: Math.round(50 * dm),
        tilt: 0.15,
        speed: 0.0003,
        colors: [S_TEAL, S_BLUE, '#FFFFFF', S_GREEN]
      },
      {
        rx: S * 0.25,
        ry: S * 0.08,
        count: Math.round(45 * dm),
        tilt: -0.25,
        speed: -0.00025,
        colors: [S_GOLD, S_AMBER, S_ROSE, '#C89030']
      },
      {
        rx: S * 0.17,
        ry: S * 0.12,
        count: Math.round(30 * dm),
        tilt: 0.6,
        speed: 0.00035,
        colors: [S_MAUVE, S_BLUE, S_GREEN, '#9878B0']
      }
    ];

    let id = 0;
    for (let oi = 0; oi < orbits.length; oi++) {
      const orb = orbits[oi];
      for (let i = 0; i < orb.count; i++) {
        const seed = id + 4000;
        const angle0 = (i / orb.count) * Math.PI * 2 + hash(seed, 0) * 0.4;

        // ── SIZE VARIANCE ──
        const sv = hash(seed, 1);
        let sz: number;
        if (sv < 0.35) sz = 1 + hash(seed, 15) * 2.5;
        else if (sv < 0.6) sz = 3 + hash(seed, 15) * 4;
        else if (sv < 0.8) sz = 6 + hash(seed, 15) * 6;
        else if (sv < 0.92) sz = 10 + hash(seed, 15) * 8;
        else sz = 16 + hash(seed, 15) * 10;

        const nv = sz > 8 ? 4 + Math.floor(hash(seed, 2) * 4) : 3 + Math.floor(hash(seed, 2) * 2);
        const localVerts: Vert[] = [];
        const ba = hash(seed, 3) * Math.PI * 2;

        for (let v = 0; v < nv; v++) {
          const a = ba + (v / nv) * Math.PI * 2 + (hash(seed * 5 + v, 4) - 0.5) * 0.6;
          const r = sz * (0.3 + hash(seed * 3 + v, 5) * 0.8);
          const aspect = sz > 8 ? 0.4 + hash(seed, 16) * 0.8 : 0.5 + hash(seed, 16) * 0.5;
          localVerts.push({ x: Math.cos(a) * r * aspect, y: Math.sin(a) * r / aspect * 0.6 });
        }

        const color = orb.colors[Math.floor(hash(seed, 6) * orb.colors.length)];

        const rxJitter = 1 + (hash(seed, 17) - 0.5) * 0.08;
        const ryJitter = 1 + (hash(seed, 18) - 0.5) * 0.08;

        const tumbleSpeed = sz > 6 ? (hash(seed, 19) - 0.5) * 0.0003 : 0;

        orbitShards.push({
          localVerts,
          color,
          seed,
          rx: orb.rx * rxJitter,
          ry: orb.ry * ryJitter,
          angle0,
          tilt: orb.tilt,
          speed: orb.speed,
          cx: coreCX,
          cy: coreCY,
          sz,
          tumbleSpeed
        });
        id++;
      }
    }
  }

  // ═══════════════════════════════════════════
  // VERTICAL PILLARS — Light axis through the core
  // ═══════════════════════════════════════════

  function generatePillars(): void {
    pillarShards = [];
    const pillarX = S * 0.5;
    const pillarCount = Math.round(60 * dm);

    for (let i = 0; i < pillarCount; i++) {
      const seed = i + 6000;
      const along = hash(seed, 0);
      const py = S * 0.05 + along * S * 0.85;

      // Denser near core
      const coreProx = 1 - Math.abs(py - coreCY) / (S * 0.4);
      if (coreProx < 0 && hash(seed, 10) > 0.3) continue;

      const px = pillarX + (hash(seed, 1) - 0.5) * 6;
      const sz = 1 + hash(seed, 2) * 3 + Math.max(0, coreProx) * 2;

      const nv = 3 + Math.floor(hash(seed, 3) * 2);
      const verts: Vert[] = [];
      for (let v = 0; v < nv; v++) {
        const a = (v / nv) * Math.PI * 2 + hash(seed * 5 + v, 4);
        const r = sz * (0.3 + hash(seed * 3 + v, 5) * 0.7);
        verts.push({ x: px + Math.cos(a) * r * 0.4, y: py + Math.sin(a) * r * 1.2 });
      }

      const cr = hash(seed, 6);
      const color = cr < 0.5 ? S_TEAL : cr < 0.7 ? '#FFFFFF' : S_BLUE;
      const opacity = (0.05 + hash(seed, 7) * 0.12) * clamp(coreProx + 0.3, 0.05, 1);

      pillarShards.push({ verts, color, opacity, seed, py });
    }
  }

  // ═══════════════════════════════════════════
  // DUST — Rising shard particles
  // ═══════════════════════════════════════════

  function generateDust(): void {
    dustParticles = [];
    const dustCount = Math.round(120 * dm);
    for (let i = 0; i < dustCount; i++) {
      const seed = i + 5000;
      dustParticles.push({
        x: hash(seed, 0) * S,
        y: hash(seed, 1) * S,
        sz: 1 + hash(seed, 2) * 2.5,
        speed: 0.15 + hash(seed, 3) * 0.4,
        drift: (hash(seed, 4) - 0.5) * 0.1,
        color: PALETTE[Math.floor(hash(seed, 5) * PALETTE.length)],
        opacity: 0.05 + hash(seed, 6) * 0.2,
        seed
      });
    }
  }

  // ═══════════════════════════════════════════
  // DRAW: CORE SHADOW — Ground plane shadow beneath
  // ═══════════════════════════════════════════

  function drawCoreShadow(t: number): void {
    const shadowY = S * 0.48 + S * 0.12; // H * HZ + H * .12
    const shadowR = S * 0.16;
    const breath = Math.sin(t * 0.0002) * 0.03 + 0.97;

    const sg = cx.createRadialGradient(coreCX, shadowY, 0, coreCX, shadowY, shadowR);
    sg.addColorStop(0, hr(S_TEAL, 0.06 * breath));
    sg.addColorStop(0.3, hr(S_BLUE, 0.03 * breath));
    sg.addColorStop(0.7, hr('#0E0C0A', 0.04));
    sg.addColorStop(1, 'transparent');
    cx.fillStyle = sg;
    cx.fillRect(coreCX - shadowR, shadowY - shadowR * 0.3, shadowR * 2, shadowR * 0.6);
  }

  // ═══════════════════════════════════════════
  // DRAW: VERTICAL PILLAR — Light axis
  // ═══════════════════════════════════════════

  function drawPillar(t: number): void {
    const px = S * 0.5;
    const breath = Math.sin(t * 0.00015) * 0.03 + 0.97;

    const lineGrad = cx.createLinearGradient(px, 0, px, S);
    lineGrad.addColorStop(0, hr(S_TEAL, 0.01 * breath));
    lineGrad.addColorStop(0.35, hr(S_TEAL, 0.06 * breath));
    lineGrad.addColorStop(0.5, hr('#FFFFFF', 0.08 * breath));
    lineGrad.addColorStop(0.65, hr(S_TEAL, 0.04 * breath));
    lineGrad.addColorStop(1, hr(S_TEAL, 0.005 * breath));
    cx.strokeStyle = lineGrad;
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(px, 0);
    cx.lineTo(px, S);
    cx.stroke();

    // Shard fragments along the pillar
    for (const p of pillarShards) {
      const pulse = Math.sin(t * 0.0005 + p.seed * 1.3) * 0.06 + 0.94;
      const op = p.opacity * pulse * breath;
      if (op < 0.005) continue;

      cx.fillStyle = hr(p.color, op);
      cx.beginPath();
      for (let v = 0; v < p.verts.length; v++) {
        v === 0 ? cx.moveTo(p.verts[v].x, p.verts[v].y) : cx.lineTo(p.verts[v].x, p.verts[v].y);
      }
      cx.closePath();
      cx.fill();
    }
  }

  // ═══════════════════════════════════════════
  // DRAW: ORBITAL SHARDS — Memory streams
  // ═══════════════════════════════════════════

  function drawOrbits(t: number, pass: 'back' | 'front'): void {
    const breath = Math.sin(t * 0.00018) * 0.06 + 0.94;

    // Orbit paths only on back pass
    if (pass === 'back') {
      const orbDefs = [
        { rx: S * 0.19, ry: S * 0.06, tilt: 0.15 },
        { rx: S * 0.25, ry: S * 0.08, tilt: -0.25 },
        { rx: S * 0.17, ry: S * 0.12, tilt: 0.6 }
      ];
      for (const od of orbDefs) {
        cx.strokeStyle = hr(S_TEAL, 0.015 * breath);
        cx.lineWidth = 0.5;
        cx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.04) {
          const ox = coreCX + Math.cos(a) * od.rx;
          const oy = coreCY + Math.sin(a + od.tilt) * od.ry;
          a === 0 ? cx.moveTo(ox, oy) : cx.lineTo(ox, oy);
        }
        cx.closePath();
        cx.stroke();
      }
    }

    // Draw individual shard fragments — filtered by z position
    for (const s of orbitShards) {
      const angle = s.angle0 + t * s.speed;
      const zPos = Math.sin(angle + s.tilt);

      // Back pass: behind the sphere (zPos < 0). Front pass: in front (zPos >= 0).
      if (pass === 'back' && zPos >= 0) continue;
      if (pass === 'front' && zPos < 0) continue;
      const ox = s.cx + Math.cos(angle) * s.rx;
      const oy = s.cy + Math.sin(angle + s.tilt) * s.ry;

      // Depth-based opacity (behind core = dimmer)
      const depthFactor = zPos > 0 ? 1 : 0.15 + (1 + zPos) * 0.35;
      const shimmer = Math.sin(t * 0.0006 + s.seed * 1.5) * 0.1 + 0.9;

      // Larger shards are more prominent
      const sizeBoost = s.sz > 8 ? 0.12 : 0;
      const op = (0.12 + hash(s.seed, 7) * 0.28 + sizeBoost) * depthFactor * shimmer * breath;
      if (op < 0.005) continue;

      // Tumble rotation for large shards
      const tumble = t * s.tumbleSpeed;
      const cosT = Math.cos(tumble),
        sinT = Math.sin(tumble);

      cx.fillStyle = hr(s.color, op);
      cx.beginPath();
      for (let v = 0; v < s.localVerts.length; v++) {
        const lv = s.localVerts[v];
        const vx = ox + lv.x * cosT - lv.y * sinT;
        const vy = oy + lv.x * sinT + lv.y * cosT;
        v === 0 ? cx.moveTo(vx, vy) : cx.lineTo(vx, vy);
      }
      cx.closePath();
      cx.fill();

      // Grout on shards large enough to read as mosaic pieces
      if (s.sz > 4) {
        cx.strokeStyle = hr('#080C0B', op * 0.5);
        cx.lineWidth = s.sz > 10 ? 0.8 : 0.4;
        cx.stroke();
      }

      // Catch-light on large front-facing shards
      if (s.sz > 10 && zPos > 0.3 && hash(s.seed, 20) > 0.5) {
        const hl = Math.sin(t * 0.0004 + s.seed * 1.8);
        if (hl > 0.3) {
          cx.strokeStyle = hr('#FFFFFF', (hl - 0.3) * 0.12);
          cx.lineWidth = 0.4;
          const topVerts = s.localVerts
            .map((lv) => ({
              x: ox + lv.x * cosT - lv.y * sinT,
              y: oy + lv.x * sinT + lv.y * cosT
            }))
            .sort((a, b) => a.y - b.y);
          if (topVerts.length >= 2) {
            cx.beginPath();
            cx.moveTo(topVerts[0].x, topVerts[0].y);
            cx.lineTo(topVerts[1].x, topVerts[1].y);
            cx.stroke();
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  // DRAW: ARCHIVE CORE — Shard-mosaic sphere
  // ═══════════════════════════════════════════

  function drawCore(t: number): void {
    const globalBreath = Math.sin(t * 0.00012) * 0.06 + 0.94;

    // ── GLOBAL SPHERE BREATHING ──
    const breathScale =
      1 +
      Math.sin(t * 0.0008) * 0.018 +
      Math.sin(t * 0.0003) * 0.008 +
      Math.sin(t * 0.0013 + 1.5) * 0.005;

    const bsR = coreR * breathScale;

    // ── STEP 1: CLIP TO SPHERE + FILL WITH MORTAR ──
    cx.save();
    cx.beginPath();
    cx.ellipse(coreCX, coreCY, bsR * 1.02, bsR * 0.98, 0, 0, Math.PI * 2);
    cx.clip();

    // Mortar base — warm dark, lighter than the stones
    const mortarGrad = cx.createRadialGradient(coreCX, coreCY, 0, coreCX, coreCY, bsR);
    mortarGrad.addColorStop(0, '#4A4238');
    mortarGrad.addColorStop(0.4, '#3A3028');
    mortarGrad.addColorStop(0.8, '#2A2420');
    mortarGrad.addColorStop(1, '#1E1A16');
    cx.fillStyle = mortarGrad;
    cx.fillRect(coreCX - bsR * 1.1, coreCY - bsR * 1.1, bsR * 2.2, bsR * 2.2);

    // ── TRAVELING LIGHT WAVE ──
    const waveAngle = t * 0.0002;
    const waveCX = coreCX + Math.cos(waveAngle) * coreR * 0.4;
    const waveCY = coreCY + Math.sin(waveAngle * 0.7) * coreR * 0.3;

    // ── STEP 2: DRAW STONE SHARDS ──
    for (const s of coreShards) {
      if (s.layerType !== 'stone') continue;

      const breathOffset = Math.sin(t * s.breathSpeed + s.breathPhase) * s.breathAmp * s.coreR;
      const driftX = s.nx * breathOffset;
      const driftY = -s.ny * breathOffset * 0.95;

      const rawPx = s.basePx + driftX;
      const rawPy = s.basePy + driftY;
      const px = coreCX + (rawPx - coreCX) * breathScale;
      const py = coreCY + (rawPy - coreCY) * breathScale;

      const rot = t * s.rotSpeed + hash(s.seed, 30) * Math.PI * 2;
      const cosR = Math.cos(rot),
        sinR = Math.sin(rot);

      const worldVerts: Vert[] = [];
      for (const v of s.verts) {
        worldVerts.push({
          x: px + v.x * cosR - v.y * sinR,
          y: py + v.x * sinR + v.y * cosR
        });
      }

      // Stone opacity: near-opaque, slight shimmer
      const shimmer = Math.sin(t * 0.0004 + s.seed * 1.2) * 0.04 + 0.96;
      let op = s.opacity * shimmer * globalBreath;

      // Traveling wave gives stones a subtle warm brightening
      const dx = px - waveCX,
        dy = py - waveCY;
      const waveDist = Math.sqrt(dx * dx + dy * dy);
      const waveBoost = Math.max(0, 1 - waveDist / (coreR * 0.5)) * 0.05;
      op = clamp(op + waveBoost, 0, 0.97);
      if (op < 0.01) continue;

      cx.fillStyle = hr(s.color, op);
      cx.beginPath();
      for (let v = 0; v < worldVerts.length; v++) {
        v === 0
          ? cx.moveTo(worldVerts[v].x, worldVerts[v].y)
          : cx.lineTo(worldVerts[v].x, worldVerts[v].y);
      }
      cx.closePath();
      cx.fill();
    }

    // ── STEP 3: INNER BACKLIGHT GLOW ──
    const glow1 = cx.createRadialGradient(coreCX, coreCY, 0, coreCX, coreCY, bsR);
    glow1.addColorStop(0, hr('#FFFFFF', 0.1 * globalBreath));
    glow1.addColorStop(0.15, hr(S_TEAL, 0.07 * globalBreath));
    glow1.addColorStop(0.35, hr(S_BLUE, 0.04 * globalBreath));
    glow1.addColorStop(0.6, hr(S_MAUVE, 0.02 * globalBreath));
    glow1.addColorStop(1, 'transparent');
    cx.fillStyle = glow1;
    cx.fillRect(coreCX - bsR, coreCY - bsR, bsR * 2, bsR * 2);

    // Off-center warm glow
    const glow2 = cx.createRadialGradient(
      coreCX - bsR * 0.2,
      coreCY - bsR * 0.15,
      0,
      coreCX,
      coreCY,
      bsR * 0.7
    );
    glow2.addColorStop(0, hr(S_GOLD, 0.04 * globalBreath));
    glow2.addColorStop(0.5, hr(S_AMBER, 0.015 * globalBreath));
    glow2.addColorStop(1, 'transparent');
    cx.fillStyle = glow2;
    cx.fillRect(coreCX - bsR, coreCY - bsR, bsR * 2, bsR * 2);

    // ── STEP 4: JEWEL SHARDS ──
    for (const s of coreShards) {
      if (s.layerType !== 'jewel') continue;

      const breathOffset = Math.sin(t * s.breathSpeed + s.breathPhase) * s.breathAmp * s.coreR;
      const driftX = s.nx * breathOffset;
      const driftY = -s.ny * breathOffset * 0.95;

      const rawPx = s.basePx + driftX;
      const rawPy = s.basePy + driftY;
      const px = coreCX + (rawPx - coreCX) * breathScale;
      const py = coreCY + (rawPy - coreCY) * breathScale;

      const rot = t * s.rotSpeed + hash(s.seed, 30) * Math.PI * 2;
      const cosR = Math.cos(rot),
        sinR = Math.sin(rot);

      const worldVerts: Vert[] = [];
      for (const v of s.verts) {
        worldVerts.push({
          x: px + v.x * cosR - v.y * sinR,
          y: py + v.x * sinR + v.y * cosR
        });
      }

      // Jewel opacity with wave and surge
      const dx = px - waveCX,
        dy = py - waveCY;
      const waveDist = Math.sqrt(dx * dx + dy * dy);
      const waveBoost = Math.max(0, 1 - waveDist / (coreR * 0.5)) * 0.15;
      const deepPulse = Math.sin(t * 0.00025 + s.seed * 0.3);
      const surge = deepPulse > 0.7 ? ((deepPulse - 0.7) / 0.3) * 0.1 : 0;
      const shimmer = Math.sin(t * 0.0006 + s.seed * 1.7) * 0.07 + 0.93;

      let op = s.opacity * shimmer * globalBreath + waveBoost + surge;
      op = clamp(op, 0, 0.88);
      if (op < 0.01) continue;

      // Fill
      cx.fillStyle = hr(s.color, op);
      cx.beginPath();
      for (let v = 0; v < worldVerts.length; v++) {
        v === 0
          ? cx.moveTo(worldVerts[v].x, worldVerts[v].y)
          : cx.lineTo(worldVerts[v].x, worldVerts[v].y);
      }
      cx.closePath();
      cx.fill();

      // Lead came grout on jewel shards
      const groutOp = (0.1 + s.facing * 0.2) * globalBreath;
      if (groutOp > 0.02) {
        cx.strokeStyle = hr('#080C0B', groutOp);
        cx.lineWidth = 0.5 + s.facing * 0.7;
        cx.stroke();
      }

      // Edge catch-light
      if (s.facing > 0.4 && hash(s.seed, 31) > 0.6) {
        const hl = Math.sin(t * 0.0005 + s.seed * 2.1);
        if (hl > 0.4) {
          const hlOp = (hl - 0.4) * 0.18 * globalBreath;
          const sorted = [...worldVerts].sort((a, b) => a.y - b.y);
          if (sorted.length >= 2) {
            cx.strokeStyle = hr('#FFFFFF', hlOp);
            cx.lineWidth = 0.3 + s.facing * 0.4;
            cx.beginPath();
            cx.moveTo(sorted[0].x, sorted[0].y);
            cx.lineTo(sorted[1].x, sorted[1].y);
            cx.stroke();
          }
        }
      }
    }

    // ── STEP 5: SPHERICAL SHADING ──
    const shade = cx.createRadialGradient(
      coreCX - bsR * 0.15,
      coreCY - bsR * 0.1,
      bsR * 0.2,
      coreCX,
      coreCY,
      bsR
    );
    shade.addColorStop(0, 'transparent');
    shade.addColorStop(0.6, 'transparent');
    shade.addColorStop(0.85, hr('#0E0C0A', 0.3));
    shade.addColorStop(1, hr('#0E0C0A', 0.6));
    cx.fillStyle = shade;
    cx.fillRect(coreCX - bsR * 1.1, coreCY - bsR * 1.1, bsR * 2.2, bsR * 2.2);

    cx.restore(); // release clip

    // ── RIM GLOW — outside the clip ──
    const rim = cx.createRadialGradient(coreCX, coreCY, bsR * 0.85, coreCX, coreCY, bsR * 1.3);
    rim.addColorStop(0, 'transparent');
    rim.addColorStop(0.4, hr(S_TEAL, 0.03 * globalBreath));
    rim.addColorStop(0.7, hr(S_BLUE, 0.018 * globalBreath));
    rim.addColorStop(1, 'transparent');
    cx.fillStyle = rim;
    cx.beginPath();
    cx.ellipse(coreCX, coreCY, bsR * 1.35, bsR * 1.3, 0, 0, Math.PI * 2);
    cx.fill();
  }

  // ═══════════════════════════════════════════
  // DRAW: DUST PARTICLES — Rising shard fragments
  // ═══════════════════════════════════════════

  function drawDust(t: number): void {
    const breath = Math.sin(t * 0.00025) * 0.05 + 0.95;

    for (const d of dustParticles) {
      // Animate: slow rise + slight drift
      let y = d.y - ((t * d.speed * 0.01) % S);
      if (y < 0) y += S;
      const x = d.x + Math.sin(t * 0.0003 + d.seed * 2) * 8;

      const shimmer = Math.sin(t * 0.0008 + d.seed * 0.7) * 0.15 + 0.85;
      const op = d.opacity * shimmer * breath;
      if (op < 0.005) continue;

      // Draw as tiny irregular shard, not a square
      cx.fillStyle = hr(d.color, op);
      cx.beginPath();
      const nv = 3 + Math.floor(hash(d.seed, 10) * 2);
      for (let v = 0; v < nv; v++) {
        const a = (v / nv) * Math.PI * 2 + hash(d.seed * 5 + v, 11);
        const r = d.sz * (0.4 + hash(d.seed * 3 + v, 12) * 0.6);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        v === 0 ? cx.moveTo(px, py) : cx.lineTo(px, py);
      }
      cx.closePath();
      cx.fill();
    }
  }

  // ═══════════════════════════════════════════
  // INITIALIZE ALL DATA
  // ═══════════════════════════════════════════

  generateCore();
  generateOrbits();
  generatePillars();
  generateDust();

  // ═══════════════════════════════════════════
  // RENDER FUNCTION
  // ═══════════════════════════════════════════

  function render(t: number): void {
    // 1. Clear canvas to background
    cx.clearRect(0, 0, S, S);
    cx.fillStyle = '#0E0C0A';
    cx.fillRect(0, 0, S, S);

    // 2. Subtle radial glow from core position (simplified sky)
    const gx = coreCX,
      gy = coreCY;
    const gr = cx.createRadialGradient(gx, gy, 0, gx, gy, S * 0.5);
    gr.addColorStop(0, hr(S_TEAL, 0.04));
    gr.addColorStop(0.2, hr(S_BLUE, 0.02));
    gr.addColorStop(0.5, hr(S_MAUVE, 0.008));
    gr.addColorStop(1, 'transparent');
    cx.fillStyle = gr;
    cx.fillRect(0, 0, S, S);

    // 3. Core shadow
    drawCoreShadow(t);

    // 4. Pillar
    drawPillar(t);

    // 5. Back orbits
    drawOrbits(t, 'back');

    // 6. Core
    drawCore(t);

    // 7. Front orbits
    drawOrbits(t, 'front');

    // 8. Dust
    drawDust(t);

    // 9. Radial alpha fade — destination-in composite
    // Fade starts at ~0.65 of half-width from center, fully transparent at 0.48 * S from center
    const fadeInner = S * 0.5 * 0.65; // ~0.325 * S
    const fadeOuter = S * 0.48;
    cx.globalCompositeOperation = 'destination-in';
    const fadeMask = cx.createRadialGradient(coreCX, coreCY, fadeInner, coreCX, coreCY, fadeOuter);
    fadeMask.addColorStop(0, 'rgba(255,255,255,1)');
    fadeMask.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = fadeMask;
    cx.fillRect(0, 0, S, S);
    cx.globalCompositeOperation = 'source-over';
  }

  return { canvas: cv, render };
}
