// XC Coach Career v3 - Contracts (Option B), Scholarships (Option A), At-large Hybrid
const STORAGE_KEY = 'xc_coach_v3_save';

let state = {
  coachName: 'You',
  programName: 'Hometown U',
  season: 2025,
  week: 1,
  roster: [],
  calendar: {},
  seasonLog: [],
  xp: 0,
  rp: 10,
  scholarshipsTotalPct: 1200, // 12 scholarships represented as 1200 percentage points (100 per scholarship)
  jobOffers: [],
  currentContract: {yearsRemaining: 4, totalYears:4, buyout: 30000}, // Option B: 4-6 year contracts
  career: [],
  rankingsHistory: []
};

function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function choice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function makeAthlete(name){
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    name,
    year: rand(1,4),
    endurance: rand(50,80),
    speed: rand(40,75),
    mental: rand(45,80),
    potential: rand(60,95),
    fatigue: rand(0,10),
    scholarshipPct: 0, // 0-1000 scale (we'll store as 0-100)
    training: {volume:50,intensity:50,recovery:50},
    qualityWins: 0 // for rankings quality metric
  };
}

function setupCalendar(){
  const cal = {};
  cal[2] = {name:'Early Season Invite', type:'invite'};
  cal[4] = {name:'Midwest Classic', type:'invite'};
  cal[6] = {name:'Pre-Nationals', type:'invite'};
  cal[8] = {name:'Great Lakes Showdown', type:'invite'};
  cal[10] = {name:'Conference Championships', type:'conference'};
  cal[11] = {name:'NCAA Regionals', type:'regionals'};
  cal[12] = {name:'NCAA Championships', type:'ncaa'};
  state.calendar = cal;
}

function init(){
  setupCalendar();
  const names = ['Alex','Jordan','Taylor','Parker','Casey','Morgan','Riley','Sam','Drew','Blake','Jamie','Cameron','Skyler','Quinn','Aiden','Owen','Lucas','Noah'];
  state.roster = Array.from({length:18}, (_,i)=> makeAthlete(names[i%names.length] + ' ' + (i+1)));
  // quick auto-distribute scholarships equally
  distributeScholarshipsEqual();
  renderAll();
}

function distributeScholarshipsEqual(){
  const pctPerAthlete = Math.floor(state.scholarshipsTotalPct / state.roster.length);
  state.roster.forEach(a=> a.scholarshipPct = pctPerAthlete);
}

function renderAll(){
  document.getElementById('coach-name').textContent = state.coachName;
  document.getElementById('program-name').textContent = state.programName;
  document.getElementById('season').textContent = state.season;
  document.getElementById('week').textContent = state.week;
  renderSnapshot();
  renderRoster();
  renderScholarshipUI();
  renderCareer();
  renderRankings();
  renderMeet();
}

function renderSnapshot(){
  const avgEnd = Math.round(state.roster.reduce((s,a)=>s+a.endurance,0)/state.roster.length);
  const totalScholarPct = state.roster.reduce((s,a)=>s+a.scholarshipPct,0);
  document.getElementById('snapshot').innerHTML = `<div>Roster: ${state.roster.length} | Avg Endurance: ${avgEnd} | Scholarships used: ${totalScholarPct}/${state.scholarshipsTotalPct}</div>`;
}

function renderRoster(){
  const tbody = document.querySelector('#roster-table tbody');
  tbody.innerHTML = '';
  state.roster.forEach(a=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.name}</td><td>Y${a.year}</td><td>${a.endurance}</td><td>${a.fatigue}</td><td>${a.potential}</td><td>${a.scholarshipPct}</td>
      <td><button data-id="${a.id}" class="train-btn">Train</button></td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.train-btn').forEach(b=>b.addEventListener('click', (e)=>{
    const id = e.target.dataset.id;
    const a = state.roster.find(r=>r.id===id);
    a.training.volume = (a.training.volume + 10) % 100;
    a.fatigue = Math.max(0, a.fatigue + 5);
    renderAll();
  }));
}

function renderScholarshipUI(){
  const wrap = document.getElementById('scholar-list');
  wrap.innerHTML = `<div>Pool: ${state.scholarshipsTotalPct} pct (12 scholarships = 1200)</div>`;
  state.roster.forEach(a=>{
    const div = document.createElement('div'); div.className='sch';
    div.innerHTML = `<strong>${a.name}</strong> — Scholarship %: <input type="number" min="0" max="100" data-id="${a.id}" value="${a.scholarshipPct}" style="width:66px"/> <button data-id="${a.id}" class="set-sch">Set</button>`;
    wrap.appendChild(div);
  });
  document.querySelectorAll('.set-sch').forEach(b=>b.addEventListener('click', (e)=>{
    const id = e.target.dataset.id;
    const input = document.querySelector('input[data-id="'+id+'"]');
    const val = Math.max(0, Math.min(100, parseInt(input.value)||0));
    const totalOther = state.roster.reduce((s,a)=> a.id===id ? s : s + a.scholarshipPct, 0);
    if(totalOther + val > state.scholarshipsTotalPct){ alert('Not enough scholarship pool for that value'); return; }
    state.roster.find(a=>a.id===id).scholarshipPct = val;
    renderAll();
  }));
  document.getElementById('auto-distribute').onclick = ()=>{ distributeScholarshipsEqual(); renderAll(); };
}

function renderCareer(){
  const wrap = document.getElementById('career-info');
  wrap.innerHTML = `<div>XP: ${state.xp} | RP: ${state.rp}</div>
    <div style="margin-top:8px;"><strong>Contract</strong></div>
    <div id="contract-block"></div>`;
  const cb = document.getElementById('contract-block');
  cb.innerHTML = `Years remaining: ${state.currentContract.yearsRemaining} / ${state.currentContract.totalYears} | Buyout: $${state.currentContract.buyout}
    <div style="margin-top:6px;"><button id="extend-contract">Offer 2-year extension (cost: $20k)</button></div>`;
  document.getElementById('extend-contract').onclick = ()=>{ extendContract(); renderAll(); };
  renderJobOffers();
}

function extendContract(){
  // extension possible if xp and reputation ok
  if(state.xp < 20){ alert('Not enough XP to justify extension'); return; }
  state.currentContract.totalYears += 2;
  state.currentContract.yearsRemaining += 2;
  state.currentContract.buyout += 15000;
  state.xp = Math.max(0, state.xp - 20);
  alert('Two-year extension signed.');
}

function generateJobOffers(){
  state.jobOffers = [];
  const rep = state.xp + (state.seasonLog.length>0 ? state.seasonLog.length*2 : 0);
  const offerCount = rep > 80 ? rand(1,3) : rep > 40 ? rand(0,2) : rand(0,1);
  for(let i=0;i<offerCount;i++){
    const tier = rep > 120 ? 'Power' : rep > 60 ? 'Mid' : 'Small';
    const school = tier==='Power' ? choice(['Northern State','Coastal Tech','Central State']) : tier==='Mid' ? choice(['Midland U','Riverbend College','State Poly']) : choice(['Smalltown College','Valley Institute']);
    const years = rand(4,6);
    const buyout = tier==='Power' ? rand(50000,120000) : tier==='Mid' ? rand(20000,60000) : rand(0,20000);
    state.jobOffers.push({id:'J'+i, school, tier, years, buyout, salary: tier==='Power'? rand(120000,200000): tier==='Mid'? rand(60000,110000): rand(35000,70000)});
  }
}

function renderJobOffers(){
  const wrap = document.getElementById('job-offers');
  wrap.innerHTML = '';
  if(state.jobOffers.length===0) wrap.innerHTML = '<div>No offers currently.</div>';
  state.jobOffers.forEach(o=>{
    const div = document.createElement('div'); div.className='job';
    div.innerHTML = `<strong>${o.school}</strong> — ${o.tier} | Years: ${o.years} | Salary: $${o.salary} | Buyout: $${o.buyout}
      <div style="margin-top:6px;"><button data-id="${o.id}" class="accept-offer">Accept</button> <button data-id="${o.id}" class="decline-offer">Decline</button></div>`;
    wrap.appendChild(div);
  });
  document.querySelectorAll('.accept-offer').forEach(b=>b.addEventListener('click', (e)=>{
    const o = state.jobOffers.find(j=>j.id===e.target.dataset.id);
    if(!o) return;
    // Accepting: check buyout of current contract
    if(state.currentContract.buyout > 0){
      if(!confirm(`Accepting will trigger your current buyout of $${state.currentContract.buyout}. Continue?`)) return;
    }
    // move to new job
    state.programName = o.school;
    state.currentContract = {yearsRemaining: o.years, totalYears:o.years, buyout: o.buyout};
    // adjust roster (lose some players) and xp cost
    state.roster = state.roster.slice(0,8);
    state.xp = Math.max(0, state.xp - 10);
    state.jobOffers = [];
    alert('Accepted position at ' + o.school);
    renderAll();
  }));
  document.querySelectorAll('.decline-offer').forEach(b=>b.addEventListener('click', (e)=>{
    const o = state.jobOffers.find(j=>j.id===e.target.dataset.id);
    state.jobOffers = state.jobOffers.filter(x=>x.id!==o.id);
    renderAll();
  }));
}

function renderRankings(){
  // compute season ranking points: sum of meet points + quality wins
  const teamPoints = computeRankingPoints();
  document.getElementById('ranking-summary').innerHTML = `<div>Season Score (ranking): ${teamPoints.toFixed(1)}</div>`;
  // at-large projection using hybrid:
  // - if conference champion auto-qualifies.
  // - region auto-q top 2 (simplified): if teamPoints > threshold by region.
  const projection = computeAtLargeProjection(teamPoints);
  document.getElementById('atlarge-projection').innerHTML = `<div>Projection: ${projection.message}</div><div>Estimated chance: ${Math.round(projection.chance*100)}%</div>`;
}

function computeRankingPoints(){
  // base from seasonLog results: better (lower) teamScore -> more points
  let pts = 0;
  state.seasonLog.forEach(e=>{
    // invite: lower score yields more points; normalize - smaller is better
    pts += Math.max(0, 200 - e.teamScore); // invites and midseason
    // quality wins bonus
    if(e.qualityBonus) pts += e.qualityBonus;
  });
  // also include roster potential depth
  const depth = Math.round(state.roster.reduce((s,a)=>s+a.potential,0)/state.roster.length);
  pts += (depth - 60) * 2;
  // include XP as reputation factor
  pts += state.xp * 0.5;
  state.rankScore = pts;
  state.rankingsHistory.push({season: state.season, score: pts});
  return pts;
}

function computeAtLargeProjection(teamPoints){
  // Hybrid model:
  // - If conference champion: auto-qualify
  // - Regionals: if average region score threshold
  // - At-large: compare teamPoints to percentile thresholds
  const confWin = state.seasonLog.some(e=> e.outcome && e.outcome.includes('Conference Champion'));
  if(confWin) return {message:'Conference Champion — Auto-qualified', chance:1.0};
  // region check: if teamPoints > 160 -> likely regional qualifier
  if(teamPoints > 160) return {message:'Strong — likely to qualify regionally', chance:0.8};
  // at-large threshold: compute relative to synthetic field
  const syntheticScores = Array.from({length:30}, ()=> rand(80,260));
  syntheticScores.sort((a,b)=>b-a);
  const rank = syntheticScores.findIndex(s=> teamPoints >= s) + 1;
  const position = rank > 0 ? rank : syntheticScores.length + 1;
  // if teamPoints in top 13 of field => high chance at-large
  const topCount = syntheticScores.filter(s=> s <= teamPoints).length;
  const chance = Math.min(0.95, Math.max(0.05, topCount / syntheticScores.length));
  const msg = teamPoints >= syntheticScores[12] ? 'At-large likely (top season scores)' : 'At-large uncertain — improve quality wins';
  return {message: msg, chance};
}

function renderMeet(){
  const meet = currentMeet();
  document.getElementById('meet-info').innerHTML = meet ? `<strong>${meet.name} — ${meet.type}</strong>` : '<em>No meet this week</em>';
  const lu = document.getElementById('lineup');
  lu.innerHTML = '';
  document.getElementById('meet-result').innerHTML = '';
  if(!meet) return;
  lu.innerHTML = '<div><strong>Select 7 runners (click to toggle)</strong></div><div id="line-list" style="margin-top:8px"></div>';
  const list = document.getElementById('line-list');
  state.roster.slice(0,18).forEach(a=>{
    const btn = document.createElement('button');
    btn.textContent = `${a.name} E:${a.endurance} F:${a.fatigue}`;
    btn.className = 'nav-btn';
    btn.dataset.id = a.id;
    btn.onclick = ()=> btn.classList.toggle('selected');
    list.appendChild(btn);
  });
}

function simulateMeet(){
  const meet = currentMeet();
  if(!meet){ alert('No meet this week.'); return; }
  const selected = Array.from(document.querySelectorAll('#line-list button.selected')).map(b=>b.dataset.id);
  if(selected.length !== 7){ alert('Select exactly 7 runners.'); return; }
  const lineup = selected.map(id=> state.roster.find(r=>r.id===id));
  const performances = lineup.map(a=>{
    const base = a.endurance*0.6 + a.speed*0.25 + a.mental*0.15 + (a.scholarshipPct/8);
    const fatiguePenalty = a.fatigue * 0.6;
    const rng = (Math.random()*20 - 10);
    const perf = base - fatiguePenalty + rng - (a.potential/40);
    return {name:a.name, perf, athlete:a};
  }).sort((x,y)=>y.perf - x.perf);
  // create field
  const field = [];
  for(let t=0;t<19;t++){
    const teamStrength = rand(60,95);
    for(let r=0;r<7;r++){
      field.push({name:`T${t}R${r}`, perf: teamStrength + Math.random()*12 - 6});
    }
  }
  performances.forEach(p=> field.push({name:p.name, perf:p.perf}));
  field.sort((a,b)=>b.perf - a.perf);
  const places = {}; field.forEach((entry, idx)=> places[entry.name] = idx+1);
  const ourPlaces = lineup.map(l=>places[l.name]).sort((a,b)=>a-b).slice(0,5);
  const teamScore = ourPlaces.reduce((s,v)=>s+v,0);

  // quality wins: if a runner beats an opponent runner with perf > 85, count as quality
  let qualityBonus = 0;
  performances.forEach(p=>{
    const beaten = field.filter(f=> f.name.startsWith('T') && f.perf < p.perf && f.perf > 85);
    qualityBonus += beaten.length * 0.5;
    // increment athlete qualityWins
    p.athlete.qualityWins += beaten.length > 0 ? 1 : 0;
  });

  // outcome rules simplified
  let outcome = 'Loss';
  let win = false;
  if(meet.type === 'invite'){ win = teamScore <= 150; outcome = win ? 'Win (Invite)' : 'Loss (Invite)'; }
  else if(meet.type === 'conference'){
    const confScores = Array.from({length:15}, ()=> rand(100,220)).sort((a,b)=>a-b);
    if(teamScore < confScores[0]){ win = true; outcome = 'Conference Champion'; }
    else outcome = `Conference result (score ${teamScore})`;
  } else if(meet.type === 'regionals'){
    // regionals: top 2 auto-qualify; we simulate by threshold
    if(teamScore <= 130){ outcome = 'Regionals — Qualified for NCAA'; win = true; }
    else outcome = 'Regionals — Missed';
  } else if(meet.type === 'ncaa'){
    const placement = rand(1,40);
    outcome = `NCAA Championships — place ${placement}`;
    if(placement <= 8) state.xp += 50;
  }

  state.seasonLog.push({week: state.week, meet: meet.name, teamScore, outcome, qualityBonus});
  // xp and rp
  state.xp += win ? 6 : 2;
  state.rp += Math.max(0, Math.floor(qualityBonus));
  // fatigue/stats
  lineup.forEach(a=>{ a.fatigue = Math.min(100, a.fatigue + rand(6,14)); a.endurance = Math.min(99, a.endurance + rand(0,2)); });

  // advance week
  state.week = Math.min(12, state.week+1);
  renderAll();
  document.getElementById('meet-result').innerHTML = `<h3>${meet.name} — ${outcome}</h3><div>Team score: ${teamScore}</div><div>Quality bonus: ${qualityBonus.toFixed(1)}</div>`;
  // After conference/regionals, generate job offers / postseason decisions
  if(meet.type === 'conference' || meet.type === 'regionals' || meet.type === 'ncaa'){
    generateJobOffers();
  }
}

function currentMeet(){ return state.calendar[state.week] || null; }

function advanceWeek(){
  const meet = currentMeet();
  if(meet && !confirm('This week has a scheduled meet. Advance anyway? You will skip the meet.')) return;
  // weekly training
  state.roster.forEach(a=>{
    const vol = a.training.volume/100, int = a.training.intensity/100, rec = a.training.recovery/100;
    const gain = Math.round((vol*0.5 + int*0.3 + rec*0.2) * (a.potential/500));
    a.endurance = Math.min(99, a.endurance + gain);
    a.fatigue = Math.max(0, a.fatigue - Math.round(rec*3));
    if(Math.random() < 0.02 && a.fatigue > 75) a.fatigue += 8;
  });
  state.rp += 1;
  state.week = Math.min(12, state.week+1);
  renderAll();
}

function autoSimToNextMeet(){
  while(state.week <= 12 && !currentMeet()){
    state.roster.forEach(a=>{
      const vol = a.training.volume/100, int = a.training.intensity/100, rec = a.training.recovery/100;
      const gain = Math.round((vol*0.5 + int*0.3 + rec*0.2) * (a.potential/500));
      a.endurance = Math.min(99, a.endurance + gain);
      a.fatigue = Math.max(0, a.fatigue - Math.round(rec*3));
    });
    state.week++;
  }
  renderAll();
}

function generateJobOffers(){
  // generate offers based on reputation and contract years remaining
  const rep = Math.round((state.xp + (state.seasonLog.length*2) + state.rankScore)/1.5);
  const offers = [];
  const count = rep > 120 ? rand(1,3) : rep > 60 ? rand(0,2) : rand(0,1);
  for(let i=0;i<count;i++){
    const tier = rep > 120 ? 'Power' : rep > 60 ? 'Mid' : 'Small';
    const school = tier==='Power' ? choice(['Northern State','Coastal Tech','Central State']) : tier==='Mid' ? choice(['Midland U','Riverbend College','State Poly']) : choice(['Smalltown College','Valley Institute']);
    const years = rand(4,6);
    const buyout = tier==='Power' ? rand(50000,120000) : tier==='Mid' ? rand(20000,60000) : rand(0,20000);
    const salary = tier==='Power' ? rand(120000,200000) : tier==='Mid' ? rand(60000,110000) : rand(35000,70000);
    offers.push({id:'J'+i, school, tier, years, buyout, salary});
  }
  state.jobOffers = offers;
  renderJobOffers();
}

function renderJobOffers(){
  const wrap = document.getElementById('job-offers');
  wrap.innerHTML = '';
  if(state.jobOffers.length===0) wrap.innerHTML = '<div>No job offers at this time.</div>';
  state.jobOffers.forEach(o=>{
    const div = document.createElement('div'); div.className='job';
    div.innerHTML = `<strong>${o.school}</strong> — ${o.tier} | Years: ${o.years} | Salary: $${o.salary} | Buyout: $${o.buyout}
      <div style="margin-top:6px;"><button data-id="${o.id}" class="accept-offer">Accept</button> <button data-id="${o.id}" class="decline-offer">Decline</button></div>`;
    wrap.appendChild(div);
  });
  document.querySelectorAll('.accept-offer').forEach(b=>b.addEventListener('click', (e)=>{
    const o = state.jobOffers.find(j=>j.id===e.target.dataset.id);
    if(!o) return;
    if(state.currentContract.buyout > 0){
      if(!confirm(`Accepting will trigger your buyout of $${state.currentContract.buyout}. Continue?`)) return;
    }
    state.programName = o.school;
    state.currentContract = {yearsRemaining:o.years, totalYears:o.years, buyout:o.buyout};
    state.roster = state.roster.slice(0,8);
    state.xp = Math.max(0, state.xp - 10);
    state.jobOffers = [];
    alert('Accepted job at ' + o.school);
    renderAll();
  }));
  document.querySelectorAll('.decline-offer').forEach(b=>b.addEventListener('click', (e)=>{
    const o = state.jobOffers.find(j=>j.id===e.target.dataset.id);
    state.jobOffers = state.jobOffers.filter(x=>x.id!==o.id);
    renderAll();
  }));
}

function computeRankingPoints(){
  let pts = 0;
  state.seasonLog.forEach(e=>{
    pts += Math.max(0, 200 - e.teamScore);
    pts += e.qualityBonus ? e.qualityBonus : 0;
  });
  const depth = Math.round(state.roster.reduce((s,a)=>s+a.potential,0)/state.roster.length);
  pts += (depth - 60) * 2;
  pts += state.xp * 0.5;
  state.rankScore = pts;
  state.rankingsHistory.push({season: state.season, score: pts});
  return pts;
}

function computeAtLargeProjection(){
  const pts = computeRankingPoints();
  // hybrid logic
  const confWin = state.seasonLog.some(e=> e.outcome && e.outcome.includes('Conference Champion'));
  if(confWin) return {message:'Auto-qualified (Conference Champion)', chance:1.0};
  if(pts > 180) return {message:'Very strong season — high chance for at-large', chance:0.9};
  if(pts > 150) return {message:'Good season — moderate chance for at-large', chance:0.6};
  if(pts > 120) return {message:'Borderline — needs quality wins', chance:0.35};
  return {message:'Unlikely without improved results', chance:0.1};
}

function renderRankings(){
  const wrap = document.getElementById('ranking-summary');
  const pts = computeRankingPoints();
  wrap.innerHTML = `<div>Ranking score: ${pts.toFixed(1)}</div>`;
  const proj = computeAtLargeProjection();
  document.getElementById('atlarge-projection').innerHTML = `<div>${proj.message} (Chance: ${Math.round(proj.chance*100)}%)</div>`;
}

function saveGame(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    alert('Game saved.');
  }catch(e){ alert('Save failed: ' + e.message); }
}

function loadGame(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw){ alert('No save found.'); return; }
    state = JSON.parse(raw);
    renderAll();
    alert('Game loaded.');
  }catch(e){ alert('Load failed: ' + e.message); }
}

// UI wiring
document.getElementById('btn-dashboard').addEventListener('click', ()=>showView('dashboard'));
document.getElementById('btn-roster').addEventListener('click', ()=>showView('roster'));
document.getElementById('btn-scholarships').addEventListener('click', ()=>showView('scholarships'));
document.getElementById('btn-career').addEventListener('click', ()=>showView('career'));
document.getElementById('btn-rankings').addEventListener('click', ()=>showView('rankings'));
document.getElementById('btn-meet').addEventListener('click', ()=>showView('meet'));

document.getElementById('advance-week').addEventListener('click', ()=>{ advanceWeek(); });
document.getElementById('autosim').addEventListener('click', ()=>{ autoSimToNextMeet(); });
document.getElementById('simulate-meet').addEventListener('click', ()=>{ simulateMeet(); });
document.getElementById('auto-distribute').addEventListener('click', ()=>{ distributeScholarshipsEqual(); renderAll(); });

// bootstrap
init();
