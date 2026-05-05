'use client'

import { useEffect, useRef, useState } from 'react'

interface SafeHtmlProps {
  html: string
  className?: string
  /** min height in px, default 60 */
  minHeight?: number
}

/**
 * Renders arbitrary HTML inside a sandboxed iframe so that
 * its styles/scripts cannot leak into the parent page layout.
 * Scripts are allowed to run (for canvas, games, etc.)
 * but isolated from the parent page.
 * The iframe auto-resizes to fit its content via postMessage.
 */
export default function SafeHtml({ html, className, minHeight = 60 }: SafeHtmlProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(minHeight)

  // Auto-resize reporter script (injected before </body>)
  const resizeScript = `<script>
(function(){
  function reportHeight(){
    var h = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    window.parent.postMessage({type:'safehtml-resize',height:h},'*');
  }
  reportHeight();
  window.addEventListener('load', reportHeight);
  window.addEventListener('resize', reportHeight);
  new MutationObserver(reportHeight).observe(document.body,{childList:true,subtree:true,attributes:true});
  setInterval(reportHeight, 500);
})();
</script>`

  // Detect if html is already a complete document
  const isFullDoc = /<!DOCTYPE|<html[\s>]/i.test(html)

  let srcdoc: string
  if (isFullDoc) {
    // Inject resize script before </body> (or at the end)
    if (/<\/body>/i.test(html)) {
      srcdoc = html.replace(/<\/body>/i, resizeScript + '</body>')
    } else {
      srcdoc = html + resizeScript
    }
  } else {
    // Wrap fragment in a basic document
    srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>${html}${resizeScript}</body>
</html>`
  }

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'safehtml-resize' && typeof e.data.height === 'number') {
        const iframe = iframeRef.current
        if (iframe && e.source === iframe.contentWindow) {
          setHeight(Math.max(e.data.height, minHeight))
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [minHeight])

  return (
    <iframe
      ref={iframeRef}
      className={className}
      srcDoc={srcdoc}
      sandbox="allow-scripts allow-same-origin"
      style={{
        width: '100%',
        border: 'none',
        height: `${height}px`,
        display: 'block',
      }}
      title="内容预览"
    />
  )
}
