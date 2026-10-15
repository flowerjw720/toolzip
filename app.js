const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const tools = [
{id:'calc',name:'계산기',desc:'일반 계산을 빠르고 간편하게',cat:'계산',icon:'＋',bg:'#efedff',color:'#6958e8'},
{id:'percent',name:'퍼센트 계산기',desc:'비율과 증감률을 간편하게 계산',cat:'계산',icon:'%',bg:'#e7f8f1',color:'#1a9a72'},
{id:'date',name:'날짜 계산기',desc:'두 날짜 사이의 기간 계산',cat:'계산',icon:'▦',bg:'#e8f2ff',color:'#3d7de0'},
{id:'unit',name:'단위 변환기',desc:'길이·무게·온도 단위 변환',cat:'계산',icon:'⇄',bg:'#fff1df',color:'#c27b23'},
{id:'currency',name:'환율 계산기',desc:'주요 통화 금액 변환하기',cat:'계산',icon:'₩',bg:'#e5f8ee',color:'#178b61'},
{id:'counter',name:'글자 수 세기',desc:'글자 수와 공백 포함 여부 확인',cat:'텍스트',icon:'≡',bg:'#eaf0ff',color:'#5070d5'},
{id:'compare',name:'텍스트 비교',desc:'두 문장의 차이 확인하기',cat:'텍스트',icon:'⇄',bg:'#fff0e9',color:'#cf7147'},
{id:'translate',name:'문장 번역',desc:'Google 번역으로 이어서 번역',cat:'텍스트',icon:'文',bg:'#e9f8f8',color:'#168c94'},
{id:'random',name:'랜덤 뽑기',desc:'이름이나 항목 중 하나 뽑기',cat:'랜덤',icon:'✳',bg:'#fceafa',color:'#bc52a7'},
{id:'teams',name:'랜덤 팀 나누기',desc:'인원을 무작위로 팀에 배정',cat:'랜덤',icon:'♧',bg:'#eaf8e8',color:'#529c45'},
{id:'number',name:'랜덤 숫자',desc:'범위 안에서 숫자 뽑기',cat:'랜덤',icon:'⑨',bg:'#fff5d9',color:'#bb8a18'},
{id:'roulette',name:'룰렛',desc:'빙글빙글 돌아가는 원형 룰렛',cat:'랜덤',icon:'◉',bg:'#ffe9ed',color:'#d74c6c'},
{id:'timer',name:'타이머 & 스톱워치',desc:'집중 시간과 경과 시간 측정',cat:'생산성',icon:'◷',bg:'#e9edff',color:'#5868d9'},
{id:'memo',name:'메모장',desc:'메모를 브라우저에 자동 저장',cat:'생산성',icon:'▤',bg:'#fff4d9',color:'#bd8d24'},
{id:'todo',name:'할 일 목록',desc:'오늘 할 일을 체크하며 관리',cat:'생산성',icon:'✓',bg:'#e3f8ef',color:'#218d6a'},
{id:'password',name:'비밀번호 생성',desc:'원하는 길이의 안전한 비밀번호',cat:'생산성',icon:'⌑',bg:'#f0eaff',color:'#8059ce'}
];
let currentView='home', currentCategory='', recent=JSON.parse(localStorage.getItem('tz_recent')||'[]'), favorites=JSON.parse(localStorage.getItem('tz_favorites')||'[]'), rouletteItems=[], wheelAngle=0, spinning=false, timerInterval=null, stopwatchInterval=null, timerRemaining=0, stopwatchStart=0, stopwatchElapsed=0;
const icons = {'calc':'＋','percent':'%','date':'▦','unit':'⇄','currency':'₩','counter':'≡','compare':'⇄','translate':'文','random':'✳','teams':'♧','number':'⑨','roulette':'◉','timer':'◷','memo':'▤','todo':'✓','password':'⌑'};
function renderTools(){
 const query=$('#searchInput').value.trim().toLowerCase();
 let list=tools.filter(t=>{
   const match=(t.name+' '+t.desc+' '+t.cat).toLowerCase().includes(query);
   const cat=!currentCategory||t.cat===currentCategory;
   const view=currentView==='favorites'?favorites.includes(t.id):currentView==='recent'?recent.includes(t.id):true;
   return match&&cat&&view;
 });
 $('#toolGrid').innerHTML=list.map(t=>`<article class="tool-card" data-open="${t.id}" tabindex="0" role="button" aria-label="${t.name} 열기">
 <div class="tool-card-top"><span class="tool-icon" style="--icon-bg:${t.bg};--icon-color:${t.color}">${t.icon}</span><button class="favorite-btn ${favorites.includes(t.id)?'is-favorite':''}" data-fav="${t.id}" aria-label="즐겨찾기">${favorites.includes(t.id)?'★':'☆'}</button></div>
 <h3>${t.name}</h3><p>${t.desc}</p><span class="tool-arrow">↗</span></article>`).join('');
 $('#toolCount').textContent=`${list.length}개`;
 $('#emptyState').classList.toggle('hidden',list.length>0);
 $('#sectionTitle').firstChild.textContent=currentView==='favorites'?'즐겨찾기':currentView==='recent'?'최근 사용':currentCategory||'모든 도구';
}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2300)}
function openTool(id){
 const t=tools.find(x=>x.id===id);if(!t)return;
 recent=[id,...recent.filter(x=>x!==id)].slice(0,8);localStorage.setItem('tz_recent',JSON.stringify(recent));renderTools();
 $('#modalTitle').textContent=t.name;$('#modalCategory').textContent=t.cat.toUpperCase()+' TOOL';$('#modalBody').innerHTML=toolMarkup(id);
 $('#toolModal').classList.remove('hidden');
 initTool(id);
}
function closeTool(){$('#toolModal').classList.add('hidden');if(timerInterval){clearInterval(timerInterval);timerInterval=null}if(stopwatchInterval){clearInterval(stopwatchInterval);stopwatchInterval=null}}
function field(label,id,placeholder='',type='text'){return `<div class="form-group"><label class="field-label" for="${id}">${label}</label><input class="field" id="${id}" type="${type}" placeholder="${placeholder}"></div>`}
function select(label,id,opts){return `<div class="form-group"><label class="field-label" for="${id}">${label}</label><select class="field-select" id="${id}">${opts.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></div>`}
function toolMarkup(id){
 switch(id){
 case 'calc':return `${field('계산식','calcInput','예: 12 * (3 + 4)')}<div class="btn-row"><button class="btn" id="calcGo">계산하기</button><button class="btn ghost" id="calcClear">지우기</button></div><div class="result-box hidden" id="calcResult"></div><p class="muted-note">숫자와 + − × ÷, 괄호를 사용할 수 있어요. 입력한 수식은 기기 안에서 계산돼요.</p>`;
 case 'percent':return `<div class="inline-fields">${field('전체 값','percentTotal','전체 값','number')}${field('비율 (%)','percentRate','비율','number')}</div><div class="btn-row"><button class="btn" id="percentGo">계산하기</button></div><div class="result-box hidden" id="percentResult"></div>`;
 case 'date':return `<div class="inline-fields">${field('시작 날짜','dateStart','','date')}${field('종료 날짜','dateEnd','','date')}</div><div class="btn-row"><button class="btn" id="dateGo">기간 계산</button></div><div class="result-box hidden" id="dateResult"></div>`;
 case 'unit':return `${select('변환 종류','unitKind',[['length','길이'],['weight','무게'],['temperature','온도']])}<div class="inline-fields">${field('변환할 값','unitValue','값','number')}${select('변환 전','unitFrom', [['m','미터 (m)'],['km','킬로미터 (km)'],['cm','센티미터 (cm)'],['mm','밀리미터 (mm)']])}${select('변환 후','unitTo',[['km','킬로미터 (km)'],['m','미터 (m)'],['cm','센티미터 (cm)'],['mm','밀리미터 (mm)']])}</div><div class="btn-row"><button class="btn" id="unitGo">변환하기</button></div><div class="result-box hidden" id="unitResult"></div>`;
 case 'currency':return `<div class="currency-head"><span class="muted-note">주요 통화 간 금액을 변환해요.</span><span class="rate-pill" id="rateStatus">환율 확인 전</span></div>${field('금액','currencyAmount','변환할 금액','number')}<div class="inline-fields">${select('보내는 통화','currencyFrom',[['KRW','🇰🇷 한국 원 (KRW)'],['USD','🇺🇸 미국 달러 (USD)'],['JPY','🇯🇵 일본 엔 (JPY)'],['EUR','🇪🇺 유로 (EUR)'],['CNY','🇨🇳 중국 위안 (CNY)'],['GBP','🇬🇧 영국 파운드 (GBP)'],['CAD','🇨🇦 캐나다 달러 (CAD)'],['AUD','🇦🇺 호주 달러 (AUD)']])}${select('받는 통화','currencyTo',[['USD','🇺🇸 미국 달러 (USD)'],['KRW','🇰🇷 한국 원 (KRW)'],['JPY','🇯🇵 일본 엔 (JPY)'],['EUR','🇪🇺 유로 (EUR)'],['CNY','🇨🇳 중국 위안 (CNY)'],['GBP','🇬🇧 영국 파운드 (GBP)'],['CAD','🇨🇦 캐나다 달러 (CAD)'],['AUD','🇦🇺 호주 달러 (AUD)']])}</div><div class="btn-row"><button class="btn" id="currencyGo">환율 계산하기</button><button class="btn secondary" id="currencyRefresh">최신 환율 불러오기</button></div><div class="result-box hidden" id="currencyResult"></div><p class="muted-note" id="currencyNote">환율은 인터넷 연결 시 공개 환율 API에서 불러옵니다. 실제 은행·환전소 적용 환율 및 수수료와 다를 수 있어요.</p>`;
 case 'counter':return `<div class="form-group"><label class="field-label" for="counterText">텍스트</label><textarea class="field-area" id="counterText" placeholder="글자를 입력하거나 붙여 넣으세요."></textarea></div><div class="inline-fields"><div class="result-box">글자 수 <strong id="counterAll">0</strong></div><div class="result-box">공백 제외 <strong id="counterNoSpace">0</strong></div><div class="result-box">단어 수 <strong id="counterWords">0</strong></div><div class="result-box">줄 수 <strong id="counterLines">0</strong></div></div>`;
 case 'compare':return `<div class="inline-fields"><div class="form-group"><label class="field-label" for="compareA">원본</label><textarea class="field-area" id="compareA" placeholder="첫 번째 문장을 입력하세요."></textarea></div><div class="form-group"><label class="field-label" for="compareB">비교할 글</label><textarea class="field-area" id="compareB" placeholder="두 번째 문장을 입력하세요."></textarea></div></div><div class="btn-row"><button class="btn" id="compareGo">비교하기</button></div><div class="result-box hidden" id="compareResult"></div>`;
 case 'translate':return `<p class="muted-note">번역은 온라인 번역 서비스에서 진행돼요.</p>${field('번역할 문장','translateText','문장을 입력하세요.')}${select('번역 언어','translateLang',[['en','영어'],['ko','한국어'],['ja','일본어'],['zh-CN','중국어(간체)'],['es','스페인어'],['fr','프랑스어']])}<div class="btn-row"><button class="btn" id="translateGo">Google 번역에서 열기 ↗</button></div>`;
 case 'random':return `<div class="form-group"><label class="field-label" for="randomItems">뽑을 항목</label><textarea class="field-area" id="randomItems" placeholder="항목을 한 줄에 하나씩 입력하세요."></textarea></div><div class="btn-row"><button class="btn" id="randomGo">하나 뽑기</button></div><div class="result-box hidden" id="randomResult"></div>`;
 case 'teams':return `<div class="form-group"><label class="field-label" for="teamNames">참가자</label><textarea class="field-area" id="teamNames" placeholder="이름을 한 줄에 하나씩 입력하세요."></textarea></div>${field('팀 수','teamCount','예: 3','number')}<div class="btn-row"><button class="btn" id="teamsGo">팀 나누기</button></div><div class="result-box hidden" id="teamsResult"></div>`;
 case 'number':return `<div class="inline-fields">${field('최솟값','numMin','최솟값','number')}${field('최댓값','numMax','최댓값','number')}</div><div class="btn-row"><button class="btn" id="numberGo">숫자 뽑기</button></div><div class="result-box hidden" id="numberResult"></div>`;
 case 'roulette':return `<div class="form-group"><label class="field-label" for="rouletteInput">룰렛 항목</label><textarea class="field-area" id="rouletteInput" placeholder="항목을 한 줄에 하나씩 입력하세요."></textarea></div><div class="btn-row"><button class="btn secondary" id="rouletteApply">룰렛 만들기</button></div><div class="roulette-wrap"><div class="wheel-stage"><div class="wheel-pointer"></div><canvas id="rouletteCanvas" width="700" height="700" aria-label="룰렛판"></canvas><div class="wheel-center">T</div></div><div class="wheel-actions"><button class="btn" id="rouletteSpin">룰렛 돌리기</button><button class="btn ghost" id="rouletteReset">초기화</button></div></div><div class="result-box hidden" id="rouletteResult"></div><p class="muted-note">항목을 입력하고 ‘룰렛 만들기’를 누른 뒤 돌려 보세요. 결과는 룰렛 포인터가 가리키는 칸으로 결정돼요.</p>`;
 case 'timer':return `<div class="inline-fields">${field('분','timerMin','분','number')}${field('초','timerSec','초','number')}</div><div class="result-box" id="timerDisplay">00:00</div><div class="btn-row"><button class="btn" id="timerStart">타이머 시작</button><button class="btn ghost" id="timerReset">초기화</button></div><hr style="border:0;border-top:1px solid var(--line);margin:23px 0"><div class="eyebrow muted">STOPWATCH</div><div class="result-box" id="stopwatchDisplay">00:00.0</div><div class="btn-row"><button class="btn secondary" id="stopwatchStart">시작</button><button class="btn ghost" id="stopwatchReset">초기화</button></div>`;
 case 'memo':return `<div class="form-group"><label class="field-label" for="memoText">내 메모</label><textarea class="field-area" id="memoText" style="min-height:220px" placeholder="메모를 입력하세요. 입력한 내용은 이 브라우저에 자동 저장돼요."></textarea></div><div class="btn-row"><button class="btn ghost" id="memoClear">메모 지우기</button><span class="muted-note" id="memoStatus">자동 저장</span></div>`;
 case 'todo':return `<div class="inline-fields">${field('새 할 일','todoInput','할 일을 입력하세요.') }<div class="form-group" style="display:flex;align-items:end"><button class="btn" id="todoAdd" style="width:100%">추가하기</button></div></div><div id="todoList"></div><p class="muted-note">할 일 목록은 이 브라우저에 저장돼요.</p>`;
 case 'password':return `${field('비밀번호 길이','passwordLength','길이 (8~64)','number')}<div class="form-group"><label class="field-label"><input type="checkbox" id="passwordSymbols" checked> 기호 포함</label></div><div class="btn-row"><button class="btn" id="passwordGo">생성하기</button></div><div class="result-box hidden" id="passwordResult"></div><div class="btn-row"><button class="btn secondary hidden" id="passwordCopy">복사하기</button></div>`;
 default:return '<p>준비 중인 도구입니다.</p>';
 }
}
function showResult(id,text){const el=$('#'+id);el.textContent=text;el.classList.remove('hidden')}
function initTool(id){
 if(id==='calc'){
 $('#calcGo').onclick=()=>{let s=$('#calcInput').value.trim();if(!s)return toast('계산식을 입력해 주세요.');if(!/^[0-9+\-*/().%\s]+$/.test(s))return toast('숫자와 기본 연산 기호만 사용할 수 있어요.');try{const result=Function('"use strict";return ('+s+')')();if(!Number.isFinite(result))throw 0;showResult('calcResult','결과: '+result)}catch(e){toast('계산식을 확인해 주세요.')}};
 $('#calcClear').onclick=()=>{$('#calcInput').value='';$('#calcResult').classList.add('hidden')};
 }else if(id==='percent'){$('#percentGo').onclick=()=>{let a=Number($('#percentTotal').value),b=Number($('#percentRate').value);if(!$('#percentTotal').value||!$('#percentRate').value)return toast('두 값을 모두 입력해 주세요.');showResult('percentResult',`${a}의 ${b}% = ${a*b/100}\n${a}에서 ${b}% 증가 = ${a*(1+b/100)}\n${a}에서 ${b}% 감소 = ${a*(1-b/100)}`)}}
 else if(id==='date'){$('#dateGo').onclick=()=>{let a=$('#dateStart').value,b=$('#dateEnd').value;if(!a||!b)return toast('시작 날짜와 종료 날짜를 선택해 주세요.');let days=Math.round(Math.abs(new Date(b)-new Date(a))/86400000);showResult('dateResult',`두 날짜 사이: ${days}일\n시작일과 종료일을 모두 포함하면 ${days+1}일`)}}
 else if(id==='unit'){
 const unitSets={length:{m:1,km:1000,cm:.01,mm:.001},weight:{kg:1,g:.001,mg:.000001,lb:.45359237},temperature:{}};
 const opts={length:[['m','미터 (m)'],['km','킬로미터 (km)'],['cm','센티미터 (cm)'],['mm','밀리미터 (mm)']],weight:[['kg','킬로그램 (kg)'],['g','그램 (g)'],['mg','밀리그램 (mg)'],['lb','파운드 (lb)']],temperature:[['C','섭씨 (°C)'],['F','화씨 (°F)'],['K','켈빈 (K)']]};
 function resetUnit(){let k=$('#unitKind').value;$('#unitFrom').innerHTML=opts[k].map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('');$('#unitTo').innerHTML=opts[k].map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('');}
 $('#unitKind').onchange=resetUnit;resetUnit();
 $('#unitGo').onclick=()=>{let v=$('#unitValue').value,k=$('#unitKind').value,f=$('#unitFrom').value,t=$('#unitTo').value;if(v==='')return toast('변환할 값을 입력해 주세요.');let n=Number(v),r;if(k==='temperature'){let c=f==='C'?n:f==='F'?(n-32)*5/9:n-273.15;r=t==='C'?c:t==='F'?c*9/5+32:c+273.15}else r=n*unitSets[k][f]/unitSets[k][t];showResult('unitResult',`${n} ${f} = ${Number(r.toFixed(6))} ${t}`)};
 }
 else if(id==='currency')initCurrency();
 else if(id==='counter'){$('#counterText').oninput=()=>{let s=$('#counterText').value;$('#counterAll').textContent=s.length;$('#counterNoSpace').textContent=s.replace(/\s/g,'').length;$('#counterWords').textContent=(s.trim().match(/\S+/g)||[]).length;$('#counterLines').textContent=s?s.split(/\n/).length:0}}
 else if(id==='compare')$('#compareGo').onclick=()=>{let a=$('#compareA').value,b=$('#compareB').value;if(!a&&!b)return toast('비교할 두 글을 입력해 주세요.');let aa=a.split(/\s+/).filter(Boolean),bb=b.split(/\s+/).filter(Boolean);let added=bb.filter(x=>!aa.includes(x)),removed=aa.filter(x=>!bb.includes(x));showResult('compareResult',`원본 단어 수: ${aa.length}\n비교 글 단어 수: ${bb.length}\n추가된 단어(단순 비교): ${added.join(', ')||'없음'}\n원본에만 있는 단어: ${removed.join(', ')||'없음'}`)}
 else if(id==='translate')$('#translateGo').onclick=()=>{let s=$('#translateText').value.trim();if(!s)return toast('번역할 문장을 입력해 주세요.');window.open('https://translate.google.com/?sl=auto&tl='+encodeURIComponent($('#translateLang').value)+'&text='+encodeURIComponent(s)+'&op=translate','_blank','noopener')}
 else if(id==='random')$('#randomGo').onclick=()=>{let a=$('#randomItems').value.split(/\n/).map(x=>x.trim()).filter(Boolean);if(!a.length)return toast('항목을 입력해 주세요.');showResult('randomResult','🎉 선택된 항목: '+a[Math.floor(Math.random()*a.length)])}
 else if(id==='teams')$('#teamsGo').onclick=()=>{let a=$('#teamNames').value.split(/\n/).map(x=>x.trim()).filter(Boolean),n=Number($('#teamCount').value);if(!a.length||!Number.isInteger(n)||n<1)return toast('참가자와 올바른 팀 수를 입력해 주세요.');a.sort(()=>Math.random()-.5);let teams=Array.from({length:Math.min(n,a.length)},()=>[]);a.forEach((x,i)=>teams[i%teams.length].push(x));showResult('teamsResult',teams.map((x,i)=>`팀 ${i+1}: ${x.join(', ')}`).join('\n'))}
 else if(id==='number')$('#numberGo').onclick=()=>{let a=$('#numMin').value,b=$('#numMax').value;if(a===''||b===''||!Number.isInteger(+a)||!Number.isInteger(+b)||+a>+b)return toast('최솟값과 최댓값을 올바르게 입력해 주세요.');showResult('numberResult','🎲 '+(Math.floor(Math.random()*(+b-+a+1))+ +a))}
 else if(id==='roulette')initRoulette();
 else if(id==='timer')initTimer();
 else if(id==='memo'){let m=$('#memoText');m.value=localStorage.getItem('tz_memo')||'';m.oninput=()=>{localStorage.setItem('tz_memo',m.value);$('#memoStatus').textContent='저장됨'};$('#memoClear').onclick=()=>{m.value='';localStorage.removeItem('tz_memo');toast('메모를 지웠어요.');}}
 else if(id==='todo')initTodo();
 else if(id==='password'){let last='';$('#passwordGo').onclick=()=>{let n=Number($('#passwordLength').value);if(!Number.isInteger(n)||n<8||n>64)return toast('길이는 8~64 사이로 입력해 주세요.');let chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';if($('#passwordSymbols').checked)chars+='!@#$%^&*()-_=+?';let arr=new Uint32Array(n);crypto.getRandomValues(arr);last=[...arr].map(x=>chars[x%chars.length]).join('');showResult('passwordResult',last);$('#passwordCopy').classList.remove('hidden')};$('#passwordCopy').onclick=()=>navigator.clipboard.writeText(last).then(()=>toast('비밀번호를 복사했어요.')).catch(()=>toast('복사할 수 없어요.'))}
}
const currencyRatesFallback={USD:1,KRW:1370,JPY:157,EUR:.92,CNY:7.2,GBP:.78,CAD:1.37,AUD:1.52};
let currencyRates={...currencyRatesFallback},ratesLive=false;
async function initCurrency(){
 $('#currencyAmount').value='';
 $('#currencyGo').onclick=convertCurrency;
 $('#currencyRefresh').onclick=()=>fetchRates(true);
 await fetchRates(false);
}
async function fetchRates(showToast){
 $('#rateStatus').textContent='환율 불러오는 중…';
 try{
  const r=await fetch('https://open.er-api.com/v6/latest/USD',{cache:'no-store'});
  if(!r.ok)throw new Error('rate fetch failed');
  const d=await r.json();if(d.result!=='success'||!d.rates)throw new Error('bad rates');
  currencyRates={};for(const k of Object.keys(currencyRatesFallback))currencyRates[k]=d.rates[k];
  ratesLive=true;$('#rateStatus').textContent='최신 환율 연결됨';
  $('#currencyNote').textContent='공개 환율 API 기준 참고값입니다. 실제 은행·환전소 적용 환율 및 수수료와 다를 수 있어요. 환율 데이터 갱신: '+(d.time_last_update_utc||'최근 업데이트');
  if(showToast)toast('최신 환율을 불러왔어요.');
  if($('#currencyAmount').value)convertCurrency();
 }catch(e){
  ratesLive=false;$('#rateStatus').textContent='참고 환율 사용';
  $('#currencyNote').textContent='인터넷 환율 연결에 실패해 참고용 예시 환율로 계산합니다. 정확한 최신 환율이 필요하면 인터넷 연결을 확인해 주세요.';
  if(showToast)toast('최신 환율을 가져오지 못했어요. 참고 환율을 표시합니다.');
 }
}
function convertCurrency(){
 let v=$('#currencyAmount').value,f=$('#currencyFrom').value,t=$('#currencyTo').value;
 if(v===''||!Number.isFinite(+v))return toast('변환할 금액을 입력해 주세요.');
 if(!currencyRates[f]||!currencyRates[t])return toast('환율 정보를 확인할 수 없어요.');
 let out=(+v/currencyRates[f])*currencyRates[t];
 let fmt=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:4}).format(out);
 const el=$('#currencyResult');el.innerHTML=`<div class="currency-result"><div><span>변환 결과</span><br><strong>${fmt} ${t}</strong></div><div style="text-align:right"><span>${v} ${f} 기준</span><br><span>${ratesLive?'최신 연결 환율':'참고 환율'}</span></div></div>`;el.classList.remove('hidden');
}
function initRoulette(){
 const canvas=$('#rouletteCanvas'),ctx=canvas.getContext('2d');
 rouletteItems=[];wheelAngle=0;
 const colors=['#7264e8','#f1a65b','#42bfa4','#e96f8e','#5c9fe8','#b07bd7','#e8c75b','#5b6b91','#ed8c65','#64b6c5'];
 function draw(){
  const n=rouletteItems.length;ctx.clearRect(0,0,700,700);
  if(!n){ctx.beginPath();ctx.arc(350,350,328,0,Math.PI*2);ctx.fillStyle='#f0eff8';ctx.fill();ctx.strokeStyle='#d9d6ed';ctx.lineWidth=12;ctx.stroke();ctx.fillStyle='#9895ae';ctx.font='600 24px Noto Sans KR';ctx.textAlign='center';ctx.fillText('항목을 입력해 주세요',350,360);return}
  const arc=Math.PI*2/n,rad=wheelAngle-Math.PI/2;
  ctx.save();ctx.translate(350,350);ctx.rotate(rad);
  for(let i=0;i<n;i++){
   const start=i*arc-Math.PI/2,end=start+arc;
   ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,322,start,end);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.stroke();
   ctx.save();ctx.rotate(start+arc/2);ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.font=`700 ${n>12?17:n>8?20:24}px Noto Sans KR`;let label=rouletteItems[i];if(label.length>12)label=label.slice(0,11)+'…';ctx.shadowColor='#0002';ctx.shadowBlur=2;ctx.fillText(label,285,0);ctx.restore();
  }
  ctx.restore();ctx.beginPath();ctx.arc(350,350,324,0,Math.PI*2);ctx.strokeStyle='#292b49';ctx.lineWidth=10;ctx.stroke();
  for(let i=0;i<Math.min(n,36);i++){let a=(i/n)*Math.PI*2-Math.PI/2+wheelAngle;ctx.beginPath();ctx.arc(350+Math.cos(a)*324,350+Math.sin(a)*324,5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill()}
 }
 function apply(){let a=$('#rouletteInput').value.split(/\n/).map(x=>x.trim()).filter(Boolean);if(a.length<2)return toast('룰렛은 항목을 2개 이상 입력해 주세요.');rouletteItems=a;wheelAngle=0;$('#rouletteResult').classList.add('hidden');draw();toast('룰렛을 만들었어요!')}
 $('#rouletteApply').onclick=apply;
 $('#rouletteReset').onclick=()=>{$('#rouletteInput').value='';rouletteItems=[];wheelAngle=0;$('#rouletteResult').classList.add('hidden');draw()};
 $('#rouletteSpin').onclick=()=>{
  if(spinning)return;if(rouletteItems.length<2)return toast('먼저 항목을 입력하고 룰렛을 만들어 주세요.');
  spinning=true;$('#rouletteSpin').disabled=true;$('#rouletteSpin').textContent='돌아가는 중…';
  const start=wheelAngle,extra=Math.PI*2*(5+Math.random()*4)+Math.random()*Math.PI*2,duration=4600,startTime=performance.now();
  function frame(now){let p=Math.min(1,(now-startTime)/duration),ease=1-Math.pow(1-p,4);wheelAngle=start+extra*ease;draw();if(p<1)requestAnimationFrame(frame);else{
   spinning=false;$('#rouletteSpin').disabled=false;$('#rouletteSpin').textContent='다시 돌리기';
   const n=rouletteItems.length,arc=2*Math.PI/n;let normalized=((Math.PI*1.5-wheelAngle)%(Math.PI*2)+(Math.PI*2))%(Math.PI*2);let index=Math.floor(normalized/arc)%n;
   showResult('rouletteResult','🎉 결과: '+rouletteItems[index]);}
  }requestAnimationFrame(frame);
 };
 draw();
}
function initTimer(){
 $('#timerStart').onclick=()=>{if(timerInterval){clearInterval(timerInterval);timerInterval=null;$('#timerStart').textContent='계속하기';return}if(timerRemaining<=0){let m=Number($('#timerMin').value||0),s=Number($('#timerSec').value||0);timerRemaining=Math.max(0,m*60+s);if(!timerRemaining)return toast('분 또는 초를 입력해 주세요.')}$('#timerStart').textContent='일시정지';const tick=()=>{let m=Math.floor(timerRemaining/60),s=timerRemaining%60;$('#timerDisplay').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');if(timerRemaining<=0){clearInterval(timerInterval);timerInterval=null;$('#timerStart').textContent='타이머 시작';toast('타이머가 끝났어요!');return}timerRemaining--};tick();timerInterval=setInterval(tick,1000)};
 $('#timerReset').onclick=()=>{clearInterval(timerInterval);timerInterval=null;timerRemaining=0;$('#timerDisplay').textContent='00:00';$('#timerStart').textContent='타이머 시작'};
 $('#stopwatchStart').onclick=()=>{if(stopwatchInterval){clearInterval(stopwatchInterval);stopwatchInterval=null;$('#stopwatchStart').textContent='계속';stopwatchElapsed=Date.now()-stopwatchStart;return}stopwatchStart=Date.now()-stopwatchElapsed;$('#stopwatchStart').textContent='일시정지';stopwatchInterval=setInterval(()=>{let ms=Date.now()-stopwatchStart;$('#stopwatchDisplay').textContent=`${String(Math.floor(ms/60000)).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${Math.floor(ms/100)%10}`},100)};
 $('#stopwatchReset').onclick=()=>{clearInterval(stopwatchInterval);stopwatchInterval=null;stopwatchStart=0;stopwatchElapsed=0;$('#stopwatchDisplay').textContent='00:00.0';$('#stopwatchStart').textContent='시작'};
}
function initTodo(){
 let items=JSON.parse(localStorage.getItem('tz_todo')||'[]');
 function render(){const el=$('#todoList');el.innerHTML=items.map((x,i)=>`<label style="display:flex;align-items:center;gap:10px;padding:12px 2px;border-bottom:1px solid var(--line);font-size:13px"><input type="checkbox" data-check="${i}" ${x.done?'checked':''}><span style="flex:1;${x.done?'text-decoration:line-through;color:var(--muted)':''}">${escapeHtml(x.text)}</span><button class="favorite-btn" data-remove="${i}" aria-label="삭제">×</button></label>`).join('')||'<p class="muted-note">아직 등록한 할 일이 없어요.</p>';localStorage.setItem('tz_todo',JSON.stringify(items));el.querySelectorAll('[data-check]').forEach(e=>e.onchange=()=>{items[+e.dataset.check].done=e.checked;render()});el.querySelectorAll('[data-remove]').forEach(e=>e.onclick=()=>{items.splice(+e.dataset.remove,1);render()})}
 $('#todoAdd').onclick=()=>{let v=$('#todoInput').value.trim();if(!v)return toast('할 일을 입력해 주세요.');items.push({text:v,done:false});$('#todoInput').value='';render()};$('#todoInput').onkeydown=e=>{if(e.key==='Enter')$('#todoAdd').click()};render();
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#searchInput').addEventListener('input',()=>{currentView='home';currentCategory='';$$('.nav-item').forEach(x=>x.classList.remove('active'));$$('[data-view="home"]')[0].classList.add('active');renderTools()});
$('#toolGrid').addEventListener('click',e=>{const fav=e.target.closest('[data-fav]');if(fav){e.stopPropagation();let id=fav.dataset.fav;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];localStorage.setItem('tz_favorites',JSON.stringify(favorites));renderTools();return}const card=e.target.closest('[data-open]');if(card)openTool(card.dataset.open)});
$('#toolGrid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-open]')){e.preventDefault();openTool(e.target.dataset.open)}});
$$('[data-view]').forEach(b=>b.onclick=()=>{currentView=b.dataset.view;currentCategory='';$('#searchInput').value='';$$('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#crumb').textContent=b.textContent.trim();renderTools();$('#sidebar').classList.remove('open')});
$$('[data-category]').forEach(b=>b.onclick=()=>{currentCategory=b.dataset.category;currentView='home';$('#searchInput').value='';$$('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#crumb').textContent=currentCategory;renderTools();$('#sidebar').classList.remove('open')});
$('#closeModal').onclick=closeTool;$('#toolModal').addEventListener('click',e=>{if(e.target===$('#toolModal'))closeTool()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTool();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus()}});
$('#quickSearch').onclick=()=>{$('#searchInput').focus();window.scrollTo({top:0,behavior:'smooth'})};
$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');
$('#themeToggle').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('tz_dark',document.body.classList.contains('dark')?'1':'0')};
if(localStorage.getItem('tz_dark')==='1')document.body.classList.add('dark');
$('#year').textContent='© '+new Date().getFullYear()+' TOOLZIP';
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
$('#connectionText').textContent=navigator.onLine?'온라인 · 오프라인 캐시 지원':'오프라인 모드';
window.addEventListener('online',()=>$('#connectionText').textContent='온라인 · 오프라인 캐시 지원');window.addEventListener('offline',()=>$('#connectionText').textContent='오프라인 모드');
renderTools();
