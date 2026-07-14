import { getStorageItem, setStorageItem } from './storage';

// 방별 "마지막으로 본 완료 칸(cell_index) 목록"을 저장해요.
// 함께 방을 다시 열 때, 그 사이 친구가 새로 채운 칸을 diff해 '새 소식'으로 보여주는 데 써요.
// (토스 Storage(앱 지속)/localStorage 폴백 — storage.ts와 동일 매체.)
const SEEN_KEY = 'snapbingo_room_seen_v1';

type SeenMap = Record<string, number[]>;

async function loadMap(): Promise<SeenMap> {
  try {
    const raw = await getStorageItem(SEEN_KEY);
    if (raw == null || raw === '') {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    return parsed != null && typeof parsed === 'object'
      ? (parsed as SeenMap)
      : {};
  } catch {
    return {};
  }
}

export async function getSeenCells(roomId: string): Promise<number[]> {
  const map = await loadMap();
  return Array.isArray(map[roomId]) ? map[roomId] : [];
}

export async function setSeenCells(
  roomId: string,
  cellIndexes: number[],
): Promise<void> {
  const map = await loadMap();
  const next: SeenMap = { ...map, [roomId]: cellIndexes };
  await setStorageItem(SEEN_KEY, JSON.stringify(next));
}
