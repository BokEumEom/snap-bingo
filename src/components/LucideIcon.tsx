import {
  HelpCircle,
  Trophy,
  type LucideIcon as LucideIconComponent,
} from 'lucide-react';

// 이름(문자열)으로 참조하는 아이콘만 명시적으로 등록해요.
// `import * as Icons` + 동적 접근(Icons[name])은 트리셰이킹을 막아
// lucide-react 전체(~1500개)를 번들에 포함시키므로, 실제 쓰는 아이콘만 매핑합니다.
// 빙고 칸 힌트는 이모지로 바뀌었고, 지금 name으로 참조되는 건 대시보드의 Trophy뿐이에요.
const ICON_REGISTRY: Record<string, LucideIconComponent> = {
  Trophy,
};

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size = 24 }: LucideIconProps) {
  const IconComponent = ICON_REGISTRY[name] ?? HelpCircle;
  return <IconComponent className={className} size={size} />;
}
