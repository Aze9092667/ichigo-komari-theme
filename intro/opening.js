;(function () {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (location.pathname !== '/' || location.hash || motion.matches ||
      document.visibilityState === 'hidden' ||
      performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return

  const intro = document.createElement('div')
  intro.id = 'ichigo-intro'
  intro.setAttribute('aria-hidden', 'true')
  const logo = document.getElementById('ichigo-intro-mark-ja')
  if (!logo?.content) return
  intro.innerHTML = '<div class="ichigo-intro__curtain ichigo-intro__curtain--top"></div>' +
    '<div class="ichigo-intro__curtain ichigo-intro__curtain--bottom"></div>' +
    '<div class="ichigo-intro__slash"><i></i></div>' +
    '<div class="ichigo-intro__mark"></div>'
  intro.lastElementChild.append(logo.content.cloneNode(true))
  let fallback
  function dismiss() {
    window.clearTimeout(fallback)
    window.removeEventListener('pagehide', dismiss)
    window.removeEventListener('keydown', skip)
    intro.remove()
  }
  function skip(event) {
    if (event.key === 'Escape' || event.key === 'Tab') dismiss()
  }
  intro.addEventListener('animationend', event => {
    if (event.target === intro) dismiss()
  })
  window.addEventListener('pagehide', dismiss, { once: true })
  window.addEventListener('keydown', skip)
  fallback = window.setTimeout(dismiss, 4000)
  document.body.append(intro)
})()
