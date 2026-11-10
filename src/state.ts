import { a as shallowRef } from './vue-vendor-D4cUfCy9.js'
export const THEME = 'Reze-Route'
export const routeState = shallowRef({ settings: {} as Record<string, any>, nodes: [] as any[], results: {} as Record<string,string>, admin: false, busy: false, status: '', jobs: {} as Record<string,any>, helpers: {} as Record<string,any> })
export const update = (patch: Partial<typeof routeState.value>) => { routeState.value = { ...routeState.value, ...patch } }
export function mainland(node: any) {
  const region = String(node.region || '')
  const cps = [...region].map(c => c.codePointAt(0)).filter(c => c! >= 0x1f1e6 && c! <= 0x1f1ff)
  const code = cps.length >= 2 ? String.fromCharCode(cps[0]! - 0x1f1e6 + 65, cps[1]! - 0x1f1e6 + 65) : region.toUpperCase()
  return code === 'CN' || code === '中国'
}
export function paused(node: any) {
  const tags = Array.isArray(node.tags) ? node.tags : String(node.tags || '').split(/[\s,;|]+/)
  return tags.some((tag: any) => typeof tag === 'string' && tag.trim().toLowerCase() === 'route-probe:paused')
}
export function orderTasks<T extends { name?: string }>(tasks: T[]): T[] {
  return tasks.slice()
}
