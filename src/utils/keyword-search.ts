/**
 * Multilingual keyword search with fuzzy matching.
 * Shared across all jurisdiction tools for Layer 1 (pre-indexed) search.
 */

export interface LawEntry {
  title: string;
  description: string;
  law_ref: string;
  url: string;
  keywords: string[];
  topic: string;
  jurisdiction: string;
}

/**
 * Multilingual synonym mappings — English key → translations/variants
 * Enables "income tax" to match "impuesto a la renta", "Einkommensteuer", etc.
 */
const SYNONYMS: Record<string, string[]> = {
  // Tax
  "income tax": ["impuesto renta", "imposta redditi", "irpef", "irp", "ire", "einkommensteuer", "impôt revenu", "φόρος εισοδήματος", "renta personal"],
  "corporate tax": ["impuesto sociedades", "ires", "körperschaftsteuer", "impôt sociétés", "φόρος εταιρειών", "imposta società"],
  "vat": ["iva", "umsatzsteuer", "mwst", "tva", "φπα", "value added tax", "mehrwertsteuer"],
  "tax residency": ["residencia fiscal", "residenza fiscale", "steuerlicher wohnsitz", "résidence fiscale", "φορολογική κατοικία"],
  "tax": ["impuesto", "imposta", "steuer", "impôt", "φόρος", "tributo", "tributario", "fiscal"],

  // Company
  "company": ["empresa", "società", "gesellschaft", "société", "εταιρεία", "sociedad", "impresa"],
  "company formation": ["creación empresa", "costituzione società", "firmengründung", "création entreprise", "σύσταση εταιρείας", "constitución sociedad"],
  "limited liability": ["responsabilidad limitada", "responsabilità limitata", "beschränkter haftung", "responsabilité limitée", "srl", "sarl", "gmbh", "ltd", "ike", "epe"],
  "startup": ["startup innovativa", "empresa emergente", "jeune entreprise", "neugründung", "νεοφυής"],

  // Labor
  "labor": ["trabajo", "lavoro", "arbeit", "travail", "εργασία", "empleo", "employment"],
  "employment": ["empleo", "occupazione", "beschäftigung", "emploi", "απασχόληση", "lavoro"],
  "social security": ["seguridad social", "previdenza sociale", "sozialversicherung", "sécurité sociale", "κοινωνική ασφάλιση", "efka", "inps"],

  // Data protection
  "data protection": ["protección datos", "protezione dati", "datenschutz", "protection données", "προστασία δεδομένων", "gdpr", "privacy"],
  "privacy": ["privacidad", "riservatezza", "privatsphäre", "vie privée", "ιδιωτικότητα"],

  // Residency/immigration
  "residency": ["residencia", "residenza", "wohnsitz", "résidence", "κατοικία", "domicilio"],
  "digital nomad": ["nómada digital", "nomade digitale", "digitaler nomade", "nomade numérique", "ψηφιακός νομάς"],
  "investment": ["inversión", "investimento", "investition", "investissement", "επένδυση"],

  // General
  "law": ["ley", "legge", "gesetz", "loi", "νόμος", "decreto", "ordonnance"],
  "regulation": ["regulación", "regolamento", "verordnung", "règlement", "κανονισμός"],
  "code": ["código", "codice", "gesetzbuch", "code", "κώδικας"],
};

/**
 * Normalize text for comparison: lowercase, remove accents, collapse whitespace
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expand query with multilingual synonyms
 */
function expandQuery(query: string): string[] {
  const normalized = normalize(query);
  const terms = [normalized];

  for (const [key, synonyms] of Object.entries(SYNONYMS)) {
    const normKey = normalize(key);
    if (normalized.includes(normKey) || synonyms.some(s => normalized.includes(normalize(s)))) {
      terms.push(normKey);
      for (const syn of synonyms) {
        terms.push(normalize(syn));
      }
    }
  }

  // Also add individual words from query
  for (const word of normalized.split(" ")) {
    if (word.length > 2) {
      terms.push(word);
    }
  }

  return [...new Set(terms)];
}

/**
 * Score a law entry against expanded query terms.
 * Higher = better match.
 */
function scoreLaw(law: LawEntry, expandedTerms: string[]): number {
  let score = 0;
  const titleNorm = normalize(law.title);
  const descNorm = normalize(law.description);
  const keywordsNorm = law.keywords.map(normalize);

  for (const term of expandedTerms) {
    // Title match = highest value
    if (titleNorm.includes(term)) score += 10;
    // Keyword exact match = high value
    if (keywordsNorm.some(k => k === term)) score += 8;
    // Keyword partial match
    if (keywordsNorm.some(k => k.includes(term) || term.includes(k))) score += 5;
    // Description match
    if (descNorm.includes(term)) score += 3;
    // Law ref match
    if (normalize(law.law_ref).includes(term)) score += 7;
  }

  return score;
}

/**
 * Search pre-indexed laws with multilingual fuzzy matching.
 *
 * @param laws - Array of pre-indexed law entries
 * @param query - User search query (any language)
 * @param topic - Optional topic filter
 * @param limit - Max results (default 10)
 * @returns Ranked array of matching laws
 */
export function searchIndexedLaws(
  laws: LawEntry[],
  query: string,
  topic?: string,
  limit: number = 10
): LawEntry[] {
  const expandedTerms = expandQuery(query);

  let filtered = laws;
  if (topic && topic !== "all") {
    filtered = laws.filter(l => l.topic === topic);
  }

  const scored = filtered
    .map(law => ({ law, score: scoreLaw(law, expandedTerms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ law }) => law);

  // If no scored results, try broader: return all laws for the topic
  if (scored.length === 0 && topic && topic !== "all") {
    return laws.filter(l => l.topic === topic).slice(0, limit);
  }

  return scored;
}
