import { useEffect, useRef } from 'react';
import { ArrowLeft, Check, Trophy, Cloud, Sparkles } from 'lucide-react';
import { useToast, Button } from '@toss/tds-mobile';
import { CompletionTier } from '../types';
import { shareApp } from '../lib/share';

interface MissionCompleteViewProps {
  cellTitle: string;
  photoUrl: string;
  tier: CompletionTier;
  onConfirm: () => void;
  onViewCard: () => void;
}

// 등급별 축하 문구와 컨페티 강도. 빙고 줄/보드 완성일수록 더 크게 축하해요.
const TIER_CONFIG: Record<
  CompletionTier,
  { title: string; subtitle: string; particleCount: number }
> = {
  cell: {
    title: '미션 완료!',
    subtitle: '여름의 한 순간을 잘 기록했어요.',
    particleCount: 60,
  },
  bingo: {
    title: '빙고 완성! 🎉',
    subtitle: '한 줄을 완성했어요. 이 기세로 남은 칸도 채워봐요!',
    particleCount: 110,
  },
  board: {
    title: '여름 빙고 완성! 🏆',
    subtitle: '모든 칸을 채웠어요. 나만의 여름 조각이 완성됐어요!',
    particleCount: 160,
  },
};

export default function MissionCompleteView({
  cellTitle,
  photoUrl,
  tier,
  onConfirm,
  onViewCard,
}: MissionCompleteViewProps) {
  const { openToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isCelebration = tier !== 'cell';
  const { title, subtitle } = TIER_CONFIG[tier];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // 컨페티: Toss 팔레트(파랑/성공/위험) + amber. 빙고/보드 완성 땐 금빛을 더해 더 화려하게.
    const celebration = tier !== 'cell';
    const colors = celebration
      ? ['#3182f6', '#03b26c', '#f04452', '#f59e0b', '#fbbf24', '#fcd34d']
      : ['#3182f6', '#03b26c', '#f04452', '#f59e0b'];
    const particleCount = TIER_CONFIG[tier].particleCount;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        size: Math.random() * 8 + 6,
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 3 - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [tier]);

  return (
    <div className="w-full max-w-md mx-auto bg-page min-h-screen pb-28 text-neutral-900 font-sans relative overflow-hidden flex flex-col justify-between">

      {/* Confetti Canvas overlay */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* TopAppBar */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 h-14 w-full z-40 bg-page/80 backdrop-blur-md sticky top-0">
        <button
          onClick={onConfirm}
          aria-label="뒤로 가기"
          className="justify-self-start w-8 h-8 rounded-full! bg-neutral-50 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] leading-7.5 font-bold text-blue-600 tracking-tight text-center mb-0!">찍고빙고</h1>
        <button
          onClick={() => shareApp(openToast, '찍고빙고에서 여름 미션을 인증했어요! 📸')}
          className="justify-self-end text-sm font-semibold text-blue-600 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full! transition-all active:scale-95"
        >
          공유
        </button>
      </header>

      {/* Celebration Main Body */}
      <main className="flex-1 px-5 py-6 flex flex-col items-center justify-center space-y-6 animate-fade-in relative z-20">

        {/* Success Icon with Radial Circles — 등급별 색/아이콘 */}
        <div className="relative flex items-center justify-center w-28 h-28">
          <div className={`absolute inset-0 rounded-full animate-ping duration-[3000ms] ${isCelebration ? 'bg-amber-100/50' : 'bg-blue-100/50'}`}></div>
          <div className={`absolute inset-2 rounded-full ${isCelebration ? 'bg-amber-100/80' : 'bg-blue-100/80'}`}></div>
          <div className={`relative text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${isCelebration ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-600 shadow-blue-100'}`}>
            {tier === 'board' ? (
              <Trophy size={40} strokeWidth={2.5} />
            ) : (
              <Check size={40} strokeWidth={3} />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">{title}</h2>
          <p className="text-sm text-neutral-500 font-medium">{subtitle}</p>
        </div>

        {/* Uploaded Photo Card */}
        <div className="w-full bg-surface rounded-3xl p-4 shadow-xl shadow-neutral-100/60 border border-hairline">
          <div className="overflow-hidden rounded-2xl aspect-[4/3] bg-neutral-50 relative group">
            <img
              src={photoUrl}
              alt="Uploaded proof"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-3 left-3 flex items-center bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white gap-1.5">
              <Cloud size={14} className="text-blue-100" />
              <span className="text-[10px] font-bold">Summer Spot</span>
            </div>
          </div>

          <div className="mt-4 text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Mission Name</span>
              <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-1">
                <span>{cellTitle} 촬영하기</span>
                <Sparkles size={14} className="text-blue-500 animate-pulse" />
              </h3>
            </div>
          </div>
        </div>

      </main>

      {/* Action Buttons sticky container */}
      <div className="px-5 pb-8 pt-4 bg-gradient-to-t from-page via-page to-transparent sticky bottom-0 z-20 flex flex-col gap-3">
        {isCelebration && (
          <Button color="primary" display="block" size="xlarge" onClick={onViewCard}>
            빙고 카드 보기
          </Button>
        )}
        <Button
          color="primary"
          variant={isCelebration ? 'weak' : 'fill'}
          display="block"
          size="xlarge"
          onClick={onConfirm}
        >
          확인
        </Button>
      </div>

    </div>
  );
}
