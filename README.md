# 찍고빙고 (snap-bingo)

친구들과 **함께 여름 사진 미션을 채워가는 빙고 챌린지** 미니앱이에요. 여름 테마 빙고판을 열고 친구를 초대하면 **한 판을 실시간으로 같이 완성**해요. 빙수 먹기, 노을 사진 찍기, 수박 인증하기, 여름 하늘 담기, 물놀이 순간 남기기처럼 여름에 어울리는 미션을 각자 **사진으로 인증**하면 그 칸이 채워지고, 가로·세로·대각선 빙고를 다 같이 만들어가요. 완성한 빙고판은 공유 카드로 남겨 친구들과 서로의 여름 순간을 비교하며 추억을 나눠요. 혼자서도 나만의 빙고판을 즐길 수 있는 [앱인토스](https://apps-in-toss.toss.im/) 미니앱입니다.

> 앱인토스 "미니앱과 함께하는 여름" 챌린지 출품작 (주제: 친구·가족과 함께하는 여름 활동).

## 주요 기능

- **빙고 보드** — 9칸(3×3) 여름 미션 보드. 진행도 바와 완료 개수를 실시간 표시해요.
- **테마 템플릿 & 직접 만들기** — 새 보드를 만들 때 여름 테마(🏖️ 여행·🌊 피서·🍧 미식·💧 건강, 챌린지 공식 주제 가이드에 매핑)를 골라 그 9칸이 시드돼요 (`src/data.ts`의 `BOARD_TEMPLATES`). 또는 **‘직접 만들기’** 로 미션 9칸을 직접 입력해 커스텀 보드를 만들 수 있어요(빈 칸은 ‘미션 N’으로 채움, 아이콘 📸). 칸 아이콘은 이모지예요.
- **함께(실시간 공동 빙고판)** — 보드를 ‘함께’로 만들면 Supabase 룸이 생기고, 보드 상세의 "이 챌린지에 친구 초대하기"로 `intoss://snap-bingo?room=<룸 id>` 초대 링크를 공유해요 (`src/lib/share.ts`의 `shareRoomInvite`). 링크로 들어온 친구는 같은 룸에 참가해 **한 판을 실시간으로 같이** 채우고(칸 선착순 인증 + 칸별 인증자 표시), 재방문 시 마지막 방문 후 친구가 채운 칸을 ‘새 소식’으로 알려줘요 (`src/hooks/useSharedBoard.ts`, RLS로 보호되는 anon 접근).
- **같은 챌린지 각자 시작 (솔로 복제 초대)** — 솔로 보드는 그 설정(테마 또는 미션)을 **딥링크에 실어** 공유하면 (`src/lib/invite.ts`의 `encodeInviteParams` → `src/lib/share.ts`의 `shareBoardInvite`), 받은 친구가 진입 시 초대 시트에서 **자기 폰에 같은 보드를 생성**해(`InviteSheet` → `createBoardFromTemplate`/`createCustomBoard`) 각자 채운 뒤 완성 카드로 비교해요. 초대 파라미터는 프레임워크가 URL을 정리하기 전에 `index.html` 인라인 스크립트가 `window.__ENTRY_SEARCH`로 캡처해요.
- **사진 인증** — 빈 칸을 눌러 기기 사진을 업로드해 미션을 인증해요. 업로드 전 이미지를 리사이즈·압축해요 (`src/lib/image.ts`, 이미지 파일만 허용).
- **미션 완료 축하** — 인증 시 컨페티 애니메이션으로 축하해요. 이번 인증이 **새 빙고 줄**이나 **보드 전면 완성**을 만들면 그 순간을 등급별로 더 크게 축하하고(제목·트로피 아이콘·금빛 컨페티 강화), 바로 기념 카드(인증 현황)로 가는 버튼을 보여줘요 (`App.tsx`의 `handleCompleteCell` 등급 판정 → `MissionCompleteView`의 `tier`).
- **빙고 달성 카드** — 한 줄/보드를 완성하면 내 실제 빙고판으로 공유용 기념 카드를 만들어요 (`BingoAchievementView`). 카드는 토스 공유 시트로 친구에게 공유해요.
- **뱃지** — 누적 인증·빙고·보드 완성 진행도에서 파생되는 6종 여름 뱃지 (`src/lib/badges.ts`).
- **갤러리** — 전 보드에서 인증한 사진을 보드별 필터로 모아보는 아카이브.
- **공유** — 토스 공유 시트로 친구 초대 (`getTossShareLink` + `share`, 브라우저에서는 안내 토스트로 폴백).
- **로컬 지속** — 토스 네이티브 `Storage`에 저장하고, 순수 브라우저에서는 `localStorage`로 폴백 (`src/lib/storage.ts`).

## 화면 흐름

`App.tsx`의 상태 머신(`ViewState`)으로 전환돼요.

```text
홈(대시보드) ─ 보드 선택 ▶ 보드 상세(빙고판) ─ 빈 칸 탭 ▶ 사진 인증(시트) ▶ 미션 완료(축하)
    │                          │
    │                          └─ "인증 현황" ▶ 빙고 달성 카드
    └─ 하단 탭 ─ 홈 / 갤러리   (보드 상세는 탭이 아니라 홈 목록에서 파고드는 드릴다운)
```

## 기술 스택

- **React 18** + **TypeScript 5.7**
- **Tailwind CSS v4** (`@tailwindcss/vite`) — 화면 레이아웃/스타일 (Stitch 디자인 기반)
- **토스 디자인 시스템** — `@toss/tds-mobile`(Button·Badge·TextField·ProgressBar·Post·오버레이 훅), `@toss/tds-mobile-ait`(Provider), `@toss/tds-colors`(adaptive 토큰)
- **lucide-react** — 아이콘
- **@apps-in-toss/web-framework** (Granite) — 미니앱 셸·공유·스토리지 브리지
- **Vite 6** — 번들러

## 프로젝트 구조

```text
src/
├─ App.tsx              # 상태 머신 + 보드 상태/지속성
├─ main.tsx             # TDSMobileAITProvider + PortalProvider 루트
├─ data.ts              # 앱 아이콘/히어로 슬라이드/빈 시드(INITIAL_BOARDS=[])/테마 템플릿(BOARD_TEMPLATES)/뱃지 정의
├─ types.ts             # BingoBoard, BingoCell, Badge, ViewState 등
├─ index.css            # Tailwind + TDS adaptive 토큰 매핑
├─ components/          # 화면·모달 (Dashboard/BoardDetail/Upload/MissionComplete/Achievement/Gallery/...)
└─ lib/
   ├─ badges.ts         # 진행도 → 획득 뱃지 파생
   ├─ image.ts          # 업로드 사진 리사이즈/JPEG 재인코딩
   ├─ invite.ts         # '함께 시작' 딥링크 초대 인코딩/파싱(encodeInviteParams/parseInvite)
   ├─ share.ts          # 토스 공유 시트 + OG 이미지 + 보드 초대 공유(shareBoardInvite)
   ├─ storage.ts        # Toss Storage ↔ localStorage 폴백
   └─ devBridgeShim.ts  # dev 브라우저 프리뷰용 safe-area 폴백(앱에는 미동작)
```

## 시작하기

```bash
npm install
npm run dev        # granite dev → http://localhost:5173
```

타입 체크 / 빌드:

```bash
npx tsc --noEmit -p tsconfig.app.json
npm run build      # ait build → dist/
```

> 개발 서버가 스타일 미적용 상태로 뜨면 스테일 상태예요. 프로세스 종료 후 `rm -rf node_modules/.vite` 하고 다시 `npm run dev` 하세요.
>
> 브라우저 프리뷰는 `src/lib/devBridgeShim.ts`가 네이티브 브리지 부재 시 safe-area 값(0 인셋)을 폴백해 정상 렌더돼요 — 과거 `getSafeAreaInsets is not a constant handler`로 프리뷰가 프리즈되던 문제를 해소한 거예요. 이 shim은 **dev + 순수 브라우저에서만** 동작하고(`ReactNativeWebView` 부재로 감지), 실제 토스 앱/샌드박스에는 영향이 없어요.

## 배포하기

**실제 미니앱 출시(앱인토스)** — 이게 진짜 배포예요. `ait build`가 `dist/`를 Toss 콘솔용 `.ait` 번들로 패키징하고, `ait deploy`가 콘솔에 올려요. 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키에서 발급받아요.

```bash
npm run build      # ait build → dist/ + snap-bingo.ait
npm run deploy     # ait deploy → 콘솔 업로드
```

**Vercel(선택) = 브라우저용 웹 데모/공개 프리뷰**예요. AIT 출시와는 별개예요. Vercel에서는 `ait build`(콘솔용 `.ait` 패키징)를 돌리면 안 되고 — 헤드리스 환경에서 깨져요 — `vercel.json`이 `vite build`(정적 사이트)만 돌리도록 고정해 뒀어요(빌드 커맨드 `vite build`, 출력 `dist`). 대시보드 Build Command는 비워 두거나 `vite build`로 맞추세요.

> 웹 데모에선 토스 브리지 기능이 **브라우저로 폴백**돼요: 공유(`getTossShareLink`/`share`)→안내 토스트, 네이티브 `Storage`→`localStorage`(`src/lib/devBridgeShim.ts`). 초대 딥링크 `intoss://snap-bingo`도 데스크톱 브라우저에선 안 열려요(토스 앱 전용 스킴). 즉 Vercel은 UI 확인·공유 링크 미리보기 용도이고, 브리지 실동작은 콘솔 등록 후 샌드박스/실기기에서 확인해요.

## 알려진 제약 (출시 전 정리 필요)

- **제출 에셋** — `granite.config.ts`의 `brand.icon`은 임시 플레이스홀더예요. 콘솔에 600×600 로고를 업로드하고 발급 URL로 교체해야 해요. 썸네일/스크린샷도 필요해요.
- **공유 OG 이미지** — 초대/공유 링크 프리뷰 카드는 `public/og-cover.png`(1200×600, 2:1 규격)를 써요. 토스 링크 프리뷰 크롤러는 **공개 https 절대 URL**만 가져가요. 기본값은 저장소의 커버를 **jsDelivr(GitHub CDN)** 로 서빙하는 공개 URL(`src/lib/share.ts`의 `DEFAULT_OG_IMAGE_URL`)이라, **앱 출시(tossmini 도메인 라이브) 전에도** 프리뷰가 떠요. ⚠️ 이 URL은 **저장소가 public**이어야 열려요(private면 404 → 프리뷰 안 뜸). 이미지를 다른 CDN/에셋 repo로 옮기면 `.env`의 `VITE_OG_IMAGE_URL`로 코드 수정 없이 덮어쓰세요(`.env.example` 참고). 소스: `src/lib/share.ts`.
- **라이트 모드 고정** — `TDSMobileAITProvider`가 `colorPreference:"light"`를 고정해 다크 모드는 현재 미지원이에요.
- **인증 방식** — 사진 '인증'은 실제 콘텐츠 검증이 아니라, 업로드한 이미지를 그 칸의 인증 사진으로 등록하는 방식이에요(부적절 이미지 필터링 없음).
- **실기기 검증 잔여** — 초대 링크 공유 시 프리뷰 카드에 앱 아이콘이 뜨는 것은 **실기기에서 확인 완료**(OG = jsDelivr 공개 URL). 남은 것: 공유 딥링크 탭이 실제 앱을 여는지, 네이티브 `Storage` read/write가 콘솔 등록 후 샌드박스/테스트앱에서 정상인지.

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
