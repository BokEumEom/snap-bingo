import { Storage } from '@apps-in-toss/web-framework';

// 토스 네이티브 Storage(앱 단위 지속, origin 무관)를 우선 사용하고,
// 순수 브라우저(dev/preview 등 네이티브 브리지 없음)에서는 localStorage로 폴백한다.
// Storage 메서드는 모두 Promise 기반이며, 브리지가 없으면 reject되어 catch로 넘어간다.

export async function getStorageItem(key: string): Promise<string | null> {
  try {
    return await Storage.getItem(key);
  } catch {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    await Storage.setItem(key, value);
  } catch {
    try {
      localStorage.setItem(key, value);
    } catch {
      // 저장 불가 환경(프라이빗 모드 등) — 무시
    }
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await Storage.removeItem(key);
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // 삭제 불가 환경 — 무시
    }
  }
}
