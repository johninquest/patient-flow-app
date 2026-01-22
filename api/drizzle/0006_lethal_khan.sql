-- Step 1: Create temporary function to map country names to ISO codes
CREATE OR REPLACE FUNCTION map_country_to_code(country_name TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN CASE country_name
        WHEN 'Algeria' THEN 'DZA'
        WHEN 'Egypt' THEN 'EGY'
        WHEN 'Libya' THEN 'LBY'
        WHEN 'Morocco' THEN 'MAR'
        WHEN 'Sudan' THEN 'SDN'
        WHEN 'Tunisia' THEN 'TUN'
        WHEN 'Benin' THEN 'BEN'
        WHEN 'Burkina Faso' THEN 'BFA'
        WHEN 'Cape Verde' THEN 'CPV'
        WHEN 'Gambia' THEN 'GMB'
        WHEN 'Ghana' THEN 'GHA'
        WHEN 'Guinea' THEN 'GIN'
        WHEN 'Guinea-Bissau' THEN 'GNB'
        WHEN 'Ivory Coast' THEN 'CIV'
        WHEN 'Liberia' THEN 'LBR'
        WHEN 'Mali' THEN 'MLI'
        WHEN 'Mauritania' THEN 'MRT'
        WHEN 'Niger' THEN 'NER'
        WHEN 'Nigeria' THEN 'NGA'
        WHEN 'Senegal' THEN 'SEN'
        WHEN 'Sierra Leone' THEN 'SLE'
        WHEN 'Togo' THEN 'TGO'
        WHEN 'Cameroon' THEN 'CMR'
        WHEN 'Central African Republic' THEN 'CAF'
        WHEN 'Chad' THEN 'TCD'
        WHEN 'Congo (Brazzaville)' THEN 'COG'
        WHEN 'Congo (DRC)' THEN 'COD'
        WHEN 'Equatorial Guinea' THEN 'GNQ'
        WHEN 'Gabon' THEN 'GAB'
        WHEN 'Sao Tome and Principe' THEN 'STP'
        WHEN 'Burundi' THEN 'BDI'
        WHEN 'Comoros' THEN 'COM'
        WHEN 'Djibouti' THEN 'DJI'
        WHEN 'Eritrea' THEN 'ERI'
        WHEN 'Ethiopia' THEN 'ETH'
        WHEN 'Kenya' THEN 'KEN'
        WHEN 'Madagascar' THEN 'MDG'
        WHEN 'Malawi' THEN 'MWI'
        WHEN 'Mauritius' THEN 'MUS'
        WHEN 'Mozambique' THEN 'MOZ'
        WHEN 'Rwanda' THEN 'RWA'
        WHEN 'Seychelles' THEN 'SYC'
        WHEN 'Somalia' THEN 'SOM'
        WHEN 'South Sudan' THEN 'SSD'
        WHEN 'Tanzania' THEN 'TZA'
        WHEN 'Uganda' THEN 'UGA'
        WHEN 'Angola' THEN 'AGO'
        WHEN 'Botswana' THEN 'BWA'
        WHEN 'Eswatini' THEN 'SWZ'
        WHEN 'Lesotho' THEN 'LSO'
        WHEN 'Namibia' THEN 'NAM'
        WHEN 'South Africa' THEN 'ZAF'
        WHEN 'Zambia' THEN 'ZMB'
        WHEN 'Zimbabwe' THEN 'ZWE'
        ELSE country_name
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 2: Convert existing country names to codes BEFORE changing column type
UPDATE properties 
SET country = map_country_to_code(country)
WHERE LENGTH(country) > 3;

-- Step 3: Drop the temporary function
DROP FUNCTION IF EXISTS map_country_to_code(TEXT);

-- Step 4: Change column type to varchar(3) (Drizzle's original migration)
ALTER TABLE "properties" ALTER COLUMN "country" SET DATA TYPE varchar(3);

-- Step 5: Add check constraint
ALTER TABLE properties 
ADD CONSTRAINT properties_country_length_check 
CHECK (LENGTH(country) = 3);