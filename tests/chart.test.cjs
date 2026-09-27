const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { window:{} };
vm.runInNewContext(fs.readFileSync('js/cb-scrub-chart.js','utf8'),context);
const chart=context.window.CoolbradorScrubChart;
test('missing history never fabricates past votes',()=>{
 const series=chart.seriesFromVoteHistory([],[{id:'a',pct:80}]);
 assert.equal(series.length,1); assert.equal(series[0].points.length,0);
});
test('vote history keeps recorded percentages and timestamps',()=>{
 const series=chart.seriesFromVoteHistory([{t:1000,pct:{a:100,b:0}},{t:2000,pct:{a:50,b:50}}],[{id:'a'},{id:'b'}]);
 assert.equal(series[0].points[0].t,1000); assert.equal(series[1].points[1].v,50);
 assert.equal(series[0].points.length,2);
});
