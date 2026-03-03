## SECTION 1 — PROJECT STRUCTURE

### 1.1 Full folder/file tree (project files + source/config)

Printed tree excludes internals of `.git/`, `client/node_modules/`, `server/node_modules/`, `client/dist/` (these directories exist and contain dependency/build artifacts).

```text
.
|-- .gitignore
|-- LICENSE
|-- README.md
|-- client
|   |-- .env
|   |-- .env.example
|   |-- components.json
|   |-- index.html
|   |-- jsconfig.json
|   |-- package-lock.json
|   |-- package.json
|   |-- postcss.config.js
|   |-- public
|   |   `-- _redirects
|   |-- src
|   |   |-- App.jsx
|   |   |-- components
|   |   |   |-- layout
|   |   |   |   |-- ProfileFooter.jsx
|   |   |   |   |-- TeacherShell.jsx
|   |   |   |   |-- TeacherSidebar.jsx
|   |   |   |   `-- TeacherTopBar.jsx
|   |   |   |-- quiz
|   |   |   |   |-- CountdownTimer.jsx
|   |   |   |   `-- MathEquationInput.jsx
|   |   |   |-- shared
|   |   |   |   |-- BackendWarmupGate.jsx
|   |   |   |   |-- LoadingScreen.jsx
|   |   |   |   `-- ProtectedRoute.jsx
|   |   |   |-- teacher
|   |   |   |   |-- FlagBadge.jsx
|   |   |   |   |-- GenerateModeModal.jsx
|   |   |   |   |-- ParticipantsTrendChart.jsx
|   |   |   |   |-- QuestionBuilder.jsx
|   |   |   |   |-- QuestionPreviewList.jsx
|   |   |   |   |-- QuizListCard.jsx
|   |   |   |   |-- ResponseTable.jsx
|   |   |   |   `-- UnitQuestionsList.jsx
|   |   |   `-- ui
|   |   |       |-- accordion.jsx
|   |   |       |-- alert-dialog.jsx
|   |   |       |-- avatar.jsx
|   |   |       |-- badge.jsx
|   |   |       |-- button.jsx
|   |   |       |-- card.jsx
|   |   |       |-- checkbox.jsx
|   |   |       |-- date-time-picker.jsx
|   |   |       |-- dialog.jsx
|   |   |       |-- dropdown-menu.jsx
|   |   |       |-- form.jsx
|   |   |       |-- input.jsx
|   |   |       |-- label.jsx
|   |   |       |-- pagination.jsx
|   |   |       |-- popover.jsx
|   |   |       |-- progress.jsx
|   |   |       |-- radio-group.jsx
|   |   |       |-- scroll-area.jsx
|   |   |       |-- select.jsx
|   |   |       |-- separator.jsx
|   |   |       |-- switch.jsx
|   |   |       |-- table.jsx
|   |   |       |-- tabs.jsx
|   |   |       |-- textarea.jsx
|   |   |       `-- toaster.jsx
|   |   |-- context
|   |   |   `-- AuthContext.jsx
|   |   |-- hooks
|   |   |   |-- useAuth.js
|   |   |   |-- useProctoring.js
|   |   |   |-- useTimer.js
|   |   |   `-- useToast.js
|   |   |-- index.css
|   |   |-- lib
|   |   |   |-- apiBaseUrl.js
|   |   |   |-- applyThemeVariables.js
|   |   |   `-- utils.js
|   |   |-- main.jsx
|   |   |-- pages
|   |   |   |-- auth
|   |   |   |   |-- LoginPage.jsx
|   |   |   |   `-- RegisterPage.jsx
|   |   |   |-- student
|   |   |   |   |-- EntryPage.jsx
|   |   |   |   `-- QuizPage.jsx
|   |   |   `-- teacher
|   |   |       |-- AutoGeneratePage.jsx
|   |   |       |-- DashboardPage.jsx
|   |   |       |-- ManualQuizPage.jsx
|   |   |       |-- OngoingQuizListPage.jsx
|   |   |       |-- OngoingQuizPage.jsx
|   |   |       |-- ProfilePage.jsx
|   |   |       |-- QuestionBankPage.jsx
|   |   |       |-- QuizLibraryPage.jsx
|   |   |       |-- QuizResponsePage.jsx
|   |   |       `-- ScheduledQuizListPage.jsx
|   |   |-- services
|   |   |   |-- api.js
|   |   |   |-- authService.js
|   |   |   |-- questionService.js
|   |   |   |-- quizService.js
|   |   |   |-- responseService.js
|   |   |   |-- sessionService.js
|   |   |   |-- subjectService.js
|   |   |   |-- unitService.js
|   |   |   `-- violationService.js
|   |   |-- theme.js
|   |   `-- utils
|   |       |-- excelParser.js
|   |       |-- formatTime.js
|   |       `-- sessionKeys.js
|   |-- tailwind.config.js
|   |-- vercel.json
|   `-- vite.config.js
|-- package-lock.json
|-- package.json
|-- public
|   |-- dashboard-page.png
|   |-- loading-screen.png
|   |-- manual-quiz-page.png
|   `-- teacher-login-page.png
|-- server
|   |-- .env
|   |-- .env.example
|   |-- app.js
|   |-- config
|   |   |-- db.js
|   |   `-- jwt.js
|   |-- controllers
|   |   |-- auth.controller.js
|   |   |-- questions.controller.js
|   |   |-- quizzes.controller.js
|   |   |-- responses.controller.js
|   |   |-- sessions.controller.js
|   |   |-- subjects.controller.js
|   |   |-- units.controller.js
|   |   `-- violations.controller.js
|   |-- index.js
|   |-- middleware
|   |   |-- authenticate.js
|   |   |-- authorize.js
|   |   |-- errorHandler.js
|   |   `-- validate.js
|   |-- package-lock.json
|   |-- package.json
|   |-- routes
|   |   |-- auth.routes.js
|   |   |-- questions.routes.js
|   |   |-- quizzes.routes.js
|   |   |-- sessions.routes.js
|   |   |-- subjects.routes.js
|   |   |-- units.routes.js
|   |   `-- violations.routes.js
|   |-- scripts
|   |   `-- migrate_scheduled_status.js
|   |-- services
|   |   |-- quizLifecycle.service.js
|   |   |-- quizScheduler.service.js
|   |   |-- quizTiming.service.js
|   |   |-- scorer.service.js
|   |   `-- sessionLifecycle.service.js
|   |-- sql
|   |   `-- schema.sql
|   `-- tests
|       `-- quiz-timing.test.js
`-- structure.md
```

### 1.2 Entry points

- Frontend entry: `client/src/main.jsx` (applies theme variables and wraps app with warmup gate + providers)
- Frontend routing root: `client/src/App.jsx` (lazy route loading, suspense loader, and route-level error boundary)
- Backend entry: `server/index.js:5`
- Backend app composition: `server/app.js:18`

### 1.3 Shared/common code between frontend and backend

- No shared runtime module/package between client and server.
- Shared concepts only, duplicated separately:
  - Excel tooling (`xlsx` used client-side in `client/src/utils/excelParser.js:1`, and server dependency in `server/package.json:20`)
  - Quiz timing concepts (frontend timer math in `client/src/pages/student/QuizPage.jsx`, backend authoritative timing in `server/services/quizTiming.service.js`)

### 1.4 Folder/file responsibilities (concise, file-by-file)

<table>
  <thead>
    <tr>
      <th>Path</th>
      <th>Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`package.json`</td>
      <td>Root workspace scripts (`dev`, `build`, `start`, `install:all`) via `concurrently`.</td>
    </tr>
    <tr>
      <td>`README.md`</td>
      <td>Setup and endpoint overview.</td>
    </tr>
    <tr>
      <td><code>`client/src/main.jsx`</code></td>
      <td>React bootstrapping, theme variable injection, warmup gate, QueryClientProvider, AuthProvider, BrowserRouter.</td>
    </tr>
    <tr>
      <td>`client/src/App.jsx`</td>
      <td>Frontend route definitions with lazy loading, suspense fallback, and error boundary wrapper.</td>
    </tr>
    <tr>
      <td><code>`client/src/context/AuthContext.jsx`</code></td>
      <td>Auth state machine (`useReducer`), token hydrate/login/logout/setUser.</td>
    </tr>
    <tr>
      <td><code>`client/src/hooks/useAuth.js`</code></td>
      <td>Auth context accessor with provider guard.</td>
    </tr>
    <tr>
      <td><code>`client/src/hooks/useToast.js`</code></td>
      <td>In-memory toast bus (`pushToast`, `useToast`).</td>
    </tr>
    <tr>
      <td><code>`client/src/hooks/useProctoring.js`</code></td>
      <td>Proctoring event listeners, violation API reporting with rate-limit.</td>
    </tr>
    <tr>
      <td><code>`client/src/hooks/useTimer.js`</code></td>
      <td>Generic countdown hook.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/api.js`</code></td>
      <td>Axios instance, auth header injection, global error toast interceptor.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/authService.js`</code></td>
      <td>`/auth/*` API wrappers.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/subjectService.js`</code></td>
      <td>`/subjects/*` API wrappers.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/unitService.js`</code></td>
      <td><code>`/subjects/:id/units`</code>, `/units/:id*` wrappers.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/questionService.js`</code></td>
      <td>`/questions*` wrappers.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/quizService.js`</code></td>
      <td>`/quizzes*` wrappers (CRUD, preview, stats, export, leaderboard).</td>
    </tr>
    <tr>
      <td><code>`client/src/services/responseService.js`</code></td>
      <td>Quiz responses wrapper.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/sessionService.js`</code></td>
      <td>Student session enter/progress/submit wrappers.</td>
    </tr>
    <tr>
      <td><code>`client/src/services/violationService.js`</code></td>
      <td>Violation create/list wrappers.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/auth/LoginPage.jsx`</code></td>
      <td>Teacher login form.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/auth/RegisterPage.jsx`</code></td>
      <td>Dormant registration page code (not currently routed in frontend).</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/student/EntryPage.jsx`</code></td>
      <td>Student entry form + session bootstrap.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/student/QuizPage.jsx`</code></td>
      <td>Student quiz taking page (timer, autosave, submit, proctoring).</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/DashboardPage.jsx`</code></td>
      <td>Teacher analytics dashboard, KPI cards, subject creation.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/ProfilePage.jsx`</code></td>
      <td>Profile update + password change.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/QuestionBankPage.jsx`</code></td>
      <td>Unit/question management, import, history tabs.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/ManualQuizPage.jsx`</code></td>
      <td>Manual quiz builder/editor/scheduler/preview/import.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/AutoGeneratePage.jsx`</code></td>
      <td>Unit-wise random auto-generation config.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/QuizLibraryPage.jsx`</code></td>
      <td>Library listing/filter/pagination/duplicate/delete/navigation.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/ScheduledQuizListPage.jsx`</code></td>
      <td>Scheduled quiz monitor and link copy.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/OngoingQuizListPage.jsx`</code></td>
      <td>Active quiz list and navigation to live view.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/OngoingQuizPage.jsx`</code></td>
      <td>Live monitoring, stop quiz, responses table, session details, export.</td>
    </tr>
    <tr>
      <td><code>`client/src/pages/teacher/QuizResponsePage.jsx`</code></td>
      <td>Post-quiz responses, leaderboard, session details, export, quiz detail dialog.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/shared/BackendWarmupGate.jsx`</code></td>
      <td>Startup gate that polls backend `/health` and blocks app until backend is reachable.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/shared/LoadingScreen.jsx`</code></td>
      <td>Startup loading UI used while backend warmup gate is waiting.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/shared/ProtectedRoute.jsx`</code></td>
      <td>Route guard for authenticated teacher role.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/layout/TeacherShell.jsx`</code></td>
      <td>Teacher layout wrapper + responsive sidebar + top bar + generate-mode modal host.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/layout/TeacherTopBar.jsx`</code></td>
      <td>Teacher header with route-aware breadcrumbs, mobile menu toggle, and back navigation.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/layout/TeacherSidebar.jsx`</code></td>
      <td>Teacher nav and subject list.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/layout/ProfileFooter.jsx`</code></td>
      <td>Footer profile card + logout action.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/QuestionBuilder.jsx`</code></td>
      <td>Question form editor widget.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/QuestionPreviewList.jsx`</code></td>
      <td>Imported question preview/edit/unit assignment list.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/UnitQuestionsList.jsx`</code></td>
      <td>Table of questions with edit/delete dialogs.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/ResponseTable.jsx`</code></td>
      <td>Student session rows + violation badges + details trigger.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/QuizListCard.jsx`</code></td>
      <td>Quiz card with actions menu.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/FlagBadge.jsx`</code></td>
      <td>Violation type/count badge.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/GenerateModeModal.jsx`</code></td>
      <td>Modal to choose manual/auto generation paths.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/teacher/ParticipantsTrendChart.jsx`</code></td>
      <td>Recharts area chart used by dashboard participants trend card.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/quiz/CountdownTimer.jsx`</code></td>
      <td>Timer display + progress bar.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/quiz/MathEquationInput.jsx`</code></td>
      <td>Popover-based equation input assistant.</td>
    </tr>
    <tr>
      <td><code>`client/src/components/ui/*.jsx`</code></td>
      <td>Local UI primitives (dialogs, inputs, tabs, table, toaster, etc.).</td>
    </tr>
    <tr>
      <td><code>`client/src/utils/excelParser.js`</code></td>
      <td>Frontend XLSX parser/validator for question import.</td>
    </tr>
    <tr>
      <td><code>`client/src/utils/formatTime.js`</code></td>
      <td>`mm:ss` formatter.</td>
    </tr>
    <tr>
      <td><code>`client/src/utils/sessionKeys.js`</code></td>
      <td>Session storage key constants.</td>
    </tr>
    <tr>
      <td><code>`client/src/lib/apiBaseUrl.js`</code></td>
      <td>Central API + healthcheck URL derivation from `VITE_API_URL`.</td>
    </tr>
    <tr>
      <td><code>`client/src/lib/applyThemeVariables.js`</code></td>
      <td>Converts theme tokens to CSS variables and applies them to root/body at startup.</td>
    </tr>
    <tr>
      <td><code>`client/src/lib/utils.js`</code></td>
      <td>`cn` class merge helper.</td>
    </tr>
    <tr>
      <td><code>`client/src/theme.js`</code></td>
      <td>Design token source (color, radius, spacing, typography, shadow).</td>
    </tr>
    <tr>
      <td>`server/index.js`</td>
      <td>Server startup checks, runtime DB migrations/indexes, scheduler boot,`listen`.</td>
    </tr>
    <tr>
      <td>`server/app.js`</td>
      <td>Express app, CORS/json middleware, route mounting, SPA fallback, error handler.</td>
    </tr>
    <tr>
      <td><code>`server/config/db.js`</code></td>
      <td>PostgreSQL pool and `query()` helper.</td>
    </tr>
    <tr>
      <td><code>`server/config/jwt.js`</code></td>
      <td>JWT env config exports.</td>
    </tr>
    <tr>
      <td><code>`server/middleware/authenticate.js`</code></td>
      <td>JWT bearer validation + revoked-token check; assigns `req.user` and `req.token`.</td>
    </tr>
    <tr>
      <td><code>`server/middleware/authorize.js`</code></td>
      <td>Role check middleware.</td>
    </tr>
    <tr>
      <td><code>`server/middleware/validate.js`</code></td>
      <td>Zod body validation middleware (`req.validatedBody`).</td>
    </tr>
    <tr>
      <td><code>`server/middleware/errorHandler.js`</code></td>
      <td>Global error mapping (PG codes + generic).</td>
    </tr>
    <tr>
      <td><code>`server/routes/*.routes.js`</code></td>
      <td>HTTP method/path registration and middleware binding.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/auth.controller.js`</code></td>
      <td>Register/login/logout/me/profile/password logic + schemas.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/subjects.controller.js`</code></td>
      <td>Subject CRUD/list + quiz history by subject.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/units.controller.js`</code></td>
      <td>Unit CRUD/list + unit questions list.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/questions.controller.js`</code></td>
      <td>Question CRUD/list + bulk import.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/quizzes.controller.js`</code></td>
      <td>Quiz list/create/update/status/live/preview/export/duplicate/leaderboard.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/responses.controller.js`</code></td>
      <td>Quiz response listing with violation aggregates.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/sessions.controller.js`</code></td>
      <td>Student enter/progress/submit and scoring orchestration.</td>
    </tr>
    <tr>
      <td><code>`server/controllers/violations.controller.js`</code></td>
      <td>Violation create/list-by-session.</td>
    </tr>
    <tr>
      <td><code>`server/services/quizTiming.service.js`</code></td>
      <td>IST-aware schedule parsing/window resolution.</td>
    </tr>
    <tr>
      <td><code>`server/services/scorer.service.js`</code></td>
      <td>Answer scoring engine.</td>
    </tr>
    <tr>
      <td><code>`server/services/sessionLifecycle.service.js`</code></td>
      <td>Replace/finalize answers and pending-session auto-finalization.</td>
    </tr>
    <tr>
      <td><code>`server/services/quizLifecycle.service.js`</code></td>
      <td>Status transition rules and side effects.</td>
    </tr>
    <tr>
      <td><code>`server/services/quizScheduler.service.js`</code></td>
      <td>Polling scheduler for scheduled->active and active->ended transitions.</td>
    </tr>
    <tr>
      <td><code>`server/sql/schema.sql`</code></td>
      <td>Full PostgreSQL schema and indexes.</td>
    </tr>
    <tr>
      <td><code>`server/scripts/migrate_scheduled_status.js`</code></td>
      <td>One-off migration script for status constraint update.</td>
    </tr>
    <tr>
      <td><code>`server/tests/quiz-timing.test.js`</code></td>
      <td>Node tests for timing logic.</td>
    </tr>
  </tbody>
</table>


---

## SECTION 2 — ALL FRONTEND ROUTES

<table>
  <thead>
    <tr>
      <th>Route</th>
      <th>Component</th>
      <th>File</th>
      <th>Protected</th>
      <th>Data fetched on load</th>
      <th>APIs called from page</th>
      <th>User actions and effects</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`login`</td>
      <td>`LoginPage`</td>
      <td><code>`client/src/pages/auth/LoginPage.jsx`</code></td>
      <td>No</td>
      <td>None</td>
      <td>`authService.login` (<code>`client/src/pages/auth/LoginPage.jsx:36`</code>)</td>
      <td>Submit form (`onSubmit`): POST login, call `login()` from auth context, navigate `/teacher` (`:38`); on error set `serverError` (`:40-41`).</td>
    </tr>
    <tr>
      <td><code>`/quiz/enter/:accessToken`</code></td>
      <td>`EntryPage`</td>
      <td><code>`client/src/pages/student/EntryPage.jsx`</code></td>
      <td>No</td>
      <td>None</td>
      <td>`sessionService.enter` via mutation (`:41-43`)</td>
      <td>Submit form: POST enter with URL `accessToken` + fields (`:49-52`), store session token/payload in `sessionStorage` (`:68-69`), navigate `/quiz/take` with state (`:71-74`); error -> `serverError`.</td>
    </tr>
    <tr>
      <td>`/quiz/take`</td>
      <td>`QuizPage`</td>
      <td><code>`client/src/pages/student/QuizPage.jsx`</code></td>
      <td>No</td>
      <td>Uses route state/sessionStorage payload (`:88-95`)</td>
      <td>`sessionService.submit` (`:179-182`), `sessionService.saveProgress` (`:184-187`), `violationService.report` through `useProctoring` (<code>`client/src/hooks/useProctoring.js:26`</code>)</td>
      <td>Select option updates `answers`; autosave after 600ms; explicit Submit button and timer-end auto-submit both call submit flow; submitted state shows score/percentage/correct-attempted breakdown card; proctoring events (tab blur/copy/contextmenu/etc.) silently report violations.</td>
    </tr>
    <tr>
      <td>`/teacher`</td>
      <td>`DashboardPage`</td>
      <td><code>`client/src/pages/teacher/DashboardPage.jsx`</code></td>
      <td>Yes (`ProtectedRoute requiredRole="teacher"` in <code>`client/src/App.jsx:29`</code>)</td>
      <td>`subjectsQuery`, `liveQuizStatusQuery`, `analyticsQuery` (`DashboardPage.jsx:224-261`)</td>
      <td>`subjectService.list`, `quizService.list`, `responseService.getQuizResponses`, `subjectService.create`</td>
      <td>KPI cards navigate scheduled/ongoing pages (`:560`, `:569`); date filter + `Load Data` validates and updates chart range (`:522-545`, `:691`); create subject dialog submit (`:547-550`, `:861`) -> POST subject.</td>
    </tr>
    <tr>
      <td>`/teacher/profile`</td>
      <td>`ProfilePage`</td>
      <td><code>`client/src/pages/teacher/ProfilePage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery`</td>
      <td>`subjectService.list`, `authService.updateProfile`, `authService.changePassword`, `subjectService.remove`</td>
      <td>Save profile, change password, and delete subject from Subject Management card (with confirm dialog).</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>`QuestionBankPage`</td>
      <td><code>`client/src/pages/teacher/QuestionBankPage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery`, `unitsQuery`, conditional `historyQuery`, `UnitSection` question queries</td>
      <td>`subjectService.list`, `unitService.listBySubject`, `subjectService.getQuizHistory`, `unitService.create`, `unitService.update`, `unitService.delete`, `questionService.create`, `questionService.bulkImport`, `questionService.listBySubject`, `unitService.getQuestions`, `questionService.remove`, `questionService.update`</td>
      <td>Supports add/rename/delete unit, add/import/edit/delete question, and history tab viewing.</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual`</code></td>
      <td>`ManualQuizPage`</td>
      <td><code>`client/src/pages/teacher/ManualQuizPage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery`, `unitsQuery`</td>
      <td>`subjectService.list`, `unitService.listBySubject`, `subjectService.create`, `quizService.createManual`, `quizService.update`</td>
      <td>Save draft / schedule, import/reorder questions, and on activation open share-link dialog before navigating to scheduled/ongoing view.</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual/:quizId`</code></td>
      <td>`ManualQuizPage`</td>
      <td><code>`client/src/pages/teacher/ManualQuizPage.jsx`</code></td>
      <td>Yes</td>
      <td>Same as above +`quizDetailQuery` (`:268`) and preview query when dialog opens (`:274`)</td>
      <td>plus `quizService.getById`, `quizService.getPreview`</td>
      <td>Existing quiz mode disables question text editing (`:686-689`, `QuestionBuilder disabled` via `:774`), allows reorder and metadata/status updates.</td>
    </tr>
    <tr>
      <td>`/teacher/quiz/auto`</td>
      <td>`AutoGeneratePage`</td>
      <td><code>`client/src/pages/teacher/AutoGeneratePage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery` (`:88`), `unitsQuery` (`:93`)</td>
      <td>`subjectService.list`, `unitService.listBySubject`, `subjectService.create`, `quizService.autoGenerate`</td>
      <td>Unit counts entry and validations (`:146-183`), Generate/Schedule button (`:338-345`) runs `generateQuiz` (`:163-208`), create subject dialog submits (`:359-362`).</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/library`</code></td>
      <td>`QuizLibraryPage`</td>
      <td><code>`client/src/pages/teacher/QuizLibraryPage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery` (`:56`), `quizzesQuery` (`:61`) fetches all pages (`fetchAllQuizzes` `:30-43`)</td>
      <td>`subjectService.list`, `quizService.list`, `quizService.duplicate`, `quizService.delete`</td>
      <td>Search/filter updates local state (`:128-136`), card actions: view responses navigate (`:209`), edit navigate (`:210`), duplicate mutate (`:211`), delete open dialog + confirm DELETE (`:223-239`).</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/scheduled`</code></td>
      <td>`ScheduledQuizListPage`</td>
      <td><code>`client/src/pages/teacher/ScheduledQuizListPage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery`, `scheduledQuery`, `ongoingQuery` (`:39-56`)</td>
      <td>`subjectService.list`, `quizService.list` twice</td>
      <td>Copy Link button uses `navigator.clipboard` (`:62-86`, `:174`) no API; View/Edit navigates to manual page (`:183`).</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing`</code></td>
      <td>`OngoingQuizListPage`</td>
      <td><code>`client/src/pages/teacher/OngoingQuizListPage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery` (`:16`), `ongoingQuery` (`:21`)</td>
      <td>`subjectService.list`, `quizService.list`</td>
      <td>Open Live View button navigates to <code>`/teacher/quiz/ongoing/:quizId`</code> (`:63`).</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing/:quizId`</code></td>
      <td>`OngoingQuizPage`</td>
      <td><code>`client/src/pages/teacher/OngoingQuizPage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery`, `liveStatsQuery`, `responsesQuery`, `detailsQuery` (`:93-116`)</td>
      <td>`subjectService.list`, `quizService.getLiveStats`, `responseService.getQuizResponses`, `violationService.getBySession`, `quizService.updateStatus`, `quizService.delete`, `quizService.exportResults`</td>
      <td>Stop Responses dialog confirm -> PUT status ended (`:118-129`, `:385`); auto-stop on elapsed timer (`:198-215`); delete dialog confirm -> DELETE quiz (`:131-146`, `:405`); export results (`:237-256`); details button in table opens session dialog and fetches violations/breakdown (`:356-361`).</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/:quizId/responses`</code></td>
      <td>`QuizResponsePage`</td>
      <td><code>`client/src/pages/teacher/QuizResponsePage.jsx`</code></td>
      <td>Yes</td>
      <td>`subjectsQuery`, `responsesQuery`, `leaderboardQuery`, `detailsQuery`, conditional `quizDetailsQuery` (`:89-117`)</td>
      <td>`subjectService.list`, `responseService.getQuizResponses`, `quizService.getLeaderboard`, `violationService.getBySession`, `quizService.getById`, `quizService.exportResults`</td>
      <td>Tabs switch responses/leaderboard (`:182-186`); details button opens session dialog (`:191-194`); quiz details button opens dialog and triggers query (`:167`); export button downloads xlsx (`:125-144`).</td>
    </tr>
    <tr>
      <td>`*`</td>
      <td>Redirect</td>
      <td><code>`client/src/App.jsx:45`</code></td>
      <td>N/A</td>
      <td>None</td>
      <td>None</td>
      <td>Any unknown path navigates to `/login`.</td>
    </tr>
  </tbody>
</table>


Additional auth-related route behavior:

- `ProtectedRoute` checks `isLoading`, `isAuthenticated`, and `user.role` (`client/src/components/shared/ProtectedRoute.jsx:7-23`).
- Auth hydration on app startup calls `authService.me` if `quiz_token` exists (`client/src/context/AuthContext.jsx:63-79`).
- Logout from sidebar triggers `AuthContext.logout()`, which calls backend `/auth/logout` (best-effort) and then clears local auth state.
- No public signup route is exposed in current frontend; teacher signup is intentionally hidden from UI.
- Route pages are lazy-loaded under `Suspense`, with an in-app `ErrorBoundary` around the routing tree.

---

## SECTION 3 — ALL API CALLS FROM FRONTEND

### 3.1 Global request/response behavior for all Axios calls

- Base URL resolved via `API_BASE_URL` (`client/src/lib/apiBaseUrl.js`) from `VITE_API_URL`, normalized to append `/api` when missing.
- Default headers: `Authorization: Bearer <quiz_token>` if localStorage has `quiz_token` (`client/src/services/api.js:16-21`).
- Global response error handling: toast unless `config.skipErrorToast` (`client/src/services/api.js:26-37`).
- Session-specific headers for student session APIs:
  - `X-Session-Token` for `submit`, `saveProgress`, `report violation` (`sessionService.js:10-13`, `sessionService.js:20-23`, `violationService.js:6-8`).

### 3.2 API calls (function-by-function)

<table>
  <thead>
    <tr>
      <th>Frontend function</th>
      <th>File</th>
      <th>HTTP + path</th>
      <th>Headers</th>
      <th>Payload / params</th>
      <th>Trigger</th>
      <th>Response handling</th>
      <th>Error handling</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`authService.register(payload)`</td>
      <td><code>`client/src/services/authService.js:4`</code></td>
      <td><code>`POST /auth/register`</code></td>
      <td>Axios defaults (auth header usually absent here)</td>
      <td>`{ name, email, password }`</td>
      <td>No active route call site (kept for future admin-driven signup flow)</td>
      <td>N/A in current UI</td>
      <td>N/A in current UI</td>
    </tr>
    <tr>
      <td>`authService.login(payload)`</td>
      <td><code>`client/src/services/authService.js:9`</code></td>
      <td>`POST /auth/login`</td>
      <td>Defaults</td>
      <td>`{ email, password }`</td>
      <td>`LoginPage` submit (`LoginPage.jsx:32-38`)</td>
      <td>stores token/user via `login()` and redirects `/teacher`</td>
      <td>page `serverError` + global toast</td>
    </tr>
    <tr>
      <td>`authService.logout()`</td>
      <td><code>`client/src/services/authService.js:14`</code></td>
      <td>`POST /auth/logout`</td>
      <td>Bearer token</td>
      <td>none</td>
      <td>Sidebar logout through `AuthContext.logout()`</td>
      <td>backend token revocation (best effort), then local auth reset</td>
      <td>backend failure ignored; local logout still completes</td>
    </tr>
    <tr>
      <td>`authService.me()`</td>
      <td><code>`client/src/services/authService.js:21`</code></td>
      <td>`GET /auth/me`</td>
      <td>Bearer token from localStorage</td>
      <td>none</td>
      <td>Auth hydration on app load (`AuthContext.jsx:63-79`)</td>
      <td>sets hydrated auth state</td>
      <td>on fail removes token and logs out state (`AuthContext.jsx:80-84`)</td>
    </tr>
    <tr>
      <td>`authService.updateProfile(payload)`</td>
      <td><code>`client/src/services/authService.js:26`</code></td>
      <td>`PUT /auth/profile`</td>
      <td>Bearer token</td>
      <td>`{ name, avatar_url }`</td>
      <td>Profile Save button (`ProfilePage.jsx`)</td>
      <td>updates auth user via `setUser(data.user)`</td>
      <td>mutation error surfaces toast via interceptor</td>
    </tr>
    <tr>
      <td>`authService.changePassword(payload)`</td>
      <td><code>`client/src/services/authService.js:31`</code></td>
      <td><code>`PUT /auth/change-password`</code></td>
      <td>Bearer token</td>
      <td>`{ current_password, new_password, confirm_new_password }`</td>
      <td>Profile password save (`ProfilePage.jsx`)</td>
      <td>clears password fields on success</td>
      <td>mutation error toast via interceptor</td>
    </tr>
    <tr>
      <td>`subjectService.list()`</td>
      <td><code>`client/src/services/subjectService.js:4`</code></td>
      <td>`GET /subjects`</td>
      <td>Bearer token</td>
      <td>none</td>
      <td>Many page loads (`DashboardPage.jsx:226`, `ProfilePage.jsx:29`, `ManualQuizPage.jsx:256`, etc.)</td>
      <td>sets react-query data for sidebar/selects</td>
      <td>react-query error states + interceptor toast</td>
    </tr>
    <tr>
      <td>`subjectService.create(payload)`</td>
      <td><code>`client/src/services/subjectService.js:9`</code></td>
      <td>`POST /subjects`</td>
      <td>Bearer token</td>
      <td>`{ name }`</td>
      <td>Dashboard, Manual, Auto subject dialogs (`DashboardPage.jsx:549`, `ManualQuizPage.jsx:803`, `AutoGeneratePage.jsx:361`)</td>
      <td>invalidates `["subjects"]`, closes dialog, sets selected subject depending on page</td>
      <td>mutation error UI text + interceptor toast</td>
    </tr>
    <tr>
      <td>`subjectService.remove(id)`</td>
      <td><code>`client/src/services/subjectService.js:14`</code></td>
      <td><code>`DELETE /subjects/:id`</code></td>
      <td>Bearer token</td>
      <td>URL param `id`</td>
      <td>Profile page Subject Management delete action</td>
      <td>invalidates subjects, closes confirm dialog, success toast</td>
      <td>`409` if quizzes still reference subject; otherwise interceptor toast on errors</td>
    </tr>
    <tr>
      <td>`subjectService.getQuizHistory(id)`</td>
      <td><code>`client/src/services/subjectService.js:19`</code></td>
      <td><code>`GET /subjects/:id/quiz-history`</code></td>
      <td>Bearer token</td>
      <td>URL param `id`</td>
      <td>QuestionBank history tab query (`QuestionBankPage.jsx:137-141`)</td>
      <td>renders quiz history accordion</td>
      <td>error text in tab + interceptor toast</td>
    </tr>
    <tr>
      <td>`unitService.listBySubject(subjectId)`</td>
      <td><code>`client/src/services/unitService.js:4`</code></td>
      <td><code>`GET /subjects/:subjectId/units`</code></td>
      <td>Bearer token</td>
      <td>URL param `subjectId`</td>
      <td>Manual/Auto/QuestionBank load (`ManualQuizPage.jsx:263`, `AutoGeneratePage.jsx:96`, `QuestionBankPage.jsx:134`)</td>
      <td>fills unit lists</td>
      <td>query error UI + interceptor toast</td>
    </tr>
    <tr>
      <td>`unitService.create(subjectId,payload)`</td>
      <td><code>`client/src/services/unitService.js:9`</code></td>
      <td><code>`POST /subjects/:subjectId/units`</code></td>
      <td>Bearer token</td>
      <td>`{ name }`</td>
      <td>QuestionBank create unit (`QuestionBankPage.jsx:144`, `:482`)</td>
      <td>invalidates units/questions; toast success</td>
      <td>toast destructive on failure</td>
    </tr>
    <tr>
      <td>`unitService.update(unitId,payload)`</td>
      <td><code>`client/src/services/unitService.js:14`</code></td>
      <td>`PUT /units/:unitId`</td>
      <td>Bearer token</td>
      <td>expected `{ name }`</td>
      <td>QuestionBank Rename Unit dialog</td>
      <td>invalidates units list and closes dialog</td>
      <td>mutation error via interceptor</td>
    </tr>
    <tr>
      <td>`unitService.delete(unitId)`</td>
      <td><code>`client/src/services/unitService.js:19`</code></td>
      <td><code>`DELETE /units/:unitId`</code></td>
      <td>Bearer token</td>
      <td>URL param `unitId`</td>
      <td>QuestionBank delete unit confirm (`QuestionBankPage.jsx:154`, `:504-506`)</td>
      <td>invalidates units/questions; clears dialog</td>
      <td>mutation error via interceptor</td>
    </tr>
    <tr>
      <td>`unitService.getQuestions(unitId,params)`</td>
      <td><code>`client/src/services/unitService.js:24`</code></td>
      <td><code>`GET /units/:unitId/questions`</code></td>
      <td>Bearer token</td>
      <td>query `page`, `limit` if provided</td>
      <td>QuestionBank `UnitSection` for categorized units (`QuestionBankPage.jsx:528`)</td>
      <td>renders `UnitQuestionsList`</td>
      <td>query error toasts/interceptor</td>
    </tr>
    <tr>
      <td>`questionService.listBySubject(subjectId,params)`</td>
      <td><code>`client/src/services/questionService.js:4`</code></td>
      <td>`GET /questions`</td>
      <td>Bearer token</td>
      <td>query:`subject_id`, optional `unit_id`, `limit`, etc.</td>
      <td>QuestionBank `UnitSection` uncategorized (`QuestionBankPage.jsx:526`)</td>
      <td>renders list</td>
      <td>error via react-query + interceptor</td>
    </tr>
    <tr>
      <td>`questionService.create(payload)`</td>
      <td><code>`client/src/services/questionService.js:11`</code></td>
      <td>`POST /questions`</td>
      <td>Bearer token</td>
      <td>`{ subject_id, question_text, option_a,b,c,d, correct_option, points, has_equation, allow_multiple_answers, is_required, unit_id, in_subject_bank }`</td>
      <td>QuestionBank Add Question (`QuestionBankPage.jsx:163-200`)</td>
      <td>invalidates caches, closes dialog</td>
      <td>explicit destructive toast in `onError`</td>
    </tr>
    <tr>
      <td>`questionService.bulkImport(payload)`</td>
      <td><code>`client/src/services/questionService.js:16`</code></td>
      <td><code>`POST /questions/bulk-import`</code></td>
      <td>Bearer token</td>
      <td>`{ subject_id, questions:[...] }`</td>
      <td>QuestionBank save imported questions (`QuestionBankPage.jsx:252-255`)</td>
      <td>invalidates caches, clears import list</td>
      <td>destructive toast</td>
    </tr>
    <tr>
      <td>`questionService.remove(id)`</td>
      <td><code>`client/src/services/questionService.js:21`</code></td>
      <td><code>`DELETE /questions/:id`</code></td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>QuestionBank unit list delete (`QuestionBankPage.jsx:533`, `:560`)</td>
      <td>invalidates caches, toast success</td>
      <td>interceptor toast</td>
    </tr>
    <tr>
      <td>`questionService.update(id,payload)`</td>
      <td><code>`client/src/services/questionService.js:26`</code></td>
      <td>`PUT /questions/:id`</td>
      <td>Bearer token</td>
      <td>partial question fields from edit dialog</td>
      <td>QuestionBank edit question (`QuestionBankPage.jsx:542`, `:561`)</td>
      <td>invalidates caches, toast success</td>
      <td>interceptor toast</td>
    </tr>
    <tr>
      <td>`quizService.list(params)`</td>
      <td><code>`client/src/services/quizService.js:4`</code></td>
      <td>`GET /quizzes`</td>
      <td>Bearer token</td>
      <td>query varies:<code>`status/page/limit/search`</code></td>
      <td>Dashboard fetch-all loop (`DashboardPage.jsx:176`), Scheduled/Ongoing list pages, QuizLibrary fetch-all loop</td>
      <td>updates react-query data and analytics local derivations</td>
      <td>query error UI + interceptor toast</td>
    </tr>
    <tr>
      <td>`quizService.getById(id)`</td>
      <td><code>`client/src/services/quizService.js:9`</code></td>
      <td>`GET /quizzes/:id`</td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>Manual existing quiz load (`ManualQuizPage.jsx:271`), QuizResponse quiz detail dialog (`QuizResponsePage.jsx:116`)</td>
      <td>populates form/dialog read-only details</td>
      <td>query error text + toast</td>
    </tr>
    <tr>
      <td>`quizService.createManual(payload)`</td>
      <td><code>`client/src/services/quizService.js:14`</code></td>
      <td><code>`POST /quizzes/manual`</code></td>
      <td>Bearer token</td>
      <td>quiz metadata +`questions` array</td>
      <td>Manual page draft/activation for new quiz (`ManualQuizPage.jsx:325`, `:449`, `:492`)</td>
      <td>on success navigate and invalidate caches</td>
      <td>page-level `pageError` (using `extractApiError`) + toast interceptor</td>
    </tr>
    <tr>
      <td>`quizService.autoGenerate(payload)`</td>
      <td><code>`client/src/services/quizService.js:19`</code></td>
      <td><code>`POST /quizzes/auto-generate`</code></td>
      <td>Bearer token</td>
      <td>quiz metadata +`unit_selections:[{unit_id,count}]`</td>
      <td>AutoGenerate page generate button (`AutoGeneratePage.jsx:132`, `:191`)</td>
      <td>invalidate quizzes, toast, navigate manual edit page (`:142`)</td>
      <td>page `pageError`</td>
    </tr>
    <tr>
      <td>`quizService.update(id,payload)`</td>
      <td><code>`client/src/services/quizService.js:24`</code></td>
      <td>`PUT /quizzes/:id`</td>
      <td>Bearer token</td>
      <td>partial metadata, status, optional `question_ids`</td>
      <td>Manual existing draft/activation (`ManualQuizPage.jsx:329`, `:425`, `:515`)</td>
      <td>invalidates caches; navigates based on returned status</td>
      <td>`pageError` + toast interceptor</td>
    </tr>
    <tr>
      <td>`quizService.updateStatus(id,status)`</td>
      <td><code>`client/src/services/quizService.js:29`</code></td>
      <td><code>`PUT /quizzes/:id/status`</code></td>
      <td>Bearer token</td>
      <td>`{ status: "active"</td>
      <td>"ended" }`</td>
      <td>Ongoing page stop responses (`OngoingQuizPage.jsx:119`, `:385`)</td>
      <td>invalidates stats/responses, toast with auto-submitted count</td>
    </tr>
    <tr>
      <td>`quizService.getLiveStats(id)`</td>
      <td><code>`client/src/services/quizService.js:34`</code></td>
      <td><code>`GET /quizzes/:id/live-stats`</code></td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>Ongoing page polling query (`OngoingQuizPage.jsx:98-103`)</td>
      <td>drives header stats and timer</td>
      <td>query error UI</td>
    </tr>
    <tr>
      <td>`quizService.getPreview(id)`</td>
      <td><code>`client/src/services/quizService.js:39`</code></td>
      <td><code>`GET /quizzes/:id/preview`</code></td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>Manual preview dialog when editing existing (`ManualQuizPage.jsx:274-278`)</td>
      <td>shows read-only preview questions</td>
      <td>query error text</td>
    </tr>
    <tr>
      <td>`quizService.exportResults(id)`</td>
      <td><code>`client/src/services/quizService.js:44`</code></td>
      <td><code>`GET /quizzes/:id/export`</code> (`responseType:"blob"`)</td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>Ongoing and QuizResponse Export buttons (`OngoingQuizPage.jsx:239`, `QuizResponsePage.jsx:127`)</td>
      <td>creates object URL and triggers browser download</td>
      <td>catch -> destructive toast</td>
    </tr>
    <tr>
      <td>`quizService.duplicate(id)`</td>
      <td><code>`client/src/services/quizService.js:57`</code></td>
      <td><code>`POST /quizzes/:id/duplicate`</code></td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>QuizLibrary duplicate action (`QuizLibraryPage.jsx:69`, `:211`)</td>
      <td>invalidates quizzes, toast, navigate to new manual quiz id</td>
      <td>mutation errors via interceptor</td>
    </tr>
    <tr>
      <td>`quizService.delete(id)`</td>
      <td><code>`client/src/services/quizService.js:62`</code></td>
      <td><code>`DELETE /quizzes/:id`</code></td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>QuizLibrary delete confirm (`QuizLibraryPage.jsx:81`, `:237`), Ongoing delete (`OngoingQuizPage.jsx:132`, `:405`)</td>
      <td>invalidate caches, close dialogs, optionally navigate `/teacher`</td>
      <td>custom onError toast in both pages</td>
    </tr>
    <tr>
      <td>`quizService.getLeaderboard(id)`</td>
      <td><code>`client/src/services/quizService.js:67`</code></td>
      <td><code>`GET /quizzes/:id/leaderboard`</code></td>
      <td>Bearer token</td>
      <td>URL param</td>
      <td>QuizResponse leaderboard tab query (`QuizResponsePage.jsx:101-105`)</td>
      <td>renders top 10 table</td>
      <td>query error row</td>
    </tr>
    <tr>
      <td>`responseService.getQuizResponses(quizId,params)`</td>
      <td><code>`client/src/services/responseService.js:4`</code></td>
      <td><code>`GET /quizzes/:quizId/responses`</code></td>
      <td>Bearer token</td>
      <td>query `page`, `limit`</td>
      <td>Dashboard analytics (`DashboardPage.jsx:191`), Ongoing (`OngoingQuizPage.jsx:108`), QuizResponse (`QuizResponsePage.jsx:97`)</td>
      <td>drives response tables and analytics</td>
      <td>query error text</td>
    </tr>
    <tr>
      <td>`sessionService.enter(payload)`</td>
      <td><code>`client/src/services/sessionService.js:4`</code></td>
      <td><code>`POST /sessions/enter`</code></td>
      <td>no auth header required</td>
      <td>`{ access_token, access_code, name, roll_no, email, division, group_no }`</td>
      <td>Entry form submit (`EntryPage.jsx:49-52`)</td>
      <td>stores session token/payload, route to quiz</td>
      <td>serverError text</td>
    </tr>
    <tr>
      <td>`sessionService.submit(payload,sessionToken)`</td>
      <td><code>`client/src/services/sessionService.js:9`</code></td>
      <td><code>`POST /sessions/submit`</code></td>
      <td>`X-Session-Token` + any auth default</td>
      <td>`{ answers:[{question_id,selected_option}] }`</td>
      <td>Quiz submit button/auto-submit (`QuizPage.jsx:179-182`, `:212-255`, `:286-289`)</td>
      <td>marks submitted, clears sessionStorage, toast</td>
      <td>sets `submitError` and sync timing from API error body</td>
    </tr>
    <tr>
      <td>`sessionService.saveProgress(payload,sessionToken)`</td>
      <td><code>`client/src/services/sessionService.js:19`</code></td>
      <td><code>`POST /sessions/progress`</code></td>
      <td>`X-Session-Token`</td>
      <td>`{ answers:[...] }`</td>
      <td>Debounced after answer changes (`QuizPage.jsx:333-343`)</td>
      <td>sync timing; if `session_closed`, show results and clear storage</td>
      <td>failures are mutation errors (toast interceptor)</td>
    </tr>
    <tr>
      <td>`violationService.report(payload,sessionToken)`</td>
      <td><code>`client/src/services/violationService.js:4`</code></td>
      <td>`POST /violations`</td>
      <td>`X-Session-Token`</td>
      <td>`{ type, description }`</td>
      <td>Proctoring browser events (`useProctoring.js:31-64`)</td>
      <td>no UI update</td>
      <td>errors intentionally swallowed in hook (`useProctoring.js:26-28`)</td>
    </tr>
    <tr>
      <td>`violationService.getBySession(sessionId)`</td>
      <td><code>`client/src/services/violationService.js:14`</code></td>
      <td><code>`GET /violations?session_id=...`</code></td>
      <td>Bearer token</td>
      <td>query `session_id`</td>
      <td>Ongoing/QuizResponse details dialogs (`OngoingQuizPage.jsx:115`, `QuizResponsePage.jsx:110`)</td>
      <td>populate Q&A/violation timeline dialogs</td>
      <td>dialog-level error text</td>
    </tr>
  </tbody>
</table>


---

## SECTION 4 — ALL BACKEND ROUTES & CONTROLLERS

### 4.1 Global app endpoints

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Definition</th>
      <th>Handler</th>
      <th>Middleware</th>
      <th>Behavior / DB / responses</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`GET /api/health`</td>
      <td>`server/app.js:46`</td>
      <td>inline</td>
      <td>`cors`, `express.json` global</td>
      <td>Returns `200 {status:"ok"}`. No DB.</td>
    </tr>
    <tr>
      <td>`GET /`</td>
      <td>`server/app.js:58`</td>
      <td>inline</td>
      <td>global</td>
      <td>Returns `200 {message:"QuizLoom API is running"}`.</td>
    </tr>
    <tr>
      <td>`GET *`</td>
      <td>`server/app.js:66`</td>
      <td>inline</td>
      <td>global</td>
      <td>Sends <code>`client/dist/index.html`</code> for SPA. For unmatched GET routes (including unknown `/api/*` GET), this may return HTML instead of JSON 404.</td>
    </tr>
  </tbody>
</table>


### 4.2 Auth routes

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Route file</th>
      <th>Controller</th>
      <th>Middleware</th>
      <th>Input validation</th>
      <th>DB operations</th>
      <th>Response / status</th>
      <th>Errors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>`POST /api/auth/register`</code></td>
      <td><code>`server/routes/auth.routes.js:21`</code></td>
      <td>`register` <code>`server/controllers/auth.controller.js:49`</code></td>
      <td>`validate(registerSchema)`</td>
      <td>`name(2-100)`, `email(valid,max150)`, `password(8-128)`</td>
      <td>check email exists (`SELECT id FROM users WHERE email=$1`), hash bcrypt, insert user role teacher</td>
      <td>`201 {user}`</td>
      <td>`409 Email exists`, propagated errors</td>
    </tr>
    <tr>
      <td><code>`POST /api/auth/login`</code></td>
      <td>`auth.routes.js:22`</td>
      <td>`login` `auth.controller.js:76`</td>
      <td>`validate(loginSchema)`</td>
      <td>`email`, `password`</td>
      <td>fetch user by email incl password hash; bcrypt compare</td>
      <td>`200 {token,user}`</td>
      <td><code>`401 invalid email/password`</code></td>
    </tr>
    <tr>
      <td><code>`POST /api/auth/logout`</code></td>
      <td>`auth.routes.js:23`</td>
      <td>`logout` `auth.controller.js:123`</td>
      <td>`authenticate`, `authorize("teacher")`</td>
      <td>token only</td>
      <td>insert token hash into `revoked_tokens`; cleanup expired revocations</td>
      <td>`200 {message}`</td>
      <td>`400 invalid token payload`, <code>`401 invalid/revoked token`</code></td>
    </tr>
    <tr>
      <td>`GET /api/auth/me`</td>
      <td>`auth.routes.js:24`</td>
      <td>`me` `auth.controller.js:149`</td>
      <td>`authenticate`, `authorize("teacher")`</td>
      <td>token only</td>
      <td>select user by `req.user.userId`</td>
      <td>`200 {user}`</td>
      <td><code>`401 token invalid/user not found`</code></td>
    </tr>
    <tr>
      <td><code>`PUT /api/auth/profile`</code></td>
      <td>`auth.routes.js:25`</td>
      <td>`updateProfile` `auth.controller.js:170`</td>
      <td>`authenticate`, `authorize("teacher")`, `validate(updateProfileSchema)`</td>
      <td>`name`, optional `avatar_url` URL/null</td>
      <td>update users set name/avatar</td>
      <td>`200 {user}`</td>
      <td>`404 user not found`</td>
    </tr>
    <tr>
      <td><code>`PUT /api/auth/change-password`</code></td>
      <td>`auth.routes.js:26`</td>
      <td>`changePassword` `auth.controller.js:194`</td>
      <td>auth + role + validate</td>
      <td>body + refine confirm match (`auth.controller.js:26-34`)</td>
      <td>select password hash; compare current; hash new; update user</td>
      <td>`200 {message}`</td>
      <td>`400 current password wrong`, `404 user not found`</td>
    </tr>
  </tbody>
</table>


### 4.3 Subject routes

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Route file</th>
      <th>Controller</th>
      <th>Middleware</th>
      <th>Validation</th>
      <th>DB operations</th>
      <th>Response</th>
      <th>Errors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`GET /api/subjects`</td>
      <td>`subjects.routes.js:13`</td>
      <td>`listSubjects` `subjects.controller.js:13`</td>
      <td>router-level `authenticate+authorize` (`:11`)</td>
      <td>none</td>
      <td>select subjects by `created_by` order name</td>
      <td>`200 {subjects}`</td>
      <td>propagated</td>
    </tr>
    <tr>
      <td>`POST /api/subjects`</td>
      <td>`subjects.routes.js:13-14`</td>
      <td>`createSubject` `subjects.controller.js:31`</td>
      <td>auth+role +`validate(createSubjectSchema)`</td>
      <td>`name(2-100)`</td>
      <td>insert subject</td>
      <td>`201 {subject}`</td>
      <td>`409 duplicate name` (`23505`)</td>
    </tr>
    <tr>
      <td><code>`DELETE /api/subjects/:id`</code></td>
      <td>`subjects.routes.js:14`</td>
      <td>`deleteSubject` `subjects.controller.js:54`</td>
      <td>auth+role</td>
      <td>param parse positive int (`:9-11`, `:56`)</td>
      <td>delete by id+created_by</td>
      <td>`200 {message}`</td>
      <td>`400 invalid id`, `404 not found`, `409 subject referenced by quizzes`</td>
    </tr>
    <tr>
      <td><code>`GET /api/subjects/:id/units`</code></td>
      <td>`subjects.routes.js:17`</td>
      <td>`listUnitsBySubject` `units.controller.js:37`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>assert subject ownership then unit query with question counts</td>
      <td>`200 {units}`</td>
      <td>`400 invalid id`, `404 subject`</td>
    </tr>
    <tr>
      <td><code>`POST /api/subjects/:id/units`</code></td>
      <td>`subjects.routes.js:18`</td>
      <td>`createUnit` `units.controller.js:68`</td>
      <td>auth+role</td>
      <td>param int + body name</td>
      <td>ownership check, duplicate check, max order_no, insert unit</td>
      <td>`201 {unit}`</td>
      <td><code>`400 invalid/duplicate`</code>, `404 subject`</td>
    </tr>
    <tr>
      <td><code>`GET /api/subjects/:id/quiz-history`</code></td>
      <td>`subjects.routes.js:21`</td>
      <td>`getQuizHistoryBySubject` `subjects.controller.js:89`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>ownership check; join quizzes+quiz_questions+questions; map nested quizzes/questions</td>
      <td>`200 {quizzes:[{questions:[]}]}`</td>
      <td>`400 invalid id`, `404 subject`</td>
    </tr>
  </tbody>
</table>


### 4.4 Unit routes

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Route file</th>
      <th>Controller</th>
      <th>Middleware</th>
      <th>Validation</th>
      <th>DB operations</th>
      <th>Response</th>
      <th>Errors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`PUT /api/units/:id`</td>
      <td>`units.routes.js:11`</td>
      <td>`updateUnit` `units.controller.js:112`</td>
      <td>auth+role</td>
      <td>param id + body name</td>
      <td>ownership check (join units->subjects), duplicate name check in subject, update unit</td>
      <td>`200 {unit}`</td>
      <td><code>`400 invalid/duplicate`</code>, `404 unit`</td>
    </tr>
    <tr>
      <td><code>`DELETE /api/units/:id`</code></td>
      <td>`units.routes.js:12`</td>
      <td>`deleteUnit` `units.controller.js:155`</td>
      <td>auth+role</td>
      <td>param id</td>
      <td>tx begin; update questions in unit set `in_subject_bank=false, unit_id=NULL`; delete unit; commit</td>
      <td>`200 {message}`</td>
      <td>rollback on fail;`400 invalid id`, `404 unit`</td>
    </tr>
    <tr>
      <td><code>`GET /api/units/:id/questions`</code></td>
      <td>`units.routes.js:13`</td>
      <td>`getUnitQuestions` `units.controller.js:194`</td>
      <td>auth+role</td>
      <td>param id, query `page/limit` defaults 1/10</td>
      <td>ownership check; select questions by unit and `in_subject_bank=TRUE` with window count</td>
      <td>`200 {questions,page,totalPages,total}`</td>
      <td>`400 invalid id`, `404 unit`</td>
    </tr>
  </tbody>
</table>


### 4.5 Question routes

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Route file</th>
      <th>Controller</th>
      <th>Middleware</th>
      <th>Validation</th>
      <th>DB operations</th>
      <th>Response</th>
      <th>Errors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`GET /api/questions`</td>
      <td>`questions.routes.js:20`</td>
      <td>`listQuestions` `questions.controller.js:95`</td>
      <td>auth+role</td>
      <td>query schema (`subject_id`, optional <code>`search/page/limit/in_subject_bank/unit_id`</code>)</td>
      <td>ownership check; filtered paginated select with optional unit filter and window count</td>
      <td>`200 {data,questions,total,count,page,totalPages}`</td>
      <td>`400 invalid query`, `404 subject`</td>
    </tr>
    <tr>
      <td><code>`POST /api/questions`</code></td>
      <td>`questions.routes.js:21`</td>
      <td>`createQuestion` `questions.controller.js:199`</td>
      <td>auth+role + validate</td>
      <td>schema includes `subject_id`, options, correct option, booleans, unit/in_subject_bank</td>
      <td>ownership check; insert question</td>
      <td>`201 {question}`</td>
      <td>`404 subject`</td>
    </tr>
    <tr>
      <td><code>`POST /api/questions/bulk-import`</code></td>
      <td>`questions.routes.js:22`</td>
      <td>`bulkImportQuestions` `questions.controller.js:229`</td>
      <td>auth+role + validate</td>
      <td>`{subject_id, questions:[questionInput...]}`</td>
      <td>ownership check; inserts each question in loop</td>
      <td>`201 {message,inserted_count,questions}`</td>
      <td>`404 subject`</td>
    </tr>
    <tr>
      <td><code>`PUT /api/questions/:id`</code></td>
      <td>`questions.routes.js:23`</td>
      <td>`updateQuestion` `questions.controller.js:156`</td>
      <td>auth+role + validate</td>
      <td>partial update schema non-empty</td>
      <td>dynamic SQL update fields by owner</td>
      <td>`200 {question}`</td>
      <td>`400 invalid`, `404 question`</td>
    </tr>
    <tr>
      <td><code>`DELETE /api/questions/:id`</code></td>
      <td>`questions.routes.js:24`</td>
      <td>`deleteQuestion` `questions.controller.js:269`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>delete by id+created_by</td>
      <td>`200 {message}`</td>
      <td>`400 invalid id`, `404 question`</td>
    </tr>
  </tbody>
</table>


### 4.6 Quiz routes

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Route file</th>
      <th>Controller</th>
      <th>Middleware</th>
      <th>Validation</th>
      <th>DB operations</th>
      <th>Response</th>
      <th>Errors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`GET /api/quizzes`</td>
      <td>`quizzes.routes.js:29`</td>
      <td>`listQuizzes` `quizzes.controller.js:166`</td>
      <td>auth+role</td>
      <td>query schema (`search,status,page,limit`)</td>
      <td>select quizzes join subjects with pagination/filter</td>
      <td>`200 {data,quizzes,total,count,page,totalPages}`</td>
      <td>`400 invalid query`</td>
    </tr>
    <tr>
      <td><code>`GET /api/quizzes/:id/live-stats`</code></td>
      <td>`quizzes.routes.js:30`</td>
      <td>`getQuizLiveStats` `quizzes.controller.js:803`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>select quiz+subject; counts from `student_sessions`; flagged distinct from `violation_flags`; elapsed epoch calc</td>
      <td>`200 {quiz,stats}`</td>
      <td>`400 invalid id`, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`GET /api/quizzes/:id/preview`</code></td>
      <td>`quizzes.routes.js:31`</td>
      <td>`getQuizPreview` `quizzes.controller.js:886`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>select quiz; select linked questions ordered</td>
      <td>`200 {quiz,questions}`</td>
      <td>`400 invalid id`, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`GET /api/quizzes/:id/export`</code></td>
      <td>`quizzes.routes.js:32`</td>
      <td>`exportQuizResponses` `quizzes.controller.js:937`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>verify ownership; aggregate session summary+violations; generate Excel with `exceljs`</td>
      <td>`200` binary xlsx with `Content-Disposition`</td>
      <td>`400 invalid id`, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`GET /api/quizzes/:id/leaderboard`</code></td>
      <td>`quizzes.routes.js:33`</td>
      <td>`getQuizLeaderboard` `quizzes.controller.js:1181`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>verify ownership; top 10 submitted sessions ordered by score/time</td>
      <td>`200 {leaderboard}`</td>
      <td>`400 invalid id`, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`GET /api/quizzes/:id/responses`</code></td>
      <td>`quizzes.routes.js:34`</td>
      <td>`getQuizResponses` `responses.controller.js:14`</td>
      <td>auth+role</td>
      <td>param id, query page/limit</td>
      <td>verify quiz ownership; select sessions with violation aggregate counts and window total; natural sort by roll_no</td>
      <td>`200 {quiz,data,responses,count,total,page,totalPages}`</td>
      <td><code>`400 invalid id/query`</code>, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`GET /api/quizzes/:id`</code></td>
      <td>`quizzes.routes.js:35`</td>
      <td>`getQuizById` `quizzes.controller.js:496`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>select quiz; select linked questions ordered</td>
      <td>`200 {quiz,questions}`</td>
      <td>`400 invalid id`, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`POST /api/quizzes/manual`</code></td>
      <td>`quizzes.routes.js:36`</td>
      <td>`createManualQuiz` `quizzes.controller.js:225`</td>
      <td>auth+role + validate</td>
      <td>`createManualQuizSchema` (metadata + `questions[]`)</td>
      <td>tx: optional timing plan, subject ownership, insert quiz, optionally create/find units, insert questions, insert quiz_questions order</td>
      <td>`201 {quiz,questions}`</td>
      <td><code>`400 validation/timing`</code>, `404 subject`</td>
    </tr>
    <tr>
      <td><code>`POST /api/quizzes/auto-generate`</code></td>
      <td>`quizzes.routes.js:37`</td>
      <td>`autoGenerateQuiz` `quizzes.controller.js:376`</td>
      <td>auth+role + validate</td>
      <td>metadata +`unit_selections[]`</td>
      <td>validate ownership; for each unit random select question ids with LIMIT; tx insert quiz + quiz_questions</td>
      <td>`201 {quiz,question_count}`</td>
      <td><code>`400 not enough/no questions/timing`</code>, `404 subject`</td>
    </tr>
    <tr>
      <td><code>`POST /api/quizzes/:id/duplicate`</code></td>
      <td>`quizzes.routes.js:38`</td>
      <td>`duplicateQuiz` `quizzes.controller.js:1086`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>tx copy quiz metadata into new draft quiz; copy quiz_questions rows</td>
      <td>`201 {quiz_id}`</td>
      <td>`400 invalid id`, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`PUT /api/quizzes/:id/status`</code></td>
      <td>`quizzes.routes.js:39`</td>
      <td>`updateQuizStatus` `quizzes.controller.js:711`</td>
      <td>auth+role + validate</td>
      <td>`{status:"active"</td>
      <td>"ended"}`</td>
      <td>tx `transitionQuizStatus` service; may auto-generate access_token, may finalize pending sessions on end</td>
      <td>`200 {quiz,auto_submitted_count,share_url}`</td>
    </tr>
    <tr>
      <td><code>`PUT /api/quizzes/:id`</code></td>
      <td>`quizzes.routes.js:40`</td>
      <td>`updateQuiz` `quizzes.controller.js:540`</td>
      <td>auth+role + validate</td>
      <td>partial metadata/status/question_ids reorder</td>
      <td>verify ownership; optional timing plan; optional reorder validation/update; update fields; possibly set access_token; tx commit</td>
      <td>`200 {quiz,share_url}`</td>
      <td><code>`400 invalid payload/reorder/timing/no fields`</code>, `404 quiz`</td>
    </tr>
    <tr>
      <td><code>`DELETE /api/quizzes/:id`</code></td>
      <td>`quizzes.routes.js:41`</td>
      <td>`deleteQuiz` `quizzes.controller.js:761`</td>
      <td>auth+role</td>
      <td>param int</td>
      <td>tx delete violation_flags by quiz sessions, delete student_answers by sessions, delete student_sessions, delete quiz</td>
      <td>`200 {message}`</td>
      <td>`400 invalid id`, `404 quiz`</td>
    </tr>
  </tbody>
</table>


### 4.7 Session routes (student)

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Route file</th>
      <th>Controller</th>
      <th>Middleware</th>
      <th>Validation</th>
      <th>DB operations</th>
      <th>Response</th>
      <th>Errors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>`POST /api/sessions/enter`</code></td>
      <td>`sessions.routes.js:15`</td>
      <td>`enterSession` `sessions.controller.js:117`</td>
      <td>`validate(enterSessionSchema)`</td>
      <td>access token/code + student identity fields</td>
      <td>find quiz by access token & status active/scheduled; verify access_code; fetch questions; resolve window; insert pending student_session with generated token</td>
      <td>`200 {session_token,timing,quiz,questions}`</td>
      <td>`404 quiz unavailable`, `403 invalid code`, <code>`400 no access code/no questions`</code>, `410 ended`</td>
    </tr>
    <tr>
      <td><code>`POST /api/sessions/progress`</code></td>
      <td>`sessions.routes.js:16`</td>
      <td>`saveSessionProgress` `sessions.controller.js:218`</td>
      <td>validate body schema</td>
      <td>header `X-Session-Token`, body answers array</td>
      <td>find session+quiz; resolve window; branch: already submitted -> return final; scheduled -> 409; ended -> finalize submission tx; active -> tx replace answers</td>
      <td><code>`200 {message/timed payload}`</code></td>
      <td>`400 invalid token header`, `404 session`, `409 scheduled`</td>
    </tr>
    <tr>
      <td><code>`POST /api/sessions/submit`</code></td>
      <td>`sessions.routes.js:17`</td>
      <td>`submitSession` `sessions.controller.js:350`</td>
      <td>validate body schema</td>
      <td>same as progress</td>
      <td>find session+quiz; resolve window; branch: submitted -> return final; scheduled->409; ended->finalize; active->optional replace answers then finalize tx</td>
      <td>`200 {score,total_points,percentage,breakdown,timing}`</td>
      <td>`400 invalid token header`, `404 session`, `409 scheduled`</td>
    </tr>
  </tbody>
</table>


### 4.8 Violation routes

<table>
  <thead>
    <tr>
      <th>Method + path</th>
      <th>Route file</th>
      <th>Controller</th>
      <th>Middleware</th>
      <th>Validation</th>
      <th>DB operations</th>
      <th>Response</th>
      <th>Errors</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>`POST /api/violations`</code></td>
      <td>`violations.routes.js:14`</td>
      <td>`createViolation` `violations.controller.js:27`</td>
      <td>`validate(createViolationSchema)`</td>
      <td>body `type` enum + optional `description`; header token parsed in controller</td>
      <td>lookup session by token; require pending status; insert violation_flags row</td>
      <td>`201 {message}`</td>
      <td><code>`400 invalid token/session inactive`</code>, `404 session`</td>
    </tr>
    <tr>
      <td><code>`GET /api/violations?session_id=...`</code></td>
      <td>`violations.routes.js:15`</td>
      <td>`getViolationsBySession` `violations.controller.js:69`</td>
      <td>`authenticate`, `authorize("teacher")`</td>
      <td>query positive `session_id`</td>
      <td>verify session belongs to teacher via join sessions->quizzes; fetch answer breakdown; fetch violations timeline; aggregate counts</td>
      <td>`200 {session,answers,violations,summary}`</td>
      <td>`400 invalid query`, `404 session`</td>
    </tr>
  </tbody>
</table>


---

## SECTION 5 — FRONTEND ROUTE → BACKEND API MAPPING

<table>
  <thead>
    <tr>
      <th>Frontend route/page</th>
      <th>User action</th>
      <th>API call</th>
      <th>Backend endpoint</th>
      <th>DB operation(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`/login`</td>
      <td>Submit login form</td>
      <td>`authService.login`</td>
      <td><code>`POST /api/auth/login`</code></td>
      <td>`users` select by email, bcrypt compare, JWT sign</td>
    </tr>
    <tr>
      <td>App boot (all routes)</td>
      <td>Auth hydrate when token exists</td>
      <td>`authService.me` from `AuthContext`</td>
      <td>`GET /api/auth/me`</td>
      <td>`users` select by id</td>
    </tr>
    <tr>
      <td>Any teacher page (sidebar/footer)</td>
      <td>Logout</td>
      <td>`authService.logout` via `AuthContext.logout`</td>
      <td><code>`POST /api/auth/logout`</code></td>
      <td>insert token hash into `revoked_tokens` and cleanup expired entries</td>
    </tr>
    <tr>
      <td><code>`/quiz/enter/:accessToken`</code></td>
      <td>Submit entry form</td>
      <td>`sessionService.enter`</td>
      <td><code>`POST /api/sessions/enter`</code></td>
      <td>`quizzes` select by access token + `questions` join fetch + `student_sessions` insert</td>
    </tr>
    <tr>
      <td>`/quiz/take`</td>
      <td>Select answers (debounced autosave)</td>
      <td>`sessionService.saveProgress`</td>
      <td><code>`POST /api/sessions/progress`</code></td>
      <td>`student_sessions` select + `student_answers` replace or finalize via scoring path</td>
    </tr>
    <tr>
      <td>`/quiz/take`</td>
      <td>Submit button or auto-submit</td>
      <td>`sessionService.submit`</td>
      <td><code>`POST /api/sessions/submit`</code></td>
      <td>`student_answers` replace/fetch + scoring + `student_sessions` update submitted</td>
    </tr>
    <tr>
      <td>`/quiz/take`</td>
      <td>Tab blur/copy/screenshot/context menu</td>
      <td>`violationService.report`</td>
      <td><code>`POST /api/violations`</code></td>
      <td>`student_sessions` lookup + `violation_flags` insert</td>
    </tr>
    <tr>
      <td>`/teacher`</td>
      <td>Page load subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select by `created_by`</td>
    </tr>
    <tr>
      <td>`/teacher`</td>
      <td>Page load quizzes for KPI/status</td>
      <td>`quizService.list` loop</td>
      <td>`GET /api/quizzes`</td>
      <td>`quizzes` + `subjects` select/pagination</td>
    </tr>
    <tr>
      <td>`/teacher`</td>
      <td>Page load responses for analytics</td>
      <td>`responseService.getQuizResponses` loop</td>
      <td><code>`GET /api/quizzes/:id/responses`</code></td>
      <td>`student_sessions` + `violation_flags` aggregates</td>
    </tr>
    <tr>
      <td>`/teacher`</td>
      <td>Create subject dialog submit</td>
      <td>`subjectService.create`</td>
      <td>`POST /api/subjects`</td>
      <td>`subjects` insert</td>
    </tr>
    <tr>
      <td>`/teacher/profile`</td>
      <td>Load sidebar subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select</td>
    </tr>
    <tr>
      <td>`/teacher/profile`</td>
      <td>Save profile</td>
      <td>`authService.updateProfile`</td>
      <td><code>`PUT /api/auth/profile`</code></td>
      <td>`users` update name/avatar</td>
    </tr>
    <tr>
      <td>`/teacher/profile`</td>
      <td>Change password</td>
      <td>`authService.changePassword`</td>
      <td><code>`PUT /api/auth/change-password`</code></td>
      <td>`users` select hash + update password hash</td>
    </tr>
    <tr>
      <td>`/teacher/profile`</td>
      <td>Delete subject (confirm dialog)</td>
      <td>`subjectService.remove`</td>
      <td><code>`DELETE /api/subjects/:id`</code></td>
      <td>`subjects` delete by owner; blocked if referenced by `quizzes`</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Load subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Load units</td>
      <td>`unitService.listBySubject`</td>
      <td><code>`GET /api/subjects/:id/units`</code></td>
      <td>`units` left join `questions` for counts</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>History tab load</td>
      <td>`subjectService.getQuizHistory`</td>
      <td><code>`GET /api/subjects/:id/quiz-history`</code></td>
      <td>joined query `quizzes` + `quiz_questions` + `questions`</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Add question</td>
      <td>`questionService.create`</td>
      <td><code>`POST /api/questions`</code></td>
      <td>`questions` insert</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Import save bulk</td>
      <td>`questionService.bulkImport`</td>
      <td><code>`POST /api/questions/bulk-import`</code></td>
      <td>looped `questions` inserts</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Create unit</td>
      <td>`unitService.create`</td>
      <td><code>`POST /api/subjects/:id/units`</code></td>
      <td>`units` insert with order_no</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Rename unit</td>
      <td>`unitService.update`</td>
      <td>`PUT /api/units/:id`</td>
      <td>`units` update with ownership + duplicate-name checks</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Delete unit</td>
      <td>`unitService.delete`</td>
      <td><code>`DELETE /api/units/:id`</code></td>
      <td>tx `questions` update + `units` delete</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Open unit section</td>
      <td>`unitService.getQuestions`</td>
      <td><code>`GET /api/units/:id/questions`</code></td>
      <td>`questions` select by `unit_id`</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Open uncategorized section</td>
      <td>`questionService.listBySubject(...unit_id=-1)`</td>
      <td>`GET /api/questions`</td>
      <td>`questions` select `unit_id IS NULL`</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Edit question</td>
      <td>`questionService.update`</td>
      <td><code>`PUT /api/questions/:id`</code></td>
      <td>dynamic `questions` update</td>
    </tr>
    <tr>
      <td><code>`/teacher/questions/:subjectId`</code></td>
      <td>Delete question</td>
      <td>`questionService.remove`</td>
      <td><code>`DELETE /api/questions/:id`</code></td>
      <td>`questions` delete</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual`</code></td>
      <td>Load subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual`</code></td>
      <td>Subject chosen -> load units</td>
      <td>`unitService.listBySubject`</td>
      <td><code>`GET /api/subjects/:id/units`</code></td>
      <td>`units` list</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual`</code></td>
      <td>Save draft (new)</td>
      <td>`quizService.createManual`</td>
      <td><code>`POST /api/quizzes/manual`</code></td>
      <td>tx insert `quizzes`, insert `questions`, insert `quiz_questions`</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual`</code></td>
      <td>Save draft (existing)</td>
      <td>`quizService.update`</td>
      <td><code>`PUT /api/quizzes/:id`</code></td>
      <td>tx update `quizzes` and optional reorder `quiz_questions`</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual`</code></td>
      <td>Activate/schedule (new)</td>
      <td>create then update</td>
      <td><code>`POST /api/quizzes/manual`</code> then <code>`PUT /api/quizzes/:id`</code></td>
      <td>create rows then status/timing/access token update</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual`</code></td>
      <td>Activate/schedule (existing)</td>
      <td>`quizService.update`</td>
      <td><code>`PUT /api/quizzes/:id`</code></td>
      <td>status/timing update + reorder validation</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual/:quizId`</code></td>
      <td>Initial load</td>
      <td>`quizService.getById`</td>
      <td><code>`GET /api/quizzes/:id`</code></td>
      <td>`quizzes` select + joined questions</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual/:quizId`</code></td>
      <td>Preview dialog open</td>
      <td>`quizService.getPreview`</td>
      <td><code>`GET /api/quizzes/:id/preview`</code></td>
      <td>`quizzes` preview select + questions</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/manual*`</code></td>
      <td>Create subject dialog</td>
      <td>`subjectService.create`</td>
      <td>`POST /api/subjects`</td>
      <td>`subjects` insert</td>
    </tr>
    <tr>
      <td>`/teacher/quiz/auto`</td>
      <td>Load subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select</td>
    </tr>
    <tr>
      <td>`/teacher/quiz/auto`</td>
      <td>Load units for subject</td>
      <td>`unitService.listBySubject`</td>
      <td><code>`GET /api/subjects/:id/units`</code></td>
      <td>`units` select + counts</td>
    </tr>
    <tr>
      <td>`/teacher/quiz/auto`</td>
      <td>Generate/schedule</td>
      <td>`quizService.autoGenerate`</td>
      <td><code>`POST /api/quizzes/auto-generate`</code></td>
      <td>random question id selection + tx quiz/quiz_questions inserts</td>
    </tr>
    <tr>
      <td>`/teacher/quiz/auto`</td>
      <td>Create subject</td>
      <td>`subjectService.create`</td>
      <td>`POST /api/subjects`</td>
      <td>`subjects` insert</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/library`</code></td>
      <td>Load subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/library`</code></td>
      <td>Load quizzes (all pages)</td>
      <td>`quizService.list` loop</td>
      <td>`GET /api/quizzes`</td>
      <td>`quizzes` paginated select</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/library`</code></td>
      <td>Duplicate quiz</td>
      <td>`quizService.duplicate`</td>
      <td><code>`POST /api/quizzes/:id/duplicate`</code></td>
      <td>tx copy quiz row + copy quiz_questions</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/library`</code></td>
      <td>Delete quiz</td>
      <td>`quizService.delete`</td>
      <td><code>`DELETE /api/quizzes/:id`</code></td>
      <td>tx delete violations/answers/sessions/quiz</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/scheduled`</code></td>
      <td>Load subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/scheduled`</code></td>
      <td>Load scheduled list</td>
      <td>`quizService.list({status:scheduled})`</td>
      <td>`GET /api/quizzes`</td>
      <td>`quizzes` filter by status</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/scheduled`</code></td>
      <td>Load active count/list</td>
      <td>`quizService.list({status:active})`</td>
      <td>`GET /api/quizzes`</td>
      <td>`quizzes` filter by status</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing`</code></td>
      <td>Load subjects</td>
      <td>`subjectService.list`</td>
      <td>`GET /api/subjects`</td>
      <td>`subjects` select</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing`</code></td>
      <td>Load active quizzes</td>
      <td>`quizService.list({status:active})`</td>
      <td>`GET /api/quizzes`</td>
      <td>`quizzes` status filter</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing/:quizId`</code></td>
      <td>Poll live stats</td>
      <td>`quizService.getLiveStats`</td>
      <td><code>`GET /api/quizzes/:id/live-stats`</code></td>
      <td>session counts + violation distinct counts + elapsed calc</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing/:quizId`</code></td>
      <td>Poll response table</td>
      <td>`responseService.getQuizResponses`</td>
      <td><code>`GET /api/quizzes/:id/responses`</code></td>
      <td>sessions+violations aggregate</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing/:quizId`</code></td>
      <td>Open student details</td>
      <td>`violationService.getBySession`</td>
      <td><code>`GET /api/violations?session_id=`</code></td>
      <td>session ownership check + answers + violations</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing/:quizId`</code></td>
      <td>Stop responses</td>
      <td>`quizService.updateStatus("ended")`</td>
      <td><code>`PUT /api/quizzes/:id/status`</code></td>
      <td>transition service + auto-finalize pending sessions</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing/:quizId`</code></td>
      <td>Delete quiz</td>
      <td>`quizService.delete`</td>
      <td><code>`DELETE /api/quizzes/:id`</code></td>
      <td>cascade delete flow via explicit deletes</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/ongoing/:quizId`</code></td>
      <td>Export results</td>
      <td>`quizService.exportResults`</td>
      <td><code>`GET /api/quizzes/:id/export`</code></td>
      <td>session summary query + excel generation</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/:quizId/responses`</code></td>
      <td>Load responses</td>
      <td>`responseService.getQuizResponses`</td>
      <td><code>`GET /api/quizzes/:id/responses`</code></td>
      <td>sessions+violations aggregate</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/:quizId/responses`</code></td>
      <td>Load leaderboard</td>
      <td>`quizService.getLeaderboard`</td>
      <td><code>`GET /api/quizzes/:id/leaderboard`</code></td>
      <td>submitted sessions ranking query</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/:quizId/responses`</code></td>
      <td>Open session details</td>
      <td>`violationService.getBySession`</td>
      <td><code>`GET /api/violations?session_id=`</code></td>
      <td>answers + violation timeline</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/:quizId/responses`</code></td>
      <td>Open quiz details dialog</td>
      <td>`quizService.getById`</td>
      <td><code>`GET /api/quizzes/:id`</code></td>
      <td>quiz + ordered questions</td>
    </tr>
    <tr>
      <td><code>`/teacher/quiz/:quizId/responses`</code></td>
      <td>Export results</td>
      <td>`quizService.exportResults`</td>
      <td><code>`GET /api/quizzes/:id/export`</code></td>
      <td>excel generation query path</td>
    </tr>
  </tbody>
</table>


---

## SECTION 6 — AUTHENTICATION & AUTHORIZATION FLOW

### Registration endpoint flow (backend available, no current UI entry)

1. Current frontend does not expose `/register`; teacher signup is hidden from the app routes/UI.
2. Backend endpoint `POST /api/auth/register` remains implemented for future admin-driven onboarding.
3. Backend validation via `registerSchema` (`server/controllers/auth.controller.js:10-14`) through `validate` middleware (`server/middleware/validate.js:1-14`).
4. Controller checks existing email, hashes password, inserts teacher user, and returns created user payload.

### Login flow

1. Frontend submit in `client/src/pages/auth/LoginPage.jsx:32-43`.
2. API call `POST /api/auth/login` (`authService.login`).
3. Backend validation with `loginSchema` (`auth.controller.js:16-19`).
4. Controller fetches user+hash (`:81-88`), compares bcrypt (`:95`), signs JWT (`signTeacherToken`, `:36-47`), returns `{token,user}` (`:112`).
5. Frontend stores token in localStorage via `AuthContext.login` (`client/src/context/AuthContext.jsx:98-101`), navigates `/teacher`.

### Token/session mechanism

- Teacher auth uses JWT bearer tokens.
- Student quiz attempts use opaque `session_token` in custom header `X-Session-Token` (`sessionService.js`).

### Token storage on frontend

- Teacher token: localStorage key `quiz_token` (`AuthContext.jsx:66`, `:99`, `:103`).
- Student session token/payload: sessionStorage keys `quiz_session_token`, `quiz_session_payload` (`EntryPage.jsx:68-69`, constants in `client/src/utils/sessionKeys.js:1-2`).

### Token sent to backend

- Teacher JWT: `Authorization: Bearer <token>` from Axios request interceptor (`client/src/services/api.js:16-21`).
- Student session token: `X-Session-Token` header in session/violation services.

### Backend token validation

- JWT verified in `authenticate` middleware; middleware also checks `revoked_tokens` by SHA-256 token hash and rejects revoked JWTs.
- On successful auth, payload is set on `req.user` and raw token on `req.token`.
- Role checked in `authorize("teacher")` (`server/middleware/authorize.js:1-9`).

### Protected routes on frontend

- Teacher routes wrapped by `<ProtectedRoute requiredRole="teacher" />` (`client/src/App.jsx:29`).
- Guard checks `isAuthenticated && user.role===requiredRole` (`client/src/components/shared/ProtectedRoute.jsx:19-21`), otherwise redirect login.

### Protected endpoints on backend

- `subjects`, `units`, `questions`, `quizzes` routers all use auth+role middleware globally (`routes/*` files).
- `auth/logout`, `auth/me`, `auth/profile`, `auth/change-password`, `violations GET` are protected individually.

### Logout handling

- Frontend logout calls `authService.logout()` from `AuthContext.logout()` and then clears localStorage token/resets auth state.
- Backend logout endpoint revokes JWT by storing hashed token + expiry in `revoked_tokens`; authenticate middleware rejects revoked tokens.

### Role-based access

- Yes; single explicit teacher role check in middleware and frontend guard.
- JWT payload includes `role` (`auth.controller.js:39-43`).

---

## SECTION 7 — DATABASE SCHEMA & QUERIES

### 7.1 Tables/models, fields, constraints, relationships

<table>
  <thead>
    <tr>
      <th>Table</th>
      <th>Fields / constraints</th>
      <th>Relationships</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>`users` (`schema.sql:1-9`)</td>
      <td>`id PK`, `name`, `email UNIQUE`, `password`, `role default teacher`, `avatar_url`, `created_at`</td>
      <td>referenced by `subjects.created_by`, `units.created_by`, `questions.created_by`, `quizzes.created_by`</td>
    </tr>
    <tr>
      <td>`subjects` (`:11-16`)</td>
      <td>`id PK`, `name UNIQUE`, `created_by FK users`, `created_at`</td>
      <td>parent of `units.subject_id`, `questions.subject_id`, `quizzes.subject_id`</td>
    </tr>
    <tr>
      <td>`units` (`:18-26`)</td>
      <td>`id PK`, `name`, `subject_id FK ON DELETE CASCADE`, `order_no`, `created_by`, `created_at`, `UNIQUE(subject_id,name)`</td>
      <td>referenced by `questions.unit_id ON DELETE SET NULL`</td>
    </tr>
    <tr>
      <td>`questions` (`:28-45`)</td>
      <td>options fields,`correct_option CHECK in a-d`, booleans, `points`, `in_subject_bank`, `created_by`</td>
      <td>linked in `quiz_questions`, `student_answers`</td>
    </tr>
    <tr>
      <td>`quizzes` (`:47-63`)</td>
      <td>metadata, schedule fields,<code>`status CHECK draft/active/ended/scheduled`</code>, `access_code`, `access_token UNIQUE`</td>
      <td>parent of `quiz_questions`, `student_sessions`</td>
    </tr>
    <tr>
      <td>`quiz_questions` (`:65-71`)</td>
      <td>`quiz_id FK ON DELETE CASCADE`, `question_id FK`, `order_no`, `UNIQUE(quiz_id,question_id)`</td>
      <td>join table quiz-question</td>
    </tr>
    <tr>
      <td>`student_sessions` (`:73-87`)</td>
      <td>student identity,`session_token UNIQUE`, <code>`status CHECK pending/submitted`</code>, `score`, `total_points`, timestamps</td>
      <td>parent of `student_answers`, `violation_flags`</td>
    </tr>
    <tr>
      <td>`student_answers` (`:89-97`)</td>
      <td>`session_id FK ON DELETE CASCADE`, `question_id`, `selected_option CHECK`, `is_correct`, `UNIQUE(session_id,question_id)`</td>
      <td>answer rows per session/question</td>
    </tr>
    <tr>
      <td>`violation_flags` (`:99-105`)</td>
      <td>`session_id FK ON DELETE CASCADE`, `type`, `description`, `occurred_at`</td>
      <td>violations per student session</td>
    </tr>
    <tr>
      <td>`revoked_tokens` (`:108-114`)</td>
      <td>`token_hash UNIQUE`, `user_id FK users ON DELETE CASCADE`, `expires_at`, `revoked_at`</td>
      <td>checked by auth middleware for JWT revocation</td>
    </tr>
  </tbody>
</table>


### 7.2 Indexes

Defined in schema:

- `idx_questions_subject_id`, `idx_questions_unit_id`, `idx_questions_in_subject_bank`
- `idx_quiz_questions_quiz_id`
- `idx_student_sessions_quiz_id`, `idx_student_sessions_session_token`
- `idx_student_answers_session_id`
- `idx_violation_flags_session_id`
- `idx_quizzes_scheduled_start`, `idx_quizzes_scheduled_end`
- `idx_revoked_tokens_expires_at`

Created/ensured at startup in `server/index.js`:

- Adds missing scheduled columns
- Creates `revoked_tokens` table if missing
- Drops legacy per-owner uniqueness (`UNIQUE(created_by,name)` constraint/index) if present and enforces `UNIQUE(name)` on `subjects`
- `idx_student_answers_session_question_unique` unique index
- schedule indexes on quizzes
- revocation expiry index on `revoked_tokens`

### 7.3 Which endpoints query which tables (high-level map)

- Auth endpoints: `users`, `revoked_tokens`
- Subjects endpoints: `subjects`, plus joins with `quizzes`, `quiz_questions`, `questions` for history
- Units endpoints: `units`, `subjects`, `questions`
- Questions endpoints: `questions`, `subjects`
- Quizzes endpoints: `quizzes`, `subjects`, `questions`, `quiz_questions`, `student_sessions`, `student_answers`, `violation_flags`
- Responses endpoint: `quizzes`, `subjects`, `student_sessions`, `violation_flags`
- Sessions endpoints: `quizzes`, `questions`, `quiz_questions`, `student_sessions`, `student_answers`
- Violations endpoints: `student_sessions`, `violation_flags`, `quizzes`, `quiz_questions`, `questions`, `student_answers`

### 7.4 Major query patterns

- Paginated list with `COUNT(*) OVER()` in `listQuestions`, `listQuizzes`, `getQuizResponses`, `getUnitQuestions`.
- Join-heavy history and details:
  - Subject quiz history join (`subjects.controller.js:105-116`)
  - Session details joins in violations controller (`violations.controller.js:101-129`)
- Transactional writes:
  - Quiz create/update/delete/duplicate
  - Session submit/progress finalize flows
  - Unit delete behavior
- Random sampling for auto-generated quizzes (`ORDER BY RANDOM() LIMIT` in `quizzes.controller.js:409-419`).
- Ranking leaderboard query sorted by score/time (`quizzes.controller.js:1190-1203`).

### 7.5 Joins / complex queries

- `subjects.controller.js:getQuizHistoryBySubject` joins `quizzes -> quiz_questions -> questions`, then reconstructs nested JS map.
- `responses.controller.js:getQuizResponses` uses aggregate counts and filtered counts by violation type with left join.
- `violations.controller.js:getViolationsBySession` builds combined session + question answer timeline + violation timeline.
- `quizzes.controller.js:exportQuizResponses` aggregates violations per session and then exports workbook.

### 7.6 Seeders/migrations

- No formal migration framework (no Prisma/Knex/TypeORM migrations).
- Schema bootstrap SQL: `server/sql/schema.sql`.
- One-off script: `server/scripts/migrate_scheduled_status.js`.
- Runtime migration-like DDL in `server/index.js:25-38`.

---

## SECTION 8 — MIDDLEWARE & REQUEST LIFECYCLE

### 8.1 Global middleware order (`server/app.js`)

1. `cors(...)` (`app.js:31-42`)
2. `express.json()` (`app.js:44`)
3. Route handlers (`app.js:46-56`)
4. Root/splat GET handlers (`app.js:58-68`)
5. `errorHandler` (`app.js:70`)

### 8.2 Route-level middleware

- Validation middleware for request bodies:
  - auth register/login/profile/password
  - questions create/bulk/update
  - quizzes create/update/status
  - sessions enter/progress/submit
  - violations create
- Authentication/authorization:
  - Router-level on subjects/units/questions/quizzes
  - Endpoint-level on auth protected endpoints and violations GET.

### 8.3 What each middleware does

- `validate`: parses body with Zod, returns `400 {error:"Validation failed",details}` if invalid.
- `authenticate`: enforces Bearer token, verifies JWT, sets `req.user`.
- `authorize`: enforces exact role equality.
- `errorHandler`: catches unhandled errors, maps known DB/system codes to user-friendly 503s, otherwise status from error or 500.

### 8.4 Full request lifecycle example

Example: `PUT /api/quizzes/:id/status`

1. HTTP request hits Express.
2. `cors` and `express.json` run.
3. Router match `/api/quizzes`.
4. Router-level `authenticate` verifies JWT and sets `req.user`.
5. Router-level `authorize("teacher")` checks role.
6. Route-level `validate(updateQuizStatusSchema)` validates body.
7. Controller `updateQuizStatus` starts DB client and transaction.
8. Service `transitionQuizStatus` enforces transition, may finalize pending sessions, updates quiz.
9. Transaction commit.
10. JSON response with quiz + auto submitted count + optional share_url.
11. On any thrown error, `next(error)` -> global `errorHandler`.

---

## SECTION 9 — STATE MANAGEMENT (FRONTEND)

### 9.1 State management technologies

- React local state (`useState`, page/component scoped).
- React Context + reducer for auth (`AuthContext`).
- TanStack React Query for async/server state caching and background refetch.
- App bootstrap readiness state in `BackendWarmupGate` (polling backend health before rendering app shell).
- Browser storage:
  - `localStorage` for teacher JWT
  - `sessionStorage` for student session tokens/payload.

### 9.2 Stores/contexts/slices

- `AuthContext` in `client/src/context/AuthContext.jsx`
  - state: `user`, `token`, `isAuthenticated`, `isLoading`
  - actions: `HYDRATE_START`, `HYDRATE_SUCCESS`, `LOGIN_SUCCESS`, `UPDATE_USER`, `LOGOUT`, `HYDRATE_FAIL`

No Redux/Zustand slices present.

### 9.3 What data lives globally

- Auth user + token + auth flags (context).
- API/server data cached in React Query (subjects, quizzes, units, responses, leaderboard, details).
- Toast collection in module-level singleton (`useToast.js`).

### 9.4 API data flow into state

- Query hooks populate local query caches.
- Mutations invalidate query keys (`queryClient.invalidateQueries`) on successful writes.
- Auth API responses populate context and localStorage.

### 9.5 How components read/write

- `useAuth()` reads/writes auth context.
- `useQuery` reads remote data states (`isLoading`, `isError`, `data`).
- `useMutation` sends writes; UI updates via `onSuccess`, invalidations, local state changes.
- Form state via `react-hook-form` on login/entry pages (and in the dormant register page code).

---

## SECTION 10 — ERROR HANDLING

### Backend error format

- Standard: `{ error: "<message>" }`
- Validation middleware: `{ error: "Validation failed", details: <zod flatten> }` (`server/middleware/validate.js:6-9`)
- Status codes vary by case (`400/401/403/404/409/410/500/503`).

### Backend handling strategy

- Controllers return explicit error responses for expected failures.
- Unexpected errors go to `next(error)` and are processed by global `errorHandler`.
- `errorHandler` maps DB/system errors (`28P01`, `3D000`, `42P01`, `ECONNREFUSED`) to explicit 503s.

### Frontend handling strategy

- Global Axios interceptor triggers toast by default (`client/src/services/api.js:26-37`).
- Pages often also set local error text:
  - login/entry/quiz/manual etc.
- React Query pages display inline `isError` messages and still get interceptor toast unless suppressed.

### Global boundaries/interceptors

- Interceptor exists (Axios response interceptor).
- React route tree is wrapped in an `ErrorBoundary` in `client/src/App.jsx`.

### Validation errors to form fields

- Backend sends structured Zod `details`.
- Frontend mostly does not map `details.fieldErrors` into per-field form errors.
- One explicit extraction of first field error exists in manual quiz page (`extractApiError` in `ManualQuizPage.jsx:191-200`).

---

## SECTION 11 — THIRD-PARTY INTEGRATIONS

<table>
  <thead>
    <tr>
      <th>Integration</th>
      <th>Used where</th>
      <th>Purpose</th>
      <th>Credentials/config</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PostgreSQL (`pg`)</td>
      <td>backend (<code>`server/config/db.js`</code>)</td>
      <td>Primary datastore</td>
      <td>`DATABASE_URL` env (<code>`server/.env.example:2`</code>)</td>
    </tr>
    <tr>
      <td>JWT (`jsonwebtoken`)</td>
      <td>backend auth middleware/controller</td>
      <td>Stateless teacher auth</td>
      <td>`JWT_SECRET`, `JWT_EXPIRES_IN` env (<code>`server/.env.example:3-4`</code>)</td>
    </tr>
    <tr>
      <td>bcryptjs</td>
      <td>backend auth controller</td>
      <td>Password hashing/verification</td>
      <td>no external credentials</td>
    </tr>
    <tr>
      <td>ExcelJS</td>
      <td>backend quizzes export</td>
      <td>Generate `.xlsx` results file</td>
      <td>no credentials</td>
    </tr>
    <tr>
      <td>XLSX</td>
      <td>frontend import parser, backend dependency</td>
      <td>Parse uploaded question spreadsheets</td>
      <td>no credentials</td>
    </tr>
    <tr>
      <td>React Query</td>
      <td>frontend</td>
      <td>server-state caching/refetch</td>
      <td>no credentials</td>
    </tr>
    <tr>
      <td>Axios</td>
      <td>frontend</td>
      <td>HTTP client and interceptors</td>
      <td>uses `VITE_API_URL` (<code>`client/.env.example:1`</code>)</td>
    </tr>
    <tr>
      <td>Recharts</td>
      <td>frontend dashboard charts</td>
      <td>Participants trend visualization</td>
      <td>no credentials</td>
    </tr>
    <tr>
      <td>Browser Clipboard API</td>
      <td>frontend scheduled/ongoing/manual pages</td>
      <td>Copy links/access codes</td>
      <td>browser permission-based</td>
    </tr>
    <tr>
      <td>Vercel rewrite config</td>
      <td>`client/vercel.json`</td>
      <td>SPA routing support</td>
      <td>deployment config only</td>
    </tr>
  </tbody>
</table>


No external payment/email/SMS/cloud storage APIs are implemented.

---

## SECTION 12 — COMPLETE END-TO-END FLOW EXAMPLES

### Flow 1: Teacher creates and schedules a manual quiz

1. **User action on UI**Teacher opens `/teacher/quiz/manual`, fills metadata/questions, clicks `Schedule Quiz` (`client/src/pages/teacher/ManualQuizPage.jsx:612-618`).
2. **Frontend function triggered** `activateQuiz()` (`ManualQuizPage.jsx:462-547`).
3. **API call made**
   For new quiz:

- `POST /api/quizzes/manual` with metadata + question objects (`ManualQuizPage.jsx:492-495`).Then:
- `PUT /api/quizzes/:id` with `status:"active"` and schedule fields (`:515-518`).
  For existing quiz: only PUT.

4. **Backend receives request — middleware executed** `authenticate` -> `authorize("teacher")` -> `validate(createManualQuizSchema)` or `validate(updateQuizSchema)` (`server/routes/quizzes.routes.js:28,36,40`).
5. **Controller function called** `createManualQuiz` (`server/controllers/quizzes.controller.js:225`) and `updateQuiz` (`:540`).
6. **Service/business logic executed**

- `planActivationWindow` for scheduling window normalization (`quizzes.controller.js:233-247`, `:555-574` from `quizTiming.service.js`).
- Optional access token generation in update path (`quizzes.controller.js:576-579`).

7. **Database query made**

- Tx insert into `quizzes` (`quizzes.controller.js:256-280`)
- For each question insert into `questions` (`:316-344`)
- Link rows in `quiz_questions` (`:349-355`)
- Update quiz metadata/status and optional question order (`:665-675`, `:652-663`)

8. **Response built and sent back**

- Create: `201 {quiz,questions}` (`:360-363`)
- Update: `200 {quiz,share_url}` (`:690-693`)

9. **Frontend receives response** `activateQuiz` checks returned `quiz.status`, invalidates queries, and prepares share URL + navigation target.
10. **UI updates**
    If share URL exists, opens share dialog (copy link + continue) and navigates when dialog closes; otherwise navigates immediately. Success toast is shown in both paths.

---

### Flow 2: Student enters quiz, autosaves progress, submits

1. **User action on UI**Student opens `/quiz/enter/:accessToken`, submits details and access code (`EntryPage.jsx:89`).
2. **Frontend function triggered** `onSubmit` in `EntryPage` (`EntryPage.jsx:45-78`).
3. **API call made** `POST /api/sessions/enter` with `{access_token,access_code,name,roll_no,email,division,group_no}` (`EntryPage.jsx:49-52`).
4. **Backend receives request — middleware executed** `validate(enterSessionSchema)` (`server/routes/sessions.routes.js:15`).
5. **Controller function called** `enterSession` (`server/controllers/sessions.controller.js:117`).
6. **Service/business logic executed** `resolveQuizWindow` determines scheduled/active/ended and timing payload (`sessions.controller.js:170`, `quizTiming.service.js:89`).
7. **Database query made**

- Query quiz by access token and status (`sessions.controller.js:121-142`)
- Query quiz questions (`:163`, helper `fetchQuizQuestions`)
- Insert into `student_sessions` with generated token (`:177-191`)

8. **Response built and sent back** `200` with session token, timing fields, quiz summary, sanitized questions (`:197-212`).
9. **Frontend receives response**Stores session token/payload in `sessionStorage` (`EntryPage.jsx:68-69`), navigates `/quiz/take` (`:71-74`).
10. **UI updates**
    In `/quiz/take`:

- Answer selection updates local `answers` (`QuizPage.jsx:356-365`)
- Debounced autosave calls `POST /api/sessions/progress` (`:333-343`)
- Submit button or timer-end calls `POST /api/sessions/submit` (`:515-522`, `:286-289`)
- On success clears session storage and shows submitted state (`:232-239`, `:382-395`).

---

### Flow 3: Teacher monitors ongoing quiz and stops responses

1. **User action on UI**Teacher opens `/teacher/quiz/ongoing/:quizId`, then clicks `Stop Responses` and confirms (`OngoingQuizPage.jsx:305`, `:385`).
2. **Frontend function triggered** `stopMutation.mutate()` from mutation defined at `OngoingQuizPage.jsx:118-129`.
3. **API call made** `PUT /api/quizzes/:id/status` body `{status:"ended"}` via `quizService.updateStatus` (`client/src/services/quizService.js:29-31`).
4. **Backend receives request — middleware executed** `authenticate` -> `authorize("teacher")` -> `validate(updateQuizStatusSchema)` (`server/routes/quizzes.routes.js:28-39`).
5. **Controller function called** `updateQuizStatus` (`server/controllers/quizzes.controller.js:711`).
6. **Service/business logic executed** `transitionQuizStatus` (`server/services/quizLifecycle.service.js:25`) enforces valid transition and triggers pending-session finalization when ending.
7. **Database query made**

- Read quiz current status (`quizLifecycle.service.js:26-39`)
- If ending: `finalizePendingSessionsForQuiz` loops pending sessions (`sessionLifecycle.service.js:113-137`) and for each:
  - read stored answers (`:27-38`)
  - score and persist answers/session submitted (`:65-110`)
- Update `quizzes.status` and token fields (`quizLifecycle.service.js:73-91`)

8. **Response built and sent back** `200 {quiz, auto_submitted_count, share_url}` (`quizzes.controller.js:737-743`).
9. **Frontend receives response** `onSuccess` invalidates live stats/responses queries, closes dialog, and shows toast with auto-submitted count (`OngoingQuizPage.jsx:121-127`).
10. **UI updates**
    Dashboard cards and ongoing data refresh via polling/query invalidation; page switches button from `Stop Responses` to `Export Results` when status becomes ended (`OngoingQuizPage.jsx:304-312`).

---
