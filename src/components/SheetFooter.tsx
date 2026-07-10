import { ReactNode } from 'react';
import { adaptive } from '@toss/tds-colors';

interface SheetFooterProps {
  /** 하단에 고정할 액션 버튼(들)이에요. */
  children: ReactNode;
}

// 커스텀 BottomSheet(바닥 연결 슬라이드업) 안에서 액션 버튼을 시트 하단에 고정해요.
// 시트 카드 자체는 화면 물리 바닥까지 이어지므로, 이 컴포넌트는 버튼을 sticky로 하단에 붙이고
// safe-area(홈 인디케이터)만큼 아래 여백을 확보해 버튼을 안전영역 위로 올려요. 위쪽 그라데이션으로
// 스크롤 콘텐츠가 바 안으로 스며들어 네이티브 시트처럼 보여요.
export default function SheetFooter({ children }: SheetFooterProps) {
  return (
    <div style={{ position: 'sticky', bottom: 0, zIndex: 1, marginTop: 12 }}>
      {/* 스크롤 콘텐츠 → CTA 바로 이어지는 페이드 (native BottomSheet.Gradient과 동일한 역할) */}
      <div
        aria-hidden
        style={{
          height: 20,
          marginBottom: -1,
          background: `linear-gradient(to bottom, transparent, ${adaptive.background})`,
        }}
      />
      <div
        style={{
          background: adaptive.background,
          padding: '0 24px',
          // TDS BottomCTA와 동일한 safe-area 공식 — 웹뷰가 주는 --toss-safe-area-bottom을 우선 반영해요.
          paddingBottom:
            'max(var(--toss-safe-area-bottom, 0px), env(safe-area-inset-bottom, 0px), 16px)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
