const express=require('express'),http=require('http'),path=require('path'),crypto=require('crypto');const{WebSocketServer}=require('ws');
const app=express(),server=http.createServer(app),wss=new WebSocketServer({server});const PORT=process.env.PORT||3000,ADMIN_KEY=process.env.ADMIN_KEY||'festival-admin-change-me';
const QUESTIONS=[
{q:'시험 전날인데 공부를 하나도 안 했다. 당신의 선택은?',a:['밤새 벼락치기한다','그냥 일찍 잔다','친구에게 요약자료를 부탁한다','내일의 나에게 맡긴다']},
{q:'교수님이 수업 중 “이건 시험에 안 나옵니다”라고 했다.',a:['그래도 공부한다','공부 목록에서 바로 삭제한다','친구에게 다시 확인한다','교수님을 믿지 않는다']},
{q:'시험 5분 전, 친구가 와서 “3번 답 뭐야?”라고 묻는다.',a:['자신 있게 알려준다','나도 모른다고 한다','답을 보여준다','모르는 척한다']},
{q:'단톡방에 시험 범위가 올라왔다. 가장 먼저 드는 생각은?',a:['일단 저장한다','누가 요약해주길 기다린다','친구들과 분담한다','시험 범위부터 다시 확인한다']},
{q:'실습 직전에 교수님이 “오늘 랜덤으로 시킬게요”라고 했다.',a:['앞에서부터 차근차근 준비한다','눈을 마주치지 않는다','친구에게 예상 질문을 묻는다','운에 맡긴다']}];
function fresh(){return{phase:'lobby',round:0,alive:0,participants:new Map(),submitted:new Map(),counts:[0,0,0,0],revealed:false,result:null}}
let state=fresh();
function pub(){return{phase:state.phase,round:state.round,question:QUESTIONS[state.round]?.q||null,choices:QUESTIONS[state.round]?.a||[],alive:state.alive,answered:state.submitted.size,totalParticipants:state.participants.size,counts:state.revealed?state.counts:null,revealed:state.revealed,result:state.revealed?state.result:null}}
function send(ws,type,data){if(ws.readyState===1)ws.send(JSON.stringify({type,...data}))}function broadcast(){for(const ws of wss.clients)send(ws,'state',{state:pub(),role:ws.role||'participant'})}
app.use(express.static(path.join(__dirname,'public')));app.get('/health',(_,r)=>r.json({ok:true}));
wss.on('connection',ws=>{ws.id=crypto.randomUUID();ws.role='participant';send(ws,'state',{state:pub(),role:'participant'});ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return send(ws,'error',{message:'잘못된 요청입니다.'})}
if(m.type==='admin_login'){if(m.key!==ADMIN_KEY)return send(ws,'error',{message:'진행자 키가 올바르지 않습니다.'});ws.role='admin';return send(ws,'admin_ok',{state:pub()})}
if(m.type==='join'){if(state.phase!=='lobby')return send(ws,'error',{message:'게임이 이미 시작되었습니다.'});const name=String(m.name||'').trim().slice(0,30);if(!name)return send(ws,'error',{message:'이름 또는 참가번호를 입력해주세요.'});state.participants.set(ws.id,{name,alive:true});send(ws,'joined',{});return broadcast()}
if(m.type==='start_game'){if(ws.role!=='admin'||!state.participants.size)return;state.phase='question';state.round=0;state.alive=state.participants.size;state.submitted.clear();state.counts=[0,0,0,0];state.revealed=false;state.result=null;return broadcast()}
if(m.type==='submit'){const p=state.participants.get(ws.id);if(!p||!p.alive||state.phase!=='question'||state.revealed)return send(ws,'error',{message:'현재 답안을 제출할 수 없습니다.'});if(!Number.isInteger(m.answer)||m.answer<0||m.answer>3)return;if(state.submitted.has(ws.id))return send(ws,'error',{message:'이미 제출했습니다.'});state.submitted.set(ws.id,m.answer);state.counts[m.answer]++;send(ws,'submitted',{});return broadcast()}
if(m.type==='simulate'){if(ws.role!=='admin'||state.phase!=='question')return;const rem=Math.max(0,state.alive-state.submitted.size),p=[.22,.41,.27,.10];for(let i=0;i<rem;i++){let r=Math.random(),s=0,c=3;for(let j=0;j<4;j++){s+=p[j];if(r<s){c=j;break}}state.submitted.set('bot-'+crypto.randomUUID(),c);state.counts[c]++}return broadcast()}
if(m.type==='reveal'){if(ws.role!=='admin'||state.phase!=='question'||!state.submitted.size)return;const max=Math.max(...state.counts),winners=state.counts.map((v,i)=>v===max?i:-1).filter(i=>i>=0);for(const[id,p]of state.participants){const a=state.submitted.get(id);if(a===undefined||!winners.includes(a))p.alive=false}state.alive=[...state.participants.values()].filter(p=>p.alive).length;state.result={winners,counts:[...state.counts],survivors:state.alive};state.revealed=true;state.phase='result';return broadcast()}
if(m.type==='next_round'){if(ws.role!=='admin'||!state.revealed)return;if(state.alive<=1||state.round>=QUESTIONS.length-1){state.phase='finished';return broadcast()}state.round++;state.submitted.clear();state.counts=[0,0,0,0];state.revealed=false;state.result=null;state.phase='question';return broadcast()}
if(m.type==='reset'){if(ws.role!=='admin')return;state=fresh();return broadcast()}
})});server.listen(PORT,()=>console.log('GoldenBell on '+PORT));
