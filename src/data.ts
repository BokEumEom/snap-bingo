import { BingoBoard, Badge, BoardTemplate } from './types';

// 로컬 앱 아이콘(카메라 + 빙고판 + 여름). public/에서 루트 경로로 서빙돼요.
// 콘솔에 실제 앱 로고(600×600)를 올릴 때 이 아트를 그대로 쓰는 걸 권장해요.
export const APP_ICON = "/image_10.png";

// 대시보드 히어로 캐러셀 슬라이드. hero_01~06(1672×941, 16:9) 여름 사진이 순환하며
// 앱의 첫인상과 분위기를 보여줘요. public/ 루트 경로.
export const HERO_SLIDES = [
  "/hero_01.png",
  "/hero_02.png",
  "/hero_03.png",
  "/hero_04.png",
  "/hero_05.png",
  "/hero_06.png",
];

// 출시 빌드는 목업 시드 없이 **빈 상태**로 시작해요(사용자가 직접 첫 보드를 만듦).
// App의 로드 폴백과 '갤러리 초기화'가 이 값을 사용해 항상 빈 상태로 초기화돼요.
export const INITIAL_BOARDS: BingoBoard[] = [];

// 새 보드를 만들 때 고르는 여름 테마 4종. 챌린지 공식 주제 가이드
// (여행·휴가 / 무더위 시원 / 친구·가족 활동 / 건강·수분관리)에 1:1로 매핑돼요.
// 각 셀의 `icon`은 TDS가 1급 에셋으로 다루는 이모지예요(항상 렌더되고 발랄한 톤).
export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'travel',
    label: '여름 여행 빙고',
    emoji: '🏖️',
    eyebrow: '여름 여행 챌린지',
    description: '바다·노을·맛집·야경까지 여행 순간 9칸',
    cells: [
      { title: '바다 풍경', icon: '🌊' },
      { title: '노을 풍경', icon: '🌅' },
      { title: '숙소 인증', icon: '🏨' },
      { title: '로컬 맛집', icon: '🍽️' },
      { title: '기차·드라이브', icon: '🚙' },
      { title: '반짝이는 야경', icon: '🌃' },
      { title: '기념품', icon: '🎁' },
      { title: '인생 포토스팟', icon: '📸' },
      { title: '다 함께 단체샷', icon: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    id: 'water',
    label: '물놀이·피서 빙고',
    emoji: '🌊',
    eyebrow: '여름 피서 챌린지',
    description: '수영·물놀이·빙수로 무더위 날리기 9칸',
    cells: [
      { title: '계곡·바다', icon: '🏝️' },
      { title: '시원한 수영', icon: '🏊' },
      { title: '물놀이 한판', icon: '💦' },
      { title: '빙수 한 그릇', icon: '🍧' },
      { title: '그늘 낮잠', icon: '😴' },
      { title: '시원한 음료', icon: '🥤' },
      { title: '부채·선풍기', icon: '🌀' },
      { title: '워터파크', icon: '🏄' },
      { title: '발 담그기', icon: '🦶' },
    ],
  },
  {
    id: 'food',
    label: '여름 미식 빙고',
    emoji: '🍧',
    eyebrow: '여름 미식 챌린지',
    description: '냉면·빙수·수박… 여름 미식 도장깨기 9칸',
    cells: [
      { title: '냉면', icon: '🍜' },
      { title: '콩국수', icon: '🥣' },
      { title: '빙수', icon: '🍧' },
      { title: '수박', icon: '🍉' },
      { title: '아이스크림', icon: '🍦' },
      { title: '삼계탕', icon: '🍲' },
      { title: '초당옥수수', icon: '🌽' },
      { title: '물회', icon: '🐟' },
      { title: '복숭아', icon: '🍑' },
    ],
  },
  {
    id: 'health',
    label: '여름 건강·수분 빙고',
    emoji: '💧',
    eyebrow: '여름 건강 챌린지',
    description: '수분·산책·수면으로 건강 챙기기 9칸',
    cells: [
      { title: '물 2L 마시기', icon: '💧' },
      { title: '아침 산책', icon: '🚶' },
      { title: '스트레칭', icon: '🤸' },
      { title: '자외선 차단', icon: '🧴' },
      { title: '제철 과일', icon: '🍎' },
      { title: '충분한 수면', icon: '🛌' },
      { title: '실내온도 관리', icon: '🌡️' },
      { title: '가벼운 운동', icon: '🏃' },
      { title: '샤워로 리프레시', icon: '🚿' },
    ],
  },
];

// Collectible summer badges shown on the 빙고판 detail (board tab).
// `earned`는 lib/badges.ts의 computeEarnedBadgeIds(boards)로 진행도에서 파생한다.
export const BADGES: Badge[] = [
  { id: "sunshine", name: "여름 햇살", emoji: "☀️", tagline: "여름의 뜨거운 열정을 담은" },
  { id: "wave", name: "파도타기", emoji: "🌊", tagline: "시원한 파도를 가르는" },
  { id: "watermelon", name: "수박 한 조각", emoji: "🍉", tagline: "달콤한 여름의 맛을 담은" },
  { id: "icecream", name: "아이스크림", emoji: "🍦", tagline: "녹기 전에 담아낸" },
  { id: "shade", name: "그늘 휴식", emoji: "🌳", tagline: "나무 그늘 아래 여유로운" },
  { id: "palm", name: "야자수 아래", emoji: "🌴", tagline: "이국적인 휴양지의" },
];
