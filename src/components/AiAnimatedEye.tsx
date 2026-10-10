import React from 'react';

interface AiAnimatedEyeProps {
  size?: number;
  glowColor?: string;
  isPulsing?: boolean;
  className?: string;
}

/**
 * AiAnimatedEye (Jarvis 3D Star of David / Arc-Reactor)
 * Replicates the high-tech holographic Jarvis aesthetic from the mobile app:
 * 1. Magen David (Star of David) sacred geometry with glowing energy core
 * 2. Rotating outer HUD ring with cardinal tech orbital marker nodes
 * 3. Counter-rotating inner orbital ring
 * 4. Sinusoidal breathing glow and heartbeat pulsation
 */
export const AiAnimatedEye: React.FC<AiAnimatedEyeProps> = ({
  size = 24,
  glowColor = '#F59E0B',
  isPulsing = true,
  className = '',
}) => {
  const containerSize = size * 1.5;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
      }}
      aria-hidden="true"
    >
      {/* Ambient Pulsing Glow Halo */}
      {isPulsing && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
          style={{
            backgroundColor: glowColor,
            animationDuration: '2.8s',
          }}
        />
      )}

      {/* Breathing Halo */}
      <div
        className="absolute inset-1 rounded-full blur-[2px] transition-opacity pointer-events-none"
        style={{
          backgroundColor: glowColor,
          opacity: 0.25,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10"
        style={{
          filter: `drop-shadow(0 0 4px ${glowColor}66)`,
        }}
      >
        <defs>
          <radialGradient id="ai-core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
            <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.95" />
            <stop offset="80%" stopColor={glowColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Rotating HUD Ring (Clockwise) */}
        <g
          className="origin-center"
          style={{
            animation: 'ai-spin-cw 10s linear infinite',
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={glowColor}
            strokeWidth="1.4"
            strokeDasharray="4 6 12 6"
            strokeOpacity="0.7"
          />
          {/* 4 Cardinal Orbital Tech Nodes */}
          <circle cx="50" cy="6" r="2.2" fill="#FEF08A" stroke={glowColor} strokeWidth="1" />
          <circle cx="94" cy="50" r="2.2" fill="#FEF08A" stroke={glowColor} strokeWidth="1" />
          <circle cx="50" cy="94" r="2.2" fill="#FEF08A" stroke={glowColor} strokeWidth="1" />
          <circle cx="6" cy="50" r="2.2" fill="#FEF08A" stroke={glowColor} strokeWidth="1" />
        </g>

        {/* Inner Counter-Rotating Hex Orbital Ring (Counter-Clockwise) */}
        <g
          className="origin-center"
          style={{
            animation: 'ai-spin-ccw 7s linear infinite',
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke={glowColor}
            strokeWidth="1.2"
            strokeDasharray="16 8 8 8"
            strokeOpacity="0.6"
          />
        </g>

        {/* Pulsing Sacred Geometry Core: Magen David (Star of David) */}
        <g
          className="origin-center"
          style={{
            animation: isPulsing ? 'ai-breathe 2.4s ease-in-out infinite' : 'none',
          }}
        >
          {/* Upward Triangle */}
          <polygon
            points="50,22 74,64 26,64"
            fill="none"
            stroke={glowColor}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Downward Triangle */}
          <polygon
            points="50,78 74,36 26,36"
            fill="none"
            stroke={glowColor}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Central High-Tech Arc-Reactor Core */}
          <circle cx="50" cy="50" r="11" fill="url(#ai-core-grad)" />
          <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
        </g>
      </svg>

      <style jsx>{`
        @keyframes ai-spin-cw {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes ai-spin-ccw {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        @keyframes ai-breathe {
          0%,
          100% {
            transform: scale(0.95);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
