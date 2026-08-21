/**
 * Chương 07 - Ví dụ 02: Dùng dayjs
 * Parse, format, tính toán ngày tháng
 * Cài đặt: npm install (trong thư mục chapter07/)
 * Chạy: node 02-use-dayjs.js
 */

const dayjs = require('dayjs');

// Load plugins cần thiết
const relativeTime = require('dayjs/plugin/relativeTime');
const duration = require('dayjs/plugin/duration');
const isBetween = require('dayjs/plugin/isBetween');
const weekOfYear = require('dayjs/plugin/weekOfYear');
const locale_vi = require('dayjs/locale/vi');

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.locale('vi'); // đặt locale mặc định tiếng Việt

// ─── Parse ngày tháng ────────────────────────────────────────────────────────

console.log('=== PARSE NGÀY ===');

// Từ chuỗi ISO
const ngaySinh = dayjs('1995-08-15');
console.log('Ngày sinh:', ngaySinh.format('DD/MM/YYYY'));

// Từ timestamp Unix (milliseconds)
const fromTimestamp = dayjs(1700000000000);
console.log('Từ timestamp:', fromTimestamp.format('DD/MM/YYYY HH:mm:ss'));

// Hiện tại
const now = dayjs();
console.log('Bây giờ:', now.format('dddd, DD/MM/YYYY HH:mm:ss'));

// ─── Format ──────────────────────────────────────────────────────────────────

console.log('\n=== FORMAT ===');

const date = dayjs('2024-03-08T14:30:00');

console.log('ISO 8601:          ', date.toISOString());
console.log('Việt Nam ngắn:     ', date.format('DD/MM/YYYY'));
console.log('Việt Nam đầy đủ:   ', date.format('HH:mm:ss DD/MM/YYYY'));
console.log('Tháng dạng chữ:    ', date.format('D MMMM YYYY')); // "8 tháng 3 2024"
console.log('Ngày trong tuần:   ', date.format('dddd')); // "thứ sáu"
console.log('Tuần số bao nhiêu: ', `Tuần ${date.week()} năm ${date.year()}`);

// ─── Tính tuổi ────────────────────────────────────────────────────────────────

console.log('\n=== TÍNH TUỔI ===');

function tinhTuoi(ngaySinhStr) {
  const sinh = dayjs(ngaySinhStr);
  const tuoi = now.diff(sinh, 'year');
  const thangTiep = sinh.add(tuoi + 1, 'year'); // sinh nhật tới
  const conLai = thangTiep.diff(now, 'day');
  return { tuoi, ngaySinh: sinh.format('DD/MM/YYYY'), conLai };
}

const nguoiDung = [
  { ten: 'Nguyễn Văn An', sinh: '1990-05-20' },
  { ten: 'Trần Thị Bình', sinh: '1995-12-15' },
  { ten: 'Lê Văn Cường', sinh: '2000-03-08' },
];

nguoiDung.forEach(({ ten, sinh }) => {
  const { tuoi, ngaySinh, conLai } = tinhTuoi(sinh);
  console.log(`${ten}: ${tuoi} tuổi (sinh ${ngaySinh}, còn ${conLai} ngày đến sinh nhật)`);
});

// ─── Cộng / trừ ngày ────────────────────────────────────────────────────────

console.log('\n=== CỘNG/TRỪ NGÀY ===');

const hom_nay = dayjs();
console.log('Hôm nay:       ', hom_nay.format('DD/MM/YYYY'));
console.log('+7 ngày:       ', hom_nay.add(7, 'day').format('DD/MM/YYYY'));
console.log('+1 tháng:      ', hom_nay.add(1, 'month').format('DD/MM/YYYY'));
console.log('+1 năm:        ', hom_nay.add(1, 'year').format('DD/MM/YYYY'));
console.log('-30 ngày:      ', hom_nay.subtract(30, 'day').format('DD/MM/YYYY'));

// Đầu/cuối tháng, tuần
console.log('\nĐầu tháng này:   ', hom_nay.startOf('month').format('DD/MM/YYYY'));
console.log('Cuối tháng này:  ', hom_nay.endOf('month').format('DD/MM/YYYY'));
console.log('Đầu tuần này:    ', hom_nay.startOf('week').format('DD/MM/YYYY'));
console.log('Cuối tuần này:   ', hom_nay.endOf('week').format('DD/MM/YYYY'));

// ─── Diff: Khoảng cách giữa 2 ngày ──────────────────────────────────────────

console.log('\n=== DIFF ===');

const ngayBatDau = dayjs('2024-01-01');
const ngayKetThuc = dayjs('2024-12-31');

console.log(`Từ ${ngayBatDau.format('DD/MM/YYYY')} đến ${ngayKetThuc.format('DD/MM/YYYY')}:`);
console.log('  Số ngày:  ', ngayKetThuc.diff(ngayBatDau, 'day'));
console.log('  Số tuần:  ', ngayKetThuc.diff(ngayBatDau, 'week'));
console.log('  Số tháng: ', ngayKetThuc.diff(ngayBatDau, 'month'));

// ─── Relative time (fromNow) ─────────────────────────────────────────────────

console.log('\n=== RELATIVE TIME ===');

const events = [
  { name: 'Hội nghị Node.js', date: dayjs().subtract(3, 'day') },
  { name: 'Deadline dự án', date: dayjs().subtract(2, 'hour') },
  { name: 'Họp team', date: dayjs().add(30, 'minute') },
  { name: 'Ra mắt sản phẩm', date: dayjs().add(7, 'day') },
  { name: 'Nghỉ Tết', date: dayjs().add(45, 'day') },
];

events.forEach(({ name, date }) => {
  console.log(`  ${name}: ${date.fromNow()} (${date.format('DD/MM/YYYY HH:mm')})`);
});

// ─── isBetween: Kiểm tra ngày trong khoảng ───────────────────────────────────

console.log('\n=== ISBETWEEN ===');

const khuyen_mai_tu = dayjs().subtract(5, 'day');
const khuyen_mai_den = dayjs().add(10, 'day');

const ktra = [
  { ten: 'Đơn hàng A', ngay: dayjs().subtract(10, 'day') },
  { ten: 'Đơn hàng B', ngay: dayjs() },
  { ten: 'Đơn hàng C', ngay: dayjs().add(5, 'day') },
  { ten: 'Đơn hàng D', ngay: dayjs().add(20, 'day') },
];

console.log(`Khuyến mãi từ ${khuyen_mai_tu.format('DD/MM')} đến ${khuyen_mai_den.format('DD/MM')}:`);
ktra.forEach(({ ten, ngay }) => {
  const hopLe = ngay.isBetween(khuyen_mai_tu, khuyen_mai_den, 'day', '[]');
  console.log(`  ${ten} (${ngay.format('DD/MM')}): ${hopLe ? '✓ Được giảm giá' : '✗ Ngoài thời gian KM'}`);
});

// ─── Duration: khoảng thời gian ──────────────────────────────────────────────

console.log('\n=== DURATION ===');

const duration1 = dayjs.duration(90, 'minutes');
console.log('90 phút =', duration1.hours(), 'giờ', duration1.minutes(), 'phút');

const duration2 = dayjs.duration({ days: 1, hours: 3, minutes: 30 });
console.log('1 ngày 3 giờ 30 phút =', duration2.asHours().toFixed(1), 'giờ');

// ─── Ứng dụng thực tế: Lịch làm việc ────────────────────────────────────────

console.log('\n=== ỨNG DỤNG: LỊCH LÀM VIỆC ===');

function tinhNgayLamViec(tuNgay, soNgay) {
  const ngayNghi = [0, 6]; // Chủ nhật = 0, Thứ 7 = 6
  let ngayHienTai = dayjs(tuNgay);
  let demNgay = 0;

  while (demNgay < soNgay) {
    ngayHienTai = ngayHienTai.add(1, 'day');
    if (!ngayNghi.includes(ngayHienTai.day())) {
      demNgay++;
    }
  }
  return ngayHienTai;
}

const batDauDuAn = dayjs();
const deadline = tinhNgayLamViec(batDauDuAn, 20); // 20 ngày làm việc
console.log(`Bắt đầu: ${batDauDuAn.format('DD/MM/YYYY (dddd)')}`);
console.log(`Deadline (20 ngày làm việc): ${deadline.format('DD/MM/YYYY (dddd)')}`);
console.log(`Còn ${deadline.diff(batDauDuAn, 'day')} ngày lịch`);
