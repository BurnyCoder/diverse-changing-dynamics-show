import { useRef, useEffect } from "react";

// AlienChaosSimulation — endless emergence/dissolution of nonlinear structures
// by OpenAI o3 | May 2025
// ---------------------------------------------------------------
// ‣ Tons of oscillating alien forces (field, moving attractors, breathing core,
//   anisotropic noise, global swirl...) ensure perpetual order⇄chaos cycles.
// ‣ Particles wrap so they never cluster at edges; repulsion + damping keep
//   motion lively but bounded.
// ‣ No frame is alike; structures flicker across scales and fade.
// ---------------------------------------------------------------

export default function AlienChaosSimulation() {
  const canvasRef = useRef(null);
  const PARTICLE_COUNT = 2000;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height;

    const resize = () => {
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    // --- state --------------------------------------------------
    const pos = new Float32Array(PARTICLE_COUNT * 2);
    const vel = new Float32Array(PARTICLE_COUNT * 2);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[2 * i] = Math.random() * width;
      pos[2 * i + 1] = Math.random() * height;
      vel[2 * i] = (Math.random() - 0.5) * 2;
      vel[2 * i + 1] = (Math.random() - 0.5) * 2;
    }

    const centers = [
      { x: width * 0.25, y: height * 0.25 },
      { x: width * 0.75, y: height * 0.25 },
      { x: width * 0.5, y: height * 0.75 },
    ];

    let t = 0;

    const animate = () => {
      t += 0.01;

      // --- oscillate attractor positions ------------------------
      centers[0].x = width * 0.25 + Math.sin(t * 0.7) * width * 0.2;
      centers[0].y = height * 0.25 + Math.cos(t * 0.9) * height * 0.2;
      centers[1].x = width * 0.75 + Math.cos(t * 0.5) * width * 0.2;
      centers[1].y = height * 0.25 + Math.sin(t * 0.8) * height * 0.2;
      centers[2].x = width * 0.5 + Math.cos(t * 0.4) * width * 0.25;
      centers[2].y = height * 0.75 + Math.sin(t * 0.6) * height * 0.25;

      // --- fade trail (semi‑transparency keeps history) ---------
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, width, height);

      // --- per‑particle dynamics --------------------------------
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let x = pos[2 * i];
        let y = pos[2 * i + 1];
        let ax = 0;
        let ay = 0;

        // Force A: swirling trigonometric vector field (rotating)
        const a = Math.sin(y * 0.01 + t * 1.3) * Math.cos(x * 0.01 - t * 0.7);
        ax += Math.cos(a) * 0.3;
        ay += Math.sin(a) * 0.3;

        // Force B: three moving centers with oscillating attraction⇄repulsion
        centers.forEach((c, idx) => {
          const dx = c.x - x;
          const dy = c.y - y;
          const dist2 = dx * dx + dy * dy + 0.001;
          const mag = Math.sin(t * (0.6 + idx * 0.3)) * 2; // −2 … 2
          ax += (dx / dist2) * mag;
          ay += (dy / dist2) * mag;
        });

        // Force C: anisotropic alien noise (index‑dependent)
        ax += Math.sin(i * 12.9898 + t * 0.4) * 0.5;
        ay += Math.cos(i * 78.233 + t * 0.9) * 0.5;

        // Force D: breathing radial pull/push around canvas center
        const cx = width * 0.5;
        const cy = height * 0.5;
        const dx0 = cx - x;
        const dy0 = cy - y;
        const dist = Math.sqrt(dx0 * dx0 + dy0 * dy0) + 0.01;
        const breathe = Math.sin(t * 0.2) * 1.5; // oscillates sign
        ax += (dx0 / dist) * breathe;
        ay += (dy0 / dist) * breathe;

        // --- integrate -----------------------------------------
        vel[2 * i] += ax * 0.05;
        vel[2 * i + 1] += ay * 0.05;

        // soft speed‑limit preserves wildness yet avoids blow‑ups
        const speed = Math.hypot(vel[2 * i], vel[2 * i + 1]) + 1e-6;
        const maxSpeed = 6;
        if (speed > maxSpeed) {
          const s = maxSpeed / speed;
          vel[2 * i] *= s;
          vel[2 * i + 1] *= s;
        }

        // damping that *oscillates* to spur growth & decay cycles
        const damp = 0.96 + Math.sin(t * 2.2) * 0.02;
        vel[2 * i] *= damp;
        vel[2 * i + 1] *= damp;

        // position update with toroidal wrap so distribution lives
        x += vel[2 * i];
        y += vel[2 * i + 1];
        if (x < 0) x += width;
        if (x > width) x -= width;
        if (y < 0) y += height;
        if (y > height) y -= height;
        pos[2 * i] = x;
        pos[2 * i + 1] = y;

        // draw particle
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    animate();
    return () => window.removeEventListener("resize", resize);
  }, []);

  // full‑screen black backdrop
  return (
    <div className="w-full h-screen bg-black">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
