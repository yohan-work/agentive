import type { ImpactScenario } from "@/types/impact";

export const impactScenarios: ImpactScenario[] = [
  {
    slug: "engineering-feature-handoff",
    title: "From loose feature idea to merge-ready handoff",
    audience: "Engineering teams",
    problem: "A feature request reaches the developer as a vague paragraph, so implementation starts before scope, tests, and review criteria are aligned.",
    before: [
      "Feature idea is scattered across chat, a ticket, and a short product note",
      "Codex receives a broad request with missing files, constraints, and non-goals",
      "QA and PR review happen late, after assumptions have already shaped the code"
    ],
    agentSlugs: ["feature-requirements-analyst", "codex-task-brief", "qa-checklist-agent", "pr-review-agent"],
    outputs: ["Implementation-ready requirements", "Codex task brief", "Release QA checklist", "Prioritized PR findings"],
    after: [
      "The developer starts from acceptance criteria and explicit non-goals",
      "Codex receives files, constraints, test plan, and expected behavior before editing",
      "Review focuses on regression risk instead of rediscovering scope"
    ],
    impactMetrics: [
      { label: "Example impact", value: "Fewer rewrite loops before implementation" },
      { label: "Review quality", value: "Findings tied to acceptance criteria" },
      { label: "Team clarity", value: "One shared brief for PM, developer, and reviewer" }
    ],
    plainBenefit: "Turn an unclear request into a shared implementation brief before anyone starts editing code.",
    effectTags: ["Less rework", "Cleaner handoff", "Earlier QA"],
    recommendedStart: "Start here when a feature idea is ready for development but the scope, files, and review criteria are still loose.",
    primaryWorkflowSlug: "codex-development-prep",
    translations: {
      ko: {
        title: "막연한 기능 아이디어를 개발 가능한 인수인계로 바꾸기",
        audience: "개발팀",
        problem: "기능 요청이 짧은 문장으로만 전달되면 범위, 테스트, 리뷰 기준이 정리되기 전에 구현이 시작됩니다.",
        before: [
          "기능 아이디어가 채팅, 티켓, 제품 메모에 흩어져 있음",
          "Codex에 전달되는 요청에 파일, 제약, 제외 범위가 빠져 있음",
          "QA와 PR 리뷰가 늦게 시작되어 이미 만들어진 가정을 다시 확인해야 함"
        ],
        outputs: ["개발 가능한 요구사항", "Codex 작업 브리프", "릴리즈 QA 체크리스트", "우선순위가 있는 PR 리뷰"],
        after: [
          "개발자가 수용 기준과 제외 범위를 먼저 보고 시작함",
          "Codex가 수정 전 파일, 제약, 테스트 계획, 기대 동작을 함께 받음",
          "리뷰가 범위 재확인이 아니라 회귀 위험 확인에 집중됨"
        ],
        impactMetrics: [
          { label: "기대 효과", value: "구현 전 재작성 루프가 줄어듦" },
          { label: "리뷰 품질", value: "리뷰 코멘트가 수용 기준과 연결됨" },
          { label: "팀 정렬", value: "PM, 개발자, 리뷰어가 하나의 브리프를 공유함" }
        ],
        plainBenefit: "불명확한 요청을 코드 수정 전에 모두가 보는 개발 브리프로 바꿉니다.",
        effectTags: ["재작업 감소", "인수인계 명확화", "QA 조기화"],
        recommendedStart: "기능 아이디어는 있지만 범위, 파일, 리뷰 기준이 아직 느슨할 때 시작하세요."
      }
    }
  },
  {
    slug: "product-feedback-to-roadmap",
    title: "From raw customer feedback to roadmap decision",
    audience: "Product teams",
    problem: "Customer feedback is plentiful, but themes, severity, and roadmap tradeoffs are not visible enough to make a confident decision.",
    before: [
      "Support notes and sales comments are reviewed one by one",
      "Roadmap discussion favors loud anecdotes over grouped evidence",
      "The team leaves with priorities but weak rationale"
    ],
    agentSlugs: ["customer-feedback-clusterer", "feature-requirements-analyst", "product-roadmap-prioritizer"],
    outputs: ["Feedback theme map", "Feature requirement candidates", "Prioritized roadmap with assumptions"],
    after: [
      "Repeated problems are grouped by theme, severity, and evidence",
      "Candidate features have clearer acceptance criteria and unresolved questions",
      "Roadmap tradeoffs are visible before leadership chooses sequence"
    ],
    impactMetrics: [
      { label: "Example impact", value: "Roadmap meeting starts from evidence clusters" },
      { label: "Decision quality", value: "Priority includes confidence and effort assumptions" },
      { label: "Handoff value", value: "Chosen items are closer to implementation briefs" }
    ],
    plainBenefit: "Group raw feedback into evidence-backed priorities before roadmap decisions are made.",
    effectTags: ["Evidence first", "Faster prioritization", "Better tradeoffs"],
    recommendedStart: "Start here when feedback volume is high but the team is arguing from individual anecdotes.",
    translations: {
      ko: {
        title: "고객 피드백을 로드맵 결정으로 연결하기",
        audience: "제품팀",
        problem: "고객 피드백은 많지만 테마, 심각도, 우선순위 근거가 보이지 않으면 자신 있게 결정하기 어렵습니다.",
        before: [
          "CS 메모와 세일즈 코멘트를 하나씩 훑어봄",
          "로드맵 논의가 반복 증거보다 강한 일화에 끌려감",
          "우선순위는 정했지만 왜 그렇게 정했는지 근거가 약함"
        ],
        outputs: ["피드백 테마 맵", "기능 요구사항 후보", "가정이 포함된 로드맵 우선순위"],
        after: [
          "반복되는 문제가 테마, 심각도, 증거 기준으로 묶임",
          "후보 기능마다 수용 기준과 남은 질문이 더 분명해짐",
          "리더십이 순서를 정하기 전에 트레이드오프가 보임"
        ],
        impactMetrics: [
          { label: "기대 효과", value: "로드맵 회의가 근거 묶음에서 시작됨" },
          { label: "결정 품질", value: "우선순위에 확신도와 effort 가정이 포함됨" },
          { label: "인수인계 가치", value: "선택된 항목이 구현 브리프에 가까워짐" }
        ],
        plainBenefit: "흩어진 피드백을 로드맵 논의 전에 근거 있는 우선순위로 묶습니다.",
        effectTags: ["근거 중심", "우선순위 정리", "트레이드오프 가시화"],
        recommendedStart: "피드백은 많은데 팀이 개별 사례를 기준으로 논의하고 있을 때 시작하세요."
      }
    }
  },
  {
    slug: "operations-knowledge-system",
    title: "From repeated explanations to reusable operating system",
    audience: "Operations and founder-led teams",
    problem: "Recurring work is explained verbally every time, so quality depends on who happens to remember the process.",
    before: [
      "Meeting notes, policy decisions, and process steps live in separate places",
      "New teammates need repeated explanations before they can execute",
      "Exceptions are handled from memory instead of a shared checklist"
    ],
    agentSlugs: ["meeting-summary-agent", "operations-sop-agent", "policy-doc-writer", "readme-generator"],
    outputs: ["Decision and action summary", "Standard operating procedure", "Policy draft", "Project README"],
    after: [
      "Meetings turn into decisions, owners, and open questions",
      "Recurring work has a trigger, owner, steps, exceptions, and quality checks",
      "New teammates can follow a document instead of asking for the whole context again"
    ],
    impactMetrics: [
      { label: "Example impact", value: "Less repeated explanation for recurring work" },
      { label: "Process quality", value: "Exceptions and checks are visible" },
      { label: "Onboarding value", value: "Documentation becomes the first handoff" }
    ],
    plainBenefit: "Convert recurring explanations into durable operating documents that teammates can reuse.",
    effectTags: ["Less repetition", "Reusable SOPs", "Faster onboarding"],
    recommendedStart: "Start here when the same process is explained repeatedly or quality depends on one person's memory.",
    primaryWorkflowSlug: "meeting-notes-automation",
    translations: {
      ko: {
        title: "반복 설명을 재사용 가능한 운영 문서로 바꾸기",
        audience: "운영팀과 초기 팀",
        problem: "반복 업무를 매번 말로 설명하면 실행 품질이 특정 사람이 기억하는 내용에 의존하게 됩니다.",
        before: [
          "회의록, 정책 결정, 프로세스 단계가 서로 다른 곳에 있음",
          "새 팀원이 실행하기 전에 같은 설명을 반복해서 들어야 함",
          "예외 상황을 공유 체크리스트가 아니라 기억에 의존해 처리함"
        ],
        outputs: ["결정과 액션 요약", "표준 운영 절차", "정책 초안", "프로젝트 README"],
        after: [
          "회의가 결정, 담당자, 남은 질문으로 정리됨",
          "반복 업무에 트리거, 담당자, 단계, 예외, 품질 체크가 생김",
          "새 팀원이 전체 맥락을 다시 묻지 않고 문서를 따라갈 수 있음"
        ],
        impactMetrics: [
          { label: "기대 효과", value: "반복 업무 설명 시간이 줄어듦" },
          { label: "프로세스 품질", value: "예외와 체크 기준이 보임" },
          { label: "온보딩 가치", value: "문서가 첫 번째 인수인계 자료가 됨" }
        ],
        plainBenefit: "매번 다시 설명하던 업무를 팀원이 반복해서 쓸 수 있는 운영 문서로 바꿉니다.",
        effectTags: ["반복 설명 감소", "SOP 재사용", "온보딩 단축"],
        recommendedStart: "같은 프로세스를 계속 설명하거나 품질이 특정 사람의 기억에 의존할 때 시작하세요."
      }
    }
  }
];
