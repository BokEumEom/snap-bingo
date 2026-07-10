import { useState, useEffect } from 'react';
import { TextField, Button } from '@toss/tds-mobile';
import { getNickname } from '../lib/identity';
import Emoji from './Emoji';
import SheetFooter from './SheetFooter';

interface RoomJoinSheetProps {
  onJoin: (nickname: string) => void;
  onDismiss: () => void;
}

// '함께(실시간 공동 빙고판)' 룸 초대 링크로 들어왔을 때 뜨는 참가 시트예요.
// 룸 상세(제목·미션)는 참가 전엔 RLS로 볼 수 없어, 이름만 받고 참가하면 보드가 열려요.
export default function RoomJoinSheet({ onJoin, onDismiss }: RoomJoinSheetProps) {
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    void (async () => {
      const saved = await getNickname();
      if (saved != null) {
        setNickname(saved);
      }
    })();
  }, []);

  const trimmed = nickname.trim();

  return (
    <div>
      <div
        style={{ padding: '0 24px' }}
        className="flex flex-col items-center text-center"
      >
        <Emoji emoji="🤝" size={48} alt="" />
        <h3 className="text-lg font-bold text-neutral-900 mt-3">
          함께 빙고에 초대받았어요
        </h3>
        <p className="text-sm text-neutral-500 mt-1 mb-5 leading-relaxed">
          친구와 한 판을 실시간으로 같이 채워요.
          <br />
          참가하면 보드가 열려요.
        </p>
        <div className="w-full text-left">
          <TextField
            variant="box"
            label="내 이름 (함께 화면에 표시돼요)"
            labelOption="sustain"
            placeholder="예: 김토스"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 12))}
          />
        </div>
      </div>

      <SheetFooter>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <Button
              color="dark"
              variant="weak"
              display="block"
              size="large"
              onClick={onDismiss}
            >
              닫기
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button
              display="block"
              size="large"
              disabled={trimmed === ''}
              onClick={() => onJoin(trimmed)}
            >
              참가하기
            </Button>
          </div>
        </div>
      </SheetFooter>
    </div>
  );
}
