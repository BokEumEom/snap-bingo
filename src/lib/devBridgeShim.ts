// Dev-only browser shim for the Apps-in-Toss native bridge.
//
// Outside the Toss WebView there's no `ReactNativeWebView`, so
// `window.__CONSTANT_HANDLER_MAP` is undefined and the bridge's
// `getConstant('getSafeAreaInsets')` throws "getSafeAreaInsets is not a
// constant handler". That throw fires inside `TDSMobileAITProvider`'s mount
// effect and tears down the whole React tree — the blank/frozen local preview.
//
// We seed a zero-inset fallback ONLY when running in a plain browser during
// dev: never inside the real app (guarded by the absent `ReactNativeWebView`),
// and never overwriting a value the native bridge already supplied. This lets
// `granite dev` / `vite dev` render in a normal browser for quick UI checks,
// while the sandbox WebView still provides the true safe-area insets.
type ConstantHandlerMap = Record<string, unknown>;

// react-native-safe-area-context EdgeInsets shape; zero is the correct default
// for a browser viewport with no device notch/home-indicator.
const ZERO_SAFE_AREA_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export function installDevBridgeShim(): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  // Real Toss WebView — leave the native constant map untouched.
  if ('ReactNativeWebView' in window) return;

  const target = window as unknown as { __CONSTANT_HANDLER_MAP?: ConstantHandlerMap };
  const map = (target.__CONSTANT_HANDLER_MAP ??= {});
  if (!('getSafeAreaInsets' in map)) {
    map.getSafeAreaInsets = ZERO_SAFE_AREA_INSETS;
  }
}
