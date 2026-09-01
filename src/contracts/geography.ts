/**
 * The canonical country / subdivision list behind every location row.
 *
 * Locations are reference data: they populate the dropdowns on brand, creator
 * and campaign forms, and they are filtered on. Free text made that unreliable —
 * "Kerala", "KERALA" and "kerala" are three different values to a filter but one
 * place to a person. So the pair is constrained to this list on both sides: the
 * client offers only these, and `location.contract` rejects anything else.
 *
 * Only countries whose subdivisions are listed here can be selected. Adding a
 * country means adding its subdivisions too — a country with no list would put
 * the free-text problem straight back.
 */

export const DEFAULT_COUNTRY = 'India';

/** 28 states followed by the 8 union territories. */
const INDIA = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

const UAE = [
  'Abu Dhabi',
  'Ajman',
  'Dubai',
  'Fujairah',
  'Ras Al Khaimah',
  'Sharjah',
  'Umm Al Quwain',
];

const SAUDI_ARABIA = [
  'Al Bahah',
  'Al Jawf',
  'Asir',
  'Eastern Province',
  'Hail',
  'Jazan',
  'Madinah',
  'Makkah',
  'Najran',
  'Northern Borders',
  'Qassim',
  'Riyadh',
  'Tabuk',
];

const QATAR = [
  'Al Daayen',
  'Al Khor',
  'Al Rayyan',
  'Al Shahaniya',
  'Al Shamal',
  'Al Wakrah',
  'Doha',
  'Umm Salal',
];

const OMAN = [
  'Ad Dakhiliyah',
  'Ad Dhahirah',
  'Al Batinah North',
  'Al Batinah South',
  'Al Buraimi',
  'Al Wusta',
  'Ash Sharqiyah North',
  'Ash Sharqiyah South',
  'Dhofar',
  'Musandam',
  'Muscat',
];

const KUWAIT = ['Ahmadi', 'Al Asimah', 'Farwaniya', 'Hawalli', 'Jahra', 'Mubarak Al-Kabeer'];

const BAHRAIN = ['Capital', 'Muharraq', 'Northern', 'Southern'];

const SINGAPORE = ['Central', 'East', 'North', 'North-East', 'West'];

const UNITED_KINGDOM = ['England', 'Northern Ireland', 'Scotland', 'Wales'];

const UNITED_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

const CANADA = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
];

const AUSTRALIA = [
  'Australian Capital Territory',
  'New South Wales',
  'Northern Territory',
  'Queensland',
  'South Australia',
  'Tasmania',
  'Victoria',
  'Western Australia',
];

const SRI_LANKA = [
  'Central',
  'Eastern',
  'North Central',
  'North Western',
  'Northern',
  'Sabaragamuwa',
  'Southern',
  'Uva',
  'Western',
];

const NEPAL = ['Bagmati', 'Gandaki', 'Karnali', 'Koshi', 'Lumbini', 'Madhesh', 'Sudurpashchim'];

/** Country -> its states, provinces, emirates or governorates. */
export const SUBDIVISIONS_BY_COUNTRY: Readonly<Record<string, readonly string[]>> = {
  India: INDIA,
  'United Arab Emirates': UAE,
  'Saudi Arabia': SAUDI_ARABIA,
  Qatar: QATAR,
  Oman: OMAN,
  Kuwait: KUWAIT,
  Bahrain: BAHRAIN,
  Singapore: SINGAPORE,
  'Sri Lanka': SRI_LANKA,
  Nepal: NEPAL,
  'United Kingdom': UNITED_KINGDOM,
  'United States': UNITED_STATES,
  Canada: CANADA,
  Australia: AUSTRALIA,
};

/** India first — it is the default and covers nearly every row — then A-Z. */
export const COUNTRIES: readonly string[] = [
  DEFAULT_COUNTRY,
  ...Object.keys(SUBDIVISIONS_BY_COUNTRY)
    .filter((c) => c !== DEFAULT_COUNTRY)
    .sort((a, b) => a.localeCompare(b)),
];

export function isKnownCountry(country: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUBDIVISIONS_BY_COUNTRY, country);
}

/** Subdivisions of one country, or an empty list when the country is unknown. */
export function subdivisionsOf(country: string): readonly string[] {
  return SUBDIVISIONS_BY_COUNTRY[country] ?? [];
}

export function isSubdivisionOf(country: string, subdivision: string): boolean {
  return subdivisionsOf(country).includes(subdivision);
}

/**
 * Every subdivision name across every country. A PATCH can change the state
 * without naming a country, so the schema can only check membership here; the
 * country pairing is settled against the stored row in the use case.
 */
export const ALL_SUBDIVISIONS: readonly string[] = Array.from(
  new Set(Object.values(SUBDIVISIONS_BY_COUNTRY).flat()),
);

export function isKnownSubdivision(subdivision: string): boolean {
  return ALL_SUBDIVISIONS.includes(subdivision);
}
