# Master Trainer Frontend Interface Design Documentation

---

## Document Overview

This document provides detailed specifications for frontend interface design, component library, page structure, and interaction design to guide frontend development.

---

## 1. Tech Stack & Tools

### 1.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | React framework |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| TailwindCSS | 3+ | Styling framework |
| Shadcn/ui | Latest | Component library |
| Zustand | 4+ | State management |
| Axios | 1+ | HTTP client |
| React Query | 5+ | Data fetching |

### 1.2 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| Jest | Unit testing |
| Playwright | E2E testing |

---

## 2. Design System

### 2.1 Color System

```css
:root {
  /* Primary - Alibaba Orange */
  --color-primary: #FF6A00;
  --color-primary-light: #FF8533;
  --color-primary-dark: #E55A00;
  
  /* Secondary Colors */
  --color-secondary: #1890FF;
  --color-success: #52C41A;
  --color-warning: #FAAD14;
  --color-error: #FF4D4F;
  
  /* Neutral Colors */
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
  --color-text-disabled: #9CA3AF;
  --color-border: #E5E7EB;
  --color-background: #F9FAFB;
  --color-background-white: #FFFFFF;
  
  /* Dark Mode */
  --dark-color-text-primary: #F9FAFB;
  --dark-color-text-secondary: #D1D5DB;
  --dark-color-background: #111827;
  --dark-color-background-card: #1F2937;
}
```

### 2.2 Typography System

```css
:root {
  /* Font Family */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Size */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  
  /* Font Weight */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Height */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### 2.3 Spacing System

```css
:root {
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
}
```

### 2.4 Border Radius System

```css
:root {
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;
}
```

### 2.5 Shadow System

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

---

## 3. Component Library

### 3.1 Basic Components

#### 3.1.1 Button

**Variants**:
- `primary` - Primary button (orange filled)
- `secondary` - Secondary button (gray filled)
- `outline` - Outline button
- `ghost` - Ghost button
- `danger` - Danger button (red)
- `link` - Link button

**Sizes**:
- `sm` - Small (32px height)
- `md` - Medium (40px height)
- `lg` - Large (48px height)

**States**:
- `default` - Default
- `hover` - Hover
- `active` - Active
- `disabled` - Disabled
- `loading` - Loading

```tsx
// Usage Example
<Button variant="primary" size="md" onClick={handleClick}>
  Start Practice
</Button>

<Button variant="outline" size="sm" loading>
  Loading...
</Button>
```

#### 3.1.2 Input

**Types**:
- `text` - Text input
- `password` - Password input
- `email` - Email input
- `number` - Number input
- `textarea` - Multi-line text

**States**:
- `default` - Default
- `focus` - Focus
- `error` - Error
- `disabled` - Disabled

```tsx
// Usage Example
<Input 
  type="text"
  placeholder="Enter scenario name"
  value={value}
  onChange={setValue}
  error="Scenario name is required"
/>
```

#### 3.1.3 Card

```tsx
// Usage Example
<Card>
  <CardHeader>
    <CardTitle>Scenario Title</CardTitle>
    <CardDescription>Scenario description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Start Practice</Button>
  </CardFooter>
</Card>
```

#### 3.1.4 Modal

**Sizes**:
- `sm` - Small (400px)
- `md` - Medium (500px)
- `lg` - Large (600px)
- `xl` - Extra large (800px)

```tsx
// Usage Example
<Modal open={isOpen} onClose={handleClose} size="md">
  <ModalHeader>
    <ModalTitle>Confirm Action</ModalTitle>
  </ModalHeader>
  <ModalContent>
    Are you sure you want to end this practice?
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

#### 3.1.5 Badge

**Variants**:
- `default` - Default gray
- `primary` - Primary color
- `success` - Success green
- `warning` - Warning yellow
- `error` - Error red

```tsx
// Usage Example
<Badge variant="success">Easy</Badge>
<Badge variant="warning">Medium</Badge>
<Badge variant="error">Hard</Badge>
```

#### 3.1.6 Avatar

```tsx
// Usage Example
<Avatar>
  <AvatarImage src="/avatars/user.jpg" alt="User avatar" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

#### 3.1.7 Progress

```tsx
// Usage Example
<Progress value={75} max={100} />
<Progress value={3} max={8} showLabel />
```

### 3.2 Business Components

#### 3.2.1 ScenarioCard

```tsx
interface ScenarioCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  myBestScore?: number;
  averageScore: number;
  practiceCount: number;
  estimatedDuration: number;
  onStart: () => void;
}

<ScenarioCard
  title="Cloud Migration Sales"
  description="Discuss cloud migration with CTO..."
  difficulty="medium"
  category="Technical Solution"
  myBestScore={78}
  averageScore={72}
  practiceCount={234}
  estimatedDuration={15}
  onStart={() => startPractice(id)}
/>
```

#### 3.2.2 ChatMessage

```tsx
interface ChatMessageProps {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  avatar?: string;
  name?: string;
}

<ChatMessage
  role="ai"
  content="Hello, I'm Michael Li. Our company is evaluating cloud migration..."
  timestamp={new Date()}
  name="Michael Li"
/>
```

#### 3.2.3 FeedbackScore

```tsx
interface FeedbackScoreProps {
  score: number;
  maxScore: number;
  label: string;
  change?: number;
}

<FeedbackScore
  score={78}
  maxScore={100}
  label="Overall Score"
  change={3}
/>
```

#### 3.2.4 DimensionScore

```tsx
interface DimensionScoreProps {
  name: string;
  score: number;
  weight: number;
  quote: string;
  explanation: string;
  suggestions: string[];
}

<DimensionScore
  name="Value Articulation"
  score={80}
  weight={35}
  quote="Alibaba Cloud has the most data centers in APAC..."
  explanation="You effectively highlighted geographic advantages..."
  suggestions={['Add specific data points', 'Mention differentiation from AWS']}
/>
```

#### 3.2.5 BuyerPersonaCard

```tsx
interface BuyerPersonaCardProps {
  name: string;
  title: string;
  company: string;
  avatar?: string;
  background: string;
  concerns: string[];
  personality: string;
}

<BuyerPersonaCard
  name="Michael Li"
  title="CTO"
  company="FinTech Company"
  background="15 years IT experience..."
  concerns={['Data compliance', 'Migration cost', 'Technical support']}
  personality="Direct, data-driven, skeptical"
/>
```

#### 3.2.6 StatCard

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

<StatCard
  title="Total Practices"
  value={45}
  change={12}
  changeLabel="vs last week"
  icon={<PracticeIcon />}
/>
```

---

## 4. Page Layouts

### 4.1 Overall Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                           Header                                │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                │
│                │                                                │
│    Sidebar     │                  Main Content                  │
│  (Optional/    │                                                │
│   Collapsible) │                                                │
│                │                                                │
├────────────────┴────────────────────────────────────────────────┤
│                        Footer (Optional)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Header

```tsx
<Header>
  {/* Logo */}
  <Logo />
  
  {/* Main Navigation (Desktop) */}
  <Nav>
    <NavItem href="/dashboard" active>Dashboard</NavItem>
    <NavItem href="/scenarios">Scenarios</NavItem>
    <NavItem href="/history">History</NavItem>
  </Nav>
  
  {/* Right Actions */}
  <HeaderActions>
    <NotificationBell count={3} />
    <UserMenu>
      <Avatar />
      <UserName>John Doe</UserName>
    </UserMenu>
  </HeaderActions>
</Header>
```

**Height**: 64px
**Background**: White with 1px bottom border
**Fixed Position**: Yes

### 4.3 Sidebar

```tsx
<Sidebar collapsed={isCollapsed}>
  <SidebarNav>
    <SidebarItem icon={<DashboardIcon />} href="/dashboard">
      Dashboard
    </SidebarItem>
    <SidebarItem icon={<ScenarioIcon />} href="/scenarios">
      Scenarios
    </SidebarItem>
    <SidebarItem icon={<HistoryIcon />} href="/history">
      History
    </SidebarItem>
    <SidebarItem icon={<ProfileIcon />} href="/profile">
      Profile
    </SidebarItem>
  </SidebarNav>
  
  {/* Admin Entry */}
  {isAdmin && (
    <SidebarSection title="Admin">
      <SidebarItem icon={<AdminIcon />} href="/admin">
        Admin Panel
      </SidebarItem>
    </SidebarSection>
  )}
  
  <SidebarFooter>
    <CollapseButton onClick={toggleCollapse} />
  </SidebarFooter>
</Sidebar>
```

**Width**:
- Expanded: 240px
- Collapsed: 64px

### 4.4 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 639px) { /* sm */ }

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) { /* md */ }

/* Desktop */
@media (min-width: 1024px) { /* lg */ }

/* Large Screen */
@media (min-width: 1280px) { /* xl */ }
```

---

## 5. Page Detailed Designs

### 5.1 Login Page `/login`

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                        ┌───────────────┐                        │
│                        │               │                        │
│                        │     LOGO      │                        │
│                        │               │                        │
│                        └───────────────┘                        │
│                                                                 │
│                      Master Trainer                             │
│                    AI Sales Coach System                        │
│                                                                 │
│                   ┌─────────────────────┐                       │
│                   │ 📧 Email address    │                       │
│                   └─────────────────────┘                       │
│                                                                 │
│                   ┌─────────────────────┐                       │
│                   │ 🔒 Password         │                       │
│                   └─────────────────────┘                       │
│                                                                 │
│                   □ Remember me    Forgot password?             │
│                                                                 │
│                   ┌─────────────────────┐                       │
│                   │       Login         │                       │
│                   └─────────────────────┘                       │
│                                                                 │
│                   ──────── or ────────                          │
│                                                                 │
│                   ┌─────────────────────┐                       │
│                   │  🔷 Login with      │                       │
│                   │     DingTalk        │                       │
│                   └─────────────────────┘                       │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard `/dashboard`

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👋 Good morning, John!                       [Start Practice]  │
│  Keep improving your sales skills                               │
│                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ Total     │ │ Avg Score │ │ This Week │ │ Best      │       │
│  │   45      │ │   72.5    │ │   3/5     │ │   89      │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   My Progress Trend                        │ │
│  │   [Line chart: Last 10 practice scores]                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Recommended Scenarios                             [View All >] │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Scenario 1  │ │ Scenario 2  │ │ Scenario 3  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  Recent Practices                                  [View All >] │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Record list                                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Scenario List `/scenarios`

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Scenario Center                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search scenarios...                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [All] [Technical] [Objections] [Compliance] [Competition]      │
│                                                                 │
│  Filters: [Difficulty ▼] [Status ▼]     Sort: [Recommended ▼]   │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │             │ │             │ │             │               │
│  │ Scenario    │ │ Scenario    │ │ Scenario    │               │
│  │   Card      │ │   Card      │ │   Card      │               │
│  │             │ │             │ │             │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │             │ │             │ │             │               │
│  │ Scenario    │ │ Scenario    │ │ Scenario    │               │
│  │   Card      │ │   Card      │ │   Card      │               │
│  │             │ │             │ │             │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  [Load More...]                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Roleplay `/roleplay/[sessionId]`

```
┌─────────────────────────────────────────────────────────────────┐
│  Cloud Migration Sales                     [End Chat] [❓ Help] │
├──────────────────────────────────┬──────────────────────────────┤
│                                  │                              │
│  Dialogue Area                   │  Buyer Info                  │
│  ────────────────                │  ──────                      │
│                                  │                              │
│  ┌────────────────────────────┐ │  👤 Michael Li               │
│  │ 🤖 Buyer Message           │ │  CTO @ FinTech Company       │
│  │                            │ │                              │
│  │ Message content...         │ │  Concerns:                   │
│  └────────────────────────────┘ │  • Data compliance           │
│                                  │  • Migration cost            │
│  ┌────────────────────────────┐ │  • Technical support         │
│  │ 👤 User Message            │ │                              │
│  │                            │ │  ──────                      │
│  │ Message content...         │ │  Progress                    │
│  └────────────────────────────┘ │  ████░░░░ 3/8                │
│                                  │                              │
│  ┌────────────────────────────┐ │  ──────                      │
│  │ 🤖 Buyer Message           │ │  Real-time Tips              │
│  │                            │ │                              │
│  │ Message content...         │ │  💡 Tip 1                    │
│  └────────────────────────────┘ │  💡 Tip 2                    │
│                                  │                              │
├──────────────────────────────────┴──────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Type your response...                                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                     [Send ➤]   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.5 Feedback Page `/feedback/[sessionId]`

```
┌─────────────────────────────────────────────────────────────────┐
│  [< Back]                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    Practice Evaluation                          │
│                                                                 │
│                      ┌─────────────┐                            │
│                      │             │                            │
│                      │     78      │                            │
│                      │    /100     │                            │
│                      │             │                            │
│                      └─────────────┘                            │
│                         Good 👍                                 │
│                   3 points higher than last time!               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Dimension Scores                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Value Articulation ████████████████████░░░░░  80/100    │   │
│  │ Objection Handling ███████████████████░░░░░░  75/100    │   │
│  │ Technical Clarity  ███████████████████░░░░░░  78/100    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Detailed Analysis                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Value Articulation 80/100                               │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 📝 Your Response                                        │   │
│  │ "Alibaba Cloud has the most data centers in APAC..."    │   │
│  │                                                         │   │
│  │ ✅ Done Well                                            │   │
│  │ • Mentioned geographic advantage                        │   │
│  │ • Highlighted industry solution                         │   │
│  │                                                         │   │
│  │ 💡 Can Improve                                          │   │
│  │ • Add specific data points                              │   │
│  │ • Mention differentiation from AWS                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [View Chat] [Generate Email] [Try Again] [Back to Scenarios]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 Admin Dashboard `/admin`

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin Panel                                    [User] ▼ [Out]  │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  Navigation  │  Dashboard                                       │
│  ────────    │                                                  │
│              │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  📊 Dashboard│  │ Active   │ │ Sessions │ │ Scenarios│ │ Avg  ││
│  📋 Scenarios│  │  128     │ │  456     │ │   12     │ │ 75.3 ││
│  👥 Users    │  └──────────┘ └──────────┘ └──────────┘ └──────┘│
│  📈 Stats    │                                                  │
│  ⚙️ Settings │  ┌─────────────────────────────────────────────┐│
│              │  │           Practice Trend Chart               ││
│              │  │  [Chart]                                     ││
│              │  └─────────────────────────────────────────────┘│
│              │                                                  │
│              │  ┌────────────────┐  ┌────────────────────────┐│
│              │  │ Score Dist.    │  │    Recent Activity     ││
│              │  │ [Pie Chart]    │  │  • John completed...   ││
│              │  │                │  │  • Jane created...     ││
│              │  │                │  │  • ...                 ││
│              │  └────────────────┘  └────────────────────────┘│
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 6. Interaction Design

### 6.1 Loading States

#### 6.1.1 Page Loading

```tsx
// Full screen loading
<PageLoader>
  <Spinner size="lg" />
  <LoadingText>Loading...</LoadingText>
</PageLoader>
```

#### 6.1.2 Button Loading

```tsx
<Button loading>
  <Spinner size="sm" />
  Submitting...
</Button>
```

#### 6.1.3 Skeleton Screen

```tsx
<Skeleton>
  <SkeletonText lines={3} />
  <SkeletonRect width={200} height={40} />
</Skeleton>
```

### 6.2 Empty State

```tsx
<EmptyState
  icon={<NoDataIcon />}
  title="No Data"
  description="You don't have any practice records yet"
  action={<Button>Start Your First Practice</Button>}
/>
```

### 6.3 Error State

```tsx
<ErrorState
  icon={<ErrorIcon />}
  title="Something went wrong"
  description="Please try again later"
  action={<Button onClick={retry}>Retry</Button>}
/>
```

### 6.4 Toast Notifications

```tsx
// Success
toast.success('Operation successful');

// Error
toast.error('Operation failed, please try again');

// Warning
toast.warning('Please select a scenario first');

// Info
toast.info('New scenario available');
```

### 6.5 Confirm Dialog

```tsx
<ConfirmDialog
  open={isOpen}
  title="Confirm Delete"
  description="This action cannot be undone. Are you sure?"
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

---

## 7. Animations

### 7.1 Page Transitions

```css
/* Fade in/out */
.page-enter {
  opacity: 0;
}
.page-enter-active {
  opacity: 1;
  transition: opacity 200ms ease-in;
}
.page-exit {
  opacity: 1;
}
.page-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-out;
}
```

### 7.2 Component Animations

```css
/* Card hover */
.card {
  transition: transform 200ms ease, box-shadow 200ms ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Button click */
.button:active {
  transform: scale(0.98);
}

/* Message bubble appear */
@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.message {
  animation: messageIn 300ms ease-out;
}
```

### 7.3 Loading Animations

```css
/* Spin loader */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.spinner {
  animation: spin 1s linear infinite;
}

/* Typing indicator */
@keyframes typing {
  0%, 60%, 100% { opacity: 0.2; }
  30% { opacity: 1; }
}
.typing-dot {
  animation: typing 1.4s infinite;
}
```

---

## 8. Accessibility

### 8.1 Keyboard Navigation

- All interactive elements accessible via Tab key
- Enter/Space triggers buttons
- Escape closes modals
- Arrow keys navigate list items

### 8.2 Screen Reader Support

```tsx
// ARIA labels
<button aria-label="Close dialog">
  <CloseIcon />
</button>

// Roles
<nav role="navigation" aria-label="Main navigation">
  ...
</nav>

// States
<input aria-invalid={hasError} aria-describedby="error-message" />
```

### 8.3 Color Contrast

- Text to background contrast ≥ 4.5:1
- Large text contrast ≥ 3:1
- Non-text elements contrast ≥ 3:1

---

## 9. Performance Optimization

### 9.1 Image Optimization

```tsx
// Use Next.js Image component
<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={40}
  height={40}
  loading="lazy"
/>
```

### 9.2 Code Splitting

```tsx
// Dynamic imports
const AdminPanel = dynamic(() => import('./AdminPanel'), {
  loading: () => <PageLoader />,
});
```

### 9.3 Caching Strategy

```tsx
// React Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});
```

---

## 10. Development Guidelines

### 10.1 File Naming

- Components: `PascalCase.tsx` (e.g., `ScenarioCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Styles: `kebab-case.css` (e.g., `global-styles.css`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `API_ENDPOINTS.ts`)

### 10.2 Component Structure

```tsx
// ComponentName.tsx
import { useState, useEffect } from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // props definition
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // hooks
  const [state, setState] = useState();
  
  // effects
  useEffect(() => {
    // ...
  }, []);
  
  // handlers
  const handleClick = () => {
    // ...
  };
  
  // render
  return (
    <div className={styles.container}>
      {/* ... */}
    </div>
  );
}
```

### 10.3 Git Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Documentation update
style: Code formatting (no logic changes)
refactor: Code refactoring
perf: Performance optimization
test: Testing related
chore: Build/tooling related
```

---

*Document Version: 1.0*
*Last Updated: 2026-01-12*

