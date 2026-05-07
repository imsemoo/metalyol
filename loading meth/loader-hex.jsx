// Variation C — Hexagon Assemble
// Aesthetic: Brand-forward. The hexagon is the hero. 6 segments fly in
// from outside and assemble. Services revealed as 3 panels orbiting the hex.
// Most "Metalyol" of the three.

function LoaderHexAssemble({ width = 1280, height = 720, loop = true, accent = '#C42525' }) {
  const [t, setT] = React.useState(0);
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

  const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2, 2)/2;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const range = (x, a, b) => clamp01((x - a) / (b - a));

  // Hexagon segments fly in 0..0.55 (staggered)
  // Logo wordmark fades in 0.45..0.7
  // Service panels stagger 0.50..0.95
  const segP = (i) => easeOutQuart(range(t, 0.05 + i * 0.05, 0.45 + i * 0.05));
  const wordP = easeOutCubic(range(t, 0.45, 0.75));
  const taglineP = easeOutCubic(range(t, 0.6, 0.85));
  const services = [0,1,2].map((i) => easeOutCubic(range(t, 0.50 + i * 0.10, 0.80 + i * 0.10)));
  const progress = t;

  // Particles
  const particles = React.useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    s: 0.5 + Math.random() * 1.8,
    d: 5 + Math.random() * 10,
    delay: Math.random() * 5,
    o: 0.1 + Math.random() * 0.4,
  })), []);

  const services_data = [
    { num: '01', title: 'Trading', sub: 'Steel Trading & Mill Supply' },
    { num: '02', title: 'Fabrication', sub: 'Industrial Steel Fabrication' },
    { num: '03', title: 'Construction', sub: 'Turnkey Construction & Erection' },
  ];

  // Hexagon center
  const cx = width / 2;
  const cy = height * 0.45;
  const hexR = 110; // radius

  // 6 triangular segments forming a hexagon (pie slices)
  // Each segment defined by angle range
  const segments = Array.from({ length: 6 }, (_, i) => {
    const a0 = (Math.PI / 3) * i - Math.PI / 2;
    const a1 = (Math.PI / 3) * (i + 1) - Math.PI / 2;
    const p0 = [hexR * Math.cos(a0), hexR * Math.sin(a0)];
    const p1 = [hexR * Math.cos(a1), hexR * Math.sin(a1)];
    // Outward direction (segment midpoint)
    const am = (a0 + a1) / 2;
    return {
      i,
      poly: `0,0 ${p0[0]},${p0[1]} ${p1[0]},${p1[1]}`,
      midA: am,
    };
  });

  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: '#0A0A0B',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      color: '#EDEDED',
    }}>
      {/* Subtle radial gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 45%, rgba(196,37,37,0.08) 0%, transparent 50%)`,
        pointerEvents: 'none',
      }}/>

      {/* Subtle grain */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.05,
        backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
        pointerEvents: 'none',
      }}/>

      {/* Particles */}
      {particles.map((p) => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.s, height: p.s,
          borderRadius: '50%',
          background: '#bbb',
          opacity: p.o,
          animation: `hex-drift ${p.d}s ${p.delay}s infinite linear`,
        }}/>
      ))}

      {/* Top brand line */}
      <div style={{
        position: 'absolute', top: 36, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10, letterSpacing: '0.5em', color: '#666',
      }}>
        METALYOL · STEEL GROUP
      </div>

      {/* Hexagon SVG (centered) */}
      <svg
        width={width} height={height}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="hex-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E03030"/>
            <stop offset="100%" stopColor="#A01818"/>
          </linearGradient>
        </defs>

        {/* Outer faint ring (engraved) */}
        <g transform={`translate(${cx}, ${cy})`} opacity={wordP * 0.5}>
          {[1.35, 1.6].map((mult, mi) => {
            const r = hexR * mult;
            const pts = Array.from({ length: 6 }, (_, i) => {
              const a = (Math.PI / 3) * i - Math.PI / 2;
              return `${r * Math.cos(a)},${r * Math.sin(a)}`;
            }).join(' ');
            return <polygon key={mi} points={pts} fill="none" stroke="#2a2a2c" strokeWidth="1"/>;
          })}
        </g>

        {/* Segments — fly in from outside their midpoint angle */}
        <g transform={`translate(${cx}, ${cy})`}>
          {segments.map((seg) => {
            const p = segP(seg.i);
            const dist = (1 - p) * 320;
            const dx = Math.cos(seg.midA) * dist;
            const dy = Math.sin(seg.midA) * dist;
            const rot = (1 - p) * 30 * (seg.i % 2 ? -1 : 1);
            return (
              <g
                key={seg.i}
                transform={`translate(${dx},${dy}) rotate(${rot})`}
                opacity={p}
              >
                {/* Outer triangle slice */}
                <polygon
                  points={seg.poly}
                  fill="url(#hex-grad)"
                  stroke="#0A0A0B"
                  strokeWidth="2"
                />
                {/* Inner notch */}
                <polygon
                  points={(() => {
                    const a0 = (Math.PI / 3) * seg.i - Math.PI / 2;
                    const a1 = (Math.PI / 3) * (seg.i + 1) - Math.PI / 2;
                    const r2 = hexR * 0.55;
                    const p0 = [r2 * Math.cos(a0), r2 * Math.sin(a0)];
                    const p1 = [r2 * Math.cos(a1), r2 * Math.sin(a1)];
                    return `0,0 ${p0[0]},${p0[1]} ${p1[0]},${p1[1]}`;
                  })()}
                  fill="#0A0A0B"
                />
              </g>
            );
          })}

          {/* Inner small hexagon */}
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const a = (Math.PI / 3) * i - Math.PI / 2;
              const r = hexR * 0.32;
              return `${r * Math.cos(a)},${r * Math.sin(a)}`;
            }).join(' ')}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            opacity={wordP}
          />
        </g>
      </svg>

      {/* METALYOL wordmark below hexagon */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: cy + hexR + 36,
        textAlign: 'center',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 76,
        letterSpacing: '0.42em',
        textIndent: '0.42em',
        color: '#F5F5F5',
        opacity: wordP,
        transform: `translateY(${(1 - wordP) * 14}px)`,
      }}>
        METALYOL
      </div>

      {/* Tagline */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        top: cy + hexR + 124,
        textAlign: 'center',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.6em', color: '#888',
        opacity: taglineP,
      }}>
        SOURCED · FABRICATED · ERECTED
      </div>

      {/* 3 Service cards across bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 84,
        display: 'flex', justifyContent: 'center', gap: 24,
        padding: '0 60px',
      }}>
        {services_data.map((s, i) => (
          <div key={i} style={{
            flex: 1, maxWidth: 320,
            padding: '20px 22px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderTop: `2px solid ${services[i] > 0.5 ? accent : 'rgba(196,37,37,0.2)'}`,
            opacity: services[i],
            transform: `translateY(${(1 - services[i]) * 24}px)`,
            transition: 'border-top-color 0.4s',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 12,
            }}>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 11, letterSpacing: '0.3em', color: accent,
              }}>{s.num} /</span>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9, letterSpacing: '0.3em', color: '#555',
              }}>SERVICE</span>
            </div>
            <div style={{
              fontSize: 24, fontWeight: 700, letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontFamily: '"Barlow Condensed", sans-serif',
              marginBottom: 6,
            }}>
              {s.title}
            </div>
            <div style={{
              fontSize: 13, color: '#9a9a9a', letterSpacing: '0.02em',
              lineHeight: 1.4,
            }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom progress */}
      <div style={{
        position: 'absolute', bottom: 28, left: 36, right: 36,
        display: 'flex', alignItems: 'center', gap: 16,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 10, letterSpacing: '0.3em', color: '#666',
      }}>
        <span>INITIALIZING</span>
        <div style={{
          flex: 1, height: 1, background: '#1a1a1c', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: -1, height: 3,
            width: `${progress * 100}%`,
            background: accent,
            boxShadow: `0 0 10px ${accent}`,
          }}/>
        </div>
        <span style={{ color: '#EDEDED', minWidth: 50, textAlign: 'right' }}>
          {String(Math.floor(progress * 100)).padStart(2, '0')}%
        </span>
      </div>

      <style>{`
        @keyframes hex-drift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(10px, -16px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
}

window.LoaderHexAssemble = LoaderHexAssemble;
