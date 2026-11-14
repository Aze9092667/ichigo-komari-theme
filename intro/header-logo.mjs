import { readFileSync } from 'node:fs'

export const headerLogoPath = '/images/ichigo/bleach-tybw-ja-white.svg'
const oldPath = '/images/ichigo/bleach-tybw-v9.svg'
const oldAlt = 'BLEACH · Thousand-Year Blood War'
const newAlt = 'BLEACH 千年血戦篇'

// Use the same Japanese lettering as the opening, without its animation styles.
const openingLogo = readFileSync(new URL('bleach-opening-ja.svg', import.meta.url), 'utf8')
export const headerLogoSvg = openingLogo
  .replace(/\s(?:class|aria-hidden|focusable)="[^"]*"/g, '')
  .replace('<svg ', '<svg fill="#ffffff" ')

export function installHeaderLogo(content) {
  if (!content.includes(oldPath) && !content.includes(headerLogoPath)) {
    throw new Error('Cannot find the BLEACH header logo')
  }
  return content.replace(oldPath, headerLogoPath).replace(oldAlt, newAlt)
}
