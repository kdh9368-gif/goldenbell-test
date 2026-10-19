const express=require('express'),http=require('http'),path=require('path'),crypto=require('crypto');const{WebSocketServer}=require('ws');
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server});const PORT=process.env.PORT||3000,ADMIN_KEY=process.env.ADMIN_KEY||'';
const QUESTIONS=[
{example:true,q:'지금 드는 생각은?',a:['재밌겠다!!!','아 졸려서 구경만 할래']},
{q:'시험 하루 전이라면?',a:['전 범위를 한 번 훑기','중요한 부분만 완벽하게 외우기']},
{q:'시험에서 더 억울한 상황은?',a:['답을 바꿨는데 처음 답이 정답','답을 안 바꿨는데 바꿀 답이 정답']},
{q:'시험이 망한 것 같을 때 시험점수를 확인하는 시점은?',a:['나오자마자 바로 확인','마음의 준비 후 확인']},
{q:'교수님 사정으로 다음 두 시간에만 수업이 가능하시다고 한다. 어떤 수업이 더 좋은가?',a:['오전 7시 수업','오후 6시 수업']},
{q:'조별 과제에서 하나만 맡아야 한다면?',a:['발표','PPT 제작']},
{q:'발표할 때 더 난처한 상황은?',a:['내가 모르는 부분 질문 받는 상황','아무도 반응하지 않는 상황']},
{q:'친구에게 더 서운한 것은?',a:['내 생일을 잊어버리기','생일은 기억했지만 성의 없이 축하하기']},
{q:'두 시간 중 딱 한 곳으로 타임워프 한다면?',a:['태어난 직후','의대 합격 직후']},
{q:'연애를 할 때 하나만 골라야 하면?',a:['동기랑 연애하다 본2에 헤어지고 같이 실습 돌기','비의대생과 연애하고 시험기간마다 싫은소리 듣기 (=always)']},
{q:'둘 중 더 좋은 교수님은?',a:['기출문제 위주로 내주시는 교수님','수업 일찍 끝내주시는 교수님']},
{q:'스케줄을 고를 수 있다면?',a:['방학 없는 대신 주 3일제','주말까지 학교 나가고 방학 추가']},
{q:'술에 취했을 때 더 끔찍한 상황은?',a:['4학번 차이 선배 앞에서 실수하기','5학번 차이 후배들 앞에서 실수하기']},
{q:'의대생 최고의 생명줄은?',a:['족보','아침마다 나를 깨워주는 동기','카페인','생성형 AI']},
{q:'단체 채팅방에서 가장 답답한 사람은?',a:['읽고 답장 안 하는 사람','투표 안 하는 사람','결정 후 의견 내는 사람','개인톡으로만 묻는 사람']},
{q:'친구들과 여행할 때 가장 중요한 사람은?',a:['계획 세우는 사람','운전하는 사람','사진 잘 찍는 사람','분위기 띄우는 사람']},
{q:'시험기간에 가장 자주 듣는 말은?',a:['“진짜 그만하고 싶다.”','“나 진짜 망했어.”','“이거 시험에 나옴?”','“어디까지 봤어?”']},
{q:'서울에 사는 친구와 약속을 잡을 때 나는:',a:['사당역','강남역','서울역','수원으로 부른다']},
{q:'시험 전날 밤 가장 많이 하는 행동은?',a:['유튜브 시청','기도하기','이른 취침','마무리 공부']},
{q:'다음 중 본인의 최애 아주대 앞 술집은?',a:['두메산골','셰프의 포차','미강','오뚜기']},
{q:'나는 점심시간에:',a:['기숙사 (교직원) 식당','선인재','다산관','학교 밖에서 먹는다']},
{q:'이번 학기 시험기간 간식 사업으로 가장 적합한 간식은?',a:['컵밥','햄버거','샌드위치','타코야끼']},
{q:'이번 축제에서 가장 재밌었던 부스는?',a:['마법부 심문실','송그와트 마법훈련장','심리테스트','gift&take','랜덤초콜릿']},
{q:'다음 중 반드시 한 가지를 해야 한다면',a:['골학장','기획국장','학생회장','6년 동안 과대']},
{q:'다음 중 송재관에 대한 사실인 것은?',a:['1층 중앙 바닥에 있는 조각을 밟으면 유급한다','송재관 거울 앞에서 입에 칼을 물고 서 있으면 미래의 배우자가 보인다','송재관 앞에 있는 조각상은 밤마다 춤을 춘다','새로 생긴 여유당에는 직립보행이 가능한 로봇이 있다']},
{q:'학우들 사진 중 가장 잘생긴 사람 고르기',a:['도훈','영환','영빈','범진']}
];
function current(){return QUESTIONS[state.round]||{a:[]}}
function newCounts(){return Array(current().a.length).fill(0)}
function fresh(){return{phase:'lobby',round:0,alive:0,participants:new Map(),submitted:new Map(),counts:Array(QUESTIONS[0].a.length).fill(0),revealed:false,result:null}}
let state=fresh();
function pub(ws){const q=current(),id=ws?.participantToken,p=id?state.participants.get(id):null;return{phase:state.phase,round:state.round,roundLabel:q.example?'예시':String(state.round),isExample:!!q.example,choiceCount:q.a.length,question:q.q||null,choices:q.a||[],alive:state.alive,answered:state.submitted.size,totalParticipants:state.participants.size,counts:state.revealed?state.counts:null,revealed:state.revealed,result:state.revealed?state.result:null,myAnswer:p&&state.submitted.has(id)?state.submitted.get(id):null,myAlive:p?p.alive:null}}
function send(ws,type,data){if(ws.readyState===1)ws.send(JSON.stringify({type,...data}))}function sendState(ws){send(ws,'state',{state:pub(ws),role:ws.role||'participant'})}function broadcast(){for(const ws of wss.clients)sendState(ws)}function broadcastAdmins(){for(const ws of wss.clients)if(ws.role==='admin')sendState(ws)}
app.use(express.static(path.join(__dirname,'public')));app.get('/health',(_,r)=>r.json({ok:true}));
wss.on('connection',ws=>{ws.id=crypto.randomUUID();ws.role='participant';send(ws,'state',{state:pub(ws),role:'participant'});ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return send(ws,'error',{message:'잘못된 요청입니다.'})}
if(m.type==='admin_login'){if(m.key!==ADMIN_KEY)return send(ws,'error',{message:'진행자 키가 올바르지 않습니다.'});ws.role='admin';return send(ws,'admin_ok',{state:pub(ws)})}
if(m.type==='resume'){const token=String(m.token||'').trim().slice(0,100);if(token&&state.participants.has(token)){ws.participantToken=token;send(ws,'joined',{resumed:true});sendState(ws);broadcastAdmins();return}return send(ws,'resume_failed',{})}
if(m.type==='join'){if(state.phase!=='lobby')return send(ws,'error',{message:'게임이 이미 시작되었습니다.'});const name=String(m.name||'').trim().slice(0,30),token=String(m.token||'').trim().slice(0,100);if(!name)return send(ws,'error',{message:'이름 또는 참가번호를 입력해주세요.'});if(!token)return send(ws,'error',{message:'참가자 연결 정보를 만들 수 없습니다. 페이지를 새로고침해주세요.'});ws.participantToken=token;if(!state.participants.has(token))state.participants.set(token,{name,alive:true});send(ws,'joined',{resumed:false});sendState(ws);broadcastAdmins();return}
if(m.type==='start_game'){if(ws.role!=='admin'||!state.participants.size)return;state.phase='question';state.round=0;state.alive=state.participants.size;state.submitted.clear();state.counts=newCounts();state.revealed=false;state.result=null;return broadcast()}
if(m.type==='submit'){const q=current(),id=ws.participantToken,p=id?state.participants.get(id):null;if(!p)return send(ws,'error',{message:'연결이 복구되지 않았습니다. 잠시 후 다시 시도해주세요.'});if(!p.alive)return send(ws,'error',{message:'이미 탈락하여 답안을 제출할 수 없습니다.'});if(state.phase!=='question'||state.revealed)return send(ws,'error',{message:'답안 제출 시간이 종료되었습니다.'});if(!Number.isInteger(m.answer)||m.answer<0||m.answer>=q.a.length)return;if(state.submitted.has(id))return send(ws,'error',{message:'이미 답안을 제출했습니다.'});state.submitted.set(id,m.answer);state.counts[m.answer]++;send(ws,'submitted',{});sendState(ws);broadcastAdmins();return}
if(m.type==='simulate'){if(ws.role!=='admin'||state.phase!=='question')return;const q=current(),realSubmitted=[...state.submitted.keys()].filter(id=>state.participants.has(id)).length,rem=Math.max(0,state.alive-realSubmitted);for(let i=0;i<rem;i++){const c=Math.floor(Math.random()*q.a.length);state.submitted.set('bot-'+crypto.randomUUID(),c);state.counts[c]++}return broadcast()}
if(m.type==='reveal'){if(ws.role!=='admin'||state.phase!=='question'||!state.submitted.size)return;const q=current(),max=Math.max(...state.counts),winners=state.counts.map((v,i)=>v===max?i:-1).filter(i=>i>=0);if(!q.example){for(const[id,p]of state.participants){const a=state.submitted.get(id);if(a===undefined||!winners.includes(a))p.alive=false}state.alive=[...state.participants.values()].filter(p=>p.alive).length}state.result={winners,counts:[...state.counts],survivors:state.alive,elimination:!q.example};state.revealed=true;state.phase='result';return broadcast()}
if(m.type==='next_round'){if(ws.role!=='admin'||!state.revealed)return;const q=current();if((!q.example&&state.alive<=1)||state.round>=QUESTIONS.length-1){state.phase='finished';return broadcast()}state.round++;state.submitted.clear();state.counts=newCounts();state.revealed=false;state.result=null;state.phase='question';return broadcast()}
if(m.type==='reset'){if(ws.role!=='admin')return;state=fresh();return broadcast()}
})});server.listen(PORT,()=>console.log('GoldenBell on '+PORT));
