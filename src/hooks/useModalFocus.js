import { useEffect, useRef } from 'react'

// Selector for elements a keyboard user can reach inside a modal/drawer.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * WCAG 2.4.3 / 2.1.2 focus management for custom (non-Radix) modals & drawers.
 *
 * - On open: remembers the previously focused element and moves focus to the
 *   first focusable inside `containerRef` (or `initialFocusRef` if given).
 * - While open: traps Tab / Shift+Tab so focus cycles within the container and
 *   cannot escape into the background page.
 * - On close: restores focus to the element that opened the modal.
 *
 * `onClose` (optional) is invoked on Escape; Escape is only handled here when
 * provided so components that already listen for Escape are not double-bound.
 *
 * @param {{
 *   active: boolean,
 *   containerRef: import('react').MutableRefObject<HTMLElement | null>,
 *   initialFocusRef?: import('react').MutableRefObject<HTMLElement | null>,
 *   restoreFocusRef?: import('react').MutableRefObject<HTMLElement | null>,
 *   onClose?: () => void,
 * }} options
 */
export default function useModalFocus({ active, containerRef, initialFocusRef, restoreFocusRef, onClose }) {
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!active) return

    previouslyFocusedRef.current = document.activeElement

    // Move focus in after the modal has painted.
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current
      if (!container) return
      const candidates = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
      const target = initialFocusRef?.current || (candidates.find((el) => el instanceof HTMLElement) ?? null)
      if (target instanceof HTMLElement) {
        target.focus()
      } else {
        // Give screen readers an anchor even if the modal has no focusable content.
        container.setAttribute('tabindex', '-1')
        container.focus()
      }
    })

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) {
          e.stopPropagation()
          onClose()
        }
        return
      }
      if (e.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return
      const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) =>
          el instanceof HTMLElement &&
          (el.offsetParent !== null || el === document.activeElement || el === initialFocusRef?.current)
      )
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = /** @type {HTMLElement} */ (focusables[0])
      const last = /** @type {HTMLElement} */ (focusables[focusables.length - 1])
      const activeEl = document.activeElement

      if (e.shiftKey && (activeEl === first || !container.contains(activeEl))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeEl === last || !container.contains(activeEl))) {
        e.preventDefault()
        first.focus()
      }
    }

    // Capture phase so the trap wins over any page-level Tab handlers.
    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown, true)
      // Prefer an explicit trigger ref (covers programmatic/other open paths),
      // then fall back to whatever had focus when the modal opened.
      const preferred = restoreFocusRef?.current || previouslyFocusedRef.current
      if (preferred instanceof HTMLElement && document.contains(preferred)) {
        preferred.focus()
      } else if (previouslyFocusedRef.current instanceof HTMLElement && document.contains(previouslyFocusedRef.current)) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [active, containerRef, initialFocusRef, restoreFocusRef, onClose])
}
