(function () {
  let isActive = false
  let scrollTimeout = null
  let lastText = ''
  const DEBOUNCE_MS = 600
  const MIN_CHARS = 30

  function getVisibleText() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const el = node.parentElement
          if (!el) return NodeFilter.FILTER_REJECT
          const style = getComputedStyle(el)
          if (style.visibility === 'hidden' || style.display === 'none') return NodeFilter.FILTER_REJECT
          const rect = el.getBoundingClientRect()
          if (rect.width < 10 || rect.height < 10) return NodeFilter.FILTER_REJECT
          if (rect.top > window.innerHeight || rect.bottom < 0) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      },
      false
    )
    const parts = []
    let node
    while ((node = walker.nextNode())) {
      const t = (node.textContent || '').trim()
      if (t.length > 0) parts.push(t)
    }
    return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  function capture() {
    if (!isActive) return
    const text = getVisibleText()
    if (text.length < MIN_CHARS) return
    if (text === lastText) return
    lastText = text
    try {
      chrome.runtime.sendMessage({ type: 'ENTRY', text })
    } catch (_) {}
  }

  function scheduleCapture() {
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(capture, DEBOUNCE_MS)
  }

  window.addEventListener('scroll', scheduleCapture, { passive: true })
  window.addEventListener('resize', scheduleCapture)

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TOGGLE') {
      isActive = !!msg.active
      if (isActive) {
        lastText = ''
        scheduleCapture()
      }
    }
  })

  chrome.storage.local.get(['ghostwriter-portal-active'], (r) => {
    isActive = !!r['ghostwriter-portal-active']
    if (isActive) scheduleCapture()
  })
})()
