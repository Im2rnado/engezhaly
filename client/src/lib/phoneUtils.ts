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

export function validatePhone(nationalNumber: string, countryCode: CountryCode): boolean {
  const trimmed = (nationalNumber || '').replace(/\s/g, '').trim();
  if (!trimmed) return false;
  const callingCode = getCountryCallingCode(countryCode);
  const full = `+${callingCode}${trimmed.replace(/^0+/, '')}`;
  const parsed = parsePhoneNumberFromString(full, countryCode);
  return !!parsed?.isValid();
}

export function formatPhoneE164(nationalNumber: string, countryCode: CountryCode): string | null {
  const trimmed = (nationalNumber || '').replace(/\s/g, '').trim();
  if (!trimmed) return null;
  const callingCode = getCountryCallingCode(countryCode);
  const full = `+${callingCode}${trimmed.replace(/^0+/, '')}`;
  const parsed = parsePhoneNumberFromString(full, countryCode);
  return parsed?.isValid() ? parsed.format('E.164') : null;
}
