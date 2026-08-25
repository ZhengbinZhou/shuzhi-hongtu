// PM2 进程配置：在云服务器上用 `pm2 start ecosystem.config.cjs` 启动生产服务。
// 天地图 tk 通过项目根目录的 .env.local 注入（Vite 构建时已写入客户端包），
// 运行时一般不再需要；如服务端代码将来读取其它环境变量，也可在下方 env 补充。
module.exports = {
  apps: [
    {
      name: "shuzhi-hongtu",
      // 直接用 node 执行 vinext 的 JS 入口（.bin/vinext 是 shell 脚本，PM2 无法直接运行）
      script: "node_modules/vinext/dist/cli.js",
      args: "start --port 3000 --hostname 127.0.0.1",
      interpreter: "node",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        WRANGLER_WRITE_LOGS: "false",
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      time: true,
    },
  ],
};
