'use strict';
const Epub = require('epub-gen');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const CHAPTERS = [
  { file: 'chapters/part1/chapter01.html', title: 'Chương 01: Internet & Web Hoạt Động Như Thế Nào?' },
  { file: 'chapters/part1/chapter02.html', title: 'Chương 02: Stateful vs Stateless — Cookie & Storage' },
  { file: 'chapters/part1/chapter03.html', title: 'Chương 03: NodeJS & Môi Trường Phát Triển' },
  { file: 'chapters/part2/chapter04.html', title: 'Chương 04: Core Modules Của NodeJS' },
  { file: 'chapters/part2/chapter05.html', title: 'Chương 05: Lập Trình Bất Đồng Bộ' },
  { file: 'chapters/part2/chapter06.html', title: 'Chương 06: Xây Dựng HTTP Server Thuần' },
  { file: 'chapters/part2/chapter07.html', title: 'Chương 07: npm Ecosystem' },
  { file: 'chapters/part3/chapter08.html', title: 'Chương 08: Express.js Cơ Bản' },
  { file: 'chapters/part3/chapter09.html', title: 'Chương 09: Middleware & Error Handling' },
  { file: 'chapters/part3/chapter10.html', title: 'Chương 10: Cookie, Session & Authentication' },
  { file: 'chapters/part3/chapter11.html', title: 'Chương 11: Templating Engine & SSR với EJS' },
  { file: 'chapters/part4/chapter12.html', title: 'Chương 12: MongoDB & Mongoose' },
  { file: 'chapters/part4/chapter13.html', title: 'Chương 13: PostgreSQL & Prisma' },
  { file: 'chapters/part4/chapter14.html', title: 'Chương 14: Caching với Redis' },
  { file: 'chapters/part5/chapter15.html', title: 'Chương 15: REST API Best Practices' },
  { file: 'chapters/part5/chapter16.html', title: 'Chương 16: Testing với Jest & Supertest' },
  { file: 'chapters/part5/chapter17.html', title: 'Chương 17: Deploy & DevOps Cơ Bản' },
  { file: 'chapters/part5/chapter18.html', title: 'Chương 18: Serverless & Cloud Functions' },
];

// CSS sạch cho EPUB (không dark mode, không sidebar)
const EPUB_CSS = `
body {
  font-family: "Georgia", "Times New Roman", serif;
  font-size: 1em;
  line-height: 1.75;
  color: #1e293b;
  margin: 0;
  padding: 0;
}
h1 { font-size: 1.8em; margin: 1.2em 0 0.4em; color: #1e293b; line-height: 1.3; }
h2 { font-size: 1.35em; margin: 1.8em 0 0.5em; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
h3 { font-size: 1.1em; margin: 1.4em 0 0.4em; color: #334155; }
h4 { font-size: 1em; margin: 1.2em 0 0.3em; color: #475569; }
p { margin: 0.7em 0; }
code {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.85em;
  background: #f1f5f9;
  padding: 2px 5px;
  border-radius: 3px;
  color: #c7254e;
}
pre {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.8em;
  background: #1e293b;
  color: #e2e8f0;
  padding: 14px 16px;
  border-radius: 6px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 1em 0;
  line-height: 1.55;
}
pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.2em 0;
  font-size: 0.9em;
}
th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
th { background: #f1f5f9; font-weight: 600; color: #1e293b; }
tr:nth-child(even) td { background: #f8fafc; }
ul, ol { padding-left: 1.5em; margin: 0.7em 0; }
li { margin: 0.35em 0; }
strong { font-weight: 700; color: #0f172a; }
em { font-style: italic; }
a { color: #2563eb; text-decoration: underline; }
blockquote { border-left: 3px solid #3b82f6; margin: 1em 0; padding: 8px 16px; background: #eff6ff; color: #1e40af; }

/* Callout boxes */
.callout { border-left: 4px solid #3b82f6; background: #eff6ff; padding: 12px 16px; margin: 1.2em 0; border-radius: 0 6px 6px 0; }
.callout-tip { border-color: #22c55e; background: #f0fdf4; }
.callout-warning { border-color: #f59e0b; background: #fffbeb; }
.callout-note { border-color: #8b5cf6; background: #f5f3ff; }
.callout-title { font-weight: 700; margin-bottom: 6px; }

/* Objectives & Summary */
.objectives, .summary {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 16px 20px;
  border-radius: 8px;
  margin: 1.5em 0;
}
.objectives-title, .summary-title { font-weight: 700; font-size: 1em; margin-bottom: 10px; color: #334155; }

/* Exercises */
.exercises { border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin: 1.5em 0; }
.exercises-title { font-weight: 700; font-size: 1em; margin-bottom: 10px; }
.exercise-item { margin: 1em 0; }
.exercise-badge { display: inline-block; font-size: 0.75em; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
.badge-easy { background: #dcfce7; color: #166534; }
.badge-medium { background: #fef9c3; color: #854d0e; }
.badge-hard { background: #fee2e2; color: #991b1b; }

/* Part label (breadcrumb) */
.part-badge { font-size: 0.8em; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }

/* Lead paragraph */
.lead { font-size: 1.05em; color: #475569; margin: 0.8em 0 1.5em; }

/* Code header */
.code-header { display: none; }

/* Hide nav elements */
.sidebar, .topbar, .sidebar-toggle, .chapter-nav,
.breadcrumb, .topbar-actions, .btn-icon { display: none; }

/* SVG diagrams */
.svg-diagram {
  background: #0d1117;
  border-radius: 8px;
  padding: 16px;
  margin: 1.2em 0;
  text-align: center;
}
.svg-diagram svg { max-width: 100%; height: auto; }

/* Chapter header */
.chapter-header { margin-bottom: 1.5em; }
.chapter-header h1 { margin-top: 0.5em; }
`;

async function buildEpub() {
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  console.log('Đọc các chapter...');
  const content = [];

  for (const { file, title } of CHAPTERS) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const $ = cheerio.load(html);

    // Xoá sidebar, topbar, chapter-nav, copy buttons
    $('.sidebar, .topbar, .sidebar-toggle, .chapter-nav, .copy-btn, .breadcrumb').remove();

    const data = $('main').html() || $('body').html() || '';
    content.push({ title, data });
    console.log('  ✓', file);
  }

  const options = {
    title: 'Lập Trình NodeJS Từ Cơ Bản Đến Nâng Cao',
    author: 'NodeJS Book',
    publisher: 'NodeJS Book',
    lang: 'vi',
    description: 'Sách lập trình NodeJS tiếng Việt dành cho người mới bắt đầu, từ nền tảng web đến cloud serverless. Bao gồm 18 chương với code ví dụ thực tế và bài tập.',
    genres: ['Technology', 'Programming', 'NodeJS'],
    css: EPUB_CSS,
    content,
  };

  const outEpub = path.join(DIST, 'nodejs-book.epub');
  console.log('\nTạo EPUB...');
  await new Epub(options, outEpub).promise;

  const stat = fs.statSync(outEpub);
  console.log(`\n✅ EPUB hoàn thành: dist/nodejs-book.epub (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

buildEpub().catch(err => { console.error('Lỗi:', err); process.exit(1); });
