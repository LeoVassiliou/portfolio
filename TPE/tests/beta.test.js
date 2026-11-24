// Unit tests for the beta engine and data. Run: node TPE/tests/beta.test.js
const fs=require('fs'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/../beta.js','utf8');
const eng=src.slice(src.indexOf('ENGINE:START'),src.indexOf('/* ===== ENGINE:END'));
const api=new Function(eng.slice(eng.indexOf('\n'))+'\n;return {soundness,atLeastOne,posterior,netModel}')();
const {soundness,atLeastOne,posterior,netModel}=api;
let n=0;function t(name,f){try{f();n++}catch(e){console.error('FAIL',name,e.message);process.exitCode=1}}
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,a+' vs '+b);
const S=[{id:'a',side:'pro',premises:['a1','a2']},{id:'b',side:'pro',group:'g',premises:['b1']},{id:'c',side:'pro',group:'g',premises:['c1']},{id:'x',side:'con',premises:['x1']}];
t('soundness is product',()=>near(soundness([.5,.5]),.25));
t('unrated gives null',()=>assert.strictEqual(soundness([.5,null]),null));
t('nothing rated gives null',()=>assert.strictEqual(netModel(S,{},.5,false),null));
t('partial argument ignored',()=>assert.strictEqual(netModel(S,{a1:1},.5,false),null));
t('certain pro lands on 1',()=>near(netModel(S,{a1:1,a2:1},.5,false).net,1));
t('certain con lands on 0',()=>near(netModel(S,{x1:1},.5,false).net,0));
t('equal pro and con at prior 0.5 stays 0.5',()=>near(netModel([{id:'p',side:'pro',premises:['p']},{id:'q',side:'con',premises:['q']}],{p:.7,q:.7},.5,false).net,.5));
t('pro only moves up from prior',()=>assert.ok(netModel(S,{a1:.8,a2:.8},.3,false).net>.3));
t('con only moves down from prior',()=>assert.ok(netModel(S,{x1:.8},.7,false).net<.7));
t('both certain is null',()=>assert.strictEqual(netModel([{id:'p',side:'pro',premises:['p']},{id:'q',side:'con',premises:['q']}],{p:1,q:1},.5,false).net,null));
t('related arguments use max',()=>near(netModel(S,{b1:.6,c1:.5},.5,false).A,.6));
t('independent mode double counts',()=>near(netModel(S,{b1:.6,c1:.5},.5,true).A,1-.4*.5));
t('result between 0 and 1',()=>{for(let i=0;i<200;i++){const r={a1:Math.random(),a2:Math.random(),b1:Math.random(),x1:Math.random()};const v=netModel(S,r,Math.random(),false).net;assert.ok(v>=0&&v<=1)}});
t('monotone in a premise',()=>{let last=-1;for(let v=0;v<=1;v+=.1){const x=netModel(S,{a1:v,a2:.9,x1:.4},.5,false).net;assert.ok(x>=last-1e-12);last=x}});
// data checks
global.window={};eval(fs.readFileSync(__dirname+'/../beta-data.js','utf8'));
const ids=new Set();
t('beta data complete',()=>{for(const a of window.BETA_ARGS){assert.ok(['pro','con'].includes(a.side));for(const p of a.premises){assert.ok(!ids.has(p.id),'dup '+p.id);ids.add(p.id);for(const l of 'sie'){assert.ok(p.L[l].ev.length&&p.L[l].ob.length,p.id+l);p.L[l].ob.forEach(o=>assert.ok(o.t&&o.r))}assert.ok(p.L.plain&&p.L.e.who)}}});
// levels cover every v2 premise
t('levels cover v2',()=>{const h=fs.readFileSync(__dirname+'/../index.html','utf8');global.window={};eval(fs.readFileSync(__dirname+'/../levels.js','utf8'));const found=[...h.matchAll(/id:"([a-z]+_pp?\d)"/g)].map(m=>m[1]);assert.ok(found.length>=41,found.length);found.forEach(i=>assert.ok(window.LEVELS[i],'missing '+i))});
console.log(n+' tests passed');
