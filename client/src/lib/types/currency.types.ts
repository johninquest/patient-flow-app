export interface CountryCurrency {
    country: string; // Full name for display
    code: string; // ISO 3166-1 alpha-3 code
    currencyCode: string; // Currency code (e.g., 'XAF')
    symbol: string;
}

export const COUNTRY_CURRENCIES: CountryCurrency[] = [
    { country: 'Algeria', code: 'DZA', currencyCode: 'DZD', symbol: 'دج' },
    { country: 'Angola', code: 'AGO', currencyCode: 'AOA', symbol: 'Kz' },
    { country: 'Benin', code: 'BEN', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Botswana', code: 'BWA', currencyCode: 'BWP', symbol: 'P' },
    { country: 'Burkina Faso', code: 'BFA', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Burundi', code: 'BDI', currencyCode: 'BIF', symbol: 'FBu' },
    { country: 'Cameroon', code: 'CMR', currencyCode: 'XAF', symbol: 'FCFA' },
    { country: 'Cape Verde', code: 'CPV', currencyCode: 'CVE', symbol: 'Esc' },
    { country: 'Central African Republic', code: 'CAF', currencyCode: 'XAF', symbol: 'FCFA' },
    { country: 'Chad', code: 'TCD', currencyCode: 'XAF', symbol: 'FCFA' },
    { country: 'Comoros', code: 'COM', currencyCode: 'KMF', symbol: 'CF' },
    { country: 'Congo (Brazzaville)', code: 'COG', currencyCode: 'XAF', symbol: 'FCFA' },
    { country: 'Congo (DRC)', code: 'COD', currencyCode: 'CDF', symbol: 'FC' },
    { country: 'Djibouti', code: 'DJI', currencyCode: 'DJF', symbol: 'Fdj' },
    { country: 'Egypt', code: 'EGY', currencyCode: 'EGP', symbol: 'E£' },
    { country: 'Equatorial Guinea', code: 'GNQ', currencyCode: 'XAF', symbol: 'FCFA' },
    { country: 'Eritrea', code: 'ERI', currencyCode: 'ERN', symbol: 'Nfk' },
    { country: 'Eswatini', code: 'SWZ', currencyCode: 'SZL', symbol: 'E' },
    { country: 'Ethiopia', code: 'ETH', currencyCode: 'ETB', symbol: 'Br' },
    { country: 'Gabon', code: 'GAB', currencyCode: 'XAF', symbol: 'FCFA' },
    { country: 'Gambia', code: 'GMB', currencyCode: 'GMD', symbol: 'D' },
    { country: 'Ghana', code: 'GHA', currencyCode: 'GHS', symbol: 'GH₵' },
    { country: 'Guinea', code: 'GIN', currencyCode: 'GNF', symbol: 'FG' },
    { country: 'Guinea-Bissau', code: 'GNB', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Ivory Coast', code: 'CIV', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Kenya', code: 'KEN', currencyCode: 'KES', symbol: 'KSh' },
    { country: 'Lesotho', code: 'LSO', currencyCode: 'LSL', symbol: 'L' },
    { country: 'Liberia', code: 'LBR', currencyCode: 'LRD', symbol: 'L$' },
    { country: 'Libya', code: 'LBY', currencyCode: 'LYD', symbol: 'ل.د' },
    { country: 'Madagascar', code: 'MDG', currencyCode: 'MGA', symbol: 'Ar' },
    { country: 'Malawi', code: 'MWI', currencyCode: 'MWK', symbol: 'MK' },
    { country: 'Mali', code: 'MLI', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Mauritania', code: 'MRT', currencyCode: 'MRU', symbol: 'UM' },
    { country: 'Mauritius', code: 'MUS', currencyCode: 'MUR', symbol: '₨' },
    { country: 'Morocco', code: 'MAR', currencyCode: 'MAD', symbol: 'د.م.' },
    { country: 'Mozambique', code: 'MOZ', currencyCode: 'MZN', symbol: 'MT' },
    { country: 'Namibia', code: 'NAM', currencyCode: 'NAD', symbol: '$' },
    { country: 'Niger', code: 'NER', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Nigeria', code: 'NGA', currencyCode: 'NGN', symbol: '₦' },
    { country: 'Rwanda', code: 'RWA', currencyCode: 'RWF', symbol: 'FRw' },
    { country: 'Sao Tome and Principe', code: 'STP', currencyCode: 'STN', symbol: 'Db' },
    { country: 'Senegal', code: 'SEN', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Seychelles', code: 'SYC', currencyCode: 'SCR', symbol: '₨' },
    { country: 'Sierra Leone', code: 'SLE', currencyCode: 'SLE', symbol: 'Le' },
    { country: 'Somalia', code: 'SOM', currencyCode: 'SOS', symbol: 'Sh' },
    { country: 'South Africa', code: 'ZAF', currencyCode: 'ZAR', symbol: 'R' },
    { country: 'South Sudan', code: 'SSD', currencyCode: 'SSP', symbol: '£' },
    { country: 'Sudan', code: 'SDN', currencyCode: 'SDG', symbol: 'ج.س.' },
    { country: 'Tanzania', code: 'TZA', currencyCode: 'TZS', symbol: 'Sh' },
    { country: 'Togo', code: 'TGO', currencyCode: 'XOF', symbol: 'FCFA' },
    { country: 'Tunisia', code: 'TUN', currencyCode: 'TND', symbol: 'د.ت' },
    { country: 'Uganda', code: 'UGA', currencyCode: 'UGX', symbol: 'USh' },
    { country: 'Zambia', code: 'ZMB', currencyCode: 'ZMW', symbol: 'ZK' },
    { country: 'Zimbabwe', code: 'ZWE', currencyCode: 'ZWL', symbol: 'Z$' },
];

// Map from country code (ISO 3166-1 alpha-3) to currency
export const countryCodeToCurrency: Record<string, string> = Object.fromEntries(
    COUNTRY_CURRENCIES.map((c) => [c.code, c.currencyCode])
);

// Map from country name to country code (for migration)
export const countryNameToCode: Record<string, string> = Object.fromEntries(
    COUNTRY_CURRENCIES.map((c) => [c.country, c.code])
);

// Map from country code to country name (for display)
export const countryCodeToName: Record<string, string> = Object.fromEntries(
    COUNTRY_CURRENCIES.map((c) => [c.code, c.country])
);

export const supportedCountries = COUNTRY_CURRENCIES.map((c) => c.country);

/**
 * Get currency code from country code (ISO 3166-1 alpha-3)
 */
export function getCurrencyForCountryCode(countryCode: string): string {
    return countryCodeToCurrency[countryCode] ?? 'USD';
}

/**
 * Get currency info from country code (ISO 3166-1 alpha-3)
 */
export function getCurrencyByCountryCode(countryCode: string): CountryCurrency | undefined {
    return COUNTRY_CURRENCIES.find((c) => c.code === countryCode);
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
    return countryCodeToName[countryCode] ?? countryCode;
}

/**
 * Get country code from country name
 */
export function getCountryCode(countryName: string): string {
    return countryNameToCode[countryName] ?? countryName;
}

/**
 * Legacy function - now uses country code
 * @deprecated Use getCurrencyByCountryCode instead
 */
export function getCurrencyByCountry(country: string): CountryCurrency | undefined {
    // Check if it's already a country code
    if (country.length === 3 && country === country.toUpperCase()) {
        return getCurrencyByCountryCode(country);
    }
    // Otherwise treat as country name
    const code = getCountryCode(country);
    return getCurrencyByCountryCode(code);
}

export function getCurrencySymbol(countryCode: string): string {
    const currency = getCurrencyByCountryCode(countryCode);
    return currency?.symbol ?? '$';
}

export function getCountryList(): string[] {
    return COUNTRY_CURRENCIES.map((c) => c.country);
}

export function getCountryCodeList(): { code: string; name: string }[] {
    return COUNTRY_CURRENCIES.map((c) => ({ code: c.code, name: c.country }));
}

export function formatCurrency(amount: number, countryCode: string): string {
    const currencyCode = getCurrencyForCountryCode(countryCode);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
    }).format(amount);
}