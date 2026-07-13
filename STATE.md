# STATE — snap-bingo (찍고빙고)

최종 업데이트: 2026-07-08 (radius·프리즈shim·2탭화·이미지압축·진행바정직화 + **A1 목업제거 완료** + **#2 빙고 카드 이미지 저장 실구현**: html-to-image → saveBase64Data + **여름 테마 템플릿 4종 도입**: 새 보드 생성 시 여행·피서·미식·건강 중 선택, 칸 아이콘 lucide→이모지(TDS 1급 에셋) 전환, STORAGE_KEY v2→v3 + **챌린지 프레이밍**: hero=순수 무드배너로, 생성 버튼을 "진행 중인 챌린지" 헤더 `+ 새 챌린지` pill+빈상태 primary 버튼으로 재배치, 보드상세 eyebrow 라벨 버그(항상 "라이프스타일 챌린지") 수정 + **커스텀 보드('직접 만들기')** + **남은 시간(가짜 timeLeft) 제거**: 정적 '30일 00:00' 껍데기라 BoardDetail 블록·App 생성부·BingoBoard 타입에서 전부 삭제 + **성취 순간 훅**: 인증 시 새 빙고 줄/보드 완성을 감지해 MissionComplete를 등급별(cell/bingo/board)로 축하 + 기념 카드 바로가기 + **카드 이미지 저장 제거**: 인증 현황 "이미지로 저장하기" 버튼·`saveCard.ts`·딸린 죽은 코드 삭제(#2 롤백), 카드 액션은 "친구에게 공유하기"만 남김 + **함께 채우기 방향 전환**: 한-기기 참여자 태그(members/completedBy)는 "억지"라 롤백 → **같은 챌린지 함께 시작(딥링크 초대)**로 재구현: 보드 설정을 딥링크에 실어 공유→수신자 폰에 같은 보드 생성, 각자 채우고 카드 비교)
GSD 관리 프로젝트가 아님 — `.planning/` 디렉터리도, 여기 초기화된 git 저장소도 없음. 이 파일은 GSD STATE.md 스키마가 아니라 세션 간 인수인계용 스냅샷임.

## 이 프로젝트가 무엇인지

**앱인토스 바이브코딩 챌린지**용 앱인토스(Apps in Toss) 미니앱 (첫 번들 제출 마감 **2026-07-29**, 심사 8/1~8/26, 심사 기준은 지표 + 주제 적합성 + UX. 등록에 TDS가 *필수는 아님*. "단순 리워드성" 앱과 주제 이탈 앱은 제외됨).

주제: **"미니앱과 함께하는 여름"** — 세부 주제: 여름 여행/휴가, 무더위 극복, 건강·수분관리, **친구·가족과 함께하는 여름 활동** (이 앱에 가장 잘 맞음). 여름 감성을 담기만 하면 형식은 자유로움.

앱 콘셉트: 사용자가 여름 사진 미션(빙수, 바다, 노을, 수박, 밤산책...)으로 이루어진 3×3 빙고판을 채워요. 칸마다 사진을 업로드/인증하고, 가로·세로·대각선 한 줄을 완성하면 "빙고", 포인트/뱃지를 모으고, 친구와 공유하고, 완료한 미션들의 사진 갤러리를 둘러봐요.

출발점: `../snap-bingo-orig` (`../stitch_ui/` 디자인을 구현한 완성된 Google AI Studio Tailwind/React19 프로토타입)를 `@apps-in-toss/web-framework` + `@toss/tds-mobile` 셸로 포팅함. 전면 TDS 재작성보다 원본 Stitch 목업에 대한 디자인 충실도를 우선함.

## 현재까지의 진행 상황 (시간순, 가장 최근 세션이 위)

### 이번 세션 (2026-07-13): **로딩 UX 정리(TDS Loader/Skeleton) + 화면 전환 좌우 슬라이드**

- **로딩 회전 텍스트 버그 (커밋 `7d99243`)**: `animate-spin`이 **텍스트 노드**에 걸려 "로딩 중..."·"함께 보드 여는 중..." **글자 전체가 빙글빙글 도는** 문제. **수정**: 앱 최초 로드 = **TDS `Loader`**(size=medium, label), 함께 보드 열기 = **`BoardDetailSkeleton`(신규, TDS `Skeleton`)** — 뒤로가기 버튼을 남겨 느린/삭제된 방에서 안 갇힘. TDS Skeleton은 리스트/카드 전용이라 3×3 그리드 프리미티브가 없어 '제목·부제목·카드' 콘텐츠 로딩 골격으로 표현(트레이드오프: 실물 그리드와 약간의 레이아웃 시프트 가능 — 보드 모양 그대로 원하면 Tailwind 3×3 스켈레톤이 대안).
- **화면 전환 좌우 슬라이드 (커밋 `9853141`)**: 요청 흐름 — "인증현황 등장 애니를 챌린지에도" → 이후 "넷플릭스 탭처럼 좌우로". **가벼운 방식(의존성 X, CSS)** 선택(풀 코디네이션은 framer-motion 필요). **규칙**: 보드 열기 = main이 **오른쪽서** `animate-slide-in-right`, 뒤로가기(홈) = 대시보드 main이 **왼쪽서** `animate-slide-in-left`(보드=앞으로/오른쪽, 홈=뒤로/왼쪽 — nav-direction state 없이 화면별 고정 클래스). **설계(충돌 회피)**: 슬라이드는 각 화면 `<main>`에만 적용 → **fixed 카메라 FAB·sticky 헤더의 조상에 transform이 안 걸려** 위치 안 깨짐 / `backwards` fill-mode로 종료 후 transform 잔존 없음(containing-block 안전) / `overflow-x: clip`으로 슬라이드 중 가로 오버플로우만 클립(스크롤 컨테이너 미생성 → sticky/fixed 무영향) / `prefers-reduced-motion` 존중 / **인증현황은 미변경**(자기 fade 유지). 들어오는 화면만 슬라이드(나가는 화면은 안 밀림 — 그건 framer-motion 필요). 슬라이드 폭 48px는 조절 가능.
- **라이브 검증(browse)**: 대시보드 슬라이드 중간 프레임 포착(헤더 정적·main 페이드+왼쪽 이동·좌측 오버플로우 클립) → **최종 프레임 완전 복귀**(잔여 shift 없음, 캐러셀 무결). 보드 진입 시 **FAB 우하단 정상 고정**, 모바일(390) **가로 오버플로우 0**(scrollWidth=clientWidth). tsc 통과, 변경분 eslint 0 errors. 테스트 멤버 정리 → 라이브 방 `8a025c6a` 김토스·토스김 원복, orphan 0.

### 이번 세션 (2026-07-13): **닉네임 편집 + 인증 사진 교체 + leak C 근본 해결** (완성도 ~95%→~98%)

- **요청(사용자)**: "닉네임 편집 UI 및 업로드 이미지 변경 기능, leak C 근본 해결". 세 기능을 커밋 2개로 진행(leak C는 백엔드/훅 격리, 닉네임·사진 교체는 같은 파일군을 건드리는 응집 기능이라 묶음).
- **leak C 근본 해결 (커밋 `45ee572`)**: `useSharedBoard`가 roomId만 세팅되면 무조건 `joinRoom`을 호출해, 초대 링크를 **열어 보기만 해도 멤버로 등록**되던 문제(leak C)를 없앴어요. **수정**: 훅 효과에서 `joinRoom` 제거 → '열기'는 fetch+구독만, **참가(멤버 등록)는 명시적으로만**(방 생성 시 `createRoom`이 이미 등록, 참가 시트에서 `App.handleJoinRoom`이 `joinRoom` 호출). 비멤버가 열면 RLS로 룸이 안 보여 기존 삭제/접근불가 경로로 처리. **라이브 검증(browse+curl+DB)**: 딥링크 열기만 → 참가 시트 + 멤버 **1명(방장) 유지**(silent join 없음), 명시적 참가 → 멤버 **정확히 2명**(중복/이중 참가 없음).
- **닉네임 편집 + 사진 교체 (커밋 `90484cf`)** — 둘 다 '내 것'만 편집:
  - **닉네임**: 마이그레이션 **007 `members_update_self`**(본인 member 행만 UPDATE) + `room.ts updateMyNickname`(내 `member.nickname` 갱신 + 내 `cells.completed_by_nick`도 함께 갱신 → 나간 뒤 폴백 표시까지 일관) + `useSharedBoard.updateNickname`(갱신 후 재조회). **UI**: 함께 보드에서 **내 멤버 칩(파란색+연필)**을 누르면 `NicknameEditSheet`가 열려 이 방에서 쓸 이름을 바꿔요(이 방에서만, 방·uid별 이름 유지). members UPDATE 실시간 이벤트로 다른 참가자에게도 반영.
  - **사진 교체**: `useSharedBoard.changePhoto`(내 칸 썸네일만 교체 — `uploadThumb` upsert + `setCellThumb`의 `completed_by_uid=나` 조건, 인증 등급 축하 없음). **UI** `BoardDetailView.canEditCell`: 빈 칸=새 인증, 완료 칸은 **'내 칸'만 재탭 시 '사진 바꾸기' 모드**(솔로 완료 칸은 모두 내 것), 남의 칸은 "이미 …님이 인증한 칸" 토스트. App: 함께=`handleSharedChangePhoto`, 솔로=`handleChangeCellPhoto`(로컬 갱신).
  - **라이브 검증**: 닉네임 변경 시 칩·`member.nickname`·`cells.completed_by_nick` **모두 내 행만** 갱신(방장 이름 불변). 내 완료 칸 재탭→'사진 바꾸기'→교체 후 **축하 없이 토스트 + 스토리지/thumb 갱신**. 비소유자 칸 변경은 **RLS(cells_update_owner)로 0행 차단**(curl). 테스트 데이터 정리 후 rooms=1, **orphan=0**.
- **완성도**: 함께 빙고 ~95% → **~98%**. "카드 열면 자동 참가(leak C)"·"닉네임 편집" 항목이 닫힘. 남은 건 사실상 **토스 로그인 연동(옛 방 소유 복구, anon uid 한계)** 정도.
- **선택 후속(신규 문제 아님)**: 기존 스토리지 정책 `cell_photos_update_member`는 **방의 아무 멤버나** 남의 칸 사진 **파일**을 덮어쓸 수 있음(칸 소유 DB 행은 `cells_update_owner`로 보호, 앱 UI로는 불가). `changePhoto`는 내 칸만 건드리지만, 방어 강화하려면 이 정책을 "칸 소유자만"으로 조이는 마이그레이션 008이 가능(미적용, 사용자 승인 대기).
- **tsc 통과, 변경분 eslint 0 errors**(파일 전반의 unused-directive warning 3개는 기존 항목·제 변경과 무관).

### 이번 세션 (2026-07-13): **함께 방 삭제 Edge Function 이관 + 방 삭제 실시간 안내** (완성도 ~90%→~95%)

- **배경(사용자 질문)**: "방 삭제 시 이미지는 삭제되지 않나요?" → 기존 클라이언트 `deleteRoom`은 Storage 썸네일 정리를 **베스트에포트(try/catch로 에러 무시)**로 처리해, 실패하면 방은 지워지되 이미지만 orphan으로 남고 아무도 몰랐음. Postgres 트리거로는 `protect_delete`가 막아 Storage 객체를 못 지움(Storage API로만 삭제 가능). 사용자 선택: **"확실한 방식(Edge Function) 진행 후 빙고 완성도"**.
- **Part 1 — `delete-room` Edge Function (배포·라이브검증, 커밋 `71d804b`)**: `supabase/functions/delete-room/index.ts`. JWT로 호출자 확인 → **소유권(created_by) 검증**(service_role은 RLS 우회라 이 검증이 필수) → Storage API로 `cell-photos/<roomId>/` 썸네일 전량 삭제(에러를 삼키지 않음) → `rooms` 삭제(cascade)를 **원자적**으로 처리. 사진 정리 실패 시 방도 안 지워 orphan 원천 차단. 멱등(이미 삭제된 방=성공). service_role 키는 Edge 런타임 env(`SUPABASE_SERVICE_ROLE_KEY`)에서만 읽어 레포/클라이언트 미노출. 클라이언트 `room.ts deleteRoom`은 `functions.invoke('delete-room')`로 교체(+`extractFunctionErrorMessage`로 서버 에러 메시지를 사용자에게 노출). `verify_jwt=true`. 기존 RLS 정책(005 `rooms_delete_owner`/`cell_photos_delete_owner`)은 이제 클라이언트가 안 쓰지만 방어적으로 유지. **검증(실 익명 JWT curl)**: 방 생성→멤버→칸→실제 썸네일 업로드 후 → 비방장 삭제 **403**, 방장 삭제 **200** → rooms/members/cells/storage **모두 0**.
- **Part 2 — 방 삭제 실시간 안내 (빙고 완성도, 커밋 `20752bd`)**: 방장이 방을 삭제하면 cascade DELETE의 실시간 이벤트로 참가자 재조회가 "방 없음"으로 실패했는데 지금까지 조용히 무시 → 참가자 화면에 **stale 보드**가 남았음(다음에 열 때만 사라짐). **수정**: `room.ts roomStillExists(roomId)`(재조회 실패가 삭제=`false`인지 일시적 오류=`null`인지 `.maybeSingle`로 판별) + `useSharedBoard`에 **`deleted` 상태**(실시간 재조회 실패 시 `roomStillExists`로 삭제를 확인하면 `true`; 초대 후 열기 전 이미 삭제된 경우도 처리해 무한 로딩 방지) + `App.tsx`가 `deleted`면 **"방장이 이 함께 챌린지를 삭제했어요."** 토스트 + 로컬 참조 제거 + 대시보드 복귀(+ sharedRef 동기화 이펙트에 `sharedDeleted` 가드를 추가해 삭제 후 참조를 되살리지 않게 함). **검증(browse 참가자 + curl 방장)**: 참가자B가 딥링크로 접속·구독(멤버 칩 "방장A·참가자B", 참가자에겐 나가기 버튼) → 방장 삭제 즉시 **토스트 노출 + 대시보드 복귀 + 룸 카드 제거**, DB rooms/members/cells/storage·프로젝트 전체 orphan 모두 0. tsc 통과, 변경분 eslint 0 errors(엣지 함수의 Deno 진단은 파일 특성상 무해 — 클라이언트 빌드 제외).
- **완성도 재평가**: 함께 빙고 ~90% → **~95%**. 남은 ~5%: (a) **카드 열면 자동 참가(leak C)** — 스코핑으로 완화됨, 근본 해결은 "미리보기 vs 참가" 분리 or 토스 로그인, (b) **닉네임 편집 UI** — 현재 방별 불변으로 충분, (c) **옛 방 소유 복구(anon uid 한계)** — 토스 로그인 연동 필요. **제출 관점에선 함께 기능 사실상 완성.**
- **잔여/주의**: 테스트용 익명 유저 몇 개가 `auth.users`에 남음(소유한 방 없음, **uid churn 방지 원칙상 wipe 안 함** — 지난 wipe가 leak B 발단). 프로젝트 전체 orphan 썸네일 **0** 확인(라이브 룸 8a025c6a의 사진 4장은 정상 유지).

### 이번 세션 (2026-07-13): **함께 이름(닉네임) 각자 유지** — 칸 인증자 이름을 member 행 기준으로 통일

- **문제(사용자)**: "함께하는 사용자가 각각 설정되지 않고, 초대받은 사용자가 이름을 바꾸면 (방장 이름도) 바뀐다. 각자의 이름으로 유지돼야 한다." **원인**: 닉네임 소스가 둘로 갈려 있었음 — 멤버 칩은 `members.nickname`(방·uid별, 안정적)인데, **칸 인증자 이름은 `claimCell`이 기기 전역 `getNickname()`을 매번 다시 읽어 저장**(`useSharedBoard.claim`). 전역 닉네임(`snapbingo_nickname`)은 기기당 하나뿐이라 다른 방/역할에서 이름을 바꾸면 이후 칸 인증이 그 값을 써서 방마다 이름이 흔들림.
- **수정** (`useSharedBoard.ts`): 방 안 내 이름의 단일 출처를 **그 방의 member 행(방·uid별)**으로 통일.
  - `buildBoard`: 칸 `completedBy.nickname`을 `members`(uid→nickname) 맵에서 조회해 표시(멤버가 나가 members에 없으면 저장된 `completed_by_nick`로 폴백). → 칸 칩이 항상 그 멤버의 현재 이름과 일치, 전역 닉네임 변경에 안 흔들림.
  - `claim`: 인증 시 `completed_by_nick`을 전역 `getNickname()` 대신 **내 member 행 닉네임**(`state.members.find(uid===myUid)`)으로 저장(폴백 전역→FALLBACK). deps에 state·myUid 추가.
  - 전역 닉네임은 이제 새 참가/생성 시 pre-fill 기본값으로만 쓰임(기존 방 표시엔 영향 없음).
- **브라우저 실검증**: 방 생성(방장 uid f397ff41, member="방장")→칸0을 `completed_by_nick='STALE-바뀐이름'`(member와 다르게)로 심고 썸네일 부여→리로드·재오픈 시 **칸 칩이 "방장" 표시(STALE 0개), 스크린샷 확인**. tsc·eslint 0.
- **잔여**: 닉네임 "편집" UI는 미구현(현재 member.nickname은 최초 참가 시 1회 설정=ignoreDuplicates, 이후 불변 → 각자 안정 유지엔 충분). 이름을 나중에 바꾸는 기능이 필요하면 members UPDATE(본인 행) 정책+UI 별도.

### 이번 세션 (2026-07-13): **참가자 진짜 나가기(members DELETE)** + 라이브 데이터 정리(깨끗한 테스트 상태) + push

- **참가자 진짜 나가기 (마이그레이션 006, 라이브 적용·검증)**: 지금까지 참가자 "나가기"는 로컬 sharedRefs만 제거하고 **members 행은 DB에 남아** 실제론 계속 소속(멤버 수·칩에 잡힘)이었음. **수정**: `members_delete_self` DELETE 정책(`uid = auth.uid()` 본인 행만) + `room.ts leaveRoom(roomId)`(본인 member 행 삭제) + `App.tsx handleLeaveSharedBoard`를 async로 바꿔 **leaveRoom 먼저 → 성공 시 로컬 ref 제거·대시보드 복귀, 실패 시 토스트 후 유지**(DB/로컬 일관성). 참가자가 이미 인증한 칸(cells)은 유지(기여 기록). 방장은 이 경로 대신 deleteRoom(방 전체). **RLS 라이브 검증(self-cleaning)**: B가 A의 멤버 행 삭제=0(차단), B가 본인 행 삭제=1(허용). tsc 통과, 변경분 eslint 0 에러.
- **라이브 데이터 정리(깨끗한 테스트 상태)**: 사용자 요청으로 `rooms` 전체 삭제(members·cells cascade) → **rooms/members/cells 모두 0**. **익명 유저(auth.users) 2명은 보존**(anon wipe가 uid churn=leak B의 발단이라 의도적으로 안 지움 → uid 안정 유지). **잔여: cell-photos orphan 썸네일 3개**(bd5a31c5/1·3.jpg, d3ec1fe0/0.jpg) — 방 삭제 후 참조 끊겨 앱엔 안 보이나, SQL 직접삭제는 storage protect_delete 트리거가 막고 임시 permissive DELETE 정책은 auto-mode 분류기가 차단(정상). **정리하려면 Supabase 대시보드 Storage에서 삭제**(또는 사용자 승인 하 임시정책). 사용자 브라우저의 옛 sharedRefs는 리로드 시 스코핑 fix가 자동 정리.
- **push**: 이번 세션 커밋들 `snap-bingo/main`에 push 완료.

### 이번 세션 (2026-07-13): **sharedRefs 누수 A·B 정리 (로드 시 DB 스코핑)** — "내가 만든 방인데 '나가기'가 뜬다"의 원인 해소

- **문제 확정(사용자)**: "본인이 만든 방인데 '나가기'가 뜨고, 나가면 사라지고 삭제도 안 된다." 브라우저 실검증으로 **방장 삭제 코드는 정상**(아래 참조)임을 확인 → 원인은 **익명 uid 불일치(leak B)**. `isOwner`도 RLS 삭제도 `created_by=현재 uid`라, uid가 바뀌면(anon wipe·JWT 만료 재발급) 자기 방도 참가자로 오인돼 "나가기"가 뜸. + sharedRefs가 기기전역이라 예전 uid/삭제된 방이 계속 보임(leak A·B). **사용자 선택: "leak B 정리 + uid churn 방지"**.
- **수정(커밋 예정)**: **로드 시 DB 스코핑**으로 A·B 동시 해결. RLS `rooms_select_member_or_creator`가 "현재 uid가 멤버/생성자"인 방만 돌려주는 걸 이용 — 저장된 sharedRefs의 roomId들을 DB로 확인해 접근 가능한 것만 남김.
  - `identity.ts getExistingUid()`: 새 익명 가입을 유발하지 않고 **기존 세션 uid만** 반환(없으면 null). 함께 안 쓴 사용자에 불필요한 가입/네트워크 방지.
  - `room.ts fetchAccessibleRoomIds(ids)`: `rooms.select('id').in('id', ids)` — RLS가 접근불가·삭제 방을 자동 제외.
  - `lib/sharedRefs.ts scopeSharedRefs(refs)` (신규): 미설정/빈목록→그대로. 세션 없음→**빈 목록으로 숨김**(저장소는 유지, 세션 복귀 시 재검증). 세션 있음→DB 검증해 접근가능만 유지. 검증 실패(네트워크)→기존 유지(일시 오류로 카드 안 사라지게). changed면 호출부가 persist.
  - `App.tsx` 로드 이펙트: savedRefs 파싱 후 `scopeSharedRefs` 적용, 정리되면 다시 저장.
- **브라우저 실검증(4케이스)**: 새 익명 uid(c5da5413)로 localStorage에 [접근가능 방R + 남의방(bd5a31c5, 미멤버) + 좀비방(없는 id)] 주입 후 리로드 → **R만 남고 남의방·좀비방 제거+persist**, 대시보드도 R만. 세션 제거 후 리로드 → **카드 숨김+저장소 유지**. tsc 통과, 변경분 eslint 0 에러. 테스트 방R·browse 잔여 정리, 라이브 방 4개 무손상.
- **주의/잔여**: (a) **이미 uid가 바뀐 옛날 방은 방장 복구 불가** — 스코핑으로 목록에서 사라질 뿐, 방장으로서 삭제는 못 함(RLS created_by=uid). 사용자 동의한 트레이드오프. 완전 해결은 **로컬 소유토큰+삭제RPC** 또는 **토스 로그인**(별도). (b) **uid churn 방지 = anon 유저 wipe 하지 말 것**(코드 아닌 운영 수칙 — 지난 wipe가 이 문제의 발단). (c) leak C(카드 열면 무조건 자동 참가, useSharedBoard.ts:118)는 이번 범위 밖 — 단 스코핑으로 대시보드에 남의 방이 안 뜨니 실질 노출은 줄어듦(직접 초대링크로만 도달).

### 이번 세션 (2026-07-13): **함께 보드 방장 삭제(진짜 삭제) 구현** — 방장=삭제 / 참가자=나가기 비대칭

- **문제(사용자 지적)**: 함께 보드는 방장·참가자 구분 없이 모두 "나가기"만 있고(로컬 refs만 제거, DB 방은 영구 잔존), **실제 삭제 수단이 아예 없었음**. 방을 만든 사람이 자기 챌린지를 정리 못 함. → 사용자 확인: **"방장=진짜삭제(DB 전체) / 참가자=나가기"**(권장안) 선택.
- **마이그레이션 005 (라이브 적용·검증 완료, `supabase/migrations/005_room_delete_owner.sql`)**: `rooms_delete_owner` DELETE 정책(`created_by = auth.uid()`) + `private.is_room_owner(uuid)` SECURITY DEFINER 헬퍼(private 스키마, revoke from public — is_room_member와 동일 하드닝) + `cell_photos_delete_owner` storage DELETE 정책(방장이 자기 방 폴더 썸네일 삭제). **members/cells는 rooms FK `on delete cascade`라 방 삭제 시 자동 정리**, Storage만 cascade 안 돼 앱에서 "썸네일 remove → 방 delete" 순서로 처리. 정책 3객체 생성 확인, 보안 어드바이저 **새 경고 없음**(뜨는 `auth_allow_anonymous_sign_ins`는 익명인증 설계상 기존 경고, 0028/0029 RPC 린트는 private 스키마라 미발생).
- **데이터 계층**: `room.ts deleteRoom(roomId)` — (1) `cell-photos/<roomId>/` 나열 후 remove(베스트에포트, 실패해도 진행), (2) `rooms delete`(cascade). `useSharedBoard.ts`에 **`isOwner`**(`myUid === room.created_by`) 노출.
- **UI**: `App.tsx handleDeleteSharedBoard`(deleteRoom→로컬 ref 제거·sharedRoomId=null·대시보드 복귀, 실패 시 토스트), shared BoardDetailView에 `isOwner`+`onDeleteSharedBoard` 전달. `BoardDetailView` 하단 섹션 3분기: **함께+방장 → "이 함께 챌린지 삭제하기"(rose, 확인 다이얼로그 "모든 참가자에게서 …사라지고 되돌릴 수 없어요")**, 함께+참가자 → "나가기"(기존), 솔로 → "삭제하기"(기존). `tsc` 통과, 변경분 eslint 0 에러.
- **주의/잔여**: (a) **참가자의 "진짜 룸 나가기"(members DELETE=본인 행 제거)는 여전히 미구현** — 참가자 나가기는 아직 로컬 refs만 제거(members 행 잔존). (b) **방장 삭제 시 다른 접속 참가자 화면**: 룸 삭제가 cells/members에 cascade DELETE를 일으켜 realtime DELETE 이벤트 발생 → 그들의 `fetchRoomState`가 방 없음으로 조용히 실패(에러 무시) → 화면엔 stale 보드가 남음(다음 열기 때 사라짐). 실시간 "삭제됨" 안내는 미구현. (c) **RLS + UI 왕복 모두 라이브 검증됨**: (RLS) 임시 방 self-cleaning으로 비방장 삭제=0(차단)·방장 삭제=1(허용). (UI) 브라우저에서 새 익명 uid로 함께 방 생성→방장 화면 하단 "이 함께 챌린지 삭제하기" 노출(스크린샷)→확인 다이얼로그→삭제→대시보드 복귀, 콘솔 에러 0, DB 방 4개로 원복(cascade 정리) 확인. **결론: 방장 삭제 기능은 정상 동작.**

- **⭐ 다음 세션 인계 — "방장인데 '나가기'가 뜬다"의 정체 = uid 불일치(leak B)**: 사용자 지적 "방장이 나가기 후 방장이 만든 챌린지가 안 보인다". **코드는 정상**(위 UI 왕복 검증). `isOwner = 현재 uid === room.created_by`인데, **익명 uid가 바뀌면**(anon wipe·JWT 만료·재발급; STATE 기록된 실제 발생) 자기가 만든 방도 방장으로 인식 못 해 **"나가기"가 뜨고**(참가자 취급), RLS도 `created_by=auth.uid()`라 실제 삭제도 막혀 **관리 불가 좀비 방**이 됨. "나가기" 후엔 로컬 ref만 제거돼 대시보드에서 사라짐(="안 보이는데요"). 라이브 방 소유자: bd5a31c5=김토스(8819063d) 생성+토스트 참가 / 여름여행·물놀이·건강 3방=토스트(d56c2221) 생성. **즉 사용자가 참가만 한 방(bd5a31c5)이면 "나가기"가 정상이고, 자기가 만든 방인데 "나가기"면 uid 변경**. → **사용자 확인: "직접 만든 방인데 나가기가 뜬다" = uid 변경 확정. leak A·B 정리(로드 시 DB 스코핑)로 대응함(위 최상단 세션 참조).** 잔여: uid가 이미 바뀐 옛날 방의 방장 복구는 로컬 소유토큰+삭제RPC 또는 토스 로그인 필요(미구현).

### 이번 세션 (2026-07-13): 썸네일 업로드(400) 근절 + 함께 실앱 검증(크로스유저 참가 확인) + 함께 나가기 + **⭐ sharedRefs 누수 3종 진단(미수정, 다음 세션 인계)**

- **썸네일 업로드 400 근절 (마이그레이션 004, 라이브 적용·커밋)**: 칸 인증 후 `POST /storage/v1/object/cell-photos/<room>/<cell>.jpg 400`(본문 403 `new row violates RLS`). 근인: 클라 `.upload({upsert:true})`의 storage-api upsert 경로가 **대상 행에 SELECT 정책을 적용**하는데 `cell-photos`엔 INSERT/UPDATE만 있고 **SELECT 정책 부재** → RLS 거부(003과 동일한 "PostgREST가 막 insert된 행에 SELECT 적용" 부류). **수정**: `cell_photos_select_member` SELECT 정책 추가(bucket=cell-photos & 폴더[room]의 멤버만). public 버킷이라 이미지는 이미 public URL로 열람 가능 → 추가 노출 없음. 실 멤버 JWT로 upsert=true 업로드 400→200 검증. `supabase/migrations/004_cell_photos_select_member.sql`.
- **함께 실앱 검증(크로스유저 참가 확인)**: 라이브 DB에서 방 `bd5a31c5`(물놀이·피서 빙고)에 **오늘 01:19 새 익명 유저 "토스트"(d56c2221)가 실제 참가** → 003 참가 fix가 실서비스에서 크로스유저로 동작 확인(멤버 2: 김토스[8819063d]+토스트). 칸 1·3 썸네일(1.jpg/3.jpg) 정상 저장·public URL 로드 OK.
- **함께 나가기 (커밋 "feat: leave shared board", push됨)**: 함께 보드엔 삭제 버튼이 없어 막다른 길이던 것 해소. `BoardDetailView`에 `onLeaveBoard?` + `handleLeave`(useDialog 확인 다이얼로그) 추가, 삭제 섹션을 shared/solo 분기(함께="이 함께 보드에서 나가기" neutral-500, 솔로="삭제하기" rose-500). `App.tsx handleLeaveSharedBoard`: sharedRefs에서 해당 roomId 제거·persist·sharedRoomId=null·대시보드 복귀. **주의: 방/멤버십은 안 건드리고 로컬 카드만 제거**(진짜 룸 나가기=members DELETE 정책 필요, 미구현).
- **⭐ 다음 세션 인계 — sharedRefs 누수 3종 진단(코드 검증 완료, 미수정)**: 사용자 지적 "초대된 roomid로 한 번 초대되면 새 챌린지 시 함께 보드판이 자동으로 뜨고, roomid가 달라도 보인다". **검증 결론: '새 챌린지가 함께 자동 생성'은 오해**(토글 기본 `solo` → NewBoardForm.tsx:40, `BottomSheet`가 닫으면 자식 언마운트해 폼 매 오픈마다 리셋 → BottomSheet.tsx:29,88, 새 함께 보드는 항상 새 roomId → App.tsx:279–314). **화면에 보이는 함께 카드 = 지속된 `sharedRefs`**(참가/생성 시 localStorage 영구 저장 App.tsx:108–132, 대시보드 `allBoards=[...sharedRefs, ...boards]` App.tsx:419, '나가기'로만 제거 App.tsx:407–415). **그러나 "roomid가 달라도 보인다"는 실제 누수 3종**:
  - **A. 정리 로직 없음(좀비 카드)**: 삭제된/나간 방도 카드 잔존, 로드 시 유효성 검증 없이 localStorage 그대로 복원(App.tsx:94–101).
  - **B(근본원인). 기기 전역·uid 무관**: `SHARED_REFS_KEY='photo_bingo_shared_refs_v1'`에 uid 없음(App.tsx:32) → **익명 uid 변경 시**(토큰갱신·재로그인; 지난 auth 정리로 실제 발생 가능) 이전 uid의 카드가 그대로 노출 = **"참가 안 한 roomid가 보이는" 정체**.
  - **C. 카드 열면 무조건 자동 참가**: `useSharedBoard.ts:118–120`이 조건 없이 `joinRoom` 호출 → 좀비/남의 카드를 여는 순간 현 uid로 조용히 실제 참가(B와 겹치면 "달라도 보이는 방"을 여는 순간 진짜 멤버가 됨).
  - **권장 수정(우선순위)**: **① B — refs를 uid 스코프화**(키 `..._v1:<uid>` 또는 ref에 `ownerUid` 저장 후 로드 시 현 uid 것만 필터; 임팩트 최대) → **② A — 로드 시 방 존재/멤버십 검증**해 죽은 카드 정리(또는 열었을 때 404면 카드 자동 제거) → **③ C — 미멤버면 여는 즉시 참가 말고 "참가할까요?" 게이트**. **B만 고쳐도 증상 대부분 해소.** → **사용자에 수정 범위(B+A vs 3종 전부) 확인 대기 중 — 다음 세션 첫 액션**.
- **잔여(이월)**: 실기기/2창 실시간 UI 육안(003/004로 API 경로는 검증됨), 공유 보드 성취 축하 화면·presence(지금 접속중)·닉네임 편집·진짜 룸 나가기(members DELETE 정책). 스토리지 orphan repro 이미지 3개(da615e46/2·fbd99912/1·2)는 대시보드에서 삭제 가능. **주의(자초 지뢰)**: 지난 세션 anon 유저 wipe로 앱이 예기치 않게 로그아웃되면 리로드하면 됨(캐시된 JWT 만료 시 새 uid 재발급 → 방 멤버십 상실 가능, 이게 위 B 증상을 악화).

### 이번 세션 (2026-07-10): **함께(Tier 2, 실시간 공동 빙고판) 구현** — Supabase 백엔드 라이브 + 데이터 계층 + UI 배선. ⚠️ 중간에 시크릿 유출 사고(격리 완료)

**배경**: "왜 소비해야 하는가(완성도·지속성)" 논의 → 최대 공백 = "함께"(챌린지 공식 주제 정면). 3단계(Tier0 각자섬 / Tier1 공유현황 / Tier2 실시간 공동판) 중 **사용자가 Tier 2 선택**(추천 구성: 선착순 1인 소유·썸네일 공유·Supabase).

- **⚠️ 시크릿 유출 사고 & 격리**: 사용자가 `.env.example`(git 추적·**public 레포**)에 실제 Supabase 시크릿(service_role·JWT secret·DB비번 등)을 붙여넣음. **커밋·push 전 발견** → HEAD엔 0, working tree만 오염. `.env.example`을 플레이스홀더로 되돌리고, 클라이언트 안전값(URL+anon만)을 `.env`(gitignore)로 이동. `git grep`로 추적/로컬 파일에 시크릿 값 잔여 0 확인. **결론: public 노출 없음.** 사용자에게 service_role·DB비번·secret키 로테이션 권장(예방; anon/URL은 공개 안전이라 무관). **교훈: 서버 없는 Vite 앱엔 anon 키+URL만 넣는다. service_role/JWT/DB비번은 자리 없음(번들 노출).**
- **백엔드(D1) — Supabase MCP로 라이브 구축**: 사용자 제안으로 Supabase MCP OAuth 인증(첫 URL 실패→재발급 성공). 프로젝트 `snap-bingo`(`lwrkgxewyvwiumuqcoli`, ap-northeast-2, PG17)에 직접 적용. 스키마 `rooms`/`members`/`cells`(칸 PK `(room_id,cell_index)`=**선착순 1인 소유**), RLS 전 테이블(정책 public 7+storage 2), Realtime(`cells`·`members`), Storage 버킷 `cell-photos`(public)+멤버 업로드 정책. **보안 어드바이저 WARN 2건**(is_room_member가 public 스키마 SECURITY DEFINER라 RPC 직접호출 가능) → **`private` 스키마로 이동**(마이그레이션 002)해 정책 6개 재생성 → **advisor lints 0**. 레포 `supabase/migrations/001_init.sql`+`002_harden_...`에 미러링. Auth "Anonymous sign-ins"는 MCP에 auth-config 도구 없어 **사용자가 콘솔에서 활성화**(완료).
- **데이터 계층(D2 lib, 커밋 `987f494`)**: `supabase.ts`(env 없으면 null→솔로 앱 무영향), `identity.ts`(`ensureUid`=로그인 없는 익명 세션 uid + 닉네임), `invite.ts`(`parseRoomId`/`encodeRoomInviteParams`, 솔로 Invite 유니온은 불변), `room.ts`(create/join/**claimCell 선착순**(upsert ignoreDuplicates)/uploadThumb/setCellThumb/fetchRoomState/**subscribeRoom** Realtime), `useSharedBoard.ts`(룸 구독→라이브 BingoBoard 매핑+`claim`). ※ claim은 **이겼을 때만** 썸네일 업로드(남의 사진 덮어쓰기 방지).
- **UI 배선(D2 UI, 커밋 `c0214c7`)**: `NewBoardForm`(혼자/함께 SegmentedControl 토글+닉네임), `RoomJoinSheet`(신설, 룸 초대 참가), `BoardDetailView`(공유 모드: 멤버 칩·칸별 인증자 칩·룸 초대 링크·삭제 숨김), `DashboardView`(공유 카드="함께" 배지), `App.tsx`(sharedRoomId+useSharedBoard, room 초대 진입→참가 시트, 대시보드=`[...sharedRefs, ...boards]`, 보드뷰 공유 분기→claim, sharedRefs 로컬 지속). `types.ts` `BingoBoard.roomId/shared`·`BingoCell.completedBy`·`NewBoardDraft.shared/nickname`. `share.ts` `shareRoomInvite`.
- **검증**: tsc 0 · vite build 클린 · browse(:5173) 대시보드 정상 렌더·크래시 0·콘솔 클린(useToast/useSharedBoard(null)/sharedRefs 병합 안전). **미검증(잔여)**: 실제 2인 실시간 동기화(2창/2기기 필요), 생성/참가 오버레이 육안(headless 클릭=리로드 제약), share 링크는 토스 브리지 필요라 실기기/샌드박스에서 테스트. **다음 폴리시(defer)**: 공유 보드 성취 축하 화면·presence(지금 접속중)·닉네임 편집·룸 나가기.
- **(후속·핵심버그 수정, 커밋 `bf11c7b`) 참가 불가(403) 근절 → 함께 실동작 검증**: 사용자 테스트에서 `POST /rest/v1/members 403` (`42501 new row violates RLS`) — **아무도 방에 참가 못 해 함께 전 기능이 막혀 있었음**. Supabase MCP로 근인 규명: RLS 정책 자체는 정상이나 `members` **SELECT** 정책이 `USING(private.is_room_member(room_id))` 뿐이라 **최초 참가 닭-달걀** — PostgREST가 upsert(ON CONFLICT)/return=representation 경로에서 **막 insert된 행에도 SELECT 정책을 적용**하는데, SECURITY DEFINER `is_room_member`가 in-flight 멤버십 행을 못 봐 false → 42501. (rooms insert는 통과·cells는 이미 멤버라 통과 → **오직 '첫 members 행'만** 막힘.) **수정(마이그레이션 003, 라이브 적용됨)**: SELECT USING에 `OR uid = auth.uid()`(본인 멤버십은 항상 조회) 추가. **실 익명 JWT로 REST 경로 재현·검증**: A생성/참가·B크로스참가·선착순(B가 cell0 선점→A는 패배·A는 cell1 승리)·멤버/칸 조회까지 전부 200/201. 보안 advisor 신규 이슈 0(anon-access WARN는 로그인없는 설계상 정상). 테스트 데이터 전량 정리(clean slate). **클라이언트 코드 변경 없음**(정책 한 줄 수정만). **잔여**: 실기기/2창에서 실시간 UI 동기화 육안.

### 이번 세션 (2026-07-10): BottomNav 글래스모피즘 리디자인 + 초대/공유 OG 프리뷰 아이콘 안 뜸 → 설정형으로 강건화

**BottomNav 리디자인(커밋 e7a49ec, push됨)**: BottomNavSample.tsx 디자인 스타일만 실제 탭바에 적용 — 떠있는 캡슐 → 화면 하단 풀블리드 글래스 바(`bg-surface/85 backdrop-blur-xl`+상단 hairline+그라데이션 페이드), 활성=검정 라운드 pill 안 흰색 채운 아이콘, 비활성=회색 아웃라인, 아이콘 전용(aria-label), safe-area 하단 여백. 앱 adaptive 토큰으로 다크모드 대응. (BottomNavSample.tsx는 사용자 WIP라 untracked 유지 — tsc 8건 에러 유발, 사용자가 정리 예정.)

**초대/공유 OG 프리뷰 아이콘 안 뜸 → 설정형 강건화**: 사용자 "초대 링크 공유 시 앱 아이콘이 표시되지 않아요". 진단(AIT 공식 문서 교차확인): 카드 아이콘은 토스가 `getTossShareLink(url, ogImageUrl)`의 ogImageUrl을 **크롤러로 가져가** 그림 → 뜨려면 (1)공개 **https 절대 URL** (2)OG 규격 **1200×600(2:1)** (3)딥링크 콘솔 등록이 모두 필요. 기존 `share.ts`는 `${window.location.origin}/image_10.png` — **런타임 오리진 의존**이라 dev/샌드박스(http·localhost)에선 크롤러 미도달로 아예 안 뜨고, image_10.png는 **1254² 정사각(1.5MB)**이라 2:1 규격과 어긋남(전 세션에 "실기기 잔여"로 남겨둔 항목). 사용자 선택=**설정형 OG로 강건화**.
- **규격 커버 생성**: sharp/ImageMagick 없음 → **browse(헤드리스 크로미움)** 로 `/tmp/og-cover.html`(1200×600, 앱 아이콘 라운드+`찍고빙고`+`여름 사진 빙고`, 라이트 브랜드 배경) 렌더 → `screenshot --viewport public/og-cover.png`. **1200×600 PNG 276KB**(image_10 1.5MB 대비 대폭↓), 한글 두부 없이 정상 렌더 육안 확인.
- **share.ts 강건화**: `defaultOgImageUrl()` 우선순위 — (1)`import.meta.env.VITE_OG_IMAGE_URL`(공개 https, 콘솔 등록 후 코드수정 없이 교체) (2)`${origin}/og-cover.png`(배포 https 오리진 자동) (3)비브라우저 폴백 `/og-cover.png`. 죽은 import(`config`/`APP_ICON`) 제거. `OG_IMAGE_ASSET='/og-cover.png'`.
- **부수**: `vite-env.d.ts`에 `ImportMetaEnv.VITE_OG_IMAGE_URL` 타입 보강, `.env.example` 신설(.gitignore `!.env.example` 허용), README 배포 노트에 OG 커버·VITE_OG_IMAGE_URL·프리뷰=공개 https 필요 명시.
- **검증**: `tsc -p tsconfig.app.json` **0** · `npm run build`(ait) **exit 0**(deploymentId 발급) · 플레인 `vite build`로 `public/og-cover.png`→`dist/og-cover.png`(276KB) 복사 확인(=배포 번들에 포함, `${origin}/og-cover.png` 서빙). **실 프리뷰(카톡 OG)는 공개 https 오리진+콘솔 딥링크 등록 필요라 실기기/배포 후 잔여** — 단 이제 규격(2:1·공개URL)·소스(실 아이콘)·설정성(env 교체) 모두 갖춤.

- **(후속) OG 기본 URL 확정(jsDelivr)**: 사용자 "콘솔 등록은 했지만 미출시 — 이미지 URL로 GitHub repo 써도?" → 됨(단 **public repo** 필요). repo `BokEumEom/snap-bingo`가 **private**이라 raw·jsDelivr 익명 접근 **404** 확인 + 커밋된 secrets 스캔 **0건**(`.granite/app.json`은 appName만, `.env*` 미추적 → 공개 안전). "AIT 출시에 문제 없냐?" → **없음**: AIT는 GitHub repo가 아니라 `.ait` 번들+콘솔 메타데이터를 심사, repo 공개/비공개 무관. 사용자 선택=이 repo public 전환+jsDelivr URL. → `share.ts`에 `DEFAULT_OG_IMAGE_URL = 'https://cdn.jsdelivr.net/gh/BokEumEom/snap-bingo@main/public/og-cover.png'`를 **커밋 기본값**으로 박음(gitignore되는 `.env`만 쓰면 배포 빌드에서 값 누락 위험 → 재현성 위해 상수화), `VITE_OG_IMAGE_URL`은 오버라이드 유지(`import.meta.env.VITE_OG_IMAGE_URL ?? DEFAULT`). `.env.example`·README OG 노트 갱신. **검증**: tsc 0·vite build 클린·**jsDelivr URL이 dist 번들에 인라인 확인**(=배포 .ait에 포함). **활성 조건(사용자 액션 잔여)**: repo를 **public 전환**해야 URL이 열림(현재 private=404 → 그전엔 프리뷰 안 뜸). 전환 후 시크릿창에서 URL 200 확인 권장. → **[완료 2026-07-10] 사용자 repo public 전환** → curl 검증 **raw·jsDelivr 둘 다 200 `image/png` 276,197B**(=커밋 크기 일치) → **실기기에서 초대 링크 공유 시 프리뷰 카드에 앱 아이콘 정상 노출 확인**. **OG 프리뷰 아이콘 이슈 전 구간(규격 2:1·공개 https URL·번들 인라인·딥링크·실기기 렌더) 완결**. (jsDelivr는 `@main` 캐시 → og-cover.png 교체 시 `purge.jsdelivr.net/gh/BokEumEom/snap-bingo@main/public/og-cover.png`로 갱신.)

### 이번 세션 (2026-07-10): 바텀시트가 iOS처럼 화면 바닥과 이어지게 — **최종: NewFlowModal식 커스텀 BottomSheet로 "오픈 액션" 교체(바닥 구조적 연결)** — box-shadow 꼼수 폐기, viewport-fit=cover는 유지, SheetFooter는 버튼 safe-area 담당

**요청**: 새 챌린지·업로드 바텀시트 하단이 "네이티브(iOS)처럼 화면 바닥과 이어져" 있으면 완성도가 높지 않을까? (다른 미니앱 대비)

- **1차 오독 → 정정**: 처음엔 "CTA 버튼이 fold 아래로 잘려(scrollH 582>clientH 508, 만들기 bottom 884>vp 844) 안 보임"으로 읽고 CTA를 sticky 고정(SheetFooter)했으나 — **사용자 재보고 "반영 안 됨, iOS 바텀시트(시트 하단이 화면 바닥과 안 이어짐)를 말한 것"**. 즉 문제는 버튼이 아니라 **시트 카드 자체가 iOS에서 홈 인디케이터 위에 떠 바닥과 사이에 틈**이 뜨는 것.
- **진짜 근본원인**: `index.html` meta viewport에 **`viewport-fit=cover`가 빠져 있었음**(`width=device-width, initial-scale=1.0`만). iOS 웹뷰는 이게 없으면 레이아웃 뷰포트를 홈 인디케이터 **위**에서 잘라, `position:fixed; bottom:0`인 TDS 바텀시트가 홈 인디케이터 위에 떠 **틈**이 생기고 `env(safe-area-inset-*)`도 **0** 반환. **결정적 증거: `BottomNav.tsx`가 이미 `bottom-[max(1rem,env(safe-area-inset-bottom))]`를 씀** → 앱이 viewport-fit=cover를 **전제로 설계됐는데 meta에만 빠져** env()가 iOS에서 죽어 있었음.
- **수정(핵심)**: `index.html` → `viewport-fit=cover` 추가. 이제 시트 `fixed bottom:0`이 **물리 화면 바닥**과 이어지고(틈 제거), `env(safe-area-inset-bottom)`이 실값 반환(BottomNav·SheetFooter의 safe-area가 이 값을 전제로 함).
- **SheetFooter(보완, `src/components/SheetFooter.tsx` 신설·재사용)**: viewport-fit=cover로 뷰포트가 홈 인디케이터 아래까지 확장되면 시트 하단 콘텐츠가 인디케이터 밑으로 들어갈 수 있음 → 버튼을 `position:sticky; bottom:0`로 시트 하단 고정 + `paddingBottom: max(var(--toss-safe-area-bottom,0px), env(safe-area-inset-bottom,0px), 16px)`로 **버튼을 홈 인디케이터 위로** 올리고 그 아래 strip은 시트 흰 배경(`adaptive.background`, 실측 rgb(255,255,255) 일치)이 채움 + 위쪽 그라데이션 페이드. 부수효과로 아까 fold 밖이던 CTA도 항상 보임. 3개 시트(`NewBoardForm` 취소/만들기·`UploadModal` 취소(`!isVerifying`)·`InviteSheet` 닫기/시작하기) 적용, 루트를 본문(`padding 0 24px`)+`<SheetFooter>`로 분리, `display="full"`(각짐 강제)→`display="block" size="large"`(둥근14px) 통일.
- **browse 심층검증에서 드러난 잔여 틈 → 추가 수정**: 사용자 "브라우저 확인 불가능하냐" 지적으로 browse(:5173, 390×844) DOM 실측 심화 → **viewport-fit=cover만으론 불완전**함을 발견. fixed 래퍼는 `bottom:0`(rectBottom 844=vp 바닥)로 물리 바닥에 닿지만, **TDS 흰 패널(`div[open]`, css-1jic9s7)은 내부 `transform: translateY(-10px)`(4s 뒤에도 정확히 -10 = 애니 잔여 아닌 영구 오프셋)로 래퍼 바닥보다 10px 위(bottom 834)에서 끝남** → 패널~물리바닥 사이 10px에 **딤(black overlay css-1gxyeez)이 비쳐 틈**. 실기기선 이 틈이 홈 인디케이터 높이(≈34px)만큼 커져 사용자가 본 그 틈. **시각 확증**: 딤을 빨강 불투명으로 칠하니 버튼 아래 맨밑에 빨간 띠(≈10px) 노출 → 흰색 미도달 확정.
- **[중간 시도, 폐기됨] box-shadow 채움(`src/index.css`)**: 패널 overflow:hidden이라 `[role="dialog"][data-state="open"] div[open] { box-shadow: 0 64px 0 0 var(--adaptiveBackground) }`로 패널 아래 흰색 채움 → browse 실측으로 틈 제거 확인까지 했으나, **아래 커스텀 시트 전환으로 이 규칙은 제거**함(더 이상 필요 없음). 기록만 남김.
- **최종 전환 — 사용자 지시 "`components/NewFlowModal.tsx` 참고, 디자인 아닌 '오픈되는 액션'을 바꿔라"**: TDS 포털 시트의 -10px 오프셋을 CSS로 때우지 말고, **오픈 방식 자체를 커스텀 시트로** 교체. (NewFlowModal은 스냅빙고 미사용 stray 참고 파일 — 구독트래커 컴포넌트, 오픈 패턴만 참고)
  - **`src/components/BottomSheet.tsx` 신설**: `createPortal(document.body)` + `fixed inset-0 flex flex-col justify-end` 컨테이너 + 카드(`bg-surface rounded-t-[28px] max-h-[90%]`)가 `justify-end`로 **뷰포트 바닥에 붙고** `translate-y-full→0` 슬라이드업(cubic-bezier(0.32,0.72,0,1), duration-500). 딤 탭·핸들 탭·Esc로 닫힘, body 스크롤 잠금, **열릴 때만 children 마운트(닫힘 애니 동안 유지)** → 폼 상태 매 오픈 초기화. 카드 바닥 = 컨테이너 바닥 = 뷰포트 바닥(viewport-fit=cover와 함께 물리 화면 바닥) → **-10px transform도 box-shadow도 불필요, 구조적으로 바닥 연결**.
  - **3개 시트 이관**: `useBottomSheet().open({header,children})` 명령형 → 선언적 `<BottomSheet open onClose title>`. **App.tsx**(새 챌린지: `isNewBoardOpen`; 초대: `isInviteOpen`+`pendingInvite`(닫힘 애니 동안 유지 위해 open과 데이터 분리, invitePreview/handleAcceptInvite 추출), `useBottomSheet` import·훅 제거) + **BoardDetailView.tsx**(업로드: `isUploadOpen`+`uploadCell`, `useBottomSheet` 제거). SheetFooter는 그대로 시트 안에서 버튼 safe-area 담당(주석만 갱신). `index.css` box-shadow 블록 삭제.
  - **애니메이션 버그 → 수정(사용자 리포트 "열림·닫힘 슬라이드 애니메이션이 없다")**: 단일 rAF의 고전 버그 — 마운트 렌더와 같은 프레임에 최종 위치(translate-y-0)로 점프해 초기 `translate-y-full` 프레임이 안 그려짐(browse 실측: open 40ms에 `transform:none`/최종). **더블 rAF**(초기 상태를 한 프레임 그린 뒤 visible=true)로 수정. **browse 시간샘플 재검증**: 열림 translate 83%→5.5%→0(top 732→214→178), 닫힘 39%→97%→언마운트 — 둘 다 정상 슬라이드. (StrictMode on이지만 dep-change 재실행이라 무관.)
  - **검증**: 이관 파일(App·BoardDetailView·BottomSheet·NewBoardForm·UploadModal·InviteSheet·SheetFooter) **tsc 0** · `vite build` 통과. **browse(:5173, 390×844) 실측**: 새 챌린지 시트 슬라이드업 정상, **카드 bottom=844(=뷰포트 바닥) 정확 일치, 흰색**. **딤을 빨강으로 칠한 스크린샷=시트 위쪽만 빨강, 취소/만들기 아래로 흰색이 바닥까지·빨간 틈 0**(box-shadow 시절과 달리 원천적으로 틈 없음). 상단 라운드 유지.
  - **orphan 처리(사용자 선택 "NewFlowModal만 삭제")**: `NewFlowModal.tsx` 삭제(참조 잔여 0, CSS 51→43.7kB로 감소). **`BottomNavSample.tsx`는 유지** — 단 이 파일도 다른 앱 소스라 **tsc 8에러 잔존**(`setActiveTab`/`Home`/`WalletCards` 등 미정의) → **tsc/CI는 이 파일 때문에 계속 레드**(앱 미사용이라 vite 빌드엔 무해). 추후 정리 필요.
  - ※ 실 iOS 홈 인디케이터 최종 픽셀은 샌드박스/실기기 확인 권장(desktop엔 물리 safe-area 없음). **미커밋**(commit/push 사용자 결정 대기).

### 이번 세션 (2026-07-10): 이모지 아이콘 = 토스 2D 이모지 에셋으로 전면 교체(완성도 ↑)

**배경**: 사용자가 "data.ts 플레인 유니코드 이모지가 완성도를 떨어뜨리지 않나?" 문제 제기. 조사 → 결정 → 전면 적용(눈에 띄는 것 먼저).

- **커버리지 조사(결정적)**: 토스 2D 이모지는 **유니코드 코드포인트로 직접 주소 지정**됨 — `static.toss.im/2d-emojis/png/4x/u{코드포인트}.png`(TDS 번들에서 `u1F4FA.png` 패턴 발견). data.ts 39개 고유 이모지를 코드포인트→URL로 만들어 HTTP 테스트 → **38개 200(존재)**, 유일 공백은 가족 👨‍👩‍👧‍👦(4인 ZWJ, 403) → 단일 코드포인트 **👪(u1F46A) 존재**로 대체. 샘플 다운로드 검증=진짜 PNG 160×160. **핵심 이점**: 토스 2D 이모지는 **플랫·토스블루 톤**이라 OS 멀티컬러 이모지보다 앱 아이덴티티(#3182f6)와 훨씬 잘 맞고, 이미지라 **크로스플랫폼 일관**(OS 폰트 편차 없음).
- **`src/components/Emoji.tsx` 신설**: `tossEmojiUrl(emoji)`(FE0F 제거 후 **단일 코드포인트만** URL화; ZWJ/스킨톤 등 2+ 코드포인트는 null→유니코드 폴백, "다 함께 단체샷" 옛 데이터 오매핑 방지) + `<Emoji>` 컴포넌트(`<img>` + `onError` 시 유니코드 폴백, decorative(alt='') 지원). data.ts는 유니코드 소스 유지, **렌더만** 교체.
- **전면 적용(눈에 띄는 것 먼저 → 나머지)**: Phase1 = 보드 카드(DashboardView)·뱃지 그리드(BoardDetailView)·뱃지 모달(BadgeModal)·테마 선택(NewBoardForm)·인증카드 푸터(BingoAchievementView). Phase2 = 빙고 칸 힌트 9개(BoardDetailView) + data.ts 👨‍👩‍👧‍👦→👪.
- **검증**: `tsc` 0·`vite build` 클린·플레인 `{emoji}` 렌더 잔여 0(`cellIcon` prop은 UploadModal에서 미렌더 dead prop). **browse(:5173) 실측**: 테마 시트 5 img(naturalWidth=160 로드 확인)·보드상세 **COUNT=15**(칸9+뱃지6)·**FAIL=0**(로드 실패 0)·**FAMILY=1**(👪 u1F46A 렌더). 스크린샷 육안=보드카드 🏖️ 플랫블루·9칸 전부 토스 이모지·👪 파란 가족·잠금 뱃지 그레이스케일 정상. **미커밋**(다음 세션에서 commit/push 결정).

### 이번 세션 (2026-07-10): 홈 우측상단 공유아이콘 제거 + 새 챌린지 모달 버튼 radius 정합 + 공유 OG 이미지 실아이콘화

**요청 3건**: (1) 홈 우측 상단 공유 아이콘 — 하단 "초대 링크 공유"와 중복이라 필요한지? (2) 새 챌린지 모달 취소/만들기 버튼 radius를 보드 삭제 확인 모달과 동일하게. (3) 초대 링크 공유 프리뷰에 **예전 앱 아이콘**이 뜸 → 수정.

- **(3) 공유 OG 이미지 = 실제 앱 아이콘**: `src/lib/share.ts`의 OG 이미지 소스가 `config.brand.icon`(아직 **예전 lh3 목업 placeholder** URL, granite.config.ts line10)이라 공유 프리뷰에 실제 앱 아이콘(`APP_ICON=/image_10.png`, 홈 헤더/인증카드에 쓰는 진짜 로고)과 다른 옛 그림이 떴음. → `DEFAULT_OG_IMAGE_URL` 상수를 **`defaultOgImageUrl()` 함수**로 교체: 런타임 `new URL(APP_ICON, window.location.origin).href`로 **배포 오리진 기준 절대 URL**(`${origin}/image_10.png`) 생성(SNS 크롤러가 상대경로/로컬 URL은 못 가져가므로 절대 URL 필수). 비브라우저 폴백만 `config.brand.icon`. `shareApp`(기본 인자)·`shareBoardInvite` 둘 다 적용. **검증**: `tsc` 0·`vite build` 클린·`grep DEFAULT_OG_IMAGE_URL` 잔여 0, node로 URL 구성 확인(`https://…/image_10.png`). **실 프리뷰(카톡 OG)는 토스 브리지+공개 오리진 필요라 실기기 잔여** — 단 이제 소스가 옛 목업이 아닌 실제 앱 아이콘.
- **(3-후속) `granite.config.ts brand.icon`도 실아이콘화**: 사용자 요청 — config가 아직 예전 lh3 목업 URL을 씀 → `import { APP_ICON } from "./src/data"`로 `brand.icon: APP_ICON`(=`/image_10.png`) **단일 소스 참조**. `data.ts`는 `./types`(순수 타입)만 import이라 config 로더에서 안전. **검증**: `tsc` app 0·`vite build` 클린·**`ait build` exit 0**(`snap-bingo.ait`+deploymentId 발급 = granite config 로더가 새 import 정상 로드, brand.icon 소비처 실검증). ※ 콘솔 제출용 600×600 PNG 내보내기는 여전히 TODO(주석 유지) — 다만 이제 config·UI·공유 OG가 모두 같은 실아이콘(image_10) 참조.

- **(1) 우측상단 공유 제거**: `DashboardView` 헤더의 우측 공유 버튼(`aria-label="공유하기"`)이 하단 "친구 초대하기 → 초대 링크 공유"와 **완전히 동일한 `shareApp(openToast)` 호출**이라 중복 → 제거(더 설명적인 하단 섹션으로 일원화). `Share2` lucide import 삭제, 헤더 `justify-between`→`items-center`(단일 좌측 요소). `shareApp`/`openToast`는 하단 `handleInvite`가 계속 사용.
- **(2) 버튼 radius 정합** [**정정: 1차 `size="large"`만으론 실패 → `display` 변경으로 해결**]: 초기엔 size 차이(xlarge16px vs large14px)로만 보고 `size="large"` 추가 → **사용자 재보고 "적용 안 됨"**. **라이브 실측(browse, 시트를 JS `.click()`으로 강제 오픈)으로 진짜 원인 규명**: `NewBoardForm` 버튼이 **`display="full"`**이라 TDS가 border-radius를 **강제 `0px`**로 덮음(full-bleed 버튼은 각지게 만드는 TDS 설계; 번들 `borderRadius:display==="full"?"0px":…`, 버튼 인라인스타일 `--button-border-radius:0px` 확인). size는 min-h/w/padding엔 반영되나 radius는 0px 고정이라 **버튼이 각져 있었음**. 삭제 다이얼로그 버튼은 `display=inline-flex`+`size="large"`라 **실측 14px**(target). → **`display="full"`→`display="block"`**(size는 large 유지). block은 full-width는 유지하되 0px 강제를 안 함 → **실측 취소/만들기 둘 다 r=14px·w=157px**(삭제 다이얼로그 14px과 정확 일치, 시트 절반폭 채움). 스크린샷 육안=둥근 모서리 확인. **교훈: TDS `display="full"`은 radius를 0px로 강제한다. 둥근 full-width 버튼은 `display="block"`을 쓸 것.**
- **검증**: `tsc --noEmit -p tsconfig.app.json` 0 · `vite build` 클린 · `grep Share2` src 잔여 0. **browse(:5173, 390×844) 실검증**: 헤더 `button[aria-label="공유하기"]` 0개·헤더 내 button 총 0개, 스크린샷 육안=로고+"찍고빙고"만(우측 아이콘 소멸). **size→radius 실측 확증**: 도달 가능한 빈상태 "새 챌린지 만들기"(`size="medium"`) 버튼이 **10px**로 렌더 → 번들 `medium:10px`와 일치, 매핑 정확성 확인. **새 챌린지 시트·삭제 다이얼로그는 오버레이라 헤드리스 미도달**(클릭이 full reload로 빠지는 기존 제약) → radius 정합은 번들-확정 매핑(large=14px)+medium 실측 교차검증으로 커버, 두 오버레이 나란한 육안은 실기기/샌드박스 잔여.

### 이번 세션 (2026-07-08): 함께 = "같은 챌린지 함께 시작"(딥링크 초대)로 재구현

**배경**: 바로 아래 "한-기기 참여자 귀속" 구현을 사용자가 **"억지"**로 판단(다들 자기 폰인데 폰 하나 돌려쓰기는 부자연스러움). 백엔드 없는 "각자 폰" 함께의 유일한 형태 = **딥링크로 같은 챌린지를 각자 시작→카드 비교**(A). 진짜 실시간 공유(B)는 Supabase 필요라 보류. 사용자 A 선택.

- **롤백**: 한-기기 참여자 기능(members/completedBy)을 8파일에서 전부 제거(types·App·NewBoardForm·UploadModal·BoardDetailView·BingoAchievementView·Gallery·Dashboard). `grep members/completedBy` 잔여 0 확인. **아래 로컬-공유 세션 로그는 이 세션으로 폐기됨**(시간순 최신이 위).
- **A 구현**:
  - `BingoBoard.templateId?` 추가(App `createBoardFromTemplate`가 저장) → 초대 링크가 템플릿 원본을 온전히 재현.
  - `src/lib/invite.ts` 신설: `encodeInviteParams(board)`(템플릿=`t=id`, 커스텀=`m=JSON(미션)`, `n=제목`), `parseInvite(search)`(형식 오류 시 null).
  - `src/lib/share.ts`: `shareBoardInvite(onFallback, board)` — 딥링크에 파라미터 실어 getTossShareLink+share, 브라우저 폴백 토스트.
  - `src/components/InviteSheet.tsx`: 초대 수락 UI(이모지·제목·미션칩·시작하기/닫기).
  - `BoardDetailView`: 진행바 밑 **"이 챌린지에 친구 초대하기"** 버튼(→shareBoardInvite).
  - `App`: 진입 초대 복원 → InviteSheet 열고 수락 시 `createBoardFromTemplate`/`createCustomBoard`로 같은 보드 생성(useRef 1회 가드).
- **핵심 함정 & 해결(중요)**: `window.location.search`를 effect에서 읽으면 **이미 비어 있음** — 프레임워크(@apps-in-toss/web-framework) 부트스트랩이 모듈 로드 시 URL 쿼리를 제거함(계측으로 확인: `search:""`). 웹 엔트리(`dist-web`)엔 `useParams`/`getInitialScheme` 없음(그건 RN/Bedrock 문서). → **`index.html`에 인라인 classic `<script>`로 deferred 모듈 번들보다 먼저 `window.__ENTRY_SEARCH=location.search` 캡처**, App 모듈 로드 시 1회 소비(`INITIAL_INVITE`). StrictMode 이중 실행은 useRef로 가드.
- **검증**: `tsc` 0 · `npm run build`(.ait) 클린. **browse(:5173) 인바운드 왕복 실검증**: `?t=food` 진입→InviteSheet 육안 정상(🍧 여름 미식 빙고·미션칩 냉면/콩국수/…+3·시작하기/닫기, `/tmp/invite_sheet.png`)→"시작하기" 클릭→localStorage에 `{title:'여름 미식 빙고', templateId:'food', cells:9}` 생성 확인, 콘솔 에러 0. **아웃바운드(BoardDetail 초대 버튼)는 내부뷰라 헤드리스 미도달 + share는 토스 브리지 필요라 로직 검증만**. **미확정(실기기/콘솔 필요)**: 실제 토스 딥링크가 파라미터를 WebView URL로 전달하는지(그래야 `__ENTRY_SEARCH` 캡처 성립) — 아니면 네이티브 스킴 소스로 교체 필요. README·STATE 갱신.

### 이번 세션 (2026-07-08): 함께 채우기 (③ 로컬 공유 보드 + 참여자 귀속) [폐기됨 — 위 딥링크 세션으로 대체]

**배경**: 동기 논의에서 ③"친구·가족과 함께"가 가장 큰 공백(챌린지 공식 주제 정면)이나 앱은 혼자용이었음. **구조적 제약**: 백엔드 없음(토스 Storage/localStorage 로컬 전용) → 원격 실시간 공동 편집은 서버(Supabase) 필요라 불가. 사용자 지시 "함께 의미 있게 구현" → 백엔드 없이 지금 완결·검증 가능한 유일한 의미 있는 형태인 **한 기기 공유 보드 + 참여자 태그** 채택(가족 여름여행에 폰 하나 돌려 채우기 → 완성 카드가 가족 기념물).

- **데이터모델(types)**: `BingoCell.completedBy?`(인증자), `BingoBoard.members?: string[]`(참여자), `NewBoardDraft` 두 변형에 `members: string[]`. members 비면 기존 솔로 동작.
- **생성(App/NewBoardForm)**: `NewBoardForm`에 "함께할 사람(선택)" 칩 입력(이름 추가/삭제, 중복없이 최대 8, `maxLength=10`) — 템플릿·커스텀 공통. `createBoardFromTemplate`/`createCustomBoard`에 members 인자(비면 필드 생략: `...(members.length?{members}:{})`).
- **인증 귀속(UploadModal/App)**: 함께 보드면 업로드 시트 상단에 **"누가 인증했나요?" 칩** — 선택 안 하면 등록 차단(토스트). `onUploadSuccess(photoUrl, completedBy?)` → `handleCompleteCell(...,completedBy?)`가 칸에 저장.
- **표시**: 보드상세 = 진행바 밑 **참여자별 인증 개수 요약**(파란 칩 섹션) + 완료 칸 좌상단 **인증자 칩**. 갤러리 = 사진 날짜줄에 인증자. 카드(`BingoAchievementView`) = 그리드 밑 **"함께한 사람 · 엄마 · 아빠 · 지호"** 크레딧. 대시보드 카드 = **"함께 N명"** 표시(Users 아이콘). 전부 members 있을 때만.
- **검증**: `tsc` 0(초기 `onCompleteCell` prop 시그니처 4번째 인자 누락 1건 수정) · `npm run build`(.ait) 클린. **browse(:5173) 실데이터 시드 검증**: 그룹보드('우리 가족 여름', members 3, 2칸 completedBy)+솔로보드 시드 → 대시보드 육안: 그룹만 "함께 3명"·2/9·22%, 솔로는 함께 표시 없음, 콘솔 에러 0(`/tmp/together_dashboard.png`). **생성시트·업로드 "누가?" 칩·보드 요약·칸 인증자칩·카드 크레딧은 SPA 오버레이/내부뷰라 헤드리스 미도달** — tsc+빌드+로직으로 커버, 실기기/수동 확인 잔여. README·STATE 갱신.
- **다음(원격 함께)**: 딥링크로 "같은 챌린지 함께 시작"(공유링크에 테마·미션 실어 수신자가 같은 보드 생성 → 카드 비교)은 콘솔 등록+실기기 후 검증 가능 → 별도 단계. 진짜 실시간 공동 보드는 Supabase 도입 필요(큰 작업).

### 이번 세션 (2026-07-08): 카드 이미지 저장 제거 (#2 롤백)

**요청**: 인증 현황(빙고 달성 카드)의 "이미지로 저장하기" 버튼 제거.

- **적용**: `BingoAchievementView`에서 저장 버튼 + 딸린 죽은 코드 전부 정리 — `handleSaveImage`, `isSaving` 상태, `cardRef`(카드 div `ref`), `saveCardImage`/`useRef` import 제거. `grep` 확인 후 유일 참조였던 **`src/lib/saveCard.ts` 파일 삭제**. 카드 하단 액션은 이제 **"친구에게 공유하기" 단일 버튼**.
- **비고**: 아래 "#2 카드 저장 실구현"·"허위 저장 정직화" 등 옛 로그는 이 세션으로 **롤백/폐기됨**(시간순 최신이 위). 부수 효과 — `board.emoji`를 유니코드로 묶어두던 **html-to-image CORS 제약이 사라짐**(더는 캡처 안 함, 지금은 emoji 그대로 둠). `html-to-image` npm 의존성과 `saveBase64Data` 브리지는 이제 **미사용**(package.json 정리는 보류·저비용, 필요 시 제거 가능).
- **검증**: `tsc --noEmit` 0 · `npm run build`(.ait) 클린. `grep saveCard/html-to-image/saveBase64Data` src 잔여 0. README(기능 설명·구조에서 saveCard 제거) 갱신.

### 이번 세션 (2026-07-08): 성취 "순간" 훅 (빙고 줄·보드 완성 축하)

**배경**: 뱃지 동기 부여 논의 → "사용자가 진짜 원하는 건 ①보드=트로피 ②빙고 줄 쾌감 ③함께 ④공유카드"로 정리. 구현 현황 점검 결과 **①②③은 상태로만 반영될 뿐 순간/연출이 비어 있고, ④카드만 온전(수동 진입)**. per-cell 루프는 탄탄하나 그 위 감정 피크(줄!·보드!)가 행동과 분리돼 있었음. → 최고 레버리지인 **①②(순간 훅)** 우선 구현 채택.

- **판정(App)**: `handleCompleteCell` 재작성 — 칸 완료 전/후로 `countBingoLines(before/after)`와 전면완성(before/after)을 비교해 등급 산출: `nowComplete&&!wasComplete → 'board'` > `afterLines>beforeLines → 'bingo'` > `'cell'`. 불변식 유지(map/spread). `completedCell`에 `tier` 추가, 축하에서 카드로 가는 `handleViewCard`(→'achievement') 신설. 새 타입 `CompletionTier='cell'|'bingo'|'board'`(types.ts).
- **연출(MissionCompleteView)**: `tier`·`onViewCard` prop 추가. 등급별 제목/부제(`TIER_CONFIG`), 컨페티 강도(60/110/160)·금빛 팔레트 추가, 아이콘(board=Trophy·bingo/cell=Check)·강조색(celebration=amber, cell=blue) escalation. 빙고/보드 땐 **"빙고 카드 보기"**(primary) + "확인"(weak) — 감정 피크에서 트로피 카드(④)로 바로 훅. 컨페티 useEffect deps `[]`→`[tier]`.
- **비고**: BoardDetail line79 "모든 미션 완료…" 토스트는 다 찬 보드 FAB 탭 전용이라 인증 순간과 무관 → 유지. `board.emoji`는 여전히 유니코드(카드 저장 CORS 보호 계속).
- **검증**: `tsc --noEmit` 0 · `npm run build`(.ait) 클린. **MissionComplete는 업로드→내부 뷰 전환이라 헤드리스 도달 불가** — 등급 판정은 순수 함수라 로직 리뷰+tsc로 커버(육안 미확보). README·STATE 갱신.

### 이번 세션 (2026-07-08): 남은 시간(가짜 timeLeft) 제거

**요청**: 빙고 보드의 "남은 시간"이 실제 기능인지 확인 → 가짜(정적)로 판명, 제거(옵션 1).

- **진단**: `timeLeft`는 보드 생성 시 `'30일 00:00'` 문자열이 **하드코딩**되고 카운트다운 로직·실제 마감일이 **없음**. 어떤 보드를 언제 열어도 고정 → 멈춘 카운트다운처럼 보여 "버그처럼 보이는" 상태(앱인토스 UX 가이드상 오해 유발 표기).
- **적용**: `BoardDetailView`의 "남은 시간" 블록 + 미사용 `Timer` 아이콘 import 삭제. `App`의 두 생성 함수(`createBoardFromTemplate`·`createCustomBoard`)에서 `timeLeft` 제거. `types.ts`의 `BingoBoard.timeLeft` 필드 제거. 보드상세는 빙고판 → 바로 "획득 가능한 뱃지"로 이어짐.
- **참고**: 이전 세션 로그(아래 뱃지 그리드 항목들)의 "남은 시간 카드 유지" 서술은 이 세션으로 **폐기됨**(시간순 최신이 위 규칙). 기존 저장 데이터에 `timeLeft` 잔존해도 타입 미참조라 무시 → 마이그레이션 불필요.
- **검증**: `tsc --noEmit` 0. `grep timeLeft/"남은 시간"` 잔여 0(UploadModal의 `setTimeout` 핸들은 무관). README엔 남은시간 언급 없어 문서 수정 불필요.

### 이번 세션 (2026-07-08): 커스텀 보드 생성('직접 만들기') 추가

**요청**: 테마(템플릿)로만 보드 생성 가능 → 템플릿 없이도 만들 수 있어야 함.

- **구현**: `NewBoardForm`에 5번째 옵션 **"✏️ 직접 만들기"** 추가. 선택 시 보드 이름 아래에 **미션 9칸 입력**(네이티브 input×9, `maxLength=20`, 비우면 생성 시 '미션 N'으로 채움 → 저마찰). 콜백을 `NewBoardDraft` 판별 유니온(`{type:'template',templateId,name}` | `{type:'custom',name,missions}`)으로 정리.
- **App**: `createCustomBoard(name, missions)` 신설 — 9칸을 `title=missions[i]||'미션 N'`, `icon='📸'`로, 보드 `emoji='📸'`·`eyebrow='나만의 챌린지'`. `handleCreateNewBoard`가 draft.type로 분기(custom↔template). 시트 헤더 '새 빙고 보드 만들기'→'새 챌린지 만들기'.
- **참고**: 이전엔 이름만 커스텀·9칸은 템플릿 고정이었음 → 이제 **미션까지 사용자 정의 가능**. 빙고·사진인증·저장·갤러리·카드·부제(미션 미리보기) 전부 자동 대응.
- **검증**: `tsc` 0, `vite build` 클린. browse(:5199) — 커스텀형 보드 시드 시 대시보드 카드 정상(📸 · "우리 가족 여름 미션" · "우리 강아지 · 동생이랑 · 할…" · 2/9·22%), 콘솔 에러 0. **생성 시트(5옵션+9입력)는 SPA 오버레이라 헤드리스 육안 미확보** — tsc+결과 렌더로 커버. README 갱신.

### 이번 세션 (2026-07-08): 카드 간략 부제(미션 미리보기) 복원

**요청**: 카드에 간략한 subtitle이 있으면 좋겠다 + "빙고판은 템플릿만 생성 가능? 커스텀 보드 제거했나?"

- **커스텀 보드 확인(답)**: 보드 **이름은 지금도 자유 입력**(제거 안 함). 9칸 미션은 **원래부터 고정**(예전 하드코딩 1세트 → 지금 4템플릿 선택이라 더 유연). "사용자가 미션 문구 직접 입력" 기능은 **애초에 미구현**(제거 아님) — 필요 시 별도 기능("직접 만들기" 빈 9칸 편집)으로 추가 가능하다고 안내.
- **간략 부제 복원**: 새 필드 추가 대신 **`board.cells.slice(0,3)`의 제목을 ' · '로 조인**해 카드 부제로(미션 미리보기; 커스텀 보드에도 자동 대응, truncate). 예: "냉면 · 콩국수 · 빙수". 카드 = 제목 + 부제(2줄) + 우측 `[N/N][%]` 뱃지 페어(items-center 중앙 정렬).
- **검증**: `tsc` 0, `vite build` 클린. browse(:5199) 육안 — 미식 "냉면·콩국수·빙수" 3/9·33%, 여행 "바다 풍경·노을 풍경·숙…"(truncate) 9/9·100%(초록+🏆), 콘솔 에러 0.

### 이번 세션 (2026-07-08): 카드 진행 표시 = 개수·% 뱃지 페어

**요청**: `0/9`를 `0%`와 같은 뱃지 UI로, `0%` 앞(왼쪽)에 나란히.

- **적용**: 축소 때 회색 텍스트로 제목 밑에 뒀던 `N/N 완성`을 걷고, **제목(1줄) + 우측에 `[N/N] [%]` 뱃지 페어**로. 두 뱃지 동일 스타일(`variant=weak size=xsmall`), color는 `percent===100 ? green : blue`로 통일 → 진행 중 파랑, 100% 둘 다 초록(+아이콘 🏆). 개수가 % 앞.
- **검증**: `tsc` 0, `vite build` 클린. browse(:5199) 육안 — 0/9·0%, 3/9·33%, 9/9·100%(초록+🏆) 3카드 뱃지 페어 정상, 콘솔 에러 0.

### 이번 세션 (2026-07-08): 대시보드 카드 축소(정보 과다 정리)

**요청**: 카드에 내용이 너무 많음.

- **판단**: 직전 정렬 재설계에서 eyebrow까지 얹어 정보 4개(테마·제목·완성수·%)로 과해짐. eyebrow("여름 미식 챌린지")가 title("여름 미식 빙고")과 거의 중복, subtitle "혼자 진행 중"은 협업 부재로 상수 노이즈.
- **적용**: 카드를 **제목 + `N/N 완성`(2줄) + % 뱃지**로 축소. eyebrow는 **카드에서 제거하고 BoardDetail에만 유지**(거긴 공간 있음, 라벨 버그 수정분은 그대로). 안 쓰이게 된 **`subtitle` 필드 통째 제거**(types×2·data×4·App). `subtitle`은 카드 단독 소비였어서 잔존 참조 0 확인.
- **검증**: `grep subtitle` 0, `tsc` 0, `vite build` 클린. browse(:5199) 육안 — 미식 3/9·33%, 여행 9/9·100%(초록+🏆) 두 카드 슬림 렌더, 콘솔 에러 0.

### 이번 세션 (2026-07-08): 대시보드 보드 카드 정렬 재설계

**요청**: 카드 텍스트(0/9개 완성·0%·혼자 진행 중·eyebrow)가 라인 안 맞고 중간 줄바꿈됨 → 정렬 개선.

- **진단**: 기존 카드가 `subtitle • 완성수`를 한 `<p>`에 `flex gap`으로 욱여넣어 좁은 폭에서 "혼자/진행 중"으로 줄바꿈 + `%` 뱃지는 별도 우측 컬럼으로 떠서 라인 불일치. 또 `eyebrow`(신규)가 카드 미사용, subtitle "미식가 에디션 • 혼자 진행 중"이 eyebrow 테마와 중복.
- **재설계**: 카드를 **좌측 정렬 3줄 스택**으로 — ①eyebrow(파랑 kicker, `board.eyebrow ?? '여름 챌린지'`) ②title(굵게) ③meta(`{n}/{total} 완성`은 진회색 semibold=주요, `·`, subtitle=보조). meta는 `truncate` 단일 줄로 **줄바꿈 제거**. `%` Badge는 별도 컬럼 래퍼 제거하고 outer `items-center`에 맡겨 **3줄 스택 대비 수직 중앙 정렬**(우측 라인 정합). 100%면 초록, 아이콘에 🏆.
- **데이터 정리**: `subtitle`이 카드 단독 소비 확인 → 템플릿 4종 subtitle을 `'혼자 진행 중'`(참여 상태)만 남김(테마 문구는 eyebrow로 이관, 중복 제거). types 주석 갱신.
- **검증**: `tsc` 0, `vite build` 클린. browse(:5199) 육안 — 미식 33%(진행)·여행 100%(초록+🏆) 두 카드에서 3줄 좌측 정렬·meta 무줄바꿈·% 우측 중앙 정합 확인, 콘솔 에러 0.

### 이번 세션 (2026-07-08): "챌린지 프레이밍" + 새 챌린지 버튼 재배치(hero→헤더) + 상단 라벨 버그 수정

**요청**: "빙고보다 챌린지 단어를 더 쓰지 않나?" + "챌린지 판 추가 버튼 배치 재고(hero 캐러셀에 있음)".

- **네이밍 판단(정직)**: 빙고=메커닉(차별점·"빙고!" 공유 훅), 챌린지=카테고리 라벨(발견성). 대체재 아님. **이름은 빙고 유지, 카피/포지셔닝은 챌린지로 프레이밍** 추천 → 채택.
- **생성 버튼 재배치**: 기존엔 **hero 캐러셀 전체가 생성 버튼**(스와이프↔탭 충돌, 배너가 버튼처럼 안 보여 빈 상태가 "위 배너 눌러"로 가리켜야 함, 보드 생기면 거대 CTA가 상단 점유). → **hero를 순수 무드 배너로**(생성 액션·+아이콘 제거, 스와이프·도트 유지, "여름 인증 챌린지 / 사진으로 채우는 나의 여름" 장식 카피 `pointer-events-none`). 생성은 **"진행 중인 챌린지" 헤더 우측 상시 `+ 새 챌린지` pill** + **빈 상태 자체 primary 버튼("새 챌린지 만들기", TDS `Button`)** 로 분리. 섹션명 "진행 중인 빙고"→"진행 중인 챌린지".
- **상단 라벨 버그 수정**: `BoardDetailView`의 eyebrow가 죽은 시드 id(`jeju-summer`/`cold-noodles`) 참조라 **모든 보드에서 항상 "라이프스타일 챌린지"** 만 떴음 → `BoardTemplate.eyebrow`(여행/피서/미식/건강 "여름 XX 챌린지") + `BingoBoard.eyebrow?` 추가, 생성 시 저장, `{board.eyebrow ?? '여름 챌린지'}`로 렌더.
- **파일**: `types.ts`(eyebrow 필드×2), `data.ts`(템플릿 eyebrow×4), `App.tsx`(eyebrow 저장), `BoardDetailView.tsx`(라벨), `HeroCarousel.tsx`(무프롭 무드배너 재작성), `DashboardView.tsx`(hero 무프롭, 헤더 버튼, 빈 상태 버튼, 섹션명, import Button/Plus).
- **검증**: `tsc` 0, `vite build` 클린. browse(:5199, 390×844) 육안 — 빈 상태: hero에 CTA 없음 + `+ 새 챌린지` pill + primary 버튼, 콘솔 에러 0. 보드 시드 상태: 헤더 pill이 목록과 공존, 카드 🍧 3/9·33% 정상. (eyebrow는 BoardDetail=SPA 내부뷰라 육안 미확보, `?? '여름 챌린지'` 폴백+tsc로 커버.)

### 이번 세션 (2026-07-08): 여름 테마 템플릿 4종 + 칸 아이콘 이모지 전환

**요청 흐름**: 사용자가 "음식 챌린지(냉면·빙수 등) 방향 가능?" → "개수(6/5)는 예시일 뿐" → 챌린지 공지(`toss.im/apps-in-toss/blog/2607_vibecoding_challenge`) 확인 → **"여러 테마 중 하나로"(B안)** 결정. 공지 근거: 주제 "미니앱과 함께하는 여름"이 넓고(가이드 4갈래: 여행·휴가/무더위 시원/건강·수분관리/친구·가족 활동, "형식 자유"), 1차 심사가 8/1~8/26 **지표 중심**, 최종은 테마 적합성·UX → 다테마가 지표(재방문 훅)·테마 적합성 두 축 모두에서 유리. 앱 하나가 공식 가이드 4테마를 동시에 커버.

- **구현**: 보드 생성이 지금까지 이름만 받고 **하드코딩 9칸**(`App.tsx` 옛 `createBoardFromName`, lucide 아이콘)을 시드하던 것을 **테마 템플릿 선택**으로 교체.
  - `types.ts`: `BoardTemplate` 타입 추가(`id/label/emoji/subtitle/description/cells[{title,icon}]`). `BingoCell.icon` 주석 lucide→이모지.
  - `data.ts`: `BOARD_TEMPLATES` 4종 — 🏖️여행/🌊피서/🍧미식/💧건강, 각 9칸. 칸 `icon`은 **이모지**(TDS가 2D/3D 이모지를 1급 에셋으로 다룸; 항상 렌더·발랄한 톤).
  - `NewBoardForm.tsx`: 이름 입력 위에 **테마 선택 리스트**(선택 시 하이라이트, 미수정 시 이름이 라벨을 따라감). `onSubmit(templateId, name)`.
  - `App.tsx`: `createBoardFromName`→`createBoardFromTemplate(templateId, name)`(템플릿 cells를 BingoCell로 매핑, subtitle/emoji도 템플릿 값). **`STORAGE_KEY` v2→v3**(옛 보드는 icon에 lucide 이름 보관 → 이모지 렌더 시 "Waves" 글자로 보이므로 재시드; 출시 전·시드 빈 상태라 안전).
  - `BoardDetailView.tsx`: 빈 칸 힌트 `<LucideIcon name={cell.icon}/>` → `{cell.icon}`(이모지). lucide import 제거.
  - `LucideIcon.tsx`: name 참조가 이제 대시보드 `Trophy`뿐 → ICON_REGISTRY를 `Trophy`만으로 정리(파일의 트리셰이킹 주석과 일관, 번들 소폭 감소). **파일은 유지**(DashboardView가 계속 씀).
- **TDS 아이콘 질문 답**: TDS는 `Asset.Icon`(토스 아이콘 name/URL+color) 제공하나 그 세트는 금융·UI 계열이라 냉면·수박·삼계탕 픽토그램 부재 가능성↑ → 36개 정확 매칭 위험. **딱 맞는 TDS 자산 = 이모지**로 결정.
- **검증**: `tsc --noEmit -p tsconfig.app.json` 0, `vite build` 클린(gzip 426kB, 청크경고는 TDS 기존 것). browse(:5199, 390×844) — 대시보드 렌더+콘솔 에러 0. localStorage에 미식 보드(v3 키) 시드→reload 시 **대시보드 카드에 🍧·"여름 미식 빙고"·0/9 완료 정상 렌더**(=이모지 렌더 경로 검증). **단, 테마 선택 시트 + 3×3 상세 그리드는 헤드리스로 육안 미확보** — SPA 오버레이/뷰전환 클릭이 full reload로 빠지는 기존 제약 동일. 칸 이모지는 `{cell.icon}` 문자열 보간으로 뱃지/보드 이모지(이미 렌더 확인)와 동일 경로라 저위험. 최종 육안(시트·그리드)은 실기기/샌드박스 또는 실제 브라우저 조작에서 확인 권장.
- **문서**: README 주요기능에 "테마 템플릿" 추가 + 구조 `data.ts`에 BOARD_TEMPLATES 반영.

### 이번 세션 (2026-07-06): 빙고 카드 이미지 저장 실구현 (#2)

A1 완료 후 사용자 선택으로 **#2 카드 저장 실구현** 진행. 빙고 달성 카드(`BingoAchievementView`)의 "이미지로 저장하기"가 지금까지 스크린샷 안내(가짜)였던 것을 실 저장으로 교체함.

- **구현**: `html-to-image`(신규 런타임 의존성) 추가. `src/lib/saveCard.ts` 신설 — 카드 DOM을 `toPng`(pixelRatio 2, 둥근 모서리 살리는 투명 PNG)로 렌더 → dataURL에서 base64 추출. 인앱은 `saveBase64Data({ data, fileName, mimeType:'image/png' })`(정확 시그니처는 `node_modules/@apps-in-toss/web-bridge/dist/saveBase64Data.d.ts`에서 확인)로 네이티브 저장 → `'saved'`. 브라우저(브리지 없음)는 reject되어 `<a download>` 폴백 → `'downloaded'`. 렌더 실패 시 `'failed'`. 파일명 `찍고빙고-<보드제목>.png`(제목 특수문자 sanitize).
- **왜 지금 안전한가**: A1이 카드 이미지를 외부 프리셋 URL → 사용자 사진(data URL)·동일출처 로고(`/image_10.png`)로 바꿔, 캔버스 CORS 오염 위험이 사라져 `toPng` 캡처가 안전.
- **뷰 연결**: `BingoAchievementView`에 `useRef` 카드 ref + `isSaving` 상태 추가, 기념 카드 div에 `ref`, "이미지로 저장하기" 버튼 `loading={isSaving}` `onClick={handleSaveImage}`. 결과별 토스트 3종.
- **검증**: `tsc --noEmit` 0, `vite build` 클린(gzip 426kB, 청크경고는 TDS로 인한 기존 것). browse(:5191, 390×844)로 9/9 완료 보드 주입 → 대시보드 정상 렌더 + 콘솔 에러 0. **단, 빙고 달성 화면은 라우터/URL 없는 SPA 내부 view-state로만 도달 — 헤드리스 클릭이 내부 네비게이션을 구동 못 함(카드 클릭 시 full reload로 대시보드 복귀; 기존 세션들과 동일 제약).** 따라서 카드 캡처+실제 저장(인앱 네이티브 / 브라우저 다운로드) 동작은 **실기기·샌드박스 또는 실제 브라우저에서 최종 확인 필요**.
- **README 갱신**: A1 잔여 스테일 정정(프리셋/획득포인트/카드 템플릿↔실판 토글/`@summer_walker`/"목업 데이터"·"데모 동작" 항목) + 구조에 `image.ts`·`saveCard.ts` 반영 + 이미지 저장 기능 명시.

### 이번 세션 (2026-07-06): 사진 시트 하단 우측 radius 잘림 수정 + 브라우저 프리뷰 프리즈 해소

**요청 1**: "빙고판 사진 추가 모달 하단 — 오른쪽 하단 radius가 왼쪽과 달리 짤린다."
- **진단**: 바텀시트는 화면 하단에 붙어 자체 하단 radius가 없음 → 잘리는 건 맨 아래 `인증하기`(우측) 버튼의 우하단. 원인: `[취소][인증하기]` 행이 `size="large"` 패딩 때문에 두 `flex-1` 칸(각 `(시트폭−48−8)/2`)에 안 들어가 **우측으로 오버플로**(플렉스 아이템 기본 `min-width:auto`가 콘텐츠보다 못 줄임) → 행이 좌측정렬이라 좌측 버튼은 제자리(둥근 모서리)지만 우측 버튼이 시트 `overflow:hidden`+radius 경계를 넘어 **우하단만 잘림**. 홈 `NewBoardForm`은 기본 size라 안 넘쳐서 멀쩡했음.
- **적용**: `UploadModal.tsx` 하단 두 래퍼 `flex-1` → **`flex-1 min-w-0`**(플렉스 오버플로 정석 가드). `large` 디자인 유지, 그 외 불변. `tsc --noEmit` 0.

**요청 2**: 사용자가 `getSafeAreaInsets is not a constant handler` 에러 스택 공유(= 그동안 STATE가 반복 언급한 "브라우저 프리뷰 프리즈"의 정체).
- **근본 원인**(브릿지 소스 확인): `getConstant(e){ let t=window.__CONSTANT_HANDLER_MAP; if(t&&e in t)return t[e]; throw new Error(`${e} is not a constant handler`) }`. 순수 브라우저엔 `__CONSTANT_HANDLER_MAP`가 없음 → `TDSMobileAITProvider` mount effect에서 `getSafeAreaInsets()` throw → **React 루트 크래시**(=프리즈). `dev`=`granite dev`(내부 `vite dev`, :5173)로도 이 맵은 안 채워짐. safe-area 형태는 `EdgeInsets {top,right,bottom,left}`(react-native-safe-area-context).
- **적용**: **`src/lib/devBridgeShim.ts` 신규** + `main.tsx`에서 `installDevBridgeShim()` 호출(render 직전). `import.meta.env.DEV` **그리고** `!('ReactNativeWebView' in window)`(=순수 브라우저)일 때만, `__CONSTANT_HANDLER_MAP.getSafeAreaInsets`가 **없을 때만** 0 인셋 폴백을 심음 → **앱(샌드박스)에선 절대 실행 안 됨, 네이티브 값도 안 덮음**. `ait build`(prod)에선 컴파일 아웃.
- **의의 = 제약 해소**: 이제 **순수 브라우저에서 프리뷰가 렌더됨.** browse(:5179, 390×844)로 대시보드 정상 렌더 + 콘솔 `getSafeAreaInsets` 에러 **소멸** 확인, 스크린샷 육안 정상(히어로 캐러셀·보드3·탭바). 이전 세션들의 "프리뷰 프리즈로 라이브 검증 불가" 제약은 **해결됨**.
- **남은 검증 한계(정직)**: 헤드리스 환경에서 **클릭이 페이지 리로드를 유발**(콘솔 vite 재연결)해 인앱 네비게이션(보드 진입→사진 시트)이 리셋됨 → radius 수정의 **시트 육안 캡처는 아직 미확보**. radius 수정은 코드 레벨(`min-w-0`)+`tsc`로 검증됨. 최종 시트 육안은 브라우저에서 직접 조작하거나 토스 샌드박스에서 확인 권장.

**IA 재검토 → 하단 탭 2탭화(사용자 선택 A)**: 기존 3탭 `[미션][빙고판][갤러리]`에서 **`빙고판` 탭 제거**. 근거: `BoardDetailView`가 *탑레벨 탭*이자 *뒤로가기 있는 드릴다운*으로 이중 역할 → 홈 보드 카드 탭과 목적지(`'board'` 뷰) 중복 + "빙고판" 단수 라벨인데 실제론 여러 보드 중 활성 1개로만 점프. **보드=홈 목록에서 파고드는 콘텐츠**로 규정. 적용: `BottomNav` TABS를 `[홈(dashboard, Home 아이콘), 갤러리(gallery)]` 2개로(라벨 `미션→홈`, `Compass/LayoutGrid`→`Home`), `BoardDetailView`에서 `<BottomNav>`+import 제거 → `MissionComplete`/`Achievement`와 동일한 순수 드릴다운(뒤로가기만). 보드 진입은 **홈 카드 탭으로 일원화**(고아 경로 0, `NavKey`/`'board'` 뷰·`onNavigate('achievement')` 유지). **검증**: `tsc`+`vite build` green, browse(:5180)로 대시보드 하단 탭=`[홈,갤러리]` 2개 육안+DOM 확인. 보드 상세 무탭은 코드(import+렌더 삭제)로 확정 — headless 클릭이 이 환경에서 인앱 네비 트리거 못 해 육안 캡처는 미확보(browse/React 위임 특성, 내 코드 이슈 아님). ※ 갤러리 탭은 "기록·아카이브 축 = 비게임 포지셔닝 근거"라 유지.

**기능 완성도 보완 #1(일부): 업로드 이미지 리사이즈/압축(사용자 선택)**: 셀 사진이 원본 해상도 base64로 저장돼 `localStorage` ~5MB quota + 렌더 성능 리스크가 있었음(오픈 #1 part 8·#10 언급). 신규 **`src/lib/image.ts`** `resizeImageDataUrl(file, {maxEdge=1080, quality=0.8, mimeType='image/jpeg'})` — canvas로 최장변 1080px 다운스케일 + JPEG 재인코딩, 원본이 이미 작으면/캔버스 실패 시/결과가 더 크면 **원본 폴백**(불변, 입력 File 미변경). `UploadModal.processFile`를 **async화**해 `startVerification` 전에 적용 + 파일 읽기 실패 시 토스트(엣지 처리). **프리셋(외부 URL) 경로는 미적용**(CORS로 canvas 오염). 진행바 "정직화"는 이번 패스 미포함(추후 선택). **검증**: `tsc --noEmit` 0 · `vite build` 클린. 실측 바이트 감소는 **headless로 미확보** — browse `js`가 호출 간 `window` 미유지 + 프로미스 await 안 함(도구 한계). 알고리즘상 12MP(~3–5MB) → 1080px/q0.8 시 통상 ~150–350KB(≈90%+ ↓), 9칸 합계도 quota 안쪽. 실기기/devtools에서 수치 확인 가능.

**기능 완성도 보완 #1(이어서): 인증 진행바 정직화 + 취소(사용자 선택 ①)**: 기존 `UploadModal` 인증 상태가 **가짜 % 진행바**(`setInterval` 0→100 연출) + "미션에 맞게 사진을 등록하고 있어요" 문구라 **AI 검증/판정처럼 오해** 소지가 있었고, `setInterval`이 언마운트 시 미정리(setState-after-unmount·중복 완료 리스크)였음. 수정: (a) 가짜 진행률 제거(`ProgressBar`·`verificationProgress`·`adaptive` import 삭제) → 정직 문구 "사진을 등록하고 있어요 / 잠시만 기다려 주세요" + 스파클 애니메이션만, (b) `startVerification`은 단일 `setTimeout(800ms)` → `onUploadSuccess`(사진 인증 = 사용자 자기 등록이며 실제 판정 없음을 주석 명시), (c) **취소 버튼** 추가(`cancelVerification`: 타이머 clear → 폼 복귀 → 토스트, 저장 안 함), (d) `completeTimerRef` + `useEffect` cleanup으로 **언마운트 타이머 정리 버그 수정**. **검증**: `tsc --noEmit` 0 · `vite build` 클린. 인증 상태는 상호작용(시트 열기→선택→인증하기) 뒤라 headless로 도달 불가 → 시각 확인은 브라우저 직접/샌드박스.

**출시 필수 A1(목업 데이터 제거) 착수 — 1/6: 시드 보드 → 빈 상태 시작(사용자 선택 A1)**: `data.ts INITIAL_BOARDS`를 3개 목업 보드(사전완료칸·프리셋 사진·멤버 아바타 포함) → **`[]`**로. App 로드 폴백·`갤러리 초기화`가 모두 이 값을 써서 **항상 빈 상태로 시작**. `DashboardView`에 보드 0개일 때 빈 상태 카드("아직 빙고 보드가 없어요 / 새 빙고 보드 시작하기") 추가(`LayoutGrid` 아이콘). **검증**: `tsc`+`vite build` green, browse(:5182, 390×844)로 빈 대시보드 육안 확인(빈 카드·"진행 중인 빙고 0"·히어로 만들기·2탭 유지). **A1 남은 하위단계(의존성상 소비처와 묶어 처리)**: ②XP 전면제거(`types xpReward/reward` + data/App/MissionComplete/Gallery) / ③프리셋 제거(`PRESET_IMAGES`+`UploadModal`) / ④추천 미션(`SUGGESTED_MISSIONS`+DashboardView — **제거 vs 실기능화 미결**) / ⑤인증현황 신원(`@summer_walker`·`AVATARS.girl3`)·프리셋 예시보드(`BingoAchievementView`) / ⑥members·AVATARS 정리. ※ 이 단계 후에도 홈에 추천 미션(+XP)·기타 목업 잔존(다음 단계 대상).

**A1 — 2/6: XP 전면 제거(사용자 선택 ②)**: `types` `BingoCell.xpReward`·`BingoBoard.reward` 필드 삭제 + 소비처 전부 정리 — `App`(completedCell 타입·set·`createBoardFromName` 9칸 `xpReward`·`reward` 카피·MissionComplete prop), `MissionCompleteView`(prop·`+{xpReward}P` 앰버 pill 제거 + "보너스 포인트를 획득했습니다"→"여름의 한 순간을 잘 기록했어요" 정직화), `GalleryView`(사진 `xp` 매핑·`+{photo.xp}P` 뱃지·`Sparkles` import 제거), `data.ts SUGGESTED_MISSIONS`의 `"+NNN XP"` 문구, `DashboardView` `{mission.xp}` 표시. → **비게임 정직성 전제 충족**(게임 점수 흔적 제거). **검증**: `tsc` 0 · `vite build` 클린 · grep 잔여 `xpReward/xp/보너스/reward` 참조 0 · browse(:5183)로 대시보드 XP 텍스트 0 육안(추천 미션 카드 레이아웃 정상). ※ 지속 스토리지 옛 보드의 `xpReward/reward`는 vestigial로 무시(런타임 무해, 마이그레이션 불필요). MissionComplete/Gallery의 XP 제거 육안은 상호작용/데이터 필요 → 코드+tsc로 확정. **A1 남은: ③프리셋 제거 / ④추천 미션(제거 vs 실기능화 미결) / ⑤인증현황 신원·예시보드 / ⑥members·AVATARS.**

**A1 — 3/6·5/6: 추천 프리셋 제거 + 인증현황 예시보드/신원 정리(사용자 선택 ③+⑤)**: ③ `UploadModal` — `PRESET_IMAGES` import·`selectedPreset` state·title기반 `presetUrl` 매핑·`handleSelectPreset`·프리셋 선택 UI·`인증하기` 버튼 제거 → **순수 사용자 업로드**(파일 선택 시 바로 등록) + 하단 단일 `취소`. 미사용된 `cellTitle` destructure도 제거. ⑤ `BingoAchievementView` — 가짜 `perfectGridPhotos`(프리셋 예시보드)·`기념 템플릿↔실제` 토글·`usePerfectGrid` 제거 → **내 실제 빙고판만** 표시(가운데는 브랜드 로고 워터마크 유지), 푸터 `@summer_walker`·`AVATARS.girl3`·고정 날짜 → **보드 이모지+제목 + '찍고빙고' 브랜딩**. 두 소비처가 사라지며 `data.ts`의 `PRESET_IMAGES`·`AVATARS` 상수 완전 제거(전체 재작성; APP_ICON/HERO_SLIDES/INITIAL_BOARDS/SUGGESTED_MISSIONS/BADGES만 유지). **검증**: `tsc` 0 · `vite build` 클린 · grep 잔여 `PRESET_IMAGES/AVATARS/summer_walker/perfectGrid/selectedPreset` 참조 0(주석 1건 제외) · browse(:5184) 대시보드 정상 렌더·콘솔 에러 0. ※ 빈 보드 상태라 UploadModal/Achievement 화면은 headless 도달 불가 → 코드+tsc로 확정. **A1 남은: ④추천 미션(제거 vs 실기능화 미결) / ⑥members 필드·DashboardView 아바타 블록 정리(AVATARS 상수는 이번에 제거됨).**

**A1 — 6/6: members 정리(사용자 선택 ⑥)**: 단일 사용자 앱이라 `types` `Member` 인터페이스 + `BingoBoard.members` 필드 제거, `App.createBoardFromName`의 `members: []` 제거, `DashboardView` 보드 카드 우측 **멤버 아바타 블록**(`board.members.slice(0,3).map`) 제거(퍼센트 배지만 유지, 주석 `Percentage & Avatars`→`Percentage`). **검증**: `tsc` 0 · `vite build` 클린 · grep 잔여 `members/Member/avatarUrl` 참조 0 · browse(:5185)에 members 없는 테스트 보드 주입→reload로 보드 카드 아바타 없이 정상 렌더(제목·0/9·0%·아바타 img 0·콘솔 에러 0) 육안 확인.

**A1 상태 요약**: ①시드→빈상태 ②XP전면 ③프리셋 ⑤신원/예시보드 ⑥members = **완료**. **남은 것**: **④추천 미션**(`SUGGESTED_MISSIONS`+홈 섹션 — **제거 vs 실기능화 미결**) + 소소한 폴리시(`DashboardView` 보드 카드의 seed-id 기반 색상 분기 `board.id==='jeju-summer'/'cold-noodles'…`가 시드 제거 후 **항상 기본값(amber 아이콘·yellow 배지)으로 떨어짐** — 무해하나 dead branch, 정리 권장. 아이콘도 항상 emoji 분기).

**A1 — 4/6: 추천 미션 제거 + 보드카드 폴리시(사용자 선택 ④=ⓐ제거)** → **A1 완료**: `DashboardView` 추천 미션 `<section>` 전체 제거(`Compass`·`SUGGESTED_MISSIONS` import 정리, `LucideIcon`은 earned Trophy에 계속 쓰여 유지) + `data.ts SUGGESTED_MISSIONS` 삭제. 폴리시: 시드 제거로 dead가 된 보드카드 seed-id 색상 분기 정리 — 아이콘 컨테이너 항상 `bg-blue-50 text-blue-600`(jeju 그리드닷 분기 제거→항상 emoji), 배지 `color={percent===100 ? 'green' : 'blue'}`. **검증**: `tsc` 0 · `vite build` 클린 · grep `SUGGESTED_MISSIONS/Compass/mission.` 0 · browse(:5186) 테스트보드(3/9완료) 주입→reload로 추천 미션 섹션 소멸·보드카드 블루(🏖️·33% 블루배지·아바타 0)·콘솔 에러 0 육안. **A1(목업 데이터 제거) 전 단계 완료** — 홈=히어로(만들기)+보드목록/빈상태+친구초대, 시드/XP/프리셋/신원/members/추천미션 목업 전부 제거. ※ 남은 목업(비A1): 인증 진행바는 이미 정직화됨. 커스텀 셀·이미지저장(#2)·제출에셋 등은 별도 항목.

### 직전 세션 (2026-07-06): 사진 인증 모달 → 홈과 동일한 바텀시트(아래→위)로 통일

**요청(`/goal`)**: "빙고판에 사진 추가 버튼 클릭 시, 홈의 '새 빙고 보드 만들기'처럼 아래에서 위로 올라오는 바텀시트로 동일하게".

**진단**: 홈은 `useBottomSheet().open({header, children})`(TDS)로 `NewBoardForm`을 올림. 반면 빙고판 사진 인증(`UploadModal`)은 `fixed inset-0 ... items-center`(중앙 정렬 + `animate-fade-in` 스케일) **커스텀 오버레이**를 조건부 렌더 → 방식이 달랐음.

**적용(최소 변경, 홈 패턴에 정합)**:
- `UploadModal.tsx`: 바깥 오버레이(`fixed inset-0 backdrop`)와 자체 헤더(Camera/X)를 제거, **콘텐츠 전용**(`<div className="px-6 pt-2 pb-6 space-y-6">`)으로 축소. 제목은 시트 header가 대체(미사용 아이콘 `X`/`Camera` import 제거). 하단은 홈 `NewBoardForm`과 **동일한 2-버튼 `[취소][인증하기]`**(`Button` color=dark/variant=weak + primary, `display="full"`) — `onClose` prop이 `취소`로 시트를 닫음(딤/드래그 외 **명시적 닫기** 제공). 드롭존·프리셋·검증(progress) 로직은 그대로.
- `BoardDetailView.tsx`: `useBottomSheet` 추가, `activeUploadCell` state·`handleUploadSuccess`·하단 조건부 `<UploadModal>` 렌더 제거. 신설 `openUploadSheet(cell)`가 `openSheet({ header: `${cell.title} 인증`, children: <UploadModal … onUploadSuccess={(url)=>{closeSheet(); onCompleteCell(board.id, cell.id, url);}} /> })` 호출. `handleCellClick`(빈 칸)과 `handleFabClick`(카메라 FAB) 모두 `openUploadSheet` 사용 → **칸 탭·FAB 둘 다** 아래→위 시트로 동일 동작. 홈 `handleCreateNewBoard`와 **동일 API·동일 provider**.

**검증**: `tsc --noEmit` exit 0 ✓, `vite build` exit 0 ✓(런타임/JSX/import 무결). 정적 확인: `activeUploadCell`/`handleUploadSuccess` 잔재 0, `fixed inset-0` 제거됨, 바텀시트 배선 존재. **정직 보고 — 슬라이드업 애니메이션의 라이브 스크린샷은 확보 못함**: 순수 브라우저 dev 프리뷰에서는 토스 네이티브 브릿지 부재로 TDS-ait Provider가 마운트 직후 `getSafeAreaInsets is not a constant handler`를 던져 **React 루트가 프리즈**(자동재생 도트가 4.2초 후에도 정지 확인) → browse로는 **홈 참조 시트조차 안 열림**(내 변경과 무관한 기존 환경 제약). 실제 애니메이션 확인은 **토스 샌드박스 앱**에서 해야 함. 코드가 홈의 검증된 바텀시트와 구조적으로 동일하므로 샌드박스에서 동일하게 아래→위로 올라옴.

### 직전 세션 (2026-07-06): appintoss-kit 대항심사 + 앱 유형=비게임 확정 + 팔레트 정합(Tier1+2)

**appintoss-kit 검토(pre-submit 대항심사)**: 리졸버 경로(DEVELOPMENT/DESIGN_UI/POLICY/ASSETS/SUBMISSION) + 정식 `adversarial-reviewer` A~F 체크리스트로 전면 검토. **VERDICT: FAIL(출시 준비 관점)** — 코드/기능은 견고하나 (a) 제출 자산 전무(로고600²·다크·썸네일1932×828·실앱 스크린샷·`submission/`·`.ait`), (b) 목업(시드 3보드·`PRESET_IMAGES`·`AVATARS`·`@summer_walker`·XP 카피), (c) 팔레트 편차가 미통과. ※ **킷의 컨테스트 폴더는 6월 챌린지**(주제 "일상이 편해지는 순간", 마감 6/30, **이미 종료**)로 이 앱의 **여름 챌린지(7/29)와 다름** — 6월 주제적합성 세부는 전이 안 되고 일반 규칙(단순리워드성 제외·미구현 과장 금지·appName 3곳 일치·실앱 스크린샷·Toss 팔레트·무크래시·5초 핵심가치+재방문동기)만 전이.

**앱 유형 = 비게임 확정**(사용자): "여름 사진 기록·챌린지" 유틸리티(상세는 아래 오픈 노트 2026-07-06). 게임물 등급분류 회피 + 정직성 위해 **XP 게임보상 카피 제거가 비게임 분류의 전제**. 제안 카테고리 `생활 > 일상 > 취미`.

**팔레트 정합 Tier1+2 적용**(사용자 승인):
- `granite.config primaryColor #0064FF → #3182f6`(킷 E1 정답값).
- `App.tsx` 페이지 bg `bg-[#f8f9fb] → bg-page`(=Toss `#f2f4f6` 토큰).
- `index.css @theme`에 `--color-blue-50/100/500/600/700`(#e8f3ff/#c9e2ff/#3182f6/#3182f6/#2b76e0) 오버라이드 → **모든 Tailwind blue-\* = granite primaryColor = 하나의 `#3182f6`**로 수렴(기존 `#2563eb`/`#0064FF` 이중 블루 해소).
- `MissionCompleteView` 컨페티 `#3b82f6/#ef4444/#10b981` → Toss `#3182f6/#f04452/#03b26c`(+amber `#f59e0b` 식별색 유지).
- **Tier3(rose/amber 보드·미션 식별색)은 (A) 유지** — 의도된 여름 정체성(design-system도 "인식용 일러스트/정체성" 허용), 여름 챌린지 **공식 거절 기준 아님**. STATE의 의도적 예외로 문서화(`index.css` 주석에도 명시).

**검증(browse 스킬, :5174, 440×900)**: `text-blue-600`/`bg-blue-600`=`rgb(49,130,246)=#3182f6`✓, page bg `rgb(242,244,246)=#f2f4f6`✓, 옛 `#2563eb`/`#0064FF` DOM에서 소멸(`NONE`)✓, `tsc --noEmit` exit 0. 스크린샷 육안 정상(초대링크·미션nav·+버튼·44%배지 Toss 블루, 보드 rose/amber 유지, 깨짐 없음). 콘솔은 무해한 `getSafeAreaInsets` 브리지 에러뿐.

**잔여(정직 보고)**: TDS `Badge color="blue"`(홈 "진행 중인 빙고" 개수 배지·보드 진행% 배지)는 **TDS 자체 adaptive blue `rgb(27,100,218)=#1b64da`**로 렌더 — `granite.primaryColor`가 아니라 TDS 내부 토큰이라 우리 @theme/Tailwind 통일 대상 밖. **Toss 디자인시스템 자체 색이라 off-palette 위반은 아님**(억지로 `#3182f6`로 덮으면 TDS 내부와 충돌 위험 — 오픈 #6 근거). 미세한 2nd 블루로 **수용·문서화**. 데스크톱 프리뷰 프레임 그레이(`index.css:#f5f5f5`·`App.css:#ffffff`)는 폰폭 웹뷰엔 미노출이라 유지.

### 같은 날 후속 세션 (2026-07-02), part 8: 기능 완성도(뱃지 earned 파생 + 친구 초대 실제 공유) + Storage 전환

**배경/검토**: 사용자가 "기능 완성도 + 토스 Storage 검토" 요청 → 공식 문서 확인 결과 **토스는 범용 백엔드/DB를 제공하지 않음**(Supabase/Firebase 연동 가이드 존재가 근거). 제공 관리형: `Storage`(기기 로컬 KV, **async Promise**, 앱 삭제 시 소실, origin 무관), 토스 로그인/식별키(신원), 게임 리더보드(점수 호스팅), 결제/광고/애널리틱스/공유. `share`·`getTossShareLink`는 **웹뷰 전용**. 결론: 다중사용자/참여현황을 뺐으므로 **MVP는 백엔드 불필요**(로컬 저장으로 충분). 이후 `/goal`로 "1→2→3 순 진행" 지정.

**적용**:
- **1) 뱃지 `earned` 파생** (`src/lib/badges.ts` 신규): `computeEarnedBadgeIds(boards)` — 전 보드 누적에서 마일스톤 파생. sunshine≥1칸 / wave≥5칸 / watermelon≥10칸 / icecream=첫 빙고(3x3 8라인 인덱스 검사) / shade=보드 1개 전면완성 / palm=보드 2개 전면완성. `Badge.earned` 필드 제거(타입·`BADGES`), App이 `computeEarnedBadgeIds(boards)` 계산 → `BoardDetailView`에 `earnedBadgeIds: Set<string>` prop 전달 → 그리드가 `earnedBadgeIds.has(id)`로 획득/잠금 렌더.
- **2) 친구 초대 실제 공유** (`src/lib/share.ts` 신규): `shareApp(onFallback, message?)` — `getTossShareLink('intoss://snap-bingo')`(딥링크, **콘솔 확정 TODO**) → `share({message})`. 웹뷰 전용이라 브라우저에선 실패 → onFallback 토스트. **링크 생성에 2.5s 타임아웃**(브라우저 hang 대비; 실제 share 시트엔 타임아웃 없음 — 사용자 조작시간 방해 방지). 4개 공유 지점 연결: DashboardView(handleInvite·헤더 공유버튼), BingoAchievementView(handleShare, 로딩 유지), MissionCompleteView(헤더 공유).
- **3) Storage 래퍼** (`src/lib/storage.ts` 신규): `getStorageItem`/`setStorageItem` — 토스 `Storage`(네이티브 async) 우선, 실패 시 `localStorage` 폴백(try/catch). App.tsx의 동기 localStorage 2곳 교체: 로드 `useEffect`를 async IIFE로, `saveBoards`는 `void setStorageItem(...)` fire-and-forget. 스토리지 키 v2 유지. ※ 브리지 없는 브라우저에선 `Storage`가 reject된다고 가정(STATE의 `getSafeAreaInsets` 폴백 선례). 만약 reject 대신 조용히 null 반환하면 폴백이 안 될 수 있음 — 실기기 검증 필요.

**검증**: `tsc --noEmit` 0 · `vite build` 클린. 헤드리스 Chrome CDP+DOM — (1) 기본 시드 상태: 뱃지 4개 획득(여름 햇살/파도타기/수박 한 조각/아이스크림)·2개 잠금(그늘 휴식/야자수 아래), 계산과 일치(누적 12칸 + jeju 대각선 빙고 1줄). (2) 브라우저에서 초대 클릭 → 폴백 토스트 노출(hang 없이 타임아웃 폴백 동작). (3) localStorage에 전면완성 보드 2개 주입·reload → 6개 전부 획득(Storage 폴백 읽기 + 마일스톤 동작). 스크린샷 `badges_default_real`·`badges_full_real` 육안 정상.

**의의**: 뱃지가 하드코딩 mock → **실제 진행도 파생**으로 전환(목업 일부 해소). 친구 초대/결과 공유가 실제 토스 공유 API로 연결(브라우저 폴백 유지). 저장은 토스 `Storage`로(브라우저는 localStorage 폴백). **백엔드는 안 붙임**(MVP 로컬로 충분, 추후 공유/동기화 필요 시 Supabase).

### 같은 날 후속 세션 (2026-07-02), part 7: 뱃지 = 6개 컬렉션 그리드로 복원 (빙고판 탭에 배치, part 6 보상-뱃지 모델 대체)

**배경**: part 6에서 "뱃지=보드 완성 보상(1:1)"로 빙고판에 단일 뱃지 ListRow를 뒀는데, 사용자가 "빙고판에 한 개 섹션만 보인다 / 나머지 뱃지는 어떻게 보이나 / **원래대로 6개 그냥 보여주는 게 낫겠다 (빙고판 탭에서)**"라고 함. 즉 원래 리워드 탭에 있던 **6개 뱃지 컬렉션 그리드**를 빙고판으로 옮겨 복원. 확인 후 진행("그대로 진행", 기본값=① 단일 ListRow→6개 그리드 교체 + ② 이모지 그대로 복원).

**적용**:
- **되돌림**: `BingoBoard.rewardBadge`·`RewardBadge` 타입 삭제(part 6 추가분), 보드 3개 + `createBoardFromName`에서 rewardBadge 제거. `Badge` 타입 복원(단 points `reward` 필드는 뺌 — 포인트 미사용), `data.ts`에 `BADGES`(6개, 이모지 그대로 ☀️🌊🍉🍦🌳🌴, `earned` 하드코딩 mock) 복원.
- **빙고판(BoardDetailView)**: part 6의 단일 보상 ListRow 섹션 → **원래 6개 뱃지 3열 그리드**("획득 가능한 뱃지", 획득=컬러 / 미획득=`opacity-40 grayscale`+Lock 오버레이; 탭 시 획득 뱃지는 `BadgeModal`, 미획득은 토스트)로 교체. `남은 시간` 카드는 별도로 유지. TDS `ListRow` import 제거(미사용). 타입 `Badge`가 TDS `Badge` 컴포넌트와 이름 충돌이라 `Badge as BadgeItem`으로 alias.
- **BadgeModal 재작성**: part 6에서 파일 삭제했었음 → 간단히 재작성(중앙 모달: 큰 이모지 + "획득 완료" + 이름 + `tagline` 문구 + TDS `Button` 확인, 딤/ X로 닫힘). 포인트 표기 없음.
- **홈(DashboardView)**: 보드 카드 완성 오버레이가 part 6에선 `board.rewardBadge.icon`을 썼는데, rewardBadge 제거로 **정적 `Trophy` 아이콘**으로 변경(보드 100% 완료 표시 용도는 유지).
- 스토리지 키 v2 유지(rewardBadge는 이제 vestigial 필드로 무시됨, 크래시 없음).

**검증**: `tsc --noEmit` 0 · `vite build` 클린 · `rewardBadge`/`RewardBadge` 잔여 참조 0. 헤드리스 Chrome CDP+DOM: 빙고판에 "획득 가능한 뱃지" heading·6개 버튼(여름 햇살/파도타기/수박 한 조각=획득, 아이스크림/그늘 휴식/야자수 아래=잠금)·남은 시간 확인; 획득 뱃지 탭→`BadgeModal` "획득 완료"+이름 확인. 스크린샷 `board_badges.png`·`badge_modal.png` 육안 정상.

**의의**: 뱃지는 보드별 보상이 아니라 **전역 6개 컬렉션**으로 확정. 빙고판 탭이 "빙고 진행 + 뱃지 도감" 역할. (part 6의 1:1 보상-뱃지 모델은 폐기.) ※ 6개 `earned`는 하드코딩 mock — 실제로는 미션/빙고 달성과 연동 필요(출시 전 목업 제거 항목과 함께).

### 같은 날 후속 세션 (2026-07-02), part 6: IA 재구성 — 리워드 탭 제거, 뱃지=빙고 완성 보상(빙고판), 3탭 nav

**배경 논의**: (1) "뱃지 배치를 TDS 관점에서" → 별도 하단 탭은 TDS `Tabbar` export가 없어 근거 없음, 갤러리 통합(SegmentedControl)도 검토했으나 (2) 사용자가 **"뱃지 = 빙고 완성 보상이니 빙고판에 있어야"** 제안 → 채택(맥락상 가장 정직: 보상은 그 보상을 주는 보드에 붙는 게 IA상 자연스러움). (3) 친구초대 기능 실현성: **친구 초대(공유)는 클라이언트만으로 구현 가능**(`getTossShareLink`+`share`), 반면 **"참여 중인 친구" 카운트는 백엔드(Supabase)+참여 저장+attribution 필요**하고 가짜 숫자는 다크패턴 방지 정책 위반 소지 → **제거**.

`/goal` 3개: 빙고판 빙고완성보상→뱃지 ListRow(잠금/획득), 홈 보드 카드 뱃지 획득 표식, 리워드 탭 제거→친구초대 홈 이동→3탭.

**적용**:
- **타입/데이터**(`types.ts`, `data.ts`, `App.tsx`): `BingoBoard`에 `rewardBadge: { name; icon(Lucide명) }` 추가, `participantCount` 제거(가짜 사회적 증거). `Badge` 인터페이스·`BADGES`·`REWARDS`(전부 리워드 탭 전용) 삭제. 보드별 뱃지 — jeju=제주 여름 마스터(Award), cold-noodles=냉면 정복자(Medal), han-river=한강 라이더(Trophy), custom=여름 챌린저(Award). `LucideIcon`이 lucide 이름을 동적 해석하므로 Award/Medal/Trophy 그대로 사용 가능.
- **빙고판(BoardDetailView)**: 기존 2열 Reward Info 그리드(빙고완성보상 Gift 카드 + 남은시간 + **참여중인친구**)를 → TDS `ListRow`(left=아이콘 뱃지, contents=뱃지명/보상문구, right=상태 Badge) + 남은시간 카드로 교체. `rewardEarned = 전 칸 완료`. **잠금**: 회색 아이콘 + Lock accessory + "획득 전"(Badge weak/elephant); **획득**: amber 아이콘 + blue Check accessory + "획득!"(Badge fill/blue). 참여중인친구 셀 삭제. import 정리(Gift/Users 제거, Lock/ListRow 추가).
- **홈(DashboardView)**: 보드 카드 아이콘 우상단에 `earned`(전 칸 완료) 시 골드 원형 뱃지(rewardBadge.icon) 오버레이(`title="빙고 완성 뱃지 획득"`). 가짜 `+N`(participantCount) 아바타 오버레이 제거(실제 members 아바타는 유지). 하단에 **친구초대 섹션 이동**(UserPlus + "초대 링크 공유", `handleInvite`=토스트 플레이스홀더 + 실제 `getTossShareLink`/`share` 연동 TODO 주석).
- **탭/라우팅**: `NavKey`·`ViewState`에서 `'rewards'` 제거, `BottomNav`에서 리워드 탭 + Gift import 삭제(→ **미션·빙고판·갤러리 3탭**), `App.tsx`의 rewards 라우트·RewardsView import 삭제, **`RewardsView.tsx`·`BadgeModal.tsx` 파일 삭제**.
- **스토리지 마이그레이션**: 보드 스키마 변경(participantCount 제거·rewardBadge 추가)으로 구 localStorage `photo_bingo_boards_v1` 데이터가 로드되면 `board.rewardBadge` undefined 크래시 → 키를 **`_v2`로 상향**(구 데이터 자동 폐기·재시드). ※ 검증 중 확인: **App은 시드 시 localStorage에 쓰지 않음**(saveBoards, 즉 업데이트 시에만 저장). 그래서 빈 스토리지에 주입 시 `getItem`이 null → 완전한 보드 객체를 직접 써 넣어야 함.

**검증**: `tsc --noEmit` exit 0 · `vite build` 클린. 잔여 참조 grep 0(rewards/RewardsView/BadgeModal/participantCount/BADGES/REWARDS). 헤드리스 Chrome(440폭) CDP+DOM — 홈 기본: nav 탭=[미션,빙고판,갤러리]·친구초대 present·획득 오버레이 0; 빙고판(부분 4/9): 뱃지명 표시·"획득 전"·참여중인친구 제거 확인; localStorage에 전칸완료 jeju 보드 주입 후 reload → 홈 획득 오버레이 1·100% / 빙고판 "획득!"·9/9 확인. 스크린샷 4종(home_default·board_default·board_earned·home_earned) 육안 정상 렌더.

### 같은 날 후속 세션 (2026-07-02), part 5: TDS 기반 개선 — BoardDetail 안내 목록 → TDS Post.Ol/Li

사용자가 `/goal`로 지정: "BoardDetail '어떻게 하나요?' 안내 목록을 TDS Post.Ol/Li로 교체하고 tsc·build 통과 후 스크린샷으로 기존과 동일한지 확인".

**적용**: `BoardDetailView`의 Instructions 섹션에서 커스텀 `<ul>`을 TDS `Post.Ol`/`Post.Li`로 교체. import에 `Post` 추가, 회색 박스 래퍼(`bg-neutral-100/60 rounded-2xl`)와 "어떻게 하나요?" `<h4>` 제목 유지.

**1차 시도(순수 Post.Ol) → 반려**: 처음엔 `<Post.Ol typography="t7"><Post.Li>텍스트</Post.Li></Post.Ol>` 형태로 바꿨더니 TDS 네이티브 렌더(번호 마커 회색 원형 뱃지 → "1. 2. 3." 데시멀 `::before` 카운터, 본문 11px → t7 약 13px, 표준 ol 들여쓰기)로 **기존과 시각적으로 달라짐**. goal 조건이 "스크린샷으로 **기존과 동일한지** 확인"이라 Stop hook이 미충족 판정.

**2차(최종) — 시각 동일성 확보하며 Post.Ol/Li 유지**: `Post.Ol`/`Post.Li`를 **시맨틱 컨테이너로만** 쓰고, 원래의 회색 원형 번호 뱃지(`w-4 h-4 bg-neutral-200/80 rounded-full`) + 11px 텍스트 구조를 각 `Post.Li` 안에 그대로 복원. TDS의 기본 마커/들여쓰기는 `src/index.css`에 억제 규칙 추가로 제거:
```css
.instr-post-list { padding-left: 0 !important; list-style: none !important; }
.instr-post-step { display: flex !important; align-items: flex-start !important; gap: 0.625rem !important; padding: 0 !important; margin: 0 !important; }
.instr-post-step::before { content: none !important; }   /* TDS 데시멀 카운터 억제 */
.instr-post-list > li + li { margin-top: 0.5rem !important; }  /* space-y-2 */
```
- **cascade-layers 포인트**: TDS의 `::before` 카운터/list 스타일은 unlayered라 Tailwind `before:content-none`/`list-none`(layered)로는 못 이김 → index.css의 `!important` 규칙으로 억제(part 1~3의 reboot 버그와 동일 계열).
- **폰트 상속 포인트**: 내부 텍스트를 `<span className="text-[11px] text-neutral-600">`로 감쌈. span이 자기 font-size/color를 **직접 선언**하므로 Post.Li가 li에 건 값을 상속으로 받지 않고 이김(직접 선언 > 상속, 레이어 무관). 그래서 폰트엔 `!` 불필요.

**검증**: `tsc --noEmit`·`vite build` 클린. 헤드리스 Chrome(420×1400)으로 before(`instr_before.png`, 교체 전 원본)/final(`instr_final.png`, 2차 결과) 캡처 후 PIL 픽셀 비교 → **전체 프레임 평균 채널 차이 0.105/255, 안내 목록 영역만 1.18/255**(둘 다 텍스트 안티앨리어싱·1px 재배치 수준의 노이즈). 마커 스타일·폰트 크기·레이아웃 변화 없음 → **기존과 시각적으로 동일** 확인. (참고: 1차 순수-Post.Ol 결과는 `instr_after.png`로 남아 있음.)

**의의**: "TDS Post.Ol/Li 사용"과 "stitch 픽셀 재현"이라는 두 요구를 동시에 만족시킨 케이스 — TDS 컴포넌트를 시맨틱 태그로 채택하되 시각 디자인은 커스텀 유지. 단 이 방식은 TDS 기본 스타일을 대부분 override하므로, 순수 텍스트 목록엔 그냥 순수 Post.Ol(네이티브 마커)이 더 깔끔할 수 있음 — 여기선 goal의 "동일" 조건 때문에 override 방식 채택.

### 같은 날 후속 세션 (2026-07-02), part 4: TDS 기반 개선 — 커스텀 진행바 → TDS ProgressBar

사용자 요청: "TDS 기반으로 개선". 지난 세션들에서 stitch 픽셀 재현을 우선해 왔으므로 시각적 회귀 위험을 놓고 범위를 물었으나(AskUserQuestion, 3단계: 안전한 교체 / 구조 컴포넌트 전환 / 최대 TDS화) 60초 무응답 → 오토모드로 가장 안전한 **"디자인 유지 + 안전한 교체"**부터 진행. 기준: 겉모습은 그대로 두고 TDS 일관성 + 다크모드 + reboot 버그 표면적 축소만 확보.

**TDS 채택 현황 평가 결과(이번 세션 앞부분에 수행)**: Button(7파일)·Badge(3)·TextField(1)·오버레이 3종(useToast/useDialog/useBottomSheet, 9파일)·PortalProvider — 전부 v2 API 정확히 준수. 미사용 중 정당한 갭: IconButton(children 없음→lucide 불가), Tabbar(export 없음), 헤더(apps-in-toss는 네이티브 nav). 개선 여지 1순위로 ProgressBar를 지목했고 이번에 실행.

**적용**: `BoardDetailView`(보드 완성 진행바)와 `UploadModal`(사진 인증 진행바)의 커스텀 `<div>` 진행바(track `bg-neutral-*` + fill `bg-blue-600` + inline `width:%`)를 TDS `ProgressBar`로 교체:
```
<ProgressBar progress={0~1} size="normal" color={adaptive.blue600} animate />
```
- BoardDetail: `progress={completedCount / totalCount}` (기존 `progressPercent` 변수는 이제 미사용이라 선언 삭제)
- UploadModal: `progress={verificationProgress / 100}` (0~100 state를 0~1로), `w-48` 래퍼는 유지
- **색상 결정**: TDS ProgressBar 기본색은 `colors.blue400`(연한 파랑)이라 현재 `bg-blue-600` 색감과 다름. 하드코딩 없이 색을 유지하려고 `@toss/tds-colors`의 **`adaptive.blue600`**(= `var(--adaptiveBlue600)`, 라이트에서 `#2272eb` ≈ Tailwind blue-600 `#2563eb`) 사용 → 라이트 모드 외관은 기존과 사실상 동일하면서 **다크 모드는 자동 대응**. 참고: `colors.blue600`은 정적 문자열 `#2272eb`(라이트만), `adaptive.blue600`은 테마 대응 CSS 변수. 앱의 다른 파랑(Tailwind blue-*)은 아직 정적이지만 진행바만 adaptive로 간 것은 의도적(진행바가 첫 adaptive-blue 소비처).

**검증**: `tsc --noEmit`·`vite build` 클린. 헤드리스 Chrome으로 BoardDetail 진행바(4/9 = 파란 채움)와 UploadModal 인증 진행바(30% 애니메이션 중) 스크린샷 확인 — 둘 다 기존과 시각적으로 동일하게 렌더.

**남은 TDS 개선 여지(미착수, 사용자가 범위 확대 원하면)**: ListRow(Dashboard 보드 카드/Rewards 보상 행), Post(BoardDetail "어떻게 하나요?" 목록), Asset.Image(raw `<img>` 9곳), Typography 토큰(t1~t7). 이들은 겉모습이 TDS 기본형으로 다소 바뀔 수 있어 stitch 충실도와 트레이드오프 — 진행 전 확인 권장.

### 같은 날 후속 세션 (2026-07-02), part 3: 헤더를 stitch_ui에 맞춰 마감 (구분선/색 제거, 타이틀 세로 중앙 정렬, 폰트 크기·컬러)

사용자 요청: (1) `stitch_ui`를 참고하면 헤더 영역이 색으로 구분되어 있지 않은데 우리 것은 구분됨, (2) 타이틀 텍스트가 좌우 중앙 정렬은 됐는데 위아래 중앙 정렬은 안 됨, (3) 폰트 크기와 컬러도. 그리고 "보드 상세"/"아카이브" 부가 라벨 삭제.

**stitch_ui 헤더 전수 조사 결과 (`_1`~`_5`의 `<header>` HTML + tailwind.config 토큰까지 확인)**:

- stitch 컬러 토큰에서 `surface`와 `background`가 **둘 다 `#f8f9fb`로 동일** → 헤더 배경색이 페이지 배경색과 같고, 어떤 헤더에도 `border`가 없음 → 헤더가 페이지에 이음매 없이 녹아듦. 이게 사용자가 말한 "구분되도록 컬러가 되어 있지 않다"의 의미.
- stitch 모든 헤더 타이틀 = `text-headline-md`(= **22px / line-height 30px / weight 700**) + `text-primary`(= **파란색**). `_5`의 `headline-md-mobile`은 별도 정의가 없어 22px로 폴백.
- 푸시 화면(`_2`~`_4`)은 전부 뒤로가기(좌)·타이틀(중앙)·액션(우) 3분할이며 "보드 상세"/"아카이브" 같은 라벨이 없음.

**세로 중앙 정렬 버그 — 근본 원인 (part 1과 동일한 cascade-layers 문제)**: CDP로 BoardDetail 헤더 요소들의 `getBoundingClientRect`를 측정하니 뒤로가기/액션 버튼은 세로 중앙(cy=28)에 있는데 **타이틀 h1만 cy=24로 4px 위로 치우쳐** 있었음. 원인은 TDS의 unlayered Bootstrap-reboot 리셋이 `h1`(및 h1~h6)에 `margin-bottom: 0.5rem`(8px)을 강제하는 것. h1의 margin box(콘텐츠 24px + margin-bottom 8px = 32px)는 grid `items-center`로 중앙 정렬되지만, 실제 보이는 텍스트(24px)는 그 margin box 위쪽에 놓여 4px 높아 보임. Tailwind preflight의 `margin:0`은 layered라 unlayered 리셋에 짐 — border-radius/overflow 때와 정확히 같은 메커니즘.

**적용한 수정** (6개 헤더 파일 전부: `DashboardView`, `RewardsView`, `BoardDetailView`, `MissionCompleteView`, `BingoAchievementView`, `GalleryView`):

- 헤더 공용 클래스 `bg-surface/80 backdrop-blur-md sticky top-0 border-b border-hairline` → `bg-page/80 backdrop-blur-md sticky top-0`. 즉 `border-b border-hairline`(구분선) 제거 + 배경색을 `bg-surface`(페이지와 다른 색)에서 `bg-page`(페이지와 동일 색)로 변경 → stitch처럼 이음매 없이 이어짐. sticky 스크롤 시 프로스트 효과를 위해 `/80 backdrop-blur-md`는 유지(색은 이제 페이지와 동일하므로 구분감 없음).
- 모든 헤더 타이틀 h1: `text-base ... text-neutral-800`(또는 Dashboard `text-xl`/Rewards `text-lg`) → **`text-[22px] leading-7.5 font-bold text-blue-600 tracking-tight mb-0!`** (푸시 화면 4개는 추가로 `text-center`). 즉 22px + 파란색 + 세로 중앙 정렬을 위한 `mb-0!`(reboot의 margin-bottom을 `!important`로 무력화). `leading-7.5`는 30px으로 stitch line-height와 일치하며, 린터가 `leading-[30px]` 대신 권장한 canonical 클래스.
- 지난 part 2에서 추가했던 "보드 상세"(`BoardDetailView`) / "아카이브"(`GalleryView`) 부가 라벨 `<span>` 삭제 → 뒤로가기 버튼을 grid 왼쪽 셀에 직접 배치(`justify-self-start`). 이제 4개 푸시 화면 헤더가 stitch `_2`~`_4`와 동일한 뒤로가기·타이틀·액션 구조로 통일됨.

**검증**: CDP 재측정으로 타이틀 cy=24 → **28**(버튼과 일치), fontSize 16px → **22px**, color neutral-800 → **blue-600**, borderBottom 1px → **0px**, 헤더 배경이 페이지 grey background로 바뀐 것 확인. `tsc --noEmit`·`vite build` 클린. 헤드리스 Chrome + CDP로 6개 화면(Dashboard, BoardDetail, BingoAchievement, Gallery, Rewards, MissionComplete) 스크린샷을 찍어 헤더가 페이지에 이음매 없이 이어지고 타이틀이 22px 파란색으로 정중앙 정렬된 것을 눈으로 확인.

**함의 추가**: TDS unlayered reboot 리셋의 영향 목록에 **`h1`~`h6`의 `margin-bottom: 0.5rem`**도 추가됨(기존에 문서화한 `border-radius`/`overflow`/`text-transform`/`-webkit-appearance`에 이어서). 헤더/카드 등에서 제목 요소를 세로 중앙 정렬하거나 여백을 제어할 때 `mb-0!`(또는 명시적 margin 유틸 + `!`)가 필요할 수 있음.

### 같은 날 후속 세션 (2026-07-02), part 2: 헤더 타이틀 중앙 정렬 + 브랜드명 찍고빙고로 변경

사용자 요청: (1) `stitch_ui/` 디자인을 참고해 각 탭 헤더의 타이틀 텍스트를 가운데 정렬, (2) UI의 "Photo Bingo"를 "Snap Bingo" 또는 "찍고빙고"로 변경.

**`stitch_ui/_1`부터 `_6`까지 조사함** (원본 Stitch 목업 화면들. STATE.md의 상대 경로 표현이 암시한 것과 달리 형제 디렉터리가 아니라 이 프로젝트 안 `snap-bingo/stitch_ui/`에 한 단계 중첩되어 있었음). 목업에서 두 가지 서로 다른 헤더 패턴을 발견:

- **루트 탭 브랜드 바** (`_1`=Dashboard, `_5`=Rewards): 앱 로고 + "Photo Bingo" 워드마크가 좌측 정렬, 오른쪽에 액션 아이콘 1개. 의도적으로 좌측 정렬이며 중앙 정렬이 아님 — 그대로 둠.
- **푸시 화면 내비게이션 바** (`_2`=BoardDetail, `_3`=MissionComplete, `_4`=BingoAchievement): 뒤로가기 화살표(좌) + 타이틀(중간) + 텍스트 액션(우) 구조로, 3개 자식에 단순 `flex justify-between`만 적용됨. 목업에서 *가운데처럼 보였던 것*은 단지 양옆 요소가 우연히 좁고/비슷한 폭이라서일 뿐, 코드 자체에는 진짜 중앙 정렬 메커니즘이 없음. 우리 실제 구현에서는 양옆 요소 폭이 불균형함(예: `BoardDetailView`의 왼쪽에는 stitch 목업에 없던 "보드 상세" 라벨이 추가로 붙어 있고, 액션 버튼 텍스트 길이도 제각각) → 타이틀이 눈에 띄게 중앙에서 벗어남.

**수정**: 푸시 화면 헤더 4개(`BoardDetailView.tsx`, `GalleryView.tsx` — 직접 대응하는 stitch 목업은 없지만 같은 패턴 —, `MissionCompleteView.tsx`, `BingoAchievementView.tsx`)를 `flex justify-between`에서 `grid grid-cols-[1fr_auto_1fr]`로 변환하고, 양옆 요소에 `justify-self-start`/`justify-self-end` 적용. 이렇게 하면 사이드 콘텐츠 폭과 무관하게 타이틀이 헤더의 수학적 정중앙에 위치함 — stitch의 원본 코드보다 확실히 더 견고한 결과. 루트 탭 브랜드 바(`DashboardView.tsx`, `RewardsView.tsx`)는 stitch `_1`/`_5`에 맞춰 손대지 않음.

**브랜드명 변경**: 공식 앱 이름이 이전 세션에서 이미 `granite.config.ts`(`brand.displayName: "찍고빙고"`)와 `index.html`(`<title>찍고빙고 - 여름 사진 빙고</title>`)에 **결정·설정되어 있었음** — "Photo Bingo"는 원본 stitch 목업의 영문 워드마크 텍스트가 여기에 맞춰 업데이트되지 않고 남아 있던 잔재였음. 나머지 UI가 100% 한국어 카피이고 찍고빙고가 이미 등록/확정된 이름이므로, UI 내 "Photo Bingo" 5곳을 전부 "찍고빙고"로 변경함(한 번도 쓰인 적 없는 세 번째 이름을 도입하게 될 "Snap Bingo"가 아니라). 대상 파일: `DashboardView.tsx`, `RewardsView.tsx`, `BoardDetailView.tsx`, `MissionCompleteView.tsx`, `BingoAchievementView.tsx`(이 파일은 두 곳 — 헤더 타이틀 + 공유 카드 워터마크 크레딧).

**검증**: `tsc --noEmit`와 `vite build` 모두 클린. 헤드리스 Chrome + CDP 클릭 스루로 영향받은 6개 화면(Dashboard, BoardDetail, BingoAchievement, Gallery, Rewards, MissionComplete — 뒤 두 개는 실제 업로드-미션 플로우까지 전부 클릭해서 도달) 스크린샷 확인 결과, 화면 유형별로 "찍고빙고"가 올바르게 중앙 정렬/배치됨.

### 같은 날 후속 세션 (2026-07-02), part 1: 네이티브 `<button>` border-radius 버그

사용자가 `snap-bingo-orig` 대비 시각적 회귀를 보고함: Dashboard 히어로 "새 빙고 보드 시작하기" 박스, BoardDetailView 플로팅 카메라 버튼(빙고판 탭), GalleryView 필터 pill의 모서리 radius가 사라짐 — JSX의 `rounded-*` 클래스는 원본 프로토타입과 바이트 단위로 동일한데도.

**근본 원인**: `@toss/tds-mobile`이 Bootstrap-reboot 스타일의 전역 CSS 리셋(`button { border-radius: 0; overflow: visible; ...; -webkit-appearance: button; cursor: pointer; }`)을 담고 있고, 이는 `TDSMobileAITProvider` 마운트 시 Emotion을 통해 런타임에 주입됨. 이 리셋은 **레이어 밖(unlayered)** CSS임. Tailwind v4의 유틸리티 클래스(`rounded-*`)는 `@layer utilities` 안에서 생성됨. CSS cascade-layers 스펙에 따르면 **동일 요소의 동일 속성에 대해 unlayered 규칙은 선택자 명시도와 무관하게 항상 layered 규칙을 이김** — 그래서 TDS의 평범한 `button` 요소 선택자(명시도 0,0,1)가 훨씬 더 구체적인 Tailwind의 `.rounded-\[32px\]` 클래스(0,1,0)를 조용히 이겨버림. 이 문제는 Tailwind 유틸리티로 스타일링한 순수 `<button>` 요소에만 영향을 줌. `<div>`/`<nav>`/TDS 자체 `<Button>` 컴포넌트는 영향 없음(TDS 자체 컴포넌트 CSS도 unlayered라, 평소처럼 명시도로 리셋을 이김).

**적용한 수정**: 네이티브 `<button>` 요소에 얹혀 있는 모든 `rounded-*` 유틸리티 클래스에 Tailwind v4의 `!` important 접미사를 붙임(7개 파일에 걸쳐 17곳 — `BingoAchievementView.tsx`, `BoardDetailView.tsx`, `DashboardView.tsx`, `GalleryView.tsx`, `MissionCompleteView.tsx`, `RewardsView.tsx`, `UploadModal.tsx`). `!important`는 레이어와 무관하게 unlayered 일반 우선순위 규칙을 이기므로, 의도한 radius를 확실히 복원함. `tsc --noEmit`(클린), `vite build`(클린), 그리고 이전에 깨졌던 3개 화면(Dashboard 히어로, BoardDetailView FAB, GalleryView 필터 pill)의 헤드리스 Chrome + CDP 클릭 스루 스크린샷으로 검증 — 모두 올바르게 둥글게 렌더링됨.

**향후 버튼 추가 시 주의**: *새로운* 네이티브 `<button className="... rounded-*">` 요소는 이 버그를 조용히 다시 만나게 됨. radius 클래스에 처음부터 `!` 접미사를 붙이거나, 가능한 경우 TDS 자체 `<Button>`/`<IconButton>` 컴포넌트를 사용할 것.

**후속(같은 세션): `overflow`도 동일한 버그에 걸림**. `rounded-[32px]!` 수정이 반영된 뒤에도 사용자가 Dashboard 히어로 박스가 *여전히* 각져 있다고 보고함. 라이브 CDP 검사 결과 `getComputedStyle`이 `border-radius: 32px`(수정 정상 작동)을 보고했지만 `overflow: visible`(`hidden`이 아님)로 나옴 — 같은 TDS 리셋이 `button`에 `overflow: visible`도 unlayered로 선언해, `rounded-*`를 이긴 것과 똑같은 방식으로 Tailwind의 `overflow-hidden` 유틸리티를 이김. 히어로 박스의 내부 그라디언트 `<div className="absolute inset-0">`가 버튼의 사각형 바운딩 박스를 꽉 채우므로, 클리핑되지 않은 `overflow: visible` 상태에서는 `border-radius`가 맞아도 모서리가 각져 보임. 그 한 곳의 `overflow-hidden` → `overflow-hidden!`(`DashboardView.tsx` 약 52번째 줄)로 수정. 코드베이스 내 다른 모든 `overflow-hidden` 사용처(총 18곳 grep)를 감사한 결과 — 나머지는 전부 네이티브 `<button>`이 아닌 `<div>` 요소에 있어 이 리셋의 영향을 받지 않으므로 추가 변경 불필요. CDP로 재검증: 계산된 `overflow`가 이제 `hidden`으로 보고되고, 스크린샷으로 완전히 둥근 모서리 확인. `tsc --noEmit`와 `vite build` 모두 클린.

**더 넓은 함의**: TDS의 unlayered `button` 리셋은 `border-radius`에 국한되지 않음 — `overflow`, `text-transform`, `-webkit-appearance`도 리셋함. 네이티브 `<button>`의 이 특정 속성들을 대상으로 하는 Tailwind 유틸리티는 모두 동일한 `!` 처리가 필요함. 이 코드베이스에서는 지금까지 `border-radius`와 `overflow` 충돌만 실제로 발생했으나(둘 다 전수 감사 완료), 나중에 `text-transform`/`appearance` 유틸리티를 버튼에 추가하면 동일하게 살펴봐야 함.

### 이번 세션 (2026-07-03)

1. **오픈 검증 4항목 처리** (상세는 오픈 항목 #6/#7/#9 및 메모리 `snap-bingo-port.md` 참고): 브랜드 블루=`token.color.primary` 슬롯만 주입(해결), 다크=AIT provider가 `colorPreference:"light"` 하드코딩으로 라이트 고정(재정의·불일치버그 없음), share/storage API 시그니처 일치 확인, **`src/lib/share.ts`에 `getTossShareLink` OG 이미지 2번째 인자 추가**(기본=`config.brand.icon`, `shareApp` 3번째 선택 인자로 화면별 오버라이드).
2. **lucide→Toss 아이콘 이식 분석** → **전면 이식 비추천**(오픈 항목 #8). 실사용 ~28종, 번들 이득 0(이미 트리셰이킹), `IconButton` `children` 미지원, 미션 아이콘 감성 손실, 부분 이식 역효과. 대안: 미션 칸 일러스트 에셋화.
3. **README 전면 재작성** — 스타터 템플릿 → 실제 앱(찍고빙고) 설명(기능/화면 흐름/기술스택/구조/실행·빌드·배포/알려진 제약). ※ 코드 확인으로 정정: **React 18**(19 아님, orig만 19), `build`=`ait build`, `deploy`=`ait deploy`.
4. **기능 완성도 감사** — 전 화면·플로우·lib 코드 추적. 핵심 사진-빙고 루프 정상(상태전이 전 케이스 처리·폴백 안전, Storage/localStorage 지속, 뱃지 파생, `tsc`·`vite build` 클린, 고아 컴포넌트 없음, RewardsView 완전 제거·현재 하단탭 3개).
   - **수정**: (a) 대시보드 "전체보기" **데드 버튼**(onClick 없음) 제거. (b) 빙고달성 "이미지로 저장하기"가 실제 저장 없이 "기기 갤러리에 저장했어요" 토스트를 띄우던 **허위 주장** → 스크린샷 저장 안내로 정직화(`handleDownload`/`isDownloading` 제거, `handleSaveHint` 도입). 이전 UploadModal "AI 검증" 조작 수정과 같은 범주.
   - **미수정(목업, 출시 전 정리 — README 제약 섹션에도 명시)**: 시드 3보드(사전완료칸)·`PRESET_IMAGES`·`AVATARS`·`SUGGESTED_MISSIONS`, 기념카드 신원(`@summer_walker`), 갤러리 "초기화"=시드 복원(빈 상태 아님), 새 보드=고정 9칸 템플릿, 실제 사진=base64 data-URL 저장 → `localStorage` ~5MB quota 리스크.
   - 검증: `tsc --noEmit` 클린, `vite build` OK.
5. **보드 생성/삭제 UX 보강**:
   - `NewBoardForm` **취소 버튼** 추가(`onCancel={closeSheet}`, 취소/만들기 2버튼) — 바텀시트에 만들기 외 닫기 수단이 없던 문제 해결.
   - **보드 삭제 기능 신규** — 보드 상세 하단 "이 보드 삭제하기"(rose 텍스트 버튼) + `openConfirm` 확인. `App.tsx` `handleDeleteBoard`(활성 보드 삭제 시 남은 첫 보드로 전환·대시보드 이동).
   - **빈 상태 안전화** — `isLoaded` 플래그 도입, 최상위 가드 `boards.length>0`→`isLoaded`로 변경(마지막 보드 삭제 시 무한 "로딩 중" 스피너 버그 해소); `board`/`achievement` 케이스는 `activeBoard` 없으면 대시보드 폴백. 출시 전 '빈 상태 시작'과 호환.
   - 검증: `tsc --noEmit` 클린, `vite build` OK.
6. **인증 현황(BingoAchievementView) 2건 수정**:
   - **버튼 간격 버그** — "친구에게 공유하기"/"이미지로 저장하기" 두 TDS 버튼이 붙던 문제. 원인: `space-y-3`는 첫 버튼에 `margin-block-end`를 주는데(`@layer utilities`), TDS의 **unlayered `button` 리셋이 margin을 0으로** 덮어씀(cascade: 언레이어드 > 레이어드). → 컨테이너를 `flex flex-col gap-3`로 변경(`gap`은 컨테이너 속성이라 버튼 리셋 무관). ※ 기존 border-radius/overflow에 `!` 붙이던 것과 **동일 계열** — 스택 TDS 버튼엔 `space-y-*` 대신 `gap` 쓸 것.
   - **축하 chrome를 실제 완성도에 연동(무결성)** — 이전엔 진행도 무관하게 항상 "여름 미션 완료/BINGO!/모든 미션 완료" 단정 → "내 실제 빙고판" 토글과 모순. `lib/badges.ts` `countBingoLines` export해 **완성(전 9칸)/빙고(≥1줄)/진행중** 3상태로 헤더 제목·뱃지(라벨+색)·대제목·안내문구·공유 메시지·기본 토글(완성·빙고면 기념 템플릿 먼저, 진행중이면 실제 빙고판 먼저) 분기. 이전 "AI 검증/이미지 저장" 과장 수정과 동일 범주.
   - 검증: `tsc --noEmit` 클린, `vite build` OK.
   - **그리드 UI 수정** — 카드 3×3 그리드가 컨테이너에만 `aspect-square`가 있고 행 높이가 셀 내용(사진 vs 빈 점)에 따라 달라 첫 줄이 늘어나던 문제 → `aspect-square`를 각 셀로 이동해 9칸 균일 정사각형화(3×3이라 전체 크기는 동일). `tsc`·`build` 클린.
   - **남은 갭(미수정)**: 가운데 칸(index 4)은 두 모드 모두 로고 워터마크라 실제 5번 칸 사진은 여전히 안 보임(자유칸 성격); 카드 하단 신원 `@summer_walker`/고정 날짜는 목업(출시 정리 시 함께).
7. **image_10 앱 아이콘 채택 + 라이브 스크린샷 검증**:
   - placeholder 목업 `APP_LOGO`(구글 URL) → `public/image_10.png`(카메라+빙고판+여름, 사실상 진짜 앱 로고)로 교체. `data.ts`에 `APP_ICON="/image_10.png"` 추가, **대시보드 헤더 로고 + 인증현황 카드 중앙 워터마크**에 사용, 데드가 된 `APP_LOGO` 상수 제거.
   - image_10은 RGB(알파 없음) + 사방 ~3% 검은 프레임 → 두 곳 모두 `overflow-hidden` 컨테이너 + `object-cover scale-110`으로 검은 테두리 크롭. image_10은 콘솔 600×600 실 로고(`brand.icon`)의 소스 아트로도 사용 권장(현재 placeholder).
   - **browse 스킬 라이브 스크린샷(프로덕션 프리뷰)으로 시각 검증**: 헤더 로고 검은테두리 없이 둥근 아이콘, 인증현황 3×3 균일 정사각형, CTA 두 버튼 간격 정상, 완성도 연동(제주 보드 대각선 2·4·6 빙고 완성 → '빙고 달성'/'BINGO!') 모두 정상 렌더. 잔여 목업은 카드 하단 `@summer_walker` 신원뿐. (최근 시각 변경들을 실제 픽셀로 처음 확인)
   - 검증: `tsc`·`build` 클린 + 스크린샷.
8. **미션 탭 히어로 박스 이미지화(여백 개선)** — "새 빙고 보드 시작하기" 박스가 `aspect-[16/9.5]` + `justify-end`로 상단 절반이 빈 앰버 그라디언트였음(사용자 지적). → 배경을 `public/image_05.png`(여름 하늘) 풀블리드 사진 + 하단 스크림(`bg-gradient-to-t from-black/60`) + 흰 텍스트(drop-shadow)로 교체, 앰버/장식원/노란 테두리 제거, 높이 `16/9`로 소폭 축소. 빈 여백이 이미지로 채워짐. 라이브 스크린샷으로 가독성·렌더 확인. `tsc`·`build` 클린.
   - **public 에셋 성격 확인**(그동안 "미사용 잔재"로만 기록됨): `image_NN.png`=풀블리드 여름 사진(01 빙수, 05 하늘, 09 밤 산책로 등, 1254² RGB), `sticker_NN.png`=흰 배경 컷아웃 스티커("BINGO!", "찰칵!" 카메라). 스티커는 흰 배경+알파 없음이라 그라디언트 위 오버레이엔 부적합 → 배경용은 image_NN 사진.
9. **미션 탭 히어로 = image_05 선두 4장 캐러셀** (item 8의 확장 — 사용자가 "mission 3장으로 무조건 교체 말고 image_05도 너무 좋다" → **image_05 선두 캐러셀** 선택. AskUserQuestion 3안 중 1안).
   - **신규 `src/components/HeroCarousel.tsx`**: `HERO_SLIDES`(`data.ts` 신규 = `["/image_05.png","/mission_01.png","/mission_02.png","/mission_03.png"]`)를 크로스페이드(opacity 0/100, `transition-opacity duration-700`)로 순환. 자동전환 3.5s(`window.matchMedia('(prefers-reduced-motion: reduce)')`면 `setInterval` 미등록 — 접근성), 하단 **4개 도트**(개별 슬라이드 이동, `aria-label="N번째 이미지 보기"`, 활성=`w-5 bg-white`), **스와이프**(touch 40px 임계, `touchmove` 10px 초과 시 `swiped` ref=true → 직후 합성 click을 `handleCreate`에서 억제해 새 보드 **오생성 방지**).
   - **구조**: 카드 전체 = `<button onClick=handleCreate>`(접근성명 "새로운 여름 추억 만들기 새 빙고 보드 시작하기"), 도트는 `z-10` **형제** 버튼(중첩 `<button>` 회피 — 접근성). 텍스트/플러스는 `<span className="block">`으로 버튼 내부에 배치(phrasing content 유효). 스크림 `from-black/60 via-black/20 to-transparent`로 사진↔일러스트 톤차 통일 + 텍스트는 **하단-좌 다크존**에 배치해 밝은 이미지에서도 흰 텍스트 대비 확보. `rounded-[32px]!`·`overflow-hidden!`(part 1 TDS 리셋 대응 유지), `active:scale-[0.98]`는 아우터 `<div>`로 이동(이미지 포함 전체가 눌림).
   - **`DashboardView.tsx`**: 인라인 히어로 `<section>`(단일 image_05) → `<HeroCarousel onCreate={onCreateNewBoard} />` 1줄로 교체, 이제 미사용된 `Plus` lucide import 제거.
   - **디자인 판단(사전 고지)**: image_05(실사 사진) vs mission_01~03(애니 일러스트)의 **스타일 톤차**, mission_03 붉은 노을 vs 블루 팔레트 경쟁, mission_02 흰 아이스크림(중앙) vs 흰 헤딩 겹침 = 리스크로 사용자에게 미리 알림 → 스크림 + 하단-좌 배치로 완화, image_05를 선두로 두어 첫인상·팔레트 조화 유지. mission_01만 파란 톤이라 image_05와 자연스러움.
   - **검증**: `tsc --noEmit -p tsconfig.app.json` exit 0 · `ait build` 클린(`.ait` 생성) · `eslint` 변경 3파일(HeroCarousel/DashboardView/data) 0건(리포된 16개 에러는 전부 `snap-bingo-orig/*`와 미변경 `src/…/MissionCompleteView.tsx` 잔존 — 이번 변경 무관). **browse 스킬 라이브(440×900)**: 슬라이드1=image_05 선두·흰 텍스트 가독·4도트(1번 활성), 도트3→mission_02·도트4→mission_03 크로스페이드 동작·활성 도트 정확, 두 슬라이드 모두 흰 텍스트가 하단-좌 스크림 위에서 **가독 확인**(우려했던 흰-아이스크림/붉은-노을 legibility 통과), 히어로 탭→"새 빙고 보드 만들기" 폼 정상(생성 CTA 살아있음 — 스와이프 억제가 탭을 안 깨뜨림). a11y 트리에 CTA 1 + 도트 4가 별개 버튼으로 확인(중첩 없음). 헤드리스 one-shot(google-chrome `--headless`)은 reduce-motion 기본이라 autoplay 멈춰 image_05에 머묾 = **의도된 접근성 동작 확인**. 콘솔은 무해한 `getSafeAreaInsets` 브리지 에러뿐(item 7 참고).
   - ※ **잔여 리스크**: `public/mission_01/02/03.png`가 각 ~2MB(원본 1672×941)라 4장 스택 히어로의 이미지 무게가 큼 — 출시 전 리사이즈/webp 최적화 권장(오픈 항목 목업/에셋 정리와 함께). 이 환경은 지속 실행 CDP Chrome이 SIGSTKFLT(exit 144)로 죽어 인터랙티브 검증은 **browse 스킬 데몬**으로만 가능(수동 CDP 불가).

### 세션 (2026-07-02)

1. **TDS 도입 현황 감사** — 실제 컴포넌트 사용을 grep으로 확인: `Button`(9), `Badge`(5), `TextField`(1), `useToast`/`useDialog`/`useBottomSheet`(8개 파일), `PortalProvider`(1, 필수 루트 래퍼). `IconButton`/`Top`/`ListRow`/`Tab`/`Asset`/`Skeleton`/`ProgressBar`/`Rating`/`Switch`는 사용 0건. 순수 `<button>` 아이콘 버튼 23개 잔존(lucide-react 아이콘). 결론: 쓰이는 곳은 올바르나 커버리지가 좁음 — "인터랙션 프리미티브만 사용", TDS 네이티브 앱은 아님.
2. **챌린지 주제 적합성 확인** — WebFetch로 공식 챌린지 규칙을 가져와 위 주제/제외 항목을 확인. 앱은 "친구·가족과 함께하는 여름 활동"에 잘 맞음. 리스크는 포인트/뱃지(`RewardsView`)가 신청폼 한 줄 설명에서 과도하게 강조되면 리워드 전용으로 읽힐 수 있다는 점 — 사진-미션-빙고를 헤드라인으로 유지할 것.
3. **출시 검토 체크리스트 감사** (비게임 체크리스트/내비게이션바/서비스오픈정책/UX가이드/콘솔등록 문서 WebFetch) → 수정:
   - `granite.config.ts`: `brand.icon`이 비어 있었음 → **플레이스홀더** 목업 URL + TODO 주석으로 채움 (실제 제출 전에 콘솔로 진짜 600×600 PNG 업로드 필요)
   - `index.html`: `lang="en"` / 일반 title → `lang="ko"` + 한국어 title + description meta
   - `UploadModal.tsx`: 가짜 "AI 사진 검증 중... 가이드라인에 맞는지 분석" 문구 제거(실제 분석은 전혀 안 하고 타이머 진행 바만 있었음) → 정직한 카피 "사진 인증 처리 중... 미션에 맞게 사진을 등록하고 있어요"로 변경; `useToast`를 통해 비이미지 파일을 거부하는 실제 `file.type.startsWith('image/')` 체크 추가
   - `@toss/tds-mobile@2.5.0`에 **`Tabbar` export가 0건**임을 확인(`.d.ts` grep) — 커스텀 `BottomNav.tsx`는 버그가 아니라 받아들일 수밖에 없는 불가피한 공백
4. **TDS 기술 심층 분석** ("제대로 TDS로 구현된 것이냐"는 질문에 대한 답):
   - `@toss/tds-mobile`의 스타일링 엔진 = **Emotion**(`@emotion/react`, CSS-in-JS) — peer-dep + 번들 내 18개 `require`/`from` 참조 + 라이브 `<style data-emotion>` 태그 6개로 확인. **번들에 담긴 `.css` 파일은 전혀 없음.**
   - 컬러 토큰(`@toss/tds-colors` → `adaptive.*`)은 **CSS 커스텀 프로퍼티**로 해석됨(예: `adaptive.grey800` → `var(--adaptiveGrey800)`) — CSSOM으로 라이브 확인(`:root { --adaptiveBackground: #ffffff; ... }`가 실제로 주입됨)
   - 다크 모드는 **실재함**, 부재가 아님: 번들에서 리터럴 `"prefers-color-scheme"` 문자열 발견(2회), 그리고 `@toss/tds-colors`에 `getDarkColor`/`getLightColor`/`ColorSchemeArea` 테마 API가 전체 `lightTDSVariablesCSS`/`darkTDSVariablesCSS` 쌍과 함께 존재. (같은 세션 초기의 "다크 모드가 완전히 부재한다"는 주장은 틀렸음 — 정적 Vite/PostCSS `.css` 출력만 grep한 결과였고, 거기에는 Emotion이 런타임에 주입하는 규칙이 절대 담기지 않음. 정정함.)
   - **`IconButton` 블로커는 실재 확인**: 아이콘 입력이 `name`(Toss 내부 아이콘명 문자열) 또는 `src`(이미지 URL)뿐 — **`children` prop 없음** — 따라서 lucide-react 아이콘(23개 아이콘 버튼 *전부* + `LucideIcon.tsx`를 통한 9개 빙고 칸 미션 아이콘 전부에 사용)을 Toss의 약 7,000개 아이콘 라이브러리로 전면 마이그레이션하고 사용 중인 모든 아이콘의 정확한 대응 이름을 찾지 않는 한 그대로 넣을 수 없음. **시도하지 않음 — 대가에 비해 규모/불확실성이 너무 큼.**
5. **TDS 심층 분석 결과에 따른 조치** — 사용자가 TDS의 명시된 목표(일관성/생산성/완성도)에 기대는 방향을 요청:
   - `src/index.css`의 `@theme` 블록에 중립/서피스 토큰 레이어 추가: `--color-page`(`var(--adaptiveGreyBackground)`), `--color-surface`(`var(--adaptiveBackgroundLevel01)`), `--color-hairline`(`var(--adaptiveHairlineBorder)`), `--color-neutral-{50..900}`(`var(--adaptiveGrey{N})`)
   - **9개 뷰/컴포넌트 파일 전체**에서 `text-gray-N`/`bg-gray-N`/`border-gray-N`/`bg-[#f8f9fb]`/대부분의 `bg-white`를 새 시맨틱 클래스로 일괄 교체
   - **브랜드 블루와 강조색(rose/amber/yellow/green)은 명시적으로 건드리지 않음** — `adaptive.blue*`는 Toss 자체 기본 블루(`#3182f6`)이지 우리 `granite.config.ts`의 `brandPrimaryColor`(`#0064FF`)가 아님. 순수 Tailwind 블루를 `adaptive.blue*`에 연결하면 화면에서 TDS `Button color="primary"` 옆에 눈에 띄게 다른 두 블루가 나란히 놓일 위험이 있었음. **미해결 오픈 이슈**: `TDSMobileAITProvider`에 넘긴 `brandPrimaryColor`가 실제로 `adaptive.blue*`를 전역 리매핑하는지, 아니면 TDS 컴포넌트의 "primary" 시맨틱 슬롯만 바꾸는지? 강조색을 건드리기 전에 검증 필요.
   - `bg-white` 4곳은 교체에서 제외(리터럴 흰색 유지) — 어댑티브 서피스 크롬이 아니라 사진/그라디언트 위 장식용 흰색이기 때문: `BoardDetailView.tsx`의 칸 체크마크 뱃지(사진 위 `bg-white/95`), `DashboardView.tsx` 히어로 장식 원 ×2(앰버 그라디언트 위 `bg-white/20`), `RewardsView.tsx`의 "All Clear" pill(블루 그라디언트 카드 위 `bg-white/20`)
   - `BottomNav.tsx`를 TDS의 "탭바는 플로팅 형태만" 규격에 맞춰 재스타일링(import 가능한 `Tabbar` 컴포넌트가 없어 순수 CSS로 처리): 꽉 찬 풀 폭 바 → `bottom-[max(1rem,env(safe-area-inset-bottom))]` + `left-4 right-4` + `rounded-3xl` + full border + 강한 그림자(분리된 플로팅 pill, safe-area 인지)
   - 검증: `tsc --noEmit` 클린, `vite build` OK, Dashboard/BoardDetail/Rewards 라이브 스크린샷에서 라이트 모드 시각적 회귀 없음. **다크 모드 렌더링 자체는 시각적으로 검증한 적 없음** — 여기 `browse` 스킬/헤드리스 Chromium에 노출된 `prefers-color-scheme` 에뮬레이션 플래그가 없어서, CSS 변수 연결은 구조적으로는 정확하나(TDS 자체가 쓰는 것과 동일한 변수) 실제 다크 외관은 미검증.
6. **개발 서버 고장 진단 및 수정** — `granite dev` 프로세스가 2026-07-01(이번 세션 편집 이전)부터 계속 실행 중이었고, 오늘 여러 파일의 대규모 클래스명 변경 이후 고장/스테일 상태에 빠짐: Tailwind의 유틸리티 클래스 CSS 생성이 완전히 멈춤(확인: 로드된 모든 스타일시트에서 `.w-8` 규칙 부재, 페이지가 스타일 완전 미적용으로 렌더링됨). `vite build`(매번 새 프로세스)는 전혀 영향받지 않았고, 그래서 프로덕션 빌드 스크린샷은 항상 멀쩡한데 장기 실행 개발 서버만 깨졌던 것. **수정: 개발 서버 프로세스 트리 kill + `rm -rf node_modules/.vite` + 재시작.** 다시 발생하면 코드를 건드리지 말고 개발 서버를 재시작할 것.
7. **`getSafeAreaInsets` 콘솔 에러는 무해함 확인** — `@toss/tds-mobile-ait`의 컴파일된 소스를 추적: 호출이 try/catch로 감싸여 있고, 실패 시 `{top:0, bottom:0}`으로 폴백하며, 순수 브라우저에는 네이티브 Toss 앱 브리지가 없어서만 실패함. 실제 Toss 앱 안에서는 나타나지 않음. 조치 불필요(콘솔을 조용하게 할 개발 전용 목을 선택적으로 제안했으나 구현 안 함, 추가 요청 없음).
8. **뱃지 이모지 출처 질문 (진행 중, 중단됨)** — `src/data.ts`의 `BADGES` 배열이 평범한 유니코드 이모지 문자(`"☀️"`, `"🌊"`, `"🍉"`, `"🍦"`, `"🌳"`, `"🌴"`)를 사용하고, `RewardsView.tsx`/`BadgeModal.tsx`에서 `<span>{badge.emoji}</span>`로 렌더링함 — 이미지도 아니고, TDS 자체 2D/3D 이모지 에셋 라이브러리도 아니고, AI 생성도 아님. 크로스 플랫폼 렌더링이 달라짐(iOS/Android/Windows 이모지 폰트가 다르게 보임). **`public/badge_06.png` 발견**(전문적으로 일러스트된 원형 야자수-섬 뱃지)이 코드에서 미사용(`src/`에서 `badge_06|sticker_` grep 시 결과 없음)이고 "palm" 뱃지(`야자수 아래`)와 시각적으로 정확히 일치함. 기타 미사용 `public/` 잔재: `sticker_01-04.png`("BINGO!" 텍스트 스티커 포함), `avatar_01-04.png`, `image_01-10.png`. **다음 단계로 하려던 것**: 나머지 `public/` 이미지를 다른 5개 뱃지(sunshine/wave/watermelon/icecream/shade)와 대조해 평범한 이모지 렌더링을 몇 개나 대체할 수 있는지 확인 — **아직 못 함.**
9. **무관 항목**: 사용자 요청으로 GSD CLI 도구 자체(전역, `~/.claude/`)를 `/gsd:update`로 1.26.0 → 1.42.3 업데이트. snap-bingo와 무관. 이 프로젝트는 `.planning/`도 없고 GSD 관리 대상도 아님.

### 이전 세션 (2026-07-01, 상세 전체는 Claude 메모리 시스템의 `snap-bingo-port.md` 참고)

- `snap-bingo-orig`(Tailwind/React19)를 apps-in-toss 셸로 포팅, TDS로 재작성하지 않고 디자인을 픽셀 단위로 보존
- `_5`(RewardsView), `_6`(BadgeModal) 화면 + 공용 `BottomNav` 추가
- 네이티브 `alert`/`confirm`/`prompt`를 TDS `useToast`/`useDialog`/`useBottomSheet`로 교체(`PortalProvider` 요구사항 발견 및 수정 — 이게 없으면 `useDialog`/`useBottomSheet`가 에러 없이 조용히 no-op)
- 챌린지를 위해 앱 전반에 "핵심 TDS 요소만"(Button/Badge) 채택

## 다음 세션 오픈 항목 (우선순위순)

> 사용자 확인(2026-07-02): **뱃지 이모지 매칭 작업은 제외**(안 씀 — 유니코드 이모지 그대로 유지). `public/` 에셋은 원래 `data.ts` 프리셋 이미지 대체용이었음.

> **결정(2026-07-06): 앱 유형 = 비게임** — "여름 사진 기록·챌린지" 유틸리티로 등록(사용자 확정). 근거: 게임 등록 시 게임물 등급분류라는 무거운 절차를 피하고, 앱의 핵심 가치를 "여름 활동 사진 기록/도감"으로 정직하게 규정. **정직성 의무(중요)**: 콘솔 가이드는 "실제 게임 규칙·점수·게임플레이 루프가 있으면 게임"으로 봄 — 현재 앱은 빙고 승리조건 + XP 점수 흔적이 있음. 따라서 비게임 등록이 정직하려면 **게임 프레이밍을 낮추고 기록/챌린지 가치를 전면화**해야 함. 구체적으로 **오픈 항목 #1의 XP 카피 제거(`App.tsx` `reward:'2,500 보너스 XP 증정'` + 칸별 `xpReward`)가 비게임 정직성의 전제**가 됨(단순 truthfulness를 넘어 유형 분류 근거). 빙고는 "사진 챌린지의 구조/레이아웃"으로 유지 가능(게임으로 내세우지만 않으면 됨). **제안 카테고리: `생활 > 일상 > 취미`**(개인의 여름 사진 기록·챌린지를 취미 활동으로 규정 — 구현 동작 기준 가장 구체·정직한 fit). 대안: 친구/가족·공유 각도가 핵심이 되면 `생활 > 일상 > 가족` 또는 `생활 > 소셜 > 소셜`. 콘솔 등록 시 카테고리 3단계 전부 보고 + `app-naming`/`app-seo-keywords` 서브에이전트가 이름/키워드의 정본(수동 작성 금지).

> **상태 업데이트(2026-07-08)**: (a) **#2 카드 이미지 저장은 제거됨**(사용자 요청) — 아래 오픈항목 #1의 "#2 / `saveCard.ts` / `saveBase64Data` / photos 권한" 언급은 **폐기**(html-to-image·saveBase64Data 미사용, 파일 삭제됨). 카드 액션은 "친구에게 공유하기"만 남음. (b) **"함께"는 딥링크 초대(A)로 구현**(로그 최상단 세션) — 실기기 잔여는 아래 오픈항목 #11. (c) 뱃지 동기부여가 약하다는 결론 → 뱃지 강화 대신 빙고 줄/보드 **"성취 순간 훅"** 추가(로그 참고). (d) `html-to-image` npm 의존성은 이제 **미사용**(package.json 정리 보류·선택).

1. **[완료 2026-07-06] 목업 데이터 제거(A1) + 카드 이미지 저장(#2)** — **A1에서 전부 제거 완료**: 시드 보드→빈 상태(`INITIAL_BOARDS=[]`), XP/포인트 전면, `PRESET_IMAGES`, 인증현황 신원(`@summer_walker`/아바타/고정날짜), `members`/`AVATARS`, 추천 미션. 앱은 이제 빈 상태로 시작. **연관 #2도 완료(2026-07-06)**: 빙고 달성 카드 "이미지로 저장하기"를 `html-to-image` → `saveBase64Data`(브라우저 다운로드 폴백)로 실 구현(`src/lib/saveCard.ts`) — A1이 카드 이미지를 외부 URL→사용자 사진(data URL)/동일출처 로고로 바꿔 CORS 오염 위험이 사라져 안전하게 캡처 가능. **잔여(실기기 검증, 2026-07-06 기기준비 점검 완료)**: `ait build` 성공(`snap-bingo.ait`, RN0.84+0.72, html-to-image 번들 OK, deploymentId 발급), 브리지 시그니처 일치, 딥링크 `intoss://snap-bingo` = `appName` 일치. **실기기에서만 확정 가능한 2가지**: (a) `saveBase64Data` 실 저장 시 권한 필요 여부 — AIT 권한 enum에 범용 storage 없음(clipboard/geolocation/contacts/photos/camera/microphone뿐); 저장이 권한 에러로 실패하면 `granite.config.ts` `permissions`에 `{ name: 'photos', access: 'write' }` 추가로 폴백; (b) 공유 딥링크의 실제 앱 오픈은 **콘솔 등록(appName 정확 일치) 후**에만 동작. 참고: `brand.icon`이 아직 lh3 목업 URL이라 공유 OG 프리뷰가 플레이스홀더로 뜸(저장/Storage와 무관). **실기기 로컬 테스트 셋업(2026-07-07)**: iOS 샌드박스가 "로컬 서버를 찾을 수 없다" → 원인은 WSL2 네트워크. dev 서버 2개(vite 5173=WebView, metro 8081=RN 셸). vite가 기본 `127.0.0.1` 바인딩이라 `vite.config.ts`에 `server: { host: true }` 추가로 `*:5173` 노출(granite `web.host`는 vite bind에 무관 — 확인함). **미해결 잔여(사용자 환경)**: WSL2 NAT라 vite Network URL이 `172.23.178.122`(WSL 내부 IP)로 떠서 폰이 여전히 못 닿음 → **WSL mirrored networking(Win11 `.wslconfig`) 또는 netsh portproxy로 5173+8081 둘 다 Windows LAN IP에 노출** 필요. 가장 확실한 우회는 로컬 서버 없이 `snap-bingo.ait` 번들 업로드 테스트.
2. **[출시 필수] 빌드 & 번들 등록** — 사용자 메모: "build 해서 (번들) 확장자로 등록". apps-in-toss 등록 시점에 `granite build` 산출물의 정확한 번들 형식/업로드 절차를 문서(토스앱 테스트하기 / 미니앱 출시)로 확인해 진행.
3. **[출시 필수] 제출 에셋** — 600×600 PNG 로고(현재 `granite.config.ts`의 `brand.icon`은 TODO 달린 플레이스홀더 목업 URL), 1932×828 썸네일, 3장 이상 세로형 스크린샷(636×1048). 스크린샷은 실행 중인 앱에서 캡처 가능; 로고/썸네일은 디자인 작업 필요.
4. **[출시 필수] 콘솔 등록** — `appName: "snap-bingo"`는 콘솔 appName 필드와 정확히 일치해야 함(등록 후 변경 불가); brand.icon은 실제 업로드된 URL 필요.
5. **[TDS 개선, 선택] 남은 컴포넌트 전환** — Asset.Image(raw `<img>` 다수), Typography 토큰(t1~t7), 뱃지 6개 그리드 → TDS `GridList`화, Dashboard 보드 카드 ListRow화(선택). **주의**: 겉모습이 TDS 기본형으로 바뀔 수 있어 stitch 충실도와 트레이드오프 — 진행 전 범위 확인 권장. (완료: ProgressBar part 4, Post.Ol/Li part 5. ※ part 6에서 빙고판에 잠깐 도입했던 ListRow는 part 7에서 6개 뱃지 그리드로 대체되며 제거됨. Rewards 탭은 part 6에서 삭제.)
6. **[해결됨 2026-07-03] 브랜드 블루 토큰** — 번들 추적으로 확정: AIT provider가 `token:{color:{primary: brandPrimaryColor}}`로 **"primary" 시맨틱 슬롯에만** 주입. `--adaptiveBlue*` CSS 변수는 전역 리매핑 안 됨(그대로 `#3182f6`). 즉 `Button color="primary"`만 `#0064FF`, raw Tailwind blue/`adaptive.blue*`는 `#3182f6` → 강조색을 `adaptive.blue*`에 연결하면 두 블루 공존. 기존 "강조색 미변경" 판단이 정답. **더 이상 검증 불필요.**
7. **[재정의됨 2026-07-03] 다크 모드** — 번들 추적으로 확정: `TDSMobileAITProvider`가 `colorPreference:"light"`를 **하드코딩**(cjs/esm 양쪽) → 앱은 라이트 고정. static `colors.dark.css`는 `:root` 선언(미디어쿼리 아님)이고 우리 빌드에 import도 안 됨(우린 `adaptive` JS 객체만 사용). 따라서 (a) OS 다크여도 다크 적용 안 됨 = **다크 사실상 미지원**, (b) neutral 토큰도 라이트로 resolve → **라이트/다크 불일치 버그 없음(안전)**. "다크 렌더링 미검증"은 검증 대상 아님으로 종결. 다크 지원을 원하면 AIT provider가 막고 있어 별도 작업 필요.
8. **[분석 완료 2026-07-03, 권장: 현행 유지] IconButton / 아이콘 라이브러리** — lucide-react → Toss 아이콘 세트 전면 이식 검토. 실사용 ~28종(크롬 ~18 + 미션테마 10: Sun/Waves/IceCream/Sunset/Coffee/Wind/Moon/CloudSun/Heart/Trophy). 결론 **전면 이식 비추천**: 번들 이득 0(이미 트리셰이킹), `IconButton`은 `children` 미지원이라 28종 이름 매칭+`BingoCell` 재작업 필요, 미션 아이콘은 여름 감성 정체성이라 스타일 변경 시 챌린지 주제 적합성에 마이너스, 부분 이식은 두 스타일 혼재로 역효과. 대안(더 높은 ROI): 미션 칸을 일러스트 에셋(PNG/2D·3D 이모지)으로 승격. 최종 진행 결정만 사용자 몫으로 남김.
9. **[일부 완료 2026-07-03, 잔여는 실기기] 공유·Storage** — 코드 검증 완료: `getTossShareLink(path, ogImageUrl?): Promise<string>` / `share({message})` / `Storage.getItem·setItem` 모두 시그니처 일치, 딥링크 형식 `intoss://snap-bingo`도 문서 `intoss://<appName>`와 일치, 폴백 견고. **OG 이미지 인자 추가 완료**(`src/lib/share.ts`: `getTossShareLink(DEEP_LINK, ogImageUrl)`, 기본 OG=`config.brand.icon`, `shareApp` 3번째 선택 인자로 화면별 오버라이드 가능; 전용 1200×630 랜드스케이프 OG 교체 TODO 잔존). **실기기 잔여**: (a) 딥링크가 실제 우리 앱을 여는지(콘솔 appName 등록 후), (b) 네이티브 Storage 실 read/write + "브라우저 reject 폴백 vs 조용히 null 반환". 샌드박스/테스트앱으로 확인.
10. **[선택, 출시 전 권장] 히어로 캐러셀 이미지 최적화** — `public/mission_01/02/03.png` 각 ~2MB(원본 1672×941) + `image_05.png` ~1.6MB. `HeroCarousel`이 4장을 DOM에 스택(크로스페이드)하므로 대시보드 최초 로드 시 히어로 이미지 무게가 큼(≈8MB). 히어로 실제 표시 크기(~408×230@2x)에 맞춰 리사이즈 + webp 변환 권장. 미사용 `public/` 에셋(`image_NN`/`sticker_NN`/`avatar_NN`) 정리와 함께 진행 가능. (item 9 잔여)
11. **[실기기 확정 필요] '함께 시작' 딥링크 파라미터 전달** — A(딥링크 초대) **인바운드는 dev에서 왕복 검증됨**(`?t=food`→InviteSheet→"시작하기"→`{templateId:'food'}` 보드 생성). 단 **실제 토스 딥링크가 초대 파라미터를 WebView URL 쿼리로 전달하는지 미확정** — 그래야 `index.html`의 `window.__ENTRY_SEARCH` 캡처가 성립해요(프레임워크가 모듈 로드 시 `location.search`를 지우는 것은 확인함; 웹 엔트리 `dist-web`엔 `useParams`/`getInitialScheme` 없음). 만약 네이티브 스킴으로 전달되면 캡처 소스를 그쪽으로 교체 필요. **콘솔 등록(appName 일치)+실기기**에서만 확정. 아웃바운드(BoardDetail "이 챌린지에 친구 초대하기")는 toss 브리지 필요라 브라우저 미검증(로직만).
12. **[선택, 향후] 진짜 실시간 공유 보드(함께 B)** — 각자 폰에서 같은 보드를 실시간 공유해 서로 진행이 보이는 형태. 백엔드(Supabase) 도입 필요 — 인증·동기화·프라이버시 설계 포함 **별도 세션 규모**. 현재 A(딥링크=각자 병렬+카드 비교)로 충분한지 사용자 판단 후 진행.

## 로컬 실행 / 검증 방법

- 개발 서버: `npm run dev`(`granite dev` → Vite가 **:5173**에서 실행, `granite.config.ts`와 일치). UI가 스타일 완전 미적용으로 렌더링되면 개발 서버가 스테일 상태임 — kill 후 `rm -rf node_modules/.vite`, 그 다음 `npm run dev` 재실행. 코드부터 디버깅하지 말 것.
- 프로덕션 프리뷰: `npx vite build && npx vite preview`(기본 :4173).
- 타입 체크: `npx tsc --noEmit -p tsconfig.app.json`. 린트: `npm run lint`(※ 현재 `snap-bingo-orig/*`와 `src/…/MissionCompleteView.tsx`에 **기존 16개 에러**가 있어 전체 lint는 red — `src/` 신규 변경분만 `npx eslint <파일>`로 개별 확인 권장).
- **브라우저 시각 검증(2026-07-03 확인)**: `npm run build`은 `ait build`라 `dist/`에 **RN 번들**(`bundle.android.js` 등)을 쓰고 웹 `index.html`이 없음 → `vite preview`로 열면 **404**. 실제 앱 스크린샷은 `npm run dev`(:5173) + **`browse` 스킬**(gstack, 관리형 CDP 데몬: `goto`→`snapshot -i`로 @ref 획득→`click @eN`→`screenshot`)로 확인. ※ 이 환경은 **지속 실행 CDP Chrome이 exit 144(SIGSTKFLT)로 죽어** 수동 `--remote-debugging-port` 접근이 안 됨 — 도트 클릭 등 인터랙티브 검증은 browse 데몬으로만 가능. one-shot `google-chrome --headless --screenshot`는 되지만 **reduce-motion이 기본**이라 `HeroCarousel` 자동전환이 멈춰 슬라이드1(image_05)만 캡처됨(반대로 이것이 reduce-motion 접근성 동작을 검증해 주기도 함).
- 실제 Toss 앱 밖에서 나오는 `getSafeAreaInsets` 콘솔 에러는 예상된 것이며 무해함 — 무시할 것.

## 참고

전체 서술형 히스토리(2026-07-01 포팅 결정, 화면 추가, 오버레이 마이그레이션 함정)는 Claude 메모리 시스템의 `snap-bingo-port.md`에 있음(메모리 타입: project, 이 저장소에는 없음). 이 STATE.md는 해당 메모리에 접근할 수 없는 누구/무엇이 저장소를 이어받아도 자체 완결적이도록 작성됨.
