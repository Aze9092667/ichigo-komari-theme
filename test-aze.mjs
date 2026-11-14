import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'
const source = f => ts.transpileModule(fs.readFileSync('src/'+f+'.ts','utf8').replace(/^import[^\n]*\r?\n/gm,'').replace(/^export \{[^\n]*\}\r?\n/gm,'').replace(/^export /gm,'').replace(/^start\(\)\r?\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
let admin=true,writes=[],requests=[],pub={theme:'Reze-Route',theme_settings:{untouched:'keep'}},nodes=[],jobs=[]
const c=vm.createContext({Date,console,AbortSignal,navigator:{},document:{hidden:false},setTimeout:()=>{},setInterval:()=>{},shallowRef:v=>({value:v}),h:()=>{},fetch:async(path,init)=>{
 requests.push(path);let data
 if(path==='/api/public')data=pub
 else if(path==='/api/nodes')data=nodes
 else if(path==='/api/admin/client/list')data=nodes
 else if(path==='/api/task/ping')data=[]
 else if(path==='/api/me')data={logged_in:admin}
 else if(path.endsWith('/health'))data={ok:true,protocol:1}
 else if(path.includes('/roster?'))data={clients:nodes.map(n=>({client:n.uuid,helper_seen_at:Date.now()}))}
 else if(path.endsWith('/enqueue')){writes.push(JSON.parse(init.body));data={batch_id:'test',jobs}}
 else if(path.includes('/api/admin/theme/settings')){pub.theme_settings=JSON.parse(init.body);writes.push(pub.theme_settings);data={}}
 else throw Error('Unexpected '+path)
 return {ok:true,json:async()=>({data})}
}})
for(const f of ['addressFamilies','state','routeClassification','routeTag','routeProbeResults','service','index'])vm.runInContext(source(f),c)
vm.runInContext('globalThis.setState=update',c)
const now=Math.floor(Date.now()/1000),tag=`transit-route:ct=4134.4134,cu=9929.9929.4837,cm=58807.9808@${now}`
assert.equal(c.domesticFacts([{hasData:false,avgLatency:0,avgLoss:0}])[1].value,'等待采样')
assert.equal(c.domesticFacts([{hasData:true,avgLatency:0,avgLoss:100}])[1].value,'等待采样')
assert.equal(c.domesticFacts([{avgLatency:20,avgLoss:0},{avgLatency:40,avgLoss:2}])[1].value,'20 ms')
assert.equal(c.domesticFacts([{avgLatency:20,avgLoss:0},{avgLatency:40,avgLoss:2}])[2].value,'2.0%')
const tasks=[{id:1,name:'Target D'},{id:2,name:'Target A'},{id:3,name:'Target C'},{id:4,name:'Target B'}]
assert.deepEqual(Array.from(c.orderTasks(tasks),t=>t.id),[1,2,3,4]);assert.equal(tasks[0].id,1)
const dualTasks=[{id:8,name:'Target D V6'},{id:6,name:'Target C IPv6'},{id:4,name:'Target BV6'},{id:2,name:'Target A V6'},{id:7,name:'Target D V4'},{id:5,name:'Target C IPv4'},{id:3,name:'Target BV4'},{id:1,name:'Target A V4'}]
const configuredTasks=[1,2,3,4,7,8,5,6].map((id,weight)=>({...dualTasks.find(task=>task.id===id),weight}))
c.setState({pingTasks:configuredTasks,addressFamilies:{v4:{ipv4:true,ipv6:false},v6:{ipv4:false,ipv6:true},unknown:{}}})
assert.deepEqual(Array.from(c.orderTasks(dualTasks),t=>t.id),[1,2,3,4,7,8,5,6]);assert.equal(dualTasks[0].id,8)
const samples=configuredTasks.map(task=>({...task,hasData:true,avgLatency:0,avgLoss:100,validSamples:0,latencyBars:[],lossBars:[]}))
const v4Rows=c.nodePingTasks({uuid:'v4',ipv4:'',ipv6:''},samples)
assert.equal(v4Rows.length,8);assert.equal(v4Rows.filter(row=>row.familyUnavailable).length,4)
assert.equal(v4Rows.find(row=>row.family==='ipv6').latencyDisplay,'—');assert.equal(v4Rows.find(row=>row.family==='ipv6').lossDisplay,'—')
assert.equal(v4Rows.find(row=>row.family==='ipv4').latencyDisplay,'不可达');assert.equal(v4Rows.find(row=>row.family==='ipv4').lossDisplay,'100.0%')
assert.equal(c.nodePingTasks({uuid:'v6'},samples).filter(row=>row.familyUnavailable).length,4)
assert.equal(c.nodePingTasks({uuid:'unknown',ipv4:'',ipv6:''},samples).some(row=>row.familyUnavailable),false)
assert.equal(c.nodePingTasks({uuid:'v4'},[]).length,8,'configured rows stay visible before samples')
assert.equal(c.nodePingTasks({uuid:'v4'},[{...samples[1],avgLatency:11,avgLoss:0,validSamples:1}]).some(row=>row.familyUnavailable),false,'successful sample overrides stale absent-family summary')
assert.equal(c.nodePingTasks({uuid:'v4'},[{...samples[1],avgLatency:0,avgLoss:0,validSamples:1}])[1].latencyDisplay,'<1 ms','valid zero-millisecond samples remain reachable')
const splitCatalog=[...configuredTasks].reverse().map(task=>({...task,clients:task.id===2?['linux']:['linux','win']}))
splitCatalog.push({id:9,name:'Target A V6',weight:1,type:'tcp',clients:['win']},{id:10,name:'未分配 V6',weight:99,clients:[]})
c.setState({pingTasks:splitCatalog,pingTasksLoaded:true,addressFamilies:{win:{ipv4:true,ipv6:false}}})
const staleSamples=[...samples,{id:99,name:'已删除 V6',hasData:true,avgLatency:1,avgLoss:0,validSamples:1}]
assert.deepEqual(Array.from(c.nodePingTasks({uuid:'linux'},staleSamples),row=>row.id),[1,2,3,4,7,8,5,6],'Linux keeps its eight assigned rows in weight order')
const windowsRows=c.nodePingTasks({uuid:'win'},[...staleSamples,{...samples[1],avgLatency:1,avgLoss:0,validSamples:1}])
assert.deepEqual(Array.from(windowsRows,row=>row.id),[1,9,3,4,7,8,5,6],'Windows substitutes the same-name TCP id and drops unassigned/removed histories')
assert.equal(windowsRows[1].name,'Target A V6');assert.equal(windowsRows[1].latencyDisplay,'—','unassigned successful ICMP history cannot prove IPv6 availability')
assert.equal(c.nodePingTasks({uuid:'win'},[{id:9,name:'stale name',hasData:true,avgLatency:17,avgLoss:0,validSamples:1}])[1].latencyDisplay,'17 ms','same-name tasks merge by id only')
c.setState({pingTasks:[{id:1,name:'Legacy V4'},{id:2,name:'Empty V6',clients:[]}],pingTasksLoaded:true,addressFamilies:{}})
assert.deepEqual(Array.from(c.nodePingTasks({uuid:'any'},samples),row=>row.id),[1],'only omitted clients retains legacy global behavior')
c.setState({pingTasks:[],pingTasksLoaded:true})
assert.equal(c.nodePingTasks({uuid:'win'},samples).length,0,'successfully loaded empty catalog suppresses stale records')
c.setState({pingTasksLoaded:false})
assert.equal(c.nodePingTasks({uuid:'win'},samples).length,8,'unavailable catalog falls back to raw history')
c.setState({pingTasks:[],pingTasksLoaded:false,addressFamilies:{}})
assert.equal(c.domesticFacts(Array.from({length:8},()=>({hasData:true,avgLatency:0,avgLoss:100})))[1].value,'等待采样')
assert.equal(c.mainland({region:'🇨🇳'}),true);assert.equal(c.mainland({region:'HK'}),false)
assert.equal(c.mainland({region:'CN',name:'Node A'}),true);assert.equal(c.mainland({region:'DE',name:'Node B'}),false)
assert.equal(c.paused({name:'Node C',tags:'group:example,route-probe:paused'}),true)
assert.equal(c.paused({name:'Node C',tags:['group:example','route-probe:paused']}),true)
assert.equal(c.paused({name:'Node C',tags:'not-route-probe:paused'}),false)
assert.equal(c.paused({name:'Node C',region:'DE'}),false)
assert.equal(c.parseNodeRouteTag('transit-route:ct=4134').entries[0].classification.confidence,'inconclusive')
assert.equal(c.parseNodeRouteTag(tag).entries[1].classification.code,'cu_9929')
assert.equal(c.mayWrite(false,'Reze-Route'),false);assert.equal(c.mayWrite(true,'Reze'),false)
assert.equal(c.successfulResults([{client:'x',status:'failed',tag}]).x,undefined)
assert.equal(c.mergeRouteProbeResults({x:tag},{x:'bad'}).x,tag)
nodes=[{uuid:'x',name:'Node A',region:'SG'},{uuid:'cn',name:'Node B',region:'CN'},{uuid:'de',name:'Node C',region:'DE'}]
jobs=[{client:'x',status:'completed',tag}]
await c.load();assert.equal(c.nodePingTasks({uuid:'x'},samples).length,0,'load marks a successful empty task response as authoritative');await c.refresh('x')
assert.deepEqual(writes.find(item=>Array.isArray(item.clients)).clients,['x']);assert.equal(pub.theme_settings.untouched,'keep');assert.equal(JSON.parse(pub.theme_settings.pandaOpsRouteProbeResults).x,tag)
const count=writes.length
pub.theme='Reze';await c.refresh('x');assert.equal(writes.length,count)
pub.theme='Reze-Route';admin=false;await c.load();await c.refresh('x');assert.equal(writes.length,count)
console.log('PASS: client-scoped catalog, same-name task ids, removed histories, weight order, empty/unavailable catalog, empty/timeout samples, real local metrics, paired IPv4/IPv6 targets, mainland classification, conservative routes, failed-result retention, theme/login guards and preserved settings')
