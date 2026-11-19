import test from 'node:test';
import assert from 'node:assert/strict';
import {rankSummary,rankChanged} from './seo/rank-summary.mjs';
const day='2026-11-19';
test('yesterday is not today and missing is not zero',()=>{
 const s=rankSummary({days:{'2026-11-18':{a:{baidu:1,bing:'>50'}}}},day);
 assert.equal(s.date,'2026-11-18');assert.deepEqual(s.rows,{});assert.equal(s.top10.baidu,null);
});
test('top20-only results cannot determine top50',()=>{
 const s=rankSummary({days:{[day]:{a:{baidu:'>20',bing:'>50'}}}},day);
 assert.equal(s.top10.baidu,0);assert.equal(s.top50.baidu,null);assert.equal(s.top50.bing,0);
});
test('blocked and absent observations remain unknown',()=>{
 const s=rankSummary({days:{[day]:{a:{baidu:2,bing:'error'},b:{baidu:'blocked'}}}},day);
 assert.equal(s.checked.baidu,1);assert.equal(s.top10.baidu,null);assert.equal(s.top50.bing,null);
});
test('complete comparable samples count actual positions',()=>{
 const s=rankSummary({days:{[day]:{a:{baidu:3,bing:21},b:{baidu:22,bing:'>50'}}}},day);
 assert.deepEqual(s.top10,{baidu:1,bing:0});assert.deepEqual(s.top50,{baidu:2,bing:1});
});
test('partial search depth is not an invented position 99',()=>{
 assert.equal(rankChanged(22,'>20'),false);assert.equal(rankChanged('>1',4),false);
 assert.equal(rankChanged(5,'>20'),true);assert.equal(rankChanged(22,25),true);
 assert.equal(rankChanged('blocked',1),false);
});
