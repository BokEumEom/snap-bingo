import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  /** 시트 열림 여부. true면 아래에서 위로 슬라이드업해요. */
  open: boolean;
  /** 딤 탭·핸들 탭·Esc로 닫힐 때 호출돼요. */
  onClose: () => void;
  /** 상단 제목이에요. 없으면 제목 줄을 렌더하지 않아요. */
  title?: ReactNode;
  /** 시트 본문이에요(스크롤 영역). */
  children: ReactNode;
}

// 슬라이드 트랜지션 시간(ms). 아래 duration-500과 반드시 일치시켜야 닫힘 후 언마운트 타이밍이 맞아요.
const TRANSITION_MS = 500;

let sheetSeq = 0;

/**
 * NewFlowModal(구독 트래커)의 "오픈 액션"을 참고한 커스텀 바텀시트예요.
 *
 * TDS `useBottomSheet`(포털 시트)는 내부 `transform: translateY(-10px)`으로 흰 패널이
 * 래퍼 바닥보다 위에서 끝나 화면 바닥과 틈이 생겼어요(그래서 box-shadow 꼼수가 필요했음).
 * 여기서는 `position: fixed; inset:0`의 `flex flex-col justify-end` 컨테이너 안에 카드를
 * 두어, 카드 바닥이 **뷰포트 바닥(= viewport-fit=cover가 켜진 실기기의 물리 화면 바닥)** 과
 * 구조적으로 이어지게 해요. 별도 CSS 꼼수 없이 네이티브처럼 바닥에 붙어요.
 *
 * 열릴 때만 children을 마운트해(닫힘 애니메이션 동안 유지) 폼 상태가 매 오픈마다 초기화돼요.
 */
export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  // mounted: 트리에 존재(열림 또는 닫힘 애니메이션 중). visible: 슬라이드 위치(false=아래로 숨김).
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const titleIdRef = useRef<string>();
  if (titleIdRef.current == null) {
    titleIdRef.current = `sheet-title-${(sheetSeq += 1)}`;
  }

  // open 변화에 따라 마운트/슬라이드를 제어해요.
  useEffect(() => {
    if (open) {
      setMounted(true);
      // 두 프레임에 걸쳐 전환해요. translate-y-full 초기 상태를 '한 번 그린 뒤'에 visible=true로
      // 바꿔야 enter 트랜지션이 발화해요. (단일 rAF면 마운트 렌더와 같은 프레임에 최종 위치로
      // 점프해 초기 프레임이 그려지지 않고 애니메이션이 생략돼요.)
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    // 닫힘: 아래로 슬라이드다운한 뒤 트랜지션 시간만큼 지나면 언마운트해요.
    setVisible(false);
    const timer = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [open]);

  // 시트가 떠 있는 동안 배경 스크롤을 잠가요.
  useEffect(() => {
    if (!mounted) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  // Esc로 닫기(웹/키보드 접근성).
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title != null ? titleIdRef.current : undefined}
    >
      {/* 딤: 카드 뒤(위쪽 여백)를 덮고, 탭하면 닫혀요. */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-out ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* 카드: justify-end로 바닥에 붙고, translate-y로 슬라이드업/다운해요. */}
      <div
        className={`relative w-full max-h-[90%] flex flex-col bg-surface rounded-t-[28px] shadow-2xl transition-transform duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 핸들: 탭하면 닫혀요. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="w-full flex justify-center pt-3 pb-2 shrink-0"
        >
          <span className="w-10 h-1.5 rounded-full bg-neutral-300" />
        </button>

        {/* 제목 */}
        {title != null && (
          <h2
            id={titleIdRef.current}
            className="px-6 pb-4 text-lg font-bold text-neutral-900 shrink-0"
          >
            {title}
          </h2>
        )}

        {/* 본문(스크롤). 바닥은 카드가 화면 바닥까지 이어지고, 버튼의 safe-area는 SheetFooter가 처리해요. */}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
