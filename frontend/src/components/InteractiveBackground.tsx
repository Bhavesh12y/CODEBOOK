import React, { useEffect, useRef } from 'react';

interface ConstellationNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  type: 'dot' | 'cross' | 'ring';
  rotation: number;
  rotSpeed: number;
}

export const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Eased mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 3,
      targetX: width / 2,
      targetY: height / 3,
      radius: 220,
    };

    // Node density
    const nodeCount = Math.min(130, Math.max(65, Math.floor((width * height) / 11000)));
    const nodes: ConstellationNode[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const rand = Math.random();
      const type: 'dot' | 'cross' | 'ring' = rand < 0.7 ? 'dot' : rand < 0.9 ? 'cross' : 'ring';
      const baseRadius = type === 'dot' ? Math.random() * 1.2 + 1.2 : type === 'cross' ? 3.5 : 2.8;

      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        baseRadius,
        radius: baseRadius,
        type,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.008,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    const render = () => {
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Check if current theme in app is light or dark
      const isLight = document.documentElement.getAttribute('data-theme') === 'daylight';

      // 1. Sleek Interactive Cursor Spotlight
      const spotlight = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.radius * 1.6
      );

      if (!isLight) {
        spotlight.addColorStop(0, 'rgba(255, 255, 255, 0.045)');
        spotlight.addColorStop(0.5, 'rgba(215, 225, 245, 0.015)');
        spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        spotlight.addColorStop(0, 'rgba(15, 23, 42, 0.04)');
        spotlight.addColorStop(0.5, 'rgba(15, 23, 42, 0.012)');
        spotlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      const strokeBase = !isLight ? 'rgba(255, 255, 255,' : 'rgba(15, 23, 42,';

      // 2. Hair-thin Geometric Constellation Links
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          const maxDist = 110;

          if (dist < maxDist) {
            const midX = (n1.x + n2.x) * 0.5;
            const midY = (n1.y + n2.y) * 0.5;
            const mouseDist = Math.hypot(mouse.x - midX, mouse.y - midY);
            const inSpotlight = mouseDist < mouse.radius;
            const proximityBoost = inSpotlight ? (1 - mouseDist / mouse.radius) * 0.22 : 0;

            const baseAlpha = (1 - dist / maxDist) * 0.08;
            const lineAlpha = Math.min(0.35, baseAlpha + proximityBoost);

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `${strokeBase} ${lineAlpha})`;
            ctx.lineWidth = inSpotlight ? 0.9 : 0.6;
            ctx.stroke();
          }
        }
      }

      // 3. Render Calibrated Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;
        node.rotation += node.rotSpeed;

        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let nodeAlpha = !isLight ? 0.35 : 0.30;
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          node.x -= (dx / dist) * force * 1.6;
          node.y -= (dy / dist) * force * 1.6;
          node.radius = node.baseRadius * (1 + force * 0.5);
          nodeAlpha = Math.min(0.85, (!isLight ? 0.38 : 0.32) + force * 0.5);
        } else {
          node.radius += (node.baseRadius - node.radius) * 0.06;
        }

        ctx.save();
        ctx.translate(node.x, node.y);

        if (node.type === 'dot') {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = `${strokeBase} ${nodeAlpha})`;
          ctx.fill();
        } else if (node.type === 'cross') {
          ctx.rotate(node.rotation);
          const s = node.radius;
          ctx.beginPath();
          ctx.moveTo(-s, 0);
          ctx.lineTo(s, 0);
          ctx.moveTo(0, -s);
          ctx.lineTo(0, s);
          ctx.strokeStyle = `${strokeBase} ${nodeAlpha * 0.9})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        } else if (node.type === 'ring') {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${strokeBase} ${nodeAlpha * 0.8})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
};
