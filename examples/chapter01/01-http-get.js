// Gửi HTTP GET request bằng module https của Node.js (built-in, không cần cài)
// Chạy: node 01-http-get.js
const https = require('https');

const url = 'https://jsonplaceholder.typicode.com/posts/1';

console.log(`Đang gửi GET request tới: ${url}\n`);

const req = https.get(url, (res) => {
  // In status và headers
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  console.log('---');

  // Thu thập dữ liệu từng chunk (stream)
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  // Khi nhận xong toàn bộ response
  res.on('end', () => {
    const data = JSON.parse(body);
    console.log('Response body:');
    console.log(JSON.stringify(data, null, 2));
  });
});

// Xử lý lỗi mạng
req.on('error', (err) => {
  console.error('Lỗi request:', err.message);
});
