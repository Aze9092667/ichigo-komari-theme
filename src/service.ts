import { routeState, update, THEME, mainland, paused } from './state'
import { normalizeRouteProbeResults, mergeRouteProbeResults, resolveNodeRouteTag } from './routeProbeResults'
import { parseNodeRouteTag } from './routeTag'
import { ADDRESS_FAMILIES_KEY, normalizeAddressFamilies, reportedAddressFamilies, mergeAddressFamilies } from './addressFamilies'
import type { AddressFamilyObservations } from './addressFamilies'
const ROOT = '/api/transit-route-probe/v1'
let lastAttempt = 0
let settingsQueue: Promise<unknown> = Promise.resolve()
async function json(path: string, body?: unknown, credentials: RequestCredentials = 'include') {
  const r = await fetch(path, { credentials, cache:'no-store', method:body ? 'POST':'GET',
    headers:{Accept:'application/json', ...(path.startsWith(ROOT)?{'X-Transit-Route-Probe':'1'}:{}), ...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{}), signal:AbortSignal.timeout(15000) })
  if (!r.ok) throw Error(`接口请求失败 (${r.status})`)
  const j=await r.json(); return j?.data !== undefined ? j.data : j
}
export function mayWrite(admin:boolean,theme:string) { return admin && theme === THEME }
export function successfulResults(jobs:any[]) {
  return normalizeRouteProbeResults(Object.fromEntries(jobs.filter(j=>j.status==='completed' && j.tag).map(j=>[j.client,j.tag])))
}
function acceptSettings(pub: any) {
  update({settings:pub.theme_settings || {}, results:normalizeRouteProbeResults(pub.theme_settings?.pandaOpsRouteProbeResults),
    addressFamilies:normalizeAddressFamilies(pub.theme_settings?.[ADDRESS_FAMILIES_KEY])})
}
function settingsTransaction(run: () => Promise<void>): Promise<void> {
  const task = settingsQueue.then(async () => {
    if (navigator.locks) await navigator.locks.request('reze-route-settings', run)
    else await run()
  })
  settingsQueue = task.catch(() => {})
  return task
}
async function syncAddressFamilies(observed: AddressFamilyObservations) {
  await settingsTransaction(async () => {
    const [pub,me] = await Promise.all([json('/api/public'),json('/api/me')])
    if (!mayWrite(!!me.logged_in,pub.theme)) throw Error('登录已失效或主题已切换')
    // Use the anonymous node roster so hidden nodes never enter public settings.
    const publicNodes = await json('/api/nodes', undefined, 'omit')
    if (!Array.isArray(publicNodes)) throw Error('公开节点列表暂时无法读取')
    const publicIds = publicNodes.filter(node => node && typeof node.uuid === 'string' && node.uuid).map(node => node.uuid)
    const settings = {...(pub.theme_settings || {})}
    const families = mergeAddressFamilies(normalizeAddressFamilies(settings[ADDRESS_FAMILIES_KEY]), observed, publicIds)
    const serialized = JSON.stringify(families)
    if (settings[ADDRESS_FAMILIES_KEY] === serialized || (!Object.hasOwn(settings, ADDRESS_FAMILIES_KEY) && serialized === '{}')) {
      acceptSettings(pub)
      return
    }
    settings[ADDRESS_FAMILIES_KEY] = serialized
    await json('/api/admin/theme/settings?theme='+encodeURIComponent(THEME), settings)
    const verify = await json('/api/public')
    if (verify.theme !== THEME || JSON.stringify(normalizeAddressFamilies(verify.theme_settings?.[ADDRESS_FAMILIES_KEY])) !== serialized) throw Error('IP 协议摘要保存校验失败')
    acceptSettings(verify)
  })
}
export async function load() {
  const [pub,nodes,me,pingTasks] = await Promise.all([json('/api/public'),json('/api/nodes'),json('/api/me'),json('/api/task/ping').catch(()=>null)])
  if (pub.theme !== THEME) return false
  const roster = Array.isArray(nodes) ? nodes : []
  acceptSettings(pub)
  update({nodes:roster, admin:!!me.logged_in,...(Array.isArray(pingTasks)?{pingTasks,pingTasksLoaded:true}:{})})
  if (me.logged_in) {
    const authenticatedNodes=await json('/api/admin/client/list').catch(()=>null)
    if(Array.isArray(authenticatedNodes))await syncAddressFamilies(reportedAddressFamilies(authenticatedNodes)).catch(() => {})
  }
  return true
}
async function save(incoming:Record<string,string>) {
  if (!Object.keys(incoming).length) return
  await settingsTransaction(async () => {
    const [pub,me] = await Promise.all([json('/api/public'),json('/api/me')])
    if (!mayWrite(!!me.logged_in,pub.theme)) throw Error('登录已失效或主题已切换')
    const settings={...(pub.theme_settings||{})}
    const before=normalizeRouteProbeResults(settings.pandaOpsRouteProbeResults)
    const merged=mergeRouteProbeResults(before,incoming)
    if (Object.keys(before).length===Object.keys(merged).length && Object.entries(merged).every(([id,tag])=>before[id]===tag)) {acceptSettings(pub);return}
    settings.pandaOpsRouteProbeResults=JSON.stringify(merged)
    await json('/api/admin/theme/settings?theme='+encodeURIComponent(THEME), settings)
    const verify=await json('/api/public')
    if (verify.theme !== THEME) throw Error('主题已切换')
    const results=normalizeRouteProbeResults(verify.theme_settings?.pandaOpsRouteProbeResults)
    for (const [id,tag] of Object.entries(incoming)) if (!results[id] || (parseNodeRouteTag(results[id])?.measuredAt||0)<(parseNodeRouteTag(tag)?.measuredAt||0)) throw Error('结果保存校验失败')
    acceptSettings(verify)
  })
}
async function collect(uuid?:string) {
  if (routeState.value.busy || !routeState.value.admin || document.hidden) return
  if (!uuid && (routeState.value.settings.azeRouteAuto === false || Date.now()-lastAttempt<15*60000)) return
  update({busy:true})
  try {
    if (!await load() || !routeState.value.admin) return
    const st=routeState.value
    const candidates=st.nodes.filter(n=>!mainland(n) && !paused(n) && (!uuid || n.uuid===uuid))
    if (!candidates.length) return
    const health=await json(ROOT+'/health')
    if (!health.ok || health.protocol!==1) throw Error('回程插件未就绪')
    const roster=await json(ROOT+'/roster?clients='+encodeURIComponent(candidates.map(n=>n.uuid).join(',')))
    update({helpers:Object.fromEntries(roster.clients.map((h:any)=>[h.client,h]))})
    const clients=candidates.filter(n=>{
      const helper=roster.clients.find((h:any)=>h.client===n.uuid)
      if (!helper?.helper_seen_at || Date.now()-helper.helper_seen_at>180000 || (helper.active_job_until||0)>Date.now()) return false
      const report=parseNodeRouteTag(resolveNodeRouteTag(n.uuid,n.tags,st.results))
      return uuid || !report?.measuredAt || report.freshness==='stale'
    }).map(n=>n.uuid)
    lastAttempt=Date.now()
    if (!clients.length) {update({status:'结果保持最新，未连接助手的节点暂不采集'});return}
    let batch=await json(ROOT+'/enqueue',{clients,city:'beijing'})
    const until=Date.now()+10*60000
    let saved=''
    while(true){
      const jobs=Object.fromEntries(batch.jobs.map((j:any)=>[j.client,j]))
      update({jobs:{...routeState.value.jobs,...jobs}})
      const incoming=successfulResults(batch.jobs)
      if(Object.keys(incoming).length && JSON.stringify(incoming)!==saved){await save(incoming);saved=JSON.stringify(incoming)}
      const done=batch.jobs.filter((j:any)=>['completed','failed'].includes(j.status)).length
      update({status:`回程采集 ${done}/${batch.jobs.length}，成功 ${Object.keys(incoming).length}`})
      if(batch.jobs.every((j:any)=>['completed','failed'].includes(j.status)))break
      if(Date.now()>=until)throw Error('本轮采集等待超时，保留上次成功结果')
      await new Promise(r=>setTimeout(r,5000))
      const [pub,me]=await Promise.all([json('/api/public'),json('/api/me')])
      if(!mayWrite(!!me.logged_in,pub.theme))throw Error('主题已切换或登录失效')
      batch=await json(ROOT+'/status?batch_id='+encodeURIComponent(batch.batch_id))
    }
  }catch(e){lastAttempt=Date.now();update({status:e instanceof Error?e.message:'本次采集失败'})}
  finally{update({busy:false})}
}
export async function refresh(uuid?:string){
  if(!routeState.value.admin || routeState.value.busy)return
  if(navigator.locks) await navigator.locks.request('reze-route-collection',{ifAvailable:true},async lock=>{if(lock)await collect(uuid)})
  else await collect(uuid)
}
export function start(){
  void load().then(ok=>{if(ok)setTimeout(()=>void refresh(),8000)}).catch(()=>update({status:'回程数据暂时无法读取'}))
  setInterval(()=>{if(!document.hidden)void load().then(ok=>{if(ok)void refresh()}).catch(()=>{})},60000)
}
