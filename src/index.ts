import { E as h } from './vue-vendor-D4cUfCy9.js'
import { routeState, mainland, paused, orderTasks } from './state'
import { parseNodeRouteTag } from './routeTag'
import { resolveNodeRouteTag } from './routeProbeResults'
import { refresh, start } from './service'
import { nodeAddressFamilies } from './addressFamilies'
export { orderTasks }
start()
export const AddressFamilyBadges = {name:'IchigoAddressFamilyBadges',props:{node:{type:Object,required:true}},setup(props:any){return()=>{
  const flags = nodeAddressFamilies(props.node, routeState.value.addressFamilies)
  const families = (['ipv4','ipv6'] as const).filter(family => flags[family])
  return families.length ? h('span',{class:'ichigo-ip-families',role:'group','aria-label':'已上报的 IP 协议'},families.map(family =>
    h('span',{key:family,class:['ichigo-ip-badge',family==='ipv4'?'ichigo-ip-badge--v4':'ichigo-ip-badge--v6'],title:'节点已上报 '+(family==='ipv4'?'IPv4':'IPv6')+'；不代表公网连通性'},family==='ipv4'?'IPv4':'IPv6'))) : null
}}}
const carriers = [{key:'CT',name:'电信',icon:'电',tone:'telecom'}, {key:'CU',name:'联通',icon:'联',tone:'unicom'}, {key:'CM',name:'移动',icon:'移',tone:'mobile'}]
export function domesticFacts(tasks:any[]){
  const latency=tasks.filter(t=>t.hasData!==false&&t.avgLoss!==100).map(t=>t.avgLatency).filter(v=>Number.isFinite(v)&&v>=0)
  const loss=tasks.filter(t=>t.hasData!==false).map(t=>t.avgLoss).filter(v=>Number.isFinite(v)&&v>=0&&v<=100)
  return [ {label:'拨测目标',value:tasks.length?tasks.length+' 条':'待配置'}, {label:'最低延迟',value:latency.length?Math.round(Math.min(...latency))+' ms':'等待采样'}, {label:'最高丢包',value:loss.length?Math.max(...loss).toFixed(1)+'%':'等待采样'} ]
}
export const RoutePanel={name:'AzeRoutePanel',props:{node:{type:Object,required:true},tasks:{type:Array,default:()=>[]}},setup(props:any){return()=>{
  const st=routeState.value,n=props.node,isLocal=mainland(n)
  const report=parseNodeRouteTag(resolveNodeRouteTag(n.uuid,n.tags,st.results))
  const job=st.jobs[n.uuid], pending=job && ['queued','running'].includes(job.status), failed=job?.status==='failed'
  const stale=report?.freshness==='stale'
  const status=isLocal?'国内节点':paused(n)?'已暂停':pending?'采集中':failed?'采集失败':report?stale?'结果已过期':'已采集':'等待采集'
  const measured=report?.measuredAt ? new Date(report.measuredAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}) : ''
  const footer=isLocal?'延迟拨测 · 独立延迟与丢包':report?'北京三网 · 更新 '+measured:paused(n)?'此节点暂不采集回程':failed?'本次失败 · 保留上次成功结果':pending?'节点正在探测北京三网':st.helpers[n.uuid]?.last_error?'助手上次采集未成功':'等待节点助手返回结果'
  const cards=isLocal?domesticFacts(props.tasks).map((f,i)=>h('div',{class:'aze-rp-tile aze-rp-local',key:i},[h('span',{class:'aze-rp-carrier'},f.label),h('strong',{class:'aze-rp-value'},f.value),h('span',{class:'aze-rp-note'},['独立任务','应答样本','最近 1 小时'][i])])):carriers.map(c=>{
    const e=report?.entries.find(e=>e.carrier===c.key), cl=e?.classification
    let label=cl?.label || '待采集'
    if (cl?.code.endsWith('_destination_only')) label='仅见目的网'
    else if(cl?.confidence==='inconclusive') label='证据不足'
    else label=label.replace(/^(电信|联通|移动)/,'')
    const title=e?`${cl?.label} · ${e.asns.join(' → ')||'无骨干跳点'} · ${cl?.evidence}`:footer
    return h('div',{class:['aze-rp-tile',c.tone,cl?.confidence||'empty',stale?'stale':''],key:c.key,title},[
      h('span',{class:'aze-rp-carrier'},[h('i',{class:'aze-rp-icon','aria-hidden':'true'},c.icon),c.name]),
      h('strong',{class:'aze-rp-value'},label),h('span',{class:'aze-rp-note','data-route-grade':cl?.grade || 'ungraded'},cl?.grade || (e?'不作线路定级':'暂无线路证据'))])
  })
  return h('section',{class:['aze-route-panel',isLocal?'local':'return'], 'data-route-node':n.uuid,'aria-label':isLocal?'本地链路':'三网回程'},[
    h('div',{class:'aze-rp-head'},[h('span',{class:'aze-rp-title'},[h('span',{'aria-hidden':'true',class:'aze-rp-mark'},isLocal?'◈':'⇄'),isLocal?'本地链路':'三网回程']),h('span',{class:['aze-rp-status',pending?'pending':'']},status),
      st.admin&&!isLocal&&!paused(n)?h('button',{type:'button',class:'aze-rp-refresh',title:st.status||'重新采集此节点三网回程','aria-label':'重新采集 '+n.name+' 三网回程',disabled:st.busy,onClick:(e:Event)=>{e.stopPropagation();void refresh(n.uuid)},onKeydown:(e:Event)=>e.stopPropagation()},[h('svg',{viewBox:'0 0 24 24',width:11,height:11,fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'},[h('path',{d:'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5'})])]):null]),
    h('div',{class:'aze-rp-grid'},cards),h('div',{class:'aze-rp-foot',title:footer},[h('span',{class:'aze-rp-dot','aria-hidden':'true'}),footer])])
}}}
