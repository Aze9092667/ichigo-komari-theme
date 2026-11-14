import fs from 'node:fs'
const build=JSON.parse(fs.readFileSync('komari-theme.json','utf8')).version.split('.').at(-1)
const source=fs.readFileSync('addon-build/aze-route-v123.js','utf8').replaceAll('vue-vendor-D4cUfCy9.js',`vue-vendor-D4cUfCy9-aze${build}.js`)
fs.writeFileSync(`dist/assets/aze-route-v123-${build}.js`,source)
fs.copyFileSync('aze-route.css',`dist/assets/aze-route-v123-${build}.css`)
if(fs.existsSync('ichigo-palette.css'))fs.copyFileSync('ichigo-palette.css',`dist/assets/ichigo-palette-aze${build}.css`)
if(fs.existsSync('visitor.css'))fs.copyFileSync('visitor.css',`dist/assets/visitor-aze${build}.css`)
console.log('Updated the native route panel assets. Package dist/ and komari-theme.json at the ZIP root.')
// Keep the inherited production components aligned with the native dual-stack helper.
const assets='dist/assets'
const detailFile=fs.readdirSync(assets).find(name=>/^PingChart-.*\.js$/.test(name))
if(!detailFile)throw Error('Missing production PingChart module')
let detail=fs.readFileSync(`${assets}/${detailFile}`,'utf8')
if(detail.includes('function azeOrderDetailTasks(tasks)')) {
  detail=detail.replace(/function azeOrderDetailTasks\(tasks\)\{const order=\[.*?\.map\(entry=>entry\.task\)\}/,'')
  if(detail.includes('function azeOrderDetailTasks(tasks)'))throw Error('Unexpected production detail sorter')
}
if(!detail.includes('orderTasks as azeOrderDetailTasks'))detail=`import{orderTasks as azeOrderDetailTasks}from"./aze-route-v123-${build}.js";`+detail
fs.writeFileSync(`${assets}/${detailFile}`,detail)
const cardFile=fs.readdirSync(assets).find(name=>/^NodeCard-.*\.js$/.test(name))
if(!cardFile)throw Error('Missing production NodeCard module')
let card=fs.readFileSync(`${assets}/${cardFile}`,'utf8')
const oldTasks='taskSummaries:u}=kt(()=>t.node.uuid,{enabled:()=>t.pingEnabled})'
const dualTasks='taskSummaries:ichigoRawTasks}=kt(()=>t.node.uuid,{enabled:()=>t.pingEnabled}),u=d(()=>ichigoNodePingTasks(t.node,ichigoRawTasks.value))'
if(!card.includes(oldTasks)&&!card.includes(dualTasks))throw Error('Unexpected production task summaries')
card=card.replace(oldTasks,dualTasks)
if(!card.includes('nodePingTasks as ichigoNodePingTasks'))card=`import{nodePingTasks as ichigoNodePingTasks,PingTaskName as IchigoPingTaskName}from"./aze-route-v123-${build}.js";`+card
card=card.replaceAll('e("span",Wa,l(s.name),1)','e("span",Wa,[p(IchigoPingTaskName,{task:s},null,8,["task"])])')
  .replaceAll('key:s.id,"data-node-ping-task-row":s.id,type:"button"','key:s.id,"data-node-ping-task-row":s.id,"data-family-state":s.familyUnavailable?"absent":s.hasData?"sampled":"pending",type:"button"')
  .replace('Ga=["data-node-ping-task-row","title","aria-label"]','Ga=["data-node-ping-task-row","data-family-state","title","aria-label"]')
card=card.replaceAll('平均延迟 ${Math.round(s.avgLatency)} ms','平均延迟 ${s.latencyDisplay}')
  .replaceAll('延迟 ${Math.round(s.avgLatency)} 毫秒','延迟 ${s.latencyDisplay}')
  .replaceAll('平均丢包 ${s.avgLoss.toFixed(1)}%','平均丢包 ${s.lossDisplay}')
  .replaceAll('丢包 ${s.avgLoss.toFixed(1)}%','丢包 ${s.lossDisplay}')
fs.writeFileSync(`${assets}/${cardFile}`,card)
const serviceFile=fs.readdirSync(assets).find(name=>/^v3-services-.*\.js$/.test(name))
if(!serviceFile)throw Error('Missing production metrics module')
let metrics=fs.readFileSync(`${assets}/${serviceFile}`,'utf8')
const oldLatency='latencyDisplay:v.hasData?`${Math.round(v.avgLatency)} ms`:"-"'
const dualLatency='latencyDisplay:v.avgLoss>=100?"不可达":v.hasData?`${Math.round(v.avgLatency)} ms`:"-"'
if(!metrics.includes(oldLatency)&&!metrics.includes(dualLatency))throw Error('Unexpected production latency formatter')
metrics=metrics.replaceAll(oldLatency,dualLatency)
if(!metrics.includes('validSamples:f.valid,hasData:'))metrics=metrics.replace('hasData:f.valid>0||!f.loss_approximate&&J(f.loss)}}).sort','validSamples:f.valid,hasData:f.valid>0||!f.loss_approximate&&J(f.loss)}}).sort')
metrics=metrics.replace('avgLoss:V,history:Ie(H),hasData:H.length>0','avgLoss:V,history:Ie(H),validSamples:K.length,hasData:H.length>0')
fs.writeFileSync(`${assets}/${serviceFile}`,metrics)
// The asset overview uses the existing remaining-value calculation and finance dialog.
const generalFile=fs.readdirSync(assets).find(name=>/^NodeGeneralCards-.*\.js$/.test(name))
if(!generalFile)throw Error('Missing production overview module')
let general=fs.readFileSync(`${assets}/${generalFile}`,'utf8')
function patchOnce(text,before,after,label){
  if(text.includes(after))return text
  if(text.split(before).length!==2)throw Error(`Unexpected production ${label}`)
  return text.replace(before,after)
}
general=patchOnce(general,
  'case"remainingValue":return{key:"remainingValue",label:"剩余价值",icon:"tabler:cash",value:y.value?`${Je.value.symbol}${Je.value.value}`:"***",tooltip:Lt.value}',
  'case"remainingValue":return{key:"remainingValue",label:"资产总值",subtitle:"剩余价值折合",icon:"tabler:cash",value:y.value?`${Je.value.symbol}${Je.value.value}`:"***",tooltip:Lt.value,action:y.value?"financeDetails":void 0}',
  'asset overview')
general=patchOnce(general,
  '`查看${t.key==="remainingValue"?"剩余价值":t.label}明细`',
  '`查看${t.label}明细`',
  'asset accessible label')
general=patchOnce(general,
  ']),_:2},1032,["content"])])]),_:2},1032,["data-general-card-key"',
  ']),_:2},1032,["content"]),t.subtitle?u("div",{class:"text-[10px] leading-tight text-muted-foreground"},E(t.subtitle),1):L("",!0)])]),_:2},1032,["data-general-card-key"',
  'asset subtitle')
fs.writeFileSync(`${assets}/${generalFile}`,general)
const financeFile=fs.readdirSync(assets).find(name=>/^FinanceDetailsDialog-.*\.js$/.test(name))
if(!financeFile)throw Error('Missing production finance dialog')
let finance=fs.readFileSync(`${assets}/${financeFile}`,'utf8')
finance=patchOnce(finance,'title:"价值与费用明细"','title:"资产总值与费用明细"','asset dialog title')
finance=patchOnce(finance,
  'description:"固定账单、纯前端按量估算与汇率设置"',
  'description:"按节点价格、计费周期和到期时间统计；金额为折合估算。"',
  'asset dialog description')
finance=patchOnce(finance,
  'e[8]||(e[8]=t("div",{class:"text-xs text-muted-foreground"}," 剩余价值 ",-1))',
  'e[8]||(e[8]=t("div",{class:"text-xs text-muted-foreground"}," 资产总值 ",-1))',
  'asset dialog summary')
finance=patchOnce(finance,
  'e[10]||(e[10]=t("div",{class:"text-xs text-muted-foreground"}," 当前服务器估算 ",-1)),t("div",ze,o(q(G.value)),1)',
  'e[10]||(e[10]=t("div",{class:"text-xs text-muted-foreground"}," 年化支出 ",-1)),t("div",ze,o(k(oe.value*12)),1)',
  'asset annual summary')
finance=patchOnce(finance,
  'N=f(()=>c.nodes.filter(s=>!c.excludeFree||!Ne(s)))',
  'N=f(()=>c.nodes.filter(s=>!c.excludeFree||(s.price!==0&&s.price!=="0"&&!Ne(s))))',
  'asset free-node exclusion')
finance=patchOnce(finance,
  '"onUpdate:modelValue":e[6]||(e[6]=a=>I.value=a),class:"gap-4"',
  '"onUpdate:modelValue":e[6]||(e[6]=a=>I.value=a),class:"gap-4 ichigo-finance-tabs"',
  'asset stacked tabs')
fs.writeFileSync(`${assets}/${financeFile}`,finance)
// Mount the optional self-information display from the native theme preference.
const mainFile=fs.readdirSync(assets).find(name=>/^index-.*\.js$/.test(name)&&fs.readFileSync(`${assets}/${name}`,'utf8').includes('const c=Tr("RouterView")'))
if(!mainFile)throw Error('Missing production app module')
let main=fs.readFileSync(`${assets}/${mainFile}`,'utf8')
if(!main.includes('VisitorInfo as IchigoVisitorInfo'))main=`import{VisitorInfo as IchigoVisitorInfo}from"./aze-route-v123-${build}.js";`+main
main=patchOnce(main,
  'default:O(()=>[I(va),I(Re,{css:',
  'default:O(()=>[I(va),I(IchigoVisitorInfo,{enabled:g(t).visitorInfoEnabled,admin:g(t).privateFeaturesAllowed},null,8,["enabled","admin"]),I(Re,{css:',
  'visitor app mount')
fs.writeFileSync(`${assets}/${mainFile}`,main)
let html=fs.readFileSync('dist/index.html','utf8')
if(!html.includes(`/assets/visitor-aze${build}.css`))html=html.replace('</head>',`<link rel="stylesheet" href="/assets/visitor-aze${build}.css"/>\n</head>`)
fs.writeFileSync('dist/index.html',html)
