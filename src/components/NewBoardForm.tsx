import { useState } from 'react';
import { TextField, Button } from '@toss/tds-mobile';
import { BOARD_TEMPLATES } from '../data';
import { NewBoardDraft } from '../types';

interface NewBoardFormProps {
  onSubmit: (draft: NewBoardDraft) => void;
  onCancel: () => void;
}

const CUSTOM_ID = 'custom';

// 템플릿 4종 + '직접 만들기'. 리스트 렌더에 필요한 최소 필드만 병합해요.
const OPTIONS = [
  ...BOARD_TEMPLATES.map((t) => ({
    id: t.id,
    emoji: t.emoji,
    label: t.label,
    description: t.description,
  })),
  {
    id: CUSTOM_ID,
    emoji: '✏️',
    label: '직접 만들기',
    description: '미션을 직접 입력해요',
  },
];

// Rendered inside a TDS BottomSheet. 여름 테마(여행·피서·미식·건강)를 고르면 그 9칸이
// 시드되고, '직접 만들기'를 고르면 미션 9칸을 사용자가 직접 입력해요.
export default function NewBoardForm({ onSubmit, onCancel }: NewBoardFormProps) {
  const [selectedId, setSelectedId] = useState(OPTIONS[0].id);
  const [name, setName] = useState(OPTIONS[0].label);
  const [nameTouched, setNameTouched] = useState(false);
  const [missions, setMissions] = useState<string[]>(() => Array(9).fill(''));

  const isCustom = selectedId === CUSTOM_ID;
  const trimmedName = name.trim();

  // 옵션을 바꾸면 사용자가 이름을 아직 손대지 않은 경우에만 기본 이름을 채워요('직접 만들기'는 비움).
  const handleSelectOption = (id: string) => {
    setSelectedId(id);
    if (!nameTouched) {
      const next = OPTIONS.find((o) => o.id === id);
      setName(id === CUSTOM_ID ? '' : next?.label ?? '');
    }
  };

  const handleNameChange = (value: string) => {
    setNameTouched(true);
    setName(value);
  };

  const updateMission = (index: number, value: string) => {
    setMissions((prev) => prev.map((m, i) => (i === index ? value : m)));
  };

  const handleCreate = () => {
    if (trimmedName === '') {
      return;
    }
    if (isCustom) {
      onSubmit({ type: 'custom', name: trimmedName, missions });
    } else {
      onSubmit({ type: 'template', templateId: selectedId, name: trimmedName });
    }
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <p className="text-xs font-bold text-neutral-500 mb-2">테마 선택</p>
      <div className="flex flex-col gap-2 mb-5">
        {OPTIONS.map((option) => {
          const active = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelectOption(option.id)}
              aria-pressed={active}
              className={`flex items-center gap-3 w-full text-left p-3 rounded-2xl! border transition-all active:scale-[0.98] ${
                active
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-hairline bg-surface hover:bg-neutral-50'
              }`}
            >
              <span className="text-2xl flex-shrink-0" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-neutral-900 truncate">
                  {option.label}
                </span>
                <span className="block text-[11px] text-neutral-500 truncate">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <TextField
        variant="box"
        label="보드 이름"
        labelOption="sustain"
        placeholder={isCustom ? '예: 우리 가족 여름 미션' : '예: 부산 해운대 여행 🏖️'}
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
      />

      {isCustom && (
        <div className="mt-4">
          <p className="text-xs font-bold text-neutral-500 mb-2">
            미션 9칸{' '}
            <span className="font-medium text-neutral-400">
              (비워두면 ‘미션 N’으로 채워져요)
            </span>
          </p>
          <div className="flex flex-col gap-2">
            {missions.map((mission, i) => (
              <input
                key={i}
                value={mission}
                onChange={(e) => updateMission(i, e.target.value)}
                placeholder={`미션 ${i + 1}`}
                maxLength={20}
                className="w-full h-11 px-3.5 rounded-xl border border-hairline bg-surface text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none transition-colors"
              />
            ))}
          </div>
        </div>
      )}

      {/* size="large"(radius 14px) — 보드 삭제 확인 다이얼로그의 기본 버튼과 radius를 맞춰요. */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <div style={{ flex: 1 }}>
          <Button color="dark" variant="weak" display="block" size="large" onClick={onCancel}>
            취소
          </Button>
        </div>
        <div style={{ flex: 1 }}>
          <Button
            display="block"
            size="large"
            disabled={trimmedName === ''}
            onClick={handleCreate}
          >
            만들기
          </Button>
        </div>
      </div>
    </div>
  );
}
