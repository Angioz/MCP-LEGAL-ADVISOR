/**
 * Pre-indexed key laws across all 8 jurisdictions.
 * Organized by jurisdiction → topic categories.
 * Used as Layer 1 (always-available, instant results) in the 3-layer search.
 */

import type { LawEntry } from "../utils/keyword-search.js";

// ============================================================
// EU
// ============================================================
export const EU_LAWS: LawEntry[] = [
  // Data Protection & Digital
  { title: "General Data Protection Regulation (GDPR)", description: "EU-wide data protection framework. Governs collection, processing, storage of personal data. Fines up to 4% global revenue.", law_ref: "Regulation (EU) 2016/679", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj", keywords: ["gdpr", "data protection", "privacy", "personal data", "consent"], topic: "data_protection", jurisdiction: "eu" },
  { title: "ePrivacy Directive", description: "Rules on electronic communications privacy, cookies, direct marketing.", law_ref: "Directive 2002/58/EC", url: "https://eur-lex.europa.eu/eli/dir/2002/58/oj", keywords: ["eprivacy", "cookies", "electronic communications", "privacy"], topic: "data_protection", jurisdiction: "eu" },
  { title: "EU AI Act", description: "Risk-based framework for AI systems. Bans social scoring, regulates high-risk AI. Phased enforcement 2024-2027.", law_ref: "Regulation (EU) 2024/1689", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", keywords: ["ai act", "artificial intelligence", "machine learning", "ai regulation"], topic: "digital", jurisdiction: "eu" },
  { title: "Digital Markets Act (DMA)", description: "Limits market power of digital gatekeepers (platforms with 45M+ monthly users).", law_ref: "Regulation (EU) 2022/1925", url: "https://eur-lex.europa.eu/eli/reg/2022/1925/oj", keywords: ["dma", "digital markets", "gatekeeper", "platform regulation"], topic: "digital", jurisdiction: "eu" },
  { title: "Digital Services Act (DSA)", description: "Rules for online intermediaries and platforms regarding illegal content, transparency, user protection.", law_ref: "Regulation (EU) 2022/2065", url: "https://eur-lex.europa.eu/eli/reg/2022/2065/oj", keywords: ["dsa", "digital services", "platform", "online content", "intermediary"], topic: "digital", jurisdiction: "eu" },
  { title: "EU Data Act", description: "Rules on data access and sharing from connected devices. Empowers users and businesses. Applied from Sep 2025.", law_ref: "Regulation (EU) 2023/2854", url: "https://eur-lex.europa.eu/eli/reg/2023/2854/oj", keywords: ["data act", "data sharing", "iot", "connected devices"], topic: "digital", jurisdiction: "eu" },
  // Company & Business
  { title: "EU Company Law Directive (Codified)", description: "Harmonized rules on company formation, capital, mergers, divisions across EU member states.", law_ref: "Directive (EU) 2017/1132", url: "https://eur-lex.europa.eu/eli/dir/2017/1132/oj", keywords: ["company law", "formation", "merger", "capital", "cross-border"], topic: "company", jurisdiction: "eu" },
  { title: "Societas Europaea (SE) Regulation", description: "Framework for pan-European public limited company. Enables companies to operate across EU under single legal form.", law_ref: "Regulation (EC) 2157/2001", url: "https://eur-lex.europa.eu/eli/reg/2001/2157/oj", keywords: ["se", "societas europaea", "european company", "cross-border"], topic: "company", jurisdiction: "eu" },
  // Tax
  { title: "EU VAT Directive", description: "Common system of VAT across EU. Standard rate minimum 15%. Reduced rates allowed.", law_ref: "Directive 2006/112/EC", url: "https://eur-lex.europa.eu/eli/dir/2006/112/oj", keywords: ["vat", "iva", "tva", "value added tax", "mwst"], topic: "tax", jurisdiction: "eu" },
  { title: "Anti-Tax Avoidance Directive (ATAD)", description: "Rules against tax avoidance: CFC rules, exit taxation, interest limitation, hybrid mismatches.", law_ref: "Directive (EU) 2016/1164", url: "https://eur-lex.europa.eu/eli/dir/2016/1164/oj", keywords: ["atad", "anti avoidance", "cfc", "exit tax", "tax avoidance"], topic: "tax", jurisdiction: "eu" },
  // Labor
  { title: "Working Time Directive", description: "Maximum 48-hour work week, minimum rest periods, paid annual leave (4 weeks).", law_ref: "Directive 2003/88/EC", url: "https://eur-lex.europa.eu/eli/dir/2003/88/oj", keywords: ["working time", "work hours", "rest", "annual leave", "labor"], topic: "labor", jurisdiction: "eu" },
  { title: "Transparent and Predictable Working Conditions Directive", description: "Minimum rights for all workers: written terms, probation limits, training rights.", law_ref: "Directive (EU) 2019/1152", url: "https://eur-lex.europa.eu/eli/dir/2019/1152/oj", keywords: ["working conditions", "employment contract", "transparency", "probation"], topic: "labor", jurisdiction: "eu" },
];

// ============================================================
// ITALY
// ============================================================
export const ITALY_LAWS: LawEntry[] = [
  // Tax
  { title: "TUIR — Testo Unico delle Imposte sui Redditi", description: "Unified income tax code. IRPEF (personal, 23-43%), IRES (corporate, 24%). Deductions, credits, tax residency rules.", law_ref: "DPR 917/1986", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917", keywords: ["tuir", "irpef", "ires", "income tax", "imposta redditi", "redditi", "tax"], topic: "tax", jurisdiction: "italy" },
  { title: "IVA — Imposta sul Valore Aggiunto", description: "Italian VAT. Standard 22%, reduced 10%/5%/4%. Digital services subject to VAT.", law_ref: "DPR 633/1972", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1972-10-26;633", keywords: ["iva", "vat", "value added tax", "aliquota"], topic: "tax", jurisdiction: "italy" },
  { title: "Regime Forfettario", description: "Flat tax regime for small businesses/freelancers. 5% first 5 years (new activity), then 15%. Revenue cap €85K.", law_ref: "Legge 190/2014, art. 1 cc. 54-89", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2014-12-23;190", keywords: ["forfettario", "flat tax", "partita iva", "regime agevolato", "freelancer"], topic: "tax", jurisdiction: "italy" },
  { title: "Rientro dei Cervelli — Brain Return Incentive", description: "50% income tax exemption (70% if South/children) for workers moving tax residence to Italy. Requires 2+ years abroad.", law_ref: "D.Lgs. 147/2015, art. 16 + Legge 58/2019", url: "https://www.agenziaentrate.gov.it/portale/web/guest/rientro-dei-cervelli", keywords: ["rientro cervelli", "brain return", "impatriati", "tax incentive", "relocation"], topic: "tax", jurisdiction: "italy" },
  { title: "IRAP — Imposta Regionale sulle Attività Produttive", description: "Regional tax on productive activities. 3.9% standard rate. Applies to businesses, not forfettario.", law_ref: "D.Lgs. 446/1997", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1997-12-15;446", keywords: ["irap", "regional tax", "attività produttive"], topic: "tax", jurisdiction: "italy" },
  // Company
  { title: "Codice Civile — Libro V (Società)", description: "Italian Civil Code Book V. Rules for all company types: SRL, SPA, SAS, SNC. Share capital, governance, liquidation.", law_ref: "R.D. 262/1942, Libro V", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:regio.decreto:1942-03-16;262", keywords: ["codice civile", "srl", "spa", "società", "company", "civil code"], topic: "company", jurisdiction: "italy" },
  { title: "Startup Innovativa", description: "Special status for innovative startups. No notary needed (digital formation). Tax incentives for investors (30-50% deduction). Flexible labor rules.", law_ref: "D.L. 179/2012, art. 25-32", url: "https://startup.registroimprese.it/", keywords: ["startup innovativa", "startup", "innovation", "investor incentive"], topic: "company", jurisdiction: "italy" },
  { title: "SRL Semplificata", description: "Simplified SRL. €1 minimum capital, standard bylaws, reduced notary fees. For founders under 35.", law_ref: "D.L. 1/2012, art. 3", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto-legge:2012-01-24;1", keywords: ["srls", "srl semplificata", "simplified company", "under 35"], topic: "company", jurisdiction: "italy" },
  // Labor
  { title: "Jobs Act — Contratto a Tutele Crescenti", description: "2015 labor reform. New hiring contract with graduated protections. Simplified dismissal rules.", law_ref: "D.Lgs. 23/2015", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2015-03-04;23", keywords: ["jobs act", "tutele crescenti", "contratto", "dismissal", "licenziamento"], topic: "labor", jurisdiction: "italy" },
  { title: "Statuto dei Lavoratori", description: "Workers' Statute. Fundamental labor rights: union rights, unfair dismissal protection, privacy at work.", law_ref: "Legge 300/1970", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1970-05-20;300", keywords: ["statuto lavoratori", "workers rights", "diritti lavoratori", "labor rights"], topic: "labor", jurisdiction: "italy" },
  // Social Security
  { title: "INPS Contribution System", description: "Italian social security. Employees: ~33% (split employer/employee). Self-employed/Gestione Separata: 26.23%.", law_ref: "Legge 335/1995 (Riforma Dini)", url: "https://www.inps.it/", keywords: ["inps", "contributi", "social security", "pension", "gestione separata"], topic: "social_security", jurisdiction: "italy" },
  // Data Protection
  { title: "Codice Privacy (as amended by GDPR)", description: "Italian data protection code, updated to align with GDPR. Garante Privacy enforcement.", law_ref: "D.Lgs. 196/2003 + D.Lgs. 101/2018", url: "https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2003-06-30;196", keywords: ["privacy", "data protection", "garante", "gdpr", "dati personali"], topic: "data_protection", jurisdiction: "italy" },
  // Funding
  { title: "Smart&Start Italia", description: "Zero-interest loan up to €1.5M for innovative startups. 80% of eligible costs (90% for women/South). Invitalia managed.", law_ref: "D.M. 24/09/2014", url: "https://www.invitalia.it/cosa-facciamo/creiamo-nuove-aziende/smartstart-italia", keywords: ["smart start", "invitalia", "startup funding", "loan", "finanziamento"], topic: "funding", jurisdiction: "italy" },
  { title: "Autoimpiego — Incentivi per il Lavoro Autonomo", description: "Self-employment grant. Up to €50K non-repayable for under-35 or women or South Italy. P.IVA or SRL eligible.", law_ref: "D.L. 48/2023 (converted L. 85/2023)", url: "https://www.invitalia.it/cosa-facciamo/creiamo-nuove-aziende/nuove-imprese-a-tasso-zero", keywords: ["autoimpiego", "self employment", "grant", "under 35", "incentivo"], topic: "funding", jurisdiction: "italy" },
];

// ============================================================
// GREECE
// ============================================================
export const GREECE_LAWS: LawEntry[] = [
  // Tax
  { title: "Income Tax Code (KFE)", description: "Greek income tax. Progressive rates 9-44% (individuals). Corporate 22% flat. Dividend 5%.", law_ref: "Law 4172/2013", url: "https://www.taxheaven.gr/law/4172/2013", keywords: ["income tax", "φόρος εισοδήματος", "kfe", "corporate tax", "φορολογία"], topic: "tax", jurisdiction: "greece" },
  { title: "VAT Code (FPA)", description: "Greek VAT. Standard 24%, reduced 13%/6%. Island reduced rates available.", law_ref: "Law 2859/2000", url: "https://www.taxheaven.gr/law/2859/2000", keywords: ["vat", "fpa", "φπα", "value added tax"], topic: "tax", jurisdiction: "greece" },
  { title: "Non-Dom / Alternative Taxation for Foreign Income", description: "Flat €100K/year tax on worldwide income for HNW relocating to Greece. 15-year program. No disclosure of foreign assets.", law_ref: "Law 4646/2019, art. 5A", url: "https://www.taxheaven.gr/law/4646/2019", keywords: ["non dom", "alternative taxation", "flat tax", "hnw", "relocation"], topic: "tax", jurisdiction: "greece" },
  { title: "Digital Nomad 50% Tax Reduction", description: "50% income tax reduction for remote workers relocating to Greece. Must stay 2+ years. Lasts 7 years.", law_ref: "Law 4825/2021, art. 5C", url: "https://www.taxheaven.gr/law/4825/2021", keywords: ["digital nomad", "remote work", "50% reduction", "relocation", "nomad"], topic: "tax", jurisdiction: "greece" },
  { title: "Startup Tax Incentives (Elevate Greece)", description: "Tax credits for angel investors (50% deduction up to €300K). R&D super-deduction 200%. Patent income taxed 6%.", law_ref: "Law 4712/2020 + Law 4172/2013 art. 71A-71E", url: "https://elevategreece.gov.gr/", keywords: ["elevate greece", "startup", "angel investor", "r&d", "tax credit"], topic: "tax", jurisdiction: "greece" },
  // Company
  { title: "IKE — Private Company (Idiotiki Kefalaiouxiki Etaireia)", description: "Most popular Greek company form. €1 minimum capital. Limited liability. Simple formation via one-stop shop.", law_ref: "Law 4072/2012, Part B", url: "https://www.taxheaven.gr/law/4072/2012", keywords: ["ike", "private company", "εταιρεία", "company formation", "one stop shop"], topic: "company", jurisdiction: "greece" },
  { title: "EPE — Limited Liability Company", description: "Traditional Greek LLC. €4,500 minimum capital. Notarial deed required. More formal than IKE.", law_ref: "Law 3190/1955", url: "https://www.taxheaven.gr/law/3190/1955", keywords: ["epe", "llc", "limited liability", "επε"], topic: "company", jurisdiction: "greece" },
  // Social Security
  { title: "EFKA Unified Social Security Fund", description: "Mandatory social security. Self-employed: ~27% of income. Employer contributions: ~24.5%. Covers health + pension.", law_ref: "Law 4387/2016", url: "https://www.efka.gov.gr/", keywords: ["efka", "social security", "κοινωνική ασφάλιση", "pension", "health insurance", "contributions"], topic: "social_security", jurisdiction: "greece" },
  // Investment
  { title: "Development Law — Investment Incentives", description: "Tax credits, grants, leasing subsidies for qualifying investments. Strategic investments get accelerated depreciation.", law_ref: "Law 4887/2022", url: "https://www.taxheaven.gr/law/4887/2022", keywords: ["development law", "investment incentive", "grant", "subsidy", "αναπτυξιακός"], topic: "investment", jurisdiction: "greece" },
  // Labor
  { title: "Labor Code Reform", description: "2021 labor reform. 8-hour workday, overtime rules, remote work rights, digital work card.", law_ref: "Law 4808/2021", url: "https://www.taxheaven.gr/law/4808/2021", keywords: ["labor", "εργασία", "overtime", "remote work", "work card"], topic: "labor", jurisdiction: "greece" },
];

// ============================================================
// UK
// ============================================================
export const UK_LAWS: LawEntry[] = [
  // Company
  { title: "Companies Act 2006", description: "Primary UK company law. Formation, directors' duties, shareholder rights, reporting, winding up. 1,300+ sections.", law_ref: "Companies Act 2006 (c.46)", url: "https://www.legislation.gov.uk/ukpga/2006/46", keywords: ["companies act", "company formation", "directors duties", "shareholder", "ltd"], topic: "company", jurisdiction: "uk" },
  { title: "Small Business, Enterprise and Employment Act 2015", description: "Transparency reforms: PSC register, disqualification of unfit directors, company filing improvements.", law_ref: "SBEE Act 2015 (c.26)", url: "https://www.legislation.gov.uk/ukpga/2015/26", keywords: ["small business", "psc", "persons significant control", "filing"], topic: "company", jurisdiction: "uk" },
  { title: "Partnership Act 1890", description: "Default rules for partnerships. Joint liability, profit sharing, dissolution.", law_ref: "Partnership Act 1890 (c.39)", url: "https://www.legislation.gov.uk/ukpga/Vict/53-54/39", keywords: ["partnership", "joint liability", "llp"], topic: "company", jurisdiction: "uk" },
  // Tax
  { title: "Income Tax Act 2007", description: "UK personal income tax. Basic 20%, higher 40%, additional 45%. Personal allowance £12,570.", law_ref: "Income Tax Act 2007 (c.3)", url: "https://www.legislation.gov.uk/ukpga/2007/3", keywords: ["income tax", "personal tax", "basic rate", "allowance", "paye"], topic: "tax", jurisdiction: "uk" },
  { title: "Corporation Tax Act 2010", description: "UK corporation tax on company profits. 25% main rate (2023+). Small profits rate 19% (under £50K).", law_ref: "CTA 2010 (c.4)", url: "https://www.legislation.gov.uk/ukpga/2010/4", keywords: ["corporation tax", "company tax", "corporate tax", "profit"], topic: "tax", jurisdiction: "uk" },
  { title: "Value Added Tax Act 1994", description: "UK VAT framework. Standard 20%, reduced 5%, zero 0%. Registration threshold £90K.", law_ref: "VATA 1994 (c.23)", url: "https://www.legislation.gov.uk/ukpga/1994/23", keywords: ["vat", "value added tax", "hmrc", "registration"], topic: "tax", jurisdiction: "uk" },
  { title: "Taxation of Chargeable Gains Act 1992", description: "Capital gains tax rules. 10%/20% rates (18%/24% for property). Annual exemption £3K.", law_ref: "TCGA 1992 (c.12)", url: "https://www.legislation.gov.uk/ukpga/1992/12", keywords: ["capital gains", "cgt", "chargeable gains", "disposal"], topic: "tax", jurisdiction: "uk" },
  // Labor
  { title: "Employment Rights Act 1996", description: "Core employment protections: unfair dismissal, redundancy pay, notice periods, written terms.", law_ref: "ERA 1996 (c.18)", url: "https://www.legislation.gov.uk/ukpga/1996/18", keywords: ["employment rights", "unfair dismissal", "redundancy", "notice period"], topic: "labor", jurisdiction: "uk" },
  { title: "Equality Act 2010", description: "Anti-discrimination law. Protected characteristics: age, disability, race, sex, religion, etc.", law_ref: "Equality Act 2010 (c.15)", url: "https://www.legislation.gov.uk/ukpga/2010/15", keywords: ["equality", "discrimination", "protected characteristics", "diversity"], topic: "labor", jurisdiction: "uk" },
  { title: "National Minimum Wage Act 1998", description: "Minimum wage entitlement. National Living Wage for 21+.", law_ref: "NMW Act 1998 (c.39)", url: "https://www.legislation.gov.uk/ukpga/1998/39", keywords: ["minimum wage", "living wage", "pay"], topic: "labor", jurisdiction: "uk" },
  // Data Protection
  { title: "Data Protection Act 2018", description: "UK implementation of GDPR. ICO enforcement. Covers processing of personal data, rights of data subjects.", law_ref: "DPA 2018 (c.12)", url: "https://www.legislation.gov.uk/ukpga/2018/12", keywords: ["data protection", "gdpr", "ico", "privacy", "personal data"], topic: "data_protection", jurisdiction: "uk" },
  { title: "UK GDPR", description: "Retained EU GDPR as UK domestic law post-Brexit. Same principles, UK-specific enforcement via ICO.", law_ref: "UK GDPR (retained EU law)", url: "https://www.legislation.gov.uk/eur/2016/679/contents", keywords: ["uk gdpr", "data protection", "privacy", "ico"], topic: "data_protection", jurisdiction: "uk" },
];

// ============================================================
// FRANCE
// ============================================================
export const FRANCE_LAWS: LawEntry[] = [
  // Company
  { title: "Code de Commerce", description: "French Commercial Code. All company types (SAS, SARL, SA, SNC), commercial acts, insolvency, commercial courts.", law_ref: "Code de commerce", url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000005634379/", keywords: ["code commerce", "commercial code", "sas", "sarl", "sa", "société"], topic: "company", jurisdiction: "france" },
  { title: "SAS — Société par Actions Simplifiée", description: "Most popular French company form. Flexible governance, no minimum capital, single shareholder allowed (SASU).", law_ref: "Code de commerce, L227-1 to L227-20", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000005634379/LEGISCTA000006146042/", keywords: ["sas", "sasu", "société actions simplifiée", "company formation"], topic: "company", jurisdiction: "france" },
  { title: "SARL — Société à Responsabilité Limitée", description: "French LLC. 2-100 shareholders, €1 minimum capital. Manager (gérant) model.", law_ref: "Code de commerce, L223-1 to L223-43", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000005634379/LEGISCTA000006146038/", keywords: ["sarl", "eurl", "société responsabilité limitée", "llc", "gérant"], topic: "company", jurisdiction: "france" },
  { title: "Jeune Entreprise Innovante (JEI)", description: "Innovative young company status. Tax exemptions: 100% corporate tax exempt first year, 50% second year. Social charge reductions for R&D staff.", law_ref: "CGI art. 44 sexies-0 A", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006302406", keywords: ["jei", "jeune entreprise innovante", "startup", "innovation", "tax exemption"], topic: "company", jurisdiction: "france" },
  // Tax
  { title: "Code Général des Impôts (CGI)", description: "French tax code. Income tax (IR, 0-45%), corporate tax (IS, 25%), VAT (TVA, 20%/10%/5.5%/2.1%).", law_ref: "Code général des impôts", url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006069577/", keywords: ["cgi", "impôt", "income tax", "ir", "impôt revenu", "tax code"], topic: "tax", jurisdiction: "france" },
  { title: "Impôt sur les Sociétés (IS)", description: "French corporate tax. 25% standard rate. 15% reduced rate on first €42,500 for SMEs.", law_ref: "CGI art. 205-223 U", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069577/LEGISCTA000006162529/", keywords: ["impôt sociétés", "corporate tax", "is", "bénéfice"], topic: "tax", jurisdiction: "france" },
  { title: "TVA — Taxe sur la Valeur Ajoutée", description: "French VAT. Standard 20%, intermediate 10%, reduced 5.5%, super-reduced 2.1%.", law_ref: "CGI art. 256-298 octodecies", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069577/LEGISCTA000006147073/", keywords: ["tva", "vat", "taxe valeur ajoutée", "value added tax"], topic: "tax", jurisdiction: "france" },
  { title: "Micro-Entreprise / Auto-Entrepreneur", description: "Simplified sole trader regime. Revenue thresholds: €188,700 (sales) / €77,700 (services). Flat social charges + optional flat tax.", law_ref: "CGI art. 50-0 + Loi 2008-776", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042907592", keywords: ["micro entreprise", "auto entrepreneur", "freelancer", "sole trader", "simplified"], topic: "tax", jurisdiction: "france" },
  // Labor
  { title: "Code du Travail", description: "French Labor Code. Employment contracts, working time (35h/week), dismissal, unions, health/safety.", law_ref: "Code du travail", url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072050/", keywords: ["code travail", "labor code", "emploi", "contrat travail", "35 heures", "licenciement"], topic: "labor", jurisdiction: "france" },
  { title: "Loi Macron (Economic Growth Act)", description: "2015 reform: Sunday work, coach transport liberalization, regulated professions reform.", law_ref: "Loi 2015-990", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000030978561/", keywords: ["loi macron", "economic growth", "reform", "liberalization"], topic: "labor", jurisdiction: "france" },
  // Social Security
  { title: "Code de la Sécurité Sociale", description: "French social security system. Health, retirement, family, unemployment. Employee contributions ~22%, employer ~45%.", law_ref: "Code de la sécurité sociale", url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006073189/", keywords: ["sécurité sociale", "social security", "cotisations", "santé", "retraite", "urssaf"], topic: "social_security", jurisdiction: "france" },
  // Data Protection
  { title: "Loi Informatique et Libertés", description: "French data protection law (updated for GDPR). CNIL enforcement. Rights of data subjects.", law_ref: "Loi 78-17 (modified)", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460/", keywords: ["informatique libertés", "cnil", "data protection", "privacy", "données personnelles"], topic: "data_protection", jurisdiction: "france" },
];

// ============================================================
// GERMANY
// ============================================================
export const GERMANY_LAWS: LawEntry[] = [
  // Company
  { title: "GmbHG — Gesetz betreffend die Gesellschaften mit beschränkter Haftung", description: "German LLC law. GmbH requires €25,000 share capital (€12,500 deposited). UG (mini-GmbH) from €1.", law_ref: "GmbHG", url: "https://www.gesetze-im-internet.de/gmbhg/", keywords: ["gmbh", "gmbhg", "gesellschaft", "limited liability", "ug", "haftungsbeschränkt"], topic: "company", jurisdiction: "germany" },
  { title: "HGB — Handelsgesetzbuch (Commercial Code)", description: "German Commercial Code. Merchant obligations, commercial register, partnerships (OHG, KG), accounting standards.", law_ref: "HGB", url: "https://www.gesetze-im-internet.de/hgb/", keywords: ["hgb", "handelsgesetzbuch", "commercial code", "merchant", "handelsregister", "ohg", "kg"], topic: "company", jurisdiction: "germany" },
  { title: "AktG — Aktiengesetz (Stock Corporation Act)", description: "German stock corporation law. AG requires €50,000 minimum capital. Board structure: Vorstand + Aufsichtsrat.", law_ref: "AktG", url: "https://www.gesetze-im-internet.de/aktg/", keywords: ["aktg", "aktiengesetz", "ag", "stock corporation", "vorstand", "aufsichtsrat"], topic: "company", jurisdiction: "germany" },
  { title: "BGB — Bürgerliches Gesetzbuch (Civil Code)", description: "German Civil Code. Contracts, obligations, property, family, inheritance. Foundation of German private law.", law_ref: "BGB", url: "https://www.gesetze-im-internet.de/bgb/", keywords: ["bgb", "bürgerliches gesetzbuch", "civil code", "contract", "obligation"], topic: "company", jurisdiction: "germany" },
  // Tax
  { title: "EStG — Einkommensteuergesetz (Income Tax Act)", description: "German personal income tax. Progressive rates 14-45% + 5.5% solidarity surcharge. Tax classes I-VI.", law_ref: "EStG", url: "https://www.gesetze-im-internet.de/estg/", keywords: ["estg", "einkommensteuer", "income tax", "lohnsteuer", "tax class"], topic: "tax", jurisdiction: "germany" },
  { title: "KStG — Körperschaftsteuergesetz (Corporate Tax Act)", description: "German corporate tax. 15% flat + 5.5% solidarity surcharge = ~15.8%. Plus trade tax (Gewerbesteuer) ~14%.", law_ref: "KStG", url: "https://www.gesetze-im-internet.de/kstg_1977/", keywords: ["kstg", "körperschaftsteuer", "corporate tax", "gewerbesteuer", "trade tax"], topic: "tax", jurisdiction: "germany" },
  { title: "UStG — Umsatzsteuergesetz (VAT Act)", description: "German VAT. Standard 19%, reduced 7%. Kleinunternehmerregelung (small business exemption) under €22,000.", law_ref: "UStG", url: "https://www.gesetze-im-internet.de/ustg_1980/", keywords: ["ustg", "umsatzsteuer", "mwst", "vat", "mehrwertsteuer", "kleinunternehmer"], topic: "tax", jurisdiction: "germany" },
  { title: "AO — Abgabenordnung (Tax Code)", description: "German general tax procedure code. Tax residency, filing obligations, penalties, tax secrecy.", law_ref: "AO", url: "https://www.gesetze-im-internet.de/ao_1977/", keywords: ["abgabenordnung", "ao", "tax code", "tax procedure", "finanzamt"], topic: "tax", jurisdiction: "germany" },
  // Labor
  { title: "Arbeitszeitgesetz (Working Time Act)", description: "Max 8h/day (10h with compensation). Sunday rest. 24 days minimum annual leave.", law_ref: "ArbZG", url: "https://www.gesetze-im-internet.de/arbzg/", keywords: ["arbeitszeitgesetz", "working time", "arbeitszeit", "urlaub", "overtime"], topic: "labor", jurisdiction: "germany" },
  { title: "Kündigungsschutzgesetz (Dismissal Protection Act)", description: "Dismissal protection for companies with 10+ employees. Social selection criteria. Notice periods.", law_ref: "KSchG", url: "https://www.gesetze-im-internet.de/kschg/", keywords: ["kündigungsschutz", "dismissal", "kündigung", "protection", "notice"], topic: "labor", jurisdiction: "germany" },
  { title: "Mindestlohngesetz (Minimum Wage Act)", description: "German minimum wage law. €12.82/hour (2025). Annual adjustment by commission.", law_ref: "MiLoG", url: "https://www.gesetze-im-internet.de/milog/", keywords: ["mindestlohn", "minimum wage", "milog"], topic: "labor", jurisdiction: "germany" },
  // Data Protection
  { title: "BDSG — Bundesdatenschutzgesetz", description: "Federal Data Protection Act. Supplements GDPR with German-specific provisions. DPO requirements.", law_ref: "BDSG", url: "https://www.gesetze-im-internet.de/bdsg_2018/", keywords: ["bdsg", "datenschutz", "data protection", "privacy", "dpo"], topic: "data_protection", jurisdiction: "germany" },
  // Social Security
  { title: "SGB — Sozialgesetzbuch (Social Code)", description: "German social security code (12 books). Health, pension, unemployment, accident, long-term care insurance.", law_ref: "SGB I-XII", url: "https://www.gesetze-im-internet.de/sgb_1/", keywords: ["sgb", "sozialgesetzbuch", "social security", "krankenversicherung", "rente", "pension"], topic: "social_security", jurisdiction: "germany" },
  // Startup
  { title: "EXIST — Existenzgründung aus der Wissenschaft", description: "Federal startup funding from universities. €150K-250K grants for tech startups. Supported by BMWK.", law_ref: "EXIST Program (BMWK)", url: "https://www.exist.de/", keywords: ["exist", "startup funding", "university", "gründung", "grant"], topic: "funding", jurisdiction: "germany" },
];

// ============================================================
// SPAIN
// ============================================================
export const SPAIN_LAWS: LawEntry[] = [
  // Company
  { title: "Ley de Sociedades de Capital", description: "Spanish company law. SL (€3,000 min), SA (€60,000 min). Formation, governance, dissolution.", law_ref: "RDL 1/2010", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544", keywords: ["sociedades capital", "sl", "sa", "sociedad limitada", "company formation"], topic: "company", jurisdiction: "spain" },
  { title: "Ley de Startups (Ley Crea y Crece)", description: "Spanish Startup Act 2022. €1 SL formation, digital incorporation, tax incentives for startups and investors.", law_ref: "Ley 28/2022", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2022-21739", keywords: ["startup", "emprendedor", "crea crece", "innovación", "digital nomad"], topic: "company", jurisdiction: "spain" },
  { title: "Estatuto del Trabajo Autónomo", description: "Self-employed workers statute. Rights, obligations, social security for autónomos.", law_ref: "Ley 20/2007", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-13409", keywords: ["autónomo", "self employed", "freelancer", "trabajador autónomo"], topic: "company", jurisdiction: "spain" },
  // Tax
  { title: "IRPF — Impuesto sobre la Renta de las Personas Físicas", description: "Spanish personal income tax. Progressive 19-47%. Savings income 19-28%.", law_ref: "Ley 35/2006", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764", keywords: ["irpf", "renta", "income tax", "personas físicas"], topic: "tax", jurisdiction: "spain" },
  { title: "Impuesto sobre Sociedades", description: "Spanish corporate tax. 25% standard, 15% for new companies first 2 years.", law_ref: "Ley 27/2014", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328", keywords: ["impuesto sociedades", "corporate tax", "beneficios"], topic: "tax", jurisdiction: "spain" },
  { title: "IVA — Impuesto sobre el Valor Añadido", description: "Spanish VAT. Standard 21%, reduced 10%, super-reduced 4%.", law_ref: "Ley 37/1992", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740", keywords: ["iva", "vat", "valor añadido"], topic: "tax", jurisdiction: "spain" },
  { title: "Beckham Law — Special Tax Regime for Inbound Workers", description: "Flat 24% tax (up to €600K) for foreign workers relocating to Spain. 6-year regime. Excludes employment income abroad.", law_ref: "IRPF art. 93 (RD 687/2005)", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764", keywords: ["beckham law", "impatriados", "flat tax", "relocation", "nomad"], topic: "tax", jurisdiction: "spain" },
  // Labor
  { title: "Estatuto de los Trabajadores", description: "Spanish workers' statute. Employment contracts, dismissal, working time (40h/week), collective bargaining.", law_ref: "RDL 2/2015", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430", keywords: ["estatuto trabajadores", "labor", "empleo", "contrato", "despido", "workers"], topic: "labor", jurisdiction: "spain" },
  // Data Protection
  { title: "LOPDGDD — Ley Orgánica de Protección de Datos", description: "Spanish data protection law implementing GDPR. AEPD enforcement.", law_ref: "LO 3/2018", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673", keywords: ["lopd", "protección datos", "data protection", "aepd", "privacy"], topic: "data_protection", jurisdiction: "spain" },
  // Social Security
  { title: "Ley General de la Seguridad Social", description: "Spanish social security framework. Employee contributions ~6.4%, employer ~30%. Covers health, pension, unemployment.", law_ref: "RDL 8/2015", url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724", keywords: ["seguridad social", "social security", "cotización", "pension"], topic: "social_security", jurisdiction: "spain" },
  // Civil Code
  { title: "Código Civil", description: "Spanish Civil Code. Persons, property, contracts, obligations, inheritance.", law_ref: "RD 24/07/1889", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763", keywords: ["código civil", "civil code", "contrato", "propiedad", "herencia"], topic: "civil", jurisdiction: "spain" },
  { title: "Código de Comercio", description: "Spanish Commercial Code. Commercial activities, merchant obligations, commercial contracts.", law_ref: "RD 22/08/1885", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1885-6627", keywords: ["código comercio", "commercial code", "mercantil", "comerciante"], topic: "company", jurisdiction: "spain" },
];

// ============================================================
// PARAGUAY
// ============================================================
export const PARAGUAY_LAWS: LawEntry[] = [
  // Tax
  { title: "Ley 6380/2019 — Modernización del Sistema Tributario", description: "Main tax reform. Territorial taxation: only Paraguayan-source income taxed. IRP 8-10%, IRE 10%, IVA 10%/5%.", law_ref: "Ley 6380/2019", url: "https://www.dnit.gov.py/documents/20123/0/LEY+6380.pdf", keywords: ["ley 6380", "sistema tributario", "territorial", "irp", "ire", "tax reform"], topic: "tax", jurisdiction: "paraguay" },
  { title: "IRP — Impuesto a la Renta Personal", description: "Personal income tax. Territorial system: foreign-source income = 0%. Rates: 8% (up to 50M PYG excess), 10% above.", law_ref: "Ley 6380/2019, Libro I", url: "https://www.dnit.gov.py/web/portal-institucional/irp", keywords: ["irp", "renta personal", "income tax", "personal tax", "territorial"], topic: "tax", jurisdiction: "paraguay" },
  { title: "IRE — Impuesto a la Renta Empresarial", description: "Corporate income tax. 10% flat on net Paraguayan-source income. Foreign income excluded.", law_ref: "Ley 6380/2019, Libro I", url: "https://www.dnit.gov.py/web/portal-institucional/ire", keywords: ["ire", "renta empresarial", "corporate tax", "10%"], topic: "tax", jurisdiction: "paraguay" },
  { title: "IVA — Impuesto al Valor Agregado", description: "Paraguayan VAT. Standard 10%, reduced 5% (basic goods, rent, interest). Export services 0%.", law_ref: "Ley 6380/2019, Libro II", url: "https://www.dnit.gov.py/web/portal-institucional/iva", keywords: ["iva", "vat", "valor agregado", "10%", "5%"], topic: "tax", jurisdiction: "paraguay" },
  { title: "RG 77/2021 — Certificado de Residencia Fiscal", description: "Procedure to obtain tax residency certificate from DNIT. Requires Cédula + RUC + proof of domicile.", law_ref: "Resolución General 77/2021", url: "https://www.dnit.gov.py/web/portal-institucional/resoluciones", keywords: ["residencia fiscal", "tax residency", "certificate", "certificado", "dnit"], topic: "tax", jurisdiction: "paraguay" },
  { title: "RUC — Registro Único del Contribuyente", description: "Taxpayer ID. Required for all tax operations. Obtain at DNIT with Cédula + proof of domicile.", law_ref: "Decreto 3107/2019", url: "https://www.dnit.gov.py/web/portal-institucional/ruc", keywords: ["ruc", "taxpayer", "contribuyente", "registro", "tax id"], topic: "tax", jurisdiction: "paraguay" },
  // Company
  { title: "Ley del Comerciante — Código de Comercio", description: "Paraguayan Commercial Code. Company types: SA, SRL, SCS. Formation, governance, dissolution.", law_ref: "Ley 1034/1983", url: "https://www.bacn.gov.py/leyes-paraguayas/2384/ley-n-1034-del-comerciante", keywords: ["código comercio", "comerciante", "sa", "srl", "company formation", "sociedad"], topic: "company", jurisdiction: "paraguay" },
  { title: "Ley General de Sociedades", description: "General company law. SRL (€1 equivalent minimum), SA formation, shareholder rights, mergers.", law_ref: "Ley 1183/1985 (Código Civil, Libro III)", url: "https://www.bacn.gov.py/leyes-paraguayas/2404/ley-n-1183-codigo-civil", keywords: ["sociedad", "srl", "sa", "limited liability", "formation"], topic: "company", jurisdiction: "paraguay" },
  // Immigration/Residency
  { title: "Ley de Migraciones", description: "Immigration law. Temporary residency (2 years, renewable), permanent residency. Entry once/year to maintain status.", law_ref: "Ley 978/1996", url: "https://www.migraciones.gov.py/", keywords: ["migraciones", "residencia", "residency", "immigration", "temporary", "permanent", "cédula"], topic: "residency", jurisdiction: "paraguay" },
  { title: "Cédula de Identidad", description: "Paraguayan ID card. Required for banking, tax registration, all legal procedures. Issued by Departamento de Identificaciones.", law_ref: "Ley 1682/2001", url: "https://www.policianacional.gov.py/identificaciones/", keywords: ["cédula", "identidad", "id card", "identification"], topic: "residency", jurisdiction: "paraguay" },
  // Labor
  { title: "Código Laboral", description: "Paraguayan labor code. 48h work week, minimum wage, dismissal rules, social benefits, unions.", law_ref: "Ley 213/1993", url: "https://www.bacn.gov.py/leyes-paraguayas/4073/ley-n-213-codigo-del-trabajo", keywords: ["código laboral", "trabajo", "labor", "salario", "minimum wage", "despido"], topic: "labor", jurisdiction: "paraguay" },
  // Social Security
  { title: "IPS — Instituto de Previsión Social", description: "Paraguayan social security. Employee: 9%, employer: 16.5%. Health + retirement coverage.", law_ref: "Decreto-Ley 1860/1950 + modifications", url: "https://www.ips.gov.py/", keywords: ["ips", "previsión social", "social security", "pension", "seguro"], topic: "social_security", jurisdiction: "paraguay" },
  // Data Protection
  { title: "Ley de Protección de Datos Personales", description: "Data protection law passed 2025. Consent-based processing. 24-month implementation period.", law_ref: "Ley (2025, pending number)", url: "https://www.bacn.gov.py/", keywords: ["protección datos", "data protection", "privacy", "datos personales"], topic: "data_protection", jurisdiction: "paraguay" },
  // Digital Nomad
  { title: "Paraguay Digital Nomad Framework", description: "No specific visa. Use temporary residency + RUC + tax certificate. 120-day deemed residency rule. Foreign income 0% under territorial system.", law_ref: "Ley 6380/2019 + Ley 978/1996", url: "https://www.dnit.gov.py/web/portal-institucional", keywords: ["digital nomad", "nomade", "remote work", "territorial", "0%", "foreign income"], topic: "residency", jurisdiction: "paraguay" },
];

/**
 * All laws by jurisdiction key
 */
export const ALL_INDEXED_LAWS: Record<string, LawEntry[]> = {
  eu: EU_LAWS,
  italy: ITALY_LAWS,
  greece: GREECE_LAWS,
  uk: UK_LAWS,
  france: FRANCE_LAWS,
  germany: GERMANY_LAWS,
  spain: SPAIN_LAWS,
  paraguay: PARAGUAY_LAWS,
};

/**
 * Get laws for a specific jurisdiction
 */
export function getLaws(jurisdiction: string): LawEntry[] {
  return ALL_INDEXED_LAWS[jurisdiction] || [];
}

/**
 * Get all laws across all jurisdictions
 */
export function getAllLaws(): LawEntry[] {
  return Object.values(ALL_INDEXED_LAWS).flat();
}
