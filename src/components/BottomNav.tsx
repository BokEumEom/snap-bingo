import { Home, Image, type LucideIcon } from 'lucide-react';
import { NavKey } from '../types';

interface Tab {
  key: NavKey;
  label: string;
  Icon: LucideIcon;
  activeColor: string;
}

// IA(2026-07-06): 보드는 홈 목록에서 파고드는 콘텐츠라 탭에서 제외. 탑레벨 목적지
// 2개 — 홈(만들기·목록·추천·초대) / 갤러리(여름 아카이브)만 탭으로 둠.
const TABS: Tab[] = [
  { key: 'dashboard', label: '홈', Icon: Home, activeColor: 'text-blue-600' },
  { key: 'gallery', label: '갤러리', Icon: Image, activeColor: 'text-blue-600' },
];

interface BottomNavProps {
  current: NavKey;
  onNavigate: (view: NavKey) => void;
}

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 max-w-104 mx-auto z-40 flex justify-around items-center px-2 py-3 bg-surface/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-hairline rounded-3xl">
      {TABS.map(({ key, label, Icon, activeColor }) => {
        const isActive = current === key;
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`flex flex-col items-center justify-center px-3 py-1 transition-all active:scale-90 ${
              isActive ? activeColor : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <Icon className="mb-0.5" size={20} />
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
