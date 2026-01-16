# Master Trainer User Center Function Documentation

---

## Document Overview

This document provides a detailed description of all user center function modules, interface design, and operational workflows for regular users such as sales representatives and solution architects.

---

## 1. User Role Definition

### 1.1 Target Users

| User Type | Description | Primary Needs |
|-----------|-------------|---------------|
| Sales Representative | Alibaba Cloud frontline sales | Improve sales skills, handle objections |
| Solution Architect | Technical solution expert | Improve technical communication, address technical questions |
| Partner Sales | Channel partner sales | Standardize product knowledge, improve sales quality |

### 1.2 User Permissions

| Feature | Permission |
|---------|------------|
| View scenario list | ✓ |
| Conduct roleplay practice | ✓ |
| View personal feedback | ✓ |
| Generate follow-up email | ✓ |
| View personal history | ✓ |
| Edit profile | ✓ |
| View others' practice records | ✗ |
| Manage scenarios | ✗ |

---

## 2. Function Module Overview

```
User Center
├── Dashboard
│   ├── Practice Overview
│   ├── Recommended Scenarios
│   └── Quick Start
├── Scenarios
│   ├── Scenario List
│   ├── Scenario Search
│   └── Scenario Details
├── Roleplay
│   ├── Dialogue Interface
│   ├── Real-time Tips
│   └── End Session
├── Feedback Center
│   ├── Feedback Details
│   ├── Improvement Suggestions
│   └── Historical Comparison
├── Email Generator
│   ├── One-click Generate
│   ├── Edit Email
│   └── Copy/Save
├── History
│   ├── Practice List
│   └── Detail View
└── Profile
    ├── Basic Information
    ├── Statistics
    └── Preferences
```

---

## 3. Dashboard

### 3.1 Function Description
User homepage after login, providing personal practice overview, recommended scenarios, and quick start entry.

### 3.2 Interface Elements

#### 3.2.1 Welcome Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  👋 Good morning, John!                                         │
│                                                                 │
│  Keep improving your sales skills. 23 colleagues have           │
│  completed practice today.                                      │
│                                                                 │
│  [Start Today's Practice]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Personal Statistics Cards

| Metric | Description | Display |
|--------|-------------|---------|
| Total Practices | Cumulative completed practices | Number + Change |
| Average Score | Average of all practices | Number + Trend arrow |
| This Week | Practices this week | Number + Progress bar |
| Best Score | Historical highest | Number + Scenario name |

#### 3.2.3 Progress Trend Chart

- Type: Line chart
- Data: Score trend for last 10 practices
- Interaction: Hover to show details

#### 3.2.4 Recommended Scenarios

Smart recommendations based on practice history and weak areas.

**Recommendation Logic**:
1. Scenarios not yet practiced
2. Low-scoring scenarios needing improvement
3. Recently updated new scenarios
4. Popular scenarios

#### 3.2.5 Recent Practices

Display last 3-5 practice records with quick access to feedback or retry.

### 3.3 Interface Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Master Trainer                               [🔔] [John ▼]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👋 Good morning, John!                                         │
│  Keep improving your sales skills. 23 colleagues completed today│
│                                              [Start Practice]   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │Total Prac. │ │ Avg Score  │ │ This Week  │ │ Best Score │   │
│  │    45      │ │   72.5     │ │   3/5      │ │    89      │   │
│  │  ↑ 5       │ │  ↑ 2.3%    │ │  ████░░    │ │ Migration  │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   My Progress Trend                     │    │
│  │      90 ┤                      ●                        │    │
│  │      80 ┤        ●    ●   ●        ●                    │    │
│  │      70 ┤   ●  ●    ●        ●         ●               │    │
│  │      60 ┤●                                  ●           │    │
│  │         └──────────────────────────────────────────     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Recommended Scenarios                             [View All >] │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ 🎯 Pricing   │ │ 🆕 New       │ │ 🔥 Popular   │            │
│  │              │ │              │ │              │            │
│  │ Improve your │ │ Data Security│ │ Cloud        │            │
│  │ negotiation  │ │ Compliance   │ │ Migration    │            │
│  │              │ │              │ │              │            │
│  │ [Start]      │ │ [Start]      │ │ [Start]      │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
│  Recent Practices                                  [View All >] │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Cloud Migration    78pts   2hr ago   [Feedback] [Retry] │   │
│  │ Customer Opening   82pts   Yesterday [Feedback] [Retry] │   │
│  │ Competitor Response 65pts  2 days    [Feedback] [Retry] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Scenarios Center

### 4.1 Scenario List

#### 4.1.1 Function Description
Display all available practice scenarios with search, filter, and sort support.

#### 4.1.2 Filter Options

| Filter | Options |
|--------|---------|
| Category | Technical Solution, Objection Handling, Compliance, Competition, Opening |
| Difficulty | Easy, Medium, Hard |
| Status | Not practiced, Practiced, Needs improvement |
| Sort | Recommendation, Difficulty, Practice count, Latest |

#### 4.1.3 Scenario Card Information

| Element | Description |
|---------|-------------|
| Scenario Title | Scenario name |
| Scenario Description | Brief description (2 lines) |
| Difficulty Tag | Easy/Medium/Hard |
| Category Tag | Category name |
| Estimated Duration | Expected time to complete |
| My Best Score | Personal highest score (if any) |
| Average Score | Average of all users |
| Practice Count | Total practice count |

### 4.2 Scenario Details

#### 4.2.1 Detail Page Content

**Scenario Information**
- Title and detailed description
- Difficulty level and estimated duration
- Scenario background story

**Buyer Persona Introduction**
- Avatar and name
- Title and company
- Background introduction
- Key concerns
- Personality traits

**Practice Goals**
- Learning objectives for this scenario
- Skills to master
- Evaluation dimension explanations

**My History**
- Past practice scores
- Progress trend
- Improvement suggestions summary

#### 4.2.2 Interface Design

```
┌─────────────────────────────────────────────────────────────────┐
│  [< Back to Scenarios]                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cloud Migration Sales                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                 │
│  [Medium]  [Technical]  ⏱ ~15 minutes                           │
│                                                                 │
│  Description                                                    │
│  ──────────                                                     │
│  You will have a conversation with a CTO evaluating cloud       │
│  migration options. The customer currently uses AWS and is      │
│  hesitant about migrating to Alibaba Cloud. You need to         │
│  demonstrate advantages and address concerns about security,    │
│  cost, and technical support.                                   │
│                                                                 │
│  Buyer Persona                                                  │
│  ──────────                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Michael Li                                           │   │
│  │ Title: CTO                                              │   │
│  │ Company: Mid-size FinTech Company                       │   │
│  │                                                         │   │
│  │ Background: 15 years IT experience, currently using AWS │   │
│  │                                                         │   │
│  │ Concerns:                                               │   │
│  │ • Data compliance (financial regulatory requirements)   │   │
│  │ • Migration cost and risk                               │   │
│  │ • Technical support response time                       │   │
│  │                                                         │   │
│  │ Personality: Direct, data-driven, skeptical of new      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Practice Goals                                                 │
│  ──────────                                                     │
│  ✓ Clearly articulate Alibaba Cloud's core value               │
│  ✓ Effectively handle security and compliance objections       │
│  ✓ Demonstrate technical expertise and credibility             │
│                                                                 │
│  My History                                                     │
│  ──────────                                                     │
│  Practices: 3    Best Score: 78    Average: 72                 │
│                                                                 │
│                                          [Start Practice]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Roleplay

### 5.1 Function Description
Core feature module where users conduct simulated sales conversations with AI buyers.

### 5.2 Dialogue Interface

#### 5.2.1 Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Cloud Migration Sales                       [End Chat] [❓Help]│
├────────────────────────────┬────────────────────────────────────┤
│                            │                                    │
│  Dialogue Area             │  Buyer Info                        │
│                            │  ────────                          │
│  ┌────────────────────┐   │  👤 Michael Li                     │
│  │ 🤖 Michael Li       │   │  CTO @ FinTech Company             │
│  │                    │   │                                    │
│  │ Hello, I'm Michael │   │  Concerns:                         │
│  │ Li. Our company is │   │  • Data compliance                 │
│  │ evaluating cloud   │   │  • Migration cost                  │
│  │ migration options. │   │  • Technical support               │
│  │ I heard you have   │   │                                    │
│  │ some solutions?    │   │  ────────                          │
│  └────────────────────┘   │  Progress                          │
│                            │  ████░░░░ 3/8 turns                │
│  ┌────────────────────┐   │                                    │
│  │ 👤 You             │   │  ────────                          │
│  │                    │   │  Tips                              │
│  │ Hello Mr. Li!      │   │                                    │
│  │ Thank you for this │   │  💡 Remember to showcase           │
│  │ opportunity to     │   │     financial industry cases       │
│  │ introduce Alibaba  │   │                                    │
│  │ Cloud solutions... │   │  💡 Customer concerned about       │
│  └────────────────────┘   │     compliance, prepare certs      │
│                            │                                    │
│  ┌────────────────────┐   │                                    │
│  │ 🤖 Michael Li       │   │                                    │
│  │                    │   │                                    │
│  │ To be honest, I'm  │   │                                    │
│  │ not very familiar  │   │                                    │
│  │ with Alibaba Cloud.│   │                                    │
│  │ We're using AWS.   │   │                                    │
│  │ What's the risk?   │   │                                    │
│  └────────────────────┘   │                                    │
│                            │                                    │
├────────────────────────────┴────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Type your response...                                   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                    [Send ➤]    │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Function Elements

| Element | Function |
|---------|----------|
| Dialogue History | Display complete conversation, scrollable |
| Buyer Info Panel | Display buyer persona for reference |
| Dialogue Progress | Show current/max turns |
| Real-time Tips | Smart tips based on conversation |
| Input Box | Text input area |
| Send Button | Send message |
| End Button | End conversation early |
| Help Button | View usage help |

### 5.3 Interaction Rules

#### 5.3.1 Dialogue Flow

1. **Opening**: AI buyer initiates conversation
2. **Multi-turn**: User and AI take turns
3. **Turn Limit**: Default max 8 turns
4. **End Conditions**:
   - Max turns reached
   - User ends manually
   - AI determines conversation complete

#### 5.3.2 Input Validation

| Rule | Description |
|------|-------------|
| Min Length | At least 10 characters |
| Max Length | Maximum 2000 characters |
| Empty Message | Cannot send empty |
| Consecutive | Wait for AI reply before sending again |

#### 5.3.3 Real-time Tips

Based on conversation content, system provides:
- Keywords mentioned by buyer
- Possible response strategies
- Key points to note
- Related product/feature info

### 5.4 End Dialogue

#### 5.4.1 End Confirmation

```
┌─────────────────────────────────────────┐
│                                         │
│  Are you sure you want to end?          │
│                                         │
│  Current progress: 5/8 turns            │
│                                         │
│  Feedback report will be generated      │
│                                         │
│        [Cancel]    [Confirm End]        │
│                                         │
└─────────────────────────────────────────┘
```

#### 5.4.2 Post-End Flow

1. Show loading: "Analyzing your conversation..."
2. Generate feedback report
3. Auto-redirect to feedback page

---

## 6. Feedback Center

### 6.1 Function Description
Display detailed evaluation report after conversation, including scores, analysis, and improvement suggestions.

### 6.2 Feedback Page

#### 6.2.1 Overall Score

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Practice Evaluation                                            │
│                                                                 │
│                    ┌───────────┐                                │
│                    │           │                                │
│                    │    78     │                                │
│                    │           │                                │
│                    │   /100    │                                │
│                    └───────────┘                                │
│                                                                 │
│                      Good 👍                                    │
│                                                                 │
│  3 points higher than last time! Keep it up!                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2.2 Dimension Scores

| Dimension | Score | Weight | Description |
|-----------|-------|--------|-------------|
| Value Articulation | 80/100 | 35% | Clear expression of Alibaba Cloud value |
| Objection Handling | 75/100 | 35% | Effective response to customer objections |
| Technical Clarity | 78/100 | 30% | Accurate delivery of technical content |

#### 6.2.3 Detailed Analysis

Each dimension includes:
- **Score**: Specific score
- **Quote**: Relevant part of user's response
- **Analysis**: AI analysis of performance
- **Suggestions**: Specific improvement tips

```
┌─────────────────────────────────────────────────────────────────┐
│  Value Articulation                                    80/100   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                 │
│  📝 Your Response                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ "Alibaba Cloud has the most data centers in Asia-       │   │
│  │ Pacific, providing low-latency, high-availability       │   │
│  │ services. We also have a dedicated financial cloud      │   │
│  │ solution serving major banks and insurance companies."  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✅ Done Well                                                   │
│  • Mentioned geographic advantage (APAC data centers)          │
│  • Highlighted financial industry-specific solution            │
│  • Used specific customer case references                      │
│                                                                 │
│  💡 Can Improve                                                 │
│  • Add specific data like "99.99% availability SLA"            │
│  • Mention specific differentiation from AWS                   │
│  • Suggest proactively asking about customer's needs           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2.4 Summary and Recommendations

```
┌─────────────────────────────────────────────────────────────────┐
│  Summary                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                 │
│  Overall performance was good. You successfully demonstrated    │
│  Alibaba Cloud's core advantages and provided reasonable        │
│  responses to migration risk concerns.                          │
│                                                                 │
│  Key Improvement Areas:                                         │
│  1. When discussing price, proactively lead to ROI topics       │
│  2. For compliance questions, prepare detailed cert list        │
│  3. Try more open-ended questions to understand deeper needs    │
│                                                                 │
│  Recommended Next Practice:                                     │
│  • Price Objection Handling - Practice negotiation skills       │
│  • Compliance Discussion - Learn financial industry compliance  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Action Buttons

| Button | Function |
|--------|----------|
| View Transcript | Review full conversation |
| Generate Email | Go to email generation |
| Practice Again | Restart same scenario |
| Back to Scenarios | Select other scenarios |
| Share Score | Share to work group (optional) |

---

## 7. Email Generator

### 7.1 Function Description
Automatically generate professional follow-up emails based on conversation content, editable before use.

### 7.2 Interface Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Generate Follow-up Email                       [Regenerate]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  To                                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Michael Li <michael.li@fintech.com>                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Subject                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Follow-up on Alibaba Cloud Migration Discussion         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Email Content                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Dear Mr. Li,                                            │   │
│  │                                                         │   │
│  │ Thank you for taking time to discuss your company's     │   │
│  │ cloud migration plans with me today.                    │   │
│  │                                                         │   │
│  │ Regarding the concerns you mentioned, I'd like to add:  │   │
│  │                                                         │   │
│  │ 1. Data Compliance:                                     │   │
│  │ Alibaba Cloud Financial Cloud has obtained Level 3      │   │
│  │ protection certification and multiple international     │   │
│  │ security certifications including PCI DSS, ISO 27001.   │   │
│  │                                                         │   │
│  │ 2. Migration Risk:                                      │   │
│  │ We have mature migration methodology and professional   │   │
│  │ teams to ensure business continuity.                    │   │
│  │                                                         │   │
│  │ 3. Technical Support:                                   │   │
│  │ We provide 24/7 dedicated support for financial         │   │
│  │ customers with 15-minute response SLA.                  │   │
│  │                                                         │   │
│  │ I recommend we schedule a deeper technical discussion.  │   │
│  │ Would Tuesday or Thursday afternoon work for you?       │   │
│  │                                                         │   │
│  │ Looking forward to your reply!                          │   │
│  │                                                         │   │
│  │ Best regards,                                           │   │
│  │ John                                                    │   │
│  │ Sales Representative, Alibaba Cloud                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Copy Email]  [Save Draft]                    [Back to Feedback]│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Features

| Feature | Description |
|---------|-------------|
| Smart Generation | Auto-generated based on conversation |
| Objection Response | Addresses customer concerns raised |
| Call to Action | Includes next step suggestions |
| Editable | User can modify any content |
| Regenerate | Regenerate if not satisfied |
| One-click Copy | Copy to clipboard |
| Save Draft | Save for later use |

---

## 8. History

### 8.1 Function Description
View and manage all personal practice history records.

### 8.2 List Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  My Practice History                                            │
├─────────────────────────────────────────────────────────────────┤
│  [All] [This Week] [This Month]  [Scenario ▼] [Sort ▼] [🔍...]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📅 January 12, 2026                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Cloud Migration Sales                                   │   │
│  │ Score: 78  |  Duration: 12min  |  10:30 AM             │   │
│  │                         [Feedback] [Email] [Retry]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  📅 January 11, 2026                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ New Customer Opening                                    │   │
│  │ Score: 82  |  Duration: 8min   |  3:15 PM              │   │
│  │                         [Feedback] [Email] [Retry]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Price Objection Handling                                │   │
│  │ Score: 65  |  Duration: 15min  |  11:20 AM             │   │
│  │                         [Feedback] [Email] [Retry]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Showing 1-4 of 45                               [Load More...] │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Filters and Sorting

| Filter | Options |
|--------|---------|
| Time Range | All, This week, This month, Custom |
| Scenario | Filter by scenario name |
| Sort | Time, Score |

### 8.4 Detail View

Click any record to view:
- Full conversation content
- Detailed feedback report
- Generated follow-up email

---

## 9. Profile

### 9.1 Basic Information

```
┌─────────────────────────────────────────────────────────────────┐
│  Profile                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                        │    │
│  │    ┌──────┐                                           │    │
│  │    │ 👤   │   John                                    │    │
│  │    │      │   Sales Rep | East Region                 │    │
│  │    └──────┘   john@alibabacloud.com                   │    │
│  │                                                        │    │
│  │    Joined: June 2025                                   │    │
│  │                                        [Edit Profile]  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  My Statistics                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │Tot Practice│ │ Avg Score  │ │Total Time  │ │ Best Score │   │
│  │    45      │ │   72.5     │ │  8.5 hrs   │ │    89      │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                 │
│  Score by Scenario                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ New Customer        ████████████████░░░░  82            │   │
│  │ Cloud Migration     ██████████████░░░░░░  78            │   │
│  │ Competitor          █████████████░░░░░░░  71            │   │
│  │ Price Objection     ████████████░░░░░░░░  65            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Progress Trend                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Last 30 days score trend chart]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Preferences

| Setting | Options |
|---------|---------|
| Practice Reminder | Enable/disable daily reminder |
| Reminder Time | Select reminder time |
| Difficulty Preference | Default difficulty level |
| Email Signature | Default signature for emails |
| Interface Language | 简体中文/English |

### 9.3 Account Actions

| Action | Description |
|--------|-------------|
| Change Password | Update login password |
| Link DingTalk | Link/unlink DingTalk account |
| Export Data | Export personal practice data |
| Logout | Sign out of current account |

---

## 10. Notification Center

### 10.1 Notification Types

| Type | Description |
|------|-------------|
| System Notification | System updates, maintenance |
| New Scenarios | New scenario launch |
| Practice Reminder | Scheduled practice reminder |
| Achievement Unlock | Milestone achievement |

### 10.2 Notification Settings

Users can enable or disable push notifications for each type.

---

## 11. Help & Support

### 11.1 Usage Guide

- Quick start tutorial
- Detailed feature documentation
- FAQ
- Video tutorials

### 11.2 Contact Support

- Online chat support
- Feedback & suggestions
- Bug report

---

*Document Version: 1.0*
*Last Updated: 2026-01-12*

