// Variation B — Forge / Spark
// Aesthetic: Hot steel forge. Warm darks, ember red glow, sparks fly.
// Logo: weld point traces letterforms with hot glow trail.
// Services: stamped in like steel ingots — cycled one at a time, big.

function LoaderForge({ width = 1280, height = 720, loop = true, accent = '#D62828' }) {
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

  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeInOut = (x) => x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2, 2)/2;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const range = (x, a, b) => clamp01((x - a) / (b - a));

  // Logo phases: weld trace 0..0.5, then full glow fades to white 0.4..0.6
  const weld = range(t, 0.0, 0.5);
  const cool = easeOut(range(t, 0.45, 0.7)); // hot to cool

  // Service cycler: 3 services, each gets ~33% of timeline (after small intro delay)
  // 0.15 .. 1.0 split into 3 chunks
  const sStart = 0.18;
  const sEnd = 0.96;
  const span = (sEnd - sStart) / 3;
  const activeIdx = Math.min(2, Math.max(0, Math.floor((t - sStart) / span)));
  const localT = (t - sStart - activeIdx * span) / span; // 0..1 within current service

  const progress = t;

  // Ember particles - big animated set
  const sparks = React.useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: 35 + Math.random() * 30,
    y: 60 + Math.random() * 25,
    vx: (Math.random() - 0.5) * 1.4,
    vy: -0.3 - Math.random() * 1.2,
    s: 1 + Math.random() * 2.5,
    d: 2 + Math.random() * 3,
    delay: Math.random() * 4,
    hue: Math.random() < 0.7 ? '#ff8a3d' : '#ffd76a',
  })), []);

  const services_data = [
    { num: '01', title: 'TRADING', sub: 'Steel Trading & Mill Supply', long: 'Direct mill relationships, shipped to spec — beams, plates, hollow sections and high-grade alloys, delivered across MENA, Europe and Africa.' },
    { num: '02', title: 'FABRICATION', sub: 'Industrial Steel Fabrication', long: 'High-tonnage structural fabrication — engineered, welded and finished to AWS D1.1, EN 1090 EXC4 and AISC standards.' },
    { num: '03', title: 'CONSTRUCTION', sub: 'Turnkey Construction & Erection', long: 'Full-scope erection crews, lift planning and BIM-coordinated installation — handing over verified, surveyed structures ready for cladding.' },
  ];

  const active = services_data[activeIdx];

  // Service local animation: in 0..0.2, hold 0.2..0.85, out 0.85..1
  const sIn = easeOut(clamp01(localT / 0.2));
  const sOut = easeOut(clamp01((localT - 0.85) / 0.15));
  const sOpacity = sIn * (1 - sOut);
  const sShift = (1 - sIn) * 30 - sOut * 30;

  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: '#0B0807',
      fontFamily: '"Barlow Condensed", "Inter", sans-serif',
      color: '#F2EFE8',
    }}>
      {/* Forge ambient glow at bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%',
        background: `radial-gradient(ellipse 80% 100% at 50% 100%, rgba(214,40,40,0.28) 0%, rgba(255,138,61,0.10) 30%, transparent 60%)`,
        pointerEvents: 'none',
      }}/>
      {/* Vertical heat shimmer texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(180deg, rgba(255,255,255,0.012) 0 2px, transparent 2px 6px)`,
        pointerEvents: 'none',
      }}/>

      {/* Sparks rising */}
      {sparks.map((sp) => (
        <div key={sp.id} style={{
          position: 'absolute',
          left: `${sp.x}%`, top: `${sp.y}%`,
          width: sp.s, height: sp.s,
          borderRadius: '50%',
          background: sp.hue,
          boxShadow: `0 0 ${sp.s * 4}px ${sp.hue}`,
          animation: `forge-spark ${sp.d}s ${sp.delay}s infinite ease-out`,
          ['--vx']: `${sp.vx * 60}px`,
          ['--vy']: `${sp.vy * 220}px`,
        }}/>
      ))}

      {/* Top brand mark */}
      <div style={{
        position: 'absolute', top: 32, left: 36,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.3em', color: '#7a6a60',
      }}>
        METALYOL · EST. 2008
      </div>
      <div style={{
        position: 'absolute', top: 32, right: 36, textAlign: 'right',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.3em', color: '#7a6a60',
      }}>
        FORGING · FABRICATING · BUILDING
      </div>

      {/* Logo - center top */}
      <div style={{
        position: 'absolute', left: '50%', top: '24%',
        transform: 'translate(-50%, -50%)',
        width: 560,
      }}>
        <WeldedLogo weld={weld} cool={cool} accent={accent}/>
      </div>

      {/* Big service stage in middle/bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '42%',
        padding: '0 80px',
        opacity: sOpacity,
        transform: `translateY(${sShift}px)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 32,
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: '"Bebas Neue", "Barlow Condensed", sans-serif',
            fontSize: 240, lineHeight: 0.85, fontWeight: 400,
            color: 'transparent',
            WebkitTextStroke: `2px ${accent}`,
            letterSpacing: '-0.04em',
          }}>{active.num}</div>
          <div style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11, letterSpacing: '0.4em', color: '#7a6a60',
            paddingBottom: 24, marginLeft: -16,
          }}>
            / SERVICE
          </div>
        </div>

        <div style={{
          fontSize: 84, lineHeight: 0.95, fontWeight: 800,
          letterSpacing: '0.02em',
          marginBottom: 18,
          textTransform: 'uppercase',
          color: '#F2EFE8',
          textShadow: localT < 0.3 ? `0 0 30px rgba(255,138,61,${0.5 - localT})` : 'none',
        }}>
          {active.title}
        </div>

        <div style={{
          fontSize: 22, fontWeight: 500,
          color: accent, letterSpacing: '0.02em',
          marginBottom: 14,
          textTransform: 'uppercase',
        }}>
          {active.sub}
        </div>

        <div style={{
          fontSize: 16, lineHeight: 1.5, fontWeight: 400,
          color: '#a89a8e', maxWidth: 640,
        }}>
          {active.long}
        </div>
      </div>

      {/* Service indicator dots (right side) */}
      <div style={{
        position: 'absolute', right: 36, top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {[0,1,2].map((i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 10, letterSpacing: '0.2em',
            color: i === activeIdx ? '#F2EFE8' : '#4a3f38',
          }}>
            <span>0{i+1}</span>
            <div style={{
              width: i === activeIdx ? 28 : 12,
              height: 2,
              background: i === activeIdx ? accent : '#3a302b',
              transition: 'all 0.4s',
            }}/>
          </div>
        ))}
      </div>

      {/* Bottom progress */}
      <div style={{
        position: 'absolute', bottom: 32, left: 36, right: 36,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, letterSpacing: '0.3em', color: '#7a6a60',
        }}>
          HEATING SYSTEMS
        </div>
        <div style={{
          flex: 1, height: 2, background: '#1f1611', position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${accent} 0%, #ff8a3d 100%)`,
            boxShadow: `0 0 12px ${accent}`,
          }}/>
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, letterSpacing: '0.2em', color: '#F2EFE8',
          minWidth: 60, textAlign: 'right',
        }}>
          {String(Math.floor(progress * 100)).padStart(3, '0')} / 100
        </div>
      </div>

      <style>{`
        @keyframes forge-spark {
          0% { transform: translate(0, 0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 0.6; }
          100% { transform: translate(var(--vx), var(--vy)) scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Logo with welding animation: a hot point traces, leaving cooling trail.
function WeldedLogo({ weld, cool, accent }) {
  // Approach: render text twice. Layer 1: clipped reveal driven by weld (from left to right).
  // Then a hot bar at the leading edge.
  const revealPct = weld * 100;

  return (
    <div style={{ position: 'relative', height: 150 }}>
      {/* Faint outline ghost */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 130, fontWeight: 800, letterSpacing: '6px',
        fontFamily: '"Barlow Condensed", sans-serif',
        color: 'transparent',
        WebkitTextStroke: '1px rgba(242,239,232,0.12)',
      }}>
        METALY<span style={{ color: 'transparent', WebkitTextStroke: 'none' }}>&nbsp;</span>L
      </div>

      {/* Hot revealed text — clipped by weld progress */}
      <div style={{
        position: 'absolute', inset: 0,
        clipPath: `inset(0 ${100 - revealPct}% 0 0)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 130, fontWeight: 800, letterSpacing: '6px',
          fontFamily: '"Barlow Condensed", sans-serif',
          color: cool > 0.5 ? '#F2EFE8' : '#ffb060',
          textShadow: cool < 0.95
            ? `0 0 ${20 * (1 - cool)}px rgba(255,138,61,${1 - cool}), 0 0 ${40 * (1 - cool)}px rgba(214,40,40,${0.8 * (1 - cool)})`
            : 'none',
          transition: 'color 0.3s',
        }}>
          METALY<span style={{ display: 'inline-block', width: '0.7em' }}/>L
        </div>
      </div>

      {/* Hot weld point at leading edge */}
      {weld > 0.001 && weld < 0.999 && (
        <div style={{
          position: 'absolute',
          left: `${revealPct}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 16, height: 100,
          background: 'radial-gradient(ellipse, #fff 0%, #ffd76a 30%, #ff8a3d 60%, transparent 100%)',
          filter: 'blur(2px)',
          opacity: 0.95,
        }}/>
      )}

      {/* Hexagon (the O slot) */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: `translate(38%, -50%) rotate(${weld * 60 - 60}deg)`,
        width: 96, height: 96,
        opacity: cool > 0.2 ? 1 : weld * 5,
      }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <Hexagon stroke={accent} fill="none" strokeWidth="6"/>
          <Hexagon stroke={accent} fill="none" strokeWidth="2.5" scale={0.65}/>
          {cool < 0.95 && (
            <Hexagon stroke="#ffd76a" fill="none" strokeWidth="1.5" scale={0.85}/>
          )}
        </svg>
      </div>
    </div>
  );
}

window.LoaderForge = LoaderForge;
