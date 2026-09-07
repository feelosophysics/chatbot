# 🏗️ 건설 안전 & 시공 전문 AI 튜터 챗봇 (AI Learning Tutor)

산업안전보건법, 중대재해처벌법, 콘크리트/골조 시공 지침 및 현장 위험성 평가(TBM)를 실시간으로 지원하는 풀스택 AI 챗봇 서비스 모노레포입니다.

---

## 📂 프로젝트 구조 (Monorepo)

- [**`chat-be/`**](chat-be/): **FastAPI 백엔드 API 서버**
  - Google Gemini AI 엔진 연동 & 시공 도메인 시스템 프롬프트 주입
  - Server-Sent Events (SSE) 실시간 토큰 스트리밍 응답
  - SQLite & SQLAlchemy 비동기/동기 세션 및 대화 로그 영속화
  - JWT 기반 사용자 인증, Bcrypt 암호화, 역할 기반 보안
  - Request ID 기반 구조화된 관제 로깅 및 터미널 진단 CLI (`scripts/check_logs.py`)
- [**`chat-fe/`**](chat-fe/): **프론트엔드 웹 클라이언트**
  - 실시간 SSE 스트리밍 채팅 UI, 대화 세션 CRUD, 통계 대시보드
  - 사용자 인증(로그인/회원가입) 모달 및 JWT 로컬스토리지 관리
  - 건설 안전 특화 빠른 질문 칩(TBM, 거푸집, 개구부 등) 지원
  - Vercel 정적 호스팅 및 독립 웹 배포 최적화

---

## 🚀 빠른 시작 (Quick Start)

### 1. 백엔드 실행 (`chat-be`)
```bash
cd chat-be
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
- API Swagger 문서: `http://localhost:8000/docs`

### 2. 프론트엔드 실행 (`chat-fe`)
```bash
cd chat-fe
# 단순 로컬 정적 서버 실행:
python -m http.server 3000
```
- 브라우저 접속: `http://localhost:3000`

---

## 🧪 테스트 및 진단
```bash
# 백엔드 단위 테스트 스위트
cd chat-be
pytest tests/ -v

# DB 적재 로그 및 레이턴시 진단 CLI
python scripts/check_logs.py
```

