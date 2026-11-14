import { readFileSync } from 'node:fs'

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8').trim()
export const introMarkup = `<!-- ichigo-intro:begin -->
<style id="ichigo-intro-styles">
${read('./opening.css')}
</style>
<template id="ichigo-intro-mark-ja">
${read('./bleach-opening-ja.svg')}
</template>
<script id="ichigo-intro-boot">
${read('./opening.js')}
</script>
<!-- ichigo-intro:end -->`

export function installBleachIntro(html) {
  const clean = html.replace(/<!-- ichigo-intro:begin -->[\s\S]*?<!-- ichigo-intro:end -->\r?\n/g, '')
  const appMount = '    <div id="app"></div>'
  if (clean.split(appMount).length !== 2) throw new Error('Cannot find the unique Komari app mount')
  return clean.replace(appMount, () => introMarkup + '\n' + appMount)
}
