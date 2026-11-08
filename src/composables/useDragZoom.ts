import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { DRAG_THRESHOLD } from '../constants/chart'

type ChartArea = { left: number; right: number }

export type DragZoomOptions = {
  /** Zone du graphique en pixels, relative au canvas. */
  getChartArea: () => ChartArea | null
  /** Convertit une position horizontale du canvas en timestamp. */
  toTimestamp: (pixelX: number) => number | null
  onZoom: (startMs: number, endMs: number) => void
}

type DragState = 'idle' | 'pending' | 'dragging'

const OVERLAY_STYLE = {
  position: 'absolute',
  top: '0',
  height: '100%',
  background: 'rgba(224, 82, 151, 0.15)',
  border: '1px solid rgba(224, 82, 151, 0.6)',
  pointerEvents: 'none',
  display: 'none',
  zIndex: '10',
} as const

/**
 * Sélection d'une plage de dates au doigt ou à la souris sur un canvas.
 * Sur mobile, un geste vertical laisse la page défiler : seul un
 * déplacement horizontal déclenche le zoom.
 */
export function useDragZoom(canvas: Ref<HTMLCanvasElement | null>, options: DragZoomOptions): void {
  let startX: number | null = null
  let startTouch: { x: number; y: number } | null = null
  let state: DragState = 'idle'
  let overlay: HTMLElement | null = null

  function toCanvasX(clientX: number): number | null {
    const area = options.getChartArea()
    if (!area || !canvas.value) return null
    const rect = canvas.value.getBoundingClientRect()
    return Math.max(area.left, Math.min(clientX - rect.left, area.right))
  }

  function ensureOverlay(): HTMLElement | null {
    const parent = canvas.value?.parentElement
    if (!overlay && parent) {
      overlay = document.createElement('div')
      Object.assign(overlay.style, OVERLAY_STYLE)
      parent.appendChild(overlay)
    }
    return overlay
  }

  function showOverlay(x: number): void {
    if (startX === null) return
    const element = ensureOverlay()
    if (!element) return
    element.style.display = 'block'
    element.style.left = `${Math.min(startX, x)}px`
    element.style.width = `${Math.abs(x - startX)}px`
  }

  function hideOverlay(): void {
    if (overlay) overlay.style.display = 'none'
  }

  function reset(): void {
    startX = null
    startTouch = null
    state = 'idle'
    hideOverlay()
    document.removeEventListener('mousemove', onDocumentMouseMove)
    document.removeEventListener('mouseup', onDocumentMouseUp)
    document.removeEventListener('touchmove', onDocumentTouchMove)
    document.removeEventListener('touchend', onDocumentTouchEnd)
    document.removeEventListener('touchcancel', onDocumentTouchEnd)
  }

  function finalizeDrag(endX: number | null): void {
    const originX = startX
    reset()
    if (originX === null || endX === null) return
    if (Math.abs(endX - originX) < DRAG_THRESHOLD) return

    const first = options.toTimestamp(Math.min(originX, endX))
    const last = options.toTimestamp(Math.max(originX, endX))
    if (first == null || last == null) return
    options.onZoom(first, last)
  }

  function onCanvasMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return
    const x = toCanvasX(event.clientX)
    if (x === null) return

    event.preventDefault()
    startX = x
    state = 'dragging'
    showOverlay(x)
    document.addEventListener('mousemove', onDocumentMouseMove)
    document.addEventListener('mouseup', onDocumentMouseUp)
  }

  function onDocumentMouseMove(event: MouseEvent): void {
    if (state !== 'dragging') return
    const x = toCanvasX(event.clientX)
    if (x !== null) showOverlay(x)
  }

  function onDocumentMouseUp(event: MouseEvent): void {
    finalizeDrag(toCanvasX(event.clientX))
  }

  function onCanvasTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    const x = toCanvasX(touch.clientX)
    if (x === null) return

    startX = x
    startTouch = { x: touch.clientX, y: touch.clientY }
    state = 'pending'
    document.addEventListener('touchmove', onDocumentTouchMove, { passive: false })
    document.addEventListener('touchend', onDocumentTouchEnd)
    document.addEventListener('touchcancel', onDocumentTouchEnd)
  }

  function onDocumentTouchMove(event: TouchEvent): void {
    const touch = event.touches[0]
    if (!touch || startTouch === null) return

    if (state === 'pending') {
      const deltaX = Math.abs(touch.clientX - startTouch.x)
      const deltaY = Math.abs(touch.clientY - startTouch.y)
      // Geste vertical : on laisse la page défiler.
      if (deltaY > deltaX && deltaY > DRAG_THRESHOLD) {
        reset()
        return
      }
      if (deltaX <= DRAG_THRESHOLD) return
      state = 'dragging'
    }

    event.preventDefault()
    const x = toCanvasX(touch.clientX)
    if (x !== null) showOverlay(x)
  }

  function onDocumentTouchEnd(event: TouchEvent): void {
    if (state !== 'dragging') {
      reset()
      return
    }
    const touch = event.changedTouches[0]
    finalizeDrag(touch ? toCanvasX(touch.clientX) : null)
  }

  onMounted(() => {
    canvas.value?.addEventListener('mousedown', onCanvasMouseDown)
    canvas.value?.addEventListener('touchstart', onCanvasTouchStart, { passive: true })
  })

  onBeforeUnmount(() => {
    canvas.value?.removeEventListener('mousedown', onCanvasMouseDown)
    canvas.value?.removeEventListener('touchstart', onCanvasTouchStart)
    reset()
    overlay?.remove()
    overlay = null
  })
}
