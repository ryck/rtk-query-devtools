export const SPIN_ANIMATION_NAME = "rtkq-devtools-spin";

/**
 * Injects the single `@keyframes` rule spinning icons rely on. The panel
 * intentionally ships no global stylesheet (it renders into the host page),
 * so this is the one scoped exception — rendered once at the panel root.
 */
export function SpinKeyframes() {
  return <style>{`@keyframes ${SPIN_ANIMATION_NAME} { to { transform: rotate(360deg); } }`}</style>;
}
