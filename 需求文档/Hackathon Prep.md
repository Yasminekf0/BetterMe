Hackathon Prep
Day by Day Breakdown
Pre-Hackathon Prep Plan (T-4 → T-0)
By hackathon start:
● No AI uncertainty
● No cloud or auth surprises
● Demo flow fully known
● Only execution left for the 24h build
T-4 DAYS: Scope Lock + AI Confidence (CRITICAL)
Objectives
● Lock MVP scope today (Please read the PDF shared Previously)
● Validate AI behavior early
● Kill ambiguity
Non-negotiable decisions
● MVP features (locked):
○ AI roleplay (text and Voice)
○ Explainable feedback
○ Scenario Studio (basic)
● Stretch feature: TBD at T+14h of hackathon ( Follow-Up Email Generation)
● Demo flow confirmed
● Auth strategy:
○ Primary: DingTalk OAuth ?
○ Fallback: Mock login (must be ready)
T-4 DAYS: Scope Lock + AI Confidence (CRITICAL)
Deliverables
● Final MVP scope (Please read the PDF shared Previously)
● Decision logic for Voice
● Decision logic for Follow-Up Email Generation
● Kill list (features explicitly banned during hackathon)
Artifacts to produce
● 1-page executive summary ( already done and shared previously)
● Demo storyboard (single slide)
● Feature ownership mapping
T-4 DAYS: Tasks by Role
Member 1 — AI & Product
Do today
● Finalize:
○ 2 roleplay scenarios
○ 1 feedback rubric
● Run prompts against Tongyi Qianwen
● Capture:
○ 1 “good” roleplay transcript
○ 1 feedback JSON
○ 1 follow-up email
Study (30–60 min)
● Tongyi Qianwen API limits
● Prompt length + latency constraints
T-4 DAYS: Tasks by Role
Member 1 — AI & Product
Do today
● Finalize:
○ 2 roleplay scenarios
○ 1 feedback rubric
● Run prompts against Tongyi Qianwen
● Capture:
○ 1 “good” roleplay transcript
○ 1 feedback JSON
○ 1 follow-up email
Study (30–60 min)
● Tongyi Qianwen API limits
● Prompt length + latency constraints
T-4 DAYS: Tasks by Role
Member 2 — PM / Demo Owner
Do today
● Write demo narrative (verbatim)
● Prepare judge framing:
○ “Why not LMS”
○ “Why execution readiness”
● Create backup demo plan (screenshots or transcript)
Members 3 & 4 — Engineers
Do today
● Review MVP scope & roadmap
● Flag unknowns immediately
● No coding yet
T-3 DAYS: Alibaba Cloud + Auth Risk Removal
Objectives
● Ensure infra access
● Kill auth uncertainty
T-3 DAYS: Tasks by Role
Members 3 & 4 (Primary Setup Day)
Hands-on
● Create Alibaba Cloud ECS instance
● Create ApsaraDB (PostgreSQL)
● Deploy simple Node.js service
● Confirm DB connection
Study
● Alibaba Cloud environment variables
● Security group basics
● Simple deployment workflow
T-3 DAYS: Tasks by Role
Member 1 — AI
● Refine prompts to:
○ Reduce verbosity
○ Prevent hallucination
● Decide:
○ Max roleplay turns (e.g. 6–8)
Member 2 — PM
● Prepare:
○ Demo slide (single slide storyboard)
○ Judge Q&A cheat sheet
● Align messaging with Alibaba Cloud language
T-3 DAYS: Tasks by Role
Auth Decision (Team)
● Test DingTalk OAuth feasibility
● If OAuth is slow or blocked → switch to mock login now
 This decision MUST be final today.
T-2 DAYS: Vertical Slice Proof (MOST IMPORTANT)
Objectives
● Prove end-to-end feasibility
● Catch show-stoppers early
Mini Vertical Slice (2–3 hours)
Must work (console-level is fine)
1. User input
2. AI roleplay response
3. AI feedback output
4. AI follow-up email output
Deliverables
● Saved transcript
● Saved feedback JSON
● Saved email output
T-2 DAYS: Tasks by Role
Member 3 — Backend
● Draft API contracts:
○ /roleplay
○ /feedback
○ /followup
● Validate AI call latency & reliability
Member 4 — Frontend
● Freeze UI wireframes:
○ Scenario picker
○ Chat
○ Feedback
○ Email view
○ Admin editor
T-2 DAYS: Tasks by Role
Team Checkpoint (30 min)
Answer clearly
● Is AI believable?
● Is feedback explainable?
● Is email non-generic?
If not → simplify now.
T-1 DAY: Demo & Execution Readiness
Objectives
● Freeze everything
● Prepare to move fast
T-1 DAY: Tasks by Role
Demo Finalization
Member 2 (Owner)
● Final demo script (minute-by-minute)
● Decide:
○ Who clicks
○ Who speaks
● Prepare:
○ Backup demo transcript
○ Screenshot fallback
T-1 DAY: Tasks by Role
Engineering Final Prep
Members 3 & 4
● Repo initialized
● Project skeleton created
● Environment variables documented
● One-command local start confirmed
T-1 DAY: Tasks by Role
Member 1 — AI
● Lock prompts
● Store prompts in repo
● No further prompt tuning unless broken
T-0 : Hackathon Starts!
We should now have:
● No AI uncertainty
● Infra ready
● Auth decision finalized
● Demo flow memorized
● Scope locked