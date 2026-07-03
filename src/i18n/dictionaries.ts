import type { Locale } from "./config";

export const dictionaries = {
  en: {
    nav: {
      overview: "Overview",
      agents: "Agents",
      useCases: "Use Cases",
      install: "Install",
      workflows: "Workflows",
      categories: "Categories",
      roles: "Roles",
      submit: "Submit",
      bookmarks: "Bookmarks",
      about: "About",
      searchPlaceholder: "Search agents, workflows, roles...",
      askAssistant: "Ask Assistant",
      navigation: "Navigation",
      forUsers: "For users",
      forCreators: "For creators",
      forTeams: "For teams",
      gettingStarted: "Getting started",
      howToUseAgents: "How to use agents",
      promptTemplates: "Prompt templates",
      workflowPacks: "Workflow packs",
      submitAgent: "Submit an agent",
      agentCardFormat: "Agent card format",
      bestPractices: "Best practices",
      evaluationGuide: "Evaluation guide",
      internalArchive: "Internal archive",
      teamKnowledgeBase: "Team knowledge base",
      governance: "Governance"
    },
    common: {
      browseAgents: "Browse agents",
      exploreWorkflows: "Explore workflows",
      projectReady: "Project-ready",
      input: "Input",
      agent: "Agent",
      output: "Output",
      finalOutput: "Final output",
      viewWorkflow: "View workflow"
    },
    home: {
      eyebrow: "AI agent archive",
      title: "Agent Archive",
      subtitle: "Find, use, and organize AI agents for every workflow.",
      description:
        "A curated archive of AI agents, prompts, and workflow recipes for real work across planning, design, development, marketing, sales, and operations.",
      overviewTitle: "Overview",
      overviewDescription:
        "Agent Archive is not just a prompt list. Each entry is framed as a reusable work recipe with inputs, expected outputs, practical limits, and related agents.",
      impactTitle: "What changes when agents are used well",
      impactDescription:
        "These example scenarios show the practical shift from scattered requests to reusable outputs, review criteria, and cleaner handoffs.",
      benefitTitle: "Why agents make work easier",
      benefitDescription:
        "Start from the job to be done, then use the agent as a reusable structure for inputs, outputs, and review.",
      benefitCards: [
        {
          title: "Start faster",
          description: "Use input templates and expected output shapes instead of starting from a blank prompt."
        },
        {
          title: "Stabilize quality",
          description: "Each agent gives review criteria, limits, and examples so results are easier to judge."
        },
        {
          title: "Improve handoffs",
          description: "Requests, execution notes, and next steps become easier for teammates to reuse."
        }
      ],
      featuredAgents: "Featured Agents",
      featuredDescription: "A starting set of practical agents for common work handoffs.",
      browseByRole: "Browse by Role",
      browseByTask: "Browse by Task",
      workflowPacks: "Workflow Packs",
      workflowDescription: "Multi-agent playbooks for complete business and production workflows."
    },
    impact: {
      before: "Before",
      after: "After",
      flow: "Agent flow",
      outputs: "Outputs created",
      benefit: "Plain benefit",
      bestStart: "Best place to start",
      workflowLinked: "Workflow-linked"
    },
    cases: {
      metadataTitle: "Use Cases",
      eyebrow: "Applied library",
      title: "Use Cases",
      description:
        "Browse practical Korean work scenarios connected to reusable agents. Start from a problem, then open the agent that can produce the output.",
      impactTitle: "Before and after",
      impactDescription:
        "Start here if agents are new to you. Each scenario shows the work state before, the agents used, and the visible output after.",
      guideTitle: "Find an agent from the problem",
      guideDescription:
        "Search by the work that feels slow or unclear. Each card connects that problem to a usable agent, example input, and expected result.",
      searchPlaceholder: "Search use cases by problem, workflow, agent, role...",
      showing: "Showing",
      of: "of",
      useCases: "use cases",
      activeFilters: "active filters",
      clearAll: "Clear all",
      noResultsTitle: "No use cases found.",
      noResultsDescription: "Try another problem, role, workflow, or agent keyword.",
      useAgentNow: "Use this agent now",
      context: "Context",
      howToUse: "How to use",
      expectedResult: "Expected result",
      recommendedWorkflow: "Recommended workflow",
      standaloneAgent: "Standalone agent",
      exampleInput: "example input",
      agent: "Agent",
      role: "Role",
      category: "Category",
      workflow: "Workflow"
    },
    agents: {
      title: "Agents",
      eyebrow: "Library",
      description: "Search and filter practical AI agents by role, task, tool, automation level, and verification status.",
      tocLibrary: "Agent Library",
      filters: "Filters"
    },
    install: {
      title: "Install Agents",
      eyebrow: "Project-ready",
      description: "Download agent kits, copy the generated files into your project, and use the included runbook to prepare context and review outputs.",
      starterPacks: "Starter packs",
      projectReadyAgents: "Project-ready agents"
    },
    workflows: {
      title: "Workflow Packs",
      eyebrow: "Playbooks",
      description: "Multi-agent workflows that combine planning, research, copy, development, and operations into complete playbooks.",
      steps: "Steps"
    },
    categories: {
      title: "Categories",
      eyebrow: "Taxonomy",
      description: "Browse agents by the kind of work they support."
    },
    roles: {
      title: "Roles",
      eyebrow: "Audience",
      description: "Start from the user role and find agents that fit the work context."
    },
    bookmarks: {
      title: "Bookmarks",
      eyebrow: "Saved",
      description: "Your locally saved agents. Bookmarks are stored in this browser only."
    },
    agentDetail: {
      effectSummaryTitle: "Expected effect",
      effectSummaryDescription: "Use this summary to decide quickly whether the agent fits the work in front of you.",
      reducesWork: "Reduces",
      createsOutput: "Creates",
      nextStep: "Next step"
    }
  },
  ko: {
    nav: {
      overview: "개요",
      agents: "에이전트",
      useCases: "활용 사례",
      install: "설치",
      workflows: "워크플로우",
      categories: "카테고리",
      roles: "직군",
      submit: "제출",
      bookmarks: "북마크",
      about: "소개",
      searchPlaceholder: "에이전트, 워크플로우, 직군 검색...",
      askAssistant: "어시스턴트에게 묻기",
      navigation: "내비게이션",
      forUsers: "사용자용",
      forCreators: "제작자용",
      forTeams: "팀용",
      gettingStarted: "시작하기",
      howToUseAgents: "에이전트 사용법",
      promptTemplates: "프롬프트 템플릿",
      workflowPacks: "워크플로우 팩",
      submitAgent: "에이전트 제출",
      agentCardFormat: "에이전트 카드 형식",
      bestPractices: "베스트 프랙티스",
      evaluationGuide: "평가 가이드",
      internalArchive: "내부 아카이브",
      teamKnowledgeBase: "팀 지식 베이스",
      governance: "거버넌스"
    },
    common: {
      browseAgents: "에이전트 둘러보기",
      exploreWorkflows: "워크플로우 보기",
      projectReady: "프로젝트 적용 가능",
      input: "입력",
      agent: "에이전트",
      output: "산출물",
      finalOutput: "최종 산출물",
      viewWorkflow: "워크플로우 보기"
    },
    home: {
      eyebrow: "AI 에이전트 아카이브",
      title: "Agent Archive",
      subtitle: "업무 흐름에 맞는 AI 에이전트를 찾고, 활용하고, 정리하세요.",
      description:
        "기획, 디자인, 개발, 마케팅, 세일즈, 운영 업무에 바로 적용할 수 있는 AI 에이전트, 프롬프트, 워크플로우 레시피 아카이브입니다.",
      overviewTitle: "개요",
      overviewDescription:
        "Agent Archive는 단순 프롬프트 목록이 아닙니다. 각 항목은 입력, 기대 산출물, 한계, 관련 에이전트를 갖춘 재사용 가능한 업무 레시피로 구성됩니다.",
      impactTitle: "에이전트를 잘 쓰면 무엇이 달라질까",
      impactDescription:
        "흩어진 요청이 재사용 가능한 산출물, 검토 기준, 명확한 업무 인수인계로 바뀌는 과정을 예시로 보여줍니다.",
      benefitTitle: "에이전트가 일을 쉽게 만드는 방식",
      benefitDescription:
        "해야 할 업무에서 시작해 입력, 산출물, 검토 기준을 재사용 가능한 구조로 바꿉니다.",
      benefitCards: [
        {
          title: "시작이 빨라짐",
          description: "빈 프롬프트에서 고민하지 않고 입력 템플릿과 산출물 구조를 바로 사용합니다."
        },
        {
          title: "품질이 안정됨",
          description: "예시, 한계, 검토 기준이 함께 있어 결과물을 판단하기 쉬워집니다."
        },
        {
          title: "인수인계가 쉬워짐",
          description: "요청, 실행 메모, 다음 단계가 팀원이 다시 쓸 수 있는 형태로 남습니다."
        }
      ],
      featuredAgents: "추천 에이전트",
      featuredDescription: "자주 쓰이는 업무 인수인계를 위한 실용 에이전트 모음입니다.",
      browseByRole: "직군별 탐색",
      browseByTask: "업무별 탐색",
      workflowPacks: "워크플로우 팩",
      workflowDescription: "기획, 리서치, 카피, 개발, 운영을 하나의 흐름으로 묶은 다중 에이전트 플레이북입니다."
    },
    impact: {
      before: "사용 전",
      after: "사용 후",
      flow: "에이전트 사용 흐름",
      outputs: "만들어지는 산출물",
      benefit: "쉽게 말하면",
      bestStart: "이럴 때 시작하세요",
      workflowLinked: "워크플로우 연결"
    },
    cases: {
      metadataTitle: "활용 사례",
      eyebrow: "실무 적용 라이브러리",
      title: "활용 사례",
      description:
        "재사용 가능한 에이전트와 연결된 실무 시나리오를 살펴보세요. 문제에서 시작해 필요한 산출물을 만드는 에이전트로 이동할 수 있습니다.",
      impactTitle: "Before and After",
      impactDescription:
        "에이전트가 낯설다면 여기서 시작하세요. 각 시나리오는 사용 전 업무 상태, 사용한 에이전트, 사용 후 보이는 산출물을 보여줍니다.",
      guideTitle: "문제에서 에이전트 찾기",
      guideDescription:
        "느리거나 불명확한 업무를 검색하세요. 각 카드는 그 문제를 해결할 에이전트, 예시 입력, 기대 산출물로 연결됩니다.",
      searchPlaceholder: "문제, 워크플로우, 에이전트, 직군으로 검색...",
      showing: "총",
      of: "/",
      useCases: "개 활용 사례 표시",
      activeFilters: "개 필터 적용",
      clearAll: "모두 지우기",
      noResultsTitle: "활용 사례를 찾지 못했습니다.",
      noResultsDescription: "다른 문제, 직군, 워크플로우, 에이전트 키워드로 검색해보세요.",
      useAgentNow: "이 에이전트 사용하기",
      context: "맥락",
      howToUse: "사용 방법",
      expectedResult: "기대 결과",
      recommendedWorkflow: "추천 워크플로우",
      standaloneAgent: "단독 에이전트",
      exampleInput: "예시 입력",
      agent: "에이전트",
      role: "직군",
      category: "카테고리",
      workflow: "워크플로우"
    },
    agents: {
      title: "에이전트",
      eyebrow: "라이브러리",
      description: "직군, 업무, 도구, 자동화 수준, 검증 상태 기준으로 실용 AI 에이전트를 검색하고 필터링하세요.",
      tocLibrary: "에이전트 라이브러리",
      filters: "필터"
    },
    install: {
      title: "에이전트 설치",
      eyebrow: "프로젝트 적용 가능",
      description: "에이전트 키트를 내려받아 프로젝트에 복사하고, 포함된 runbook으로 입력 준비와 결과 검토를 진행하세요.",
      starterPacks: "스타터 팩",
      projectReadyAgents: "프로젝트 적용 가능 에이전트"
    },
    workflows: {
      title: "워크플로우 팩",
      eyebrow: "플레이북",
      description: "기획, 리서치, 카피, 개발, 운영을 완성된 플레이북으로 연결하는 다중 에이전트 워크플로우입니다.",
      steps: "단계"
    },
    categories: {
      title: "카테고리",
      eyebrow: "분류",
      description: "지원하는 업무 유형별로 에이전트를 둘러보세요."
    },
    roles: {
      title: "직군",
      eyebrow: "사용자",
      description: "사용자 직군에서 시작해 현재 업무 맥락에 맞는 에이전트를 찾으세요."
    },
    bookmarks: {
      title: "북마크",
      eyebrow: "저장됨",
      description: "이 브라우저에 로컬로 저장된 에이전트입니다. 북마크는 현재 브라우저에만 저장됩니다."
    },
    agentDetail: {
      effectSummaryTitle: "기대 효과 요약",
      effectSummaryDescription: "현재 업무에 이 에이전트가 맞는지 빠르게 판단하기 위한 요약입니다.",
      reducesWork: "줄여주는 일",
      createsOutput: "얻는 산출물",
      nextStep: "다음 단계"
    }
  }
} as const;

type WidenStrings<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : WidenStrings<T[K]>;
};

export type Dictionary = WidenStrings<(typeof dictionaries)["en"]>;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
