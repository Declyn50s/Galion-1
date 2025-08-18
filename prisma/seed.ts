import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// === Colle ICI ton tableau Markdown ENTIER tel quel (entre backticks) ===
const markdown = String.raw`| Numéro SEHL | Adresse | Base légale |
| ----------- | --------------------------------------- | ----------- |
| 2 | ANCIEN-STAND 12-18 | LC.53 |
| 3 | ANCIEN-STAND 20 | LC.53 |
| 4 | ANCIEN-STAND 22-28 | LC.53 |
| 5 | AOSTE 1-5 | LC.75 |
| 6 | BERNE 9 | LC.75 |
| 7 | BERNE 11 | RC.47 |
| 8 | BERNE 13E | LC.75 |
| 9 | BOIS FONTAINE 8a10/13a19 | LC.75 |
| 10 | BOIS-GENTIL 31-33 | LC.75 |
| 11 | BOIS-GENTIL 142-144 | LC.53 |
| 12 | BOIS-DE-VAUX 21-27 | LC.75 |
| 13 | BOISSONNET 32 | LC.75 |
| 14 | BOISSONNET 32 | LC.75 |
| 15 | BOISSONNET 34-46 | LC.75 |
| 16 | BON-ABRI 9-13 | LC.75 |
| 17 | BORDE 12:14/ 16B-22B | LC.75 |
| 18 | BORDE 26-30 | LC.75 |
| 19 | BORDE 32 | LC.75 |
| 20 | BONNE ESPERANCE 32 | LC.2007 |
| 21 | BORDE 44 | LC.75 |
| 22 | BORDE 45-49 | LC.75 |
| 23 | BORDE 51-57 | LC.75 |
| 24 | BUSSIGNY 68B-68I | LC.75 |
| 25 | BOVERESSES 29-75 | LC.65 |
| 26 | CAPELARD 1-3 | RC.47 |
| 27 | CASSINETTE 10-12 | LC.53 |
| 28 | CASSINETTE 17 | LC.75 |
| 29 | CHAILLY 24-24 B | LC.75 |
| 30 | CHAMPRILLY 1-7 | LC.75 |
| 31 | CHAMPRILLY 16-20 | LC.75 |
| 32 | CHANDIEU 28-38 | LC.75 |
| 33 | CHANTEMERLE 6 | RC.47 |
| 34 | CHANTEMERLE 8 | RC.47 |
| 35 | CHATELAUD 30-30 B | LC.75 |
| 36 | CHAVANNES 103-149 | LC.65 |
| 37 | CHAVANNES 201-213 | LC.75 |
| 38 | CHENEAU-DE-BOURG 2-8 | RC.47 |
| 39 | CLOCHATTE 22-34 | LC.75 |
| 40 | CLOCHETONS 5-5 B | LC.75 |
| 41 | CLOCHETONS 5-7 B | LC.75 |
| 42 | CONTIGNY 2-6 + 8-12 | LC.75 |
| 43 | CONTIGNY 28-30 (DESUBVENTIONNE) | LC.53 |
| 44 | BONNE ESPERANCE 30 | LC.2007 |
| 45 | COUR 89 | LC.75 |
| 46 | COUR 140+144-152 (DESUBVENTIONNE) | LC.65 |
| 47 | CRETES 26-28 | LC.75 |
| 48 | DROUEY 16-16 B | LC.75 |
| 49 | ECHALLENS 92-96 | LC.75 |
| 50 | ENTRE-BOIS 9 | LC.53 |
| 51 | ENTRE-BOIS 11 | LC.53 |
| 52 | ENTRE-BOIS 13 | LC.75 |
| 53 | ENTRE-BOIS 12-16 | LC.75 |
| 54 | ENTRE-BOIS 17 | LC.75 |
| 55 | ENTRE-BOIS 18-28 | LC.75 |
| 56 | ENTRE-BOIS 30-34 | LC.53 |
| 57 | ENTRE-BOIS 42-50 | LC.2007 |
| 58 | ETERPEYS 16-22 ET 30-32 | LC.75 |
| 59 | ETERPEYS 1-7:10-14/24-28 | LC.75 |
| 60 | ETERPEYS 9-19 | LC.75 |
| 61 | FAUQUEZ 1-5 | RC.47 |
| 62 | FAUQUEZ 6-8 | RC.47 |
| 63 | FAUQUEZ 39 | LC.75 |
| 64 | FAVERGES 4-10 | LC.75 |
| 65 | FLORENCY 7-9 | RC.47 |
| 66 | FORET 1-5 | LC.75 |
| 67 | FORET 7-15 | LC.75 |
| 68 | FORET 10-12 | LC.75 |
| 69 | FRANCE 60 | LC.75 |
| 70 | FRANCE 81-85 (DESUBVENTIONNE) | LC.75 |
| 71 | GRATTA-PAILLE 18-21 | LC.75 |
| 72 | HARPE 36-50 | LC.75 |
| 73 | JOMINI 22 | LC.53 |
| 74 | JOMINI | LC.75 |
| 75 | LIBELLULES 2-2B-4 | LC.75 |
| 76 | MAIS. FAMILIALES 1-42 | RC.47 |
| 77 | MALLEY 1-13 | LC.2007 |
| 78 | MALLEY 2-10 | LC.2007 |
| 79 | MARTINET 5-11 | LC.75 |
| 80 | MEMISE 7 | LC.75 |
| 81 | MONT-D'OR 47-49 | LC.75 |
| 82 | MONT D'OR 54-58 | LC.75 |
| 83 | MONTELLY 9-8-C | LC.75 |
| 84 | MONTELLY 34-44 (ANCIENS DEMOLIS) | LC.75 |
| 85 | MONTELLY 41-41 A-B-C | LC.75 |
| 86 | MONTELLY 45-47 | LC.75 |
| 87 | MONTELLY 55-57 | LC.75 |
| 88 | MONTELLY 59-61 | LC.75 |
| 89 | MONTELLY 53-61 | LC.75 |
| 90 | MONTELLY 65-69 | LC.75 |
| 91 | MONTELLY 67-69 | LC.75 |
| 92 | MONTELLY 74-76 | LC.75 |
| 93 | MONTELLY 77-79 | LC.75 |
| 94 | MONTMELIAN 15-17 | LC.75 |
| 95 | MONTOILLEU 83 B | LC.75 |
| 96 | BEREE 34A, 34B | LC.2007 |
| 97 | MONTELLY 36-38 | LC.75 |
| 98 | MONTOUTLET 18 | LC.75 |
| 99 | PALUD 7 | LC.75 |
| 100 | PAVEMENT 43-59 | LC.75 |
| 101 | PAVEMENT 65-67 | LC.75 |
| 102 | PETIT FLONT 51-53 | LC.75 |
| 103 | PIDOU 10-18 HARPE 34 | LC.75 |
| 104 | MONTELLY 71 | LC.75 |
| 105 | PIERREVAL 11-15 | LC.75 |
| 106 | PLAINES-DU-LOUP 10-24 | LC.75 |
| 107 | PONTAISE 2-4 | LC.75 |
| 108 | PONTAISE 50 | LC.75 |
| 109 | PIERRE 10-20 | LC.75 |
| 110 | PRAIRIE 36 | LC.75 |
| 111 | PRAZ-SESCHAUD 2-10 | LC.53 |
| 112 | PRAZ-SESCHAUD 1-9 | LC.53 |
| 113 | PRAZ-SESCHAUD 2-12 | LC.75 |
| 114 | PRAZ-SESCHAUD 14-30 | LC.75 |
| 115 | PRILLY 1-13 | LC.75 |
| 116 | PRILLY 15-17 | RC.47 |
| 117 | PRILLY 15-19 | LC.75 |
| 118 | PYRAMIDES 6-8 | LC.75 |
| 119 | RAVIN 8 | LC.75 |
| 120 | RENENS 34-48 | LC.75 |
| 121 | CESAR-ROUX 29 (désubventionné dès 2016) | LC.75 |
| 122 | SABLONS 5-7 | LC.75 |
| 123 | ST-ROCH 15 | LC.75 |
| 124 | SAUGES 37 | LC.75 |
| 125 | TIVOLI 34-42 | LC.75 |
| 126 | TOUR-GRISE 10-20 | LC.75 |
| 127 | VIEUX-MOULIN 16-18 | LC.75 |
| 128 | VINET 31 | LC.75 |
| 129 | WARNERY 12-14 | LC.75 |
| 130 | CHAMPRILLY 9-15 | LC.75 |
| 131 | ANCIEN-STAND 2-10 | LC.75 |
| 132 | FAUQUEZ 73 | LC.75 |
| 133 | FAUQUEZ 27 | LC.75 |
| 134 | FAUQUEZ 69-71 | LC.75 |
| 135 | FAUQUEZ 59-61 | LC.75 |
| 136 | PRAZ-SESCHAUD 21-23/32-40 | LC.75 |
| 137 | FLORENCY 10 | LC.75 |
| 138 | GRAVIERE 9-11-13 | LC.75 |
| 139 | CLOCHATTE 14:14A:14B | LC.75 |
| 140 | BORDE 51-57 BIS | LC.75 |
| 141 | PAVEMENT 99 | LC.75 |
| 142 | ST-LAURENT 6-8/ARLAUD 1 | LC.75 |
| 143 | FAUQUEZ 75 | RC.47 |
| 144 | VANIL 6 | LC.75 |
| 145 | CITE DERRIERE 20-28 | LC.75 |
| 146 | BOIS-GENOUD 34 | LC.75 |
| 147 | COUR 78 | LC.75 |
| 148 | ETERPEYS 2-4-6-8 | LC.75 |
| 149 | ST-ROCH 11 | LC.75 |
| 150 | MONTMELIAN 6 | LC.75 |
| 151 | FIGUIERS-RHODANIE 39 | LC.75 |
| 152 | MONTOLIEU 37-56-58 | LC.75 |
| 153 | CITE DERRIERE 18 | LC.75 |
| 154 | CHABLAIS 49 | LC.75 |
| 155 | COUCHIRARD 18-30 | LC.75 |
| 156 | PRAZ 2-4/MORGES 60A/RENENS 13-15 | LC.75 |
| 157 | PRELAZ 3-5-8/ RENENS 17 | LC.75 |
| 158 | PRELAZ 9-10:12-14/RENENS 19-21 | LC.75 |
| 159 | OISEAUX 48 | LC.75 |
| 160 | HALDIMAND 3 - ARLAUD 2 | LC.75 |
| 161 | PLAINES-DU-LOUP 2C-2D | LC.75 |
| 162 | PRAIRIE 20 | LC.75 |
| 163 | TEMPLE 10 A B C D | LC.75 |
| 164 | Borde 7 (désubventionné 2021) | LC.75 |
| 165 | MALLEY 22-24 | LC.75 |
| 166 | ECHALLENS 3-7 | LC.75 |
| 167 | CLOCHATTE 16 A-B-C | LC.75 |
| 168 | CENTRALE 26-28-30 | LC.75 |
| 169 | COLLINE 14 A 56 | LC.75 |
| 170 | ECHALLENS 85/RECORODN 46 | LC.75 |
| 171 | MONT D'OR 42 | LC.75 |
| 172 | SAUGES 35 | LC.2007 |
| 173 | MORGES 37 | LC.2007 |
| 174 | BEREE 22C-D, 24A-B, 26A-B | LC.2007 |
| 175 | SEVELIN 10-12 | LC.2007 |
| 176 | SALLAZ 5-7-9 | LC.2007 |
| 177 | SALLAZ 11-13-15 | LC.2007 |
| 178 | BEREE 28-30-32 | LC.2007 |
| 179 | MORGES 58 | LC.2007 |
| 180 | RENENS 74 | LC.2007 |
| 5042 |  |  |
| 5053 | ELISABETH-JEANNE-DE-CERJAT 6-8:14-16 | LC.2007 |
| 5054 | PLAINES-DU-LOUP 51A-51B-53 | LC.2007 |
| 5055 | ELISABETH-JEANNE-DE-CERJAT 2-4 | LC.2007 |
| 5056 | ELISA-SERMENT 7-13 BOSSONS 30 | LC.2007 |
| 5057 | GERMAINE-ERNST 2-4-6 | LC.2007 |
| 5058 | PLAINES-DU-LOUP 47a-47b | LC.2007 |
| 5060 | GERMAINE-ERNST 8-10 | LC.2007 |`;

type Row = { sehl: number; adresse: string; baseLegale: string };

function parseMarkdownTable(md: string): Row[] {
  const lines = md.split('\n').map(l => l.trim()).filter(Boolean);
  const rows: Row[] = [];
  for (const line of lines) {
    // on ne prend que les lignes de type | a | b | c |
    if (!line.startsWith('|') || line.includes('---') || /Numéro SEHL/i.test(line)) continue;
    const parts = line.split('|').map(s => s.trim());
    // parts: ["", "2", "ANCIEN-STAND 12-18", "LC.53", ""]
    if (parts.length < 4) continue;
    const sehl = Number(parts[1]);
    if (Number.isNaN(sehl)) continue;
    const adresse = (parts[2] ?? '').trim();
    const base = (parts[3] ?? '').trim();
    rows.push({ sehl, adresse, baseLegale: base });
  }
  return rows;
}

async function main() {
  const rows = parseMarkdownTable(markdown);
  console.log(`Import de ${rows.length} lignes…`);
  for (const r of rows) {
    await prisma.immeuble.upsert({
      where: { sehl: r.sehl },
      create: r,
      update: { adresse: r.adresse, baseLegale: r.baseLegale },
    });
  }
  console.log('OK');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
