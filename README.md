# 현장노트 — 건설 지식 Q&A 챗봇

건설 용어와 절차가 익숙하지 않은 사용자가 질문하고, AI 답변과 자신의 이전 대화를 확인하는 웹 서비스입니다. 회원가입 → 로그인 → 질문·스트리밍 답변 → 대화 저장 → 내 기록 조회가 핵심 사용 흐름입니다.

이 저장소는 평가자가 BE·FE 코드와 문서를 한 곳에서 확인하도록 원본 두 저장소의 main을 합친 **평가용 모노레포**입니다. 실제 개발·협업·배포 기준은 원본 저장소입니다.

- [운영 서비스](https://b7-1-chat-fe.vercel.app) · [운영 API 문서](https://b71chatbe.ddns.net/docs)
- [BE 원본](https://github.com/cocoa7-1/chat-be) · [FE 원본](https://github.com/cocoa7-1/chat-fe)

## 구성과 실행 구조

```text
chatbot/
├── chat-be/                FastAPI, 인증, AI/SSE, SQLite, 로그 API·시험·문서
├── chat-fe/                정적 HTML/CSS/JavaScript, 인증·채팅·내 기록 화면
├── evaluation-source.json  취합한 원본 저장소·main SHA
└── README.md               평가 안내·협업·배포 링크

브라우저 → Vercel 정적 FE → HTTPS → EC2/Caddy → Uvicorn/FastAPI
                                                    ├─ SQLite 계정·대화
                                                    └─ 서버 전용 Google AI API
```

FE는 JWT Bearer 인증으로 BE와 연결합니다. AI는 서버에서 호출하며 최근 10개 메시지로 문맥을 구성합니다. 질문·답변·사용자·시각을 저장하고 내 기록과 통계를 조회합니다. 입력 검증, AI 오류/시간초과 안내, 요청 제한, 요청/AI/DB 이벤트 로그를 제공합니다. 모델·추론·검색·Temperature 옵션과 응답 중 설정 잠금, 모바일 옵션 패널을 포함합니다.

## 평가용 문서

| 확인할 내용 | 문서 / 코드 |
|---|---|
| BE 개요·API 요청/응답·환경 변수·팀 역할 | [BE README](chat-be/README.md) |
| FE 실행·인증/채팅/로그 화면·개인 작업 | [FE README](chat-fe/README.md) |
| DB 구조·사용자별 로그 확인 | [로그·DB 가이드](chat-be/docs/roles/log_db_guide.md), [SQL](chat-be/scripts/check_logs.sql), [조회 스크립트](chat-be/scripts/check_logs.py) |
| EC2/Vercel 실행·배포·설정 | [배포 가이드](chat-be/docs/deployment.md) |
| 요구사항·확인 항목 | [미션 원문](chat-be/docs/mission_requirements.md), [점검표](chat-be/docs/mission-checklist.md) |
| UI·모바일 화면 | [UI 안내와 스크린샷](chat-fe/docs/ui-review.md) |
| 인증·AI 처리 설명 | [인증](chat-be/docs/roles/auth_guide.md), [AI/SSE](chat-be/docs/roles/chat_api_guide.md), [통합 가이드](chat-be/docs/deep_dive_study_guide.md) |

운영 서비스에서 로그인한 뒤 검색을 끄고 일반 질문 → 같은 대화의 후속 질문 → 새로고침 후 내 기록 조회 순서로 확인할 수 있습니다. 검색은 선택 기능이며 실제 실행 여부는 공급자의 반환 근거로 표시합니다.

## 취합한 버전과 협업 근거

2026-10-05 운영 검증 버전에 팀 담당자 문서 보완을 반영한 원본 main 기준입니다. 각 하위 디렉터리는 아래 원본 Git tree와 일치합니다.

| 구성 | 원본 main SHA | 통합 PR · 담당자 문서 PR |
|---|---|---|
| BE | `3847bba40226eb5d99b788d79a9f7b1fbb14497e` | [#10](https://github.com/cocoa7-1/chat-be/pull/10) → [#8](https://github.com/cocoa7-1/chat-be/pull/8), [#11](https://github.com/cocoa7-1/chat-be/pull/11) → [#12](https://github.com/cocoa7-1/chat-be/pull/12) |
| FE | `11d00c6a5963f74572084f295867885617dd97e7` | [#2](https://github.com/cocoa7-1/chat-fe/pull/2) → [#3](https://github.com/cocoa7-1/chat-fe/pull/3), [#4](https://github.com/cocoa7-1/chat-fe/pull/4) → [#5](https://github.com/cocoa7-1/chat-fe/pull/5) |

Git subtree 병합으로 원본 커밋·작성자·이력을 보존했습니다. PR의 리뷰·대화 기록과 개인 작업 브랜치는 원본 저장소에서 확인합니다. 동일 커밋의 취합은 새로운 개인 기여로 중복 집계하지 않습니다.

## 팀 역할과 개인별 작업 요약

| 작성자 / 역할 | 담당 범위·작업 요약 |
|---|---|
| feelosophysics (alzznd) / DB·로그·AI·FE·운영 통합 | 초기 BE/AI/SSE·문맥 구현 커밋, DB/로그·통계·조회 도구, 도메인 문서, FE/UI·옵션·오류·모바일 보완, 운영 통합 |
| bwmin / 인증 | 닉네임·비밀번호 정책/변경 API, 검증 오류 처리, 인증 회귀 시험 |
| heeyoung35 / AI·채팅 | AI 연동·응답 스트리밍(SSE)·대화 문맥 유지 영역 담당 |
| dolphin1404 (Kyumin Lee) / 감독 | PR 템플릿 작성, 리뷰·통합 관리 담당 |

alzznd와 feelosophysics는 같은 작성자입니다. 역할은 팀 담당 기준이며 구현 커밋 작성자는 Git 이력에서 확인합니다. 리뷰 요청과 실제 승인 여부, 개인별 유의미한 커밋 수는 원본 이력과 PR을 기준으로 확인합니다.

## 로컬 실행

백엔드는 Python 3.12와 uv를 사용합니다. 두 터미널에서 각각 실행합니다.

```bash
cd chat-be
uv venv --python 3.12
uv pip install -r requirements.txt
cp .env.example .env
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

PowerShell에서는 파일 복사를 `Copy-Item .env.example .env`로 실행합니다. 실제 AI 키는 `chat-be/.env`의 `GEMINI_API_KEY`에만 설정합니다. 환경 변수 이름·CORS 로컬 출처 설정은 [BE README](chat-be/README.md)를 참고합니다.

```bash
cd chat-fe
python -m http.server 3000
```

http://localhost:3000 에 접속하며 BE 문서는 http://localhost:8000/docs 입니다. FE에는 별도 빌드나 패키지 설치가 필요 없습니다. `.env`, 실제 키, 운영 DB, 로그, 가상환경은 Git에 포함하지 않습니다.

## 검증과 운영 기준

운영 검증한 BE 버전은 임시 DB·빈 실제 키·가짜 SDK로 로컬 및 기존 EC2에서 전체 88개 시험이 통과했습니다. 이후 변경은 담당자 README 한 줄입니다. 이 모노레포에서는 원본 main과 하위 Git tree·이력 일치를 대조했습니다. 대역 시험과 실제 AI·후속 문맥·기록 시연은 구분합니다. 시험 방법은 [BE README](chat-be/README.md)에 있습니다.

원본 FE main은 Vercel Production, BE는 기존 EC2의 `chat-be.service`에서 운영합니다. 서버 실행 SHA를 문서 보완 후 Git main SHA와 구분하며, 운영 검증·반영 이력은 원본 배포 기준으로 확인합니다. 이 평가용 저장소의 변경은 기존 서비스에 자동 배포되지 않습니다.

이후 수정은 원본 저장소에서 작업·PR·배포한 뒤 필요할 때 이 통합본을 갱신합니다. 하위 디렉터리에 별도 `.git`이나 서브모듈이 없어 이 저장소를 한 번 clone하면 BE·FE 코드가 함께 내려옵니다.
