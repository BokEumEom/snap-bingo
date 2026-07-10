import { getTossShareLink, share } from '@apps-in-toss/web-framework';

import config from '../../granite.config';
import { BingoBoard } from '../types';
import { encodeInviteParams } from './invite';

// 앱 딥링크 (granite.config.ts appName: "snap-bingo" 기반 스킴).
// TODO(app-in-toss): 콘솔 등록 후 정확한 딥링크로 확정.
const DEEP_LINK = 'intoss://snap-bingo';
const DEFAULT_MESSAGE = '찍고빙고에서 여름 사진 빙고를 함께 채워요! 📸';

// SNS 공유 프리뷰(카카오톡 등)에 노출될 OG 이미지. 외부 크롤러가 가져가야 하므로
// 반드시 공개된 절대 URL이어야 한다(상대경로/로컬 dev URL은 프리뷰가 안 뜸).
// 기본값은 앱 브랜드 아이콘(로고)이며, 화면별로 다른 이미지를 넘겨 덮어쓸 수 있다.
// TODO(app-in-toss): 콘솔 등록 후 1200×630 권장 규격의 전용 랜드스케이프 OG 이미지로 교체.
const DEFAULT_OG_IMAGE_URL = config.brand.icon;

// 브라우저(브리지 없음)에서 링크 생성이 reject 대신 hang할 수 있어 타임아웃으로 폴백을 보장한다.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('share-timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * 토스 공유 시트를 연다. `share`/`getTossShareLink`는 토스 웹뷰 전용이라
 * 순수 브라우저(dev/preview)에서는 실패하므로, 그때는 onFallback(안내 토스트)으로 대체한다.
 * 링크 생성만 타임아웃으로 감싸고, 실제 공유 시트(share)는 사용자 조작 시간을 방해하지 않도록 그대로 await한다.
 */
export async function shareApp(
  onFallback: (message: string) => void,
  message: string = DEFAULT_MESSAGE,
  ogImageUrl: string = DEFAULT_OG_IMAGE_URL,
): Promise<void> {
  try {
    const link = await withTimeout(getTossShareLink(DEEP_LINK, ogImageUrl), 2500);
    await share({ message: `${message}\n${link}` });
  } catch {
    onFallback('토스 앱에서 친구에게 공유할 수 있어요. 함께 빙고를 채워보세요!');
  }
}

/**
 * '같은 챌린지 함께 시작' 초대를 공유한다. 보드 설정을 딥링크 파라미터로 실어,
 * 받은 사람이 자기 폰에서 같은 보드를 시작할 수 있게 한다.
 */
export async function shareBoardInvite(
  onFallback: (message: string) => void,
  board: BingoBoard,
): Promise<void> {
  const target = `${DEEP_LINK}?${encodeInviteParams(board)}`;
  const message = `찍고빙고에서 '${board.title}' 챌린지에 초대했어요! 같이 여름 사진 빙고 채워요 📸`;
  try {
    const link = await withTimeout(
      getTossShareLink(target, DEFAULT_OG_IMAGE_URL),
      2500,
    );
    await share({ message: `${message}\n${link}` });
  } catch {
    onFallback('토스 앱에서 친구를 초대할 수 있어요. 같은 챌린지를 함께 채워보세요!');
  }
}
