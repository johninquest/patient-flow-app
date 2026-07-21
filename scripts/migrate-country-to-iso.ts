/**
 * Data Migration: Convert free-text country values to ISO 3166-1 alpha-2 codes
 * 
 * This script migrates existing patient records from free-text country values
 * (e.g., "France", "United States") to standardized ISO codes (e.g., "FR", "US").
 * 
 * Fields migrated:
 * - patients.address.country
 * - patients.identity.country_national
 * 
 * Usage:
 *   npx ts-node scripts/migrate-country-to-iso.ts
 * 
 * Options:
 *   --dry-run    Preview changes without updating the database
 *   --verbose    Show detailed output for each record
 * 
 * Rollback:
 *   This script creates a backup table `patients_country_backup` before migration.
 *   To rollback: UPDATE patients p SET address = b.address, identity = b.identity
 *                 FROM patients_country_backup b WHERE p.id = b.id;
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../api/src/core/db/schema';

// Country name to ISO code mapping (English + French)
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  // English names
  'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'andorra': 'AD', 'angola': 'AO',
  'argentina': 'AR', 'armenia': 'AM', 'australia': 'AU', 'austria': 'AT', 'azerbaijan': 'AZ',
  'bahamas': 'BS', 'bahrain': 'BH', 'bangladesh': 'BD', 'barbados': 'BB', 'belarus': 'BY',
  'belgium': 'BE', 'belize': 'BZ', 'benin': 'BJ', 'bhutan': 'BT', 'bolivia': 'BO',
  'bosnia and herzegovina': 'BA', 'botswana': 'BW', 'brazil': 'BR', 'brunei': 'BN',
  'bulgaria': 'BG', 'burkina faso': 'BF', 'burundi': 'BI', 'cambodia': 'KH', 'cameroon': 'CM',
  'canada': 'CA', 'cape verde': 'CV', 'central african republic': 'CF', 'chad': 'TD',
  'chile': 'CL', 'china': 'CN', 'colombia': 'CO', 'comoros': 'KM', 'congo': 'CG',
  'costa rica': 'CR', 'croatia': 'HR', 'cuba': 'CU', 'cyprus': 'CY', 'czech republic': 'CZ',
  'czechia': 'CZ', 'denmark': 'DK', 'djibouti': 'DJ', 'dominica': 'DM', 'dominican republic': 'DO',
  'dr congo': 'CD', 'ecuador': 'EC', 'egypt': 'EG', 'el salvador': 'SV', 'equatorial guinea': 'GQ',
  'eritrea': 'ER', 'estonia': 'EE', 'eswatini': 'SZ', 'ethiopia': 'ET', 'fiji': 'FJ',
  'finland': 'FI', 'france': 'FR', 'gabon': 'GA', 'gambia': 'GM', 'georgia': 'GE',
  'germany': 'DE', 'ghana': 'GH', 'greece': 'GR', 'grenada': 'GD', 'guatemala': 'GT',
  'guinea': 'GN', 'guinea-bissau': 'GW', 'guyana': 'GY', 'haiti': 'HT', 'honduras': 'HN',
  'hungary': 'HU', 'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID', 'iran': 'IR',
  'iraq': 'IQ', 'ireland': 'IE', 'israel': 'IL', 'italy': 'IT', 'ivory coast': 'CI',
  'jamaica': 'JM', 'japan': 'JP', 'jordan': 'JO', 'kazakhstan': 'KZ', 'kenya': 'KE',
  'kiribati': 'KI', 'kuwait': 'KW', 'kyrgyzstan': 'KG', 'laos': 'LA', 'latvia': 'LV',
  'lebanon': 'LB', 'lesotho': 'LS', 'liberia': 'LR', 'libya': 'LY', 'liechtenstein': 'LI',
  'lithuania': 'LT', 'luxembourg': 'LU', 'madagascar': 'MG', 'malawi': 'MW', 'malaysia': 'MY',
  'maldives': 'MV', 'mali': 'ML', 'malta': 'MT', 'marshall islands': 'MH', 'mauritania': 'MR',
  'mauritius': 'MU', 'mexico': 'MX', 'micronesia': 'FM', 'moldova': 'MD', 'monaco': 'MC',
  'mongolia': 'MN', 'montenegro': 'ME', 'morocco': 'MA', 'mozambique': 'MZ', 'myanmar': 'MM',
  'namibia': 'NA', 'nauru': 'NR', 'nepal': 'NP', 'netherlands': 'NL', 'new zealand': 'NZ',
  'nicaragua': 'NI', 'niger': 'NE', 'nigeria': 'NG', 'north korea': 'KP', 'north macedonia': 'MK',
  'norway': 'NO', 'oman': 'OM', 'pakistan': 'PK', 'palau': 'PW', 'palestine': 'PS',
  'panama': 'PA', 'papua new guinea': 'PG', 'paraguay': 'PY', 'peru': 'PE', 'philippines': 'PH',
  'poland': 'PL', 'portugal': 'PT', 'qatar': 'QA', 'romania': 'RO', 'russia': 'RU',
  'rwanda': 'RW', 'saint kitts and nevis': 'KN', 'saint lucia': 'LC', 'saint vincent and the grenadines': 'VC',
  'samoa': 'WS', 'san marino': 'SM', 'sao tome and principe': 'ST', 'saudi arabia': 'SA',
  'senegal': 'SN', 'serbia': 'RS', 'seychelles': 'SC', 'sierra leone': 'SL', 'singapore': 'SG',
  'slovakia': 'SK', 'slovenia': 'SI', 'solomon islands': 'SB', 'somalia': 'SO', 'south africa': 'ZA',
  'south korea': 'KR', 'south sudan': 'SS', 'spain': 'ES', 'sri lanka': 'LK', 'sudan': 'SD',
  'suriname': 'SR', 'sweden': 'SE', 'switzerland': 'CH', 'syria': 'SY', 'taiwan': 'TW',
  'tajikistan': 'TJ', 'tanzania': 'TZ', 'thailand': 'TH', 'timor-leste': 'TL', 'togo': 'TG',
  'tonga': 'TO', 'trinidad and tobago': 'TT', 'tunisia': 'TN', 'turkey': 'TR', 'turkmenistan': 'TM',
  'tuvalu': 'TV', 'uganda': 'UG', 'ukraine': 'UA', 'united arab emirates': 'AE',
  'united kingdom': 'GB', 'united states': 'US', 'uruguay': 'UY', 'usa': 'US', 'uk': 'GB',
  'uzbekistan': 'UZ', 'vanuatu': 'VU', 'vatican city': 'VA', 'venezuela': 'VE', 'vietnam': 'VN',
  'yemen': 'YE', 'zambia': 'ZM', 'zimbabwe': 'ZW',
  
  // French names
  'afrique du sud': 'ZA', 'allemagne': 'DE', 'algérie': 'DZ', 'andorre': 'AD', 'angola': 'AO',
  'arabie saoudite': 'SA', 'argentine': 'AR', 'arménie': 'AM', 'australie': 'AU', 'autriche': 'AT',
  'azerbaïdjan': 'AZ', 'bahreïn': 'BH', 'bangladesh': 'BD', 'barbade': 'BB', 'belgique': 'BE',
  'belize': 'BZ', 'bénin': 'BJ', 'bhoutan': 'BT', 'biélorussie': 'BY', 'birmanie': 'MM',
  'bolivie': 'BO', 'bosnie-herzégovine': 'BA', 'botswana': 'BW', 'brésil': 'BR', 'brunei': 'BN',
  'bulgarie': 'BG', 'burkina faso': 'BF', 'burundi': 'BI', 'cambodge': 'KH', 'cameroun': 'CM',
  'canada': 'CA', 'cap-vert': 'CV', 'chili': 'CL', 'chine': 'CN', 'chypre': 'CY',
  'colombie': 'CO', 'comores': 'KM', 'congo': 'CG', 'corée du nord': 'KP', 'corée du sud': 'KR',
  'costa rica': 'CR', 'côte d\'ivoire': 'CI', 'croatie': 'HR', 'cuba': 'CU', 'danemark': 'DK',
  'djibouti': 'DJ', 'dominique': 'DM', 'égypte': 'EG', 'émirats arabes unis': 'AE', 'équateur': 'EC',
  'érythrée': 'ER', 'espagne': 'ES', 'estonie': 'EE', 'eswatini': 'SZ', 'états-unis': 'US',
  'éthiopie': 'ET', 'fidji': 'FJ', 'finlande': 'FI', 'france': 'FR', 'gabon': 'GA',
  'géorgie': 'GE', 'ghana': 'GH', 'grèce': 'GR', 'grenade': 'GD', 'guatemala': 'GT',
  'guinée': 'GN', 'guinée équatoriale': 'GQ', 'guinée-bissau': 'GW', 'guyana': 'GY', 'haïti': 'HT',
  'honduras': 'HN', 'hongrie': 'HU', 'inde': 'IN', 'indonésie': 'ID', 'irak': 'IQ',
  'iran': 'IR', 'irlande': 'IE', 'islande': 'IS', 'israël': 'IL', 'italie': 'IT',
  'jamaïque': 'JM', 'japon': 'JP', 'jordanie': 'JO', 'kazakhstan': 'KZ', 'kenya': 'KE',
  'kirghizistan': 'KG', 'kiribati': 'KI', 'koweït': 'KW', 'laos': 'LA', 'lesotho': 'LS',
  'lettonie': 'LV', 'liban': 'LB', 'libéria': 'LR', 'libye': 'LY', 'liechtenstein': 'LI',
  'lituanie': 'LT', 'luxembourg': 'LU', 'macédoine du nord': 'MK', 'madagascar': 'MG', 'malaisie': 'MY',
  'malawi': 'MW', 'maldives': 'MV', 'mali': 'ML', 'malte': 'MT', 'maroc': 'MA',
  'maurice': 'MU', 'mauritanie': 'MR', 'mexique': 'MX', 'micronésie': 'FM', 'moldavie': 'MD',
  'monaco': 'MC', 'mongolie': 'MN', 'monténégro': 'ME', 'mozambique': 'MZ', 'namibie': 'NA',
  'nauru': 'NR', 'népal': 'NP', 'nicaragua': 'NI', 'niger': 'NE', 'nigéria': 'NG',
  'norvège': 'NO', 'nouvelle-zélande': 'NZ', 'oman': 'OM', 'ouganda': 'UG', 'ouzbékistan': 'UZ',
  'pakistan': 'PK', 'palaos': 'PW', 'palestine': 'PS', 'panama': 'PA', 'papouasie-nouvelle-guinée': 'PG',
  'paraguay': 'PY', 'pays-bas': 'NL', 'pérou': 'PE', 'philippines': 'PH', 'pologne': 'PL',
  'portugal': 'PT', 'qatar': 'QA', 'république centrafricaine': 'CF', 'république dominicaine': 'DO',
  'république du congo': 'CG', 'république démocratique du congo': 'CD', 'république tchèque': 'CZ',
  'roumanie': 'RO', 'royaume-uni': 'GB', 'russie': 'RU', 'rwanda': 'RW', 'saint-kitts-et-nevis': 'KN',
  'sainte-lucie': 'LC', 'saint-vincent-et-les-grenadines': 'VC', 'salomon': 'SB', 'salvador': 'SV',
  'samoa': 'WS', 'sao tomé-et-principe': 'ST', 'sénégal': 'SN', 'serbie': 'RS', 'seychelles': 'SC',
  'sierra leone': 'SL', 'singapour': 'SG', 'slovaquie': 'SK', 'slovénie': 'SI', 'somalie': 'SO',
  'soudan': 'SD', 'soudan du sud': 'SS', 'sri lanka': 'LK', 'suède': 'SE', 'suisse': 'CH',
  'suriname': 'SR', 'swaziland': 'SZ', 'syrie': 'SY', 'tadjikistan': 'TJ', 'taïwan': 'TW',
  'tanzanie': 'TZ', 'tchad': 'TD', 'thaïlande': 'TH', 'timor oriental': 'TL', 'togo': 'TG',
  'tonga': 'TO', 'trinité-et-tobago': 'TT', 'tunisie': 'TN', 'turkménistan': 'TM', 'turquie': 'TR',
  'tuvalu': 'TV', 'ukraine': 'UA', 'uruguay': 'UY', 'vanuatu': 'VU', 'vatican': 'VA',
  'venezuela': 'VE', 'vietnam': 'VN', 'yémen': 'YE', 'zambie': 'ZM', 'zimbabwe': 'ZW',
};

// Normalize country name for lookup
function normalizeCountryName(name: string): string {
  return name.trim().toLowerCase();
}

// Check if value is already an ISO code
function isIsoCode(value: string): boolean {
  return /^[A-Z]{2}$/.test(value);
}

async function migrate() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('🚀 Starting country to ISO code migration...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('');

  // Connect to database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    // Create backup table if not in dry-run mode
    if (!dryRun) {
      console.log('📦 Creating backup table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS patients_country_backup AS
        SELECT id, address, identity FROM patients
        WHERE address IS NOT NULL OR identity IS NOT NULL;
      `);
      console.log('✓ Backup table created');
      console.log('');
    }

    // Fetch all patients with address or identity data
    const patients = await db.select().from(schema.patients);
    
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    const notFoundValues: Set<string> = new Set();

    for (const patient of patients) {
      let needsUpdate = false;
      const newAddress = patient.address ? { ...patient.address } : null;
      const newIdentity = patient.identity ? { ...patient.identity } : null;

      // Migrate address.country
      if (newAddress?.country && !isIsoCode(newAddress.country)) {
        const normalized = normalizeCountryName(newAddress.country);
        const isoCode = COUNTRY_NAME_TO_ISO[normalized];
        
        if (isoCode) {
          if (verbose) {
            console.log(`Patient ${patient.id}: address.country "${newAddress.country}" → "${isoCode}"`);
          }
          newAddress.country = isoCode;
          needsUpdate = true;
        } else {
          notFound++;
          notFoundValues.add(newAddress.country);
          if (verbose) {
            console.log(`⚠️  Patient ${patient.id}: address.country "${newAddress.country}" not found in mapping`);
          }
        }
      } else if (newAddress?.country) {
        skipped++;
      }

      // Migrate identity.country_national
      if (newIdentity?.country_national && !isIsoCode(newIdentity.country_national)) {
        const normalized = normalizeCountryName(newIdentity.country_national);
        const isoCode = COUNTRY_NAME_TO_ISO[normalized];
        
        if (isoCode) {
          if (verbose) {
            console.log(`Patient ${patient.id}: identity.country_national "${newIdentity.country_national}" → "${isoCode}"`);
          }
          newIdentity.country_national = isoCode;
          needsUpdate = true;
        } else {
          notFound++;
          notFoundValues.add(newIdentity.country_national);
          if (verbose) {
            console.log(`⚠️  Patient ${patient.id}: identity.country_national "${newIdentity.country_national}" not found in mapping`);
          }
        }
      } else if (newIdentity?.country_national) {
        skipped++;
      }

      // Update patient if needed
      if (needsUpdate && !dryRun) {
        await db.update(schema.patients)
          .set({
            address: newAddress,
            identity: newIdentity,
            updated_at: new Date(),
          })
          .where(eq(schema.patients.id, patient.id));
        updated++;
      } else if (needsUpdate) {
        updated++;
      }
    }

    // Print summary
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('Migration Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`Total patients scanned: ${patients.length}`);
    console.log(`Records ${dryRun ? 'would be ' : ''}updated: ${updated}`);
    console.log(`Already ISO codes (skipped): ${skipped}`);
    console.log(`Values not found in mapping: ${notFound}`);
    
    if (notFoundValues.size > 0) {
      console.log('');
      console.log('Unmapped values (add to COUNTRY_NAME_TO_ISO if needed):');
      Array.from(notFoundValues).sort().forEach(val => {
        console.log(`  - "${val}"`);
      });
    }

    if (!dryRun && updated > 0) {
      console.log('');
      console.log('✓ Migration completed successfully');
      console.log('');
      console.log('To rollback if needed:');
      console.log('  UPDATE patients p');
      console.log('  SET address = b.address, identity = b.identity');
      console.log('  FROM patients_country_backup b');
      console.log('  WHERE p.id = b.id;');
    } else if (dryRun) {
      console.log('');
      console.log('✓ Dry run completed - no changes made');
      console.log('');
      console.log('To apply changes, run without --dry-run flag');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
