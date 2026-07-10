import { X } from 'lucide-react';
import { Button } from '@toss/tds-mobile';
import { Badge } from '../types';

interface BadgeModalProps {
  badge: Badge;
  onClose: () => void;
}

export default function BadgeModal({ badge, onClose }: BadgeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-xs rounded-[28px] shadow-2xl border border-hairline p-6 flex flex-col items-center text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 w-8 h-8 rounded-full! bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-24 h-24 rounded-full bg-neutral-100/60 border border-hairline shadow-sm flex items-center justify-center text-5xl mt-2">
          <span>{badge.emoji}</span>
        </div>

        <p className="text-xs font-bold text-blue-600 mt-5">획득 완료</p>
        <h3 className="text-xl font-bold text-neutral-900 mt-1">{badge.name}</h3>
        <p className="text-sm text-neutral-500 mt-2 leading-snug">{badge.tagline} 뱃지예요.</p>

        <div className="w-full mt-6">
          <Button color="primary" display="block" size="large" onClick={onClose}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
