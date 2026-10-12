import type { AppLanguage } from '../../i18n/types';

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah',
];

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

const DAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GREG_MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const GREG_MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function getHijriDate(language: AppLanguage = 'ar'): { day: number; month: string; year: number; monthIndex: number; fullDate: string } {
  const gregorianDate = new Date();
  const year = gregorianDate.getFullYear();
  const month = gregorianDate.getMonth() + 1;
  const day = gregorianDate.getDate();

  let jdn: number;
  if (month <= 2) {
    jdn = Math.floor(365.25 * (year - 1)) + Math.floor(30.6001 * (month + 12 + 1)) + day + 1720994.5;
  } else {
    jdn = Math.floor(365.25 * year) + Math.floor(30.6001 * (month + 1)) + day + 1720994.5;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  jdn += b;

  const hijriEpoch = 1948439.5;
  const daysSinceEpoch = Math.floor(jdn - hijriEpoch);

  let low = 1;
  let high = 2000;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    let days = 0;
    for (let hy = 1; hy < mid; hy++) {
      const cyclePos = (hy - 1) % 30;
      const leapPositions = [1, 4, 6, 9, 12, 15, 17, 20, 23, 25, 28];
      days += leapPositions.includes(cyclePos) ? 355 : 354;
    }
    if (days <= daysSinceEpoch) low = mid + 1;
    else high = mid;
  }
  const hijriYear = low - 1;

  let totalDays = 0;
  for (let hy = 1; hy < hijriYear; hy++) {
    const cyclePos = (hy - 1) % 30;
    const leapPositions = [1, 4, 6, 9, 12, 15, 17, 20, 23, 25, 28];
    totalDays += leapPositions.includes(cyclePos) ? 355 : 354;
  }

  const remainingDays = daysSinceEpoch - totalDays;
  const cyclePos = (hijriYear - 1) % 30;
  const leapPositions = [1, 4, 6, 9, 12, 15, 17, 20, 23, 25, 28];
  const isLeapYear = leapPositions.includes(cyclePos);
  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, isLeapYear ? 30 : 29];

  let hijriMonth = 1;
  let monthDays = 0;
  for (let i = 0; i < 12; i++) {
    if (monthDays + monthLengths[i] > remainingDays) {
      hijriMonth = i + 1;
      break;
    }
    monthDays += monthLengths[i];
  }

  let hijriDay = remainingDays - monthDays + 1;
  if (hijriDay < 1) hijriDay = 1;
  const maxDay = monthLengths[hijriMonth - 1];
  if (hijriDay > maxDay) hijriDay = maxDay;

  const monthNames = language === 'en' ? HIJRI_MONTHS_EN : HIJRI_MONTHS_AR;

  const monthName = monthNames[hijriMonth - 1];
  const hijriSuffix = language === 'en' ? 'AH' : 'هـ';
  return {
    day: hijriDay,
    month: monthName,
    year: hijriYear,
    monthIndex: hijriMonth - 1,
    fullDate: `${hijriDay} ${monthName} ${hijriYear} ${hijriSuffix}`,
  };
}

export function getDayName(language: AppLanguage = 'ar', date: Date = new Date()): string {
  const names = language === 'en' ? DAY_NAMES_EN : DAY_NAMES_AR;
  return names[date.getDay()];
}

export function getGregorianDate(language: AppLanguage = 'ar', date: Date = new Date()): string {
  const months = language === 'en' ? GREG_MONTHS_EN : GREG_MONTHS_AR;
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
