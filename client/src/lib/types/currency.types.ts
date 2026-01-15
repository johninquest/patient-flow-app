export interface CountryCurrency {
    country: string;
    code: string;
    symbol: string;
}

export const COUNTRY_CURRENCIES: CountryCurrency[] = [
    // North Africa
    { country: 'Algeria', code: 'DZD', symbol: 'دج' },
    { country: 'Egypt', code: 'EGP', symbol: 'E£' },
    { country: 'Libya', code: 'LYD', symbol: 'ل.د' },
    { country: 'Morocco', code: 'MAD', symbol: 'د.م.' },
    { country: 'Sudan', code: 'SDG', symbol: 'ج.س.' },
    { country: 'Tunisia', code: 'TND', symbol: 'د.ت' },

    // West Africa
    { country: 'Benin', code: 'XOF', symbol: 'FCFA' },
    { country: 'Burkina Faso', code: 'XOF', symbol: 'FCFA' },
    { country: 'Cape Verde', code: 'CVE', symbol: 'Esc' },
    { country: 'Gambia', code: 'GMD', symbol: 'D' },
    { country: 'Ghana', code: 'GHS', symbol: 'GH₵' },
    { country: 'Guinea', code: 'GNF', symbol: 'FG' },
    { country: 'Guinea-Bissau', code: 'XOF', symbol: 'FCFA' },
    { country: 'Ivory Coast', code: 'XOF', symbol: 'FCFA' },
    { country: 'Liberia', code: 'LRD', symbol: 'L$' },
    { country: 'Mali', code: 'XOF', symbol: 'FCFA' },
    { country: 'Mauritania', code: 'MRU', symbol: 'UM' },
    { country: 'Niger', code: 'XOF', symbol: 'FCFA' },
    { country: 'Nigeria', code: 'NGN', symbol: '₦' },
    { country: 'Senegal', code: 'XOF', symbol: 'FCFA' },
    { country: 'Sierra Leone', code: 'SLE', symbol: 'Le' },
    { country: 'Togo', code: 'XOF', symbol: 'FCFA' },
    // Central Africa
    { country: 'Cameroon', code: 'XAF', symbol: 'FCFA' },
    { country: 'Central African Republic', code: 'XAF', symbol: 'FCFA' },
    { country: 'Chad', code: 'XAF', symbol: 'FCFA' },
    { country: 'Congo (Brazzaville)', code: 'XAF', symbol: 'FCFA' },
    { country: 'Congo (DRC)', code: 'CDF', symbol: 'FC' },
    { country: 'Equatorial Guinea', code: 'XAF', symbol: 'FCFA' },
    { country: 'Gabon', code: 'XAF', symbol: 'FCFA' },
    { country: 'Sao Tome and Principe', code: 'STN', symbol: 'Db' },

    // East Africa
    { country: 'Burundi', code: 'BIF', symbol: 'FBu' },
    { country: 'Comoros', code: 'KMF', symbol: 'CF' },
    { country: 'Djibouti', code: 'DJF', symbol: 'Fdj' },
    { country: 'Eritrea', code: 'ERN', symbol: 'Nfk' },
    { country: 'Ethiopia', code: 'ETB', symbol: 'Br' },
    { country: 'Kenya', code: 'KES', symbol: 'KSh' },
    { country: 'Madagascar', code: 'MGA', symbol: 'Ar' },
    { country: 'Malawi', code: 'MWK', symbol: 'MK' },
    { country: 'Mauritius', code: 'MUR', symbol: '₨' },
    { country: 'Mozambique', code: 'MZN', symbol: 'MT' },
    { country: 'Rwanda', code: 'RWF', symbol: 'FRw' },
    { country: 'Seychelles', code: 'SCR', symbol: '₨' },
    { country: 'Somalia', code: 'SOS', symbol: 'Sh' },
    { country: 'South Sudan', code: 'SSP', symbol: '£' },
    { country: 'Tanzania', code: 'TZS', symbol: 'Sh' },
    { country: 'Uganda', code: 'UGX', symbol: 'USh' },

    // Southern Africa
    { country: 'Angola', code: 'AOA', symbol: 'Kz' },
    { country: 'Botswana', code: 'BWP', symbol: 'P' },
    { country: 'Eswatini', code: 'SZL', symbol: 'E' },
    { country: 'Lesotho', code: 'LSL', symbol: 'L' },
    { country: 'Namibia', code: 'NAD', symbol: '$' },
    { country: 'South Africa', code: 'ZAR', symbol: 'R' },
    { country: 'Zambia', code: 'ZMW', symbol: 'ZK' },
    { country: 'Zimbabwe', code: 'ZWL', symbol: 'Z$' },
];

export const countryCurrencyMap: Record<string, string> = Object.fromEntries(
    COUNTRY_CURRENCIES.map((c) => [c.country, c.code])
);

export const supportedCountries = COUNTRY_CURRENCIES.map((c) => c.country);

export function getCurrencyForCountry(country: string): string {
    return countryCurrencyMap[country] ?? 'USD';
}

export function getCurrencyByCountry(country: string): CountryCurrency | undefined {
    return COUNTRY_CURRENCIES.find((c) => c.country === country);
}

export function getCurrencySymbol(country: string): string {
    const currency = COUNTRY_CURRENCIES.find((c) => c.country === country);
    return currency?.symbol ?? '$';
}

export function getCountryList(): string[] {
    return COUNTRY_CURRENCIES.map((c) => c.country);
}

export function formatCurrency(amount: number, country: string): string {
    const currency = getCurrencyForCountry(country);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}