# QuizLoom Project Structure

Last verified: 2026-04-05

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
├── .gitignore
├── LICENSE
├── README.md
├── client/
├── package-lock.json
├── package.json
├── public/
├── server/
└── structure.md
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
│   │   ├── AllTeachersPage.jsx
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

<table>
    <thead>
        <tr>
            <th>Path</th>
            <th>Access</th>
            <th>Page</th>
        </tr>
    </thead>
    <tbody>
        <tr><td><code>/login</code></td><td>Public</td><td><code>LoginPage</code></td></tr>
        <tr><td><code>/quiz/enter/:accessToken</code></td><td>Public</td><td><code>EntryPage</code></td></tr>
        <tr><td><code>/quiz/take</code></td><td>Public</td><td><code>QuizPage</code></td></tr>
        <tr><td><code>/teacher</code></td><td>Teacher</td><td><code>DashboardPage</code></td></tr>
        <tr><td><code>/teacher/profile</code></td><td>Teacher</td><td><code>ProfilePage</code></td></tr>
        <tr><td><code>/teacher/questions/:subjectId</code></td><td>Teacher</td><td><code>QuestionBankPage</code></td></tr>
        <tr><td><code>/teacher/quiz/manual</code></td><td>Teacher</td><td><code>ManualQuizPage</code></td></tr>
        <tr><td><code>/teacher/quiz/manual/:quizId</code></td><td>Teacher</td><td><code>ManualQuizPage</code></td></tr>
        <tr><td><code>/teacher/quiz/auto</code></td><td>Teacher</td><td><code>AutoGeneratePage</code></td></tr>
        <tr><td><code>/teacher/quiz/library</code></td><td>Teacher</td><td><code>QuizLibraryPage</code></td></tr>
        <tr><td><code>/teacher/quiz/scheduled</code></td><td>Teacher</td><td><code>ScheduledQuizListPage</code></td></tr>
        <tr><td><code>/teacher/quiz/ongoing</code></td><td>Teacher</td><td><code>OngoingQuizListPage</code></td></tr>
        <tr><td><code>/teacher/quiz/ongoing/:quizId</code></td><td>Teacher</td><td><code>OngoingQuizPage</code></td></tr>
        <tr><td><code>/teacher/quiz/:quizId/responses</code></td><td>Teacher</td><td><code>QuizResponsePage</code></td></tr>
        <tr><td><code>/admin</code></td><td>Admin</td><td><code>AdminDashboardPage</code></td></tr>
        <tr><td><code>/admin/teachers</code></td><td>Admin</td><td><code>AllTeachersPage</code></td></tr>
        <tr><td><code>/admin/schools/:school</code></td><td>Admin</td><td><code>SchoolTeachersPage</code></td></tr>
        <tr><td><code>*</code></td><td>Public</td><td>Redirect to <code>/login</code></td></tr>
    </tbody>
</table>

## 4. Frontend Service → API Mapping

### 4.1 Auth

<table>
    <thead>
        <tr>
            <th>Service function</th>
            <th>Method + API path</th>
        </tr>
    </thead>
    <tbody>
        <tr><td><code>register</code></td><td><code>POST /api/auth/register</code></td></tr>
        <tr><td><code>login</code></td><td><code>POST /api/auth/login</code></td></tr>
        <tr><td><code>logout</code></td><td><code>POST /api/auth/logout</code></td></tr>
        <tr><td><code>me</code></td><td><code>GET /api/auth/me</code></td></tr>
        <tr><td><code>updateProfile</code></td><td><code>PUT /api/auth/profile</code></td></tr>
        <tr><td><code>changePassword</code></td><td><code>PUT /api/auth/change-password</code></td></tr>
        <tr><td><code>uploadAvatar</code></td><td><code>PUT /api/teachers/me/avatar</code></td></tr>
        <tr><td><code>removeAvatar</code></td><td><code>DELETE /api/teachers/me/avatar</code></td></tr>
    </tbody>
</table>

### 4.2 Admin

<table>
    <thead>
        <tr>
            <th>Service function</th>
            <th>Method + API path</th>
        </tr>
    </thead>
    <tbody>
        <tr><td><code>getAllTeachers()</code></td><td><code>GET /api/admin/teachers</code></td></tr>
        <tr><td><code>getTeachersBySchool(school)</code></td><td><code>GET /api/admin/schools/:school/teachers</code></td></tr>
        <tr><td><code>addTeacher(payload)</code></td><td><code>POST /api/admin/teachers</code></td></tr>
        <tr><td><code>removeTeacherFromSchool(teacherId)</code></td><td><code>PATCH /api/admin/teachers/:id/remove-school</code></td></tr>
        <tr><td><code>assignSubjects(teacherId, ids)</code></td><td><code>PUT /api/admin/teachers/:id/subjects</code></td></tr>
        <tr><td><code>getCredentials(teacherId)</code></td><td><code>GET /api/admin/teachers/:id/credentials</code></td></tr>
        <tr><td><code>deleteTeacher(teacherId)</code></td><td><code>DELETE /api/admin/teachers/:id</code></td></tr>
        <tr><td><code>getAllSubjects()</code></td><td><code>GET /api/admin/subjects</code></td></tr>
        <tr><td><code>getSubjectQuestions(subjectId)</code></td><td><code>GET /api/admin/subjects/:id/questions</code></td></tr>
    </tbody>
</table>

### 4.3 Teacher domain

<table>
    <thead>
        <tr>
            <th>Service file</th>
            <th>Primary endpoints</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>subjectService</code></td>
            <td><code>GET/POST/DELETE /api/subjects</code>, <code>GET /api/subjects/:id/quiz-history</code></td>
        </tr>
        <tr>
            <td><code>unitService</code></td>
            <td><code>GET/POST /api/subjects/:id/units</code>, <code>PUT/DELETE /api/units/:id</code>, <code>GET /api/units/:id/questions</code></td>
        </tr>
        <tr>
            <td><code>questionService</code></td>
            <td><code>GET/POST /api/questions</code>, <code>POST /api/questions/bulk-import</code>, <code>PUT/DELETE /api/questions/:id</code></td>
        </tr>
        <tr>
            <td><code>quizService</code></td>
            <td><code>GET /api/quizzes</code>, <code>GET /api/quizzes/:id</code>, <code>POST /api/quizzes/manual</code>, <code>POST /api/quizzes/auto-generate</code>, <code>PUT /api/quizzes/:id</code>, <code>PUT /api/quizzes/:id/status</code>, <code>POST /api/quizzes/:id/duplicate</code>, <code>DELETE /api/quizzes/:id</code>, plus stats/preview/export/leaderboard routes</td>
        </tr>
        <tr>
            <td><code>responseService</code></td>
            <td><code>GET /api/quizzes/:id/responses</code></td>
        </tr>
        <tr>
            <td><code>sessionService</code></td>
            <td><code>POST /api/sessions/enter</code>, <code>GET /api/sessions/timing</code>, <code>POST /api/sessions/progress</code>, <code>POST /api/sessions/submit</code></td>
        </tr>
        <tr>
            <td><code>violationService</code></td>
            <td><code>POST /api/violations</code>, <code>GET /api/violations?session_id=...</code></td>
        </tr>
    </tbody>
</table>

## 5. Backend Routing and Access

### 5.1 Global endpoints

- `GET /api/health`
- `GET /` (API running check)

### 5.2 Auth routes (`/api/auth`)

<table>
    <thead>
        <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Access</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>POST</td><td><code>/register</code></td><td>Public</td></tr>
        <tr><td>POST</td><td><code>/login</code></td><td>Public</td></tr>
        <tr><td>POST</td><td><code>/logout</code></td><td>Teacher/Admin</td></tr>
        <tr><td>GET</td><td><code>/me</code></td><td>Teacher/Admin</td></tr>
        <tr><td>PUT</td><td><code>/profile</code></td><td>Teacher</td></tr>
        <tr><td>PUT</td><td><code>/change-password</code></td><td>Teacher</td></tr>
    </tbody>
</table>

### 5.3 Admin routes (`/api/admin`) — all `admin` only

<table>
    <thead>
        <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Controller</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>GET</td><td><code>/teachers</code></td><td><code>getAllTeachers</code></td></tr>
        <tr><td>GET</td><td><code>/schools/:school/teachers</code></td><td><code>getTeachersBySchool</code></td></tr>
        <tr><td>POST</td><td><code>/teachers</code></td><td><code>addTeacher</code></td></tr>
        <tr><td>PATCH</td><td><code>/teachers/:id/remove-school</code></td><td><code>removeTeacherFromSchool</code></td></tr>
        <tr><td>PUT</td><td><code>/teachers/:id/subjects</code></td><td><code>assignSubjects</code></td></tr>
        <tr><td>GET</td><td><code>/teachers/:id/credentials</code></td><td><code>getTeacherCredentials</code></td></tr>
        <tr><td>DELETE</td><td><code>/teachers/:id</code></td><td><code>deleteTeacher</code></td></tr>
        <tr><td>GET</td><td><code>/subjects</code></td><td><code>getAllSubjectsForAdmin</code></td></tr>
        <tr><td>GET</td><td><code>/subjects/:id/questions</code></td><td><code>getSubjectQuestionsForAdmin</code></td></tr>
    </tbody>
</table>

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

### 5.5 Question routes (`/api/questions`) — teacher/admin

- `GET /`
- `POST /`
- `POST /bulk-import`
- `PUT /:id`
- `DELETE /:id`

### 5.6 Quiz routes (`/api/quizzes`) — teacher/admin

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
    - `GET /timing`
    - `POST /progress` (session token header)
    - `POST /submit` (session token header)

- Prefix: `/api/violations`
    - `POST /` (public with session token)
    - `GET /` teacher only

### 5.8 Teacher profile/avatar routes (`/api/teachers`)

<table>
    <thead>
        <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Access</th>
        </tr>
    </thead>
    <tbody>
        <tr><td>GET</td><td><code>/me/avatar</code></td><td>Teacher</td></tr>
        <tr><td>PUT</td><td><code>/me/avatar</code></td><td>Teacher</td></tr>
        <tr><td>DELETE</td><td><code>/me/avatar</code></td><td>Teacher</td></tr>
        <tr><td>GET</td><td><code>/:id/avatar</code></td><td>Teacher/Admin (teacher can only fetch own avatar; admin can fetch any)</td></tr>
    </tbody>
</table>

## 6. Auth & Role Model

- JWT payload includes role (`teacher` or `admin`).
- `teacher` accounts come from DB table `teachers`.
- `admin` login is validated against env values in `auth.controller.js`:
    - `ADMIN_EMAIL`
    - `ADMIN_PASSWORD_HASH`
    - `ADMIN_NAME`
- Frontend route protection uses `ProtectedRoute` with role checks.
- Backend role checks use `authenticate` + `authorize(...roles)`.
- Student runtime APIs use `X-Session-Token` (progress, submit, and violation reporting).

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
2. Admin pages live under `/admin` (`/admin`, `/admin/teachers`, `/admin/schools/:school`).
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
- `npm run start --prefix server`
- `npm run test --prefix server`
- `npm run create-admin --prefix server`
- `npm run migrate-plan1 --prefix server`
- `npm run migrate-plan14-avatar --prefix server`
- `node server/scripts/migrate_scheduled_status.js` (manual migration script)

### 9.3 Important env vars

Server (`server/.env` / `.env.example`):

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_NAME`
- `CLIENT_URLS` (or `CLIENT_URL` fallback)
- `NODE_ENV`

Client (`client/.env` / `.env.example`):

- `VITE_API_URL`

## 10. Notes

- Keep sections 3, 4, and 5 updated together whenever routes or access rules change.
- Keep section 9 in sync with root/server `package.json` scripts and `.env.example` files.
