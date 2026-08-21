// Đọc command line arguments từ process.argv
// Chạy: node 02-process-args.js --name Alice --age 25 --verbose
// Hoặc: node 02-process-args.js --host localhost --port 3000 --debug
const args = process.argv;

console.log('=== process.argv raw ===');
console.log(args);
// argv[0] = đường dẫn node.exe
// argv[1] = đường dẫn file script
// argv[2+] = các argument người dùng truyền vào

console.log('\n=== Arguments người dùng ===');
const userArgs = args.slice(2);
console.log(userArgs);

// Parse dạng --key value thành object
function parseArgs(argv) {
  const result = {};
  const flags = [];

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2); // bỏ dấu --
      // Nếu giá trị tiếp theo không phải flag thì đó là value
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        result[key] = argv[i + 1];
        i++; // bỏ qua value đã đọc
      } else {
        // Flag boolean: --verbose, --debug
        result[key] = true;
        flags.push(key);
      }
    }
  }

  return { options: result, flags };
}

const { options, flags } = parseArgs(userArgs);

console.log('\n=== Parsed Arguments ===');
console.log('Options:', options);
console.log('Boolean flags:', flags);

// Sử dụng với giá trị mặc định
const config = {
  name: options.name || 'World',
  age: options.age ? parseInt(options.age) : 0,
  host: options.host || 'localhost',
  port: options.port ? parseInt(options.port) : 3000,
  verbose: Boolean(options.verbose),
  debug: Boolean(options.debug),
};

console.log('\n=== Config sau khi parse ===');
console.log(config);
console.log(`\nXin chào, ${config.name}!`);
if (config.verbose) console.log('[verbose] Chế độ chi tiết đang bật');
if (config.debug) console.log('[debug] Chế độ debug đang bật');
console.log(`Server sẽ chạy tại ${config.host}:${config.port}`);
