// Variation A — Blueprint / Technical
// Aesthetic: CAD blueprint, crosshairs, coordinates, mono technical labels.
// Logo: outline draws in with stroke-dashoffset, then fills.
// Services: stack in vertically as technical line items with codes.

function LoaderBlueprint({ width = 1280, height = 720, loop = true, accent = '#C42525' }) {
  const [t, setT] = React.useState(0); // 0..1 over DURATION
  const DURATION = 4000;

  React.useEffect(() => {
    let raf, start;
    const tick = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      let p = elapsed / DURATION;
      if (p >= 1) {
        if (loop) { start = ts; p = 0; }
        else p = 1;
      }
      setT(p);
      if (p < 1 || loop) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop]);

  // Phase helpers
  const ease = (x) => x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2, 2)/2;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const range = (x, a, b) => clamp01((x - a) / (b - a));

  // Phases (within 0..1):
  // 0.00–0.45 logo draws in
  // 0.20–0.95 services reveal staggered
  // 0.00–1.00 progress bar
  const logoDraw = ease(range(t, 0.00, 0.45));
  const logoFill = ease(range(t, 0.40, 0.65));
  const services = [0, 1, 2].map((i) => ease(range(t, 0.25 + i * 0.18, 0.55 + i * 0.18)));
  const progress = t;

  // Particles
  const particles = React.useMemo(() => Array.from({ length: 32 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    s: 0.5 + Math.random() * 1.5,
    d: 4 + Math.random() * 8,
    delay: Math.random() * 4,
    o: 0.15 + Math.random() * 0.35,
  })), []);

  const services_data = [
    { num: '01', code: 'TRD', title: 'Trading', sub: 'Steel Trading & Mill Supply' },
    { num: '02', code: 'FAB', title: 'Fabrication', sub: 'Industrial Steel Fabrication' },
    { num: '03', code: 'CON', title: 'Construction', sub: 'Turnkey Construction & Erection' },
  ];

  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: '#0A0B0D',
      fontFamily: '"Barlow Condensed", "Inter", sans-serif',
      color: '#E8E8E8',
    }}>
      {/* Blueprint grid */}
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
        <defs>
          <pattern id="bp-grid-sm" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#3a4a5c" strokeWidth="0.4"/>
          </pattern>
          <pattern id="bp-grid-lg" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#5a7090" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#bp-grid-sm)"/>
        <rect width={width} height={height} fill="url(#bp-grid-lg)"/>
      </svg>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
      }}/>

      {/* Particles (dust) */}
      {particles.map((p) => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.s, height: p.s,
          borderRadius: '50%',
          background: '#9bb3cc',
          opacity: p.o,
          animation: `bp-drift ${p.d}s ${p.delay}s infinite linear`,
        }}/>
      ))}

      {/* Corner crosshairs */}
      <CornerMarks />

      {/* Top-left meta */}
      <div style={{
        position: 'absolute', top: 28, left: 32,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.18em', color: '#7a8ca0',
      }}>
        <div>METALYOL · STEEL DIVISION</div>
        <div style={{ marginTop: 4, color: '#5a6c80' }}>SHEET 01 / 01 · REV.A · LOADING</div>
      </div>

      {/* Top-right coordinates */}
      <div style={{
        position: 'absolute', top: 28, right: 32, textAlign: 'right',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.18em', color: '#7a8ca0',
      }}>
        <div>N 41°00'42" · E 28°58'08"</div>
        <div style={{ marginTop: 4, color: accent }}>● ONLINE</div>
      </div>

      {/* Center logo */}
      <div style={{
        position: 'absolute', left: '50%', top: '38%',
        transform: 'translate(-50%, -50%)',
        width: 520, height: 173,
      }}>
        {/* Outline draw */}
        <svg viewBox="0 0 520 173" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <text x="260" y="120" textAnchor="middle"
            fontSize="120"
            fontFamily='"Barlow Condensed", sans-serif'
            fontWeight="800"
            letterSpacing="6"
            fill="none"
            stroke="#E8E8E8"
            strokeWidth="1.2"
            strokeDasharray="2000"
            strokeDashoffset={2000 * (1 - logoDraw)}
            style={{ opacity: 1 - logoFill * 0.0 }}
          >METALYOL</text>
          {/* Filled version fades on top */}
          <text x="260" y="120" textAnchor="middle"
            fontSize="120"
            fontFamily='"Barlow Condensed", sans-serif'
            fontWeight="800"
            letterSpacing="6"
            fill="#F2F2F2"
            opacity={logoFill}
          >METALYOL</text>
        </svg>

        {/* Hexagon accent overlay (replaces the O) */}
        <svg viewBox="0 0 100 100" width="86" height="86" style={{
          position: 'absolute',
          left: '76.5%', top: '52%',
          transform: `translate(-50%,-50%) rotate(${logoDraw * 60 - 60}deg)`,
          opacity: logoFill,
        }}>
          <Hexagon stroke={accent} fill="none" strokeWidth="6"/>
          <Hexagon stroke={accent} fill="none" strokeWidth="2" scale={0.7}/>
        </svg>
      </div>

      {/* Tagline below logo */}
      <div style={{
        position: 'absolute', left: '50%', top: '52%',
        transform: 'translate(-50%, 0)',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.5em', color: '#7a8ca0',
        opacity: ease(range(t, 0.45, 0.6)),
      }}>
        STEEL · ENGINEERED · DELIVERED
      </div>

      {/* Services list */}
      <div style={{
        position: 'absolute', left: '50%', top: '64%',
        transform: 'translate(-50%, 0)',
        width: 760,
      }}>
        {services_data.map((s, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '60px 70px 1fr 14px',
            alignItems: 'center',
            gap: 24,
            padding: '10px 0',
            borderBottom: '1px solid rgba(155,179,204,0.12)',
            opacity: services[i],
            transform: `translateY(${(1 - services[i]) * 12}px)`,
          }}>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12, color: accent, letterSpacing: '0.2em',
            }}>{s.num}/</span>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11, color: '#7a8ca0', letterSpacing: '0.25em',
            }}>[{s.code}]</span>
            <span style={{
              fontSize: 22, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#F2F2F2',
            }}>{s.title} <span style={{ color: '#7a8ca0', fontWeight: 400, fontSize: 14, marginLeft: 12, letterSpacing: '0.12em' }}>— {s.sub}</span></span>
            <span style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 12, color: services[i] > 0.95 ? accent : '#3a4a5c',
            }}>{services[i] > 0.95 ? '✓' : '·'}</span>
          </div>
        ))}
      </div>

      {/* Bottom progress bar */}
      <div style={{
        position: 'absolute', bottom: 28, left: 32, right: 32,
        display: 'flex', alignItems: 'center', gap: 16,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.2em', color: '#7a8ca0',
      }}>
        <span>LOADING</span>
        <div style={{
          flex: 1, height: 1, background: '#1f2935', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: -1, height: 3,
            width: `${progress * 100}%`,
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
          }}/>
        </div>
        <span style={{ color: '#E8E8E8', minWidth: 48, textAlign: 'right' }}>
          {String(Math.floor(progress * 100)).padStart(3, '0')}%
        </span>
      </div>

      <style>{`
        @keyframes bp-drift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(8px, -12px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}

function Hexagon({ stroke = '#fff', fill = 'none', strokeWidth = 4, scale = 1 }) {
  // Centered hexagon in 100x100 viewBox
  const r = 45 * scale;
  const cx = 50, cy = 50;
  const points = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)].join(',');
  }).join(' ');
  return <polygon points={points} stroke={stroke} fill={fill} strokeWidth={strokeWidth} strokeLinejoin="miter"/>;
}

function CornerMarks() {
  const c = '#5a7090';
  const s = 22;
  const m = 24;
  const lineCss = { position: 'absolute', background: c };
  // Use 4 corner DIVs with absolute lines
  const corner = (pos) => (
    <div style={{ position: 'absolute', width: s, height: s, ...pos }}>
      <div style={{ ...lineCss, left: 0, top: 0, width: s, height: 1 }}/>
      <div style={{ ...lineCss, left: 0, top: 0, width: 1, height: s }}/>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: m, top: m, width: s, height: s }}>
        <div style={{ ...lineCss, left: 0, top: 0, width: s, height: 1 }}/>
        <div style={{ ...lineCss, left: 0, top: 0, width: 1, height: s }}/>
      </div>
      <div style={{ position: 'absolute', right: m, top: m, width: s, height: s }}>
        <div style={{ ...lineCss, right: 0, top: 0, width: s, height: 1 }}/>
        <div style={{ ...lineCss, right: 0, top: 0, width: 1, height: s }}/>
      </div>
      <div style={{ position: 'absolute', left: m, bottom: m, width: s, height: s }}>
        <div style={{ ...lineCss, left: 0, bottom: 0, width: s, height: 1 }}/>
        <div style={{ ...lineCss, left: 0, bottom: 0, width: 1, height: s }}/>
      </div>
      <div style={{ position: 'absolute', right: m, bottom: m, width: s, height: s }}>
        <div style={{ ...lineCss, right: 0, bottom: 0, width: s, height: 1 }}/>
        <div style={{ ...lineCss, right: 0, bottom: 0, width: 1, height: s }}/>
      </div>
    </div>
  );
}

window.LoaderBlueprint = LoaderBlueprint;
