export interface BingoCell {
  id: number;
  title: string;
  icon: string; // 이모지 (예: '🍜') — 빈 칸 힌트로 표시돼요.
  completed: boolean;
  photoUrl?: string;
  dateCompleted?: string;
  // 공유(함께) 보드에서 이 칸을 채운 사람. 솔로 보드에선 항상 undefined예요.
  completedBy?: { uid: string; nickname: string };
}

// 새 보드를 만들 때 고르는 여름 테마. 공식 챌린지 가이드(여행·피서·미식·건강)에 매핑돼요.
export interface BoardTemplate {
  id: string;
  label: string; // 보드 기본 제목이자 템플릿 이름
  emoji: string; // 보드 대표 이모지
  eyebrow: string; // 보드 상세 상단 라벨 (예: '여름 미식 챌린지')
  description: string; // 템플릿 선택 화면에 보여줄 짧은 설명
  cells: { title: string; icon: string }[]; // 9칸(제목 + 이모지)
}

// 새 보드 생성 요청 — 템플릿 기반이거나, 사용자가 미션을 직접 입력한 커스텀이에요.
// shared=true면 혼자가 아니라 '함께(실시간 공동 빙고판)' 룸으로 만들고, nickname을 함께 실어요.
export type NewBoardDraft =
  | {
      type: 'template';
      templateId: string;
      name: string;
      shared?: boolean;
      nickname?: string;
    }
  | {
      type: 'custom';
      name: string;
      missions: string[];
      shared?: boolean;
      nickname?: string;
    };

export interface BingoBoard {
  id: string;
  title: string;
  emoji: string;
  cells: BingoCell[];
  eyebrow?: string; // 보드 상세 상단 라벨 (예: '여름 미식 챌린지'). 템플릿에서 채워져요.
  templateId?: string; // 템플릿에서 만든 보드의 원본 템플릿 id. '함께 시작' 초대 링크를 온전히 재현해요.
  roomId?: string; // 공유(함께) 보드면 Supabase 룸 id. 있으면 실시간 공동 편집 보드예요.
  shared?: boolean; // 공유 보드 여부(roomId와 함께 세팅돼요).
  // 함께 보드의 마지막 동기화 진행도(전체 칸 중 누구든 채운 칸). 대시보드 카드 라벨(N/9·%)에 써요.
  // cells는 갤러리용 '내 칸'만 담아 그대로 세면 항상 N/N·100%라, 진행도만 따로 스냅샷해요.
  sharedProgress?: { completed: number; total: number };
}

export type ViewState =
  | 'dashboard'
  | 'board'
  | 'gallery'
  | 'complete'
  | 'achievement';

// 이번 인증이 만들어낸 성취 등급 — 미션 완료 화면의 축하 강도를 결정해요.
// 'cell' 한 칸 인증, 'bingo' 새 빙고 줄 완성, 'board' 보드 전면 완성.
export type CompletionTier = 'cell' | 'bingo' | 'board';

// Tabs reachable from the bottom navigation bar.
export type NavKey = 'dashboard' | 'board' | 'gallery';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  tagline: string; // short flavor text shown in the acquisition modal
}
