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

// 글래스모피즘 바(화면 하단 풀블리드 반투명+블러, 위쪽 그라데이션 페이드)예요. 활성 탭은
// 검정 pill 대신 **앱 브랜드 블루(#3182f6, blue-600)로 칠한 아웃라인 아이콘**, 비활성은
// 회색(neutral-400) 아웃라인으로 톤을 앱 accent와 일관되게 맞췄어요. (예전엔 검정 pill이라
// 갤러리 아이콘이 검정 사각 블록처럼 보였고, fill로 채우면 lucide Image가 안쪽 선이 묻혀 파란
// 사각 블록으로 뭉개져서 — browse로 확인 — 채우지 않고 색만 바꿔요.) 색은 adaptive/brand
// 토큰이라 다크모드까지 대응하고, 아이콘 전용이라 접근성용 aria-label을 붙여요.
export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* 콘텐츠가 바 아래로 부드럽게 사라지도록 하는 상단 그라데이션 페이드 */}
      <div className="h-12 w-full bg-linear-to-t from-page to-transparent pointer-events-none" />

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
              {/* 활성=브랜드 블루, 비활성=회색. 둘 다 아웃라인이라 갤러리(Image) 아이콘이 꽉 찬
                  사각 블록으로 뭉개지지 않고, 활성은 색+약간 굵은 stroke로만 구분해요. 같은
                  size(26)라 전환 시 레이아웃 점프도 없어요. */}
              <Icon
                size={26}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-colors ${
                  isActive ? 'text-blue-600' : 'text-neutral-400'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
