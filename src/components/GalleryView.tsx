import { useState } from 'react';
import { ArrowLeft, Image, Trash2, Calendar } from 'lucide-react';
import { useDialog, Button } from '@toss/tds-mobile';
import { BingoBoard, NavKey } from '../types';
import BottomNav from './BottomNav';

interface GalleryViewProps {
  boards: BingoBoard[];
  onNavigate: (view: NavKey) => void;
  onClearGallery: () => void; // Let them reset for testing! Extremely helpful.
}

export default function GalleryView({
  boards,
  onNavigate,
  onClearGallery
}: GalleryViewProps) {
  const { openConfirm } = useDialog();
  const [filter, setFilter] = useState<string>('all');

  // Gather all completed cells across all boards
  const allCompletedPhotos = boards.flatMap(board => 
    board.cells
      .filter(cell => cell.completed && cell.photoUrl)
      .map(cell => ({
        boardId: board.id,
        boardTitle: board.title,
        cellId: cell.id,
        title: cell.title,
        photoUrl: cell.photoUrl!,
        date: cell.dateCompleted || '2026-07-01',
      }))
  );

  const filteredPhotos = filter === 'all' 
    ? allCompletedPhotos 
    : allCompletedPhotos.filter(p => p.boardId === filter);

  return (
    <div className="w-full max-w-md mx-auto bg-page min-h-screen pb-28 text-neutral-900 font-sans relative flex flex-col slide-clip-x">
      
      {/* TopAppBar */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 h-14 w-full z-40 bg-page/80 backdrop-blur-md sticky top-0">
        <button
          onClick={() => onNavigate('dashboard')}
          aria-label="뒤로 가기"
          className="justify-self-start w-8 h-8 rounded-full! bg-neutral-50 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] leading-7.5 font-bold text-blue-600 tracking-tight text-center mb-0!">여름 아카이브</h1>
        <button
          onClick={async () => {
            const ok = await openConfirm({
              title: '갤러리를 초기화할까요?',
              description: '모든 업로드 내역이 사라지고 처음 상태로 돌아가요.',
              confirmButton: '초기화',
              cancelButton: '취소',
            });
            if (ok) onClearGallery();
          }}
          className="justify-self-end w-8 h-8 rounded-full! bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-95"
          aria-label="갤러리 초기화"
          title="갤러리 초기화"
        >
          <Trash2 size={16} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 space-y-6 animate-slide-in-right">
        
        {/* Gallery Intro Header */}
        <section className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">나의 여름 조각들</h2>
          <p className="text-xs text-neutral-500 font-medium">빙고 미션 인증을 통해 수집한 추억 폴더</p>
        </section>

        {/* Board filter pills */}
        <section className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full! text-xs font-bold whitespace-nowrap transition-all ${
              filter === 'all' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-surface text-neutral-600 border border-hairline'
            }`}
          >
            전체보기 ({allCompletedPhotos.length})
          </button>
          {boards.map(b => {
            const completedCount = b.cells.filter(c => c.completed && c.photoUrl).length;
            return (
              <button 
                key={b.id}
                onClick={() => setFilter(b.id)}
                className={`px-4 py-2 rounded-full! text-xs font-bold whitespace-nowrap transition-all ${
                  filter === b.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-surface text-neutral-600 border border-hairline'
                }`}
              >
                {b.title.split(' ')[0]} ({completedCount})
              </button>
            );
          })}
        </section>

        {/* Photos Grid */}
        <section className="flex-1">
          {filteredPhotos.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-neutral-100 text-neutral-300 rounded-full flex items-center justify-center">
                <Image size={28} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-neutral-800">아직 수집된 여름 조각이 없어요</p>
                <p className="text-xs text-neutral-400 max-w-[200px] mx-auto leading-relaxed">
                  빙고판에서 빈 칸을 탭하고 여름 미션 사진을 인증하여 완성하세요!
                </p>
              </div>
              <Button
                color="primary"
                size="small"
                onClick={() => onNavigate('dashboard')}
              >
                빙고 하러가기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredPhotos.map((photo, i) => (
                <div 
                  key={i} 
                  className="bg-surface rounded-2xl overflow-hidden border border-hairline/60 shadow-sm hover:shadow-md transition-all flex flex-col group animate-fade-in"
                >
                  {/* Photo with responsive zoom */}
                  <div className="aspect-square bg-neutral-50 overflow-hidden relative">
                    <img
                      src={photo.photoUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1 text-left">
                    <span className="text-[9px] font-bold text-blue-600 truncate block">
                      {photo.boardTitle}
                    </span>
                    <h4 className="text-xs font-extrabold text-neutral-800 truncate">
                      {photo.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-semibold pt-1 border-t border-neutral-50">
                      <Calendar size={10} />
                      <span>{photo.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <BottomNav current="gallery" onNavigate={onNavigate} />

    </div>
  );
}
