'use strict';
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const CHAPTERS = [
  'chapters/part1/chapter01.html',
  'chapters/part1/chapter02.html',
  'chapters/part1/chapter03.html',
  'chapters/part2/chapter04.html',
  'chapters/part2/chapter05.html',
  'chapters/part2/chapter06.html',
  'chapters/part2/chapter07.html',
  'chapters/part3/chapter08.html',
  'chapters/part3/chapter09.html',
  'chapters/part3/chapter10.html',
  'chapters/part3/chapter11.html',
  'chapters/part4/chapter12.html',
  'chapters/part4/chapter13.html',
  'chapters/part4/chapter14.html',
  'chapters/part5/chapter15.html',
  'chapters/part5/chapter16.html',
  'chapters/part5/chapter17.html',
  'chapters/part5/chapter18.html',
];

async function buildPDF() {
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

  const css = fs.readFileSync(path.join(ROOT, 'assets/css/style.css'), 'utf8');

  console.log('Đọc các chapter...');
  let combinedBody = '';
  for (const rel of CHAPTERS) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const $ = cheerio.load(html);
    const content = $('main').html() || '';
    combinedBody += `<div class="chapter-wrap">${content}</div>\n`;
    console.log('  ✓', rel);
  }

  const fullHTML = `<!DOCTYPE html>
<html lang="vi" data-theme="light">
<head>
<meta charset="UTF-8">
<title>Lập Trình NodeJS Từ Cơ Bản Đến Nâng Cao</title>
<style>
${css}

/* PDF overrides */
@page { size: A4; margin: 18mm 16mm; }
body { font-size: 13px; background: #fff !important; color: #1e293b !important; }
:root, [data-theme="light"] {
  --bg: #fff; --bg2: #f8fafc; --border: #e2e8f0;
  --text: #1e293b; --text-muted: #64748b;
  --accent: #3b82f6; --accent-dark: #2563eb;
  --code-bg: #0d1117; --code-text: #e2e8f0;
}
.sidebar, .topbar, .sidebar-toggle, .chapter-nav { display: none !important; }
.main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
.layout { display: block !important; }
.chapter-wrap { page-break-before: always; padding: 8px 0 24px; }
.chapter-wrap:first-child { page-break-before: auto; }
pre { page-break-inside: avoid; white-space: pre-wrap; word-break: break-word; }
h1, h2 { page-break-after: avoid; }
table { page-break-inside: avoid; }
.svg-diagram { background: #0d1117 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
pre code { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.code-block, pre { background: #0d1117 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Cover page */
.cover-page { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; page-break-after: always; }
.cover-page h1 { font-size: 2.6rem; line-height: 1.3; margin: 0 0 16px; }
.cover-page .subtitle { font-size: 1.1rem; color: #64748b; }
.cover-page .parts { margin-top: 32px; font-size: 0.95rem; color: #94a3b8; }
</style>
</head>
<body>
<div class="cover-page">
  <h1>Lập Trình NodeJS<br>Từ Cơ Bản Đến Nâng Cao</h1>
  <div class="subtitle">Dành cho người mới bắt đầu — từ nền tảng đến cloud serverless</div>
  <div class="parts">
    Phần 1: Nền tảng Web &nbsp;·&nbsp;
    Phần 2: NodeJS Core &nbsp;·&nbsp;
    Phần 3: Express.js &nbsp;·&nbsp;
    Phần 4: Database &nbsp;·&nbsp;
    Phần 5: Nâng cao &amp; Cloud
  </div>
</div>
${combinedBody}
</body>
</html>`;

  const tmpFile = path.join(DIST, '_tmp_combined.html');
  fs.writeFileSync(tmpFile, fullHTML, 'utf8');

  console.log('\nKhởi động Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const fileUrl = 'file:///' + tmpFile.replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 120000 });

  // Đợi fonts load
  await page.evaluateHandle('document.fonts.ready');

  const outPDF = path.join(DIST, 'nodejs-book.pdf');
  await page.pdf({
    path: outPDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  });

  await browser.close();
  fs.unlinkSync(tmpFile);

  const stat = fs.statSync(outPDF);
  console.log(`\n✅ PDF hoàn thành: dist/nodejs-book.pdf (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
}

buildPDF().catch(err => { console.error('Lỗi:', err); process.exit(1); });
