// PM2 Ecosystem Config — quản lý process Node.js trong production
// Dùng: pm2 start ecosystem.config.js --env production
// Xem log: pm2 logs
// Monitor: pm2 monit

'use strict';

module.exports = {
  apps: [
    {
      name: 'myapp',          // tên hiển thị trong pm2 list
      script: './app.js',     // file entry point

      // Chạy cluster mode — tận dụng tất cả CPU cores
      instances: 'max',       // 'max' = số CPU, hoặc đặt số cụ thể như 4
      exec_mode: 'cluster',

      // Tự động restart khi RAM vượt ngưỡng
      max_memory_restart: '500M',

      // Restart nếu app crash
      autorestart: true,
      max_restarts: 10,       // tối đa 10 lần restart liên tiếp
      min_uptime: '5s',       // coi là "stable" nếu chạy >= 5 giây

      // Chờ 4 giây giữa các lần restart
      restart_delay: 4000,

      // Không watch file trong production (chỉ dùng watch khi dev)
      watch: false,

      // Log files
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,       // gộp log từ tất cả instances vào 1 file

      // Biến môi trường cho từng environment
      env: {
        // Môi trường development (pm2 start --env development)
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        // Môi trường production (pm2 start --env production)
        NODE_ENV: 'production',
        PORT: 3000,
        // Các secret nên đặt qua file .env hoặc biến môi trường hệ thống
        // KHÔNG đặt JWT_SECRET hay password trực tiếp ở đây
      },
    },
  ],

  // Cấu hình deploy qua SSH (pm2 deploy ecosystem.config.js production)
  deploy: {
    production: {
      user: 'deploy',                              // user SSH trên VPS
      host: ['your-server.com'],                   // địa chỉ VPS
      ref: 'origin/main',                          // branch deploy
      repo: 'git@github.com:username/myapp.git',  // repo git
      path: '/var/www/myapp',                      // thư mục trên VPS

      // Các lệnh chạy sau khi pull code mới
      'post-deploy':
        'npm install --omit=dev && pm2 reload ecosystem.config.js --env production',
    },
  },
};
