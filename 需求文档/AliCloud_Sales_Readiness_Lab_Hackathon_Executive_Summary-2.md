Executive Summary — Hackathon Build
Project Name
AliCloud Sales Readiness Lab
Built For
Alibaba Cloud (Internal sales teams, solution architects, and partner sellers across Asia)
Why We’re Building This
● New products
● New pricing
● New compliance requirements
● New competitive pressure (AWS, Azure, Tencent)
However, sales readiness does not move at the same speed.
● Certifications test knowledge, not execution
● Reps struggle with live objections, positioning, and clarity
● Managers lack time to coach at scale
● Partner sales quality is inconsistent
● Training content becomes outdated quickly
The gap: Knowing Alibaba Cloud ≠ selling Alibaba Cloud well.
What We’re Building (Hackathon MVP)
● Practice real cloud sales conversations with an AI buyer
● Receive explainable, evidence-based feedback
● Generate conversation-aware follow-up emails
● Allow enablement teams to update scenarios instantly
This is not an LMS. This is not a generic AI chatbot.
It is a practice → feedback → execution loop designed for enterprise cloud sales in Asia.
Who It’s For (Primary Users)
Sales Reps / Solution Architects
● Practice difficult conversations safely
● Improve objection handling before customer meetings
● Reinforce correct positioning in follow-ups
Enablement / Sales Ops
● Update scenarios as products change
● Standardize messaging across regions and partners
● Reduce dependency on manual coaching
Managers (Future Phase)
● See readiness gaps at a glance
● Coach selectively, not constantly
What Success Looks Like in 24 Hours
● Rep selects a real Alibaba Cloud sales scenario
● Multi-turn AI roleplay with a skeptical buyer (CTO / Compliance)
● Explainable feedback with quoted responses
● One-click professional follow-up email generation
● Admin updates scenario without touching code
Explicitly Out of Scope (Hackathon)
● Full LMS
● CRM integrations
● Automated email sending
● Deep analytics dashboards
● Multi-language support
● Partner permission matrices
These are post-hackathon roadmap items.
Technical Overview (High-Level)
Architecture Principles
● Fully Alibaba Cloud–native
● Alibaba Cloud AI + open-source tooling
● Simple, explainable, demo-safe
Core Technical Components
1) AI Roleplay Engine
● Uses Tongyi Qianwen
● Buyer personas (CTO / Compliance)
● Enterprise cloud objections
● China/Asia-specific concerns
2) Explainable Feedback Engine
● Evaluates value articulation, objection handling, technical clarity
● Every score backed by a direct quote and short explanation
3) Follow-Up Email Generator
● Uses conversation context
● Enterprise-safe, objection-aware follow-up
● Editable before use
4) Scenario Studio
● Low-code admin interface
● Edit buyer persona, objections, ideal answers
5) Lightweight Web Application
● Scenario selection
● Chat interface
● Feedback and follow-up views
● Admin editor
Infrastructure & Stack (Hackathon)
● Frontend: Next.js
● Backend: Node.js (Express/Nest)
● AI: Tongyi Qianwen
● Database: ApsaraDB (PostgreSQL)
● Auth: DingTalk login (or mock fallback)
● Compute: Alibaba Cloud ECS
Hackathon Task Outline (Who Does What)
Member 1 — AI & Product Lead
● AI prompts (roleplay, feedback, email)
● Scoring rubric
● Scenario structure
● Product decisions & scope control
Member 2 — Product / PM / Demo Owner
● Problem framing & narrative
● Demo storyboard & script
● Scenario content
● Scope policing & unblockers
Member 3 — Backend Engineer
● API endpoints
● AI service integration
● Data models & persistence
● Auth and stability
Member 4 — Frontend Engineer
● Demo UI
● Chat experience
● Feedback visualization
● Scenario Studio interface
One-Line Positioning
“We’re not building another training platform — we’re building a sales execution readiness engine
that helps Alibaba Cloud sellers practice, improve, and execute better conversations before they ever
talk to a customer.”