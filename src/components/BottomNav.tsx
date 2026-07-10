import { Home, Image, type LucideIcon } from 'lucide-react';
import { NavKey } from '../types';

interface Tab {
  key: NavKey;
  label: string;
  Icon: LucideIcon;
}

// IA(2026-07-06): 보드는 홈 목록에서 파고드는 콘텐츠라 탭에서 제외. 탑레벨 목적지
// 2개 — 홈(만들기·목록·추천·초대) / 갤러리(여름 아카이브)만 탭으로 둠.
const TABS: Tab[] = [
  { key: 'dashboard', label: '홈', Icon: Home },
  { key: 'gallery', label: '갤러리', Icon: Image },
];

interface BottomNavProps {
  current: NavKey;
  onNavigate: (view: NavKey) => void;
}

// BottomNavSample의 글래스모피즘 디자인 스타일을 적용해요: 화면 하단 풀블리드 반투명+블러 바,
// 위쪽 그라데이션 페이드로 콘텐츠가 바 아래로 부드럽게 사라지고, 활성 탭은 검정 라운드 pill 안의
// 흰색 채운 아이콘, 비활성은 회색 아웃라인 아이콘이에요. 색은 앱 adaptive 토큰으로 맞춰
// 다크모드까지 대응하고, 아이콘 전용이라 접근성용 aria-label을 붙여요.
export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* 콘텐츠가 바 아래로 부드럽게 사라지도록 하는 상단 그라데이션 페이드 */}
      <div className="h-12 w-full bg-gradient-to-t from-page to-transparent pointer-events-none" />

      {/* 글래스모피즘 바 */}
      <nav
        className="flex items-center justify-around px-8 bg-surface/85 backdrop-blur-xl border-t border-hairline"
        style={{
          paddingTop: 12,
          // 홈 인디케이터(safe-area)만큼 아래 여백을 확보해요(없으면 최소 12px).
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const isActive = current === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center justify-center w-16 h-14 active:opacity-70 transition-opacity"
            >
              {isActive ? (
                <span className="bg-neutral-900 p-2.5 rounded-2xl shadow-sm">
                  <Icon size={24} className="text-white" fill="white" />
                </span>
              ) : (
                <Icon size={28} className="text-neutral-400" strokeWidth={2} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
