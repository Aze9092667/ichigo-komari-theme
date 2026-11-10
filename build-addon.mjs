import fs from 'node:fs'
const build=JSON.parse(fs.readFileSync('komari-theme.json','utf8')).version.split('.').at(-1)
const source=fs.readFileSync('addon-build/aze-route-v123.js','utf8').replaceAll('vue-vendor-D4cUfCy9.js',`vue-vendor-D4cUfCy9-aze${build}.js`)
fs.writeFileSync(`dist/assets/aze-route-v123-${build}.js`,source)
fs.copyFileSync('aze-route.css',`dist/assets/aze-route-v123-${build}.css`)
if(fs.existsSync('ichigo-palette.css'))fs.copyFileSync('ichigo-palette.css',`dist/assets/ichigo-palette-aze${build}.css`)
console.log('Updated the native route panel assets. Package dist/ and komari-theme.json at the ZIP root.')
