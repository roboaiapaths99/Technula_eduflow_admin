import React, { useEffect, useRef } from 'react';
import { Sparkles, Cake, PartyPopper, Heart, X, Volume2 } from 'lucide-react';

export default function BirthdayCelebrationModal({ student, schoolName, birthdayMessage, onClose }) {
  const canvasRef = useRef(null);

  // Confetti explosion engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#f43f5e', '#8b5cf6', '#ec4899', '#3b82f6', '#eab308', '#10b981', '#f97316', '#a855f7'];
    const particles = [];

    // Trigger explosive radial boom of particles
    const createExplosion = (centerX, centerY, count = 120) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 14 + 4;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          shape: Math.random() > 0.5 ? 'rect' : 'circle',
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          gravity: 0.28,
          alpha: 1,
          decay: Math.random() * 0.012 + 0.006,
        });
      }
    };

    // Initial dual boom explosion
    createExplosion(window.innerWidth * 0.5, window.innerHeight * 0.45, 160);
    setTimeout(() => {
      createExplosion(window.innerWidth * 0.35, window.innerHeight * 0.4, 100);
      createExplosion(window.innerWidth * 0.65, window.innerHeight * 0.4, 100);
    }, 450);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Attach explosion trigger to window for button access
    window.__triggerBoomConfetti = () => {
      createExplosion(window.innerWidth * 0.5, window.innerHeight * 0.45, 140);
      createExplosion(window.innerWidth * (0.2 + Math.random() * 0.6), window.innerHeight * 0.35, 90);
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      delete window.__triggerBoomConfetti;
    };
  }, []);

  const handlePopMore = () => {
    if (typeof window.__triggerBoomConfetti === 'function') {
      window.__triggerBoomConfetti();
    }
  };

  const studentName = student?.name || 'Student';
  const gradeDisplay = student?.grade ? `Class ${student.grade}${student.section ? `-${student.section}` : ''}` : '';
  const message = birthdayMessage || `Dear Parent, ${schoolName || 'The School Management'} extends warmest wishes to ${studentName} (${gradeDisplay}) on their special Birthday! May this year bring boundless happiness, health, and bright achievements! 🎂🎉`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      {/* Confetti Explosion Canvas */}
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

      <style>{`
        @keyframes bdayBoomModal {
          0% {
            transform: scale(0.2) rotate(-8deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.06) rotate(2deg);
            opacity: 1;
          }
          80% {
            transform: scale(0.97) rotate(-1deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes balloonFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 35px rgba(244, 63, 94, 0.4), 0 0 70px rgba(139, 92, 246, 0.25); }
          50% { box-shadow: 0 0 55px rgba(244, 63, 94, 0.65), 0 0 100px rgba(139, 92, 246, 0.45); }
        }
        @keyframes sparkleTwinkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.8; }
          50% { transform: scale(1.3) rotate(20deg); opacity: 1; }
        }
      `}</style>

      {/* Celebration Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '540px',
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 50%, #fdf2f8 100%)',
          borderRadius: '24px',
          border: '3px solid #fbcfe8',
          animation: 'bdayBoomModal 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, pulseGlow 3s infinite',
          padding: '36px 28px',
          textAlign: 'center',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Floating Balloons and Confetti Icons */}
        <div style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '32px', animation: 'balloonFloat 3s ease-in-out infinite' }}>
          🎈
        </div>
        <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '32px', animation: 'balloonFloat 3.5s ease-in-out infinite 0.5s' }}>
          🎉
        </div>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
          title="Close celebration"
        >
          <X size={18} />
        </button>

        {/* Central Crown / Cake Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.45)',
          }}>
            🎂
          </div>
          <span style={{ position: 'absolute', top: '-10px', right: '-8px', fontSize: '28px', animation: 'sparkleTwinkle 2s infinite' }}>
            ✨
          </span>
          <span style={{ position: 'absolute', bottom: '-4px', left: '-10px', fontSize: '24px', animation: 'sparkleTwinkle 2.5s infinite 0.4s' }}>
            🎊
          </span>
        </div>

        {/* Celebration Title */}
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #f43f5e, #8b5cf6)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '11px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          padding: '4px 14px',
          borderRadius: '20px',
          marginBottom: '10px',
        }}>
          💥 CELEBRATION TIME 💥
        </div>

        <h2 style={{
          margin: '0 0 6px 0',
          fontSize: '28px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #e11d48 0%, #c026d3 50%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1.2',
        }}>
          Happy Birthday, {studentName}!
        </h2>

        {gradeDisplay && (
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#be185d',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            <span>🎓 {gradeDisplay}</span>
            {schoolName && <span>• {schoolName}</span>}
          </div>
        )}

        {/* School Birthday Card Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid #fbcfe8',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 14px rgba(244, 63, 94, 0.08)',
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#334155',
            fontWeight: 500,
            fontStyle: 'italic',
          }}>
            "{message}"
          </p>
        </div>

        {/* Interactive Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handlePopMore}
            style={{
              padding: '12px 22px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(244, 63, 94, 0.35)',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <PartyPopper size={18} /> Pop Confetti! 💥
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '12px 22px',
              borderRadius: '14px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Sparkles size={18} color="#8b5cf6" /> Thank You! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
