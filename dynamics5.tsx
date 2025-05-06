import { useEffect, useRef } from "react";

/**
 * ChaosCycleSimulation – a hypnotic, ever‑changing particle playground.
 * 
 * Particles traverse an ocean of alien, oscillating force‑fields that
 * continually synchronise and desynchronise, birthing transient order
 * before shattering it back into chaos and beginning anew.
 */
export default function ChaosCycleSimulation() {
  const canvasRef = useRef(null);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  /** Utility ---------------------------------------------------------- */
  const rand = (min, max) => Math.random() * (max - min) + min;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    /** Canvas sizing */
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas.parentElement;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    /** PARTICLE STATE ------------------------------------------------- */
    const MAX = 1200;
    const particles = Array.from({ length: MAX }, () => ({
      x: rand(0, canvas.width / dpr),
      y: rand(0, canvas.height / dpr),
      vx: rand(-1, 1),
      vy: rand(-1, 1)
    }));

    /**  DYNAMIC FORCE‑FIELD LIBRARY -----------------------------------
     *  Every “module” returns an { ax, ay } contribution for a particle
     *  at time t.  Each module’s strength seethes with its own rhythm.
     *  Add or tweak modules to taste – the architecture is intentionally
     *  open‑ended.
     */
    const modules = [
      // Swirling vortex whose core traces an ever‑shifting Lissajous curve
      {
        compute: (p, t, W, H) => {
          const cx = W / 2 + Math.sin(t * 0.0003) * W * 0.35;
          const cy = H / 2 + Math.cos(t * 0.0004) * H * 0.35;
          const dx = p.x - cx;
          const dy = p.y - cy;
          const r2 = dx * dx + dy * dy + 1;
          const s = Math.sin(t * 0.0007) * 9000 / r2;
          return { ax: -dy * s, ay: dx * s };
        }
      },
      // Radial breathing – alternates between implosion & explosion
      {
        compute: (p, t, W, H) => {
          const cx = W / 2,
            cy = H / 2;
          const dx = p.x - cx,
            dy = p.y - cy;
          const r = Math.hypot(dx, dy) + 1;
          const pulse = Math.sin(t * 0.001) * 240;
          return { ax: (-dx / r) * pulse, ay: (-dy / r) * pulse };
        }
      },
      // Space‑time grid waves – criss‑cross travelling wave fronts
      {
        compute: (p, t) => {
          const g = Math.sin(t * 0.0005 + (p.x + p.y) * 0.015) * 70;
          return {
            ax: Math.cos((p.y + t * 0.0002) * 0.06) * g,
            ay: Math.sin((p.x + t * 0.0002) * 0.06) * g
          };
        }
      },
      // Fractal curl noise approximation via cheap trigonometric mash‑up
      {
        compute: (p, t) => {
          const n1 = Math.sin((p.x + t * 0.0009) * 0.07);
          const n2 = Math.cos((p.y - t * 0.0008) * 0.07);
          const n3 = Math.sin((p.x + p.y + t * 0.0006) * 0.04);
          const strength = Math.sin(t * 0.00065) * 60;
          return { ax: (n1 - n3) * strength, ay: (n2 - n3) * strength };
        }
      },
      // Randomised orbital attractors that appear / disappear
      {
        centres: Array.from({ length: 5 }, () => ({
          x: rand(0, 1), // stored normalised – scaled each frame
          y: rand(0, 1),
          freq: rand(0.0003, 0.001),
          phase: rand(0, Math.PI * 2)
        })),
        compute(p, t, W, H) {
          let ax = 0,
            ay = 0;
          this.centres.forEach(c => {
            // Oscillate each attractor’s strength
            const strength = Math.sin(t * c.freq + c.phase) * 550;
            const cx = c.x * W;
            const cy = c.y * H;
            const dx = cx - p.x;
            const dy = cy - p.y;
            const r2 = dx * dx + dy * dy + 80; // soften near‑field singularity
            ax += (dx / r2) * strength;
            ay += (dy / r2) * strength;
          });
          return { ax, ay };
        }
      }
    ];

    /** MAIN ANIMATION LOOP ------------------------------------------- */
    let last = performance.now();
    const step = () => {
      const now = performance.now();
      const dt = (now - last) * 0.001; // seconds
      last = now;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;

      // Semi‑transparent paint for motion blur
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, W, H);

      particles.forEach(p => {
        let ax = 0,
          ay = 0;
        modules.forEach(m => {
          const f = m.compute(p, now, W, H);
          ax += f.ax;
          ay += f.ay;
        });

        // Euler integration + gentle damping to bound energy
        p.vx += ax * dt;
        p.vy += ay * dt;
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Soft speed‑limit to prevent blow‑ups but keep liveliness
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 16) {
          p.vx *= 16 / speed;
          p.vy *= 16 / speed;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Toroidal wrap – instant re‑entry keeps density variable but never empty
        if (p.x < 0) p.x += W;
        if (p.x > W) p.x -= W;
        if (p.y < 0) p.y += H;
        if (p.y > H) p.y -= H;

        // RENDER PARTICLE ------------------------------------------
        ctx.beginPath();
        // Colour cycles with global time & local velocity magnitude
        ctx.fillStyle = `hsl(${(now * 0.04 + speed * 25) % 360}, 100%, 60%)`;
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    /** Cleanup on unmount */
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
