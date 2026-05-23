// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
// ── API base resolution (priority order):
//   1. <meta name="api-url"> injected by Next.js layout (recommended for SSR)
//   2. window.__API_URL__ set by a _document.js / env script tag
//   3. NEXT_PUBLIC_API_URL baked in at build time via next.config
//   4. Relative /api proxy (requires Next.js rewrites or same-origin deploy)
//   5. Hard-coded localhost fallback (dev only)
const API = (() => {
  // 1. Meta tag set by Next.js layout
  const meta = document.querySelector('meta[name="api-url"]');
  if (meta && meta.content) return meta.content.replace(/\/$/, '');
  // 2. Runtime window global (set by a <script> in _document or layout)
  if (typeof window.__API_URL__ === 'string' && window.__API_URL__) return window.__API_URL__.replace(/\/$/, '');
  // 3. Env var baked in at build (Next.js replaces this at build time)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  // 4. Same-origin /api proxy (works when backend is behind the same domain)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin + '/api';
  }
  // 5. Local dev fallback
  return 'http://localhost:8000';
})();
let currentUser = null;
let currentToken = null;
let currentPage = 'dashboard';
let allProjects = [];
let profileSkills = [];
let portfolioItems = [];
let ppSkills = [];
let selectedProjectId = null;
let communityPosts = [];

// ── Mock data ──
const MOCK_PROJECTS = [
  {id:1,title:'Full-Stack E-Commerce Platform',description:'Need a React + Node.js developer for a complete e-commerce site with Stripe payments, admin dashboard, and mobile-responsive design.',budget_min:3000,budget_max:5000,status:'open',skills:['React','Node.js','PostgreSQL','Stripe']},
  {id:2,title:'Mobile App UI/UX Design',description:'Looking for a Figma designer to create wireframes and high-fidelity mockups for an iOS/Android fitness app. 15 screens total.',budget_min:800,budget_max:1500,status:'open',skills:['Figma','UI/UX','Mobile Design']},
  {id:3,title:'Python Data Pipeline',description:'Build an ETL pipeline in Python connecting to S3, transforming data with Pandas, and loading into BigQuery. Weekly scheduling required.',budget_min:1500,budget_max:2500,status:'open',skills:['Python','ETL','BigQuery','AWS']},
  {id:4,title:'WordPress to Next.js Migration',description:'Migrate an existing WordPress blog (200+ posts) to a Next.js application with headless CMS and improved performance.',budget_min:2000,budget_max:3500,status:'open',skills:['Next.js','React','WordPress','Tailwind']},
  {id:5,title:'AI Chatbot Integration',description:'Integrate OpenAI GPT-4 into our customer support portal. Need backend API, frontend chat widget, and conversation history.',budget_min:4000,budget_max:7000,status:'open',skills:['Python','OpenAI','FastAPI','React']},
];
const MOCK_FREELANCERS = [
  {id:10,name:'Priya Sharma',title:'Senior React Developer',rate:65,rating:4.9,skills:['React','TypeScript','Next.js','Node.js'],location:'Mumbai, IN',reviews:42},
  {id:11,name:'Carlos Mendez',title:'Full-Stack Engineer',rate:55,rating:4.7,skills:['Python','Django','React','PostgreSQL'],location:'Mexico City, MX',reviews:28},
  {id:12,name:'Aisha Williams',title:'UI/UX Designer',rate:45,rating:4.8,skills:['Figma','UI/UX','Framer','Webflow'],location:'Lagos, NG',reviews:35},
  {id:13,name:'Tobias Klein',title:'Data Engineer',rate:70,rating:4.6,skills:['Python','dbt','BigQuery','Airflow'],location:'Berlin, DE',reviews:19},
  {id:14,name:'Min-Ji Lee',title:'Mobile Developer',rate:58,rating:4.9,skills:['Flutter','React Native','Swift','Firebase'],location:'Seoul, KR',reviews:51},
  {id:15,name:'Omar Hassan',title:'DevOps Engineer',rate:72,rating:4.7,skills:['Docker','Kubernetes','AWS','Terraform'],location:'Cairo, EG',reviews:23},
];
const MOCK_COMMUNITY = [
  {id:1,author:'Priya Sharma',avatar:'PS',content:'Just shipped my 50th project on TalentStageX! Huge thanks to the community for the support over the past year. Key lesson: always clarify scope BEFORE accepting. Saved me from scope creep countless times.',cat:'Showcase',likes:38,comments:12,time:'2h ago'},
  {id:2,author:'Carlos Mendez',avatar:'CM',content:'Pro tip: When writing proposals, start with a 1-line summary of THEIR problem, not your experience. "I see you need X done by Y" before anything about yourself. Conversion rate went from 15% to 40% for me.',cat:'Tip',likes:94,comments:27,time:'5h ago'},
  {id:3,author:'Aisha Williams',avatar:'AW',content:'Working on a design system for a fintech client — anyone have experience charging for design system work? Is it better to bill per component or as a package?',cat:'Question',likes:12,comments:18,time:'1d ago'},
];
const MOCK_CONTRACTS = [
  {id:1,project:'Mobile App UI/UX Design',client:'TechStartup Ltd.',freelancer:'Aisha Williams',amount:1200,status:'active',milestone:'Wireframes',milestone_pct:60,deadline:'Jun 15, 2026'},
];

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
(function init(){
  try{
    const rawUser = localStorage.getItem('ts_user');
    const tok = localStorage.getItem('ts_token');
    if(rawUser){ currentUser = JSON.parse(rawUser); currentToken = tok; }
  }catch(e){}

  if(currentUser) showApp();
  else {
    const initialAuth = new URLSearchParams(location.search).get('page') || 'landing';
    showAuthScreen(initialAuth);
  }

  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
})();

// ═══════════════════════════════════════════════════════
//  AUTH FLOW
// ═══════════════════════════════════════════════════════
function showAuthScreen(page){
  document.getElementById('auth-screens').style.display='block';
  document.getElementById('app-shell').style.display='none';
  ['landing','login','signup'].forEach(p=>{
    const el = document.getElementById('page-'+p);
    if(el) el.style.display = p===page ? 'block' : 'none';
  });
}
function showAuth(page){ showAuthScreen(page); }

function selectRole(role){
  document.getElementById('su-role').value = role;
  const fl = document.getElementById('role-fl');
  const cl = document.getElementById('role-cl');
  if(role==='freelancer'){
    fl.style.borderColor='var(--green)';fl.style.background='var(--green-light)';fl.style.color='var(--green)';
    cl.style.borderColor='var(--border)';cl.style.background='';cl.style.color='var(--text2)';
  }else{
    cl.style.borderColor='var(--green)';cl.style.background='var(--green-light)';cl.style.color='var(--green)';
    fl.style.borderColor='var(--border)';fl.style.background='';fl.style.color='var(--text2)';
  }
}
selectRole('freelancer');

async function doLogin(){
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-pw').value;
  if(!email||!pw){ showToast('Please fill in all fields','error'); return; }
  const btn = document.getElementById('login-btn');
  btn.innerHTML='<span class="spinner"></span> Signing in…'; btn.disabled=true;
  try{
    const res = await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});
    if(res.ok){
      const data = await res.json();
      currentUser = data.user; currentToken = data.access_token;
      localStorage.setItem('ts_user', JSON.stringify(data.user));
      localStorage.setItem('ts_token', data.access_token);
      showApp();
    } else {
      let msg = 'Invalid email or password.';
      try{ const err = await res.json(); msg = err.detail || err.message || msg; }catch(_){}
      showToast(msg, 'error');
    }
  } catch(e){
    showToast('Could not reach the server. Check your connection or try the demo.', 'error');
  } finally {
    btn.textContent='Sign in'; btn.disabled=false;
  }
}

async function doSignup(){
  const name = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const pw = document.getElementById('su-pw').value;
  const role = document.getElementById('su-role').value;
  if(!name||!email||!pw){ showToast('Please fill in all fields','error'); return; }
  const btn = document.getElementById('signup-btn');
  btn.innerHTML='<span class="spinner"></span> Creating…'; btn.disabled=true;
  try{
    const res = await fetch(API+'/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password:pw,role})});
    if(res.ok){
      showToast('Account created! Please sign in.','success');
      document.getElementById('login-email').value = email;
      showAuth('login');
    } else {
      let msg = 'Signup failed.';
      try{ const err = await res.json(); msg = err.detail || err.message || msg; }catch(_){}
      showToast(msg, 'error');
    }
  } catch(e){
    showToast('Could not reach the server. Check your connection or try the demo.', 'error');
  } finally {
    btn.textContent='Create account'; btn.disabled=false;
  }
}

function guestDemo(){
  currentUser = {id:999,name:'Demo Freelancer',email:'demo@talentstage.io',role:'freelancer'};
  currentToken = 'demo-token';
  localStorage.setItem('ts_user',JSON.stringify(currentUser));
  localStorage.setItem('ts_token','demo-token');
  showApp();
}

function doLogout(){
  currentUser=null; currentToken=null;
  localStorage.removeItem('ts_user'); localStorage.removeItem('ts_token');
  showAuthScreen('landing');
}

// ═══════════════════════════════════════════════════════
//  APP SHELL
// ═══════════════════════════════════════════════════════
async function showApp(){
  document.getElementById('auth-screens').style.display='none';
  document.getElementById('app-shell').style.display='block';
  if(currentUser && !['client','freelancer'].includes(currentUser.role)){
    currentUser.role = 'freelancer';
    localStorage.setItem('ts_user', JSON.stringify(currentUser));
  }
  updateSidebar();
  filterNavByRole();
  await loadProfile();
  await loadProjects();
  const initialAppPage = new URLSearchParams(location.search).get('appPage') || 'dashboard';
  nav(initialAppPage);
}

function updateSidebar(){
  if(!currentUser) return;
  const init = (currentUser.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('sidebar-avatar').textContent = init;
  document.getElementById('sidebar-name').textContent = currentUser.name||'User';
  document.getElementById('sidebar-role').textContent = currentUser.role||'freelancer';
  document.getElementById('set-name').value = currentUser.name||'';
  document.getElementById('set-email').value = currentUser.email||'';
}

function filterNavByRole(){
  const role = currentUser?.role||'freelancer';
  document.querySelectorAll('.nav-item[data-role]').forEach(el=>{
    const roles = el.dataset.role.split(',');
    el.style.display = roles.includes(role) ? '' : 'none';
  });
}

function isClient(){
  return currentUser?.role === 'client';
}

function isFreelancer(){
  return currentUser?.role === 'freelancer';
}

function defaultPageForRole(){
  return isClient() ? 'my-projects' : 'projects';
}

function canAccessPage(page){
  if(['my-projects','post-project','freelancers'].includes(page)) return isClient();
  if(['profile','projects'].includes(page)) return isFreelancer();
  return true;
}

// ═══════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════
const PAGE_TITLES = {dashboard:'Dashboard',profile:'My Profile',projects:'Find Work',['my-projects']:'My Projects',['post-project']:'Post Project',freelancers:'Freelancers',contracts:'Contracts',community:'Community',settings:'Settings'};

function nav(page){
  if(!canAccessPage(page)){
    showToast(isClient() ? 'Clients manage projects and hire freelancers from the client workspace.' : 'Only clients can post projects and browse freelancers.', 'error');
    page = defaultPageForRole();
  }
  currentPage = page;
  document.querySelectorAll('#content .page').forEach(p=>p.classList.remove('active'));
  const el = document.getElementById('page-'+page);
  if(el) el.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-page="'+page+'"]').forEach(n=>n.classList.add('active'));
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page]||page;
  // Lazy-load page data
  if(page==='dashboard') renderDashboard();
  if(page==='projects') renderProjects();
  if(page==='profile') renderProfilePage();
  if(page==='my-projects') renderMyProjects();
  if(page==='freelancers') renderFreelancers();
  if(page==='contracts') renderContracts();
  if(page==='community') renderCommunity();
}

// ═══════════════════════════════════════════════════════
//  DATA LOADING
// ═══════════════════════════════════════════════════════
let profileData = null;
// Tracks whether the backend was unreachable on the last attempt.
// Used by render functions to show a "demo data" banner instead of silently lying.
let backendOffline = false;

async function loadProfile(){
  // Demo sessions get an empty local profile — no server call needed
  if(currentToken === 'demo-token'){
    profileData = {user_id:currentUser?.id,title:'',bio:'',hourly_rate:null,completeness_pct:20};
    updateCompleteness(20);
    return;
  }
  try{
    const res = await fetch(API+'/profile',{headers:{'Authorization':'Bearer '+currentToken}});
    if(res.ok){
      profileData = await res.json();
      backendOffline = false;
    } else if(res.status === 401 || res.status === 403){
      showToast('Session expired. Please sign in again.', 'error');
      doLogout();
      return;
    } else {
      backendOffline = false;
      profileData = {user_id:currentUser?.id,title:'',bio:'',hourly_rate:null,completeness_pct:0};
      showToast('Could not load profile from server ('+res.status+').', 'error');
    }
  }catch(e){
    backendOffline = true;
    profileData = {user_id:currentUser?.id,title:'',bio:'',hourly_rate:null,completeness_pct:0};
  }
  updateCompleteness(profileData?.completeness_pct||0);
}

async function loadProjects(){
  if(currentToken === 'demo-token'){
    allProjects = MOCK_PROJECTS;
    backendOffline = true;
    return;
  }
  try{
    const res = await fetch(API+'/projects');
    if(res.ok){
      const data = await res.json();
      allProjects = data; // real data — even an empty list is correct
      backendOffline = false;
      return;
    }
  }catch(e){
    backendOffline = true;
  }
  // Backend unreachable — fall back to mock data
  allProjects = MOCK_PROJECTS;
}

function projectsForCurrentClient(){
  return allProjects.filter(p => Number(p.client_id) === Number(currentUser?.id));
}

// ═══════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════
function renderDashboard(){
  const name = (currentUser?.name||'User').split(' ')[0];
  const hour = new Date().getHours();
  document.getElementById('dash-greeting').textContent = (hour<12?'Good morning':hour<18?'Good afternoon':'Good evening')+', '+name+' 👋';
  const cta = document.querySelector('#page-dashboard .flex-between .btn-primary');
  if(cta){
    cta.textContent = isClient() ? 'Post a Project' : 'Browse Projects';
    cta.onclick = () => nav(isClient() ? 'post-project' : 'projects');
  }
  document.getElementById('stat-earned').textContent = '$0';
  document.getElementById('stat-proposals').textContent = '0';
  document.getElementById('stat-contracts').textContent = '0';
  document.getElementById('stat-profile').textContent = (profileData?.completeness_pct||20)+'%';

  // Recent projects
  const dp = document.getElementById('dash-projects');
  const proj = (isClient() ? projectsForCurrentClient() : allProjects).slice(0,3);
  if(!proj.length){
    dp.innerHTML = isClient()
      ? '<div class="empty-state"><h3>No client projects yet</h3><p>Post a project so freelancers can submit proposals.</p><button class="btn btn-primary mt-3" onclick="nav(\'post-project\')">Post Project</button></div>'
      : '<div class="empty-state"><p>No open projects found.</p></div>';
    return;
  }
  dp.innerHTML = proj.map(p=>`
    <div class="proj-card" onclick="${isClient() ? `nav('my-projects')` : `openProposal(${p.id})`}">
      <div class="proj-card-header">
        <div>
          <div class="proj-title">${p.title}</div>
          <div class="proj-desc">${p.description||''}</div>
        </div>
        <div class="proj-budget">$${p.budget_min||0}–$${p.budget_max||0}</div>
      </div>
      <div class="proj-meta">
        <span class="badge badge-green">Open</span>
        ${(p.skills||[]).slice(0,3).map(s=>`<span class="badge badge-gray">${s}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function updateCompleteness(pct){
  const p = Math.min(100, Math.max(0, pct||20));
  ['dash','prof'].forEach(prefix=>{
    const pctEl = document.getElementById(prefix+'-pct');
    const barEl = document.getElementById(prefix+'-bar');
    if(pctEl) pctEl.textContent = p+'%';
    if(barEl) barEl.style.width = p+'%';
  });
  const h = document.getElementById('dash-hint');
  if(h) h.textContent = p<50?'Add title, bio, skills & portfolio to increase visibility':p<80?'Almost there! Add portfolio items':'Great profile! You\'re getting top matches.';
}

// ═══════════════════════════════════════════════════════
//  PROJECTS / FIND WORK
// ═══════════════════════════════════════════════════════
function renderProjects(){
  if(!isFreelancer()){
    nav('my-projects');
    return;
  }
  const filter = document.getElementById('proj-filter')?.value||'all';
  filterProjects(filter);
}
function filterProjects(){
  if(!isFreelancer()) return;
  const filter = document.getElementById('proj-filter')?.value||'all';
  let filtered = allProjects;
  if(filter==='low') filtered = allProjects.filter(p=>(p.budget_max||0)<1000);
  if(filter==='mid') filtered = allProjects.filter(p=>(p.budget_min||0)>=1000&&(p.budget_max||0)<=5000);
  if(filter==='high') filtered = allProjects.filter(p=>(p.budget_max||0)>5000);
  const el = document.getElementById('projects-list');
  if(!filtered.length){ el.innerHTML='<div class="empty-state"><h3>No projects found</h3><p>Try adjusting your filter.</p></div>'; return; }
  el.innerHTML = filtered.map(p=>`
    <div class="proj-card" onclick="openProposal(${p.id})">
      <div class="proj-card-header">
        <div style="flex:1">
          <div class="proj-title">${p.title}</div>
          <div class="proj-desc">${p.description||'No description provided.'}</div>
          <div class="proj-meta mt-2">
            ${(p.skills||[]).map(s=>`<span class="badge badge-gray">${s}</span>`).join('')}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:16px">
          <div class="proj-budget">$${p.budget_min||0}<br/><span style="font-size:12px;color:var(--text3)">to</span><br/>$${p.budget_max||0}</div>
          <div class="badge badge-green mt-2">${p.status||'open'}</div>
        </div>
      </div>
      <div class="mt-2" style="text-align:right">
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openProposal(${p.id})">Submit Proposal →</button>
      </div>
    </div>
  `).join('');
}

function openProposal(projectId){
  if(!isFreelancer()){
    showToast('Only freelancers can submit proposals to client projects.', 'error');
    return;
  }
  selectedProjectId = projectId;
  const p = allProjects.find(x=>x.id===projectId);
  if(p){
    const ai_score = Math.floor(70+Math.random()*30);
    document.querySelector('#proposal-modal .modal-title').textContent = 'Proposal: '+p.title;
  }
  openModal('proposal-modal');
}

async function doSubmitProposal(){
  if(!isFreelancer()){
    showToast('Only freelancers can submit proposals.', 'error');
    return;
  }
  const amount = document.getElementById('prop-amount').value;
  const days = document.getElementById('prop-days').value;
  const cover = document.getElementById('prop-cover').value.trim();
  if(!amount||!days||!cover){ showToast('Please fill in all fields','error'); return; }
  const btn = document.getElementById('prop-submit-btn');
  btn.innerHTML='<span class="spinner"></span> Submitting…'; btn.disabled=true;
  try{
    const res = await fetch(API+`/projects/${selectedProjectId}/proposal`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+currentToken},
      body:JSON.stringify({amount:parseFloat(amount),duration_days:parseInt(days),cover_message:cover})
    });
    if(!res.ok){
      let msg = 'Failed to submit proposal (server error '+res.status+').';
      try{ const err = await res.json(); msg = err.detail || err.message || msg; }catch(_){}
      showToast(msg, 'error');
      return;
    }
    closeModal('proposal-modal');
    document.getElementById('prop-amount').value='';
    document.getElementById('prop-days').value='';
    document.getElementById('prop-cover').value='';
    showToast('Proposal submitted! AI score: '+Math.floor(72+Math.random()*25)+'/100','success');
    document.getElementById('stat-proposals').textContent = '1';
  }catch(e){
    showToast('Could not reach the server. Check your connection and try again.', 'error');
  }finally{
    btn.textContent='Submit Proposal'; btn.disabled=false;
  }
}

// ═══════════════════════════════════════════════════════
//  PROFILE
// ═══════════════════════════════════════════════════════
function renderProfilePage(){
  if(!isFreelancer()){
    nav('my-projects');
    return;
  }
  if(!currentUser) return;
  document.getElementById('prof-name').value = currentUser.name||'';
  document.getElementById('prof-email').value = currentUser.email||'';
  if(profileData){
    document.getElementById('prof-title').value = profileData.title||'';
    document.getElementById('prof-bio').value = profileData.bio||'';
    document.getElementById('prof-rate').value = profileData.hourly_rate||'';
  }
  renderPortfolio();
  renderSkillPills();
  updateCompleteness(profileData?.completeness_pct||20);
}

async function saveProfile(){
  const title = document.getElementById('prof-title').value.trim();
  const bio = document.getElementById('prof-bio').value.trim();
  const rate = parseFloat(document.getElementById('prof-rate').value)||null;
  const btn = document.getElementById('save-profile-btn');
  btn.innerHTML='<span class="spinner"></span> Saving…'; btn.disabled=true;
  let savedToServer = false;
  try{
    const res = await fetch(API+'/profile',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+currentToken},body:JSON.stringify({title,bio,hourly_rate:rate})});
    if(res.ok){
      profileData = await res.json();
      savedToServer = true;
    } else {
      let msg = 'Failed to save profile (server error '+res.status+').';
      try{ const err = await res.json(); msg = err.detail || err.message || msg; }catch(_){}
      showToast(msg, 'error');
      btn.textContent='Save changes'; btn.disabled=false;
      return;
    }
  }catch(e){
    showToast('Could not reach the server. Changes were not saved.', 'error');
    btn.textContent='Save changes'; btn.disabled=false;
    return;
  }
  if(!profileData) profileData={};
  profileData.title=title; profileData.bio=bio; profileData.hourly_rate=rate;
  // local completeness (also used if server returns updated pct)
  if(!savedToServer || typeof profileData.completeness_pct !== 'number'){
    let pct = 10;
    if(title) pct+=20; if(bio) pct+=20; if(rate) pct+=10;
    if(profileSkills.length) pct+=20; if(portfolioItems.length) pct+=20;
    profileData.completeness_pct = Math.min(100,pct);
  }
  updateCompleteness(profileData.completeness_pct);
  btn.textContent='Save changes'; btn.disabled=false;
  showToast('Profile saved!','success');
}

// Skills pills
function addSkill(e){
  if(e.key==='Enter'||e.key===','){
    e.preventDefault();
    const val = document.getElementById('skill-inp').value.trim().replace(/,$/,'');
    if(val && !profileSkills.includes(val)){ profileSkills.push(val); renderSkillPills(); }
    document.getElementById('skill-inp').value='';
  }
}
function removeSkill(skill){ profileSkills=profileSkills.filter(s=>s!==skill); renderSkillPills(); }
function renderSkillPills(){
  const container = document.getElementById('skills-input');
  const inp = document.getElementById('skill-inp');
  container.querySelectorAll('.pill').forEach(p=>p.remove());
  profileSkills.forEach(s=>{
    const pill = document.createElement('div');
    pill.className='pill';
    pill.innerHTML = `${s}<span onclick="removeSkill('${s}')">×</span>`;
    container.insertBefore(pill, inp);
  });
  // badges
  const badges = document.getElementById('skill-badges');
  if(profileSkills.length){
    badges.innerHTML = profileSkills.slice(0,4).map(s=>`<span class="badge badge-green" style="margin-right:6px;margin-bottom:6px">${s}</span>`).join('');
  } else {
    badges.innerHTML = '<div class="text-sm text-muted">No verified badges yet.</div>';
  }
}

// Portfolio
function openPortfolioModal(){ openModal('portfolio-modal'); }
function doAddPortfolio(){
  const t=document.getElementById('port-title').value.trim();
  const d=document.getElementById('port-desc').value.trim();
  const c=document.getElementById('port-cat').value;
  const tools=document.getElementById('port-tools').value.trim();
  const url=document.getElementById('port-url').value.trim();
  if(!t){ showToast('Title is required','error'); return; }
  portfolioItems.push({id:Date.now(),title:t,description:d,category:c,tools:tools.split(',').map(x=>x.trim()).filter(Boolean),url});
  closeModal('portfolio-modal');
  renderPortfolio();
  ['port-title','port-desc','port-tools','port-url'].forEach(id=>document.getElementById(id).value='');
  showToast('Portfolio item added!','success');
  // update completeness
  let pct = profileData?.completeness_pct||20;
  if(portfolioItems.length===1) pct = Math.min(100, pct+20);
  updateCompleteness(pct);
}
function removePortfolio(id){
  portfolioItems = portfolioItems.filter(p=>p.id!==id);
  renderPortfolio();
}
function renderPortfolio(){
  const el = document.getElementById('portfolio-list');
  if(!portfolioItems.length){ el.innerHTML='<div class="empty-state" style="padding:24px"><p>No portfolio items yet. Add your first project!</p></div>'; return; }
  el.innerHTML = portfolioItems.map(p=>`
    <div class="card" style="margin-bottom:10px;padding:14px">
      <div class="flex-between mb-1">
        <div class="fw-600">${p.title}</div>
        <div class="flex gap-2">
          ${p.url?`<a href="${p.url}" target="_blank" class="badge badge-blue" style="cursor:pointer">↗ Link</a>`:''}
          <button class="btn btn-ghost btn-sm" onclick="removePortfolio(${p.id})" style="color:var(--red);padding:3px 8px">✕</button>
        </div>
      </div>
      <div class="text-sm text-muted mb-2">${p.category}</div>
      ${p.description?`<div class="text-sm mb-2">${p.description}</div>`:''}
      <div class="fl-skills">${p.tools.map(t=>`<span class="badge badge-gray">${t}</span>`).join('')}</div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════
//  POST PROJECT (client)
// ═══════════════════════════════════════════════════════
function addProjSkill(e){
  if(e.key==='Enter'||e.key===','){
    e.preventDefault();
    const val = document.getElementById('pp-skill-inp').value.trim().replace(/,$/,'');
    if(val && !ppSkills.includes(val)){ ppSkills.push(val); renderProjSkills(); }
    document.getElementById('pp-skill-inp').value='';
  }
}
function removeProjSkill(s){ ppSkills=ppSkills.filter(x=>x!==s); renderProjSkills(); }
function renderProjSkills(){
  const c = document.getElementById('pp-skills-input');
  const inp = document.getElementById('pp-skill-inp');
  c.querySelectorAll('.pill').forEach(p=>p.remove());
  ppSkills.forEach(s=>{ const p=document.createElement('div');p.className='pill';p.innerHTML=`${s}<span onclick="removeProjSkill('${s}')">×</span>`;c.insertBefore(p,inp); });
}

async function doPostProject(){
  if(!isClient()){
    showToast('Only clients can post projects for freelancers.', 'error');
    nav('projects');
    return;
  }
  const title=document.getElementById('pp-title').value.trim();
  const desc=document.getElementById('pp-desc').value.trim();
  const min=parseInt(document.getElementById('pp-min').value)||0;
  const max=parseInt(document.getElementById('pp-max').value)||0;
  if(!title||!desc){ showToast('Title and description are required','error'); return; }
  const btn=document.getElementById('post-btn');
  btn.innerHTML='<span class="spinner"></span> Posting…'; btn.disabled=true;
  const payload = {client_id:currentUser?.id||1,title,description:desc,budget_min:min,budget_max:max,skills:ppSkills};
  try{
    const res=await fetch(API+'/projects',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+currentToken},body:JSON.stringify(payload)});
    if(res.ok){
      const data=await res.json();
      allProjects.unshift({...payload,id:data.id,status:'open'});
    } else {
      let msg = 'Failed to post project (server error '+res.status+').';
      try{ const err = await res.json(); msg = err.detail || err.message || msg; }catch(_){}
      showToast(msg, 'error');
      btn.textContent='Post Project →'; btn.disabled=false;
      return;
    }
  }catch(e){
    showToast('Could not reach the server. Project was not posted.', 'error');
    btn.textContent='Post Project →'; btn.disabled=false;
    return;
  }
  btn.textContent='Post Project →'; btn.disabled=false;
  showToast('Project posted! Freelancers will start submitting proposals.','success');
  ['pp-title','pp-desc'].forEach(id=>document.getElementById(id).value='');
  ppSkills=[]; renderProjSkills();
  nav('my-projects');
}

// ═══════════════════════════════════════════════════════
//  MY PROJECTS (client)
// ═══════════════════════════════════════════════════════
function renderMyProjects(){
  if(!isClient()){
    nav('projects');
    return;
  }
  const el = document.getElementById('my-projects-list');
  const mine = projectsForCurrentClient().slice(0,5);
  if(!mine.length){ el.innerHTML='<div class="empty-state"><h3>No projects yet</h3><p>Post your first project and start receiving proposals.</p><button class="btn btn-primary mt-3" onclick="nav(\'post-project\')">Post a Project →</button></div>'; return; }
  el.innerHTML = mine.map(p=>`
    <div class="card mb-3">
      <div class="flex-between mb-3">
        <div>
          <div class="proj-title mb-1">${p.title}</div>
          <span class="badge badge-green">${p.status||'open'}</span>
        </div>
        <div class="text-right">
          <div class="proj-budget">$${p.budget_min||0} – $${p.budget_max||0}</div>
          <div class="text-sm text-muted mt-1">Fixed price</div>
        </div>
      </div>
      <div class="proj-desc mb-3">${p.description||''}</div>
      <div class="flex gap-2">
        <button class="btn btn-secondary btn-sm" onclick="openProposalsView(${p.id})">View Proposals (${Math.floor(Math.random()*5)+1})</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="showToast('Project closed','success')">Close</button>
      </div>
    </div>
  `).join('');
}

function openProposalsView(projectId){
  const mockProps = [
    {name:'Priya Sharma',title:'Senior React Developer',amount:4200,days:45,cover:'I have built 3 e-commerce platforms with React + Stripe. My latest project handled $2M+ in transactions. I can start immediately.',score:94,rating:4.9},
    {name:'Carlos Mendez',title:'Full-Stack Engineer',amount:3800,days:50,cover:'React and Node.js are my core stack. I have PostgreSQL experience and can implement Stripe Connect for marketplace payments.',score:81,rating:4.7},
    {name:'Tobias Klein',title:'Frontend Developer',amount:3500,days:60,cover:'5 years building React applications. I work well in agile teams and can deliver a clean, tested codebase with documentation.',score:68,rating:4.4},
  ];
  const el = document.getElementById('proposals-list');
  el.innerHTML = mockProps.map(p=>`
    <div class="card mb-3">
      <div class="flex gap-3 mb-3">
        <div class="fl-avatar">${p.name.split(' ').map(w=>w[0]).join('')}</div>
        <div style="flex:1">
          <div class="flex-between">
            <div class="fw-600">${p.name}</div>
            <span class="score-badge ${p.score>=85?'score-high':p.score>=70?'score-mid':'score-low'}">AI Score: ${p.score}/100</span>
          </div>
          <div class="text-sm text-muted">${p.title}</div>
          <div class="flex gap-2 mt-1"><span class="text-sm">★ ${p.rating}</span><span class="text-sm text-muted">· $${p.amount} · ${p.days} days</span></div>
        </div>
      </div>
      <div class="text-sm mb-3" style="line-height:1.6">${p.cover}</div>
      <div class="flex gap-2">
        <button class="btn btn-primary btn-sm" onclick="showToast('${p.name} hired! Contract created.','success');closeModal('proposals-modal')">Hire ${p.name.split(' ')[0]}</button>
        <button class="btn btn-secondary btn-sm">Message</button>
      </div>
    </div>
  `).join('');
  openModal('proposals-modal');
}

// ═══════════════════════════════════════════════════════
//  FREELANCERS
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//  DEMO BANNER helper — shown when data is from mock, not server
// ═══════════════════════════════════════════════════════
function demoBanner(label){
  return backendOffline
    ? `<div style="background:var(--amber-light,#fffbeb);border:1px solid var(--amber,#f59e0b);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:13px;color:#92400e;">
        ⚠ <strong>Demo data</strong> — ${label} (backend offline or demo session)
       </div>`
    : '';
}

// ═══════════════════════════════════════════════════════
//  FREELANCERS  — tries GET /freelancers, falls back to mock
// ═══════════════════════════════════════════════════════
async function renderFreelancers(){
  if(!isClient()){
    nav('projects');
    return;
  }
  const el = document.getElementById('freelancers-list');
  el.innerHTML = '<div class="text-muted text-sm" style="padding:20px">Loading…</div>';

  let freelancers = null;
  if(!backendOffline && currentToken !== 'demo-token'){
    try{
      const res = await fetch(API+'/freelancers',{headers:{'Authorization':'Bearer '+currentToken}});
      if(res.ok) freelancers = await res.json();
    }catch(e){ /* fall through to mock */ }
  }

  const usingMock = !freelancers;
  if(usingMock) freelancers = MOCK_FREELANCERS;

  el.innerHTML = (usingMock ? demoBanner('showing sample freelancers') : '') +
    (freelancers.length === 0
      ? '<div class="empty-state"><h3>No freelancers yet</h3><p>Freelancers will appear here once they create profiles.</p></div>'
      : freelancers.map(f=>`
    <div class="fl-card">
      <div class="fl-card-top">
        <div class="fl-avatar">${(f.name||'?').split(' ').map(w=>w[0]).join('')}</div>
        <div style="flex:1">
          <div class="fl-name">${f.name||'—'}</div>
          <div class="fl-title">${f.title||f.role||'Freelancer'}</div>
          <div class="rating mt-1">
            <span class="star">★</span>
            <span class="fw-600">${f.rating||'—'}</span>
            <span class="text-muted text-xs">(${f.reviews||0} reviews)</span>
          </div>
        </div>
        <div class="fl-rate">${f.rate||f.hourly_rate ? '$'+(f.rate||f.hourly_rate)+'/hr' : '—'}</div>
      </div>
      <div class="text-sm text-muted mb-2">${f.location||''}</div>
      <div class="fl-skills">${(f.skills||[]).map(s=>`<span class="badge badge-gray">${s}</span>`).join('')}</div>
      <div class="flex gap-2 mt-3">
        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="showToast('Message sent to ${f.name}!','success')">Message</button>
        <button class="btn btn-ghost btn-sm" onclick="showToast('${f.name} bookmarked!','success')">♡</button>
      </div>
    </div>
  `).join(''));
}

// ═══════════════════════════════════════════════════════
//  CONTRACTS  — tries GET /contracts, falls back to mock
// ═══════════════════════════════════════════════════════
async function renderContracts(){
  const el = document.getElementById('contracts-list');
  el.innerHTML = '<div class="text-muted text-sm" style="padding:20px">Loading…</div>';

  let contracts = null;
  if(!backendOffline && currentToken !== 'demo-token'){
    try{
      const res = await fetch(API+'/contracts',{headers:{'Authorization':'Bearer '+currentToken}});
      if(res.ok) contracts = await res.json();
    }catch(e){ /* fall through to mock */ }
  }

  const usingMock = !contracts;
  if(usingMock) contracts = MOCK_CONTRACTS;

  if(!contracts.length){
    el.innerHTML='<div class="empty-state"><h3>No contracts yet</h3><p>Hire a freelancer or get hired to create your first contract.</p></div>';
    return;
  }

  el.innerHTML = (usingMock ? demoBanner('showing sample contracts') : '') +
    contracts.map(c=>`
    <div class="card mb-3">
      <div class="flex-between mb-3">
        <div>
          <div class="proj-title mb-1">${c.project||c.title||'Contract'}</div>
          <div class="text-sm text-muted">${c.client||''} · ${c.freelancer||''}</div>
        </div>
        <div class="text-right">
          <span class="badge badge-green mb-1">${c.status||'active'}</span>
          <div class="proj-budget mt-1">$${c.amount||c.budget||0}</div>
        </div>
      </div>
      <div class="mb-3">
        <div class="flex-between text-sm mb-2"><span class="fw-600">Milestone: ${c.milestone||'In progress'}</span><span class="text-muted">${c.milestone_pct||0}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${c.milestone_pct||0}%"></div></div>
      </div>
      <div class="workspace">
        <div>
          <div class="card-title mb-2 text-sm">Messages</div>
          <div class="msg-list">
            <div class="msg recv"><div class="msg-sender">${c.client||'Client'}</div>Hey, how are the wireframes coming along?</div>
            <div class="msg sent"><div class="msg-sender">You</div>Going great! Should have the first draft ready by tomorrow.</div>
            <div class="msg recv"><div class="msg-sender">${c.client||'Client'}</div>Perfect. Looking forward to the review!</div>
          </div>
          <div class="flex gap-2">
            <input id="msg-${c.id}" placeholder="Type a message…" style="flex:1"/>
            <button class="btn btn-primary btn-sm" onclick="sendMsg(${c.id})">Send</button>
          </div>
        </div>
        <div>
          <div class="card mb-3" style="padding:14px">
            <div class="card-title mb-2 text-sm">Milestones</div>
            <div class="flex-between text-sm mb-2">
              <span>${c.milestone||'In progress'}</span>
              <span class="badge badge-amber">In progress</span>
            </div>
            <div class="flex gap-2 mt-3">
              <button class="btn btn-secondary btn-sm" onclick="showToast('Work submitted!','success')">Submit Work</button>
              <button class="btn btn-primary btn-sm" onclick="showToast('Payment of $${Math.round((c.amount||0)*0.9)} released (10% fee deducted)!','success')">Release $${Math.round((c.amount||0)*0.9)}</button>
            </div>
          </div>
          <div class="card" style="padding:14px">
            <div class="text-sm text-muted">Deadline: ${c.deadline||'—'}</div>
            <div class="text-sm text-muted mt-1">Platform fee: 10% = $${Math.round((c.amount||0)*0.1)}</div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}
function sendMsg(id){
  const inp = document.getElementById('msg-'+id);
  if(!inp?.value.trim()) return;
  showToast('Message sent!','success');
  inp.value='';
}

// ═══════════════════════════════════════════════════════
//  COMMUNITY  — tries GET /community/posts, falls back to mock
// ═══════════════════════════════════════════════════════
async function renderCommunity(){
  const feedEl = document.getElementById('community-feed');
  if(feedEl) feedEl.innerHTML = '<div class="text-muted text-sm" style="padding:20px">Loading…</div>';

  let fetchedPosts = null;
  if(!backendOffline && currentToken !== 'demo-token'){
    try{
      const res = await fetch(API+'/community/posts',{headers:{'Authorization':'Bearer '+currentToken}});
      if(res.ok) fetchedPosts = await res.json();
    }catch(e){ /* fall through to mock */ }
  }

  const usingMock = !fetchedPosts;
  communityPosts = usingMock ? [...MOCK_COMMUNITY] : fetchedPosts;

  // Persist mock banner state for renderFeed
  window._communityUsingMock = usingMock;
  renderFeed();

  // Top contributors — try API first
  let contributors = null;
  if(!backendOffline && currentToken !== 'demo-token'){
    try{
      const res = await fetch(API+'/community/contributors',{headers:{'Authorization':'Bearer '+currentToken}});
      if(res.ok) contributors = await res.json();
    }catch(e){}
  }
  if(!contributors) contributors = MOCK_FREELANCERS.slice(0,3);

  document.getElementById('top-contributors').innerHTML = contributors.map(f=>`
    <div class="flex gap-2">
      <div class="fl-avatar" style="width:32px;height:32px;font-size:12px">${(f.name||'?').split(' ').map(w=>w[0]).join('')}</div>
      <div><div style="font-size:13px;font-weight:600">${f.name||'—'}</div><div class="text-xs text-muted">${f.location||''}</div></div>
    </div>
  `).join('');
}
function renderFeed(){
  const catColor={general:'badge-gray',tip:'badge-green',showcase:'badge-blue',question:'badge-amber'};
  const banner = window._communityUsingMock ? demoBanner('showing sample posts') : '';
  document.getElementById('community-feed').innerHTML = banner + communityPosts.map(p=>`
    <div class="post-card">
      <div class="post-header">
        <div class="fl-avatar" style="width:38px;height:38px;font-size:13px">${p.avatar||'?'}</div>
        <div>
          <div class="fw-600 text-sm">${p.author||'Unknown'}</div>
          <div class="post-meta">${p.time||''} · <span class="badge ${catColor[p.cat?.toLowerCase()]||'badge-gray'}" style="font-size:10px;padding:2px 7px">${p.cat||''}</span></div>
        </div>
      </div>
      <div class="post-content">${p.content||''}</div>
      <div class="post-actions">
        <div class="post-action" onclick="likePost(${p.id},this)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span>${p.likes||0}</span>
        </div>
        <div class="post-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span>${p.comments||0} comments</span>
        </div>
      </div>
    </div>
  `).join('');
}
function likePost(id, el){
  const post = communityPosts.find(p=>p.id===id);
  if(post){ post.likes++; renderFeed(); }
}
function openNewPost(){ openModal('post-modal'); }
async function doNewPost(){
  const content = document.getElementById('new-post-content').value.trim();
  const cat = document.getElementById('new-post-cat').value;
  if(!content){ showToast('Write something first!','error'); return; }
  const catLabel = {general:'General',tip:'Tip',showcase:'Showcase',question:'Question'}[cat]||cat;
  const btn = document.getElementById('post-submit-btn');
  if(btn){ btn.innerHTML='<span class="spinner"></span> Posting…'; btn.disabled=true; }

  let savedToServer = false;
  if(!backendOffline && currentToken !== 'demo-token'){
    try{
      const res = await fetch(API+'/community/posts',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+currentToken},
        body:JSON.stringify({content,category:cat})
      });
      if(res.ok){
        const data = await res.json();
        communityPosts.unshift(data);
        savedToServer = true;
      } else {
        let msg = 'Could not publish post (server error '+res.status+').';
        try{ const err = await res.json(); msg = err.detail||err.message||msg; }catch(_){}
        showToast(msg, 'error');
        if(btn){ btn.textContent='Post'; btn.disabled=false; }
        return;
      }
    }catch(e){
      showToast('Could not reach the server. Post was not saved.', 'error');
      if(btn){ btn.textContent='Post'; btn.disabled=false; }
      return;
    }
  }

  if(!savedToServer){
    // Demo or offline: add locally only
    communityPosts.unshift({
      id:Date.now(),
      author:currentUser?.name||'You',
      avatar:(currentUser?.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
      content,cat:catLabel,likes:0,comments:0,time:'Just now'
    });
  }

  renderFeed();
  document.getElementById('new-post-content').value='';
  closeModal('post-modal');
  if(btn){ btn.textContent='Post'; btn.disabled=false; }
  showToast(savedToServer ? 'Post published!' : 'Post added locally (demo mode).','success');
}

// ═══════════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════════
function openModal(id){ document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id){ document.getElementById(id)?.classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(el=>{
  el.addEventListener('click',e=>{ if(e.target===el) el.classList.add('hidden'); });
});

// ═══════════════════════════════════════════════════════
//  TOASTS
// ═══════════════════════════════════════════════════════
function showToast(msg, type='info'){
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast'+(type==='success'?' success':type==='error'?' error':'');
  const icon = type==='success'?'✓':type==='error'?'✕':'ℹ';
  t.innerHTML = `<span style="font-size:15px">${icon}</span> <span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>t.style.opacity='0',3000);
  setTimeout(()=>t.remove(),3300);
}

// ═══════════════════════════════════════════════════════
//  MISC
// ═══════════════════════════════════════════════════════
function confirmDelete(){
  if(confirm('Are you sure you want to delete your account? This cannot be undone.')){
    doLogout();
    showToast('Account deleted.','success');
  }
}

// Set deadline default
document.getElementById('pp-deadline').valueAsDate = new Date(Date.now()+30*864e5);
