# 프로젝트 개발 요청서: Agent Archive

## 0. 프로젝트 개요

나는 다양한 AI 에이전트, 프롬프트, 워크플로우, 업무 자동화 템플릿을 모아두는 아카이빙 사이트를 만들고 싶다.

이 서비스는 단순한 프롬프트 모음집이 아니라, 여러 직군과 업무 상황에서 바로 사용할 수 있는 AI 에이전트들을 정리하고, 검색하고, 상세 사용법을 확인하고, 프롬프트를 복사해서 바로 활용할 수 있는 플랫폼이다.

참고 디자인 방향은 `Agent Skills` 같은 심플한 다크모드 문서형 UI다.

핵심 컨셉은 다음과 같다.

- 다양한 직군/기능별 AI 에이전트 아카이브
- 에이전트 검색
- 카테고리/태그 기반 탐색
- 에이전트 상세 설명
- 프롬프트 복사
- 업무 플로우 단위의 에이전트 조합
- 심플하고 고급스러운 개발자 문서형 UI
- 추후에는 실제 실행형 에이전트 플랫폼으로 확장 가능

---

## 1. 서비스 이름

우선 MVP 이름은 다음 중 하나로 사용할 수 있게 구성한다.

- Agent Archive
- AgentShelf
- Agent Library
- Skill Archive

현재는 `Agent Archive`를 기본 서비스명으로 사용한다.

---

## 2. 핵심 사용자

이 서비스의 주요 사용자는 다음과 같다.

### 1) AI를 업무에 활용하고 싶은 실무자

- 기획자
- PM
- 디자이너
- 퍼블리셔
- 프론트엔드 개발자
- 백엔드 개발자
- 마케터
- 영업
- CS
- 대표/1인 사업자
- 콘텐츠 크리에이터

### 2) AI 에이전트를 만들고 공유하고 싶은 사용자

- 프롬프트 엔지니어
- 자동화 설계자
- 개발자
- AI 활용 고급 사용자

### 3) 내부 지식관리 시스템이 필요한 조직

- 회사 내부에서 프롬프트/에이전트/업무 자동화 레시피를 모아두고 싶은 팀
- 부서별 AI 활용 사례를 정리하고 싶은 조직

---

## 3. MVP 목표

이번 1차 개발의 목표는 다음이다.

> 다양한 AI 에이전트들을 문서형 UI로 정리하고, 사용자가 검색/탐색/상세 확인/프롬프트 복사를 할 수 있는 MVP를 만든다.

초기에는 실제 AI 실행 기능까지 만들지 않는다.  
우선은 아카이브, 검색, 상세 페이지, 복사 기능에 집중한다.

---

## 4. 핵심 기능

### 4-1. 메인 화면

메인 화면에는 다음 요소가 필요하다.

- 상단 로고: Agent Archive
- 중앙 검색창
- Ask Assistant 버튼
- GitHub 링크 영역
- 다크모드 토글 아이콘
- 좌측 사이드바
- 중앙 콘텐츠 영역
- 우측 On this page 목차 영역

메인 콘텐츠 구성은 다음과 같다.

1. Hero 영역
   - 타이틀: Agent Archive
   - 서브타이틀: Find, use, and organize AI agents for every workflow.
   - 설명: 다양한 직군과 업무 상황에서 바로 사용할 수 있는 AI 에이전트, 프롬프트, 워크플로우를 모아둔 아카이브입니다.

2. Overview 섹션
   - Agent Archive가 무엇인지 설명
   - 프롬프트 모음집이 아니라, 실제 업무 단위의 에이전트 레시피 플랫폼이라는 점 강조

3. Featured Agents 섹션
   - 인기 에이전트 카드 6개 노출

4. Browse by Role 섹션
   - 기획자
   - PM
   - 디자이너
   - 개발자
   - 마케터
   - 1인 사업자

5. Browse by Task 섹션
   - 리서치
   - 요약
   - 기획
   - 문서화
   - 코드 생성
   - 마케팅
   - 자동화

6. Workflow Packs 섹션
   - 홈페이지 제작 플로우
   - 회의록 자동화 플로우
   - Codex 개발 플로우
   - 콘텐츠 제작 플로우

---

## 5. 전체 페이지 구조

다음 페이지들을 만든다.

```txt
/
메인 / Overview

/agents
에이전트 목록

/agents/[slug]
에이전트 상세

/categories
카테고리 목록

/categories/[slug]
카테고리별 에이전트 목록

/roles
직군 목록

/roles/[slug]
직군별 에이전트 목록

/workflows
업무 플로우 목록

/workflows/[slug]
업무 플로우 상세

/submit
에이전트 제출 페이지

/about
서비스 소개

/bookmarks
즐겨찾기 페이지
6. 디자인 방향

전체 디자인은 첨부한 Agent Skills 스타일을 참고한다.

단, 그대로 복제하지 말고 다음 방향성을 따른다.

6-1. 전체 톤
다크모드 기반
문서형 사이트 느낌
개발자 도구 같은 신뢰감
불필요한 장식 최소화
정보 구조가 명확한 UI
GitHub 문서, Mintlify, Linear Docs, Vercel Docs 같은 느낌
6-2. 레이아웃

전체 구조는 4단 구조로 잡는다.

┌──────────────────────────────────────────────┐
│ Top Navigation                               │
├──────────────┬─────────────────┬─────────────┤
│ Left Sidebar │ Main Content    │ Right TOC   │
│              │                 │             │
└──────────────┴─────────────────┴─────────────┘
6-3. 상단 네비게이션

높이: 약 72px

포함 요소:

좌측: 서비스명 Agent Archive
중앙: 검색창
검색창 placeholder: Search agents, workflows, roles...
우측:
Ask Assistant 버튼
GitHub 아이콘/링크
Star count 느낌의 텍스트
다크모드/라이트모드 토글 아이콘
6-4. 좌측 사이드바

좌측 사이드바는 문서형 내비게이션으로 구성한다.

예시:

Overview
Agents
Workflows
Categories
Roles

For users
- Getting started
- How to use agents
- Prompt templates
- Workflow packs

For creators
- Submit an agent
- Agent card format
- Best practices
- Evaluation guide

For teams
- Internal archive
- Team knowledge base
- Governance

선택된 메뉴는 라운드 배경으로 강조한다.

6-5. 중앙 콘텐츠 영역
최대 너비: 760~860px
텍스트는 넓게 퍼지지 않도록 제한
제목은 크고 명확하게
본문은 가독성 높은 회색 톤
코드블록, 카드, 배지, 태그를 적극 활용
6-6. 우측 On this page

상세 페이지와 문서형 페이지에는 우측 목차를 보여준다.

예시:

On this page

What is this agent?
When to use
Inputs
Outputs
Prompt
Example
Limitations
Related agents

스크롤 위치에 따라 active 상태가 바뀌면 좋지만, MVP에서는 고정 목차만 구현해도 된다.

7. 컬러 시스템

다크모드 기준 컬러를 다음과 같이 사용한다.

Background Primary: #0B0B0F
Background Secondary: #111217
Background Elevated: #17181F
Border: #262832
Text Primary: #F4F4F5
Text Secondary: #A1A1AA
Text Muted: #71717A
Accent: #8B5CF6 또는 #60A5FA
Success: #22C55E
Warning: #F59E0B
Danger: #EF4444

라이트모드도 추후 확장 가능하게 구성한다.
하지만 MVP는 다크모드 우선으로 개발한다.

8. 컴포넌트 요구사항

다음 컴포넌트를 분리해서 만든다.

Layout
AppShell
TopNav
Sidebar
RightToc
MainContainer
Agent
AgentCard
AgentDetailHeader
AgentMeta
AgentPromptBlock
AgentExampleBlock
AgentRelatedList
Search
SearchInput
SearchResultItem
EmptyState
Common
Badge
Tag
Button
Card
CopyButton
SectionHeading
CodeBlock
Tabs
FilterGroup
9. 에이전트 데이터 구조

초기에는 DB 없이 로컬 mock data 또는 JSON/TS 파일로 관리해도 된다.
추후 Supabase나 DB 연동이 가능하도록 데이터 구조를 명확하게 만든다.

에이전트 데이터 타입은 다음과 같이 설계한다.

export type Agent = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;

  roles: string[];
  categories: string[];
  tags: string[];

  difficulty: "beginner" | "intermediate" | "advanced";
  automationLevel: 1 | 2 | 3 | 4 | 5;

  tools: string[];

  useCases: string[];
  inputs: string[];
  outputs: string[];

  prompt: string;

  exampleInput?: string;
  exampleOutput?: string;

  limitations?: string[];
  bestPractices?: string[];

  relatedAgents?: string[];

  verifiedStatus: "unverified" | "tested" | "community" | "expert";
  createdBy?: string;
  updatedAt: string;
};
10. 업무 플로우 데이터 구조

업무 플로우는 여러 에이전트를 조합한 플레이북이다.

export type Workflow = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;

  targetUsers: string[];
  categories: string[];
  estimatedTime: string;

  steps: {
    order: number;
    title: string;
    description: string;
    agentSlug: string;
    expectedOutput: string;
  }[];

  finalOutput: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};
11. 초기 샘플 에이전트

MVP에는 최소 20개의 샘플 에이전트를 넣는다.

기획/PM
서비스 기획서 생성 에이전트
IA/사이트맵 구성 에이전트
기능 요구사항 정리 에이전트
사용자 시나리오 작성 에이전트
정책 문서 작성 에이전트
개발/Codex
Codex 작업지시서 생성 에이전트
버그 원인 분석 에이전트
PR 리뷰 에이전트
README 생성 에이전트
배포 체크리스트 에이전트
디자인/웹 제작
랜딩페이지 섹션 설계 에이전트
홈페이지 리서치 에이전트
카피라이팅 에이전트
와이어프레임 텍스트 설계 에이전트
디자인 QA 체크 에이전트
마케팅/사업
인스타 콘텐츠 기획 에이전트
고객 DM 작성 에이전트
경쟁사 분석 에이전트
가격 정책 설계 에이전트
견적서 작성 에이전트

각 에이전트에는 반드시 다음 정보를 채워 넣는다.

이름
요약
설명
대상 직군
카테고리
태그
난이도
자동화 레벨
사용 도구
입력값
출력값
프롬프트
사용 예시
한계점
관련 에이전트
12. 초기 샘플 워크플로우

최소 5개의 워크플로우를 만든다.

1. 홈페이지 외주 제안 플로우

단계:

고객 업종 분석 에이전트
경쟁사 리서치 에이전트
사이트맵 구성 에이전트
랜딩페이지 섹션 설계 에이전트
견적서 작성 에이전트
Codex 작업지시서 생성 에이전트
2. Codex 개발 준비 플로우

단계:

아이디어 정리 에이전트
기능 요구사항 정리 에이전트
기술 스택 추천 에이전트
파일 구조 설계 에이전트
Codex 작업지시서 생성 에이전트
QA 체크리스트 에이전트
3. 회의록 자동화 플로우

단계:

녹취록 정리 에이전트
핵심 인사이트 추출 에이전트
액션아이템 정리 에이전트
발표용 요약 에이전트
후속 메시지 작성 에이전트
4. 콘텐츠 제작 플로우

단계:

아이디어 발산 에이전트
타깃 독자 정의 에이전트
글 구조 설계 에이전트
본문 작성 에이전트
카드뉴스 변환 에이전트
5. 로컬 비즈니스 검증 플로우

단계:

지역 상권 분석 에이전트
고객 페르소나 도출 에이전트
경쟁 서비스 분석 에이전트
랜딩페이지 카피 에이전트
DM 메시지 작성 에이전트
반응률 분석 에이전트
13. 에이전트 상세 페이지 구성

/agents/[slug] 상세 페이지는 다음 구조로 만든다.

Agent Header
- 이름
- 요약
- 대상 직군
- 카테고리
- 난이도
- 자동화 레벨
- 검증 상태

What this agent does
- 이 에이전트가 해결하는 문제

When to use
- 언제 쓰면 좋은지

Inputs
- 사용자가 입력해야 하는 정보

Outputs
- 기대 결과물

Prompt
- 바로 복사 가능한 프롬프트
- Copy 버튼

Example
- 예시 입력
- 예시 출력

Best practices
- 잘 쓰는 팁

Limitations
- 한계점

Related agents
- 관련 에이전트 카드
14. 에이전트 카드 UI

카드에는 다음 정보를 보여준다.

[검증 배지] [난이도]

에이전트 이름
짧은 설명

태그 3~5개

대상 직군
자동화 레벨
사용 도구

View agent →

카드는 hover 시 border와 background가 살짝 밝아지게 한다.

15. 검색 기능

MVP 검색은 클라이언트 사이드 필터링으로 구현한다.

검색 대상:

에이전트 이름
요약
설명
태그
카테고리
대상 직군
사용 도구

검색창은 상단 네비게이션과 에이전트 목록 페이지에 모두 둔다.

검색 결과가 없을 경우 다음 문구를 보여준다.

No agents found.
Try searching by role, task, tool, or workflow.
16. 필터 기능

/agents 페이지에서 다음 필터를 제공한다.

Role
Category
Difficulty
Automation Level
Tool
Verified Status

필터는 다중 선택 가능하면 좋지만, MVP에서는 단일 선택 또는 버튼 필터로 구현해도 된다.

17. 즐겨찾기 기능

로그인 없이 localStorage 기반으로 즐겨찾기를 구현한다.

기능:

에이전트 카드에서 북마크 추가/해제
상세 페이지에서 북마크 추가/해제
/bookmarks 페이지에서 즐겨찾기한 에이전트 목록 확인
18. 프롬프트 복사 기능

상세 페이지의 Prompt 영역에는 Copy 버튼을 둔다.

클릭하면 클립보드에 프롬프트가 복사되고, 버튼 텍스트가 잠깐 다음처럼 변경된다.

Copied!
19. 제출 페이지

/submit 페이지는 실제 DB 저장 없이 폼 UI만 만든다.

필드:

Agent name
Summary
Role
Category
Tags
Tools
Prompt
Example input
Example output
Creator name
Notes

제출 버튼 클릭 시 실제 저장은 하지 않고 다음 메시지를 표시한다.

Thanks for your submission. Review flow will be added soon.
20. 기술 스택

새 프로젝트라면 다음 스택으로 구성한다.

Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui 사용 가능
lucide-react 아이콘 사용
로컬 mock data 기반
추후 Supabase 연동 가능하도록 구조화

이미 프로젝트가 존재한다면 기존 스택을 우선 분석하고, 기존 구조를 최대한 유지하면서 구현한다.

21. 폴더 구조 예시

다음과 같은 구조를 권장한다.

src/
  app/
    page.tsx
    agents/
      page.tsx
      [slug]/
        page.tsx
    categories/
      page.tsx
      [slug]/
        page.tsx
    roles/
      page.tsx
      [slug]/
        page.tsx
    workflows/
      page.tsx
      [slug]/
        page.tsx
    submit/
      page.tsx
    about/
      page.tsx
    bookmarks/
      page.tsx

  components/
    layout/
      app-shell.tsx
      top-nav.tsx
      sidebar.tsx
      right-toc.tsx
      main-container.tsx

    agents/
      agent-card.tsx
      agent-detail-header.tsx
      agent-prompt-block.tsx
      agent-meta.tsx
      related-agents.tsx

    workflows/
      workflow-card.tsx
      workflow-steps.tsx

    common/
      badge.tsx
      tag.tsx
      copy-button.tsx
      search-input.tsx
      empty-state.tsx
      section-heading.tsx

  data/
    agents.ts
    workflows.ts
    categories.ts
    roles.ts

  lib/
    search.ts
    filters.ts
    bookmarks.ts
    utils.ts

  types/
    agent.ts
    workflow.ts
22. 반응형 기준

반응형은 다음 기준으로 구현한다.

Desktop
좌측 사이드바 고정
중앙 콘텐츠
우측 TOC 표시
Tablet
우측 TOC 숨김
좌측 사이드바는 유지 또는 접힘
Mobile
좌측 사이드바 숨김
상단 메뉴 버튼으로 열 수 있게 구성
검색창은 상단 또는 본문 상단에 배치
카드 그리드는 1열
23. UX 디테일

다음 UX를 반영한다.

검색창 클릭 시 포커스 스타일 명확히 표시
카드 hover 인터랙션
버튼 hover 인터랙션
현재 페이지의 사이드바 메뉴 active 처리
태그 클릭 시 해당 태그 기반 필터 페이지 또는 검색 결과로 이동
프롬프트 복사 시 즉각적인 피드백
빈 상태 UI 제공
로딩 상태는 mock data 기준에서는 생략 가능
24. 문구 톤

전체 문구는 영어 기반으로 작성한다.

서비스가 개발자 문서형 UI를 지향하기 때문에 메뉴, 버튼, 섹션 타이틀은 영어로 구성한다.

예시:

Agent Archive
Overview
Agents
Workflows
Categories
Roles
Submit
Getting started
Prompt templates
Workflow packs
Copy prompt
View agent
Related agents

단, 코드 구조는 다국어 확장이 가능하게 너무 하드코딩을 복잡하게 만들 필요는 없다.

25. 중요한 차별점

이 프로젝트는 단순 프롬프트 저장소가 아니다.

다음 차별점을 UI와 데이터 구조에 반영한다.

1. 업무 맥락 중심

에이전트를 기능이 아니라 실제 업무 상황 기준으로 설명한다.

나쁜 예:

SEO Prompt

좋은 예:

Website SEO Audit Agent
- 웹사이트 URL을 기반으로 SEO 문제를 점검하고 개선 우선순위를 제안합니다.
2. 입력값/출력값 명확화

각 에이전트마다 사용자가 무엇을 넣어야 하고, 무엇을 받을 수 있는지 명확히 보여준다.

3. 검증 상태

에이전트의 신뢰도를 표시한다.

Unverified
Tested
Community Verified
Expert Reviewed
4. 업무 플로우

단일 에이전트가 아니라 여러 에이전트를 묶은 workflow를 제공한다.

5. 복사해서 바로 쓰는 구조

모든 상세 페이지에는 즉시 복사 가능한 Prompt 영역이 있어야 한다.

26. 구현 순서

아래 순서대로 개발한다.

Step 1. 프로젝트 구조 정리
Next.js + TypeScript + Tailwind 설정
기본 라우팅 생성
전체 레이아웃 구성
Step 2. 디자인 시스템 구현
컬러 토큰
버튼
카드
배지
태그
코드블록
검색창
Step 3. 레이아웃 구현
TopNav
Sidebar
RightToc
AppShell
Step 4. 데이터 타입 정의
Agent 타입
Workflow 타입
Category 타입
Role 타입
Step 5. Mock data 작성
에이전트 20개
워크플로우 5개
카테고리
직군
Step 6. 페이지 구현
메인
에이전트 목록
에이전트 상세
워크플로우 목록
워크플로우 상세
카테고리
직군
제출
즐겨찾기
소개
Step 7. 기능 구현
검색
필터
프롬프트 복사
즐겨찾기
active nav 처리
Step 8. 반응형 대응
Desktop
Tablet
Mobile
Step 9. 마무리
코드 정리
타입 에러 제거
빌드 확인
README 작성
27. 완료 기준

개발 완료 후 다음 조건을 만족해야 한다.

npm run dev로 정상 실행된다.
npm run build가 성공한다.
메인 페이지가 정상 표시된다.
에이전트 목록 페이지에서 검색이 가능하다.
에이전트 상세 페이지가 slug 기반으로 열린다.
프롬프트 복사 기능이 동작한다.
즐겨찾기 기능이 localStorage 기반으로 동작한다.
워크플로우 목록/상세 페이지가 동작한다.
모바일에서도 깨지지 않는다.
다크모드 기반 디자인이 적용되어 있다.
전체 UI가 첨부한 Agent Skills 레퍼런스처럼 심플한 문서형 레이아웃으로 보인다.
28. README 작성 요청

마지막으로 README.md를 작성한다.

README에는 다음 내용을 포함한다.

# Agent Archive

## Overview
Agent Archive is a curated library of AI agents, prompts, and workflow recipes for real-world work.

## Features
- Browse agents by role, category, and task
- Search agents
- View detailed agent cards
- Copy prompts
- Explore workflow packs
- Bookmark useful agents
- Submit new agent ideas

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS

## Getting Started
npm install
npm run dev

## Future Roadmap
- Supabase database
- Authentication
- Community submissions
- Agent execution
- Team workspace
- Private internal agent archive
29. 주의사항
너무 화려한 랜딩페이지처럼 만들지 말 것
문서형, 아카이브형, 개발자 도구형 느낌을 유지할 것
정보 구조를 최우선으로 할 것
카드와 상세 페이지의 가독성을 중요하게 볼 것
초기에는 기능보다 구조와 확장성을 우선할 것
실제 AI API 호출은 이번 MVP에서 구현하지 말 것
DB 없이 mock data로 시작하되, 추후 DB로 옮기기 쉽도록 타입과 구조를 명확히 할 것
디자인은 첨부 이미지의 Agent Skills 스타일을 참고하되 그대로 복제하지 말 것