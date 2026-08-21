// Phân tích URL bằng class URL (built-in từ Node 10+)
// Chạy: node 02-parse-url.js
const { URL } = require('url');

const rawUrl = 'https://example.com:8080/path/to/page?name=Alice&age=25#section';
const parsed = new URL(rawUrl);

console.log('=== Phân tích URL ===');
console.log('URL gốc:', rawUrl);
console.log('---');
console.log('protocol  :', parsed.protocol);   // https:
console.log('hostname  :', parsed.hostname);   // example.com
console.log('port      :', parsed.port);       // 8080
console.log('pathname  :', parsed.pathname);   // /path/to/page
console.log('search    :', parsed.search);     // ?name=Alice&age=25
console.log('hash      :', parsed.hash);       // #section

// Đọc từng query parameter
console.log('\n=== Query Parameters ===');
for (const [key, value] of parsed.searchParams) {
  console.log(`  ${key} = ${value}`);
}

// Thêm / sửa query param
parsed.searchParams.set('role', 'admin');
parsed.searchParams.delete('age');
console.log('\nURL sau khi sửa searchParams:');
console.log(parsed.toString());

// Ví dụ thực tế: xây dựng URL API
const apiBase = new URL('https://api.example.com');
apiBase.pathname = '/v2/users';
apiBase.searchParams.set('page', '1');
apiBase.searchParams.set('limit', '20');
console.log('\nURL API xây dựng tự động:');
console.log(apiBase.toString());
