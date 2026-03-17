# QuizLoom Project Structure (Updated)

Last updated against current workspace state.

## 1. Repository Overview

This repository is a full-stack quiz platform with:

- `client/`: React + Vite frontend
- `server/`: Express + PostgreSQL backend
- Role model:
  - `teacher` users are stored in DB (`teachers` table)
  - `admin` is environment-configured (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_NAME`)

## 2. File Tree

### 2.1 Root (excluding `.git`, `node_modules`, `dist`)

```text
.
├── .agents/
├── .gitignore
├── LICENSE
├── README.md
├── admin-plan.md
├── client/
├── db_plan.md
├── package-lock.json
├── package.json
├── plan.md
├── public/
├── security.md
├── server/
├── structure.md
└── update.md
```

### 2.2 `client/src`

```text
client/src
├── App.jsx
├── components
│   ├── admin
│   │   ├── AddTeacherModal.jsx
│   │   ├── AssignSubjectsModal.jsx
│   │   └── SchoolTabs.jsx
│   ├── layout
│   │   ├── AdminShell.jsx
│   │   ├── AdminSidebar.jsx
│   │   ├── ProfileFooter.jsx
│   │   ├── TeacherShell.jsx
│   │   ├── TeacherSidebar.jsx
│   │   └── TeacherTopBar.jsx
│   ├── quiz
│   │   ├── CountdownTimer.jsx
│   │   └── MathEquationInput.jsx
│   ├── shared
│   │   ├── Avatar.jsx
│   │   ├── BackendWarmupGate.jsx
│   │   ├── LoadingScreen.jsx
│   │   └── ProtectedRoute.jsx
│   ├── teacher
│   │   ├── FlagBadge.jsx
│   │   ├── GenerateModeModal.jsx
│   │   ├── ParticipantsTrendChart.jsx
│   │   ├── QuestionBuilder.jsx
│   │   ├── QuestionPreviewList.jsx
│   │   ├── QuizListCard.jsx
│   │   ├── ResponseTable.jsx
│   │   └── UnitQuestionsList.jsx
│   └── ui
│       ├── accordion.jsx
│       ├── alert-dialog.jsx
│       ├── avatar.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── checkbox.jsx
│       ├── date-time-picker.jsx
│       ├── dialog.jsx
│       ├── dropdown-menu.jsx
│       ├── form.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── pagination.jsx
│       ├── popover.jsx
│       ├── progress.jsx
│       ├── radio-group.jsx
│       ├── scroll-area.jsx
│       ├── select.jsx
│       ├── separator.jsx
│       ├── switch.jsx
│       ├── table.jsx
│       ├── tabs.jsx
│       ├── textarea.jsx
│       └── toaster.jsx
├── context
│   └── AuthContext.jsx
├── hooks
│   ├── useAuth.js
│   ├── useProctoring.js
│   ├── useTimer.js
│   └── useToast.js
├── index.css
├── lib
│   ├── apiBaseUrl.js
│   ├── applyThemeVariables.js
│   └── utils.js
├── main.jsx
├── pages
│   ├── admin
│   │   ├── AdminDashboardPage.jsx
│   │   └── SchoolTeachersPage.jsx
│   ├── auth
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── student
│   │   ├── EntryPage.jsx
│   │   └── QuizPage.jsx
│   └── teacher
│       ├── AutoGeneratePage.jsx
│       ├── DashboardPage.jsx
│       ├── ManualQuizPage.jsx
│       ├── OngoingQuizListPage.jsx
│       ├── OngoingQuizPage.jsx
│       ├── ProfilePage.jsx
│       ├── QuestionBankPage.jsx
│       ├── QuizLibraryPage.jsx
│       ├── QuizResponsePage.jsx
│       └── ScheduledQuizListPage.jsx
├── services
│   ├── adminService.js
│   ├── api.js
│   ├── authService.js
│   ├── questionService.js
│   ├── quizService.js
│   ├── responseService.js
│   ├── sessionService.js
│   ├── subjectService.js
│   ├── unitService.js
│   └── violationService.js
├── theme.js
└── utils
    ├── excelParser.js
    ├── formatTime.js
    └── sessionKeys.js
```

### 2.3 `server`

```text
server
├── .env
├── .env.example
├── app.js
├── config
│   ├── db.js
│   └── jwt.js
├── controllers
│   ├── admin.controller.js
│   ├── auth.controller.js
│   ├── questions.controller.js
│   ├── quizzes.controller.js
│   ├── responses.controller.js
│   ├── sessions.controller.js
│   ├── subjects.controller.js
│   ├── teacherProfile.controller.js
│   ├── units.controller.js
│   └── violations.controller.js
├── index.js
├── middleware
│   ├── authenticate.js
│   ├── authorize.js
│   ├── errorHandler.js
│   └── validate.js
├── package-lock.json
├── package.json
├── routes
│   ├── admin.routes.js
│   ├── auth.routes.js
│   ├── questions.routes.js
│   ├── quizzes.routes.js
│   ├── sessions.routes.js
│   ├── subjects.routes.js
│   ├── teachers.routes.js
│   ├── units.routes.js
│   └── violations.routes.js
├── scripts
│   ├── create_admin.js
│   ├── migrate_plan14_avatar_schema.js
│   ├── migrate_plan1_teacher_schema.js
│   └── migrate_scheduled_status.js
├── services
│   ├── quizLifecycle.service.js
│   ├── quizScheduler.service.js
│   ├── quizTiming.service.js
│   ├── scorer.service.js
│   └── sessionLifecycle.service.js
├── sql
│   └── schema.sql
└── tests
    └── quiz-timing.test.js
```

## 3. Frontend Routing (`client/src/App.jsx`)

| Path | Access | Page |
|---|---|---|
| `/login` | Public | `LoginPage` |
| `/quiz/enter/:accessToken` | Public | `EntryPage` |
| `/quiz/take` | Public | `QuizPage` |
| `/teacher` | Teacher | `DashboardPage` |
| `/teacher/profile` | Teacher | `ProfilePage` |
| `/teacher/questions/:subjectId` | Teacher | `QuestionBankPage` |
| `/teacher/quiz/manual` | Teacher | `ManualQuizPage` |
| `/teacher/quiz/manual/:quizId` | Teacher | `ManualQuizPage` |
| `/teacher/quiz/auto` | Teacher | `AutoGeneratePage` |
| `/teacher/quiz/library` | Teacher | `QuizLibraryPage` |
| `/teacher/quiz/scheduled` | Teacher | `ScheduledQuizListPage` |
| `/teacher/quiz/ongoing` | Teacher | `OngoingQuizListPage` |
| `/teacher/quiz/ongoing/:quizId` | Teacher | `OngoingQuizPage` |
| `/teacher/quiz/:quizId/responses` | Teacher | `QuizResponsePage` |
| `/admin` | Admin | `AdminDashboardPage` |
| `/admin/schools/:school` | Admin | `SchoolTeachersPage` |
| `*` | Public | Redirect to `/login` |

## 4. Frontend Service → API Mapping

### 4.1 Auth

| Service function | Method + API path |
|---|---|
| `register` | `POST /api/auth/register` |
| `login` | `POST /api/auth/login` |
| `logout` | `POST /api/auth/logout` |
| `me` | `GET /api/auth/me` |
| `updateProfile` | `PUT /api/auth/profile` |
| `changePassword` | `PUT /api/auth/change-password` |
| `uploadAvatar` | `PUT /api/teachers/me/avatar` |
| `removeAvatar` | `DELETE /api/teachers/me/avatar` |

### 4.2 Admin

| Service function | Method + API path |
|---|---|
| `getTeachersBySchool(school)` | `GET /api/admin/schools/:school/teachers` |
| `addTeacher(payload)` | `POST /api/admin/teachers` |
| `assignSubjects(teacherId, ids)` | `PUT /api/admin/teachers/:id/subjects` |
| `getCredentials(teacherId)` | `GET /api/admin/teachers/:id/credentials` |
| `getAllSubjects()` | `GET /api/admin/subjects` |
| `getSubjectQuestions(subjectId)` | `GET /api/admin/subjects/:id/questions` |

### 4.3 Teacher domain

| Service file | Primary endpoints |
|---|---|
| `subjectService` | `GET/POST/DELETE /api/subjects`, `GET /api/subjects/:id/quiz-history` |
| `unitService` | `GET/POST /api/subjects/:id/units`, `PUT/DELETE /api/units/:id`, `GET /api/units/:id/questions` |
| `questionService` | `GET/POST /api/questions`, `POST /api/questions/bulk-import`, `PUT/DELETE /api/questions/:id` |
| `quizService` | `GET /api/quizzes`, `GET /api/quizzes/:id`, `POST /api/quizzes/manual`, `POST /api/quizzes/auto-generate`, `PUT /api/quizzes/:id`, `PUT /api/quizzes/:id/status`, `POST /api/quizzes/:id/duplicate`, `DELETE /api/quizzes/:id`, plus stats/preview/export/leaderboard routes |
| `responseService` | `GET /api/quizzes/:id/responses` |
| `sessionService` | `POST /api/sessions/enter`, `POST /api/sessions/progress`, `POST /api/sessions/submit` |
| `violationService` | `POST /api/violations`, `GET /api/violations?session_id=...` |

## 5. Backend Routing and Access

### 5.1 Global endpoints

- `GET /api/health`
- `GET /` (API running check)

### 5.2 Auth routes (`/api/auth`)

| Method | Path | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/logout` | Teacher/Admin |
| GET | `/me` | Teacher/Admin |
| PUT | `/profile` | Teacher |
| PUT | `/change-password` | Teacher |

### 5.3 Admin routes (`/api/admin`) — all `admin` only

| Method | Path | Controller |
|---|---|---|
| GET | `/schools/:school/teachers` | `getTeachersBySchool` |
| POST | `/teachers` | `addTeacher` |
| PUT | `/teachers/:id/subjects` | `assignSubjects` |
| GET | `/teachers/:id/credentials` | `getTeacherCredentials` |
| GET | `/subjects` | `getAllSubjectsForAdmin` |
| GET | `/subjects/:id/questions` | `getSubjectQuestionsForAdmin` |

### 5.4 Subject & unit routes

- Prefix: `/api/subjects` (authenticated)
- `GET /` teacher/admin
- `POST /` admin
- `DELETE /:id` admin
- `GET /:id/units` teacher/admin
- `POST /:id/units` admin
- `PUT /:id/units/:unitId` admin
- `DELETE /:id/units/:unitId` admin
- `GET /:id/quiz-history` teacher

- Prefix: `/api/units` (authenticated)
- `PUT /:id` admin
- `DELETE /:id` admin
- `GET /:id/questions` teacher/admin

### 5.5 Question routes (`/api/questions`) — teacher only

- `GET /`
- `POST /`
- `POST /bulk-import`
- `PUT /:id`
- `DELETE /:id`

### 5.6 Quiz routes (`/api/quizzes`) — teacher only

- `GET /`
- `GET /:id`
- `GET /:id/live-stats`
- `GET /:id/preview`
- `GET /:id/export`
- `GET /:id/leaderboard`
- `GET /:id/responses`
- `POST /manual`
- `POST /auto-generate`
- `POST /:id/duplicate`
- `PUT /:id/status`
- `PUT /:id`
- `DELETE /:id`

### 5.7 Session & violation routes

- Prefix: `/api/sessions` (public student flow)
  - `POST /enter`
  - `POST /progress` (session token header)
  - `POST /submit` (session token header)

- Prefix: `/api/violations`
  - `POST /` (public with session token)
  - `GET /` teacher only

### 5.8 Teacher profile/avatar routes (`/api/teachers`)

| Method | Path | Access |
|---|---|---|
| GET | `/me/avatar` | Teacher |
| PUT | `/me/avatar` | Teacher |
| DELETE | `/me/avatar` | Teacher |
| GET | `/:id/avatar` | Teacher/Admin (teacher can only fetch own avatar; admin can fetch any) |

## 6. Auth & Role Model

- JWT payload includes role (`teacher` or `admin`).
- `teacher` accounts come from DB table `teachers`.
- `admin` login is validated against env values in `auth.controller.js`:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD_HASH`
  - `ADMIN_NAME`
- Frontend route protection uses `ProtectedRoute` with role checks.
- Backend role checks use `authenticate` + `authorize(...roles)`.

## 7. Database Schema (`server/sql/schema.sql`)

### 7.1 Core tables

- `teachers`
  - includes school/contact fields
  - avatar storage fields: `avatar_data`, `avatar_mime`, `has_avatar`
- `subjects`
- `units`
- `questions`
- `quizzes`
- `quiz_questions`
- `student_sessions`
- `student_answers`
- `violation_flags`
- `revoked_tokens`
- `teacher_subjects` (teacher-subject assignment join table)

### 7.2 Important relationships

- `subjects.created_by -> teachers.id`
- `units.subject_id -> subjects.id`
- `units.created_by -> teachers.id`
- `questions.subject_id -> subjects.id`
- `questions.unit_id -> units.id`
- `questions.created_by -> teachers.id`
- `quizzes.subject_id -> subjects.id`
- `quizzes.created_by -> teachers.id`
- `quiz_questions.quiz_id -> quizzes.id`
- `quiz_questions.question_id -> questions.id`
- `student_sessions.quiz_id -> quizzes.id`
- `student_answers.session_id -> student_sessions.id`
- `student_answers.question_id -> questions.id`
- `violation_flags.session_id -> student_sessions.id`
- `revoked_tokens.user_id -> teachers.id`
- `teacher_subjects.teacher_id -> teachers.id`
- `teacher_subjects.subject_id -> subjects.id`

### 7.3 Notable constraints/indexes

- `teachers.email` unique
- `subjects.name` unique
- `units` unique `(subject_id, name)`
- `quiz_questions` unique `(quiz_id, question_id)`
- `student_answers` unique `(session_id, question_id)`
- `teacher_subjects` unique `(teacher_id, subject_id)`
- quiz status check: `draft | active | ended | scheduled`

## 8. Key Runtime Flows

### 8.1 Teacher flow

1. Teacher logs in (`/api/auth/login` with `role: teacher`).
2. Frontend stores token/user in `AuthContext` and localStorage.
3. Teacher manages subjects/units/questions/quizzes via protected routes and APIs.
4. Student sessions are entered and submitted through `/api/sessions/*`.

### 8.2 Admin flow

1. Admin logs in (`/api/auth/login` with `role: admin`) using env-backed credentials.
2. Admin dashboard and school teacher pages live under `/admin`.
3. Admin manages teacher creation and subject assignment via `/api/admin/*`.

### 8.3 Avatar flow

1. Teacher uploads image (`PUT /api/teachers/me/avatar`, multipart form-data).
2. Backend stores binary bytes + MIME in `teachers`.
3. Frontend shared `Avatar` component requests avatar blob and falls back to initials when absent.

## 9. Scripts and Environment

### 9.1 Root scripts

- `npm run dev` — run server + client concurrently
- `npm run build` — build client
- `npm run start` — run server + client preview
- `npm run install:all` — install server/client dependencies

### 9.2 Server scripts

- `npm run dev --prefix server`
- `npm run test --prefix server`
- `npm run create-admin --prefix server`
- `npm run migrate-plan1 --prefix server`
- `npm run migrate-plan14-avatar --prefix server`

### 9.3 Important env vars

Server (`server/.env` / `.env.example`):

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_NAME`
- `CLIENT_URLS` (or `CLIENT_URL`)

Client (`client/.env` / `.env.example`):

- `VITE_API_URL`

## 10. Notes

- `structure.md` now reflects current admin + teacher architecture and avatar upload implementation.
- If additional routes/services are added, update sections 3, 4, and 5 first to keep docs accurate.
