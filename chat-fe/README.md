# 🌐 건설 안전 & 시공 전문 AI 튜터 - 프론트엔드 (`chat-fe`)

FastAPI 백엔드(`chat-be`)와 연동하여 실시간 SSE 스트리밍 채팅, 사용자 인증, 대화 세션 관리 및 DB 대화 로그 조회를 제공하는 정적 웹 클라이언트입니다. (Vercel 배포 지원)

---

## 🛠️ 기술 스택
- **HTML5 & Vanilla JavaScript (ES6+)**
- **TailwindCSS (CDN)** - 모던 다크 테마 UI & 반응형 레이아웃
- **Marked.js & Highlight.js** - AI 마크다운 및 코드 블록 하이라이팅
- **FontAwesome 6** - UI 아이콘

---

## 📁 디렉토리 구조
```text
chat-fe/
├── index.html        # 메인 채팅 화면 (대화 세션, SSE 스트리밍)
├── login.html        # 로그인 화면
├── register.html     # 회원가입 화면
├── logs.html         # 대화 로그 및 통계 검증 센터
├── css/
│   └── style.css     # 스크롤바, 마크다운 렌더링 및 커스텀 스타일
├── js/
│   ├── config.js     # 백엔드 API Base URL 및 전역 설정
│   ├── api.js        # 공통 Fetch 래퍼, 토큰 관리, Toast 알림
│   ├── auth.js       # 로그인 / 회원가입 핸들러
│   ├── chat.js       # SSE 스트리밍 수신, 세션 CRUD, 메시지 렌더링
│   └── logs.js       # 대화 로그 조회, 메트릭 집계, 필터링
└── README.md
```

---

## 🚀 실행 방법

별도의 `npm install`이나 복잡한 빌드 과정 없이 정적 웹 서버로 즉시 실행할 수 있습니다.

### 방법 1. VS Code Live Server 확장 프로그램
1. VS Code에서 `chat-fe` 폴더를 엽니다.
2. `index.html` 파일을 우클릭하고 **"Open with Live Server"**를 클릭합니다.

### 방법 2. Python 내장 HTTP 서버
```bash
# chat-fe 디렉토리에서 실행
python -m http.server 3000
```
브라우저에서 `http://localhost:3000`으로 접속합니다.

### 방법 3. Node.js `serve` / `http-server`
```bash
npx serve .
```

---

## ⚙️ 백엔드 연동 설정 (`js/config.js`)

백엔드 서버의 주소가 다른 포트이거나 배포된 URL인 경우 `js/config.js` 파일에서 `API_BASE_URL`을 수정하세요.

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000', // 로컬 또는 배포된 백엔드 주소
    APP_NAME: 'AI Learning Tutor'
};
```

---

## 🔐 인증 및 보안
- 로그인 성공 시 발급받은 JWT 토큰(`access_token`)은 `localStorage`에 안전하게 보관됩니다.
- 모든 API 요청 시 `Authorization: Bearer <token>` 헤더로 백엔드에 자동 전달됩니다.
- 토큰이 만료되거나 유효하지 않은 경우 자동으로 `login.html`로 이동합니다.
