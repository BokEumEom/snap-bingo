import { useState } from 'react';

// 토스 2D 이모지 에셋 베이스 URL. 유니코드 이모지를 코드포인트로 주소 지정해요.
// 예: 🍧(U+1F367) → .../u1F367.png. 플랫·토스블루 톤이라 앱 아이덴티티와 잘 맞아요.
const TOSS_2D_EMOJI_BASE = 'https://static.toss.im/2d-emojis/png/4x';

/**
 * 유니코드 이모지 → 토스 2D 이모지 URL.
 * 변이 선택자(FE0F)를 뺀 단일 코드포인트로 만들어요. (우리가 쓰는 단일 이모지는 100% 매핑됨)
 * ZWJ 시퀀스(예: 👨‍👩‍👧‍👦)나 스킨톤 모디파이어처럼 코드포인트가 2개 이상이면
 * 단일 에셋으로 표현할 수 없으므로 null을 반환해 호출부가 유니코드 폴백을 쓰게 해요.
 */
export function tossEmojiUrl(emoji: string): string | null {
  const codePoints = [...emoji]
    .map((char) => char.codePointAt(0))
    .filter((cp): cp is number => cp != null && cp !== 0xfe0f);

  if (codePoints.length !== 1) {
    return null;
  }

  const base = codePoints[0].toString(16).toUpperCase();
  return `${TOSS_2D_EMOJI_BASE}/u${base}.png`;
}

interface EmojiProps {
  /** 렌더할 유니코드 이모지 문자예요. */
  emoji: string;
  /** 이미지 한 변의 크기(px)예요. @default 24 */
  size?: number;
  /** 이미지/폴백에 함께 적용할 클래스예요. */
  className?: string;
  /**
   * 대체 텍스트예요. 빈 문자열(`''`)이면 장식용으로 간주해 스크린 리더가 건너뛰어요.
   * 지정하지 않으면 이모지 문자 자체를 레이블로 써요.
   */
  alt?: string;
}

/**
 * 유니코드 이모지를 토스 2D 이모지 이미지로 렌더해요.
 * 로드 실패(오프라인/미존재) 시 원본 유니코드 이모지로 폴백해 항상 무언가는 보이게 해요.
 */
export default function Emoji({ emoji, size = 24, className, alt }: EmojiProps) {
  const [failed, setFailed] = useState(false);
  const url = tossEmojiUrl(emoji);
  const decorative = alt === '';

  if (failed || url == null) {
    return (
      <span
        className={className}
        style={{ fontSize: size, lineHeight: 1 }}
        {...(decorative
          ? { 'aria-hidden': true }
          : { role: 'img', 'aria-label': alt ?? emoji })}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={alt ?? emoji}
      {...(decorative ? { 'aria-hidden': true } : {})}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
