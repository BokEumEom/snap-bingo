import { getTossShareLink, share } from '@apps-in-toss/web-framework';

import { BingoBoard } from '../types';
import { encodeInviteParams, encodeRoomInviteParams } from './invite';

// 앱 딥링크 (granite.config.ts appName: "snap-bingo" 기반 스킴).
// TODO(app-in-toss): 콘솔 등록 후 정확한 딥링크로 확정.
const DEEP_LINK = 'intoss://snap-bingo';
const DEFAULT_MESSAGE = '찍고빙고에서 여름 사진 빙고 시작해봐요! 📸';

// 공유 프리뷰(카카오톡·SNS) 카드에 노출될 OG 이미지예요. 토스 링크 프리뷰 크롤러가
// `getTossShareLink(url, ogImageUrl)`의 ogImageUrl을 가져가 그리므로, 반드시 **공개된
// https 절대 URL**이어야 하고 OG 권장 규격은 **1200×600(2:1)**이에요(앱인토스 OG 가이드).
// 규격에 맞는 전용 커버를 `public/og-cover.png`(1200×600, 실제 앱 아이콘+이름)로 준비해 뒀어요.
//
// 우선순위: (1) `VITE_OG_IMAGE_URL`(빌드 시 주입) → (2) DEFAULT_OG_IMAGE_URL(커밋된 기본)
//           → (3) 배포 오리진 기준 `/og-cover.png`(폴백).
// 기본값은 저장소(public)의 og-cover.png를 **jsDelivr(GitHub CDN)** 로 서빙하는 공개 https URL이에요.
// 외부(카톡) 크롤러도 이 절대 URL을 가져갈 수 있어, **앱 출시(=tossmini 도메인 라이브) 전에도** 프리뷰가 떠요.
// ※ 이 URL은 저장소가 **public**이어야 열려요(private면 404). 이미지를 옮기면 VITE_OG_IMAGE_URL로 덮어써요.
// (예전엔 정사각 앱 아이콘 `image_10.png`(1254×1254)를 런타임 오리진에서 넘겨 규격(2:1)과 어긋났고,
//  오리진 의존이라 dev/미출시 상태에선 프리뷰가 아예 안 떴어요.)
// 호출부에서 화면별로 다른 이미지를 넘겨 덮어쓸 수도 있어요.
const OG_IMAGE_ASSET = '/og-cover.png';
const DEFAULT_OG_IMAGE_URL =
  'https://cdn.jsdelivr.net/gh/BokEumEom/snap-bingo@main/public/og-cover.png';
const CONFIGURED_OG_IMAGE_URL = import.meta.env.VITE_OG_IMAGE_URL ?? DEFAULT_OG_IMAGE_URL;

function defaultOgImageUrl(): string {
  // (1) 설정(VITE_OG_IMAGE_URL) 또는 커밋된 기본 공개 https OG URL.
  if (CONFIGURED_OG_IMAGE_URL != null && CONFIGURED_OG_IMAGE_URL !== '') {
    return CONFIGURED_OG_IMAGE_URL;
  }
  // (2) 배포 오리진 기준 절대 URL(자동으로 실제 https 오리진 사용).
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(OG_IMAGE_ASSET, window.location.origin).href;
  }
  // (3) 비브라우저(SSR 등) 폴백.
  return OG_IMAGE_ASSET;
}

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
  ogImageUrl: string = defaultOgImageUrl(),
): Promise<void> {
  try {
    const link = await withTimeout(getTossShareLink(DEEP_LINK, ogImageUrl), 2500);
    await share({ message: `${message}\n${link}` });
  } catch {
    onFallback('토스 앱에서 친구에게 찍고빙고를 추천할 수 있어요!');
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
      getTossShareLink(target, defaultOgImageUrl()),
      2500,
    );
    await share({ message: `${message}\n${link}` });
  } catch {
    onFallback('토스 앱에서 친구를 초대할 수 있어요. 같은 챌린지를 함께 채워보세요!');
  }
}

/**
 * '함께(실시간 공동 빙고판)' 룸에 친구를 초대해요. 딥링크에 room=<룸 id>를 실어,
 * 받은 사람이 같은 룸에 참가해 한 판을 실시간으로 함께 채워요.
 */
export async function shareRoomInvite(
  onFallback: (message: string) => void,
  board: BingoBoard,
): Promise<void> {
  if (board.roomId == null) {
    onFallback('공유 보드가 아니라 초대 링크를 만들 수 없어요.');
    return;
  }
  const target = `${DEEP_LINK}?${encodeRoomInviteParams(board.roomId)}`;
  const message = `찍고빙고에서 '${board.title}' 빙고를 함께 채워요! 한 판을 실시간으로 같이 완성해요 📸`;
  try {
    const link = await withTimeout(
      getTossShareLink(target, defaultOgImageUrl()),
      2500,
    );
    await share({ message: `${message}\n${link}` });
  } catch {
    onFallback('토스 앱에서 함께 채울 친구를 초대할 수 있어요.');
  }
}
