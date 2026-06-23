// PM2 process model for a 1000+ student deployment: N stateless API instances plus a
// single worker that owns scheduled quiz transitions and batch auto-submit.
//
//   pm2 start ecosystem.config.cjs
//
// The API runs with SCHEDULER_ENABLED=false so only the worker drives transitions.
// (Even if that flag were wrong, the scheduler is guarded by a Postgres advisory lock,
// so at most one process ever transitions a quiz.)
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
        NODE_ENV: "production",
        SCHEDULER_ENABLED: "false"
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
        NODE_ENV: "production",
        SCHEDULER_ENABLED: "true"
      }
    }
  ]
};
