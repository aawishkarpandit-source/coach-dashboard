/* Coach Dashboard – offline single JS file
   HOW TO EDIT (for teachers):
   1. Classes: edit <select id="classSelect"> in index.html
   2. Books: edit data/books.json (title, class, type govt/pvt, file)
   3. New page: copy a <section class="page"> in index.html, add a button with data-goto="your-id"
*/
'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------- 1. Simple routing (hash + buttons) ---------- */
function goto(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  const el = $('#page-' + page);
  if (el) el.classList.add('active');
  location.hash = page === 'home' ? '' : page;
  if (page !== 'team' && typeof resetCredits === 'function') resetCredits();
  if (page === 'students') renderStudents();
  if (page === 'books') renderBooks();
  if (page === 'present'){ try{ renderLocalPres(); updateScreenInfo(); }catch{} }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-goto]');
  if (b) goto(b.dataset.goto);
});
window.addEventListener('load', () => {
  const h = location.hash.replace('#', '');
  if (['students','books','present','about','terms','team'].includes(h)) goto(h);
});
$('#classSelect').addEventListener('change', e => {
  $('#studentsClassChip').textContent = e.target.value;
  try{ localStorage.setItem('coach-class', e.target.value); }catch{}
  renderStudents();
  renderBooks();
  try{ window.Stage && Stage.refreshWelcome(); }catch{}
  maybeRefreshMarksStage();
  toast((LANG === 'ne' ? 'कक्षा ' : 'Class ') + e.target.value);
});

/* ---------- 2. Eng / Nep toggle ---------- */
const I18N = {
  en: {classLabel:'Class',offline:'Offline Ready',appTitle:'Classroom Dashboard',appSub:'Simple • Offline • Easy to use',students:'Students',books:'Textbooks',present:'Present',home:'Home',studentsTitle:'Students & Marksheet',studentList:'Student List',add:'Add',marksheet:'Marksheet',marksheetHint:'Select a student, enter marks, auto-saved offline.',selectStudent:'Select student',subject:'Subject',total:'Total',percent:'Percent',name:'Name',action:'Action',booksTitle:'Textbooks',govt:'Govt Books',pvt:'Private Books',booksHint:'Put PDFs in /books folder, or Import. Works offline.',importBook:'Import Book',importHint:'Choose a PDF. It is saved in the browser and, in the installed app, as a real file.',linkFolder:'Link /books folder',delete:'Delete',imported:'Imported',show2nd:'Show on 2nd screen',pdfControlHint:'You control from this screen — students see only the open page on the 2nd screen.',presentTitle:'Present',presentFiles:'Presentation / Media',presentHint:'Images, videos, PDFs & PowerPoint (.pptx) play fully offline. The stage opens by itself.',chooseFiles:'Choose files',openPresenter:'Open presenter (2nd screen)',stage:'Stage (what students see)',stageHint:'Pick a file to preview here. Presenter window mirrors this.',newPpt:'New presentation',newPptHint:'“New presentation” picks files from this computer to present.',addStudent:'Add student',cancel:'Cancel',save:'Save',close:'Close',open2nd:'2nd screen',localPres:'Saved on this computer',about:'About',terms:'Terms & Conditions',team:'Team',playCredits:'Play credits',stopCredits:'Stop',roleLead:'LEAD DESIGNER & DEVELOPER',roleTesters:'PLAY TESTERS',thanksWatching:'Thanks for teaching',backup:'Backup',restore:'Restore',backupHint:'One file holds everything: students, theory/practical marks, books, presentations, settings.',exportBk:'Export',importBk:'Import',fullMarks:'Full marks',fullMarksHint:'Rename subjects, set full marks, delete, or add new ones. Totals follow automatically.',theory:'Theory',practical:'Practical',exams:'Exams',examsHint:'Each exam keeps its own marksheet. Rename freely; deleting an exam erases its marks everywhere.'},
  ne: {classLabel:'कक्षा',offline:'अफलाइन तयार',appTitle:'कक्षाकोठा ड्यासबोर्ड',appSub:'सरल • अफलाइन • सजिलो',students:'विद्यार्थी',books:'पाठ्यपुस्तक',present:'प्रस्तुत गर्नुहोस्',home:'गृहपृष्ठ',studentsTitle:'विद्यार्थी र मार्कसिट',studentList:'विद्यार्थी सूची',add:'थप्नुहोस्',marksheet:'मार्कसिट',marksheetHint:'विद्यार्थी छान्नुहोस्, नम्बर हाल्नुहोस्, अफलाइन सेभ हुन्छ।',selectStudent:'विद्यार्थी छान्नुहोस्',subject:'विषय',total:'जम्मा',percent:'प्रतिशत',name:'नाम',action:'कार्य',booksTitle:'पाठ्यपुस्तक',govt:'सरकारी किताब',pvt:'निजी किताब',booksHint:'PDF हरू /books मा राख्नुहोस् वा Import गर्नुहोस्। अफलाइन चल्छ।',importBook:'किताब आयात',importHint:'PDF छान्नुहोस्। ब्राउजरमा र इन्स्टल गरिएको एपमा वास्तविक फाइलका रूपमा सेभ हुन्छ।',linkFolder:'Link /books फोल्डर',delete:'हटाउनुहोस्',imported:'आयातित',show2nd:'दोस्रो स्क्रिनमा देखाउनुहोस्',pdfControlHint:'तपाईं यस स्क्रिनबाट नियन्त्रण गर्नुहोस् — विद्यार्थीले दोस्रो स्क्रिनमा खुला पेज मात्र देख्छन्।',presentTitle:'प्रस्तुत',presentFiles:'प्रस्तुति / मिडिया',presentHint:'फोटो, भिडियो, PDF र PowerPoint (.pptx) अफलाइन चल्छ। स्टेज आफैं खुल्छ।',chooseFiles:'फाइल छान्नुहोस्',openPresenter:'प्रस्तोता खोल्नुहोस् (दोस्रो स्क्रिन)',stage:'स्टेज (विद्यार्थीले देख्ने)',stageHint:'यहाँ हेर्न फाइल छान्नुहोस्। प्रस्तोता विन्डोमा उही देखिन्छ।',newPpt:'नयाँ प्रस्तुति',newPptHint:'"नयाँ प्रस्तुति" ले यस कम्प्युटरबाट फाइल छानेर प्रस्तुत गर्छ।',addStudent:'विद्यार्थी थप्नुहोस्',cancel:'रद्द',save:'सेभ',close:'बन्द',open2nd:'दोस्रो स्क्रिन',localPres:'यस कम्प्युटरमा सेभ',about:'बारेमा',terms:'नियम तथा सर्तहरू',team:'टिम',playCredits:'क्रेडिट चलाउनुहोस्',stopCredits:'रोक्नुहोस्',roleLead:'प्रमुख डिजाइनर तथा विकासकर्ता',roleTesters:'प्ले टेस्टरहरू',thanksWatching:'पढाउनुभएकोमा धन्यवाद',backup:'ब्याकअप',restore:'रिस्टोर',backupHint:'एउटै फाइलमा सबै: विद्यार्थी, थ्योरी/प्राक्टिकल नम्बर, किताब, प्रस्तुति, सेटिङ।',exportBk:'एक्सपोर्ट',importBk:'इम्पोर्ट',fullMarks:'पूर्णाङ्क',fullMarksHint:'विषयको नाम बदल्नुहोस्, पूर्णाङ्क तोक्नुहोस्, हटाउनुहोस् वा नयाँ थप्नुहोस्।',theory:'थ्योरी',practical:'प्राक्टिकल',exams:'परीक्षाहरू',examsHint:'प्रत्येक परीक्षाको छुट्टै मार्कसिट हुन्छ। नाम स्वतन्त्र रूपमा बदल्नुहोस्; परीक्षा हटाउँदा त्यसका सबै नम्बर मेटिन्छ।'}
};
let LANG = localStorage.getItem('coach-lang') || 'en';
function applyLang() {
  const d = I18N[LANG];
  $$('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (d[k]) el.textContent = d[k];
  });
  // Terms page: show only the matching language block
  $$('[data-lang-block]').forEach(el => {
    el.style.display = el.dataset.langBlock === LANG ? '' : 'none';
  });
  document.documentElement.lang = LANG === 'ne' ? 'ne' : 'en';
  $('#langToggle').textContent = LANG === 'ne' ? 'NE | EN' : 'EN | NE';
  localStorage.setItem('coach-lang', LANG);
}
$('#langToggle').onclick = () => { LANG = LANG === 'en' ? 'ne' : 'en'; applyLang(); };
applyLang();

/* ---------- 3. Clock + offline badge ---------- */
setInterval(() => {
  const t = new Date();
  $('#clock').textContent = t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
}, 1000);
function updateOnline(){ $('#offlineBadge').classList.toggle('off', !navigator.onLine); }
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
updateOnline();

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.add('hidden'), 2200);
}

/* ---------- 4. Students + Marksheet (offline localStorage) ---------- */
// EDIT defaults here:
const DEFAULT_STUDENTS = [
  {roll:1,name:'Aarav Sharma',cls:'9A'},{roll:2,name:'Diya KC',cls:'9A'},
  {roll:1,name:'Sneha Thapa',cls:'10A'},
];
const DEFAULT_SUBJECTS = ['Math','Science','English','Nepali','Social'];
const SUBJLIST_KEY = 'coach-subject-list';
function getSubjects(){
  try{
    const l = JSON.parse(localStorage.getItem(SUBJLIST_KEY) || 'null');
    if(Array.isArray(l) && l.length) return l.filter(s=>typeof s === 'string' && s.trim()).map(s=>s.trim());
  }catch{}
  return DEFAULT_SUBJECTS.slice();
}
function setSubjects(l){ localStorage.setItem(SUBJLIST_KEY, JSON.stringify(l)); }
const SUBJ_KEY = 'coach-subjects';
// Full marks per subject: {Sub:{th,pr}}. Customizable via ⚙ Full marks. Default 75+25.
function getSubjConfig(){
  try{
    const c = JSON.parse(localStorage.getItem(SUBJ_KEY) || 'null');
    if(c && typeof c === 'object') return c;
  }catch{}
  const d = {};
  getSubjects().forEach(s=>{ d[s] = { th:75, pr:25 }; });
  return d;
}
function saveSubjConfig(c){ localStorage.setItem(SUBJ_KEY, JSON.stringify(c)); }
function subjFull(sub){ const c = getSubjConfig()[sub] || { th:75, pr:25 }; return { th:+c.th||0, pr:+c.pr||0 }; }
function subjFullTotal(){ return getSubjects().reduce((a,s)=>a+subjFull(s).th+subjFull(s).pr, 0); }
// One subject's marks, any stored shape -> {th, pr} (legacy plain numbers count as theory).
function normSubj(v){
  if(v == null) return { th:null, pr:null };
  if(typeof v === 'number' || typeof v === 'string') return { th:(v === '' ? null : v), pr:null };
  return { th:(v.th === undefined ? null : v.th), pr:(v.pr === undefined ? null : v.pr) };
}
function subjTotal(v){ const n = normSubj(v); return (+n.th || 0) + (+n.pr || 0); }
const store = {
  get students(){ try{return JSON.parse(localStorage.getItem('coach-students')) ?? DEFAULT_STUDENTS;}catch{return DEFAULT_STUDENTS;} },
  set students(v){ localStorage.setItem('coach-students', JSON.stringify(v)); },
  marks(cls,roll,exam){ return readMarks(exam || activeExamId(), cls, roll); },
  saveMarks(cls,roll,obj,exam){ localStorage.setItem(marksKey(exam || activeExamId(), cls, roll), JSON.stringify(obj)); }
};
/* Exams: [{id, name}] — each exam keeps its own marksheet. Legacy unprefixed
   marks-* keys are first-exam data and migrate automatically on startup. */
const EXAMS_KEY = 'coach-exams';
const ACTIVE_EXAM_KEY = 'coach-exam';
function getExams(){
  try{
    const l = JSON.parse(localStorage.getItem(EXAMS_KEY) || 'null');
    if(Array.isArray(l) && l.length) return l.filter(e=>e && e.id && e.name);
  }catch{}
  return [{ id:'e1', name:'Exam 1' }];
}
function setExams(l){ localStorage.setItem(EXAMS_KEY, JSON.stringify(l)); }
function activeExamId(){
  const id = localStorage.getItem(ACTIVE_EXAM_KEY);
  const ex = getExams();
  return ex.some(e=>e.id === id) ? id : ex[0].id;
}
function activeExam(){ const ex = getExams(); return ex.find(e=>e.id === activeExamId()) || ex[0]; }
function setActiveExam(id){ localStorage.setItem(ACTIVE_EXAM_KEY, id); }
function marksKey(exam, cls, roll){ return `marks-${exam}-${cls}-${roll}`; }
function readMarks(exam, cls, roll){
  try{
    const v = localStorage.getItem(marksKey(exam, cls, roll));
    if(v != null) return JSON.parse(v);
    const leg = localStorage.getItem(`marks-${cls}-${roll}`); // pre-exam data
    if(leg != null) return JSON.parse(leg);
  }catch{}
  return {};
}
function migrateLegacyMarks(){
  const ex = getExams()[0].id;
  for(const s of store.students){
    const leg = `marks-${s.cls}-${s.roll}`;
    try{
      if(localStorage.getItem(leg) != null && localStorage.getItem(marksKey(ex, s.cls, s.roll)) == null)
        localStorage.setItem(marksKey(ex, s.cls, s.roll), localStorage.getItem(leg));
    }catch{}
  }
}
const curClass = () => $('#classSelect').value;

function renderStudents(){
  const cls = curClass();
  const q = ($('#studentSearch').value||'').toLowerCase();
  const list = store.students.filter(s=>s.cls===cls && (s.name.toLowerCase().includes(q)||String(s.roll).includes(q))).sort((a,b)=>a.roll-b.roll);
  $('#studentTable tbody').innerHTML = list.map(s=>
    `<tr><td>${s.roll}</td><td>${escapeHtml(s.name)}</td><td><button class="btn ghost" data-del="${s.roll}">✕</button></td></tr>`).join('')
    || `<tr><td colspan="3" class="hint">No students in ${cls} yet. Click + Add.</td></tr>`;
  const sel = $('#markStudent');
  sel.innerHTML = list.map(s=>`<option value="${s.roll}">${s.roll} – ${escapeHtml(s.name)}</option>`).join('') || '<option value="">—</option>';
  renderMarks();
}
function renderMarks(){
  const cls = curClass(), roll = $('#markStudent').value;
  const saved = store.marks(cls, roll);
  $('#marksTable tbody').innerHTML = getSubjects().map(sub=>{
    const fm = subjFull(sub), v = normSubj(saved[sub]);
    const tot = (+v.th || 0) + (+v.pr || 0);
    return `<tr><td>${sub}<br/><small class="hint">/${fm.th}+${fm.pr}</small></td>` +
      `<td><input type="number" min="0" max="${fm.th}" data-sub="${sub}" data-part="th" value="${v.th ?? ''}" /></td>` +
      `<td><input type="number" min="0" max="${fm.pr}" data-sub="${sub}" data-part="pr" value="${v.pr ?? ''}" /></td>` +
      `<td data-rowtotal="${sub}">${tot}</td></tr>`;
  }).join('');
  calcTotal();
}
function calcTotal(){
  const full = subjFullTotal() || 1;
  let total = 0;
  $$('#marksTable input').forEach(i=>{ total += +i.value || 0; });
  $('#marksTotal').textContent = total + ' / ' + full;
  $('#marksPct').textContent = Math.round(total / full * 100) + '%';
}
document.addEventListener('input', e=>{
  if(e.target.matches('#marksTable input')){
    const obj = {};
    $$('#marksTable input').forEach(i=>{
      obj[i.dataset.sub] = obj[i.dataset.sub] || {};
      // null = teacher cleared it (stays cleared); undefined = never set (cloud may fill)
      obj[i.dataset.sub][i.dataset.part] = (i.value === '' ? null : i.value);
    });
    store.saveMarks(curClass(), $('#markStudent').value, obj);
    calcTotal();
    // live row total
    const sub = e.target.dataset.sub;
    const cell = document.querySelector(`[data-rowtotal="${sub}"]`);
    if(cell) cell.textContent = subjTotal(obj[sub]);
    try{ window.SB && SB.pushMarks(curClass(), $('#markStudent').value, obj, activeExamId()); }catch{}
    maybeRefreshMarksStage();
  }
  if(e.target.id==='studentSearch') renderStudents();
  if(e.target.id==='bookSearch') renderBooks();
});
/* Delete tombstones: "cls|roll" that must never be resurrected by cloud pulls
   (e.g. if another PC re-pushes a row we deleted while offline). */
const TOMB_KEY = 'coach-deleted-students';
function getTombs(){ try{ return JSON.parse(localStorage.getItem(TOMB_KEY)||'[]'); }catch{ return []; } }
function addTomb(cls, roll){
  const k = cls+'|'+roll;
  const t = getTombs().filter(x=>x!==k); t.push(k);
  try{ localStorage.setItem(TOMB_KEY, JSON.stringify(t.slice(-500))); }catch{}
}
function removeTomb(cls, roll){
  const k = cls+'|'+roll;
  try{ localStorage.setItem(TOMB_KEY, JSON.stringify(getTombs().filter(x=>x!==k))); }catch{}
}
function isTombed(cls, roll){ return getTombs().includes(cls+'|'+roll); }

/* Book delete tombstones: file_paths that must never come back via cloud pulls. */
const BTOMB_KEY = 'coach-deleted-books';
function getBookTombs(){ try{ return JSON.parse(localStorage.getItem(BTOMB_KEY)||'[]'); }catch{ return []; } }
function addBookTomb(fileName){
  if(!fileName) return;
  const t = getBookTombs().filter(x=>x!==fileName); t.push(fileName);
  try{ localStorage.setItem(BTOMB_KEY, JSON.stringify(t.slice(-500))); }catch{}
}
function removeBookTomb(fileName){
  try{ localStorage.setItem(BTOMB_KEY, JSON.stringify(getBookTombs().filter(x=>x!==fileName))); }catch{}
}
function isBookTombed(fileName){ return !!fileName && getBookTombs().includes(fileName); }

/* True delete: browser copy + /books real file + cloud row/file, then tombstone.
   (The old code only dropped the browser copy, so books kept coming back.) */
async function deleteBookEverywhere({ id, fileName, label }){
  if(!confirm(`Delete "${label || fileName}" everywhere (this computer + cloud)?`)) return false;
  addBookTomb(fileName);
  const doomed = id != null ? IMPORTED.find(b=>b.id===id) : null;
  const doomedPath = doomed && doomed.diskPath;
  if(id != null){
    try{ await idb.del(id); }catch{}
    IMPORTED = IMPORTED.filter(b=>b.id!==id);
    importUrls.delete(id);
  }
  CLOUD_BOOKS = CLOUD_BOOKS.filter(x=>(x.file_path||x.fileName)!==fileName);
  try{ if(doomedPath && window.electron) await window.electron.deleteFile(doomedPath); }catch{}
  try{ if(window.SB && SB.configured && fileName) await SB.deleteBook(fileName); }catch{}
  renderBooks();
  toast('Book deleted ✓');
  return true;
}

document.addEventListener('click', e=>{
  const del = e.target.closest('[data-del]');
  if(del){
    const cls = curClass(), roll = del.dataset.del;
    if(!confirm(`Remove roll ${roll} from ${cls}?`)) return;
    store.students = store.students.filter(s=>!(s.cls===cls&&s.roll==roll));
    addTomb(cls, roll);
    try{ localStorage.removeItem(`marks-${cls}-${roll}`); }catch{} // local marks cleanup
    try{ window.SB && SB.deleteStudent(cls, roll); }catch{}        // cloud hard-delete
    try{ window.SB && SB.pushStudents(store.students); }catch{}
    renderStudents();
    maybeRefreshMarksStage();
    toast('Student removed ✓');
  }
});
/* Marksheet on the 2nd screen: white results table, re-pushed live while shown. */
function marksSnapshot(){
  const cls = curClass();
  const full = subjFullTotal() || 1;
  const rows = store.students.filter(s=>s.cls===cls).sort((a,b)=>a.roll-b.roll).map(s=>{
    const m = store.marks(cls, s.roll);
    const tot = getSubjects().reduce((a,x)=>a+subjTotal(m[x]),0);
    return { roll:s.roll, name:s.name, total:tot, pct:Math.round(tot/full*100)+'%' };
  });
  const exName = activeExam().name;
  return { title:((LANG==='ne' ? 'मार्कसिट' : 'Marksheet') + ' — ' + exName), rows };
}
function pushMarksToStage(){
  try{
    const s = marksSnapshot();
    if(window.Stage) Stage.showMarks(s);
    toast('Marksheet on 2nd screen ✓');
  }catch{ toast('Could not open 2nd screen (popup blocked?).'); }
}
function maybeRefreshMarksStage(){
  try{ if(window.Stage && Stage.lastType==='marks') Stage.showMarks(marksSnapshot()); }catch{}
}
$('#studentsStageBtn').onclick = pushMarksToStage;
$('#markStudent')?.addEventListener('change', renderMarks);
$('#addStudentBtn').onclick = ()=> $('#studentDialog').showModal();
$('#saveStudent').onclick = ()=>{
  const roll = +$('#fRoll').value, name = $('#fName').value.trim();
  if(!roll||!name) return;
  const all = store.students.filter(s=>!(s.cls===curClass()&&s.roll===roll));
  all.push({roll,name,cls:curClass()}); store.students = all;
  removeTomb(curClass(), roll); // re-adding a roll revives it
  try{ window.SB && SB.pushStudents(all); }catch{}
  $('#fRoll').value='';$('#fName').value='';renderStudents();
  maybeRefreshMarksStage();
};
$('#exportCsvBtn').onclick = ()=>{
  const cls = curClass();
  const full = subjFullTotal();
  const subs = getSubjects();
  let csv = 'Roll,Name,' + subs.flatMap(s=>[`${s} Th (/${subjFull(s).th})`,`${s} Pr (/${subjFull(s).pr})`,`${s} Total`]).join(',') + `,Grand Total (/${full}),Percent\n`;
  store.students.filter(s=>s.cls===cls).forEach(s=>{
    const m = store.marks(cls,s.roll);
    const cells = [];
    let grand = 0;
    subs.forEach(x=>{
      const v = normSubj(m[x]);
      const th = +v.th || 0, pr = +v.pr || 0;
      grand += th + pr;
      cells.push(v.th ?? '', v.pr ?? '', th + pr);
    });
    csv += `${s.roll},"${s.name}",${cells.join(',')},${grand},${Math.round(grand/(full||1)*100)}%\n`;
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  const safeExam = activeExam().name.replace(/[^\w\-]+/g, '-').slice(0, 30) || 'exam';
  a.download = `marksheet-${cls}-${safeExam}.csv`; a.click();
};
/* ---------- Exams: Exam 1, Exam 2… — each with its own marksheet ----------
   (Subjects manager with rename/full-marks/delete/add follows right below.) */
function renderExamSelect(){
  const sel = $('#examSelect');
  if(!sel) return;
  const ex = getExams();
  sel.innerHTML = ex.map(e=>`<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('');
  sel.value = activeExamId();
}
$('#examSelect')?.addEventListener('change', e=>{
  setActiveExam(e.target.value);
  renderMarks();
  maybeRefreshMarksStage();
});
$('#examsBtn').onclick = ()=>{
  $('#examRows').innerHTML = getExams().map(e=>
    `<div style="display:flex;gap:6px;align-items:center;margin:8px 0">` +
    `<input data-examold="${e.id}" data-examname type="text" value="${escapeHtml(e.name)}" style="flex:1" />` +
    `<button type="button" class="btn ghost" data-delexam="${e.id}" title="Delete exam + its marks">✕</button></div>`
  ).join('');
  $('#examsDialog').showModal();
};
document.addEventListener('click', e=>{
  if(e.target.closest('#addExamBtn')){
    const inp = $('#newExamName');
    const name = (inp.value || '').trim() || `Exam ${getExams().length + 1}`;
    const id = 'e' + Date.now().toString(36);
    setExams([...getExams(), { id, name }]);
    setActiveExam(id);
    $('#examsBtn').onclick();
    renderExamSelect(); renderMarks();
    toast(`"${name}" added ✓`);
  }
  const delEx = e.target.closest('[data-delexam]');
  if(delEx){
    const ex = getExams();
    if(ex.length <= 1){ toast('Keep at least one exam'); return; }
    const target = ex.find(x=>x.id === delEx.dataset.delexam);
    if(!target) return;
    if(!confirm(`Delete "${target.name}" and ALL its marks (every class, cloud too)?`)) return;
    // purge local exam marks (all classes/rolls)
    const keys = [];
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(k.startsWith(`marks-${target.id}-`)) keys.push(k);
    }
    keys.forEach(k=>{ try{ localStorage.removeItem(k); }catch{} });
    try{ if(window.SB && SB.configured) SB.deleteExam(target.id); }catch{}
    const rest = ex.filter(x=>x.id !== target.id);
    setExams(rest);
    if(activeExamId() === target.id) setActiveExam(rest[0].id);
    $('#examsBtn').onclick();
    renderExamSelect(); renderMarks();
    maybeRefreshMarksStage();
    toast(`"${target.name}" deleted ✓`);
  }
});
$('#saveExams').onclick = (e)=>{
  // renames only (add/delete apply immediately above)
  const rows = [...document.querySelectorAll('#examRows [data-examname]')].map(inp=>({
    id: inp.dataset.examold, name: inp.value.trim()
  }));
  if(rows.some(r=>!r.name) || new Set(rows.map(r=>r.name)).size !== rows.length){ toast('Exam names must be unique and non-empty'); e.preventDefault(); return; }
  setExams(rows);
  renderExamSelect(); renderMarks();
  maybeRefreshMarksStage();
  toast('Exams saved ✓');
};
$('#fullMarksBtn').onclick = ()=>{
  const cfg = getSubjConfig();
  $('#fullMarksRows').innerHTML = getSubjects().map(s=>{
    const f = subjFull(s);
    return `<div style="display:flex;gap:6px;align-items:center;margin:8px 0">` +
      `<input data-subold="${escapeHtml(s)}" data-subname type="text" value="${escapeHtml(s)}" style="flex:1;min-width:90px" />` +
      `Th <input data-fm="${escapeHtml(s)}" data-part="th" type="number" min="0" max="1000" value="${f.th}" style="width:64px" />` +
      `Pr <input data-fm="${escapeHtml(s)}" data-part="pr" type="number" min="0" max="1000" value="${f.pr}" style="width:64px" />` +
      `<button type="button" class="btn ghost" data-delsub="${escapeHtml(s)}" title="Delete subject">✕</button></div>`;
  }).join('') +
  `<div style="display:flex;gap:6px;margin-top:10px"><input id="newSubName" type="text" placeholder="New subject…" style="flex:1" /><button type="button" class="btn" id="addSubBtn">+ <span>Add</span></button></div>`;
  $('#fullMarksDialog').showModal();
};
document.addEventListener('click', e=>{
  if(e.target.closest('#addSubBtn')){
    const inp = $('#newSubName');
    const name = (inp.value || '').trim();
    if(!name) return;
    const subs = getSubjects();
    if(subs.includes(name)){ toast('Subject already exists'); return; }
    setSubjects([...subs, name]);
    const cfg = getSubjConfig(); cfg[name] = { th:75, pr:25 }; saveSubjConfig(cfg);
    $('#fullMarksBtn').onclick();
    renderMarks();
  }
  const delSub = e.target.closest('[data-delsub]');
  if(delSub){
    const old = delSub.dataset.delsub;
    if(!confirm(`Delete subject "${old}" everywhere (all exams, all students, cloud)?`)) return;
    deleteSubjectEverywhere(old);
  }
});
/* Rename one subject's key inside every stored marksheet (all exams + legacy). */
function eachMarksRecord(cb){
  const keys = [];
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i);
    if(/^marks-/.test(k)) keys.push(k);
  }
  for(const k of keys){
    try{
      const o = JSON.parse(localStorage.getItem(k));
      if(o && typeof o === 'object' && cb(k, o)) localStorage.setItem(k, JSON.stringify(o));
    }catch{}
  }
}
async function deleteSubjectEverywhere(old){
  setSubjects(getSubjects().filter(s=>s!==old));
  const cfg = getSubjConfig(); delete cfg[old]; saveSubjConfig(cfg);
  eachMarksRecord((k, o)=>{ if(old in o){ delete o[old]; return true; } return false; });
  try{ if(window.SB && SB.configured) await SB.deleteSubjectRows(old); }catch{}
  $('#fullMarksBtn').onclick(); // refresh dialog rows
  renderMarks();
  maybeRefreshMarksStage();
  toast(`Subject "${old}" deleted ✓`);
}
$('#saveFullMarks').onclick = async (e)=>{
  const rows = [...document.querySelectorAll('#fullMarksRows [data-subname]')].map(inp=>({
    old: inp.dataset.subold, name: inp.value.trim(),
    th: Math.max(0, +document.querySelector(`#fullMarksRows [data-fm="${CSS.escape(inp.dataset.subold)}"][data-part="th"]`).value || 0),
    pr: Math.max(0, +document.querySelector(`#fullMarksRows [data-fm="${CSS.escape(inp.dataset.subold)}"][data-part="pr"]`).value || 0)
  }));
  const names = rows.map(r=>r.name);
  if(names.some(n=>!n) || new Set(names).size !== names.length){ toast('Names must be unique and non-empty'); e.preventDefault(); return; }
  const cfg = getSubjConfig();
  const newSubs = [];
  for(const r of rows){
    newSubs.push(r.name);
    cfg[r.name] = { th:r.th, pr:r.pr };
    if(r.old !== r.name){
      // migrate local marks + config, then cloud
      delete cfg[r.old];
      eachMarksRecord((k, o)=>{ if(r.old in o){ o[r.name] = o[r.old]; delete o[r.old]; return true; } return false; });
      try{
        if(window.SB && SB.configured){
          await SB.deleteSubjectRows(r.old);
          for(const ex of getExams())
            for(const s of store.students)
              SB.pushMarks(s.cls, s.roll, store.marks(s.cls, s.roll, ex.id), ex.id);
        }
      }catch{}
    }
  }
  setSubjects(newSubs);
  saveSubjConfig(cfg);
  renderMarks();
  maybeRefreshMarksStage();
  toast('Subjects saved ✓');
};
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/* ---------- 5. Textbooks + offline PDF reader + IMPORT + CLOUD ---------- */
let BOOKS = [];          // from data/books.json  -> {title,titleNe,class,type,file}
let IMPORTED = [];       // from IndexedDB      -> {id,title,titleNe,class,type,fileName,blob}
let CLOUD_BOOKS = [];    // from Supabase book_meta (other computers' imports)
const importUrls = new Map(); // id -> objectURL (so imported PDFs open offline)

function allBooks(){ return [...BOOKS, ...IMPORTED.map(b=>({...b, imported:true})), ...CLOUD_BOOKS.map(b=>({...b, cloud:true}))]; }

// --- tiny IndexedDB wrapper (no library, works offline) ---
// v2: 'books' store (imported PDFs) + 'kv' store (linked /books folder handle)
const idb = {
  db:null,
  open(){ return new Promise((res,rej)=>{
    if(this.db) return res(this.db);
    const r = indexedDB.open('coach-dashboard',3);
    r.onupgradeneeded = ()=>{
      const db = r.result;
      if(!db.objectStoreNames.contains('books')) db.createObjectStore('books',{keyPath:'id',autoIncrement:true});
      if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if(!db.objectStoreNames.contains('media')) db.createObjectStore('media',{keyPath:'id',autoIncrement:true});
    };
    r.onsuccess = ()=>{this.db=r.result;res(this.db);};
    r.onerror = ()=>rej(r.error);
  });},
  async all(){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('books','readonly'); const out=[];
    tx.objectStore('books').openCursor().onsuccess=e=>{const c=e.target.result; if(c){out.push(c.value);c.continue();} else res(out);};
    tx.onerror=()=>rej(tx.error);
  });},
  async add(v){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('books','readwrite'); const q=tx.objectStore('books').add(v);
    q.onsuccess=()=>res(q.result); tx.onerror=()=>rej(tx.error);
  });},
  async put(v){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('books','readwrite'); const q=tx.objectStore('books').put(v);
    q.onsuccess=()=>res(q.result); tx.onerror=()=>rej(tx.error);
  });},
  async del(id){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('books','readwrite'); tx.objectStore('books').delete(id);
    tx.oncomplete=res; tx.onerror=()=>rej(tx.error);
  });},
  async kvGet(k){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('kv','readonly'); const q=tx.objectStore('kv').get(k);
    q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error);
  });},
  async kvSet(k,v){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k);
    tx.oncomplete=res; tx.onerror=()=>rej(tx.error);
  });},
  // presentations saved LOCALLY (never cloud): {name, blob, date}
  async mediaAll(){ const db=await this.open(); return new Promise((res,rej)=>{
    if(!db.objectStoreNames.contains('media')) return res([]);
    const tx=db.transaction('media','readonly'); const out=[];
    tx.objectStore('media').openCursor().onsuccess=e=>{const c=e.target.result; if(c){out.push(c.value);c.continue();} else res(out);};
    tx.onerror=()=>rej(tx.error);
  });},
  async mediaAdd(v){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('media','readwrite'); const q=tx.objectStore('media').add(v);
    q.onsuccess=()=>res(q.result); tx.onerror=()=>rej(tx.error);
  });},
  async mediaDel(id){ const db=await this.open(); return new Promise((res,rej)=>{
    const tx=db.transaction('media','readwrite'); tx.objectStore('media').delete(id);
    tx.oncomplete=res; tx.onerror=()=>rej(tx.error);
  });}
};

/* Book files live in the APP's books folder (installed app) + browser copy.
   Same pattern as presentations: window.electron.saveFile('books', ...).
   Plain-browser use keeps the IndexedDB copy (+ download fallback). */
function sanitizeFileName(n){
  n = String(n||'book.pdf').split(/[\\/]/).pop().trim() || 'book.pdf';
  if(!/\.pdf$/i.test(n)) n += '.pdf';
  return n.replace(/[<>:"|?*\x00-\x1F]/g,'').replace(/\s+/g,'-').slice(0,120);
}
async function saveToAppBooks(fileName, blob){
  // Returns the saved disk path, or '' when not in the installed app.
  try{
    if(window.electron){
      const p = await window.electron.saveFile('books', fileName, await blob.arrayBuffer());
      return p || '';
    }
  }catch{}
  return '';
}
function downloadBlob(blob, fileName){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
}

/* Built-in catalogue mirror of data/books.json (currently empty — no static
   books ship with the app; teachers add their own via Import).
   fetch() is blocked on file:// (double-click) in most browsers, so this
   fallback keeps the shelf working everywhere. Keep in sync when editing books.json. */
const BUILTIN_BOOKS = [];

async function loadBooks(){
  BOOKS = [];
  try{
    const r = await fetch('data/books.json');
    if(r.ok){ const j = await r.json(); if(Array.isArray(j) && j.length) BOOKS = j; }
  }catch{}
  if(!BOOKS.length) BOOKS = BUILTIN_BOOKS.slice(); // file:// or missing json
  try{
    IMPORTED = await idb.all();
    IMPORTED.forEach(b=>{ if(b.blob) importUrls.set(b.id, URL.createObjectURL(b.blob)); });
  }catch{ IMPORTED = []; }
  renderBooks();
}
loadBooks();

let bookFilter = 'govt';
$$('.tab').forEach(t=>t.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');bookFilter=t.dataset.filter;renderBooks();});
function renderBooks(){
  if(!$('#bookGrid')) return;
  const cls = curClass();
  const q = ($('#bookSearch').value||'').toLowerCase();
  const grade = cls.replace(/[^0-9]/g,'');
  const list = allBooks().filter(b=>(b.type===bookFilter)&&(b.class==='all'||b.class===grade||b.class===cls)&&((b.title+' '+(b.titleNe||'')).toLowerCase().includes(q)));
  $('#bookGrid').innerHTML = list.map(b=>{
    const key = b.cloud ? 'cloud:'+CLOUD_BOOKS.indexOf(b) : b.imported ? 'imp:'+b.id : 'base:'+BOOKS.indexOf(b);
    const label = escapeHtml(LANG==='ne'&&b.titleNe?b.titleNe:b.title);
    const tag = b.cloud ? ' • ☁ cloud' : b.imported ? ` • ✅ ${I18N[LANG].imported}` : '';
    const cover = b.cloud ? '📘' : b.imported ? '📗' : '📕';
    const where = b.imported ? (b.savedToBooks ? `<div><span class="badge" title="Saved as a real file in the app books folder">📁 ${escapeHtml(b.fileName||'')}</span></div>` : `<div><span class="badge" style="background:#fff7ed;color:#9a3412;border-color:#fed7aa">browser only</span></div>`) : b.cloud ? `<div><span class="badge">☁ ${escapeHtml(b.fileName||b.file_path||'')}</span></div>` : '';
    const actions = b.imported ? `<div style="margin-top:8px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap"><button class="btn ghost save-book" data-savebook="${b.id}" title="Write file into linked /books folder">💾 /books</button><button class="btn ghost del-book" data-delbook="${b.id}">✕ ${I18N[LANG].delete}</button></div>` : b.cloud ? `<div style="margin-top:8px"><button class="btn ghost del-book" data-delcloud="${escapeHtml(b.file_path||b.fileName||'')}">✕ ${I18N[LANG].delete}</button></div>` : '';
    return `<div class="book-card" data-book="${key}"><div class="book-cover">${cover}</div><b>${label}</b><small>${b.class==='all'?'All classes':'Class '+escapeHtml(b.class)} • ${escapeHtml(b.type)}${tag}</small>${where}${actions}</div>`;
  }).join('')
    || `<p class="hint">No books found. Use <b>Import Book</b> or add entries in <code>data/books.json</code>.</p>`;
  prefetchVisibleCloud(list);
}

/* Cloud books auto-download when spotted: visible ☁ cards fetch in the
   background (once per session) and become local 📗 entries. */
const cloudDl = new Set();
async function cacheCloudBook(cb, silent){
  const key = cb && (cb.file_path || cb.fileName);
  if(!key || cloudDl.has(key)) return null;
  if(isBookTombed(key)) return null; // deleted here — never re-download
  if(IMPORTED.some(b=>b.fileName===key)) return null;
  if(!navigator.onLine) return null;
  cloudDl.add(key);
  try{
    if(!(await SB.ready())){ cloudDl.delete(key); return null; }
    const url = SB.bookPublicUrl(key);
    if(!url){ cloudDl.delete(key); return null; }
    const r = await fetch(url);
    if(!r.ok) throw new Error('fetch ' + r.status);
    const blob = await r.blob();
    const rec = { title:cb.title, titleNe:cb.titleNe||'', class:cb.class||'all', type:cb.type||'govt', fileName:key, blob, date:Date.now(), savedToBooks:false, fromCloud:true };
    try{ const p = await saveToAppBooks(key, blob); if(p){ rec.savedToBooks = true; rec.diskPath = p; } }catch{}
    const id = await idb.add(rec); rec.id = id;
    IMPORTED.push(rec); importUrls.set(id, URL.createObjectURL(blob));
    CLOUD_BOOKS = CLOUD_BOOKS.filter(x=>(x.file_path||x.fileName)!==key);
    renderBooks();
    if(!silent) toast('Downloaded ✓ — now works offline');
    return rec;
  }catch{ cloudDl.delete(key); if(!silent) toast('Download failed — check internet'); return null; }
}
function prefetchVisibleCloud(list){
  try{
    if(!window.SB || !SB.configured || !navigator.onLine) return;
    (list||[]).filter(b=>b.cloud).slice(0,10).forEach(b=>cacheCloudBook(b, true));
  }catch{}
}
document.addEventListener('click', async e=>{
  const del = e.target.closest('[data-delbook]');
  if(del){
    e.stopPropagation();
    const b = IMPORTED.find(x=>x.id===+del.dataset.delbook);
    await deleteBookEverywhere({ id:+del.dataset.delbook, fileName:b && b.fileName, label:b && (LANG==='ne'&&b.titleNe?b.titleNe:b.title) });
    return;
  }
  const delc = e.target.closest('[data-delcloud]');
  if(delc){
    e.stopPropagation();
    const fp = delc.dataset.delcloud;
    const b = CLOUD_BOOKS.find(x=>(x.file_path||x.fileName)===fp);
    await deleteBookEverywhere({ id:null, fileName:fp, label:b && (LANG==='ne'&&b.titleNe?b.titleNe:b.title) });
    return;
  }
  const sv = e.target.closest('[data-savebook]');
  if(sv){
    e.stopPropagation();
    const b = IMPORTED.find(x=>x.id===+sv.dataset.savebook);
    if(!b || !b.blob){ toast('File data missing.'); return; }
    try{
      const p = await saveToAppBooks(b.fileName, b.blob);
      if(p){
        b.savedToBooks = true; b.diskPath = p; await idb.put(b); renderBooks();
        toast('Saved to the app books folder ✓');
      } else {
        downloadBlob(b.blob, b.fileName || 'book.pdf');
        toast('Downloaded — move it into the books folder.');
      }
    }catch{ toast('Could not save.'); }
    return;
  }
  const c = e.target.closest('[data-book]');
  if(!c) return;
  const key = c.dataset.book;
  let title, src, blob = null;
  if(key.startsWith('imp:')){
    const b = IMPORTED.find(x=>x.id===+key.slice(4));
    if(!b) return;
    title = LANG==='ne'&&b.titleNe?b.titleNe:b.title;
    blob = b.blob || null;
    src = importUrls.get(b.id) || (blob && URL.createObjectURL(blob)) || ('books/' + b.fileName);
    if(blob) importUrls.set(b.id, src);
  } else if(key.startsWith('cloud:')){
    const b = CLOUD_BOOKS[+key.slice(6)];
    if(!b) return;
    title = LANG==='ne'&&b.titleNe?b.titleNe:b.title;
    // Open the stage NOW (inside the click gesture) so no popup blocker
    // kills it while the download below awaits.
    try{ window.Stage && Stage.open(); }catch{}
    // Cloud books download on first sight, so they work offline afterwards.
    toast('Downloading book…');
    const cached = await cacheCloudBook({ title:b.title, titleNe:b.titleNe, class:b.class, type:b.type, file_path:b.file_path||b.fileName });
    if(cached){
      openBook(importUrls.get(cached.id), LANG==='ne'&&cached.titleNe?cached.titleNe:cached.title, cached.blob);
    } else {
      const stream = (window.SB && SB.bookPublicUrl(b.file_path)) || '';
      if(!stream){ toast('Needs connection + Sync setup.'); return; }
      openBook(stream, title, null);
    }
    return;
  } else {
    const b = BOOKS[+key.slice(5)];
    if(!b) return;
    title = LANG==='ne'&&b.titleNe?b.titleNe:b.title;
    src = 'books/' + b.file;   // OFFLINE: file must exist locally
  }
  openBook(src, title, blob);
});
/* --- Books on the UNIFIED stage: teacher controls here, students see only the open page --- */
let bookBase = '', bookPage = 1, bookBlob = null;
function stagePdfSrc(){
  // Strings pass through; Blobs travel to the stage via postMessage natively.
  if(typeof bookBase === 'string' && (bookBase.startsWith('http') || bookBase.startsWith('file:') || bookBase.startsWith('data:'))) return bookBase;
  if(bookBlob) return bookBlob;
  return bookBase;
}
function openBook(src, title, blob){
  bookBase = src; bookBlob = blob || null; bookPage = 1;
  $('#pdfTitle').textContent = title;
  $('#pdfBookName').textContent = title;
  $('#pdfPage').value = 1;
  $('#pdfBigPage').textContent = '1';
  $('#pdfModal').classList.remove('hidden');
  try{ window.Stage && Stage.showPdf(stagePdfSrc(), 1, title); }catch{}
}
function setBookPage(p){
  bookPage = Math.max(1, p|0 || 1);
  $('#pdfPage').value = bookPage;
  $('#pdfBigPage').textContent = String(bookPage);
  try{ window.Stage && Stage.updatePdfPage(stagePdfSrc(), bookPage); }catch{}
}
$('#pdfPrev').onclick = ()=> setBookPage(bookPage - 1);
$('#pdfNext').onclick = ()=> setBookPage(bookPage + 1);
$('#pdfPage').addEventListener('change', e=> setBookPage(+e.target.value));
// Arrow keys flip the open page while the reader is open (teacher screen drives both)
document.addEventListener('keydown', e=>{
  if($('#pdfModal').classList.contains('hidden')) return;
  if(e.target.matches('input,select,textarea')) return;
  if(e.key==='ArrowRight'){ setBookPage(bookPage+1); }
  if(e.key==='ArrowLeft'){ setBookPage(bookPage-1); }
});
$('#pdfSecondBtn').onclick = ()=>{
  // Same unified stage window used by Present — opens Welcome if nothing loaded.
  try{
    if(!bookBase){ window.Stage && Stage.welcome(); }
    else { window.Stage && Stage.open(); window.Stage && Stage.showPdf(stagePdfSrc(), bookPage, $('#pdfTitle').textContent); }
    toast('2nd screen shows only the open page. Change pages here.');
  }catch{ toast('Could not open 2nd screen (popup blocked?).'); }
};
$('#pdfClose').onclick = ()=>{ $('#pdfModal').classList.add('hidden'); try{ window.Stage && Stage.welcome(); }catch{} bookBase=''; bookBlob=null; };

/* Import flow — writes a real file into /books when the folder is linked */
$('#importBookBtn').onclick = ()=> $('#bookDialog').showModal();
$('#bFile').addEventListener('change', ()=>{
  const f = $('#bFile').files[0];
  if(f && !$('#bFileName').value) $('#bFileName').value = sanitizeFileName(f.name);
});
$('#saveBook').onclick = async (e)=>{
  const file = $('#bFile').files[0];
  const title = $('#bTitle').value.trim();
  if(!title || !file){ toast('Title + PDF required'); e.preventDefault(); return; }
  if(file.type!=='application/pdf' && !/\.pdf$/i.test(file.name)){ toast('Please choose a PDF file'); e.preventDefault(); return; }
  const fileName = sanitizeFileName($('#bFileName').value || file.name);
  const rec = { title, titleNe: $('#bTitleNe').value.trim(), class: $('#bClass').value, type: $('#bType').value, fileName, blob: file, date: Date.now(), savedToBooks:false };
  // 1) Save a REAL file into the app's books folder (installed app, like presentations)
  try{
    const p = await saveToAppBooks(fileName, file);
    if(p){ rec.savedToBooks = true; rec.diskPath = p; }
  }catch{ rec.savedToBooks = false; }
  try{
    const id = await idb.add(rec);
    rec.id = id;
    IMPORTED.push(rec);
    removeBookTomb(rec.fileName); // (re-)importing revives a deleted filename
    importUrls.set(id, URL.createObjectURL(file));
    $('#bookForm').reset();
    bookFilter = rec.type;
    $$('.tab').forEach(x=>x.classList.toggle('active', x.dataset.filter===bookFilter));
    renderBooks();
    // Cloud mirror (other computers) + file upload — presentations stay local.
    try{
      if(window.SB && SB.configured){
        SB.pushBookMeta({ title: rec.title, titleNe: rec.titleNe, class: rec.class, type: rec.type, fileName: rec.fileName });
        SB.uploadBookFile(rec.fileName, file).then(ok=>{ if(ok) toast('Book in cloud ✓ — visible on all computers'); });
      }
    }catch{}
    if(rec.savedToBooks) toast('Stored in the app books folder ✓');
    else if(window.electron) toast('Imported ✓ (kept in browser)');
    else { downloadBlob(file, fileName); toast('Imported ✓ + downloaded — move it into the books folder.'); }
  }catch(err){ toast('Import failed: storage full?'); e.preventDefault(); }
};

/* ---------- 6. Present: files + UNIFIED stage + LOCAL save ---------- */
// slides: {name, url, blob, kind}  — files are kept on THIS computer (IndexedDB
// 'media' + real disk copy when running as installed app). Never uploaded.
let slides = [], curSlide = 0;

$('#presentFiles').addEventListener('change', async e=>{
  const files = [...e.target.files];
  e.target.value = '';
  // Open the stage NOW (inside the file-picker gesture) — parsing below
  // takes seconds, after which browsers would block the popup.
  try{ window.Stage && Stage.open(); }catch{}
  const ppt = files.filter(f=>kindOf(f.name)==='ppt');
  const rest = files.filter(f=>kindOf(f.name)!=='ppt');
  if(rest.length){
    closePptxDeck();
    slides = rest.map(f=>({ name:f.name, url:URL.createObjectURL(f), blob:f, kind:kindOf(f.name) }));
    renderSlides(); showSlide(0);
    for(const f of rest){ await saveLocalMedia(f); }
    renderLocalPres();
  }
  // PowerPoint files render fully offline in the browser (no PowerPoint needed).
  for(const f of ppt){
    if(/\.pptx$/i.test(f.name)) await openPptxFile(f, f.name);
    else toast('Please Save As .pptx first (PowerPoint or free LibreOffice), then choose the .pptx — old .ppt cannot render.');
  }
});
function kindOf(n){ n=n.toLowerCase(); if(/\.(pptx?|odp)$/.test(n))return'ppt'; if(/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(n))return'img'; if(/\.(mp4|webm|mov|mkv)$/.test(n))return'video'; if(/\.pdf$/.test(n))return'pdf'; return'other'; }
// Absolute disk path -> file:// URL for <img>/<iframe> in Electron windows.
function toFileUrl(p){ const s = String(p).replace(/\\/g, '/'); return (s.charAt(0) === '/' ? 'file://' : 'file:///') + encodeURI(s); }
/* Offline PPTX decks: parsed + rendered in the browser (no PowerPoint needed).
   Original file is kept in the local library; slides re-render on demand. */
let pptxDeck = null; // {viewer, count, name}
function closePptxDeck(){
  try{ if(pptxDeck) window.CoachPptx && CoachPptx.close(pptxDeck); }catch{}
  pptxDeck = null;
  const box = document.querySelector('#pptxBox');
  if(box) box.innerHTML = '';
}
async function openPptxFile(fileOrBlob, name){
  if(!window.CoachPptx){ toast('Slide engine failed to load.'); return; }
  closePptxDeck();
  stopTeacherVideoSync();
  toast('Reading ' + name + '… (first .pptx loads the offline engine once)');
  $('#stage').innerHTML = '<div id="pptxBox" class="pptx-box"></div>';
  try{
    const buf = fileOrBlob instanceof Blob ? await fileOrBlob.arrayBuffer() : fileOrBlob;
    const deck = await CoachPptx.open(buf, document.querySelector('#pptxBox'));
    if(!deck.count) throw new Error('no slides');
    pptxDeck = Object.assign(deck, { name });
    slides = Array.from({ length: deck.count }, (_, i) => ({ name:`${name} — slide ${i+1}`, kind:'slide', idx:i }));
    curSlide = 0; renderSlides(); await showSlide(0);
    // keep the original file locally (never uploaded)
    try{
      const blob = fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob], { type:'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const known = await idb.mediaAll();
      if(!known.some(m=>m.kind==='pptx' && m.name===name)) await idb.mediaAdd({ name, kind:'pptx', blob, date:Date.now() });
    }catch{}
    renderLocalPres();
    toast(`Opened ✓ ${deck.count} slides (offline)`);
  }catch(err){ toast('Could not read this .pptx (' + String((err&&err.message)||err).slice(0,80) + ')'); }
}
async function showDeckSlide(s){
  if(!pptxDeck){ toast('Deck closed — reopen it.'); return; }
  let stageWin = null;
  try{ stageWin = window.Stage && Stage.open(); }catch{}
  try{
    await CoachPptx.goTo(pptxDeck, s.idx);
    const box = document.querySelector('#pptxBox');
    const shot = await CoachPptx.slideHtml(pptxDeck, box);
    try{ window.Stage && Stage.showDeckHtml({ html:shot.html, w:shot.w, h:shot.h, idx:s.idx, count:pptxDeck.count, title:pptxDeck.name }); }catch{}
    if(!stageWin && window.toast) toast('2nd screen blocked — allow popups, then press Next.');
  }catch(err){ toast('Could not render this slide (' + String((err&&err.message)||err).slice(0,60) + ')'); }
}
async function saveLocalMedia(file){
  try{ await idb.mediaAdd({ name:file.name, kind:kindOf(file.name), blob:file, date:Date.now() }); }catch{}
  try{
    if(window.electron){
      const buf = await file.arrayBuffer();
      await window.electron.saveFile('presentations', sanitizeFileName(file.name), buf);
    }
  }catch{}
}
async function renderLocalPres(){
  const box = $('#localPresList'); if(!box) return;
  let items = [];
  try{ items = await idb.mediaAll(); }catch{}
  box.innerHTML = items.length ? items.slice().reverse().map(m=>{
    const icon = m.kind==='deck' ? `🎞️ ${escapeHtml(m.name)} (${(m.slides||[]).length} slides)` : m.kind==='pptx' ? '📊' : m.kind==='embed' ? '🔗' : '📄';
    const label = m.kind==='deck' ? icon : `${icon} ${escapeHtml(m.name)}`;
    return `<div class="local-item"><span>${label}</span><button data-openmedia="${m.id}">Open</button><button data-delmedia="${m.id}">✕</button></div>`;
  }).join('') : '<span class="hint">No saved presentations yet.</span>';
}
document.addEventListener('click', async e=>{
  const om = e.target.closest('[data-openmedia]');
  if(om){
    try{ window.Stage && Stage.open(); }catch{} // keep the popup inside the click gesture
    let items = []; try{ items = await idb.mediaAll(); }catch{}
    const m = items.find(x=>x.id===+om.dataset.openmedia);
    if(!m) return;
    if(m.kind === 'pptx' && m.blob){ closePptxDeck(); await openPptxFile(m.blob, m.name); return; }
    if(m.kind === 'embed' && m.url){
      closePptxDeck();
      slides = [{ name:m.name, url:m.url, kind:'embed' }];
      curSlide = 0; renderSlides(); showSlide(0);
      return;
    }
    if(m.kind === 'deck'){
      // Re-converted slide images live on disk (local by design).
      const paths = (m.slides || []).filter(p=>!!p);
      if(!paths.length){ toast('Deck files missing.'); return; }
      slides = paths.map((p,i)=>({ name:`${m.name} — slide ${i+1}`, url:toFileUrl(p), kind:'img' }));
      curSlide = 0; renderSlides(); showSlide(0);
      toast(`Opened ${m.name} (${paths.length} slides)`);
      return;
    }
    if(!m.blob) return;
    slides = [{ name:m.name, url:URL.createObjectURL(m.blob), blob:m.blob, kind:m.kind || kindOf(m.name) }];
    curSlide = 0; renderSlides(); showSlide(0);
    return;
  }
  const dm = e.target.closest('[data-delmedia]');
  if(dm){
    let items = []; try{ items = await idb.mediaAll(); }catch{}
    const m = items.find(x=>x.id===+dm.dataset.delmedia);
    try{ await idb.mediaDel(+dm.dataset.delmedia); }catch{}
    try{ if(m && m.kind==='deck' && m.dir && window.electron) await window.electron.removeDir(m.dir); }catch{}
    renderLocalPres(); return;
  }
});
function renderSlides(){
  $('#slideList').innerHTML = slides.map((s,i)=>{
    if(s.kind==='img') return `<img class="slide-thumb ${i===curSlide?'active':''}" data-i="${i}" src="${s.url}" title="${escapeHtml(s.name)}"/>`;
    if(s.kind==='slide') return `<button class="btn ghost slide-num ${i===curSlide?'active':''}" data-i="${i}" title="${escapeHtml(s.name)}">${(s.idx||0)+1}</button>`;
    const icon = s.kind==='video' ? '🎬' : s.kind==='embed' ? '🔗' : s.kind==='ppt' ? '📊' : '📄';
    return `<button class="btn ghost" data-i="${i}">${icon} ${escapeHtml(String(s.name).slice(0,14))}</button>`;
  }).join('') || '<span class="hint">No files yet.</span>';
}
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-i]');
  if(t) showSlide(+t.dataset.i);
});
function stageHtml(s){
  if(!s) return '';
  if(s.kind==='img') return `<img src="${s.url}" alt="slide"/>`;
  if(s.kind==='video') return `<video src="${s.url}" controls autoplay></video>`;
  if(s.kind==='pdf') return `<iframe src="${s.url}"></iframe>`;
  if(s.kind==='embed') return `<iframe src="${escapeHtml(s.url)}" allowfullscreen style="background:#fff"></iframe>`;
  if(s.kind==='ppt') return `<p class="hint">Converting ${escapeHtml(s.name)}…</p>`;
  return `<p class="hint">Preview not available offline for ${escapeHtml(s.name)}. Open in PowerPoint.</p>`;
}
function showSlide(i){
  if(!slides.length) return;
  curSlide = (i+slides.length)%slides.length;
  const s = slides[curSlide];
  // PPTX deck slides render inside the persistent viewer box — never wipe it.
  if(s.kind === 'slide'){ renderSlides(); showDeckSlide(s); return; }
  stopTeacherVideoSync();
  if(pptxDeck) closePptxDeck();
  $('#stage').innerHTML = stageHtml(s);
  renderSlides();
  // SAME unified 2nd-screen window as books:
  try{
    if(!window.Stage) return;
    if(s.kind==='img') Stage.showImage(s.blob || s.url);
    else if(s.kind==='video'){ Stage.showVideo(s.blob || s.url); wireTeacherVideo(); }
    else if(s.kind==='pdf') Stage.showPdf(s.blob || s.url, 1, s.name);
    else if(s.kind==='embed') Stage.showUrl(s.url, s.name);
    else toast('This file type opens in PowerPoint, not on the stage.');
  }catch{}
}
/* Teacher's preview player is the master — every control mirrors to the stage. */
let teacherVideoEl = null;
function stopTeacherVideoSync(){
  try{ if(teacherVideoEl && teacherVideoEl._syncH) clearInterval(teacherVideoEl._syncH); }catch{}
  teacherVideoEl = null;
}
function wireTeacherVideo(){
  const tv = document.querySelector('#stage video');
  if(!tv || !window.Stage) return;
  teacherVideoEl = tv;
  const send = () => {
    try{ Stage.videoState({ time: tv.currentTime || 0, paused: tv.paused,
      rate: tv.playbackRate || 1, volume: tv.volume, muted: tv.muted }); }catch{}
  };
  tv.addEventListener('loadedmetadata', send);
  tv.addEventListener('play', send);
  tv.addEventListener('pause', send);
  tv.addEventListener('seeked', send);
  tv.addEventListener('ratechange', send);
  tv.addEventListener('volumechange', send);
  clearInterval(tv._syncH);
  tv._syncH = setInterval(()=>{ if(!tv.paused && !tv.ended) send(); }, 4000); // drift correction
}
// Stage → teacher notices (e.g. 2nd screen muted itself to allow autoplay).
window.addEventListener('message', e=>{
  if(e.data && e.data.__coachStageBack === 'muted')
    toast('2nd screen muted by browser — click the stage video once for sound.');
});
$('#prevSlide').onclick = ()=>showSlide(curSlide-1);
$('#nextSlide').onclick = ()=>showSlide(curSlide+1);
document.addEventListener('keydown', e=>{
  if(!$('#page-present').classList.contains('active')) return;
  if($('#pdfModal') && !$('#pdfModal').classList.contains('hidden')) return;
  if(e.target.matches('input,select,textarea')) return;
  if(e.key==='ArrowRight') showSlide(curSlide+1);
  if(e.key==='ArrowLeft') showSlide(curSlide-1);
});
$('#fullscreenBtn').onclick = ()=>{ const st=$('#stage'); document.fullscreenElement?document.exitFullscreen():st.requestFullscreen?.(); };

/* Unified 2nd screen: content auto-opens it; top button shows Welcome idle */
$('#secondScreenBtnTop').onclick = ()=>{ try{ window.Stage && Stage.welcome(); toast('2nd screen: Welcome. Open a book or slides to present.'); }catch{} };
async function updateScreenInfo(){
  try{
    if(window.getScreenDetails){
      const d = await window.getScreenDetails();
      $('#screenInfo').textContent = d.screens.length + ' screens';
    } else $('#screenInfo').textContent = 'screens: ?';
  }catch{}
}

/* "New presentation" opens this computer's file window (images/video/PDF/.pptx). */
$('#newPptBtn').onclick = ()=>{ $('#presentFiles').click(); };

/* Team page — movie credits roll 🎬 */
function resetCredits(){
  const inner = $('#movieInner');
  if(!inner) return;
  inner.classList.remove('rolling');
  inner.style.paddingTop = '';
  inner.style.animationDuration = '';
  inner.style.transform = '';
  const btn = $('#creditsPlay span');
  if(btn) btn.textContent = (I18N[LANG] && I18N[LANG].playCredits) || 'Play credits';
}
$('#creditsPlay').onclick = ()=>{
  const box = $('#movieBox'), inner = $('#movieInner');
  if(!box || !inner) return;
  if(inner.classList.contains('rolling')){ resetCredits(); return; } // Stop
  // Start below the frame, then roll up like end credits
  inner.style.paddingTop = box.clientHeight + 'px';
  inner.style.transform = '';
  void inner.offsetWidth; // restart animation
  const total = inner.scrollHeight;
  inner.style.animationDuration = Math.max(12, Math.round(total / 45)) + 's';
  inner.classList.add('rolling');
  const btn = $('#creditsPlay span');
  if(btn) btn.textContent = (I18N[LANG] && I18N[LANG].stopCredits) || 'Stop';
  inner.onanimationend = resetCredits;
};
const _syncBtn = $('#syncBtn');
if(_syncBtn) _syncBtn.onclick = ()=>{
  const dlg = $('#syncDialog');
  try{
    const cfg = JSON.parse(localStorage.getItem('coach-supabase')||'null');
    if(cfg){ $('#sbUrl').value = cfg.url||''; $('#sbKey').value = cfg.anonKey||''; }
  }catch{}
  updateSyncStatusLine();
  dlg.showModal();
};
/* ---------- Backup & restore: everything in one JSON file ---------- */
function updateSyncStatusLine(){
  const el = $('#syncStatus'); if(!el) return;
  const on = window.SB && SB.configured;
  el.textContent = 'Status: ' + (on ? 'connected (' + SB.state + ') — students/marks/books sync across computers' : 'local only — enter Supabase details to sync');
}
$('#syncSave').onclick = async (e)=>{
  const url = $('#sbUrl').value.trim(), key = $('#sbKey').value.trim();
  if(!url || !key){ toast('Paste Supabase URL + anon key'); e.preventDefault(); return; }
  try{
    await SB.configure(url, key);
    const data = await SB.pullAll();
    if(data) mergeCloud(data);
    updateSyncStatusLine();
    toast('Connected ✓ — synced with cloud');
  }catch{ toast('Connect failed — check URL/key + internet'); e.preventDefault(); }
};
$('#syncForget').onclick = ()=>{ try{ window.SB && SB.forget(); }catch{} updateSyncStatusLine(); };

/* ---------- Backup & restore: everything in one JSON file ---------- */
function blobToDataUrl(blob){
  return new Promise((res, rej)=>{ const r = new FileReader(); r.onload = ()=>res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
}
async function dataUrlToBlob(d){
  if(typeof d !== 'string' || !d.startsWith('data:')) return null;
  try{ return await (await fetch(d)).blob(); }catch{ return null; }
}
async function idbClear(storeName){
  const db = await idb.open();
  return new Promise((res, rej)=>{
    if(!db.objectStoreNames.contains(storeName)) return res();
    const tx = db.transaction(storeName, 'readwrite');
    const st = tx.objectStore(storeName);
    const q = st.openCursor();
    q.onsuccess = e=>{ const c = e.target.result; if(c){ st.delete(c.primaryKey); c.continue(); } };
    tx.oncomplete = res; tx.onerror = ()=>rej(tx.error);
  });
}
const BACKUP_LS_PREFIXES = ['coach-students', 'marks-', 'coach-subjects', 'coach-subject-list', 'coach-exams', 'coach-exam', 'coach-ppts', 'coach-class', 'coach-lang', 'coach-supabase', 'coach-deleted-students', 'coach-deleted-books'];
$('#backupBtn').onclick = ()=>{
  $('#backupStatus').textContent = '—';
  $('#backupDialog').showModal();
};
$('#exportBkBtn').onclick = async (e)=>{
  e.preventDefault();
  toast('Packing backup…');
  try{
    const ls = {};
    for(let i = 0; i < localStorage.length; i++){
      const k = localStorage.key(i);
      if(BACKUP_LS_PREFIXES.some(p=>k === p || k.startsWith(p))) ls[k] = localStorage.getItem(k);
    }
    const books = await idb.all();
    for(const b of books){ if(b.blob instanceof Blob) b.blob = await blobToDataUrl(b.blob); }
    let media = [];
    try{
      media = await idb.mediaAll();
      for(const m of media){ if(m.blob instanceof Blob) m.blob = await blobToDataUrl(m.blob); }
    }catch{}
    const payload = { app:'coach-dashboard', version:1, date:new Date().toISOString(), ls, books, media };
    const text = JSON.stringify(payload);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    downloadBlob(new Blob([text], { type:'application/json' }), `coach-backup-${stamp}.json`);
    const mb = (text.length / 1048576).toFixed(1);
    $('#backupStatus').textContent = `Exported ✓ (${mb} MB, ${books.length} books, ${media.length} presentations)`;
    // reload live objects (we replaced blobs with dataURLs above)
    IMPORTED = await idb.all();
    importUrls.clear();
    IMPORTED.forEach(b=>{ if(b.blob) importUrls.set(b.id, URL.createObjectURL(b.blob)); });
    renderBooks();
  }catch(err){ $('#backupStatus').textContent = 'Export failed: ' + String((err && err.message) || err).slice(0, 100); }
};
$('#backupFile').addEventListener('change', async e=>{
  const f = e.target.files[0];
  e.target.value = '';
  if(!f) return;
  $('#backupStatus').textContent = 'Restoring…';
  try{
    const payload = JSON.parse(await f.text());
    if(!payload || payload.app !== 'coach-dashboard') throw new Error('not a Coach backup file');
    for(const [k, v] of Object.entries(payload.ls || {})) localStorage.setItem(k, v);
    await idbClear('books');
    let skippedBooks = 0;
    for(const b of payload.books || []){
      if(!b.fileName){ skippedBooks++; continue; }
      const blob = await dataUrlToBlob(b.blob);
      if(!blob){ skippedBooks++; continue; }
      await idb.add({ title:b.title || b.fileName, titleNe:b.titleNe || '', class:b.class || 'all', type:b.type || 'govt', fileName:b.fileName, blob, date:b.date || Date.now(), savedToBooks:!!b.savedToBooks, diskPath:b.diskPath || '', fromCloud:!!b.fromCloud });
    }
    await idbClear('media');
    for(const m of payload.media || []){
      if(!m.name) continue;
      const blob = await dataUrlToBlob(m.blob);
      await idb.mediaAdd({ name:m.name, kind:m.kind || 'other', blob:blob || m.blob || null, dir:m.dir || '', slides:m.slides || [], date:m.date || Date.now() });
    }
    // reload + repaint everything
    IMPORTED = await idb.all();
    importUrls.clear();
    IMPORTED.forEach(b=>{ if(b.blob instanceof Blob) importUrls.set(b.id, URL.createObjectURL(b.blob)); });
    applyLang();
    try{ $('#studentsClassChip').textContent = curClass(); }catch{}
    try{ migrateLegacyMarks(); }catch{}
    renderExamSelect();
    renderStudents(); renderBooks(); renderLocalPres(); renderMarks();
    // push the restored state to the cloud so other PCs catch up
    try{
      if(window.SB && SB.configured){
        SB.pushStudents(store.students);
        for(const ex of getExams())
          for(const s of store.students) SB.pushMarks(s.cls, s.roll, store.marks(s.cls, s.roll, ex.id), ex.id);
        for(const b of IMPORTED) SB.pushBookMeta({ title:b.title, titleNe:b.titleNe, class:b.class, type:b.type, fileName:b.fileName });
      }
    }catch{}
    $('#backupStatus').textContent = `Restored ✓ (${(payload.books || []).length} books, ${(payload.media || []).length} presentations)`;
    toast('Backup restored ✓');
  }catch(err){ $('#backupStatus').textContent = 'Restore failed: ' + String((err && err.message) || err).slice(0, 120); }
});
// Cloud → local merge (local-first: only fills in what this computer lacks)
function mergeCloud(data){
  try{
    if(data.students && data.students.length){
      const local = store.students;
      const have = new Set(local.map(s=>s.cls+'|'+s.roll));
      const add = data.students
        .filter(s=>!have.has(s.class+'|'+s.roll) && !isTombed(s.class, s.roll))
        .map(s=>({roll:s.roll,name:s.name,cls:s.class}));
      if(add.length){ store.students = [...local, ...add]; renderStudents(); }
    }
    if(data.marks && data.marks.length){
      let touchedActive = false;
      for(const m of data.marks){
        const ex = m.exam || 'e1';
        const cur = store.marks(m.class, m.roll, ex);
        const suf = /^(.+)::(TH|PR)$/.exec(m.subject || '');
        if(suf){
          const sub = suf[1], part = suf[2].toLowerCase();
          const curV = (cur[sub] != null && typeof cur[sub] === 'object') ? { ...cur[sub] }
            : (cur[sub] === undefined ? {} : { th:cur[sub] });
          // fill only parts never set here; null = teacher cleared it on purpose
          if(curV[part] === undefined){ curV[part] = m.score; cur[sub] = curV; store.saveMarks(m.class, m.roll, cur, ex); if(ex === activeExamId()) touchedActive = true; }
        } else if(!(m.subject in cur)){ cur[m.subject] = m.score; store.saveMarks(m.class, m.roll, cur, ex); if(ex === activeExamId()) touchedActive = true; } // legacy theory
      }
      if(touchedActive) renderMarks();
    }
    if(data.books){
      const known = new Set([...BOOKS.map(b=>b.file), ...IMPORTED.map(b=>b.fileName)]);
      CLOUD_BOOKS = data.books
        .filter(b=>!known.has(b.file_path) && !isBookTombed(b.file_path))
        .map(b=>({ title:b.title, titleNe:b.title_ne, class:b.class, type:b.type, fileName:b.file_path, file_path:b.file_path }));
      renderBooks();
    }
  }catch{}
}
window.addEventListener('coach:cloud-pull', e=>{ if(e.detail) mergeCloud(e.detail); });
// First pull shortly after start (if configured + online)
try{ migrateLegacyMarks(); }catch{}
renderExamSelect();
setTimeout(async ()=>{
  try{
    if(window.SB && SB.configured && navigator.onLine){
      const data = await SB.pullAll();
      if(data) mergeCloud(data);
    }
  }catch{}
  renderLocalPres();
}, 2500);
// In-app update notice (installed app only)
try{
  if(window.electron && window.electron.onUpdateDownloaded){
    window.electron.onUpdateDownloaded(()=>{ $('#updateBar').classList.remove('hidden'); });
    $('#updateNow').onclick = ()=> window.electron.quitAndInstall();
  }
}catch{}
