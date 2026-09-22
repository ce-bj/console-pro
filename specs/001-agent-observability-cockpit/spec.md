# Feature Specification: Agent Observability Cockpit

**Feature Branch**: `001-agent-observability-cockpit`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Langfuse 可以实现的方案和产品原型不够直观；使用 Spec Kit 思路重新分析并优化产品文档和 prototype。产品后台需要能看全部智能体运行信息，并能点击某个智能体查看详情。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Platform-wide agent health overview (Priority: P1)

As a platform product operator, I need a product-backend cockpit that shows all customer agents together, so I can immediately know whether the agent fleet is healthy, which customers are at risk, and where to drill down.

**Why this priority**: Without this view, the operator must inspect individual traces or isolated dashboards and cannot answer the first product question: "Which agents need attention today?"

**Independent Test**: Can be tested by opening the product-backend agent operations page and verifying that the page answers, within one screen, total agents, healthy/warning/risk distribution, total traces, average success, average RAG quality, and a full agent list.

**Acceptance Scenarios**:

1. **Given** the platform has multiple customer agents, **When** the operator opens the cockpit, **Then** they see aggregate health, quality, and conversion metrics across all agents.
2. **Given** some agents have risk signals, **When** the operator scans the agent list, **Then** they can distinguish healthy, warning, and risk agents without opening Langfuse.
3. **Given** the operator wants to investigate one agent, **When** they click "查看详情", **Then** they enter that agent's detail page with company, agent name, model, knowledge version, and status context preserved.

---

### User Story 2 - Explain what Langfuse enables in business language (Priority: P1)

As a product manager or operations lead, I need the documentation and page to explain how Langfuse data becomes product actions, so I can understand the value of traces, observations, scores, datasets, and evaluation runs without reading SDK-level details.

**Why this priority**: The existing plan explains modules and metrics, but the decision path from "Langfuse captured data" to "operator action" is not visual enough. Stakeholders need a clear operating loop.

**Independent Test**: Can be tested by reading the product plan and confirming it contains a clear "发现问题 → 定位原因 → 分派动作 → 回放验证" loop and maps Langfuse objects to business actions.

**Acceptance Scenarios**:

1. **Given** a non-engineering stakeholder reads the plan, **When** they reach the Langfuse section, **Then** they can explain what trace, observation, score, dataset, and evaluation run are used for in business terms.
2. **Given** the stakeholder sees a risk case such as "price question answered without RAG", **When** they follow the flow, **Then** they can identify the responsible module and next product action.

---

### User Story 3 - Single-agent diagnostic detail (Priority: P2)

As a platform operator, I need a single-agent detail page that turns raw Langfuse traces into diagnosis panels, so I can understand one agent's monitoring status, conversation quality, knowledge quality, evaluation results, and alerts.

**Why this priority**: A global list identifies where to look, but remediation requires a focused view for one customer's one agent.

**Independent Test**: Can be tested by opening any agent detail page and verifying that the page shows the agent context, an intuitive trace-to-action explanation, and the five diagnostic tabs.

**Acceptance Scenarios**:

1. **Given** an operator opens an agent detail page, **When** they inspect the header, **Then** they see company name, agent name, model, knowledge version, and health status.
2. **Given** the operator is not familiar with Langfuse internals, **When** they inspect the trace explanation panel, **Then** they understand how user input, RAG/tool calls, analysis results, quality scores, and product actions connect.
3. **Given** a conversation has low quality, **When** the operator opens the quality review tab, **Then** they can score the turn, assign root cause, add notes, and mark it for evaluation.

---

### User Story 4 - Close the optimization loop (Priority: P3)

As a product and knowledge operations team, we need the cockpit to show not only problems but also the next action and validation path, so issues can move from discovery to remediation to regression testing.

**Why this priority**: Monitoring alone is insufficient. The product value comes from repeatedly improving knowledge, prompt, model, and business configuration.

**Independent Test**: Can be tested by taking any risk row and verifying that it points to a next action such as quality review, knowledge task, alert owner, or evaluation dataset.

**Acceptance Scenarios**:

1. **Given** a RAG no-hit problem appears, **When** the operator views knowledge quality, **Then** they can create a knowledge补录 task and see affected turns.
2. **Given** a bad answer is reviewed, **When** the reviewer submits manual quality feedback, **Then** the case can be used as an evaluation sample.
3. **Given** a candidate version is evaluated, **When** the score is below threshold, **Then** the evaluation center marks it as blocked and exposes failed sample counts.

### Edge Cases

- If there are no risk agents, the cockpit should still show total agents and empty-state guidance for how monitoring will populate.
- If an agent has no recent traces, the list should show last active time and avoid implying current health is known.
- If a metric is unavailable, the page should distinguish "no data" from "zero".
- If a user follows an old direct route, they should be redirected or still land in the product-backend context.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product backend MUST provide a platform-wide agent operations overview that is not presented as a customer-facing module.
- **FR-002**: The overview MUST show aggregate agent count, health distribution, total trace volume, average success rate, average RAG hit rate, and average lead completion rate.
- **FR-003**: The overview MUST include a list of all customer agents with company name, agent name, industry, health status, model, knowledge version, trace count, success rate, RAG hit rate, lead completion rate, handoff rate, risk count, and last active time.
- **FR-004**: Users MUST be able to filter or search the all-agent list by status and text keyword.
- **FR-005**: Users MUST be able to open a single agent detail page from the all-agent list.
- **FR-006**: The single-agent detail page MUST show company name, agent name, industry, model, knowledge version, and current health status.
- **FR-007**: The product documentation MUST explain Langfuse objects in business language: trace, observation, score, dataset, and evaluation run.
- **FR-008**: The product documentation MUST include an operating loop that connects monitoring signals to root cause, owner, remediation action, and regression validation.
- **FR-009**: The single-agent page MUST expose monitoring, conversation quality review, knowledge quality, evaluation runs, and alert rules as separate diagnostic areas.
- **FR-010**: Conversation quality review MUST allow a reviewer to assign manual score, issue type, root cause, comment, and whether the case should become an evaluation sample.
- **FR-011**: Knowledge quality MUST distinguish healthy hits, low-relevance hits, and knowledge gaps.
- **FR-012**: Evaluation runs MUST distinguish passed, blocked, and running states and show failed sample counts.
- **FR-013**: Alert rules MUST show metric, threshold, status, owner, and most recent trigger time.
- **FR-014**: The page MUST make the difference between platform-level fleet view and single-agent detail view visually clear.
- **FR-015**: The page MUST present the "why this matters" product value, not only raw numbers.

### Key Entities *(include if feature involves data)*

- **Platform Agent Overview**: Aggregate view of all agents, including fleet size, health distribution, quality averages, and conversion averages.
- **Agent**: One customer's configured intelligent agent, with company, model, knowledge version, health status, and operational metrics.
- **Risk Signal**: A detected quality issue such as RAG missed when needed, high intent without lead capture, tool failure, or evaluation regression.
- **Conversation Turn**: A single user-agent exchange with input, reply, tool usage, RAG status, analysis result, quality scores, and review state.
- **Knowledge Quality Item**: A RAG query or topic with hit status, top document, score, knowledge version, and affected turns.
- **Evaluation Run**: A regression test run against a dataset and target version, producing scores and failed sample counts.
- **Alert Rule**: A product-backend rule connecting metric thresholds to responsible owners.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A platform operator can identify the top risk agents from the overview page in under 30 seconds.
- **SC-002**: A platform operator can navigate from an agent in the list to its detail page in one click.
- **SC-003**: A non-engineering stakeholder can explain the Langfuse operating loop after reading the product documentation without needing SDK knowledge.
- **SC-004**: At least five diagnostic areas are visible for a single agent: monitoring, conversation review, knowledge quality, evaluation, and alerts.
- **SC-005**: Every risk item shown in the prototype has an explicit next action, owner, or drill-down path.
- **SC-006**: The prototype passes the existing prototype build and page-contract validation.

## Assumptions

- The cockpit is a product-backend/internal module and is not visible to tenant customers by default.
- Customer-facing knowledge quality pages may still show tenant-owned data, but cross-customer agent operations remain platform-only.
- A single customer can have one or more agents; the v1 prototype models one row per customer agent.
- Langfuse remains the underlying source for traces, observations, scores, datasets, and evaluation runs.
- The first prototype can use mock data, but the displayed fields should match future backend contracts.
