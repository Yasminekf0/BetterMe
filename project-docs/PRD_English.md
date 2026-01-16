# Master Trainer Product Requirements Document (PRD)
# AI That Coaches Like a Human

---

## Document Information

| Item | Content |
|------|---------|
| Product Name | Master Trainer (AliCloud Sales Readiness Lab) |
| Version | 1.0 |
| Created Date | 2026-01-12 |
| Status | Initial Draft |
| Target Event | La FrenchTech Shanghai AI Hackathon |

---

## 1. Executive Summary

### 1.1 Product Vision

Master Trainer is an AI-powered sales training and coaching system that simulates real enterprise buyers through natural conversation, helping sales teams transform from product knowledge to execution readiness.

**Core Value Proposition**:
> "We're not building another training platform — we're building a sales execution readiness engine that helps Alibaba Cloud sellers practice, improve, and execute better conversations before they ever talk to a customer."

### 1.2 Problem Statement

Alibaba Cloud operates in a fast-moving environment:
- Frequent new product launches
- Constant pricing changes
- Regulatory requirements updates
- Increasing competitive pressure (AWS, Azure, Tencent Cloud)

**Current Pain Points**:
1. Certifications test knowledge, not execution ability
2. Sales reps struggle with live objections, positioning, and technical clarity
3. Managers lack time to coach at scale
4. Partner sales quality is inconsistent
5. Training content becomes outdated quickly

**Core Gap**: Knowing Alibaba Cloud ≠ Selling Alibaba Cloud Well

### 1.3 Solution Overview

Build a "Master Trainer" AI system that enables:
- Practice real cloud sales conversations with an AI buyer
- Receive explainable, evidence-based feedback
- Generate conversation-aware follow-up emails
- Allow enablement teams to update scenarios instantly

This is NOT an LMS. This is NOT a generic AI chatbot.
This is a **Practice → Feedback → Execution** loop designed for enterprise cloud sales in Asia.

---

## 2. Target Users

### 2.1 Primary User Groups

#### 2.1.1 Sales Representatives / Solution Architects

**User Persona**:
- Age: 25-45 years
- Role: Alibaba Cloud Sales Rep, Solution Architect
- Experience: 1-10 years
- Technical Level: Intermediate

**Needs**:
- Practice difficult conversations safely
- Improve objection handling before customer meetings
- Reinforce correct positioning in follow-ups

**Pain Points**:
- Lack of realistic practice opportunities
- Unable to get immediate feedback
- Not familiar enough with new products/features

#### 2.1.2 Enablement / Sales Operations

**User Persona**:
- Age: 30-50 years
- Role: Training Manager, Sales Operations
- Experience: 5-15 years
- Technical Level: Intermediate

**Needs**:
- Update scenarios as products change
- Standardize messaging across regions and partners
- Reduce dependency on manual coaching

**Pain Points**:
- Training content update lag
- Unable to scale coaching
- Difficulty measuring training effectiveness

#### 2.1.3 Managers (Future Phase)

**User Persona**:
- Age: 35-55 years
- Role: Sales Manager, Regional Director
- Experience: 10-20 years

**Needs**:
- See readiness gaps at a glance
- Coach selectively, not constantly

---

## 3. Functional Requirements

### 3.1 MVP Core Features (Hackathon Scope)

#### 3.1.1 AI Roleplay Engine

**Feature Description**:
Simulate realistic enterprise buyer conversations using Tongyi Qianwen AI.

**Feature Specifications**:

| Feature | Description |
|---------|-------------|
| Multi-turn Dialogue | Support 6-8 meaningful conversation turns |
| Buyer Personas | CTO, Compliance Officer, Procurement Manager, etc. |
| Objection Scenarios | Common enterprise cloud sales objections |
| Regional Focus | China/Asia-specific market concerns |
| Conversation Mode | Text chat (Voice as extension) |

**Buyer Persona Example**:

```
Name: Michael Li - Technical Decision Maker
Title: CTO
Company: Mid-size FinTech Company
Background: 15 years IT experience, currently using AWS
Concerns: Data compliance, cost, technical support
Personality: Direct, data-driven, skeptical of new solutions
```

**Interaction Flow**:
1. User selects scenario
2. System displays buyer persona information
3. User initiates conversation
4. AI responds as buyer
5. Multi-turn dialogue until completion
6. Generate feedback and email

#### 3.1.2 Explainable Feedback Engine

**Feature Description**:
Provide structured, explainable feedback after conversation completion.

**Evaluation Dimensions**:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Value Articulation | 35% | Whether Alibaba Cloud value is clearly expressed |
| Objection Handling | 35% | Whether customer objections are effectively addressed |
| Technical Clarity | 30% | Whether technical explanations are accurate and clear |

**Feedback Format**:

```json
{
  "overallScore": 75,
  "dimensions": [
    {
      "name": "Value Articulation",
      "score": 80,
      "quote": "User response quote...",
      "explanation": "You effectively highlighted the elastic advantages..."
    },
    {
      "name": "Objection Handling",
      "score": 70,
      "quote": "User response quote...",
      "explanation": "When facing security concerns, you could be more specific..."
    },
    {
      "name": "Technical Clarity",
      "score": 75,
      "quote": "User response quote...",
      "explanation": "Technical explanations were generally clear, but when discussing..."
    }
  ],
  "summary": "Overall performance was good, recommend focusing on...",
  "recommendations": [
    "Recommendation 1...",
    "Recommendation 2...",
    "Recommendation 3..."
  ]
}
```

#### 3.1.3 Follow-Up Email Generator

**Feature Description**:
Automatically generate professional follow-up emails based on conversation context.

**Feature Specifications**:
- Extract key points from conversation
- Address objections raised by customer
- Provide next step suggestions
- Maintain enterprise-grade professional tone
- Support editing before copy/save

**Email Template Structure**:
```
Subject: Follow-up on [Discussion Topic]

[Customer Name],

Thank you for discussing [topic] with me today.

Regarding your concerns about [concern], I wanted to add...

[Specific response and value proposition]

For next steps, I recommend...

[Closing]

[Signature]
```

#### 3.1.4 Scenario Studio

**Feature Description**:
Provide low-code scenario management interface for enablement admins.

**Management Features**:

| Feature | Description |
|---------|-------------|
| Scenario Creation | Create new training scenarios |
| Buyer Persona Editing | Set buyer background, personality, concerns |
| Objection Library | Add and edit common objections |
| Ideal Response Setting | Set reference answers for each objection |
| Activation Control | Control scenario online/offline status |
| Difficulty Level | Set scenario difficulty (Easy/Medium/Hard) |

**Scenario Data Structure**:
```json
{
  "title": "Scenario Title",
  "description": "Scenario Description",
  "category": "Category",
  "difficulty": "medium",
  "buyerPersona": {
    "name": "Buyer Name",
    "role": "Title",
    "company": "Company",
    "background": "Background",
    "concerns": ["Concern 1", "Concern 2"],
    "personality": "Personality Description"
  },
  "objections": [
    "Objection 1",
    "Objection 2"
  ],
  "idealResponses": [
    "Ideal Response 1",
    "Ideal Response 2"
  ]
}
```

#### 3.1.5 Lightweight Web Application

**Page Planning**:

| Page | Function | Users |
|------|----------|-------|
| Login | User authentication | All users |
| Dashboard | Overview and quick access | All users |
| Scenario List | Browse and select scenarios | Sales reps |
| Roleplay | AI conversation | Sales reps |
| Feedback | View evaluation results | Sales reps |
| Email | Generate and edit emails | Sales reps |
| History | View practice history | Sales reps |
| Admin | Scenario and user management | Admins |

### 3.2 Extension Features (Time Permitting)

| Feature | Priority | Description |
|---------|----------|-------------|
| Voice Conversation | P1 | Voice input and output |
| Multi-language Support | P2 | Chinese/English switch |
| Progress Dashboard | P2 | User learning progress visualization |
| Team Statistics | P3 | Team overall readiness statistics |

### 3.3 Explicitly Out of Scope (Hackathon)

- ❌ Full LMS system
- ❌ CRM integrations
- ❌ Automated email sending
- ❌ Deep analytics dashboards
- ❌ Multi-language support
- ❌ Partner permission matrices

---

## 4. User Flows

### 4.1 Sales Rep Main Flow

```
┌─────────┐    ┌───────────┐    ┌─────────────┐    ┌─────────────┐
│  Login  │───►│ Dashboard │───►│Select Scene │───►│View Details │
└─────────┘    └───────────┘    └─────────────┘    └─────────────┘
                                                         │
                                                         ▼
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│Copy/Save  │◄───│Edit Email │◄───│Gen. Email │◄───│View Feedbk│
└───────────┘    └───────────┘    └───────────┘    └───────────┘
                                                         ▲
                                                         │
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│Start Chat │───►│Multi-turn │───►│ End Chat  │───►│Gen Feedbk │
└───────────┘    └───────────┘    └───────────┘    └───────────┘
```

### 4.2 Admin Main Flow

```
┌─────────┐    ┌──────────────┐    ┌────────────────────────────────┐
│  Login  │───►│ Admin Panel  │───►│ Scenarios / Users / Statistics │
└─────────┘    └──────────────┘    └────────────────────────────────┘
                                                 │
                                                 ▼
                                   ┌──────────────────────────────┐
                                   │ Create/Edit → Set Persona →  │
                                   │ Add Objections → Test → Pub. │
                                   └──────────────────────────────┘
```

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

| Metric | Requirement |
|--------|-------------|
| AI Response Latency | < 3 seconds |
| Page Load Time | < 2 seconds |
| Concurrent User Support | ≥ 50 |
| System Availability | ≥ 99% |

### 5.2 Security Requirements

- Encrypted data transmission (HTTPS)
- Encrypted storage for sensitive data
- Role-based access control (RBAC)
- API request authentication
- Session timeout management

### 5.3 Usability Requirements

- Responsive design for desktop and tablet
- Intuitive user interface
- Clear error messages
- Consistent design language

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+, React 18+, TailwindCSS |
| Backend | Node.js 18+, Express.js |
| Database | PostgreSQL (ApsaraDB) |
| AI Service | Tongyi Qianwen |
| Authentication | JWT + DingTalk OAuth |
| Deployment | Alibaba Cloud ECS |

### 6.2 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│  ┌─────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐   │
│  │  Login  │  │ Dashboard │  │ Roleplay │  │   Admin   │   │
│  └─────────┘  └───────────┘  └──────────┘  └───────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │ API Calls
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   Node.js Backend (Express)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │ Roleplay │  │ Feedback │  │  Email   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└───────────────────┬───────────────────────┬──────────────────┘
                    │                       │
          ┌─────────▼─────────┐   ┌─────────▼─────────┐
          │    PostgreSQL     │   │  Tongyi Qianwen   │
          │    (ApsaraDB)     │   │       API         │
          └───────────────────┘   └───────────────────┘
```

---

## 7. Success Metrics

### 7.1 Hackathon Success Criteria (Within 24 Hours)

| Metric | Target |
|--------|--------|
| Scenario Selection | ✅ Can select real Alibaba Cloud sales scenarios |
| AI Roleplay | ✅ Multi-turn dialogue with skeptical buyer |
| Explainable Feedback | ✅ Feedback with direct quotes |
| Email Generation | ✅ One-click professional follow-up email |
| Scenario Management | ✅ Update scenarios without code |

### 7.2 Long-term Product Metrics

| Metric | Target |
|--------|--------|
| User Activity | Weekly active rate > 60% |
| Average Practice | > 3 times per week |
| Feedback Usefulness | > 4.0/5.0 |
| Scenario Update Frequency | > 2 new scenarios per month |

---

## 8. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI Response Instability | High | Medium | Prepare backup prompts, add retry mechanism |
| Inaccurate AI Feedback | High | Medium | Strict prompt engineering, manual review |
| Auth Integration Complexity | Medium | Medium | Prepare mock login fallback |
| Insufficient Time | High | High | Prioritize MVP features, prepare screenshot demo backup |

---

## 9. Demo Script

### 9.1 Demo Flow (5 Minutes)

**Minute 1: Problem Statement**
- Show sales readiness gap
- Explain why certification ≠ execution ability

**Minute 2: Solution Overview**
- Introduce Master Trainer concept
- Emphasize "Practice → Feedback → Execution" loop

**Minutes 3-4: Live Demo**
1. Select sales scenario
2. Conduct 2-3 rounds of dialogue with AI buyer
3. View generated feedback
4. Generate follow-up email

**Minute 5: Summary and Outlook**
- Emphasize value proposition
- Show expansion possibilities

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| Roleplay | Simulated sales conversation with AI buyer |
| Scenario | Preset sales situation with buyer persona and objections |
| Feedback | AI-generated evaluation report after conversation |
| Buyer Persona | Virtual customer role played by AI |
| Objection | Questions or concerns buyer might raise |

### 10.2 Reference Documents

- AI Hackathon Teaser & Topic Overview
- AliCloud Sales Readiness Lab Executive Summary
- Hackathon Prep Plan

---

*Document Version: 1.0*
*Last Updated: 2026-01-12*

