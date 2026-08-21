// Tra cứu DNS bằng module dns (built-in)
// Chạy: node 03-dns-lookup.js
const dns = require('dns').promises;

async function main() {
  const domain = 'google.com';

  try {
    // Lookup: trả về địa chỉ IP từ hostname (dùng OS resolver)
    console.log(`=== DNS Lookup: ${domain} ===`);
    const result = await dns.lookup(domain);
    console.log(`Địa chỉ IP: ${result.address} (IPv${result.family})`);

    // Resolve A records (IPv4)
    console.log('\n=== A Records (IPv4) ===');
    const aRecords = await dns.resolve4(domain);
    aRecords.forEach((ip) => console.log(' ', ip));

    // Resolve NS records (Name Servers)
    console.log('\n=== NS Records (Name Servers) ===');
    const nsRecords = await dns.resolveNs(domain);
    nsRecords.forEach((ns) => console.log(' ', ns));

    // Resolve MX records (Mail Exchange)
    console.log('\n=== MX Records (Mail Exchange) ===');
    const mxRecords = await dns.resolveMx(domain);
    mxRecords
      .sort((a, b) => a.priority - b.priority)
      .forEach((mx) => console.log(`  Priority ${mx.priority}: ${mx.exchange}`));

    // Reverse lookup: IP → hostname
    console.log('\n=== Reverse Lookup ===');
    const hostnames = await dns.reverse(result.address);
    console.log(`${result.address} →`, hostnames);

  } catch (err) {
    // ENOTFOUND = không tìm thấy domain, ECONNREFUSED = không có mạng
    console.error('Lỗi DNS:', err.code, err.message);
  }
}

main();
