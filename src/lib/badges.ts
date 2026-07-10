import { BingoBoard } from '../types';

// 3x3 빙고 한 줄(가로/세로/대각선)을 셀 인덱스로 표현. cells 배열 순서 = 그리드 위치.
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function countBingoLines(board: BingoBoard): number {
  const done = board.cells.map((c) => c.completed);
  return LINES.filter((line) => line.every((i) => done[i] === true)).length;
}

/**
 * 전 보드 누적 진행도에서 획득한 뱃지 id 집합을 파생한다.
 * 마일스톤 기준 (하드코딩 earned 대체):
 * - sunshine  : 첫 인증 1칸
 * - wave      : 누적 5칸 인증
 * - watermelon: 누적 10칸 인증
 * - icecream  : 첫 빙고(한 줄) 달성
 * - shade     : 보드 1개 전면 완성
 * - palm      : 보드 2개 전면 완성
 */
export function computeEarnedBadgeIds(boards: BingoBoard[]): Set<string> {
  const totalCompletedCells = boards.reduce(
    (sum, b) => sum + b.cells.filter((c) => c.completed).length,
    0,
  );
  const fullyCompletedBoards = boards.filter(
    (b) => b.cells.length > 0 && b.cells.every((c) => c.completed),
  ).length;
  const totalBingoLines = boards.reduce((sum, b) => sum + countBingoLines(b), 0);

  const earned = new Set<string>();
  if (totalCompletedCells >= 1) earned.add('sunshine');
  if (totalCompletedCells >= 5) earned.add('wave');
  if (totalCompletedCells >= 10) earned.add('watermelon');
  if (totalBingoLines >= 1) earned.add('icecream');
  if (fullyCompletedBoards >= 1) earned.add('shade');
  if (fullyCompletedBoards >= 2) earned.add('palm');
  return earned;
}
