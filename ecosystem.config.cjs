// pm2 configuration for the backend.
//
// Until now pm2 was started by hand with no config at all, which meant no
// memory ceiling: the process grew to 2.1 GB of a 3.8 GB machine and stayed
// there, and nothing noticed. Uploads are streamed to disk now so that growth
// should not happen again, but the ceiling is here as a backstop — if some
// future path does hoard memory, the process is recycled instead of taking
// the site down with it.
module.exports = {
  apps: [
    {
      name: 'tth-backend',
      // dotenv.config() resolves .env against the working directory, and the
      // only .env is backend/.env — so the working directory has to be
      // backend/, exactly as the hand-started process already had it. Pointing
      // this at the repository root instead would leave the process with no
      // database password and no JWT secret.
      script: 'server.js',
      cwd: '/root/TTH_Lastone/backend',
      exec_mode: 'fork',
      instances: 1,

      // Roughly a quarter of the machine. Normal working size is well under
      // 200 MB, so reaching this means something is wrong.
      max_memory_restart: '900M',

      env: {
        NODE_ENV: 'production',

        // glibc hands each thread its own malloc arena and does not give the
        // space back, which is how transient large allocations turned into a
        // permanent 2 GB footprint. Two arenas is plenty for this workload
        // and keeps the process from hoarding address space.
        MALLOC_ARENA_MAX: '2',
      },

      // Restart on crash, but stop flapping if it cannot start at all.
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      restart_delay: 2000,

      merge_logs: true,
      time: true,
    },
  ],
};
