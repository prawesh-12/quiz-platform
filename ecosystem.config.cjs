module.exports = {
  apps: [
    {
      name: "quizloom-exam",
      cwd: "./services/exam",
      script: "index.js",
      exec_mode: "cluster",
      instances: Number(process.env.EXAM_INSTANCES || 2),
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5005
      }
    },
    {
      name: "quizloom-exam-worker",
      cwd: "./services/exam",
      script: "worker.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "quizloom-scheduler",
      cwd: "./services/scheduler",
      script: "index.js",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "quizloom-auth",
      cwd: "./services/auth",
      script: "index.js",
      exec_mode: "cluster",
      instances: Number(process.env.AUTH_INSTANCES || 1),
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5001
      }
    },
    {
      name: "quizloom-questionbank",
      cwd: "./services/questionbank",
      script: "index.js",
      exec_mode: "cluster",
      instances: Number(process.env.QUESTIONBANK_INSTANCES || 1),
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5002
      }
    },
    {
      name: "quizloom-quiz",
      cwd: "./services/quiz",
      script: "index.js",
      exec_mode: "cluster",
      instances: Number(process.env.QUIZ_INSTANCES || 1),
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5003,
        QUESTIONBANK_INTERNAL_URL: "http://127.0.0.1:5002"
      }
    },
    {
      name: "quizloom-analytics",
      cwd: "./services/analytics",
      script: "index.js",
      exec_mode: "cluster",
      instances: Number(process.env.ANALYTICS_INSTANCES || 1),
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5004
      }
    }
  ]
};
