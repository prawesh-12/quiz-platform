// PM2 process model for a 1000+ student deployment: N stateless API instances, a single
// worker that reacts to scheduler signals (status transitions, batch auto-submit, snapshot
// builds), and a single scheduler that detects due quizzes and publishes those signals.
//
//   pm2 start ecosystem.config.cjs
//
// The scheduler is a separate package: run `npm install` in ./services/scheduler first.
// Duplicate signals are harmless — transitions are idempotent and auto-submit uses
// FOR UPDATE SKIP LOCKED — so a second worker would also be safe.
module.exports = {
  apps: [
    {
      name: "quizloom-api",
      cwd: "./server",
      script: "index.js",
      exec_mode: "cluster",
      instances: Number(process.env.API_INSTANCES || 2),
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "quizloom-worker",
      cwd: "./server",
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
    }
  ]
};
