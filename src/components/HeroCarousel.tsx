import { useEffect, useRef, useState } from 'react';
import { HERO_SLIDES } from '../data';

const AUTOPLAY_MS = 3500;
const SWIPE_THRESHOLD = 40;

/**
 * 대시보드 히어로. HERO_SLIDES를 크로스페이드로 순환하는 여름 무드 배너예요.
 * 자동전환 + 도트 + 스와이프만 담당하고, "새 챌린지 만들기" 액션은
 * "진행 중인 챌린지" 헤더의 버튼으로 분리했어요(배너 탭 ≠ 생성).
 */
export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // 자동 전환. 사용자가 모션 최소화를 켜면 멈춰서 접근성을 지켜요.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, []);

  const goTo = (index: number) => {
    const count = HERO_SLIDES.length;
    setActive(((index % count) + count) % count);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) {
      return;
    }
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      goTo(active + (deltaX < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  };

  return (
    <section>
      <div
        className="relative w-full aspect-[16/9] rounded-[32px]! overflow-hidden! shadow-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 슬라이드 (크로스페이드) */}
        {HERO_SLIDES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === active ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {/* 무드 카피(장식) — 여름 인증 챌린지 프레이밍. 스와이프/도트를 막지 않도록 클릭 통과 */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <span className="absolute left-6 bottom-8 right-6">
            <span className="block text-xs font-semibold text-white/85 mb-1 drop-shadow">
              여름 인증 챌린지
            </span>
            <span className="block text-2xl font-bold text-white leading-tight drop-shadow-md">
              사진으로 채우는
              <br />
              나의 여름
            </span>
          </span>
        </div>

        {/* 도트 인디케이터 (개별 슬라이드로 이동) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 이미지 보기`}
              aria-current={i === active ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
