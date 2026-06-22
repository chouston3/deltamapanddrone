const CROPS={
  corn:{label:'Corn',base:50,cap:86,total:2700,unit:'GDD',stages:[{g:0,s:'Pre-emergence',v:'low'},{g:120,s:'VE · emergence',v:'high'},{g:350,s:'V3–V5',v:'med'},{g:475,s:'V6',v:'high'},{g:740,s:'V10',v:'high'},{g:1000,s:'V14',v:'high'},{g:1135,s:'VT · tasseling',v:'high'},{g:1400,s:'R1 · silking',v:'high'},{g:1925,s:'R3 · milk',v:'med'},{g:2450,s:'R5 · dent',v:'low'},{g:2700,s:'R6 · maturity',v:'low'}]},
  soybean:{label:'Soybean',base:50,cap:86,total:2500,unit:'GDD',stages:[{g:0,s:'Pre-emergence',v:'low'},{g:130,s:'VE · emergence',v:'high'},{g:400,s:'V-stages',v:'med'},{g:700,s:'R1 · bloom',v:'high'},{g:1100,s:'R3 · pod set',v:'high'},{g:1500,s:'R5 · seed fill',v:'high'},{g:1900,s:'R6 · full seed',v:'med'},{g:2500,s:'R8 · maturity',v:'low'}]},
  cotton:{label:'Cotton',base:60,cap:86,total:2200,unit:'DD60',stages:[{g:0,s:'Pre-emergence',v:'low'},{g:60,s:'Emergence',v:'high'},{g:450,s:'First square',v:'high'},{g:750,s:'First bloom',v:'high'},{g:1100,s:'Peak bloom',v:'high'},{g:1500,s:'Boll fill',v:'med'},{g:1750,s:'First open boll',v:'med'},{g:2200,s:'60% open · defoliation',v:'high'}]},
  rice:{label:'Rice',base:50,cap:94,total:2400,unit:'DD50',stages:[{g:0,s:'Pre-emergence',v:'low'},{g:120,s:'Emergence',v:'med'},{g:500,s:'Tillering',v:'med'},{g:1000,s:'Late tillering',v:'high'},{g:1500,s:'Panicle initiation',v:'high'},{g:2000,s:'Heading',v:'med'},{g:2400,s:'Maturity',v:'low'}]}
};
const VNOTE={high:'Strong scouting value — variability, nutrient and stress signals show up clearly now.',med:'Useful, but pair NDVI with NDRE; the canopy index may be saturating.',low:'Limited scouting value at this stage.'};
const TURF={turf_warm:{label:'Turf · warm-season',topt:31,varr:7},turf_cool:{label:'Turf · cool-season',topt:20,varr:5.5}};
function typeOf(c){return CROPS[c]||TURF[c]||null}
function growthPotential(meanF,t){const c=(meanF-32)*5/9;return Math.exp(-0.5*Math.pow((c-t.topt)/t.varr,2))}
const ACC_PER_BATT_DEFAULT=150;
const CHECKLIST=['Airspace + NOTAMs checked (LAANC if needed)','Mission boundary loaded in DJI Pilot 2','RTK base set / NTRIP connected','Sunlight sensor (DLS) clean + unobstructed','Airframe, props, battery, firmware inspected','RTH altitude + low-battery RTH set','Flight logged (time, conditions, notes)'];

const LS='delta_mission_fields_v2';
let fields=[];let activeId=null;let editId=null;let cur=null;let briefs={};
try{fields=JSON.parse(localStorage.getItem(LS))||[]}catch(e){fields=[]}
function save(){try{localStorage.setItem(LS,JSON.stringify(fields))}catch(e){}}
function el(id){return document.getElementById(id)}
function esc(s){return (s+'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function toast(t){const e=el('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}

function renderFields(){
  const c=el('fieldList');c.innerHTML='';
  if(!fields.length){c.innerHTML='<div style="color:var(--faint);font-size:13px;padding:4px 2px 12px">No fields yet.</div>';return}
  fields.forEach(f=>{
    const d=document.createElement('div');
    d.className='field-item'+(f.id===activeId?' active':'');
    d.innerHTML='<div class="fname">'+esc(f.name)+'<span style="display:flex;align-items:center;gap:4px">'+(f.crop&&typeOf(f.crop)?'<span class="crop-chip">'+typeOf(f.crop).label+'</span>':'')+
      '<button class="ibtn" data-edit="'+f.id+'" title="Edit">&#9998;</button><button class="ibtn del" data-del="'+f.id+'" title="Remove">&times;</button></span></div>'+
      '<div class="fmeta mono">'+(+f.lat).toFixed(4)+', '+(+f.lon).toFixed(4)+(f.acres?' · '+f.acres+' ac':'')+'</div>';
    d.addEventListener('click',ev=>{
      if(ev.target.dataset.del){del(ev.target.dataset.del);ev.stopPropagation();return}
      if(ev.target.dataset.edit){startEdit(ev.target.dataset.edit);ev.stopPropagation();return}
      select(f.id);
    });
    c.appendChild(d);
  });
}
function del(id){fields=fields.filter(f=>f.id!==id);save();if(activeId===id){activeId=null;cur=null;el('main').innerHTML='<div class="empty"><div class="big">Field removed</div>Pick another field or add a new one.</div>'}renderFields()}
function startEdit(id){
  const f=fields.find(x=>x.id===id);if(!f)return;editId=id;
  el('fName').value=f.name;el('fLat').value=f.lat;el('fLon').value=f.lon;el('fCrop').value=f.crop;el('fPlant').value=f.plant;
  el('fAcres').value=f.acres||'';el('fNotes').value=f.notes||'';
  el('formTitle').textContent='Edit field';el('addBtn').textContent='Save changes';el('cancelEdit').style.display='block';
  el('addForm').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function resetForm(){
  editId=null;['fName','fLat','fLon','fAcres','fNotes','geoQ'].forEach(i=>el(i).value='');el('geoRes').innerHTML='';
  el('formTitle').textContent='Fields';el('addBtn').textContent='Add field';el('cancelEdit').style.display='none';
}
el('cancelEdit').addEventListener('click',resetForm);

el('addBtn').addEventListener('click',()=>{
  const name=el('fName').value.trim(),lat=parseFloat(el('fLat').value),lon=parseFloat(el('fLon').value),
    crop=el('fCrop').value,plant=el('fPlant').value,acres=parseFloat(el('fAcres').value)||null,notes=el('fNotes').value.trim();
  if(!name||isNaN(lat)||isNaN(lon)){alert('Need a name and valid lat/long. Crop and planting date are optional.');return}
  if(editId){const f=fields.find(x=>x.id===editId);Object.assign(f,{name,lat,lon,crop,plant,acres,notes});save();const id=editId;resetForm();renderFields();select(id);}
  else{const f={id:'f'+Date.now(),name,lat,lon,crop,plant,acres,notes,lastFlown:null};fields.push(f);save();resetForm();renderFields();select(f.id);}
});

el('geoSearch').addEventListener('click',doGeocode);
el('geoQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doGeocode()}});
async function doGeocode(){
  const q=el('geoQ').value.trim();if(!q)return;el('geoRes').innerHTML='<div style="color:var(--faint);font-size:12px;padding:4px">Searching…</div>';
  try{
    const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=5&name='+encodeURIComponent(q));
    const j=await r.json();const res=j.results||[];
    if(!res.length){el('geoRes').innerHTML='<div style="color:var(--faint);font-size:12px;padding:4px">No matches.</div>';return}
    const box=document.createElement('div');box.className='geo-res';
    res.forEach(p=>{const b=document.createElement('button');b.textContent=[p.name,p.admin1,p.country_code].filter(Boolean).join(', ');
      b.addEventListener('click',()=>{el('fLat').value=(+p.latitude).toFixed(5);el('fLon').value=(+p.longitude).toFixed(5);if(!el('fName').value)el('fName').value=p.name;el('geoRes').innerHTML=''});box.appendChild(b)});
    el('geoRes').innerHTML='';el('geoRes').appendChild(box);
  }catch(e){el('geoRes').innerHTML='<div style="color:var(--faint);font-size:12px;padding:4px">Search failed — paste coordinates instead.</div>'}
}
el('geoBtn').addEventListener('click',()=>{
  if(!navigator.geolocation){alert('Geolocation unavailable — paste coordinates instead.');return}
  el('geoBtn').textContent='Locating…';
  navigator.geolocation.getCurrentPosition(p=>{el('fLat').value=p.coords.latitude.toFixed(5);el('fLon').value=p.coords.longitude.toFixed(5);el('geoBtn').textContent='Use my current location'},
    ()=>{el('geoBtn').textContent='Use my current location';alert('Could not get location (needs https or localhost).')});
});

function solarPos(date,lat,lon){
  const rad=Math.PI/180;
  const jd=date.getTime()/86400000+2440587.5,T=(jd-2451545.0)/36525.0;
  const L0=((280.46646+T*(36000.76983+T*0.0003032))%360+360)%360;
  const M=357.52911+T*(35999.05029-0.0001537*T),e=0.016708634-T*(0.000042037+0.0000001267*T),Mr=M*rad;
  const C=Math.sin(Mr)*(1.914602-T*(0.004817+0.000014*T))+Math.sin(2*Mr)*(0.019993-0.000101*T)+Math.sin(3*Mr)*0.000289;
  const trueLong=L0+C,omega=125.04-1934.136*T,appLong=trueLong-0.00569-0.00478*Math.sin(omega*rad);
  const eps0=23+(26+((21.448-T*(46.815+T*(0.00059-T*0.001813))))/60)/60,eps=eps0+0.00256*Math.cos(omega*rad);
  const decl=Math.asin(Math.sin(eps*rad)*Math.sin(appLong*rad))/rad;
  const y=Math.tan((eps/2)*rad)**2;
  const eot=4*(y*Math.sin(2*L0*rad)-2*e*Math.sin(Mr)+4*e*y*Math.sin(Mr)*Math.cos(2*L0*rad)-0.5*y*y*Math.sin(4*L0*rad)-1.25*e*e*Math.sin(2*Mr))/rad;
  const minUTC=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60;
  let tst=(minUTC+eot+4*lon)%1440;if(tst<0)tst+=1440;
  let ha=tst/4-180;if(ha<-180)ha+=360;
  const haR=ha*rad,latR=lat*rad,decR=decl*rad;
  const cz=Math.sin(latR)*Math.sin(decR)+Math.cos(latR)*Math.cos(decR)*Math.cos(haR);
  const elev=90-Math.acos(Math.max(-1,Math.min(1,cz)))/rad;
  let az=Math.atan2(Math.sin(haR),Math.cos(haR)*Math.sin(latR)-Math.tan(decR)*Math.cos(latR))/rad;
  az=(az+180)%360;if(az<0)az+=360;
  return {elev,az};
}
function getEOT(date){
  const rad=Math.PI/180,jd=date.getTime()/86400000+2440587.5,T=(jd-2451545.0)/36525.0;
  const L0=((280.46646+T*(36000.76983+T*0.0003032))%360+360)%360;
  const M=357.52911+T*(35999.05029-0.0001537*T),e=0.016708634-T*(0.000042037+0.0000001267*T),Mr=M*rad;
  const omega=125.04-1934.136*T,eps0=23+(26+((21.448-T*(46.815+T*(0.00059-T*0.001813))))/60)/60,eps=eps0+0.00256*Math.cos(omega*rad);
  const y=Math.tan((eps/2)*rad)**2;
  return 4*(y*Math.sin(2*L0*rad)-2*e*Math.sin(Mr)+4*e*y*Math.sin(Mr)*Math.cos(2*L0*rad)-0.5*y*y*Math.sin(4*L0*rad)-1.25*e*e*Math.sin(2*Mr))/rad;
}
function solarNoonDec(noonUTC,lon,tzMin){return (720-4*lon-getEOT(noonUTC)+tzMin)/60}
function fmtClock(dec){let m=Math.round(dec*60);m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mm=m%60,ap=h<12?'AM':'PM';let hh=h%12;if(hh===0)hh=12;return hh+':'+(mm<10?'0':'')+mm+' '+ap}
function hr12(h){const ap=h<12?'a':'p';let hh=h%12;if(hh===0)hh=12;return hh+ap}
function compass(az){const d=['N','NE','E','SE','S','SW','W','NW'];return d[Math.round(az/45)%8]}

function canopyState(h,hsr){
  if(h.precip>=0.01||hsr<=0)return {s:'wet',label:'Wet — rain on canopy'};
  const spread=h.temp-h.dew;
  if(h.rh>=95&&spread<=2)return {s:'wet',label:'Dew/fog — surfaces wet'};
  const fast=(spread>=15||h.rh<60)&&h.wind>=3&&h.rad>=300;
  const slow=(spread<8||h.rh>85)||(h.wind<1.5&&h.rad<120);
  let need=fast?1:(slow?5:2.5);
  if(hsr>=need)return {s:'dry',label:'Canopy dry'};
  if(hsr>=need-1.5)return {s:'drying',label:'Drying — likely still damp'};
  return {s:'wet',label:'Wet — recent rain'};
}
function accessFor(rain48){
  if(rain48>0.6)return {s:'mud',label:'Muddy',cls:'ac-mud'};
  if(rain48>0.1)return {s:'soft',label:'Soft',cls:'ac-soft'};
  return {s:'firm',label:'Firm',cls:'ac-firm'};
}
function gddDaily(tx,tn,base,cap){const a=Math.min(Math.max(tx,base),cap),b=Math.min(Math.max(tn,base),cap);return Math.max(0,(a+b)/2-base)}
function stageFor(crop,gdd){const st=CROPS[crop].stages;let c=st[0];for(const s of st){if(gdd>=s.g)c=s;else break}return c}

function scoreHour(h,noonDec,winN){
  const r=[];let hard=false;
  if(h.solar<8)return {verdict:'nogo',score:0,reasons:['Dark / sun below horizon'],hard:true};
  if(noonDec!=null){const ctr=h.hour+0.5;if(ctr<noonDec-winN||ctr>noonDec+winN)return {verdict:'nogo',score:0,reasons:['Outside ±'+winN+'h of solar noon ('+fmtClock(noonDec)+')'],hard:true}}
  let precipS;
  if(h.precip>0.005||h.pprob>=60){precipS=0;hard=true;r.push('Rain likely ('+Math.round(h.pprob)+'%)')}
  else if(h.pprob>=35){precipS=0.5;r.push('Precip chance '+Math.round(h.pprob)+'%')}else precipS=1;
  let windS;
  if(h.gust>12||h.wind>12){windS=0;hard=true;r.push('Wind/gust over 12 m/s limit')}
  else if(h.wind>10){windS=0.25;r.push('Wind 10–12 m/s — marginal, heavy drain')}
  else if(h.wind>8){windS=0.55;r.push('Wind 8–10 m/s — caution')}
  else if(h.wind>6){windS=0.85}else windS=1;
  if(!hard&&h.gust>10&&(h.gust-h.wind)>4){windS=Math.min(windS,0.5);r.push('Gusty')}
  let cloudS;const c=h.cloud;
  if(c<=15)cloudS=1;else if(c<=30)cloudS=0.85;
  else if(c<70){cloudS=0.35;r.push('Partly cloudy — drifting light hurts reflectance')}
  else if(c<90){cloudS=0.7}else cloudS=0.85;
  let canopyS=1;
  if(h.canopy){if(h.canopy.s==='wet'){canopyS=0;hard=true;r.push(h.canopy.label)}else if(h.canopy.s==='drying'){canopyS=0.5;r.push(h.canopy.label)}}
  let sunS;
  if(h.solar>=40)sunS=1;else if(h.solar>=30){sunS=0.8;r.push('Sun '+Math.round(h.solar)+'° — under 40° target')}
  else if(h.solar>=25){sunS=0.55;r.push('Sun '+Math.round(h.solar)+'° — shadow contamination')}
  else if(h.solar>=20){sunS=0.4;r.push('Low sun '+Math.round(h.solar)+'°')}else{sunS=0.3;r.push('Very low sun')}
  let tempS=1;
  if(h.temp>104||h.temp<14){tempS=0;hard=true;r.push('Outside −10–40 °C spec')}else if(h.temp>100){tempS=0.6;r.push('Heat near limit')}
  const score=windS*0.26+cloudS*0.20+precipS*0.20+canopyS*0.17+sunS*0.12+tempS*0.05;
  let verdict;if(hard||score<0.45)verdict='nogo';else if(score<0.72)verdict='caution';else verdict='go';
  if(!hard&&h.canopy&&h.canopy.s==='drying'&&verdict==='go')verdict='caution';
  return {verdict,score,reasons:r,hard};
}
function bestWindow(hours){
  for(const target of ['go','caution']){
    let bestS=-1,bestE=-1,s=-1;
    for(let i=0;i<hours.length;i++){
      const ok=hours[i].sc.verdict===target||(target==='caution'&&hours[i].sc.verdict==='go');
      if(ok){if(s<0)s=i}else{if(s>=0&&i-1-s>bestE-bestS){bestS=s;bestE=i-1}s=-1}
    }
    if(s>=0&&hours.length-1-s>bestE-bestS){bestS=s;bestE=hours.length-1}
    if(bestS>=0)return {h0:hours[bestS].hour,h1:hours[bestE].hour+1,kind:target,i0:bestS,i1:bestE};
  }
  return null;
}

const COL={go:'#57a86a',caution:'#d9a32f',nogo:'#c75a4e'};
function ribbonSVG(hours,noonDec,winN){
  const H0=5,H1=20,n=H1-H0+1,W=640,padL=8,padR=8,top=8,plotH=46,barTop=66,barH=26,labY=104;
  const slot=(W-padL-padR)/n,xOf=v=>padL+(v-H0)*slot;
  let bars='',pts=[],ticks='';
  for(let i=0;i<n;i++){
    const hh=H0+i,rec=hours.find(x=>x.hour===hh),x=padL+i*slot;
    if(rec){bars+='<rect x="'+(x+1).toFixed(1)+'" y="'+barTop+'" width="'+(slot-2).toFixed(1)+'" height="'+barH+'" rx="3" fill="'+COL[rec.sc.verdict]+'"/>';
      const elev=Math.max(0,Math.min(75,rec.solar)),cy=top+plotH-(elev/75)*plotH;pts.push((x+slot/2).toFixed(1)+','+cy.toFixed(1));}
    else bars+='<rect x="'+(x+1).toFixed(1)+'" y="'+barTop+'" width="'+(slot-2).toFixed(1)+'" height="'+barH+'" rx="3" fill="#232a2f"/>';
    if(i%3===0||i===n-1)ticks+='<text x="'+(x+slot/2).toFixed(1)+'" y="'+labY+'" fill="#66726c" font-size="10.5" font-family="IBM Plex Mono,monospace" text-anchor="middle">'+hr12(hh)+'</text>';
  }
  const line=pts.length?'<polyline points="'+pts.join(' ')+'" fill="none" stroke="#6aa6c4" stroke-width="1.6" stroke-linejoin="round" opacity="0.9"/>':'';
  const e40=top+plotH-(40/75)*plotH;
  const f40='<line x1="'+padL+'" y1="'+e40.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+e40.toFixed(1)+'" stroke="#6aa6c4" stroke-width="0.7" stroke-dasharray="2 4" opacity="0.45"/><text x="'+(W-padR)+'" y="'+(e40-2).toFixed(1)+'" fill="#6aa6c4" font-size="9" font-family="IBM Plex Mono,monospace" text-anchor="end" opacity="0.7">40°</text>';
  let marks='';
  if(noonDec!=null){const inb=v=>v>=H0&&v<=H1+1;
    if(inb(noonDec)){const xn=xOf(noonDec);marks+='<line x1="'+xn.toFixed(1)+'" y1="'+top+'" x2="'+xn.toFixed(1)+'" y2="'+(barTop+barH)+'" stroke="#e0a94a" stroke-width="1.2" opacity="0.85"/><text x="'+xn.toFixed(1)+'" y="'+(barTop+barH+10)+'" fill="#e0a94a" font-size="9.5" font-family="IBM Plex Mono,monospace" text-anchor="middle">noon</text>'}
    [noonDec-winN,noonDec+winN].forEach(v=>{if(inb(v)){const xv=xOf(v);marks+='<line x1="'+xv.toFixed(1)+'" y1="'+(top+4)+'" x2="'+xv.toFixed(1)+'" y2="'+(barTop+barH)+'" stroke="#e0a94a" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.5"/>'}});
  }
  return '<svg class="ribbon" viewBox="0 0 '+W+' 118" preserveAspectRatio="none" role="img" aria-label="Hourly flight conditions, sun angle, and solar-noon window"><text x="'+padL+'" y="'+(top+6)+'" fill="#52606a" font-size="10" font-family="IBM Plex Mono,monospace">sun ↑</text>'+f40+line+bars+marks+ticks+'</svg>';
}

async function select(id){
  activeId=id;renderFields();
  const f=fields.find(x=>x.id===id);if(!f)return;
  el('main').innerHTML='<div class="loading">Pulling forecast and accumulating degree days for <b>'+esc(f.name)+'</b>…</div>';
  const url='https://api.open-meteo.com/v1/forecast?latitude='+f.lat+'&longitude='+f.lon+
    '&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,precipitation_probability,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,shortwave_radiation'+
    '&daily=temperature_2m_max,temperature_2m_min&current=temperature_2m'+
    '&temperature_unit=fahrenheit&wind_speed_unit=ms&precipitation_unit=inch&timezone=auto&past_days=92&forecast_days=7';
  let data;
  const ctrl=new AbortController(),to=setTimeout(()=>ctrl.abort(),15000);
  try{const res=await fetch(url,{signal:ctrl.signal});clearTimeout(to);if(!res.ok)throw new Error('HTTP '+res.status);data=await res.json()}
  catch(e){clearTimeout(to);const blocked=(e.name==='AbortError'||location.protocol==='file:');
    el('main').innerHTML='<div class="err"><b>'+(e.name==='AbortError'?'The weather request timed out.':'Couldn\'t reach the weather service.')+'</b><br>'+
    (blocked?'This usually means the file is opened directly from disk (file://), where the browser blocks the data request. Serve it instead: open a terminal in this folder, run <span class="mono">python3 -m http.server 8000</span>, then visit <span class="mono">http://localhost:8000/'+location.pathname.split('/').pop()+'</span>.':esc(e.message)+'. Check your connection and retry.')+'</div>';return}

  const off=data.utc_offset_seconds||0,tzMin=off/60;
  const today=(data.current&&data.current.time||'').slice(0,10)||(data.daily.time.find(d=>d>=new Date().toISOString().slice(0,10))||data.daily.time[0]);

  let cfg=null,gdd=null,clamped=false,stage=null,pct=null,turf=null,primes=null;
  if(f.crop&&TURF[f.crop]){
    const t=TURF[f.crop];const di=data.daily.time.indexOf(today);
    const meanF=di>=0?(data.daily.temperature_2m_max[di]+data.daily.temperature_2m_min[di])/2:null;
    turf={label:t.label,meanF,gp:meanF!=null?growthPotential(meanF,t):null};
  } else if(f.crop&&CROPS[f.crop]){
    cfg=CROPS[f.crop];
    if(f.plant){
      gdd=0;const dt=data.daily.time;
      for(let i=0;i<dt.length;i++){if(dt[i]<f.plant)continue;if(dt[i]>today)break;gdd+=gddDaily(data.daily.temperature_2m_max[i],data.daily.temperature_2m_min[i],cfg.base,cfg.cap)}
      if(f.plant<dt[0])clamped=true;
      stage=stageFor(f.crop,gdd);pct=Math.min(100,Math.round(gdd/cfg.total*100));
    } else {
      primes=cfg.stages.filter(s=>s.v==='high').map(s=>s.s);
    }
  }

  const ht=data.hourly.time,P=data.hourly;
  const hsrArr=new Array(ht.length);let since=999;
  for(let i=0;i<ht.length;i++){const p=P.precipitation[i]||0;if(p>=0.01)since=0;else since++;hsrArr[i]=since}
  const idxOf={};ht.forEach((t,i)=>idxOf[t]=i);

  const byDay={},noonByDay={};
  for(let i=0;i<ht.length;i++){
    const d=ht[i].slice(0,10);if(d<today)continue;
    const hour=parseInt(ht[i].slice(11,13),10);
    const utc=new Date(Date.parse(ht[i].replace(' ','T')+':00Z')-off*1000);
    const sp=solarPos(utc,f.lat,f.lon);
    const rec={date:d,hour,temp:P.temperature_2m[i],rh:P.relative_humidity_2m[i],dew:P.dew_point_2m[i],
      precip:P.precipitation[i]||0,pprob:P.precipitation_probability[i]||0,cloud:P.cloud_cover[i]||0,
      wind:P.wind_speed_10m[i]||0,gust:P.wind_gusts_10m[i]||0,wdir:P.wind_direction_10m[i]||0,rad:P.shortwave_radiation[i]||0,
      solar:sp.elev,az:sp.az};
    rec.canopy=canopyState(rec,hsrArr[i]);
    (byDay[d]=byDay[d]||[]).push(rec);
    if(!(d in noonByDay)){const nu=new Date(Date.parse(d+'T12:00:00Z')-off*1000);noonByDay[d]=solarNoonDec(nu,f.lon,tzMin)}
  }
  const days=Object.keys(byDay).sort().slice(0,7);
  const rain48={};
  days.forEach(d=>{const i0=idxOf[d+'T00:00'];let s=0;if(i0!=null)for(let k=Math.max(0,i0-48);k<i0;k++)s+=P.precipitation[k]||0;rain48[d]=s});

  cur={f,cfg,gdd,clamped,stage,pct,turf,primes,byDay,days,noonByDay,rain48,updated:new Date()};
  render();
}

function render(){
  if(!cur)return;
  const {f,cfg,gdd,clamped,stage,pct,turf,primes,byDay,days,noonByDay,rain48,updated}=cur;
  const wEl=el('winN');let winN=parseFloat(wEl?wEl.value:3);if(isNaN(winN))winN=3;winN=Math.max(1,Math.min(6,winN));
  const apb=parseFloat((el('apb')&&el('apb').value)||ACC_PER_BATT_DEFAULT)||ACC_PER_BATT_DEFAULT;

  const ranked=days.map(d=>{
    const noonDec=noonByDay[d];
    const hrs=byDay[d].filter(x=>x.hour>=5&&x.hour<=20).map(x=>{x.sc=scoreHour(x,noonDec,winN);return x});
    if(!hrs.length)return null;
    const goCount=hrs.filter(x=>x.sc.verdict==='go').length,cautCount=hrs.filter(x=>x.sc.verdict==='caution').length;
    const win=bestWindow(hrs),peak=hrs.reduce((a,b)=>b.sc.score>a.sc.score?b:a,hrs[0]);
    return {d,noonDec,hrs,goCount,cautCount,win,peak,access:accessFor(rain48[d]||0)};
  }).filter(Boolean);

  let best=null;
  ranked.forEach(R=>{if(R.win&&R.win.kind==='go'){const seg=R.hrs.slice(R.win.i0,R.win.i1+1);const avg=seg.reduce((s,h)=>s+h.sc.score,0)/seg.length;const len=R.win.h1-R.win.h0;if(!best||avg>best.avg+1e-9||(Math.abs(avg-best.avg)<1e-9&&len>best.len))best={R,avg,len}}});
  const noonNow=days.length?noonByDay[days[0]]:null,noonEnd=days.length?noonByDay[days[days.length-1]]:null;

  let html='';
  if(best){const R=best.R;const dO=new Date(R.d+'T12:00:00');
    html+='<div class="banner b-go"><div><div class="blab">Best window this week</div><div class="bmain">'+dO.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})+', '+hr12(R.win.h0)+'–'+hr12(R.win.h1)+'</div></div></div>';
  } else {
    const anyCaut=ranked.some(R=>R.win&&R.win.kind==='caution');
    html+='<div class="banner '+(anyCaut?'b-caution':'b-nogo')+'"><div><div class="blab">Best window this week</div><div class="bmain">'+(anyCaut?'Marginal only — no clean go in the next 7 days':'No usable window in the next 7 days')+'</div></div></div>';
  }

  const cropNote=clamped?' <span style="color:var(--faint)">(from ~92 days — may undercount)</span>':'';
  const lastTxt=f.lastFlown?(()=>{const days2=Math.round((Date.now()-Date.parse(f.lastFlown+'T12:00:00'))/86400000);return new Date(f.lastFlown+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'})+' ('+days2+'d ago)'})():'never';
  const drift=(noonNow!=null&&noonEnd!=null)?'drifts to '+fmtClock(noonEnd):'';
  const mission=f.acres?(()=>{const batts=Math.ceil(f.acres/apb),mins=Math.round(f.acres/apb*40);return batts+' batt'+(batts>1?'s':'')+' · ~'+mins+' min'})():'add acreage';

  let cropStat='',baseNote='';
  if(stage){
    cropStat='<div class="stat"><div class="k">Crop stage</div><div class="v" style="font-size:18px">'+stage.s+' <span class="vchip v-'+stage.v+'">'+stage.v+'</span></div><div class="sub">'+cfg.label+' · '+Math.round(gdd).toLocaleString()+' / '+cfg.total.toLocaleString()+' '+cfg.unit+cropNote+'</div></div>';
    baseNote=VNOTE[stage.v];
  } else if(turf&&turf.gp!=null){
    const pg=Math.round(turf.gp*100);
    const lab=turf.gp>=0.5?'active':turf.gp>=0.25?'moderate':turf.gp>=0.1?'slow':'dormant';
    const cls=turf.gp>=0.5?'v-high':turf.gp>=0.25?'v-med':'v-low';
    cropStat='<div class="stat"><div class="k">Turf growth potential</div><div class="v">'+pg+'% <span class="vchip '+cls+'">'+lab+'</span></div><div class="sub">'+turf.label+' · today mean '+Math.round(turf.meanF)+'°F</div></div>';
    baseNote=turf.gp>=0.5?'Turf actively growing — NDVI/NDRE stress and uniformity maps are reliable now.':turf.gp>=0.25?'Moderate growth — scouting works; read marginal stress cautiously.':turf.gp>=0.1?'Slow growth — limited physiological signal; map for thinning, wear and drainage instead.':'Near-dormant — reflectance is muted, low scouting value.';
  } else if(primes&&primes.length){
    cropStat='<div class="stat"><div class="k">Prime recon stages</div><div class="v" style="font-size:14px;line-height:1.35">'+primes.join(', ')+'</div><div class="sub">'+(cfg?cfg.label:'')+' · add a planting date for live stage</div></div>';
    baseNote='No planting date set — these are the stages where drone scouting delivers the most for '+(cfg?cfg.label.toLowerCase():'this crop')+'. Add a date to track the current stage.';
  }
  const noteHtml = baseNote + (f.notes?((baseNote?' <span style="color:var(--faint)">·</span> ':'')+esc(f.notes)):'');

  html+='<div class="card" style="margin-bottom:18px">'+
    '<h2>'+esc(f.name)+' — field summary</h2>'+
    '<div class="stagebar">'+
      cropStat+
      '<div class="stat"><div class="k">Solar noon this week</div><div class="v mono">'+(noonNow!=null?fmtClock(noonNow):'—')+'</div><div class="sub">'+drift+'</div></div>'+
      '<div class="stat"><div class="k">Mission load</div><div class="v mono" style="font-size:18px">'+mission+'</div><div class="sub">'+(f.acres?f.acres+' ac @ '+apb+' ac/batt':'set acreage to estimate')+'</div></div>'+
      '<div class="stat"><div class="k">Last flown</div><div class="v" style="font-size:16px">'+lastTxt+'</div><div class="sub"><button class="ghost" id="markFlown" style="padding:3px 8px;font-size:11px">Mark flown today</button></div></div>'+
    '</div>'+
    (noteHtml?'<div class="note">'+noteHtml+'</div>':'')+
    '<div class="cardrow">'+
      '<button class="ghost" id="aSect">Sectional (SkyVector)</button>'+
      '<button class="ghost" id="aAloft">LAANC (Aloft Air Control)</button>'+
      '<label style="display:flex;align-items:center;gap:6px;margin:0;text-transform:none;letter-spacing:0;font-size:12.5px;color:var(--muted)">acres/battery <input id="apb" class="mono" type="number" min="20" max="600" step="10" value="'+apb+'" style="width:66px;padding:5px 8px"></label>'+
    '</div>'+
  '</div>';

  html+='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">'+
    '<h2 style="margin:0">7-day flight outlook</h2>'+
    '<div style="display:flex;gap:14px;align-items:center">'+
      '<label style="display:flex;align-items:center;gap:8px;margin:0;text-transform:none;letter-spacing:0;font-size:13px;color:var(--muted)">Noon window&nbsp;±<input id="winN" type="number" min="1" max="6" step="0.5" value="'+winN+'" style="width:58px"> h</label>'+
      '<button class="ghost" id="refresh" title="Re-fetch">↻ Refresh</button>'+
    '</div>'+
  '</div>';

  briefs={};
  ranked.forEach(R=>{
    const dObj=new Date(R.d+'T12:00:00'),dow=dObj.toLocaleDateString(undefined,{weekday:'short'}),md=dObj.toLocaleDateString(undefined,{month:'short',day:'numeric'});
    let pill,plabel;
    if(R.goCount>=2){pill='p-go';plabel='Go'}else if(R.goCount+R.cautCount>=2){pill='p-caution';plabel='Caution'}else{pill='p-nogo';plabel='No-go'}
    let winTxt=R.win?'<b>'+hr12(R.win.h0)+'–'+hr12(R.win.h1)+'</b> '+(R.win.kind==='go'?'clear to fly':'caution'):'<b>No usable window</b> in the noon band';
    const p=R.peak||R.hrs[0];
    const mid=R.win?R.hrs.find(x=>x.hour===Math.floor((R.win.h0+R.win.h1)/2)):p;
    const azTxt=mid?'sun '+compass(mid.az)+' '+Math.round(mid.az)+'°':'';
    const peakTxt='solar noon '+fmtClock(R.noonDec)+' · peak '+Math.round(p.solar)+'° · '+p.wind.toFixed(1)+' m/s ('+Math.round(p.wind*2.237)+' mph) · '+Math.round(p.cloud)+'% cloud';
    const canWin=mid?mid.canopy:(R.hrs[0]&&R.hrs[0].canopy);
    const canCls=canWin?('can-'+canWin.s):'can-dry',canLab=canWin?canWin.label.split(' — ')[0]:'—';
    let rows='';
    R.hrs.filter(x=>x.hour%2===0).forEach(x=>{rows+='<tr><td><span class="hv" style="background:'+COL[x.sc.verdict]+'"></span>'+hr12(x.hour)+'</td><td class="mono">'+x.wind.toFixed(1)+'/'+x.gust.toFixed(1)+'</td><td class="mono">'+Math.round(x.cloud)+'%</td><td class="mono">'+Math.round(x.pprob)+'%</td><td class="mono">'+(x.temp-x.dew>=0?'+':'')+Math.round(x.temp-x.dew)+'°</td><td class="mono">'+Math.round(x.solar)+'°</td><td class="mono">'+compass(x.az)+'</td><td style="text-align:right"><span class="hv" style="background:'+(x.canopy.s==='dry'?'#57a86a':x.canopy.s==='drying'?'#d9a32f':'#c75a4e')+'"></span></td></tr>'});

    briefs[R.d]='DELTA FLIGHT BRIEF — '+f.name+' ('+(+f.lat).toFixed(4)+', '+(+f.lon).toFixed(4)+')\n'+
      dObj.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})+(stage?' · '+cfg.label+' '+stage.s:(turf&&turf.gp!=null?' · '+turf.label+' · growth '+Math.round(turf.gp*100)+'%':''))+'\n'+
      'VERDICT: '+plabel.toUpperCase()+'\n'+
      'Window: '+(R.win?hr12(R.win.h0)+'–'+hr12(R.win.h1)+' ('+(R.win.kind==='go'?'clear to fly':'caution')+')':'none in noon band')+'\n'+
      'Solar noon '+fmtClock(R.noonDec)+' · peak sun '+Math.round(p.solar)+'°'+(azTxt?' · '+azTxt:'')+'\n'+
      'Wind '+p.wind.toFixed(1)+' m/s (gust '+p.gust.toFixed(1)+') · cloud '+Math.round(p.cloud)+'% · rain '+Math.round(p.pprob)+'%\n'+
      'Canopy: '+canLab.toLowerCase()+' · Field access: '+R.access.label.toLowerCase()+'\n'+
      (f.notes?'Notes: '+f.notes+'\n':'');

    html+='<div class="dayrow">'+
      '<div class="dayhead"><div class="daydate"><span class="dow">'+dow+'</span> '+md+'</div>'+
        '<div class="dchips"><span class="canchip '+canCls+'">'+canLab+'</span><span class="acchip '+R.access.cls+'">access '+R.access.label+'</span><span class="verdict-pill '+pill+'">'+plabel+'</span></div></div>'+
      '<div class="winsum">'+winTxt+' · <span style="color:var(--faint)">'+peakTxt+(azTxt?' · '+azTxt:'')+'</span></div>'+
      ribbonSVG(R.hrs,R.noonDec,winN)+
      '<details><summary>Hourly detail &amp; copy briefing</summary>'+
        '<button class="ghost" data-brief="'+R.d+'" style="margin:4px 0 2px">Copy briefing</button>'+
        '<table class="hourtbl"><thead><tr><th>Hour</th><th>Wind/gust</th><th>Cloud</th><th>Rain</th><th>T−Dew</th><th>Sun</th><th>Az</th><th>Canopy</th></tr></thead><tbody>'+rows+'</tbody></table>'+
      '</details>'+
    '</div>';
  });

  html+='<div class="card" style="margin-top:18px"><h2>Pre-flight checklist</h2><div id="ckl">'+
    CHECKLIST.map((c,i)=>'<label class="ckitem"><input type="checkbox" data-ck="'+i+'"><span>'+c+'</span></label>').join('')+
    '</div><div class="note" style="margin-top:6px">Resets each session — walk it before every launch.</div></div>';

  if(updated)html+='<div style="color:var(--faint);font-size:11.5px;text-align:right;margin-top:10px" class="mono">updated '+updated.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'</div>';

  el('main').innerHTML=html;

  const wn=el('winN');if(wn)wn.addEventListener('change',render);
  const ap=el('apb');if(ap)ap.addEventListener('change',render);
  const rf=el('refresh');if(rf)rf.addEventListener('click',()=>select(f.id));
  const mf=el('markFlown');if(mf)mf.addEventListener('click',()=>{f.lastFlown=new Date().toISOString().slice(0,10);save();render();toast('Marked flown today')});
  const se=el('aSect');if(se)se.addEventListener('click',()=>window.open('https://skyvector.com/?ll='+f.lat+','+f.lon+'&chart=301&zoom=5','_blank'));
  const al=el('aAloft');if(al)al.addEventListener('click',()=>window.open('https://air.aloft.ai/','_blank'));
  el('main').querySelectorAll('[data-brief]').forEach(b=>b.addEventListener('click',()=>{
    const t=briefs[b.dataset.brief]||'';
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(()=>toast('Briefing copied'),()=>fallbackCopy(t));else fallbackCopy(t);
  }));
  el('main').querySelectorAll('[data-ck]').forEach(cb=>cb.addEventListener('change',()=>{cb.closest('.ckitem').classList.toggle('done',cb.checked)}));
}
function fallbackCopy(t){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Briefing copied')}catch(e){toast('Copy failed')}document.body.removeChild(ta)}

renderFields();
if(fields.length)select(fields[0].id);
