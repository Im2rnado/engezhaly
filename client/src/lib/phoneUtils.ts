import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function getCountryName(code: string): string {
  try {
    return regionNames?.of(code) || code;
  } catch {
    return code;
  }
}

/** Returns flag emoji from ISO country code (e.g. EG -> 🇪🇬) */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  return countryCode
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('');
}

const _all = getCountries()
  .map((code) => ({
    code: code as CountryCode,
    name: getCountryName(code),
    callingCode: getCountryCallingCode(code as CountryCode),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Egypt first (app default), then alphabetical
export const PHONE_COUNTRIES: { code: CountryCode; name: string; callingCode: string }[] = [
  ..._all.filter((c) => c.code === 'EG'),
  ..._all.filter((c) => c.code !== 'EG'),
];

/** Egyptian mobile: exactly 11 digits, national format 01xxxxxxxxx */
const EG_MOBILE_NATIONAL = /^01\d{9}$/;

export function validatePhone(nationalNumber: string, countryCode: CountryCode): boolean {
  const trimmed = (nationalNumber || '').replace(/\D/g, '');
  if (!trimmed) return false;
  if (countryCode === 'EG') {
    return EG_MOBILE_NATIONAL.test(trimmed);
  }
  const callingCode = getCountryCallingCode(countryCode);
  const full = `+${callingCode}${trimmed.replace(/^0+/, '')}`;
  const parsed = parsePhoneNumberFromString(full, countryCode);
  return !!parsed?.isValid();
}

export function formatPhoneE164(nationalNumber: string, countryCode: CountryCode): string | null {
  const digits = (nationalNumber || '').replace(/\D/g, '');
  if (!digits) return null;
  if (countryCode === 'EG') {
    if (!EG_MOBILE_NATIONAL.test(digits)) return null;
    return `+20${digits.slice(1)}`;
  }
  const callingCode = getCountryCallingCode(countryCode);
  const full = `+${callingCode}${digits.replace(/^0+/, '')}`;
  const parsed = parsePhoneNumberFromString(full, countryCode);
  return parsed?.isValid() ? parsed.format('E.164') : null;
}

/** Display stored E.164 Egyptian numbers as 01… national (11 digits). */
export function formatEgyptianPhoneForDisplay(stored: string | undefined | null): string {
  if (!stored) return '';
  const s = stored.replace(/\s/g, '');
  if (/^\+20\d{10}$/.test(s)) return `0${s.slice(3)}`;
  return stored;
}

/** Prefill national input from stored +20… value */
export function e164ToEgyptianNationalInput(stored: string | undefined | null): string {
  return formatEgyptianPhoneForDisplay(stored);
}
