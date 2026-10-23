import React, { useEffect, useRef } from 'react';

/**
 * CoastalLivingCanvas
 * High-performance interactive background for the pastel dark blue ocean zone:
 * 1. Authentic Indian Teak Jali Geometric Fretwork:
 *    - Always visible across the entire background in refined, elegant yellow (#e5c05c)
 *    - In the cursor spotlight area, smoothly illuminates into proper luminous golden (#ffd700)
 * 2. Kinetic Topographic Cliff Elevation Contours in golden yellow (#ffd700 / #e5c05c) with mouse parallax
 * 3. Drifting Golden Jasmine Petals & Sea Breeze currents with mouse repel physics
 * 4. Expanding Royal Golden Water Ripples on click
 * 
 * Strictly NO gradients (clean solid colors with opacity).
 */
const CoastalLivingCanvas = ({ timeMode = 'twilight' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    // Mouse tracking for parallax, spotlight, and repel physics
    const mouse = {
      x: width / 2,
      y: height / 3,
      targetX: width / 2,
      targetY: height / 3,
      isHovering: false,
    };

    // Expanding click ripples (in royal gold)
    const ripples = [];

    // Floating Botanical Golden Jasmine Petals
    const PETAL_COUNT = 30;
    const petals = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 7 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.02,
        vx: 0.35 + Math.random() * 0.45,
        vy: -0.2 - Math.random() * 0.35,
        baseVx: 0.35 + Math.random() * 0.45,
        baseVy: -0.2 - Math.random() * 0.35,
        opacity: 0.35 + Math.random() * 0.4,
        color: Math.random() > 0.35 ? '#ffd700' : '#fff4cc',
        flutter: Math.random() * 10,
      });
    }

    // Coastal breeze windlines
    const WIND_LINES = 7;
    const windlines = [];
    for (let i = 0; i < WIND_LINES; i++) {
      windlines.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 80 + Math.random() * 140,
        speed: 1.2 + Math.random() * 1.6,
        opacity: 0.12 + Math.random() * 0.16,
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovering = false;
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 6,
        maxRadius: 120,
        opacity: 0.65,
        color: '#ffd700', // Proper luminous royal gold ripple
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    let time = 0;

    // Draw Option B: Spacious & Airy Indian Teak Jali Star Flowers
    // Standalone geometric 8-pointed star rosettes arranged in a spacious staggered rhythm
    // Smaller refined scale with generous negative space, illuminating in royal gold near cursor
    const drawTeakJaliLattice = (lanternX, lanternY, isHovering) => {
      const spotlightRadius = 230; // warm lantern radius
      const stepX = 120; // wide, breathable horizontal spacing
      const stepY = 104; // elegant vertical pacing
      const s = 10;      // smaller, refined flower radius (~20px total diameter)

      ctx.save();

      // Soft ambient lantern glow halo centered on mouse
      if (isHovering) {
        ctx.save();
        const haloGradient = ctx.createRadialGradient(lanternX, lanternY, 0, lanternX, lanternY, spotlightRadius);
        haloGradient.addColorStop(0, 'rgba(255, 215, 0, 0.08)');
        haloGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.03)');
        haloGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(lanternX, lanternY, spotlightRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw standalone 8-point star flowers in a staggered palace rhythm
      let rowIndex = 0;
      for (let y = 30; y <= height + stepY; y += stepY) {
        rowIndex++;
        const rowOffsetX = (rowIndex % 2 === 0) ? stepX / 2 : 0;

        for (let x = -stepX / 2 + rowOffsetX; x <= width + stepX; x += stepX) {
          const dist = isHovering ? Math.hypot(x - lanternX, y - lanternY) : 9999;

          let strokeColor = '#e5c05c'; // soft warm yellow across all other parts
          let strokeAlpha = 0.14;      // calm, non-distracting presence
          let strokeWidth = 0.85;
          let isSpotlight = false;
          let factor = 0;

          if (dist < spotlightRadius) {
            isSpotlight = true;
            factor = 1 - dist / spotlightRadius;
            strokeColor = '#ffd700'; // proper royal gold under cursor
            strokeAlpha = 0.14 + factor * 0.72; // smoothly illuminates up to 0.86
            strokeWidth = 0.85 + factor * 0.65; // crisp, fine-line elegance
          }

          ctx.strokeStyle = strokeColor;
          ctx.globalAlpha = strokeAlpha;
          ctx.lineWidth = strokeWidth;

          // 1. Outer 8-point star diamond petals (Option B geometry)
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const midAngle = angle + Math.PI / 8;

            const outerX = x + Math.cos(angle) * s;
            const outerY = y + Math.sin(angle) * s;
            const innerX = x + Math.cos(midAngle) * (s * 0.44);
            const innerY = y + Math.sin(midAngle) * (s * 0.44);

            if (i === 0) ctx.moveTo(outerX, outerY);
            else ctx.lineTo(outerX, outerY);
            ctx.lineTo(innerX, innerY);
          }
          ctx.closePath();
          ctx.stroke();

          // 2. Inner delicate 8-point geometric star
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 + Math.PI / 8;
            const px = x + Math.cos(angle) * (s * 0.44);
            const py = y + Math.sin(angle) * (s * 0.44);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();

          // 3. Central delicate ring
          ctx.beginPath();
          ctx.arc(x, y, s * 0.22, 0, Math.PI * 2);
          ctx.stroke();

          // 4. Center jewel point in golden cursor spotlight
          if (isSpotlight && factor > 0.15) {
            ctx.fillStyle = '#ffd700';
            ctx.globalAlpha = factor * 0.95;
            ctx.beginPath();
            ctx.arc(x, y, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    };

    // Draw subtle, minimal golden cliff elevation contours (ultra-soft, no heavy text)
    const drawTopographicContours = (parallaxX, parallaxY) => {
      ctx.save();
      const contours = [
        { y: height * 0.28, amp: 35, freq: 0.0016, speed: 0.0006, color: 'rgba(229, 192, 92, 0.14)' },
        { y: height * 0.72, amp: 40, freq: 0.0018, speed: 0.0008, color: 'rgba(255, 215, 0, 0.12)' },
      ];

      contours.forEach((c) => {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();

        const offset = parallaxX * 0.015;
        const yBase = c.y + parallaxY * 0.02;

        for (let x = 0; x <= width; x += 32) {
          const y = yBase + Math.sin((x + offset) * c.freq + time * c.speed) * c.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();
    };

    // Render loop
    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      const parallaxX = mouse.x - width / 2;
      const parallaxY = mouse.y - height / 2;

      // 1. Draw Teak Jali Lattice (visible in yellow everywhere, proper golden in cursor spotlight)
      drawTeakJaliLattice(mouse.x, mouse.y, mouse.isHovering);

      // 2. Draw Topographic Contours with Golden Shimmer & Parallax
      drawTopographicContours(parallaxX, parallaxY);

      // 3. Draw & Animate Windlines in Soft Golden Shimmer
      ctx.save();
      windlines.forEach((line) => {
        line.x += line.speed;
        if (line.x - line.length > width) {
          line.x = -line.length;
          line.y = Math.random() * height;
        }
        ctx.strokeStyle = `rgba(255, 215, 0, ${line.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + line.length, line.y - 12);
        ctx.stroke();
      });
      ctx.restore();

      // 4. Draw & Animate Expanding Click Ripples in Royal Gold
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 2.2;
        r.opacity -= 0.012;
        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, r.opacity);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Inner echo ring
        if (r.radius > 20) {
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Draw & Animate Golden Jasmine Petals with Mouse Repel Physics
      ctx.save();
      petals.forEach((p) => {
        p.flutter += 0.04;
        p.angle += p.angularSpeed;

        // Repel physics from mouse
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const repelRadius = 140;

        if (dist < repelRadius && dist > 1) {
          const force = (1 - dist / repelRadius) * 2.2;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        } else {
          p.vx += (p.baseVx - p.vx) * 0.04;
          p.vy += (p.baseVy - p.vy) * 0.04;
        }

        p.x += p.vx + Math.sin(p.flutter) * 0.4;
        p.y += p.vy + Math.cos(p.flutter) * 0.25;

        // Screen boundary wrapping
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Draw Petal Shape
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;

        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle petal core
        ctx.strokeStyle = 'rgba(180, 130, 20, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-p.size * 0.7, 0);
        ctx.lineTo(p.size * 0.7, 0);
        ctx.stroke();

        ctx.restore();
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [timeMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default CoastalLivingCanvas;
