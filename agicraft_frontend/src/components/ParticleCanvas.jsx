import { useEffect, useRef } from 'react';

const COLORS = [
  'rgba(255, 201, 0, 0.6)',
  'rgba(255, 158, 61, 0.6)',
  'rgba(255, 68, 68, 0.6)',
  'rgba(75, 123, 236, 0.6)',
  'rgba(142, 68, 173, 0.5)',
  'rgba(52, 152, 219, 0.5)',
];

function createParticle(width, height) {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 0.3 + 0.1;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 4 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function init() {
      resize();
      particles = Array.from({ length: 50 }, () => createParticle(width, height));
    }

    function animate() {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(0, 0, width, height);

      const padding = 50;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -padding || p.x > width + padding || p.y < -padding || p.y > height + padding) {
          particles[i] = createParticle(width, height);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    }

    init();
    animate();

    const onResize = () => { resize(); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

export default ParticleCanvas;
