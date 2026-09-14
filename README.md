# 도전! 의대 골든벨 - 실제 구동용 v1

Node.js + Express + WebSocket 기반의 실시간 서버 버전입니다.

## 로컬 실행
Node.js 20+ 필요

```bash
npm install
ADMIN_KEY=your-secret npm start
```
Windows PowerShell:
```powershell
$env:ADMIN_KEY="your-secret"; npm start
```

참가자: `http://localhost:3000/`
진행자: `http://localhost:3000/admin.html`

## 실제 배포
Node.js를 지원하는 호스팅(Render/Railway/Fly.io/AWS/GCP/Azure 등)에 올리고 `npm start`로 실행합니다. `ADMIN_KEY` 환경변수는 행사 전에 반드시 변경하세요.

## 현재 구현
- 실제 WebSocket 실시간 통신
- 참가자 입장/답안 제출
- 살아있는 참가자만 답안 제출
- 서버 측 A/B/C/D 집계
- 최다 득표 답안 정답 처리
- 동률 공동 생존
- 다음 라운드
- 진행자 콘솔
- 가상 400명 응답 시뮬레이션
- 모바일 참가자 화면

## 행사 전 보강 권장
현재 게임 상태는 서버 메모리에 있으므로 재시작 시 초기화됩니다. 실전에서는 Redis/DB, 재접속 복구, 강한 관리자 인증, 참가자 중복 접속 방지, 개인정보 최소화, 부하 테스트를 추가하는 것을 권장합니다.
