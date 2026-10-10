// v-drag-close — lets users drag a bottom sheet downward to dismiss it.
//
// Attach to the `.bottom-sheet` element; the binding value is the close
// callback, e.g. `v-drag-close="() => $emit('close')"` or `v-drag-close="closeSheet"`.
//
// Touch: drag anywhere on the sheet. If the drag starts inside a scrolled
// `.sheet-content`, the content scrolls instead (the drag only takes over once
// the content is at the top). Mouse (desktop): drag from the handle or header.

const CLOSE_DISTANCE = 110 // px dragged past which the sheet closes on release
const FLICK_VELOCITY = 0.6 // px/ms downward flick that closes regardless of distance
const EXIT_MS = 280 // slide-out animation duration

function createController(el, getClose) {
  const state = {
    active: false,
    dragging: false,
    startY: 0,
    delta: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    scrollEl: null,
  }

  const setY = (y) => {
    el.style.transform = `translateY(${y}px)`
  }

  const begin = () => {
    state.dragging = true
    el.style.transition = 'none'
    el.style.willChange = 'transform'
  }

  const reset = () => {
    el.style.transition = ''
    el.style.transform = ''
    el.style.willChange = ''
  }

  const exit = () => {
    const overlay = el.parentElement
    el.style.transition = `transform ${EXIT_MS}ms ease-in`
    el.style.transform = 'translateY(100%)'
    if (overlay) {
      overlay.style.transition = `opacity ${EXIT_MS}ms ease`
      overlay.style.opacity = '0'
    }
    // Close once the sheet has slid out. We intentionally leave the sheet
    // translated off-screen so it doesn't flash back into view before the
    // parent unmounts it (all sheets are toggled with v-if, not v-show).
    window.setTimeout(() => {
      const close = getClose()
      if (typeof close === 'function') close()
    }, EXIT_MS)
  }

  const start = (y) => {
    state.active = true
    state.dragging = false
    state.startY = y
    state.lastY = y
    state.lastT = performance.now()
    state.delta = 0
    state.velocity = 0
    state.scrollEl = el.querySelector('.sheet-content')
  }

  const move = (y, e) => {
    if (!state.active) return
    const delta = y - state.startY

    if (!state.dragging) {
      if (delta <= 2) return // ignore upward / negligible movement
      // Let the content scroll when it isn't already at the top.
      if (state.scrollEl && state.scrollEl.scrollTop > 0) {
        state.active = false
        return
      }
      begin()
    }

    const now = performance.now()
    const dt = now - state.lastT
    if (dt > 0) state.velocity = (y - state.lastY) / dt
    state.lastY = y
    state.lastT = now

    state.delta = Math.max(0, delta)
    if (e && e.cancelable) e.preventDefault()
    setY(state.delta)
  }

  const end = () => {
    if (state.dragging) {
      const flick = state.velocity > FLICK_VELOCITY && state.delta > 20
      if (state.delta > CLOSE_DISTANCE || flick) exit()
      else reset()
    }
    state.active = false
    state.dragging = false
  }

  // --- touch ---
  const onTouchStart = (e) => {
    if (e.touches.length === 1) start(e.touches[0].clientY)
  }
  const onTouchMove = (e) => {
    if (state.active) move(e.touches[0].clientY, e)
  }
  const onTouchEnd = () => end()

  // --- mouse (desktop): only from the handle / header ---
  const onMouseMove = (e) => move(e.clientY, e)
  const onMouseUp = () => {
    end()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  const onMouseDown = (e) => {
    if (e.button !== 0 || !e.target.closest('.sheet-handle, .sheet-header')) return
    start(e.clientY)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd)
  el.addEventListener('touchcancel', onTouchEnd)
  el.addEventListener('mousedown', onMouseDown)

  return {
    destroy() {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    },
  }
}

export const vDragClose = {
  mounted(el, binding) {
    el.__dragCloseValue = binding.value
    el.__dragClose = createController(el, () => el.__dragCloseValue)
  },
  updated(el, binding) {
    el.__dragCloseValue = binding.value
  },
  unmounted(el) {
    el.__dragClose?.destroy()
    delete el.__dragClose
    delete el.__dragCloseValue
  },
}
