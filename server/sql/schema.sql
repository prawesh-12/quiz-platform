CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'teacher',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  order_no INT DEFAULT 1,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (subject_id, name)
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
  unit_id INT REFERENCES units(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
  has_equation BOOLEAN DEFAULT FALSE,
  allow_multiple_answers BOOLEAN DEFAULT FALSE,
  points INT DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  in_subject_bank BOOLEAN DEFAULT FALSE,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subject_id INT REFERENCES subjects(id),
  created_by INT REFERENCES users(id),
  duration_mins INT NOT NULL DEFAULT 15,
  batch VARCHAR(50),
  division VARCHAR(10),
  group_nos VARCHAR(50),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  quiz_date DATE,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  access_code VARCHAR(20),
  access_token VARCHAR(32) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id),
  order_no INT,
  UNIQUE (quiz_id, question_id)
);

CREATE TABLE IF NOT EXISTS student_sessions (
  id SERIAL PRIMARY KEY,
  quiz_id INT REFERENCES quizzes(id),
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  division VARCHAR(10) NOT NULL,
  group_no VARCHAR(10) NOT NULL,
  session_token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  score INT,
  total_points INT,
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_answers (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES student_sessions(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id),
  selected_option CHAR(1) CHECK (selected_option IN ('a', 'b', 'c', 'd')),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS violation_flags (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES student_sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_quiz_id ON student_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_student_sessions_session_token ON student_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_student_answers_session_id ON student_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_violation_flags_session_id ON violation_flags(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_unit_id ON questions(unit_id);
CREATE INDEX IF NOT EXISTS idx_questions_in_subject_bank ON questions(in_subject_bank);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_start ON quizzes(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_quizzes_scheduled_end ON quizzes(scheduled_end);
