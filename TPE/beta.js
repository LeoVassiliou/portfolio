/* TPE BETA layer: counter-arguments, net result, sensitivity, philosopher comparison,
   notes, dependency grouping, result card, print report, guided tour. */

/* ===== ENGINE:START (pure maths, unit-tested in tests/beta.test.js) ===== */
function soundness(ratings){
  if(!ratings.length||ratings.some(function(v){return v===null||v===undefined}))return null;
  return ratings.reduce(function(a,v){return a*v},1);
}
function atLeastOne(qs){return 1-qs.reduce(function(a,q){return a*(1-q)},1)}
function posterior(prior,pro,con){
  var A=atLeastOne(pro),B=atLeastOne(con),den=1-A*B;
  if(den<1e-12)return null;
  return (A*(1-B)+prior*(1-A)*(1-B))/den;
}
// struct: [{id,side:'pro'|'con',group,premises:[ids]}]; ratings: id -> 0..1 (missing = unrated)
function netModel(struct,ratings,prior,indep){
  var used=[];
  struct.forEach(function(a){
    var s=soundness(a.premises.map(function(id){return ratings[id]===undefined?null:ratings[id]}));
    if(s!==null)used.push({id:a.id,side:a.side,group:a.group,s:s});
  });
  if(!used.length)return null;
  function collapse(items){
    if(indep)return items.map(function(i){return i.s});
    var by={},out=[];
    items.forEach(function(i){if(i.group)by[i.group]=Math.max(by[i.group]||0,i.s);else out.push(i.s)});
    Object.keys(by).forEach(function(k){out.push(by[k])});
    return out;
  }
  var P=collapse(used.filter(function(u){return u.side==='pro'})),C=collapse(used.filter(function(u){return u.side==='con'}));
  return {net:posterior(prior,P,C),A:atLeastOne(P),B:atLeastOne(C),used:used};
}
/* ===== ENGINE:END ===== */

(function(){
'use strict';
var LV=window.LEVELS||{},BA=window.BETA_ARGS||[];
var V2GROUP={kalam:'cosmo',contingency:'cosmo',moral:'moral',properlybasic:'moral',resurrection:'jesus',shroud:'jesus',lll:'jesus'};
var BGROUP={evil:'goodness',hidden:'goodness',natural:'natural',origins:'natural'};
var GROUPNAME={cosmo:'Kalam and Contingency (both argue from why the universe exists)',moral:'Moral argument and Properly Basic Beliefs (both argue from values)',jesus:'Resurrection, Liar/Lunatic/Lord and Shroud (all rest on the same Gospel evidence)',goodness:'Evil and Hiddenness (both ask whether God is good)',natural:'Naturalistic explanation and Why People Believe (both argue debunking)'};
var KEY='tpe-beta',st={r:{},n:{},prior:50,indep:false};
try{var raw=JSON.parse(localStorage.getItem(KEY)||'{}');if(raw.r)st.r=raw.r;if(raw.n)st.n=raw.n;if(raw.prior)st.prior=raw.prior;st.indep=!!raw.indep}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function pct(v){return v===null||v===undefined?'—':(v*100).toFixed(1)+'%'}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function plain(h){var d=document.createElement('div');d.innerHTML=h;return d.textContent}
function level(){var l='s';try{l=localStorage.getItem('tpe-level')||'s'}catch(e){}return /^[sie]$/.test(l)?l:'s'}

var STRUCT=ARGUMENTS.map(function(a){return {id:a.id,side:'pro',group:V2GROUP[a.id],premises:a.corePremises.map(function(p){return p.id})}})
  .concat(BA.map(function(a){return {id:a.id,side:a.side,group:BGROUP[a.id],premises:a.premises.map(function(p){return p.id})}}));
var TITLES={};ARGUMENTS.forEach(function(a){TITLES[a.id]=a.icon+' '+a.title});BA.forEach(function(a){TITLES[a.id]=a.icon+' '+a.title});
var PTEXT={};ARGUMENTS.forEach(function(a){a.corePremises.concat(a.postPremises).forEach(function(p){PTEXT[p.id]=p.text})});BA.forEach(function(a){a.premises.forEach(function(p){PTEXT[p.id]=p.text})});

function readRatings(){
  var m={};
  ARGUMENTS.forEach(function(a){var u=UI[a.id];u.coreSliders.concat(u.postSliders).forEach(function(x){if(x.activated)m[(x.p||x.pp).id]=+x.slider.value/100})});
  Object.keys(st.r).forEach(function(id){m[id]=st.r[id]/100});
  return m;
}
function net(m,prior){return netModel(STRUCT,m,(prior===undefined?st.prior:prior)/100,st.indep)}

/* ---------- UI scaffolding ---------- */
function addTab(id,label){
  var b=document.createElement('button');b.className='tab';b.dataset.tab=id;b.textContent=label;b.setAttribute('role','tab');
  var bar=$('#tabBar'),before=$('[data-tab="howto"]');bar.insertBefore(b,before);
  var p=document.createElement('div');p.className='panel';p.id='panel-'+id;p.setAttribute('role','tabpanel');
  $('#panel-howto').parentNode.insertBefore(p,$('#panel-howto'));
  return p;
}
function activate(tabName){
  $$('.tab').forEach(function(x){var on=x.dataset.tab===tabName;x.classList.toggle('active',on);x.setAttribute('aria-selected',on)});
  $$('.panel').forEach(function(x){x.classList.toggle('active',x.id==='panel-'+tabName)});
}
var pAgainst=addTab('beta','⚖️ Against & more'),pNet=addTab('net','🧮 Net result');
$('#tabBar').setAttribute('role','tablist');
$$('.tab').forEach(function(t){t.setAttribute('role','tab');t.setAttribute('aria-selected',t.classList.contains('active'));t.addEventListener('click',function(){activate(t.dataset.tab)})});
document.querySelector('.tabs').insertAdjacentHTML('beforebegin','');
var main=$('#panel-arguments');main.id==='panel-arguments'&&main.setAttribute('role','tabpanel');
if(!$('#main'))main.parentNode.id=main.parentNode.id||'main';

/* ---------- beta premise cards ---------- */
function buildBeta(){
  var h='<p style="font-size:13px;color:var(--text-dim);margin:0 0 14px">These arguments are <strong>new in the beta</strong>. Arguments against theism are rated the same way as the others: how likely is each premise to be true? Together with the arguments for, they feed the <em>Net result</em> tab.</p><div class="net-actions" style="margin-bottom:14px"><button id="betaReset">Reset these ratings</button></div><div id="betaWrap"></div>';
  pAgainst.innerHTML=h;
  var wrap=$('#betaWrap');
  BA.forEach(function(a){
    var sec=document.createElement('section');sec.className='beta-arg';
    sec.innerHTML='<h3>'+a.icon+' '+esc(a.title)+'<span class="beta-side '+a.side+'">'+(a.side==='con'?'Against theism':'For theism')+'</span></h3><p>'+esc(a.blurb)+'</p>';
    a.premises.forEach(function(p,i){
      var c=document.createElement('div');c.className='bcard';c.dataset.pid=p.id;
      c.innerHTML='<div class="premise-top"><span class="premise-num">P'+(i+1)+'</span><div class="premise-text">'+p.text+'</div></div>'+
       '<div class="confidence-row"><div class="slider-wrap"><input type="range" class="slider" min="0" max="100" value="50" aria-label="Your confidence this is true: '+esc(plain(p.text))+'"></div><div class="conf-display empty">—</div></div>'+
       '<div class="quick-btns">'+[0,25,50,75,100].map(function(v){return '<button class="quick-btn" data-v="'+v+'">'+v+'%</button>'}).join('')+'</div>'+
       '<div class="evidence-objection-wrap"><div class="ev-ob-tabs"><button class="ev-ob-tab active" data-type="ev"></button><button class="ev-ob-tab objection" data-type="obj"></button></div><div class="ev-ob-content active"></div><div class="ev-ob-content objection-content"></div></div>';
      sec.appendChild(c);
      var sl=$('.slider',c),dsp=$('.conf-display',c);
      function show(v){sl.value=v;dsp.textContent=v+'%';dsp.classList.remove('empty');c.classList.add('rated');updateTrack(sl);sl.setAttribute('aria-valuetext',v+' percent')}
      if(st.r[p.id]!==undefined)show(st.r[p.id]);
      sl.oninput=function(){st.r[p.id]=+sl.value;show(+sl.value);save();update()};
      $$('.quick-btn',c).forEach(function(b){b.onclick=function(){sl.value=b.dataset.v;sl.oninput()}});
      $$('.ev-ob-tab',c).forEach(function(t){t.onclick=function(){$$('.ev-ob-tab',c).forEach(function(x){x.classList.remove('active')});$$('.ev-ob-content',c).forEach(function(x){x.classList.remove('active')});t.classList.add('active');$$('.ev-ob-content',c)[t.dataset.type==='ev'?0:1].classList.add('active')}});
    });
    var s=document.createElement('div');s.className='beta-sound';s.id='bs-'+a.id;sec.appendChild(s);
    wrap.appendChild(sec);
  });
  $('#betaReset').onclick=function(){if(!confirm('Clear your ratings for the beta arguments?'))return;st.r={};save();$$('.bcard').forEach(function(c){c.classList.remove('rated');var sl=$('.slider',c);sl.value=50;sl.style.background='';var d=$('.conf-display',c);d.textContent='—';d.classList.add('empty')});update()};
}
function li(x){return '<li>'+x+'</li>'}
function obj(o){var r=o.r?'<div class="rebuttal">↩ <strong>Reply:</strong> '+o.r+'</div>':'';return '<li>'+o.t+r+'</li>'}
function renderBetaLevels(){
  var l=level();
  BA.forEach(function(a){a.premises.forEach(function(p){
    var c=$('.bcard[data-pid="'+p.id+'"]');if(!c)return;var d=p.L[l];
    var tabs=$$('.ev-ob-tab',c),cont=$$('.ev-ob-content',c);
    tabs[0].textContent='✅ Evidence ('+d.ev.length+')';tabs[1].textContent='⚠️ Objections ('+d.ob.length+')';
    cont[0].innerHTML='<ul>'+d.ev.map(li).join('')+'</ul>'+(l==='e'&&p.L.e.who?'<div class="lvl-who"><strong>Who:</strong> '+p.L.e.who+'</div>':'');
    cont[1].innerHTML='<ul>'+d.ob.map(obj).join('')+'</ul>';
    var pl=$('.lvl-plain',c);
    if(l==='s'){if(!pl){pl=document.createElement('div');pl.className='lvl-plain';c.insertBefore(pl,$('.confidence-row',c))}pl.textContent='In plain words: '+p.L.plain}else if(pl)pl.remove();
  })});
}

/* ---------- notes on every premise ---------- */
function addNotes(){
  var cards=$$('#argContainer .premise-card,#argContainer .post-premise-card'),ps=[];
  ARGUMENTS.forEach(function(a){a.corePremises.forEach(function(p){ps.push(p.id)});a.postPremises.forEach(function(p){ps.push(p.id)})});
  var all=cards.map(function(c,k){return [c,ps[k]]}).concat($$('.bcard').map(function(c){return [c,c.dataset.pid]}));
  all.forEach(function(pr){
    var c=pr[0],id=pr[1];if(!id||$('.pnote',c))return;
    var d=document.createElement('details');d.className='pnote';
    d.innerHTML='<summary>📝 My notes</summary><textarea aria-label="Your notes on this premise" placeholder="Why did you rate it this way? Saved in your browser only."></textarea>';
    var ta=$('textarea',d);ta.value=st.n[id]||'';if(ta.value)d.open=true;
    ta.oninput=function(){if(ta.value)st.n[id]=ta.value;else delete st.n[id];save()};
    c.appendChild(d);
  });
}
function addSliderLabels(){
  ARGUMENTS.forEach(function(a){var u=UI[a.id];u.coreSliders.concat(u.postSliders).forEach(function(x){var t=(x.p||x.pp).text;x.slider.setAttribute('aria-label','Your confidence this is true: '+plain(t));x.slider.addEventListener('input',function(){x.slider.setAttribute('aria-valuetext',x.slider.value+' percent')})})});
}

/* ---------- Net result tab ---------- */
function buildNet(){
  pNet.innerHTML=
  '<div class="net-box" aria-live="polite"><h3>Net result</h3><p>Combines the arguments <strong>for</strong> and <strong>against</strong>, starting from your own prior. Rate every premise of an argument for it to count.</p>'+
  '<div id="netBig" class="net-big">—</div><div class="net-row" id="netRow"></div>'+
  '<p style="margin-top:12px"><label for="priorRange">Starting point before any argument: <strong id="priorVal"></strong></label></p><input type="range" id="priorRange" min="1" max="99" aria-describedby="priorHelp"><p id="priorHelp">50% means no leaning either way. This matters most when few arguments are rated.</p>'+
  '<p><label><input type="checkbox" id="indepChk"> Treat related arguments as independent (can double count)</label></p><div id="depWarn"></div>'+
  '<div class="net-actions"><button id="btnCard">🖼️ Download result card</button><button id="btnPrint">🖨️ Print / save as PDF</button><button id="btnTour">🎓 Take the tour</button></div></div>'+
  '<div class="net-box"><h3>🔄 What would change your mind?</h3><p>For each premise you have rated, this shows where the net result would land if you became certain it was false or certain it was true.</p><div id="sensList"></div></div>'+
  '<div class="net-box"><h3>🧑‍🏫 Compare with a thinker</h3><p>See where your ratings differ most from a preset thinker (these presets cover the arguments in the main tab).</p><label for="philSel">Thinker</label> <select id="philSel"></select><div id="philOut" style="margin-top:10px"></div></div>'+
  '<div class="net-box"><h3>How the maths works</h3><p>Each argument is sound only if all its premises are true, so soundness is the product of premise ratings. The model then asks how likely it is that <em>at least one</em> argument for is sound (A) and at least one against is sound (B), and conditions on those not both being sound. This is the same model as the Streamlined version. It is a way to organise your thinking, not a proof, and the numbers are only as good as your ratings.</p></div>';
  var pr=$('#priorRange');pr.value=st.prior;$('#priorVal').textContent=st.prior+'%';
  pr.oninput=function(){st.prior=+pr.value;$('#priorVal').textContent=st.prior+'%';save();update()};
  var ic=$('#indepChk');ic.checked=st.indep;ic.onchange=function(){st.indep=ic.checked;save();update()};
  var ps=$('#philSel');PHILOSOPHERS.forEach(function(p,i){ps.innerHTML+='<option value="'+i+'">'+esc(p.name)+' ('+esc(p.stance)+')</option>'});
  ps.onchange=updatePhil;
  $('#btnCard').onclick=resultCard;$('#btnPrint').onclick=printReport;$('#btnTour').onclick=startTour;
}
function updateNet(){
  var m=readRatings(),r=net(m);
  $('#netBig').textContent=r&&r.net!==null?pct(r.net):'—';
  var rows=[];
  if(r){rows.push('Arguments for, combined: <strong>'+pct(r.A)+'</strong>');rows.push('Arguments against, combined: <strong>'+pct(r.B)+'</strong>');rows.push('Fully rated arguments: <strong>'+r.used.length+'</strong> of '+STRUCT.length)}
  else rows.push('Fully rate at least one argument to see a result.');
  if(r&&r.net===null)rows.push('Both sides are certain, so there is no consistent result.');
  $('#netRow').innerHTML=rows.map(function(x){return '<span>'+x+'</span>'}).join('');
  var warn='';
  if(r&&!st.indep){
    var g={};r.used.forEach(function(u){if(u.group){(g[u.group]=g[u.group]||[]).push(u.id)}});
    Object.keys(g).forEach(function(k){if(g[k].length>1)warn+='<div class="net-warn">⚠️ <strong>Related arguments:</strong> '+GROUPNAME[k]+'. Only the strongest of these counts, to avoid counting the same evidence twice.</div>'});
  }
  $('#depWarn').innerHTML=warn;
  /* sensitivity */
  var el=$('#sensList');
  if(!r||r.net===null){el.innerHTML='<p>Rate an argument fully to see this.</p>'}
  else{
    var items=[];
    r.used.forEach(function(u){var a=STRUCT.filter(function(s){return s.id===u.id})[0];a.premises.forEach(function(id){
      var m0=Object.assign({},m);m0[id]=0;var m1=Object.assign({},m);m1[id]=1;
      var lo=net(m0),hi=net(m1);if(!lo||!hi||lo.net===null||hi.net===null)return;
      items.push({id:id,arg:u.id,lo:lo.net,hi:hi.net,sw:Math.abs(hi.net-lo.net)});
    })});
    items.sort(function(a,b){return b.sw-a.sw});
    el.innerHTML=items.length?'<table class="net-table"><thead><tr><th>Premise</th><th>If false</th><th>If true</th></tr></thead><tbody>'+items.slice(0,8).map(function(x){return '<tr><td><small>'+esc(TITLES[x.arg])+'</small><br>'+esc(plain(PTEXT[x.id]).slice(0,110))+(PTEXT[x.id].length>110?'…':'')+'</td><td>'+pct(x.lo)+'</td><td>'+pct(x.hi)+'</td></tr>'}).join('')+'</tbody></table><p>Premises at the top are the ones your result depends on most. Spend your thinking there.</p>':'<p>Nothing to show yet.</p>';
  }
  updatePhil();
}
function updatePhil(){
  var out=$('#philOut');if(!out)return;var p=PHILOSOPHERS[+$('#philSel').value||0],rows=[];
  ARGUMENTS.forEach(function(a){var u=UI[a.id];u.coreSliders.concat(u.postSliders).forEach(function(x){
    var id=(x.p||x.pp).id;if(!x.activated||p.preset[id]===undefined)return;
    var mine=+x.slider.value,theirs=p.preset[id];rows.push({id:id,mine:mine,theirs:theirs,d:Math.abs(mine-theirs),arg:a.id});
  })});
  if(!rows.length){out.innerHTML='<p>Rate some premises in the Arguments tab to compare.</p>';return}
  rows.sort(function(a,b){return b.d-a.d});
  var avg=rows.reduce(function(s,x){return s+x.d},0)/rows.length;
  out.innerHTML='<p>Across <strong>'+rows.length+'</strong> premises you both rated, you differ by <strong>'+avg.toFixed(0)+'</strong> points on average. Biggest differences:</p><table class="net-table"><thead><tr><th>Premise</th><th>You</th><th>'+esc(p.name.split(' ').slice(-1)[0])+'</th></tr></thead><tbody>'+rows.slice(0,6).map(function(x){return '<tr><td><small>'+esc(TITLES[x.arg])+'</small><br>'+esc(plain(PTEXT[x.id]).slice(0,100))+'…</td><td>'+x.mine+'%</td><td>'+x.theirs+'%</td></tr>'}).join('')+'</tbody></table>';
}

/* ---------- result card (PNG) ---------- */
function resultCard(){
  var m=readRatings(),r=net(m);if(!r||r.net===null){toast('Rate at least one argument fully first');return}
  var cv=document.createElement('canvas');cv.width=1200;cv.height=630;var g=cv.getContext('2d');
  g.fillStyle='#0b1220';g.fillRect(0,0,1200,630);
  g.fillStyle='#22d3ee';g.fillRect(0,0,1200,8);
  g.fillStyle='#e5e7eb';g.font='600 34px system-ui,sans-serif';g.fillText('Theism Probability Engine — my result',50,70);
  g.font='800 150px system-ui,sans-serif';g.fillStyle='#22d3ee';g.fillText(pct(r.net),50,230);
  g.font='24px system-ui,sans-serif';g.fillStyle='#94a3b8';
  g.fillText('Starting point '+st.prior+'%  ·  arguments for '+pct(r.A)+'  ·  against '+pct(r.B),50,278);
  var y=330;r.used.slice().sort(function(a,b){return b.s-a.s}).slice(0,6).forEach(function(u){
    g.fillStyle='#cbd5e1';g.font='22px system-ui,sans-serif';g.fillText(TITLES[u.id].replace(/^\S+\s/,''),50,y);
    g.fillStyle='#1e293b';g.fillRect(420,y-22,700,24);g.fillStyle=u.side==='con'?'#fb7185':'#34d399';g.fillRect(420,y-22,700*u.s,24);
    g.fillStyle='#e5e7eb';g.fillText(pct(u.s),1130-g.measureText(pct(u.s)).width,y-3);y+=44;
  });
  g.fillStyle='#64748b';g.font='20px system-ui,sans-serif';g.fillText('Green = argument for, red = argument against. Made with Leo Vassiliou’s TPE (beta). Ratings are personal judgements, not proof.',50,600);
  var a=document.createElement('a');a.download='tpe-result.png';a.href=cv.toDataURL('image/png');a.click();toast('Result card downloaded');
}

/* ---------- print / PDF ---------- */
function printReport(){
  var m=readRatings(),r=net(m),h='<h1>Theism Probability Engine — my worldview</h1><p>'+new Date().toLocaleDateString()+' · Starting point '+st.prior+'%</p>';
  h+=r&&r.net!==null?'<h2>Net result: '+pct(r.net)+'</h2><p>Arguments for (combined) '+pct(r.A)+' · against (combined) '+pct(r.B)+'</p>':'<h2>No fully rated arguments yet</h2>';
  h+='<h2>Arguments</h2><table><tr><th>Argument</th><th>Side</th><th>Soundness</th></tr>'+STRUCT.map(function(a){var s=soundness(a.premises.map(function(id){return m[id]===undefined?null:m[id]}));return '<tr><td>'+esc(TITLES[a.id])+'</td><td>'+(a.side==='con'?'Against':'For')+'</td><td>'+pct(s)+'</td></tr>'}).join('')+'</table>';
  h+='<h2>Premises I rated, with my notes</h2><table><tr><th>Premise</th><th>Rating</th><th>Note</th></tr>';
  var ids=Object.keys(PTEXT);ARGUMENTS.forEach(function(a){var u=UI[a.id];u.coreSliders.concat(u.postSliders).forEach(function(x){var id=(x.p||x.pp).id;if(x.activated)m[id]=+x.slider.value/100})});
  ids.forEach(function(id){if(m[id]===undefined&&!st.n[id])return;h+='<tr><td>'+plain(PTEXT[id])+'</td><td>'+(m[id]===undefined?'—':Math.round(m[id]*100)+'%')+'</td><td>'+esc(st.n[id]||'')+'</td></tr>'});
  h+='</table><p style="margin-top:16px;font-size:11px">Ratings are personal judgements. The result is a way to organise thinking, not a proof.</p>';
  var pr=$('#printReport');if(!pr){pr=document.createElement('div');pr.id='printReport';document.body.appendChild(pr)}
  pr.innerHTML=h;window.print();
}

/* ---------- guided tour ---------- */
var TOUR=[
 {t:'Welcome',x:'This tool lets you rate the premises of famous arguments and see what follows. It takes about a minute to learn.',sel:null},
 {t:'Pick your level',x:'Simple gives short plain-language reasons. Expert gives named scholars and the strongest objections.',sel:'#lvlSeg',tab:'arguments'},
 {t:'Open an argument',x:'Each card is an argument. Open one to see its premises and the evidence for and against each.',sel:'#argContainer .arg-card',tab:'arguments'},
 {t:'Rate a premise',x:'Slide to how likely you think a premise is to be true. Be honest, not generous. Add a note to remember why.',sel:'#argContainer .slider',tab:'arguments',open:true},
 {t:'Hear the other side',x:'The Against tab covers evil, hiddenness, naturalism and more. Rate those too so the result is fair.',sel:'#panel-beta .beta-arg',tab:'beta'},
 {t:'See the net result',x:'This combines both sides from your starting point and shows what would change your mind.',sel:'#netBig',tab:'net'},
 {t:'Share or keep it',x:'Download a result card, print a PDF with your notes, or compare yourself with a famous thinker.',sel:'#btnCard',tab:'net'}
];
var tourI=0,pop=null;
function clearHl(){$$('.tour-hl').forEach(function(e){e.classList.remove('tour-hl')})}
function showStep(){
  clearHl();var s=TOUR[tourI];if(s.tab)activate(s.tab);
  if(s.open){var c=$('#argContainer .arg-card');if(c)c.classList.add('open')}
  var el=s.sel?$(s.sel):null;if(el){el.classList.add('tour-hl');el.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
  pop.innerHTML='<h4>'+(tourI+1)+'/'+TOUR.length+' · '+s.t+'</h4><p>'+s.x+'</p><div class="row"><button id="tSkip">Skip</button><span><button id="tBack"'+(tourI?'':' disabled')+'>Back</button> <button class="go" id="tNext">'+(tourI===TOUR.length-1?'Done':'Next')+'</button></span></div>';
  $('#tSkip').onclick=endTour;$('#tBack').onclick=function(){tourI--;showStep()};$('#tNext').onclick=function(){if(tourI===TOUR.length-1)endTour();else{tourI++;showStep()}};
  $('#tNext').focus();
}
function startTour(){tourI=0;if(!pop){pop=document.createElement('div');pop.className='tour-pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Guided tour');document.body.appendChild(pop)}pop.style.display='block';showStep()}
function endTour(){clearHl();if(pop)pop.style.display='none';activate('arguments');try{localStorage.setItem('tpe-tour','1')}catch(e){}}
window.startGuidedTour=startTour;

function toast(m){try{showToast(m,'success')}catch(e){}}

/* ---------- hook into v2 ---------- */
function update(){
  BA.forEach(function(a){var s=soundness(a.premises.map(function(p){return st.r[p.id]===undefined?null:st.r[p.id]/100}));var e=$('#bs-'+a.id);if(e)e.textContent='Argument soundness (product of premises): '+pct(s)});
  updateNet();
}
var _rc=window.recalcAll;window.recalcAll=function(){var o=_rc.apply(this,arguments);try{update()}catch(e){}return o};
var _cs=window.collectState;window.collectState=function(){var s=_cs.apply(this,arguments);s.beta=JSON.parse(JSON.stringify(st.r));return s};
var _as=window.applyState;window.applyState=function(s,skip){if(s&&s.beta){st.r=JSON.parse(JSON.stringify(s.beta));save();syncBetaSliders()}return _as.apply(this,arguments)};
function syncBetaSliders(){$$('.bcard').forEach(function(c){var id=c.dataset.pid,sl=$('.slider',c),d=$('.conf-display',c);if(st.r[id]!==undefined){sl.value=st.r[id];d.textContent=st.r[id]+'%';d.classList.remove('empty');c.classList.add('rated');updateTrack(sl)}else{sl.value=50;sl.style.background='';d.textContent='—';d.classList.add('empty');c.classList.remove('rated')}})}

buildBeta();buildNet();addNotes();addSliderLabels();renderBetaLevels();
$$('#lvlSeg button').forEach(function(b){b.addEventListener('click',renderBetaLevels)});
try{var q=new URLSearchParams(location.search).get('s');if(q){var sh=JSON.parse(decodeURIComponent(escape(atob(q))));applyState(sh,true);showToast('Loaded shared ratings','success')}}catch(e){}
update();
window.TPEBeta={state:st,net:function(){return net(readRatings())},startTour:startTour};
})();
