import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Country {
  code: string;
  code3: string;
  name: string;
  flag: string;
}

const countries: Country[] = [
  { code: 'CH', code3: 'CHE', name: 'Suisse', flag: '🇨🇭' },
  { code: 'AD', code3: 'AND', name: 'Andorre', flag: '🇦🇩' },
  { code: 'AE', code3: 'ARE', name: 'Émirats arabes unis', flag: '🇦🇪' },
  { code: 'AF', code3: 'AFG', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AG', code3: 'ATG', name: 'Antigua-et-Barbuda', flag: '🇦🇬' },
  { code: 'AI', code3: 'AIA', name: 'Anguilla', flag: '🇦🇮' },
  { code: 'AL', code3: 'ALB', name: 'Albanie', flag: '🇦🇱' },
  { code: 'AM', code3: 'ARM', name: 'Arménie', flag: '🇦🇲' },
  { code: 'AO', code3: 'AGO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AQ', code3: 'ATA', name: 'Antarctique', flag: '🇦🇶' },
  { code: 'AR', code3: 'ARG', name: 'Argentine', flag: '🇦🇷' },
  { code: 'AS', code3: 'ASM', name: 'Samoa américaines', flag: '🇦🇸' },
  { code: 'AT', code3: 'AUT', name: 'Autriche', flag: '🇦🇹' },
  { code: 'AU', code3: 'AUS', name: 'Australie', flag: '🇦🇺' },
  { code: 'AW', code3: 'ABW', name: 'Aruba', flag: '🇦🇼' },
  { code: 'AX', code3: 'ALA', name: 'Îles Åland', flag: '🇦🇽' },
  { code: 'AZ', code3: 'AZE', name: 'Azerbaïdjan', flag: '🇦🇿' },
  { code: 'BA', code3: 'BIH', name: 'Bosnie-Herzégovine', flag: '🇧🇦' },
  { code: 'BB', code3: 'BRB', name: 'Barbade', flag: '🇧🇧' },
  { code: 'BD', code3: 'BGD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BE', code3: 'BEL', name: 'Belgique', flag: '🇧🇪' },
  { code: 'BF', code3: 'BFA', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BG', code3: 'BGR', name: 'Bulgarie', flag: '🇧🇬' },
  { code: 'BH', code3: 'BHR', name: 'Bahreïn', flag: '🇧🇭' },
  { code: 'BI', code3: 'BDI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'BJ', code3: 'BEN', name: 'Bénin', flag: '🇧🇯' },
  { code: 'BL', code3: 'BLM', name: 'Saint-Barthélemy', flag: '🇧🇱' },
  { code: 'BM', code3: 'BMU', name: 'Bermudes', flag: '🇧🇲' },
  { code: 'BN', code3: 'BRN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BO', code3: 'BOL', name: 'Bolivie', flag: '🇧🇴' },
  { code: 'BQ', code3: 'BES', name: 'Bonaire, Saint-Eustache et Saba', flag: '🇧🇶' },
  { code: 'BR', code3: 'BRA', name: 'Brésil', flag: '🇧🇷' },
  { code: 'BS', code3: 'BHS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BT', code3: 'BTN', name: 'Bhoutan', flag: '🇧🇹' },
  { code: 'BV', code3: 'BVT', name: 'Île Bouvet', flag: '🇧🇻' },
  { code: 'BW', code3: 'BWA', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BY', code3: 'BLR', name: 'Biélorussie', flag: '🇧🇾' },
  { code: 'BZ', code3: 'BLZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'CA', code3: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'CC', code3: 'CCK', name: 'Îles Cocos', flag: '🇨🇨' },
  { code: 'CD', code3: 'COD', name: 'République démocratique du Congo', flag: '🇨🇩' },
  { code: 'CF', code3: 'CAF', name: 'République centrafricaine', flag: '🇨🇫' },
  { code: 'CG', code3: 'COG', name: 'République du Congo', flag: '🇨🇬' },
  { code: 'CI', code3: 'CIV', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'CK', code3: 'COK', name: 'Îles Cook', flag: '🇨🇰' },
  { code: 'CL', code3: 'CHL', name: 'Chili', flag: '🇨🇱' },
  { code: 'CM', code3: 'CMR', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'CN', code3: 'CHN', name: 'Chine', flag: '🇨🇳' },
  { code: 'CO', code3: 'COL', name: 'Colombie', flag: '🇨🇴' },
  { code: 'CR', code3: 'CRI', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CU', code3: 'CUB', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CV', code3: 'CPV', name: 'Cap-Vert', flag: '🇨🇻' },
  { code: 'CW', code3: 'CUW', name: 'Curaçao', flag: '🇨🇼' },
  { code: 'CX', code3: 'CXR', name: 'Île Christmas', flag: '🇨🇽' },
  { code: 'CY', code3: 'CYP', name: 'Chypre', flag: '🇨🇾' },
  { code: 'CZ', code3: 'CZE', name: 'République tchèque', flag: '🇨🇿' },
  { code: 'DE', code3: 'DEU', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'DJ', code3: 'DJI', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DK', code3: 'DNK', name: 'Danemark', flag: '🇩🇰' },
  { code: 'DM', code3: 'DMA', name: 'Dominique', flag: '🇩🇲' },
  { code: 'DO', code3: 'DOM', name: 'République dominicaine', flag: '🇩🇴' },
  { code: 'DZ', code3: 'DZA', name: 'Algérie', flag: '🇩🇿' },
  { code: 'EC', code3: 'ECU', name: 'Équateur', flag: '🇪🇨' },
  { code: 'EE', code3: 'EST', name: 'Estonie', flag: '🇪🇪' },
  { code: 'EG', code3: 'EGY', name: 'Égypte', flag: '🇪🇬' },
  { code: 'EH', code3: 'ESH', name: 'Sahara occidental', flag: '🇪🇭' },
  { code: 'ER', code3: 'ERI', name: 'Érythrée', flag: '🇪🇷' },
  { code: 'ES', code3: 'ESP', name: 'Espagne', flag: '🇪🇸' },
  { code: 'ET', code3: 'ETH', name: 'Éthiopie', flag: '🇪🇹' },
  { code: 'FI', code3: 'FIN', name: 'Finlande', flag: '🇫🇮' },
  { code: 'FJ', code3: 'FJI', name: 'Fidji', flag: '🇫🇯' },
  { code: 'FK', code3: 'FLK', name: 'Îles Malouines', flag: '🇫🇰' },
  { code: 'FM', code3: 'FSM', name: 'Micronésie', flag: '🇫🇲' },
  { code: 'FO', code3: 'FRO', name: 'Îles Féroé', flag: '🇫🇴' },
  { code: 'FR', code3: 'FRA', name: 'France', flag: '🇫🇷' },
  { code: 'GA', code3: 'GAB', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GB', code3: 'GBR', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'GD', code3: 'GRD', name: 'Grenade', flag: '🇬🇩' },
  { code: 'GE', code3: 'GEO', name: 'Géorgie', flag: '🇬🇪' },
  { code: 'GF', code3: 'GUF', name: 'Guyane française', flag: '🇬🇫' },
  { code: 'GG', code3: 'GGY', name: 'Guernesey', flag: '🇬🇬' },
  { code: 'GH', code3: 'GHA', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GI', code3: 'GIB', name: 'Gibraltar', flag: '🇬🇮' },
  { code: 'GL', code3: 'GRL', name: 'Groenland', flag: '🇬🇱' },
  { code: 'GM', code3: 'GMB', name: 'Gambie', flag: '🇬🇲' },
  { code: 'GN', code3: 'GIN', name: 'Guinée', flag: '🇬🇳' },
  { code: 'GP', code3: 'GLP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'GQ', code3: 'GNQ', name: 'Guinée équatoriale', flag: '🇬🇶' },
  { code: 'GR', code3: 'GRC', name: 'Grèce', flag: '🇬🇷' },
  { code: 'GS', code3: 'SGS', name: 'Géorgie du Sud-et-les Îles Sandwich du Sud', flag: '🇬🇸' },
  { code: 'GT', code3: 'GTM', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GU', code3: 'GUM', name: 'Guam', flag: '🇬🇺' },
  { code: 'GW', code3: 'GNB', name: 'Guinée-Bissau', flag: '🇬🇼' },
  { code: 'GY', code3: 'GUY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HK', code3: 'HKG', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HM', code3: 'HMD', name: 'Îles Heard-et-MacDonald', flag: '🇭🇲' },
  { code: 'HN', code3: 'HND', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HR', code3: 'HRV', name: 'Croatie', flag: '🇭🇷' },
  { code: 'HT', code3: 'HTI', name: 'Haïti', flag: '🇭🇹' },
  { code: 'HU', code3: 'HUN', name: 'Hongrie', flag: '🇭🇺' },
  { code: 'ID', code3: 'IDN', name: 'Indonésie', flag: '🇮🇩' },
  { code: 'IE', code3: 'IRL', name: 'Irlande', flag: '🇮🇪' },
  { code: 'IL', code3: 'ISR', name: 'Israël', flag: '🇮🇱' },
  { code: 'IM', code3: 'IMN', name: 'Île de Man', flag: '🇮🇲' },
  { code: 'IN', code3: 'IND', name: 'Inde', flag: '🇮🇳' },
  { code: 'IO', code3: 'IOT', name: 'Territoire britannique de l\'océan Indien', flag: '🇮🇴' },
  { code: 'IQ', code3: 'IRQ', name: 'Irak', flag: '🇮🇶' },
  { code: 'IR', code3: 'IRN', name: 'Iran', flag: '🇮🇷' },
  { code: 'IS', code3: 'ISL', name: 'Islande', flag: '🇮🇸' },
  { code: 'IT', code3: 'ITA', name: 'Italie', flag: '🇮🇹' },
  { code: 'JE', code3: 'JEY', name: 'Jersey', flag: '🇯🇪' },
  { code: 'JM', code3: 'JAM', name: 'Jamaïque', flag: '🇯🇲' },
  { code: 'JO', code3: 'JOR', name: 'Jordanie', flag: '🇯🇴' },
  { code: 'JP', code3: 'JPN', name: 'Japon', flag: '🇯🇵' },
  { code: 'KE', code3: 'KEN', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KG', code3: 'KGZ', name: 'Kirghizistan', flag: '🇰🇬' },
  { code: 'KH', code3: 'KHM', name: 'Cambodge', flag: '🇰🇭' },
  { code: 'KI', code3: 'KIR', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KM', code3: 'COM', name: 'Comores', flag: '🇰🇲' },
  { code: 'KN', code3: 'KNA', name: 'Saint-Christophe-et-Niévès', flag: '🇰🇳' },
  { code: 'KP', code3: 'PRK', name: 'Corée du Nord', flag: '🇰🇵' },
  { code: 'KR', code3: 'KOR', name: 'Corée du Sud', flag: '🇰🇷' },
  { code: 'KW', code3: 'KWT', name: 'Koweït', flag: '🇰🇼' },
  { code: 'KY', code3: 'CYM', name: 'Îles Caïmans', flag: '🇰🇾' },
  { code: 'KZ', code3: 'KAZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'LA', code3: 'LAO', name: 'Laos', flag: '🇱🇦' },
  { code: 'LB', code3: 'LBN', name: 'Liban', flag: '🇱🇧' },
  { code: 'LC', code3: 'LCA', name: 'Sainte-Lucie', flag: '🇱🇨' },
  { code: 'LI', code3: 'LIE', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LK', code3: 'LKA', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'LR', code3: 'LBR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LS', code3: 'LSO', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LT', code3: 'LTU', name: 'Lituanie', flag: '🇱🇹' },
  { code: 'LU', code3: 'LUX', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'LV', code3: 'LVA', name: 'Lettonie', flag: '🇱🇻' },
  { code: 'LY', code3: 'LBY', name: 'Libye', flag: '🇱🇾' },
  { code: 'MA', code3: 'MAR', name: 'Maroc', flag: '🇲🇦' },
  { code: 'MC', code3: 'MCO', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MD', code3: 'MDA', name: 'Moldavie', flag: '🇲🇩' },
  { code: 'ME', code3: 'MNE', name: 'Monténégro', flag: '🇲🇪' },
  { code: 'MF', code3: 'MAF', name: 'Saint-Martin', flag: '🇲🇫' },
  { code: 'MG', code3: 'MDG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MH', code3: 'MHL', name: 'Îles Marshall', flag: '🇲🇭' },
  { code: 'MK', code3: 'MKD', name: 'Macédoine du Nord', flag: '🇲🇰' },
  { code: 'ML', code3: 'MLI', name: 'Mali', flag: '🇲🇱' },
  { code: 'MM', code3: 'MMR', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'MN', code3: 'MNG', name: 'Mongolie', flag: '🇲🇳' },
  { code: 'MO', code3: 'MAC', name: 'Macao', flag: '🇲🇴' },
  { code: 'MP', code3: 'MNP', name: 'Îles Mariannes du Nord', flag: '🇲🇵' },
  { code: 'MQ', code3: 'MTQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'MR', code3: 'MRT', name: 'Mauritanie', flag: '🇲🇷' },
  { code: 'MS', code3: 'MSR', name: 'Montserrat', flag: '🇲🇸' },
  { code: 'MT', code3: 'MLT', name: 'Malte', flag: '🇲🇹' },
  { code: 'MU', code3: 'MUS', name: 'Maurice', flag: '🇲🇺' },
  { code: 'MV', code3: 'MDV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'MW', code3: 'MWI', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MX', code3: 'MEX', name: 'Mexique', flag: '🇲🇽' },
  { code: 'MY', code3: 'MYS', name: 'Malaisie', flag: '🇲🇾' },
  { code: 'MZ', code3: 'MOZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'NA', code3: 'NAM', name: 'Namibie', flag: '🇳🇦' },
  { code: 'NC', code3: 'NCL', name: 'Nouvelle-Calédonie', flag: '🇳🇨' },
  { code: 'NE', code3: 'NER', name: 'Niger', flag: '🇳🇪' },
  { code: 'NF', code3: 'NFK', name: 'Île Norfolk', flag: '🇳🇫' },
  { code: 'NG', code3: 'NGA', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NI', code3: 'NIC', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NL', code3: 'NLD', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'NO', code3: 'NOR', name: 'Norvège', flag: '🇳🇴' },
  { code: 'NP', code3: 'NPL', name: 'Népal', flag: '🇳🇵' },
  { code: 'NR', code3: 'NRU', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NU', code3: 'NIU', name: 'Niue', flag: '🇳🇺' },
  { code: 'NZ', code3: 'NZL', name: 'Nouvelle-Zélande', flag: '🇳🇿' },
  { code: 'OM', code3: 'OMN', name: 'Oman', flag: '🇴🇲' },
  { code: 'PA', code3: 'PAN', name: 'Panama', flag: '🇵🇦' },
  { code: 'PE', code3: 'PER', name: 'Pérou', flag: '🇵🇪' },
  { code: 'PF', code3: 'PYF', name: 'Polynésie française', flag: '🇵🇫' },
  { code: 'PG', code3: 'PNG', name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬' },
  { code: 'PH', code3: 'PHL', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PK', code3: 'PAK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PL', code3: 'POL', name: 'Pologne', flag: '🇵🇱' },
  { code: 'PM', code3: 'SPM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
  { code: 'PN', code3: 'PCN', name: 'Îles Pitcairn', flag: '🇵🇳' },
  { code: 'PR', code3: 'PRI', name: 'Porto Rico', flag: '🇵🇷' },
  { code: 'PS', code3: 'PSE', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PT', code3: 'PRT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'PW', code3: 'PLW', name: 'Palaos', flag: '🇵🇼' },
  { code: 'PY', code3: 'PRY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'QA', code3: 'QAT', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RE', code3: 'REU', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'RO', code3: 'ROU', name: 'Roumanie', flag: '🇷🇴' },
  { code: 'RS', code3: 'SRB', name: 'Serbie', flag: '🇷🇸' },
  { code: 'RU', code3: 'RUS', name: 'Russie', flag: '🇷🇺' },
  { code: 'RW', code3: 'RWA', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'SA', code3: 'SAU', name: 'Arabie saoudite', flag: '🇸🇦' },
  { code: 'SB', code3: 'SLB', name: 'Îles Salomon', flag: '🇸🇧' },
  { code: 'SC', code3: 'SYC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SD', code3: 'SDN', name: 'Soudan', flag: '🇸🇩' },
  { code: 'SE', code3: 'SWE', name: 'Suède', flag: '🇸🇪' },
  { code: 'SG', code3: 'SGP', name: 'Singapour', flag: '🇸🇬' },
  { code: 'SH', code3: 'SHN', name: 'Sainte-Hélène', flag: '🇸🇭' },
  { code: 'SI', code3: 'SVN', name: 'Slovénie', flag: '🇸🇮' },
  { code: 'SJ', code3: 'SJM', name: 'Svalbard et Jan Mayen', flag: '🇸🇯' },
  { code: 'SK', code3: 'SVK', name: 'Slovaquie', flag: '🇸🇰' },
  { code: 'SL', code3: 'SLE', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SM', code3: 'SMR', name: 'Saint-Marin', flag: '🇸🇲' },
  { code: 'SN', code3: 'SEN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'SO', code3: 'SOM', name: 'Somalie', flag: '🇸🇴' },
  { code: 'SR', code3: 'SUR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SS', code3: 'SSD', name: 'Soudan du Sud', flag: '🇸🇸' },
  { code: 'ST', code3: 'STP', name: 'Sao Tomé-et-Principe', flag: '🇸🇹' },
  { code: 'SV', code3: 'SLV', name: 'Salvador', flag: '🇸🇻' },
  { code: 'SX', code3: 'SXM', name: 'Saint-Martin', flag: '🇸🇽' },
  { code: 'SY', code3: 'SYR', name: 'Syrie', flag: '🇸🇾' },
  { code: 'SZ', code3: 'SWZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'TC', code3: 'TCA', name: 'Îles Turques-et-Caïques', flag: '🇹🇨' },
  { code: 'TD', code3: 'TCD', name: 'Tchad', flag: '🇹🇩' },
  { code: 'TF', code3: 'ATF', name: 'Terres australes françaises', flag: '🇹🇫' },
  { code: 'TG', code3: 'TGO', name: 'Togo', flag: '🇹🇬' },
  { code: 'TH', code3: 'THA', name: 'Thaïlande', flag: '🇹🇭' },
  { code: 'TJ', code3: 'TJK', name: 'Tadjikistan', flag: '🇹🇯' },
  { code: 'TK', code3: 'TKL', name: 'Tokelau', flag: '🇹🇰' },
  { code: 'TL', code3: 'TLS', name: 'Timor oriental', flag: '🇹🇱' },
  { code: 'TM', code3: 'TKM', name: 'Turkménistan', flag: '🇹🇲' },
  { code: 'TN', code3: 'TUN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'TO', code3: 'TON', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TR', code3: 'TUR', name: 'Turquie', flag: '🇹🇷' },
  { code: 'TT', code3: 'TTO', name: 'Trinité-et-Tobago', flag: '🇹🇹' },
  { code: 'TV', code3: 'TUV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'TW', code3: 'TWN', name: 'Taïwan', flag: '🇹🇼' },
  { code: 'TZ', code3: 'TZA', name: 'Tanzanie', flag: '🇹🇿' },
  { code: 'UA', code3: 'UKR', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'UG', code3: 'UGA', name: 'Ouganda', flag: '🇺🇬' },
  { code: 'UM', code3: 'UMI', name: 'Îles mineures éloignées des États-Unis', flag: '🇺🇲' },
  { code: 'US', code3: 'USA', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'UY', code3: 'URY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', code3: 'UZB', name: 'Ouzbékistan', flag: '🇺🇿' },
  { code: 'VA', code3: 'VAT', name: 'Vatican', flag: '🇻🇦' },
  { code: 'VC', code3: 'VCT', name: 'Saint-Vincent-et-les-Grenadines', flag: '🇻🇨' },
  { code: 'VE', code3: 'VEN', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VG', code3: 'VGB', name: 'Îles Vierges britanniques', flag: '🇻🇬' },
  { code: 'VI', code3: 'VIR', name: 'Îles Vierges des États-Unis', flag: '🇻🇮' },
  { code: 'VN', code3: 'VNM', name: 'Viêt Nam', flag: '🇻🇳' },
  { code: 'VU', code3: 'VUT', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'WF', code3: 'WLF', name: 'Wallis-et-Futuna', flag: '🇼🇫' },
  { code: 'WS', code3: 'WSM', name: 'Samoa', flag: '🇼🇸' },
  { code: 'YE', code3: 'YEM', name: 'Yémen', flag: '🇾🇪' },
  { code: 'YT', code3: 'MYT', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'ZA', code3: 'ZAF', name: 'Afrique du Sud', flag: '🇿🇦' },
  { code: 'ZM', code3: 'ZMB', name: 'Zambie', flag: '🇿🇲' },
  { code: 'ZW', code3: 'ZWE', name: 'Zimbabwe', flag: '🇿🇼' }
];

interface NationalitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const NationalitySelector: React.FC<NationalitySelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrer les pays selon le terme de recherche
  const filteredCountries = countries.filter(country => {
    const search = searchTerm.toLowerCase();
    return (
      country.name.toLowerCase().includes(search) ||
      country.code.toLowerCase().includes(search) ||
      country.code3.toLowerCase().includes(search)
    );
  });

  // Séparer la Suisse du reste
  const switzerlandIndex = filteredCountries.findIndex(c => c.code === 'CH');
  const switzerland = switzerlandIndex >= 0 ? filteredCountries[switzerlandIndex] : null;
  const otherCountries = filteredCountries.filter(c => c.code !== 'CH');

  // Organiser les résultats avec la Suisse en haut
  const organizedCountries = switzerland ? [switzerland, ...otherCountries] : otherCountries;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleCountrySelect = (country: Country) => {
    onChange(country.name);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < organizedCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && organizedCountries[highlightedIndex]) {
          handleCountrySelect(organizedCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Délai pour permettre le clic sur une option
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  // Effet pour faire défiler vers l'élément surligné
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  // Afficher la valeur actuelle ou le terme de recherche
  const displayValue = isOpen ? searchTerm : value;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="Entrez la nationalité ou le code ISO (ex. CH)…"
          className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400 pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {organizedCountries.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              Aucun pays trouvé
            </div>
          ) : (
            <>
              {organizedCountries.map((country, index) => (
                <div key={country.code}>
                  {/* Séparateur après la Suisse */}
                  {index === 1 && switzerland && (
                    <div className="border-t border-slate-200 my-1" />
                  )}
                  <div
                    className={`px-3 py-2 cursor-pointer flex items-center gap-3 text-sm transition-colors ${
                      index === highlightedIndex
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => handleCountrySelect(country)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-bold text-slate-600">{country.code}</span>
                    <span className="text-slate-800">{country.name}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NationalitySelector;