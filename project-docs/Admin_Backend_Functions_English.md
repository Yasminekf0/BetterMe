# Master Trainer Admin Backend Function Documentation

---

## Document Overview

This document provides a detailed description of all admin backend function modules, interface design, and operational workflows.

---

## 1. Backend Access & Permissions

### 1.1 Access Path
- URL: `/admin`
- Requires admin permission login

### 1.2 Role Permissions

| Role | Permission Scope |
|------|------------------|
| Super Admin | All functions |
| Trainer Admin | Scenario management, statistics viewing |
| Content Editor | Scenario content editing only |

---

## 2. Function Module Overview

```
Admin Backend
├── Dashboard
├── Scenario Management
│   ├── Scenario List
│   ├── Create Scenario
│   ├── Edit Scenario
│   └── Buyer Persona Library
├── User Management
│   ├── User List
│   ├── User Details
│   └── Permission Management
├── Statistics & Analytics
│   ├── Usage Overview
│   ├── Scenario Statistics
│   └── User Activity
└── System Settings
    ├── Basic Configuration
    ├── AI Parameters
    └── Notification Settings
```

---

## 3. Dashboard

### 3.1 Function Description
Admin homepage providing a quick overview of overall system operation status.

### 3.2 Interface Elements

#### 3.2.1 Key Metric Cards

| Metric | Description | Update Frequency |
|--------|-------------|------------------|
| Active Users Today | Users who logged in and practiced today | Real-time |
| Practice Sessions Today | Completed roleplay sessions today | Real-time |
| Active Scenarios | Currently available online scenarios | Real-time |
| Average Feedback Score | Average score for past 7 days | Daily |

#### 3.2.2 Trend Charts

**Practice Trend Chart**
- Type: Line chart
- Data: Practice count trend for last 7/30 days
- Switchable: Day/Week/Month view

**Score Distribution Chart**
- Type: Bar chart
- Data: User score distribution (0-60, 60-70, 70-80, 80-90, 90-100)

#### 3.2.3 Quick Actions

| Action | Function |
|--------|----------|
| + Create Scenario | Navigate to scenario creation page |
| View All Users | Navigate to user list page |
| Export Report | Export statistics as Excel |

### 3.3 Interface Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Master Trainer Admin                        [Username] ▼ [Logout]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │Active Users │ │ Sessions    │ │Active Scene │ │ Avg Score   ││
│  │    128      │ │    456      │ │     12      │ │   75.3      ││
│  │   ↑ 12%     │ │   ↑ 8%      │ │     -       │ │   ↑ 2.1%    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Practice Trend Chart                    │  │
│  │  ▁▂▃▄▅▆▇█                                                │  │
│  │  [Day] [Week] [Month]                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌────────────────────────┐  ┌────────────────────────────┐    │
│  │   Score Distribution   │  │     Recent Activity        │    │
│  │   █ 10%  0-60          │  │  • John completed "Cloud"  │    │
│  │   ██ 25% 60-70         │  │  • Jane created scenario   │    │
│  │   ███ 35% 70-80        │  │  • Mike scored 90          │    │
│  │   ██ 20% 80-90         │  │  ...                       │    │
│  │   █ 10%  90-100        │  │                            │    │
│  └────────────────────────┘  └────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Scenario Management

### 4.1 Scenario List

#### 4.1.1 Function Description
Display all scenarios with support for search, filter, sort, and batch operations.

#### 4.1.2 List Fields

| Field | Description | Action |
|-------|-------------|--------|
| Scenario Name | Scenario title | Click to view details |
| Category | Scenario category | Filterable |
| Difficulty | Easy/Medium/Hard | Filterable |
| Status | Online/Offline | Toggleable |
| Practice Count | Total practice count | Sortable |
| Average Score | Average score for scenario | Sortable |
| Created Date | Scenario creation date | Sortable |
| Actions | Edit/Copy/Delete | - |

#### 4.1.3 Function Operations

| Operation | Description |
|-----------|-------------|
| Search | Search by scenario name |
| Filter | Filter by category, difficulty, status |
| Sort | Sort by practice count, score, date |
| Batch Operations | Batch online/offline/delete |
| Export | Export scenario data as Excel |

#### 4.1.4 Interface Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Scenario Management                           [+ Create New]   │
├─────────────────────────────────────────────────────────────────┤
│  [🔍 Search...]  [Category ▼] [Difficulty ▼] [Status ▼] [Export]│
├─────────────────────────────────────────────────────────────────┤
│  □  Name              Category    Level   Status  Count   Score │
│  ─────────────────────────────────────────────────────────────  │
│  □  Cloud Migration   Technical   Medium  ● On     234    72.5  │
│  □  Price Objection   Objections  Hard    ● On     189    68.3  │
│  □  Compliance Talk   Compliance  Medium  ○ Off     45    75.1  │
│  □  Competitor Resp   Competition Hard    ● On     156    70.8  │
│  □  New Customer      Opening     Easy    ● On     312    78.2  │
├─────────────────────────────────────────────────────────────────┤
│  Showing 1-5 of 12                              [<] 1 2 3 [>]   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Create/Edit Scenario

#### 4.2.1 Form Fields

**Basic Information**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Scenario Title | Text | ✓ | Display name of scenario |
| Scenario Description | Long Text | ✓ | Detailed description |
| Category | Dropdown | ✓ | Select category |
| Difficulty Level | Radio | ✓ | Easy/Medium/Hard |
| Tags | Multi-tag | - | For search and filter |

**Buyer Persona Settings**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Persona Name | Text | ✓ | Buyer's name |
| Title | Text | ✓ | Buyer's job title |
| Company Type | Text | ✓ | Buyer's company description |
| Background | Long Text | ✓ | Buyer's background info |
| Concerns | Tag List | ✓ | Main concerns |
| Personality | Text | ✓ | Personality description |

**Objection Settings**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Objection Content | Text | ✓ | Possible buyer objections |
| Ideal Response | Long Text | ✓ | Recommended response |
| Keywords | Tags | - | Scoring reference keywords |

**Advanced Settings**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Max Dialogue Turns | Number | - | Default 8 turns |
| Scoring Weights | Slider | - | Dimension scoring weights |
| Opening Prompt | Text | - | User guidance text |

### 4.3 Buyer Persona Library

#### 4.3.1 Function Description
Manage reusable buyer persona templates for quick scenario creation.

#### 4.3.2 Preset Personas

| Persona Type | Title | Characteristics |
|--------------|-------|-----------------|
| Technical Decision Maker | CTO | Focus on technical feasibility, performance, security |
| Compliance Expert | Compliance Director | Focus on data security, compliance |
| Procurement Lead | Procurement Manager | Focus on price, ROI, contract terms |
| Business Lead | VP | Focus on business value, competitive advantage |

---

## 5. User Management

### 5.1 User List

#### 5.1.1 List Fields

| Field | Description | Action |
|-------|-------------|--------|
| Username | User display name | Click to view details |
| Email | User email address | - |
| Role | User/Admin | Editable |
| Department | User department | Filterable |
| Practice Count | Total practices | Sortable |
| Last Active | Last login time | Sortable |
| Status | Active/Disabled | Toggleable |

### 5.2 User Details

#### 5.2.1 Information Display

**Basic Information**
- Avatar, username, email
- Department, role, registration date
- Status, last login time

**Practice Statistics**
- Total practice count
- Average score
- Most practiced scenarios
- Score trend chart

**Practice History**
- Recent practice records list
- View details and feedback for each practice

#### 5.2.2 Management Actions

| Action | Description |
|--------|-------------|
| Edit Info | Modify user basic info |
| Change Role | Upgrade/downgrade permissions |
| Reset Password | Send password reset email |
| Disable Account | Suspend user access |
| Delete Account | Permanently delete (requires confirmation) |

---

## 6. Statistics & Analytics

### 6.1 Usage Overview

#### 6.1.1 Key Metrics

| Metric | Description | Chart Type |
|--------|-------------|------------|
| DAU | Daily Active Users | Line Chart |
| Completed Practices | Daily completed practices | Bar Chart |
| Average Score | Daily average score | Line Chart |
| Avg Practice Duration | Daily average duration | Line Chart |

#### 6.1.2 Time Dimensions

- Today / Yesterday
- Last 7 days / 30 days / 90 days
- Custom date range

### 6.2 Scenario Statistics

#### 6.2.1 Scenario Rankings

**By Practice Count**

| Rank | Scenario | Practice Count | Avg Score |
|------|----------|----------------|-----------|
| 1 | New Customer Opening | 312 | 78.2 |
| 2 | Cloud Migration | 234 | 72.5 |
| 3 | Price Objection | 189 | 68.3 |

**By Score**

| Rank | Scenario | Avg Score | Practice Count |
|------|----------|-----------|----------------|
| 1 | New Customer Opening | 78.2 | 312 |
| 2 | Compliance Discussion | 75.1 | 45 |
| 3 | Cloud Migration | 72.5 | 234 |

### 6.3 User Activity

#### 6.3.1 Activity Distribution

| Category | Definition | Count |
|----------|------------|-------|
| Highly Active | 3+ times per week | 45 |
| Moderately Active | 1-3 times per week | 78 |
| Low Activity | 1-4 times per month | 23 |
| Inactive | No practice in 30+ days | 10 |

#### 6.3.2 Export Functions

- Export user activity report
- Export scenario usage report
- Export comprehensive analysis report
- Support Excel and PDF formats

---

## 7. System Settings

### 7.1 Basic Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| System Name | Displayed in page title | Master Trainer |
| System Logo | Upload custom logo | Default Logo |
| Login Methods | Supported login methods | DingTalk/Email |
| Session Timeout | Auto logout after inactivity | 30 minutes |

### 7.2 AI Parameter Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| Max Dialogue Turns | Max turns per practice | 8 |
| AI Temperature | Controls response randomness | 0.7 |
| Max Tokens | Max response length | 2000 |
| Timeout | AI response timeout | 30 seconds |

### 7.3 Notification Settings

| Notification Type | Description | Default |
|-------------------|-------------|---------|
| New User Registration | Notify on new registration | Enabled |
| Scenario Update | Notify on scenario modification | Enabled |
| System Error | Notify on system errors | Enabled |
| Weekly Report | Send weekly usage report | Enabled |

---

## 8. Operation Logs

### 8.1 Log Records

| Record Content | Description |
|----------------|-------------|
| Operation Time | Time of operation |
| Operator | Admin who performed action |
| Operation Type | Create/Edit/Delete/Login etc. |
| Operation Target | Resource being operated |
| Operation Details | Specific operation content |
| IP Address | Source IP address |

### 8.2 Log Query

- Query by time range
- Query by operator
- Query by operation type
- Support log export

---

## 9. API Documentation

### 9.1 Admin Backend APIs

#### Scenario Management

```
GET    /api/admin/scenarios          - Get scenario list
POST   /api/admin/scenarios          - Create scenario
GET    /api/admin/scenarios/:id      - Get scenario details
PUT    /api/admin/scenarios/:id      - Update scenario
DELETE /api/admin/scenarios/:id      - Delete scenario
PUT    /api/admin/scenarios/:id/status - Toggle scenario status
```

#### User Management

```
GET    /api/admin/users              - Get user list
GET    /api/admin/users/:id          - Get user details
PUT    /api/admin/users/:id          - Update user info
PUT    /api/admin/users/:id/role     - Change user role
DELETE /api/admin/users/:id          - Delete user
POST   /api/admin/users/invite       - Invite user
```

#### Statistics

```
GET    /api/admin/statistics/overview    - Get overview data
GET    /api/admin/statistics/scenarios   - Get scenario statistics
GET    /api/admin/statistics/users       - Get user statistics
GET    /api/admin/statistics/export      - Export statistics report
```

#### System Settings

```
GET    /api/admin/settings           - Get system settings
PUT    /api/admin/settings           - Update system settings
GET    /api/admin/logs               - Get operation logs
```

---

*Document Version: 1.0*
*Last Updated: 2026-01-12*

