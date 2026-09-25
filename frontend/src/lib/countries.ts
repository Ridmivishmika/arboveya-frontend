export interface CountryInfo {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
  formatHint: string;
  region: 'Europe' | 'North America' | 'South America' | 'Oceania';
}

/**
 * Curated list of allowed buyer countries.
 * Exclusively includes Europe, North America, South America, and Oceania.
 * Strictly excludes Asian and African countries.
 */
export const ALLOWED_BUYER_COUNTRIES: CountryInfo[] = [
  // North America
  {
    name: 'United States',
    code: 'US',
    dialCode: '+1',
    flag: '🇺🇸',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '202 555 0199',
    formatHint: '10 digits (e.g. 202 555 0199)',
    region: 'North America'
  },
  {
    name: 'Canada',
    code: 'CA',
    dialCode: '+1',
    flag: '🇨🇦',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '416 555 0199',
    formatHint: '10 digits (e.g. 416 555 0199)',
    region: 'North America'
  },
  {
    name: 'Mexico',
    code: 'MX',
    dialCode: '+52',
    flag: '🇲🇽',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '55 1234 5678',
    formatHint: '10 digits (e.g. 55 1234 5678)',
    region: 'North America'
  },

  // Europe
  {
    name: 'United Kingdom',
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    minDigits: 10,
    maxDigits: 11,
    placeholder: '7911 123456',
    formatHint: '10-11 digits (e.g. 7911 123456)',
    region: 'Europe'
  },
  {
    name: 'Germany',
    code: 'DE',
    dialCode: '+49',
    flag: '🇩🇪',
    minDigits: 10,
    maxDigits: 11,
    placeholder: '151 23456789',
    formatHint: '10-11 digits (e.g. 151 23456789)',
    region: 'Europe'
  },
  {
    name: 'France',
    code: 'FR',
    dialCode: '+33',
    flag: '🇫🇷',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '6 12 34 56 78',
    formatHint: '9 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Italy',
    code: 'IT',
    dialCode: '+39',
    flag: '🇮🇹',
    minDigits: 9,
    maxDigits: 10,
    placeholder: '312 3456789',
    formatHint: '9-10 digits',
    region: 'Europe'
  },
  {
    name: 'Spain',
    code: 'ES',
    dialCode: '+34',
    flag: '🇪🇸',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '612 345 678',
    formatHint: '9 digits (e.g. 612 345 678)',
    region: 'Europe'
  },
  {
    name: 'Netherlands',
    code: 'NL',
    dialCode: '+31',
    flag: '🇳🇱',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '6 12345678',
    formatHint: '9 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Switzerland',
    code: 'CH',
    dialCode: '+41',
    flag: '🇨🇭',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '79 123 45 67',
    formatHint: '9 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Sweden',
    code: 'SE',
    dialCode: '+46',
    flag: '🇸🇪',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '70 123 45 67',
    formatHint: '9 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Norway',
    code: 'NO',
    dialCode: '+47',
    flag: '🇳🇴',
    minDigits: 8,
    maxDigits: 8,
    placeholder: '412 34 567',
    formatHint: '8 digits',
    region: 'Europe'
  },
  {
    name: 'Denmark',
    code: 'DK',
    dialCode: '+45',
    flag: '🇩🇰',
    minDigits: 8,
    maxDigits: 8,
    placeholder: '20 12 34 56',
    formatHint: '8 digits',
    region: 'Europe'
  },
  {
    name: 'Finland',
    code: 'FI',
    dialCode: '+358',
    flag: '🇫🇮',
    minDigits: 9,
    maxDigits: 10,
    placeholder: '40 123 4567',
    formatHint: '9-10 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Ireland',
    code: 'IE',
    dialCode: '+353',
    flag: '🇮🇪',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '85 123 4567',
    formatHint: '9 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Belgium',
    code: 'BE',
    dialCode: '+32',
    flag: '🇧🇪',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '470 12 34 56',
    formatHint: '9 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Austria',
    code: 'AT',
    dialCode: '+43',
    flag: '🇦🇹',
    minDigits: 10,
    maxDigits: 11,
    placeholder: '664 1234567',
    formatHint: '10-11 digits without leading 0',
    region: 'Europe'
  },
  {
    name: 'Portugal',
    code: 'PT',
    dialCode: '+351',
    flag: '🇵🇹',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '912 345 678',
    formatHint: '9 digits (e.g. 912 345 678)',
    region: 'Europe'
  },
  {
    name: 'Poland',
    code: 'PL',
    dialCode: '+48',
    flag: '🇵🇱',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '512 345 678',
    formatHint: '9 digits (e.g. 512 345 678)',
    region: 'Europe'
  },
  {
    name: 'Greece',
    code: 'GR',
    dialCode: '+30',
    flag: '🇬🇷',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '691 234 5678',
    formatHint: '10 digits (e.g. 691 234 5678)',
    region: 'Europe'
  },

  // Oceania
  {
    name: 'Australia',
    code: 'AU',
    dialCode: '+61',
    flag: '🇦🇺',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '412 345 678',
    formatHint: '9 digits without leading 0 (e.g. 412 345 678)',
    region: 'Oceania'
  },
  {
    name: 'New Zealand',
    code: 'NZ',
    dialCode: '+64',
    flag: '🇳🇿',
    minDigits: 8,
    maxDigits: 10,
    placeholder: '21 123 4567',
    formatHint: '8-10 digits without leading 0',
    region: 'Oceania'
  },

  // South America
  {
    name: 'Brazil',
    code: 'BR',
    dialCode: '+55',
    flag: '🇧🇷',
    minDigits: 10,
    maxDigits: 11,
    placeholder: '11 91234 5678',
    formatHint: '10-11 digits (e.g. 11 91234 5678)',
    region: 'South America'
  },
  {
    name: 'Argentina',
    code: 'AR',
    dialCode: '+54',
    flag: '🇦🇷',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '11 2345 6789',
    formatHint: '10 digits area + local number',
    region: 'South America'
  },
  {
    name: 'Chile',
    code: 'CL',
    dialCode: '+56',
    flag: '🇨🇱',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '9 1234 5678',
    formatHint: '9 digits (e.g. 9 1234 5678)',
    region: 'South America'
  },
  {
    name: 'Colombia',
    code: 'CO',
    dialCode: '+57',
    flag: '🇨🇴',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '300 123 4567',
    formatHint: '10 digits (e.g. 300 123 4567)',
    region: 'South America'
  },
  {
    name: 'Peru',
    code: 'PE',
    dialCode: '+51',
    flag: '🇵🇪',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '912 345 678',
    formatHint: '9 digits (e.g. 912 345 678)',
    region: 'South America'
  }
];

export const DEFAULT_COUNTRY = ALLOWED_BUYER_COUNTRIES[0]; // United States

/**
 * Returns country info for a given country name or country code.
 */
export function getCountryByNameOrCode(query?: string | null): CountryInfo {
  if (!query) return DEFAULT_COUNTRY;
  const clean = query.trim().toLowerCase();
  const found = ALLOWED_BUYER_COUNTRIES.find(
    (c) => c.name.toLowerCase() === clean || c.code.toLowerCase() === clean
  );
  return found || DEFAULT_COUNTRY;
}

/**
 * Validates a local phone number against country specifications.
 */
export function validatePhoneNumber(country: CountryInfo, localNumber: string): {
  isValid: boolean;
  message?: string;
  cleanedNumber: string;
  fullInternationalNumber: string;
} {
  // Strip out spaces, hyphens, parentheses, and any leading plus or zero
  let digits = localNumber.replace(/\D/g, '');

  // Strip country calling code if user typed it again
  const dialDigits = country.dialCode.replace(/\D/g, '');
  if (digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  // Strip leading national trunk prefix 0 (common in UK, Australia, Europe)
  if (digits.startsWith('0') && country.dialCode !== '+1') {
    digits = digits.slice(1);
  }

  if (!digits) {
    return {
      isValid: false,
      message: `Phone number is required for ${country.name}.`,
      cleanedNumber: '',
      fullInternationalNumber: ''
    };
  }

  if (digits.length < country.minDigits) {
    return {
      isValid: false,
      message: `${country.name} phone number requires at least ${country.minDigits} digits (${country.formatHint}). Currently ${digits.length} digit(s).`,
      cleanedNumber: digits,
      fullInternationalNumber: `${country.dialCode} ${digits}`
    };
  }

  if (digits.length > country.maxDigits) {
    return {
      isValid: false,
      message: `${country.name} phone number cannot exceed ${country.maxDigits} digits (${country.formatHint}). Currently ${digits.length} digit(s).`,
      cleanedNumber: digits,
      fullInternationalNumber: `${country.dialCode} ${digits}`
    };
  }

  return {
    isValid: true,
    cleanedNumber: digits,
    fullInternationalNumber: `${country.dialCode} ${digits}`
  };
}
