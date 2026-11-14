import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import ts from 'typescript'

const source = name => ts.transpileModule(fs.readFileSync('src/'+name+'.ts','utf8').replace(/^import[^\n]*\r?\n/gm,'').replace(/^export \{[^\n]*\}\r?\n/gm,'').replace(/^export /gm,'').replace(/^start\(\)\r?\n/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
const clone = value => JSON.parse(JSON.stringify(value))
const authNodes = [
  {uuid:'dual',ipv4:'192.0.2.10',ipv6:'2001:db8::10'},
  {uuid:'v4',ipv4:'192.0.2.11',ipv6:''},
  {uuid:'v6',ipv4:'',ipv6:'2001:db8::12'},
  {uuid:'none',ipv4:'0.0.0.0',ipv6:'::'},
  {uuid:'missing'},
  {uuid:'private-node',ipv4:'192.0.2.99',ipv6:'2001:db8::99'}
]
const publicNodes = authNodes.filter(node => node.uuid !== 'private-node').map(({uuid}) => ({uuid}))
let admin = true, anonymousFails = false, writes = [], requests = []
const pub = {theme:'Reze-Route',theme_settings:{untouched:{nested:'keep'},azeRouteAuto:false,azeNodeAddressFamilies:JSON.stringify({'old-hidden':{ipv4:true,ipv6:true}})}}
const c = vm.createContext({Date,console,AbortSignal,navigator:{},document:{hidden:false},setTimeout:()=>{},setInterval:()=>{},shallowRef:value=>({value}),h:(tag,props,children)=>({tag,props,children}),fetch:async(path,init)=>{
  requests.push({path,credentials:init.credentials,cache:init.cache,method:init.method})
  let data
  if(path==='/api/public') data=pub
  else if(path==='/api/me') data={logged_in:admin}
  else if(path==='/api/task/ping') data=[]
  else if(path==='/api/admin/client/list') { assert.equal(admin,true);data=authNodes }
  else if(path==='/api/nodes') {
    if(init.credentials==='omit' && anonymousFails) return {ok:false,status:503}
    data=publicNodes.map(node=>({...node,ipv4:'',ipv6:''}))
  }
  else if(path.startsWith('/api/admin/theme/settings')) {
    assert.equal(admin,true)
    pub.theme_settings=JSON.parse(init.body)
    writes.push(clone(pub.theme_settings))
    data={}
  }
  else throw Error('Unexpected '+path)
  return {ok:true,json:async()=>({data:clone(data)})}
}})
for(const name of ['addressFamilies','state','routeClassification','routeTag','routeProbeResults','service','index']) vm.runInContext(source(name),c)
vm.runInContext('globalThis.renderAddressBadges = node => AddressFamilyBadges.setup({node})(); globalThis.state = routeState',c)

for(const address of ['192.0.2.1','198.51.100.254','10.0.0.1']) assert.equal(c.validReportedAddress(address,'ipv4'),true)
for(const address of ['',null,undefined,'0.0.0.0','256.2.3.4','192.0.2.*','masked','192.0.2.1:443','192.0.2.1/24','001.2.3.4']) assert.equal(c.validReportedAddress(address,'ipv4'),false)
for(const address of ['2001:db8::1','2001:db8:0:0:1:2:3:4','::1','::ffff:192.0.2.1','[2001:db8::1]','fe80::1%eth0']) assert.equal(c.validReportedAddress(address,'ipv6'),true)
for(const address of ['',null,undefined,'::','0:0:0:0:0:0:0:0','2001:::db8','12345::1','2001:db8::1:2:3:4:5:6:7','2001:db8::gg','2001:db8::1/64','fe80::1%']) assert.equal(c.validReportedAddress(address,'ipv6'),false)
assert.deepEqual(clone(c.nodeAddressFamilies({ipv4:'192.0.2.1'})),{ipv4:true,ipv6:false})
assert.deepEqual(clone(c.nodeAddressFamilies({ipv6:'2001:db8::1'})),{ipv4:false,ipv6:true})
assert.deepEqual(clone(c.nodeAddressFamilies({})),{ipv4:false,ipv6:false})
assert.deepEqual(clone(c.normalizeAddressFamilies('{"n":{"ipv4":"192.0.2.1","ipv6":true}}')),{} )
assert.deepEqual(clone(c.normalizeAddressFamilies('{"n":{"ipv4":true,"ipv6":false,"ip":"192.0.2.1"}}')),{n:{ipv4:true,ipv6:false}})

assert.equal(await c.load(),true)
assert.equal(writes.length,1)
const summary=JSON.parse(pub.theme_settings.azeNodeAddressFamilies)
assert.deepEqual(summary,{dual:{ipv4:true,ipv6:true},none:{ipv4:false,ipv6:false},v4:{ipv4:true,ipv6:false},v6:{ipv4:false,ipv6:true},missing:{ipv4:false,ipv6:false}})
assert.deepEqual(pub.theme_settings.untouched,{nested:'keep'})
assert.equal(pub.theme_settings.azeRouteAuto,false)
for(const flags of Object.values(summary)) assert.deepEqual(Object.keys(flags).sort(),['ipv4','ipv6'])
assert.equal(JSON.stringify(writes).includes('192.0.2.'),false)
assert.equal(JSON.stringify(writes).includes('2001:db8'),false)
assert.equal(JSON.stringify(writes).includes('private-node'),false)
assert.equal(requests.some(request=>request.path==='/api/nodes'&&request.credentials==='omit'&&request.cache==='no-store'),true)
await c.load()
assert.equal(writes.length,1,'unchanged summaries must not write settings')

admin=false
const beforeAnonymous=requests.length
await c.load()
assert.equal(writes.length,1,'anonymous loads must never write')
assert.equal(requests.slice(beforeAnonymous).some(request=>request.credentials==='omit'),false)
const dualBadge=c.renderAddressBadges({uuid:'dual'})
assert.deepEqual(Array.from(dualBadge.children,child=>child.children),['IPv4','IPv6'])
assert.deepEqual(Array.from(c.renderAddressBadges({uuid:'v4'}).children,child=>child.children),['IPv4'])
assert.deepEqual(Array.from(c.renderAddressBadges({uuid:'v6'}).children,child=>child.children),['IPv6'])
assert.equal(c.renderAddressBadges({uuid:'none'}),null)
assert.equal(c.renderAddressBadges({uuid:'missing'}),null)
assert.equal(JSON.stringify(dualBadge).includes('192.0.2.'),false)
assert.equal(JSON.stringify(dualBadge).includes('2001:db8'),false)
assert.deepEqual(clone(c.nodeAddressFamilies({uuid:'dual',ipv4:'masked',ipv6:'hidden'},summary)),{ipv4:true,ipv6:true})
assert.deepEqual(clone(c.nodeAddressFamilyState({uuid:'never-observed',ipv4:'',ipv6:''},summary)),{},'redacted addresses never prove absence')
assert.deepEqual(clone(c.reportedAddressFamilies([{uuid:'masked',ipv4:'masked',ipv6:'hidden'}])),{},'masked strings must not publish absent-family flags')
assert.deepEqual(clone(c.mergeAddressFamilies({},c.reportedAddressFamilies([{uuid:'partial',ipv4:'192.0.2.20'}]),['partial'])),{partial:{ipv4:true,ipv6:false}},'authenticated omitempty fields represent an absent family')
await assert.rejects(c.syncAddressFamilies(c.reportedAddressFamilies(authNodes)),/登录已失效/)
assert.equal(writes.length,1)

admin=true;pub.theme='Other'
assert.equal(await c.load(),false)
await assert.rejects(c.syncAddressFamilies(c.reportedAddressFamilies(authNodes)),/主题已切换/)
assert.equal(writes.length,1)
pub.theme='Reze-Route';anonymousFails=true
authNodes[0].ipv6=''
assert.equal(await c.load(),true)
assert.equal(writes.length,1,'failed anonymous roster must not publish a guessed summary')
anonymousFails=false
const tag=`transit-route:ct=4134,cu=4837,cm=9808@${Math.floor(Date.now()/1000)}`
await Promise.all([c.syncAddressFamilies(c.reportedAddressFamilies(authNodes)),c.save({dual:tag})])
assert.equal(JSON.parse(pub.theme_settings.azeNodeAddressFamilies).dual.ipv6,false)
assert.equal(JSON.parse(pub.theme_settings.pandaOpsRouteProbeResults).dual,tag)
assert.deepEqual(pub.theme_settings.untouched,{nested:'keep'})
const beforeRepeat=writes.length
await c.save({dual:tag})
assert.equal(writes.length,beforeRepeat,'unchanged route settings must not write')
await c.load()
assert.equal(writes.length,beforeRepeat)

console.log('PASS: validated address literals; IPv4/IPv6/dual/missing badges; boolean-only public payload and DOM; public-roster privacy; anonymous/theme/failure guards; serialized settings merge and unchanged-write suppression')
