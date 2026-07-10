import { Button } from '@toss/tds-mobile';

interface InviteSheetProps {
  title: string;
  emoji: string;
  missions: string[];
  onAccept: () => void;
  onDismiss: () => void;
}

// TDS BottomSheet 안에서 렌더돼요. 친구가 공유한 딥링크로 앱에 들어오면 떠서,
// 같은 챌린지를 '내 폰에서' 시작할지 물어봐요.
export default function InviteSheet({
  title,
  emoji,
  missions,
  onAccept,
  onDismiss,
}: InviteSheetProps) {
  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-3">
          {emoji}
        </div>
        <p className="text-xs font-bold text-blue-600">
          친구가 함께 하자고 초대했어요
        </p>
        <h3 className="text-lg font-bold text-neutral-900 mt-1">{title}</h3>
        <p className="text-xs text-neutral-500 mt-1">
          같은 챌린지를 내 폰에서 시작해요.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center mb-5">
        {missions.slice(0, 6).map((m, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-bold"
          >
            {m}
          </span>
        ))}
        {missions.length > 6 && (
          <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-400 text-[11px] font-bold">
            +{missions.length - 6}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <Button color="dark" variant="weak" display="full" onClick={onDismiss}>
            닫기
          </Button>
        </div>
        <div style={{ flex: 1 }}>
          <Button display="full" onClick={onAccept}>
            시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}
