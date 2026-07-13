import { ChevronRight, UserPlus, LayoutGrid, Plus } from 'lucide-react';
import { useToast, Badge, Button } from '@toss/tds-mobile';
import { BingoBoard, NavKey } from '../types';
import { APP_ICON } from '../data';
import { shareApp } from '../lib/share';
import LucideIcon from './LucideIcon';
import Emoji from './Emoji';
import HeroCarousel from './HeroCarousel';
import BottomNav from './BottomNav';

interface DashboardViewProps {
  boards: BingoBoard[];
  onSelectBoard: (boardId: string) => void;
  onCreateNewBoard: () => void;
  onNavigate: (view: NavKey) => void;
}

export default function DashboardView({
  boards,
  onSelectBoard,
  onCreateNewBoard,
  onNavigate
}: DashboardViewProps) {
  const { openToast } = useToast();

  const handleInvite = () => shareApp(openToast);

  return (
    <div className="w-full max-w-md mx-auto bg-page min-h-screen pb-28 text-neutral-900 font-sans slide-clip-x">
      
      {/* TopAppBar — 공유는 하단 '친구 초대하기' 섹션으로 일원화(우측 상단 아이콘 제거) */}
      <header className="flex items-center px-5 h-14 w-full z-40 bg-page/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          {/* image_10은 사방에 ~3% 검은 프레임이 있어, overflow-hidden + scale로 크롭해 깔끔하게 보여줘요. */}
          <div className="w-8 h-8 rounded-xl shadow-sm overflow-hidden flex-shrink-0">
            <img
              alt="찍고빙고"
              className="w-full h-full object-cover scale-110"
              src={APP_ICON}
            />
          </div>
          <h1 className="text-[22px] leading-7.5 font-bold text-blue-600 tracking-tight mb-0!">찍고빙고</h1>
        </div>
      </header>

      {/* Main Body */}
      <main className="px-5 pt-4 space-y-6 animate-slide-in-left">
        
        {/* Hero: 여름 무드 배너 (hero_01~06 캐러셀) — 생성 액션은 아래 헤더 버튼으로 분리 */}
        <HeroCarousel />

        {/* Active Boards Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-1.5">
              <span>진행 중인 챌린지</span>
              <Badge variant="weak" size="xsmall" color="blue">{`${boards.length}`}</Badge>
            </h3>
            <button
              onClick={onCreateNewBoard}
              aria-label="새 챌린지 만들기"
              className="flex items-center gap-1 text-sm font-bold text-blue-600 pl-2.5 pr-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-full! active:scale-95 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              새 챌린지
            </button>
          </div>

          {boards.length === 0 && (
            <div className="bg-surface border border-hairline/80 rounded-[24px] p-8 flex flex-col items-center text-center gap-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <LayoutGrid size={26} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-900">아직 챌린지가 없어요</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  여름 테마를 골라 첫 사진 챌린지를
                  <br />만들어 보세요.
                </p>
              </div>
              <Button color="primary" size="medium" onClick={onCreateNewBoard}>
                새 챌린지 만들기
              </Button>
            </div>
          )}
          <div className="space-y-3">
            {boards.map((board) => {
              const shared = board.shared === true;
              const completedCount = board.cells.filter(c => c.completed).length;
              const totalCount = board.cells.length;
              const percent =
                totalCount > 0
                  ? Math.round((completedCount / totalCount) * 100)
                  : 0;
              // 공유 보드 카드는 라이브 개수를 미리 알 수 없어 트로피/퍼센트 대신 '함께' 배지를 보여줘요.
              const earned = !shared && totalCount > 0 && completedCount === totalCount;

              return (
                <div 
                  key={board.id}
                  onClick={() => onSelectBoard(board.id)}
                  className="bg-surface p-5 rounded-[24px] border border-hairline/80 shadow-sm flex items-center gap-4 hover:bg-neutral-50 transition-colors cursor-pointer active:scale-[0.99] transition-transform"
                >
                  {/* Board Icon */}
                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                    <Emoji emoji={board.emoji} size={32} alt="" />
                    {earned && (
                      <span
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center border-2 border-surface shadow-sm"
                        title="빙고 완성 뱃지 획득"
                      >
                        <LucideIcon name="Trophy" size={12} />
                      </span>
                    )}
                  </div>

                  {/* 제목 + 간략 부제(미션 앞 3개 미리보기) */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-neutral-900 truncate">
                      {board.title}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1 truncate">
                      {shared
                        ? '함께 채우는 챌린지'
                        : board.cells.slice(0, 3).map((c) => c.title).join(' · ')}
                    </p>
                  </div>

                  {/* 진행 — 솔로는 개수(N/N)+퍼센트(%), 공유는 '함께' 배지 */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {shared ? (
                      <Badge variant="weak" size="xsmall" color="blue">
                        함께
                      </Badge>
                    ) : (
                      <>
                        <Badge
                          variant="weak"
                          size="xsmall"
                          color={percent === 100 ? 'green' : 'blue'}
                        >
                          {`${completedCount}/${totalCount}`}
                        </Badge>
                        <Badge
                          variant="weak"
                          size="xsmall"
                          color={percent === 100 ? 'green' : 'blue'}
                        >
                          {`${percent}%`}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Friend Invite */}
        <section className="pb-4">
          <div className="bg-neutral-100/60 rounded-[24px] p-5 flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-neutral-900">친구 초대하기</h4>
              <p className="text-xs text-neutral-500 mt-1">친구와 함께 빙고를 채워보세요.</p>
              <button
                onClick={handleInvite}
                className="text-xs font-bold text-blue-600 flex items-center mt-2 active:scale-95 transition-transform"
              >
                초대 링크 공유 <ChevronRight size={14} />
              </button>
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <UserPlus size={24} />
            </div>
          </div>
        </section>
      </main>

      <BottomNav current="dashboard" onNavigate={onNavigate} />

    </div>
  );
}
