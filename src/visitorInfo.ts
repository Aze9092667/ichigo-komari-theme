import { E as h, a as shallowRef, f as onMounted, B as onUnmounted, w as watch } from './vue-vendor-D4cUfCy9.js'
import { validReportedAddress } from './addressFamilies'

export type VisitorNetwork = { ip:string, city:string, region:string, country:string, org:string }
const CACHE_KEY = 'ichigo:visitor-network:v1'
const SUCCESS_TTL = 30*60*1000
const FAILURE_TTL = 5*60*1000
const PROVIDERS = ['https://ipwho.is/','https://ipapi.co/json/','https://api.ip.sb/geoip']
const clean = (value:unknown) => typeof value==='string' ? value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,160) : ''

export function normalizeVisitorNetwork(value:unknown):VisitorNetwork|null {
  if(!value || typeof value!=='object' || Array.isArray(value))return null
  const data=value as Record<string,any>
  if(data.success===false || data.error===true)return null
  const ip=clean(data.ip)
  if(!validReportedAddress(ip,'ipv4')&&!validReportedAddress(ip,'ipv6'))return null
  return {ip,city:clean(data.city),region:clean(data.region),country:clean(data.country_name||data.country),org:clean(data.org||data.connection?.org||data.connection?.isp||data.organization||data.isp)}
}

export function readVisitorCache(storage:Pick<Storage,'getItem'>,now=Date.now()):{data:VisitorNetwork|null}|null {
  try {
    const entry=JSON.parse(storage.getItem(CACHE_KEY)||'null')
    if(!entry || !Number.isFinite(entry.at) || entry.at>now || now-entry.at>(entry.data?SUCCESS_TTL:FAILURE_TTL))return null
    const data=entry.data===null?null:normalizeVisitorNetwork(entry.data)
    return entry.data!==null&&!data?null:{data}
  } catch {return null}
}

function writeCache(data:VisitorNetwork|null) {
  try {sessionStorage.setItem(CACHE_KEY,JSON.stringify({at:Date.now(),data}))} catch {}
}

export async function lookupVisitorNetwork(signal:AbortSignal):Promise<VisitorNetwork|null> {
  for(const url of PROVIDERS) {
    if(signal.aborted)return null
    const controller=new AbortController(),abort=()=>controller.abort()
    signal.addEventListener('abort',abort,{once:true})
    const timeout=setTimeout(abort,6000)
    try {
      // Each provider only sees the requesting browser; no site or node data is submitted.
      const response=await fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',headers:{Accept:'application/json'}})
      if(response.ok) {
        const data=normalizeVisitorNetwork(await response.json())
        if(data)return data
      }
    } catch {} finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort',abort)
    }
  }
  return null
}

export function visitorDevice(userAgent:string) {
  const os=/Android/i.test(userAgent)?'Android':/iPhone|iPad|iPod/i.test(userAgent)?'iOS':/Windows/i.test(userAgent)?'Windows':/Mac/i.test(userAgent)?'macOS':/Linux/i.test(userAgent)?'Linux':'当前设备'
  const browser=/Edg(?:e|A|iOS)?\//i.test(userAgent)?'Edge':/Firefox|FxiOS/i.test(userAgent)?'Firefox':/Chrome|CriOS/i.test(userAgent)?'Chrome':/Safari/i.test(userAgent)?'Safari':'浏览器'
  return {os,browser}
}

const glyph=(path:string)=>h('svg',{viewBox:'0 0 24 24',width:14,height:14,fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'},[h('path',{d:path})])
const closeIcon=()=>glyph('M6 6l12 12M18 6 6 18')
const globeIcon=()=>glyph('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z')
const deviceIcon=()=>glyph('M4 4h16v12H4zM2 20h20M8 16v4m8-4v4')
const userIcon=()=>glyph('M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2')

export const VisitorInfo={name:'IchigoVisitorInfo',props:{enabled:Boolean,admin:Boolean},setup(props:{enabled:boolean,admin:boolean}) {
  const state=shallowRef({loading:true,data:null as VisitorNetwork|null}),dismissed=shallowRef(false),mobileScrolling=shallowRef(false),expanded=shallowRef<boolean|null>(null)
  const wideViewport=window.matchMedia('(min-width:1952px)'),wide=shallowRef(wideViewport.matches)
  let controller:AbortController|null=null,requestId=0,idleTimer:ReturnType<typeof setTimeout>|undefined
  const device=visitorDevice(navigator.userAgent)
  function cancel(){requestId++;controller?.abort();controller=null}
  function dismiss(){dismissed.value=true;cancel()}
  async function load(){
    cancel()
    if(!props.enabled||dismissed.value)return
    let cached:{data:VisitorNetwork|null}|null=null
    try {cached=readVisitorCache(sessionStorage)} catch {}
    if(cached){state.value={loading:false,data:cached.data};return}
    const thisRequest=requestId
    controller=new AbortController()
    state.value={loading:true,data:null}
    const data=await lookupVisitorNetwork(controller.signal)
    if(thisRequest!==requestId)return
    controller=null
    state.value={loading:false,data}
    writeCache(data)
  }
  function scrolling(){
    if(!window.matchMedia('(max-width:767px)').matches)return
    mobileScrolling.value=true
    clearTimeout(idleTimer)
    idleTimer=setTimeout(()=>{mobileScrolling.value=false},700)
  }
  const viewportChanged=(event:MediaQueryListEvent)=>{wide.value=event.matches}
  watch(()=>props.enabled,enabled=>{if(enabled){dismissed.value=false;void load()}else cancel()},{immediate:true})
  onMounted(()=>{window.addEventListener('scroll',scrolling,{passive:true});wideViewport.addEventListener('change',viewportChanged)})
  onUnmounted(()=>{cancel();clearTimeout(idleTimer);window.removeEventListener('scroll',scrolling);wideViewport.removeEventListener('change',viewportChanged)})
  return()=>{
    if(!props.enabled||dismissed.value)return null
    const {data,loading}=state.value
    const ip=data?.ip||(loading?'获取网络信息…':'网络信息暂不可用')
    const location=[data?.city,data?.region].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · ')||data?.country||(loading?'定位中':'未知地区')
    const label=props.admin?'管理员':'访客'
    const close=()=>h('button',{type:'button',class:'ichigo-visitor-close','aria-label':'关闭访客信息',title:'关闭访客信息',onClick:dismiss},[closeIcon()])
    const detailVisible=expanded.value===null?wide.value:expanded.value
    return h('aside',{class:'ichigo-visitor','aria-label':'访客网络信息'},[
      h('section',{class:['ichigo-visitor-card',expanded.value===true?'is-open':expanded.value===false?'is-collapsed':''],'aria-label':label+'信息'},[
        h('div',{class:'ichigo-visitor-head'},[h('span',{class:'ichigo-visitor-avatar'},[userIcon()]),h('div',{class:'ichigo-visitor-identity'},[h('strong',null,label),h('span',{title:location},location)]),close()]),
        h('p',{class:'ichigo-visitor-welcome'},data?'欢迎来自 '+(data.city||data.country||'远方')+' 的你':loading?'正在获取公网出口信息':'欢迎访问，公网定位暂不可用'),
        h('div',{class:'ichigo-visitor-details'},[
          h('div',null,[deviceIcon(),h('span',null,device.os+' · '+device.browser)]),
          h('div',null,[globeIcon(),h('span',{class:'ichigo-visitor-ip',title:ip},ip)]),
          h('div',null,[h('span',{class:'ichigo-visitor-detail-mark','aria-hidden':'true'},'◇'),h('span',{title:data?.org||''},data?.org||(loading?'正在获取运营商':'运营商未知'))]),
          h('div',null,[h('span',{class:'ichigo-visitor-detail-mark','aria-hidden':'true'},'◷'),h('span',null,new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}))])
        ]),h('span',{class:'ichigo-visitor-note'},'IP 归属仅供参考')
      ]),
      h('div',{class:['ichigo-visitor-bar',mobileScrolling.value?'is-scrolling':''],'aria-label':'当前访客网络'},[
        globeIcon(),h('span',{class:'ichigo-visitor-bar-label'},'你的 IP'),h('strong',{title:ip},ip),data?.country?h('span',{class:'ichigo-visitor-country'},data.country):null,data?.org?h('span',{class:'ichigo-visitor-org',title:data.org},data.org):null,h('button',{type:'button',class:'ichigo-visitor-expand','aria-label':detailVisible?'收起访客信息':'展开访客信息','aria-expanded':detailVisible,title:detailVisible?'收起访客信息':'展开访客信息',onClick:()=>{expanded.value=!detailVisible}},[userIcon()]),close()
      ])
    ])
  }
}}
