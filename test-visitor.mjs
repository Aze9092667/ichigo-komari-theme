import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const source=name=>ts.transpileModule(fs.readFileSync('src/'+name+'.ts','utf8').replace(/^import[^\n]*\r?\n/gm,'').replace(/^export /gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const stored=new Map(),requests=[],watches=[],cleanups=[]
const storage={getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)}
let responseIndex=0,responses=[]
const context=vm.createContext({Date,JSON,Number,Set,Map,AbortController,setTimeout,clearTimeout,sessionStorage:storage,navigator:{userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0'},window:{matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),addEventListener(){},removeEventListener(){}},shallowRef:value=>({value}),h:(tag,props,children)=>({tag,props,children}),watch:(source,callback,options)=>{watches.push(callback);if(options?.immediate)callback(source())},onMounted:callback=>callback(),onUnmounted:callback=>cleanups.push(callback),fetch:async(url,options)=>{requests.push({url,options});const result=responses[responseIndex++];if(result instanceof Error)throw result;return {ok:true,json:async()=>result}}})
vm.runInContext(source('addressFamilies'),context)
vm.runInContext(source('visitorInfo'),context)
vm.runInContext('globalThis.api={normalizeVisitorNetwork,readVisitorCache,lookupVisitorNetwork,visitorDevice,VisitorInfo}',context)
const {api}=context
const normalized=api.normalizeVisitorNetwork({ip:'2001:db8::1',city:'Tokyo',region:'Tokyo',country:'Japan',connection:{org:'Example'},latitude:35.6,longitude:139.6,token:'must not persist'})
assert.deepEqual(JSON.parse(JSON.stringify(normalized)),{ip:'2001:db8::1',city:'Tokyo',region:'Tokyo',country:'Japan',org:'Example'})
assert.equal(api.normalizeVisitorNetwork({ip:'not an ip',city:'unknown'}),null)
assert.equal(api.normalizeVisitorNetwork({ip:'192.0.2.1',success:false}),null)
assert.equal(api.normalizeVisitorNetwork({ip:'192.0.2.1',error:true}),null)
assert.equal(api.visitorDevice('Mozilla/5.0 Android Chrome/140').os,'Android')
assert.equal(api.visitorDevice('Mozilla/5.0 iPhone Version/18 Safari/605').os,'iOS')
assert.equal(api.visitorDevice('Windows Chrome/140 Edg/140').browser,'Edge')
stored.set('ichigo:visitor-network:v1',JSON.stringify({at:1000,data:normalized}))
assert.equal(api.readVisitorCache(storage,1000+30*60*1000-1).data.ip,'2001:db8::1')
assert.equal(api.readVisitorCache(storage,1000+30*60*1000+1),null)
assert.equal(api.readVisitorCache(storage,999),null)
stored.set('ichigo:visitor-network:v1',JSON.stringify({at:1000,data:null}))
assert.equal(api.readVisitorCache(storage,1001).data,null)
assert.equal(api.readVisitorCache(storage,1000+5*60*1000+1),null)
const cancelled=new AbortController();cancelled.abort()
assert.equal(await api.lookupVisitorNetwork(cancelled.signal),null)
assert.equal(requests.length,0,'cancelled lookup must not contact any provider')
responses=[new Error('first unavailable'),{ip:'192.0.2.1',country_name:'Exampleland',org:'Example ISP'}]
const result=await api.lookupVisitorNetwork(new AbortController().signal)
assert.equal(result.country,'Exampleland')
assert.equal(requests.length,2,'fallback stops after first valid provider')
for(const request of requests){assert.equal(request.options.credentials,'omit');assert.equal(request.options.referrerPolicy,'no-referrer');assert.equal(request.options.body,undefined);assert.equal(Object.keys(request.options.headers).join(','),'Accept')}
requests.length=0
const offProps={enabled:false,admin:false},offRender=api.VisitorInfo.setup(offProps)
assert.equal(offRender(),null)
assert.equal(requests.length,0,'disabled feature makes no network requests')
stored.set('ichigo:visitor-network:v1',JSON.stringify({at:Date.now(),data:normalized}))
const onProps={enabled:true,admin:true},onRender=api.VisitorInfo.setup(onProps)
let tree=onRender()
assert.equal(tree.tag,'aside')
assert.equal(tree.children[0].props['aria-label'],'管理员信息')
assert.equal(requests.length,0,'fresh session cache avoids another network request')
tree.children[1].children.at(-1).props.onClick()
assert.equal(onRender(),null,'closing hides both desktop details and IP strip')
onProps.enabled=false;watches.at(-1)(false)
onProps.enabled=true;watches.at(-1)(true)
assert.equal(onRender().tag,'aside','re-enabling restores a dismissed feature')
assert.equal([...stored.keys()].some(key=>key.includes('dismissed')),false,'close is page-only, not permanently hidden after reload')
for(const cleanup of cleanups)cleanup()
console.log('Visitor lookup, fallback, cache expiry, disabled/privacy and close/reopen checks passed')
