import { a as shallowRef } from './vue-vendor-D4cUfCy9.js'
import type { AddressFamilySummary } from './addressFamilies'
export const THEME = 'Reze-Route'
export const routeState = shallowRef({ settings: {} as Record<string, any>, nodes: [] as any[], pingTasks: [] as any[], pingTasksLoaded: false, results: {} as Record<string,string>, addressFamilies: {} as AddressFamilySummary, admin: false, busy: false, status: '', jobs: {} as Record<string,any>, helpers: {} as Record<string,any> })
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
export function orderTasks<T extends { id?: string|number, weight?: number }>(tasks: T[]): T[] {
  const configured=routeState.value.pingTasks.map((task,index)=>({task,index})).sort((a,b)=>
    Number.isFinite(a.task.weight)&&Number.isFinite(b.task.weight)?a.task.weight-b.task.weight||a.index-b.index:a.index-b.index).map(entry=>entry.task)
  const positions=new Map(configured.map((task,index)=>[String(task.id),index]))
  return tasks.map((task,index) => ({task,index})).sort((a,b) => {
    const left=positions.get(String(a.task.id)),right=positions.get(String(b.task.id))
    if(left!==undefined||right!==undefined)return (left??Number.MAX_SAFE_INTEGER)-(right??Number.MAX_SAFE_INTEGER)||a.index-b.index
    return Number.isFinite(a.task.weight)&&Number.isFinite(b.task.weight)?a.task.weight!-b.task.weight!||a.index-b.index:a.index-b.index
  }).map(entry => entry.task)
}
