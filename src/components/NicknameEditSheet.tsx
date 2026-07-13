import { useState } from 'react';
import { TextField, Button } from '@toss/tds-mobile';
import Emoji from './Emoji';
import SheetFooter from './SheetFooter';

interface NicknameEditSheetProps {
  currentNickname: string;
  onSave: (nickname: string) => void;
  onDismiss: () => void;
}

// 함께 방 안에서 내 이름(멤버 닉네임)을 바꾸는 시트예요.
// 이 방에서만 바뀌고 다른 방/역할의 이름엔 영향을 주지 않아요(방·uid별 이름 유지).
export default function NicknameEditSheet({
  currentNickname,
  onSave,
  onDismiss,
}: NicknameEditSheetProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const trimmed = nickname.trim();
  const unchanged = trimmed === currentNickname.trim();

  return (
    <div>
      <div
        style={{ padding: '0 24px' }}
        className="flex flex-col items-center text-center"
      >
        <Emoji emoji="✏️" size={48} alt="" />
        <h3 className="text-lg font-bold text-neutral-900 mt-3">
          이 방에서 쓸 이름
        </h3>
        <p className="text-sm text-neutral-500 mt-1 mb-5 leading-relaxed">
          이 함께 보드에서만 바뀌어요.
          <br />
          내가 인증한 칸의 이름도 함께 바뀌어요.
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
              취소
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button
              display="block"
              size="large"
              disabled={trimmed === '' || unchanged}
              onClick={() => onSave(trimmed)}
            >
              저장
            </Button>
          </div>
        </div>
      </SheetFooter>
    </div>
  );
}
