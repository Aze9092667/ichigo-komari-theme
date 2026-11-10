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
 else if(path==='/api/me')data={logged_in:admin}
 else if(path.endsWith('/health'))data={ok:true,protocol:1}
 else if(path.includes('/roster?'))data={clients:nodes.map(n=>({client:n.uuid,helper_seen_at:Date.now()}))}
 else if(path.endsWith('/enqueue')){writes.push(JSON.parse(init.body));data={batch_id:'test',jobs}}
 else if(path.includes('/api/admin/theme/settings')){pub.theme_settings=JSON.parse(init.body);writes.push(pub.theme_settings);data={}}
 else throw Error('Unexpected '+path)
 return {ok:true,json:async()=>({data})}
}})
for(const f of ['state','routeClassification','routeTag','routeProbeResults','service','index'])vm.runInContext(source(f),c)
const now=Math.floor(Date.now()/1000),tag=`transit-route:ct=4134.4134,cu=9929.9929.4837,cm=58807.9808@${now}`
assert.equal(c.domesticFacts([{hasData:false,avgLatency:0,avgLoss:0}])[1].value,'等待采样')
assert.equal(c.domesticFacts([{hasData:true,avgLatency:0,avgLoss:100}])[1].value,'等待采样')
assert.equal(c.domesticFacts([{avgLatency:20,avgLoss:0},{avgLatency:40,avgLoss:2}])[1].value,'20 ms')
assert.equal(c.domesticFacts([{avgLatency:20,avgLoss:0},{avgLatency:40,avgLoss:2}])[2].value,'2.0%')
const tasks=Object.freeze([{id:3,name:'Target C'},{id:1,name:'Target A'},{id:2,name:'Target B'}].map(Object.freeze))
const orderedTasks=c.orderTasks(tasks)
assert.deepEqual(Array.from(orderedTasks,t=>t.id),[3,1,2]);assert.notEqual(orderedTasks,tasks);assert.equal(orderedTasks[0],tasks[0])
assert.equal(c.mainland({region:'🇨🇳'}),true);assert.equal(c.mainland({region:'HK'}),false)
assert.equal(c.mainland({region:'CN',name:'Node A'}),true);assert.equal(c.mainland({region:'DE',name:'Node A'}),false)
assert.equal(c.paused({name:'Node C',tags:'group:example,route-probe:paused'}),true)
assert.equal(c.paused({name:'Node C',tags:['group:example','route-probe:paused']}),true)
assert.equal(c.paused({name:'Node C',tags:'not-route-probe:paused'}),false)
assert.equal(c.paused({name:'Node C',region:'DE'}),false)
assert.equal(c.parseNodeRouteTag('transit-route:ct=4134').entries[0].classification.confidence,'inconclusive')
assert.equal(c.parseNodeRouteTag(tag).entries[1].classification.code,'cu_9929')
assert.equal(c.mayWrite(false,'Reze-Route'),false);assert.equal(c.mayWrite(true,'Reze'),false)
assert.equal(c.successfulResults([{client:'x',status:'failed',tag}]).x,undefined)
assert.equal(c.mergeRouteProbeResults({x:tag},{x:'bad'}).x,tag)
nodes=[{uuid:'x',name:'Node A',region:'SG'},{uuid:'cn',name:'Node B',region:'CN'},{uuid:'paused',name:'Node C',region:'DE',tags:'route-probe:paused'}]
jobs=[{client:'x',status:'completed',tag}]
await c.load();await c.refresh('x')
assert.deepEqual(writes[0].clients,['x']);assert.equal(pub.theme_settings.untouched,'keep');assert.equal(JSON.parse(pub.theme_settings.pandaOpsRouteProbeResults).x,tag)
const count=writes.length
pub.theme='Reze';await c.refresh('x');assert.equal(writes.length,count)
pub.theme='Reze-Route';admin=false;await c.load();await c.refresh('x');assert.equal(writes.length,count)
console.log('PASS: empty/timeout samples, real local metrics, configured target order, region classification, explicit pause tags, conservative routes, failed-result retention, theme/login guards and preserved settings')
