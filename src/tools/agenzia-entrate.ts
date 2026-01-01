/**
 * Agenzia Entrate Circolari Tool
 * Search and retrieve Italian tax authority circolari and guidance
 *
 * Base URL: https://www.agenziaentrate.gov.it
 * Circolari Path: /portale/web/guest/normativa-e-prassi/circolari
 *
 * UPDATED: Added live web search fallback (GAP-TSH-003 fix)
 */

import * as cheerio from "cheerio";
import { getSourceConfig, isSourceEnabled } from "../config/index.js";
import type {
  CircolariSearchArgs,
  ToolSuccessResponse,
  ToolErrorResponse,
} from "../types.js";

/**
 * Result structure for Circolari queries
 */
interface CircolareResult {
  number: string;
  year: number;
  title: string;
  date: string;
  topic: string;
  pdf_url?: string;
  page_url: string;
}

/**
 * Pre-indexed important circolari for direct access
 * These are commonly requested documents with known URLs
 * EXPANDED: Added more keywords and additional circolari (GAP-TSH-002 fix)
 */
const KNOWN_CIRCOLARI: Record<string, CircolareResult> = {
  "33/E-2020": {
    number: "33/E",
    year: 2020,
    title: "Regime speciale per lavoratori impatriati - Art. 16 D.Lgs. 147/2015",
    date: "2020-12-28",
    topic: "Rientro dei Cervelli, impatriati, agevolazioni fiscali, lavoratori rimpatriati, tassazione agevolata, residenza fiscale, trasferimento Italia",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/3930219/Circolare+n.+33+del+28+dicembre+2020.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari/-/asset_publisher/Normativa/content/circolare-n-33-e-del-28-dicembre-2020",
  },
  "17/E-2017": {
    number: "17/E",
    year: 2017,
    title: "Start-up innovative - Agevolazioni fiscali per investimenti in start-up e PMI innovative",
    date: "2017-05-24",
    topic: "startup innovativa, startup innovative, start-up, agevolazioni investimenti, detrazione IRPEF, deduzione IRES, PMI innovative, costituzione startup, esenzione bollo, diritti camerali",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/287962/circolare+17+del+24+maggio+2017.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari",
  },
  "25/E-2022": {
    number: "25/E",
    year: 2022,
    title: "Regime impatriati - Chiarimenti e novita normative",
    date: "2022-08-04",
    topic: "Impatriati, rientro cervelli, requisiti, proroga, residenza estero, trasferimento Italia, agevolazioni fiscali",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/4732571/Circolare+n.+25+del+4+agosto+2022.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari",
  },
  "9/E-2019": {
    number: "9/E",
    year: 2019,
    title: "Flat tax per nuovi residenti - Art. 24-bis TUIR",
    date: "2019-04-10",
    topic: "Flat tax, nuovi residenti, HNWI, imposta sostitutiva, 100.000 euro, redditi esteri, high net worth",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/233439/Circolare+n.+9+del+10+aprile+2019_circolare+9E+del+10042019.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari",
  },
  "16/E-2019": {
    number: "16/E",
    year: 2019,
    title: "Regime forfetario - Modifiche legge di bilancio 2019",
    date: "2019-06-06",
    topic: "Regime forfetario, partita IVA, flat tax, 65.000, requisiti forfetario, esclusioni, contribuenti minimi",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/233439/Circolare+n.+16+del+6+giugno+2019.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari",
  },
  // NEW ENTRIES (GAP-TSH-002)
  "11/E-2014": {
    number: "11/E",
    year: 2014,
    title: "Start-up innovative - Disciplina delle agevolazioni fiscali e contributive",
    date: "2014-04-21",
    topic: "startup innovativa, costituzione, atto costitutivo, esenzione imposta bollo, diritti segreteria, diritti camerali, SRL, societa di capitali, modello standard, costituzione gratuita",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/287962/Circolare+11E+del+21+aprile+2014.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari",
  },
  "16/E-2014": {
    number: "16/E",
    year: 2014,
    title: "Start-up innovative - Requisiti e adempimenti",
    date: "2014-06-11",
    topic: "startup innovativa, requisiti, R&D, spese ricerca sviluppo, personale qualificato, brevetti, sezione speciale registro imprese, autocertificazione",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/287962/Circolare+16E+del+11+giugno+2014.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari",
  },
  "5/E-2021": {
    number: "5/E",
    year: 2021,
    title: "Regime impatriati - Opzione per proroga quinquennale",
    date: "2021-03-26",
    topic: "impatriati, proroga 5 anni, opzione, versamento, figli minori, immobile residenziale, estensione beneficio",
    pdf_url:
      "https://www.agenziaentrate.gov.it/portale/documents/20143/3756100/Circolare+n.+5+del+26+marzo+2021.pdf",
    page_url:
      "https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/circolari",
  },
};

/**
 * Topic keywords for filtering circolari
 */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  redditi: ["reddito", "irpef", "imposta", "dichiarazione", "730", "unico"],
  iva: ["iva", "fattura", "detrazione", "aliquota", "split payment"],
  registro: ["registro", "atti", "successione", "donazione"],
  successioni: ["successione", "eredita", "legato", "donazione"],
  agevolazioni: [
    "agevolazione",
    "bonus",
    "credito",
    "detrazione",
    "incentivo",
    "startup",
    "impatriati",
    "forfetario",
  ],
};

/**
 * Search known circolari by keyword
 * IMPROVED: Uses word-based partial matching for better results (GAP-TSH-002 fix)
 */
function searchKnownCircolari(
  query: string,
  topic?: string
): CircolareResult[] {
  // Split query into words for partial matching (filter words < 3 chars)
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const queryLower = query.toLowerCase();
  const results: { circolare: CircolareResult; score: number }[] = [];

  for (const [key, circolare] of Object.entries(KNOWN_CIRCOLARI)) {
    const searchText = `${circolare.title} ${circolare.topic} ${circolare.number} ${key}`.toLowerCase();

    // Check if ANY query word matches (partial matching)
    const matchingWords = queryWords.filter(word => searchText.includes(word));
    const hasMatch = matchingWords.length > 0 || searchText.includes(queryLower);

    // Check topic filter if provided
    let topicMatches = true;
    if (topic && topic !== "all") {
      const topicKeywords = TOPIC_KEYWORDS[topic] || [];
      topicMatches = topicKeywords.some(kw => searchText.includes(kw));
    }

    if (hasMatch && topicMatches) {
      // Calculate relevance score (more matching words = higher score)
      const score = matchingWords.length + (searchText.includes(queryLower) ? 2 : 0);
      results.push({ circolare, score });
    }
  }

  // Sort by relevance score (descending) then by year (descending)
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.circolare.year - a.circolare.year;
  });

  return results.map(r => r.circolare);
}

/**
 * Build the Agenzia Entrate search URL
 */
function buildSearchUrl(baseUrl: string, query: string, path: string): string {
  // Agenzia Entrate uses a complex portal system
  // This constructs a search-friendly URL
  const searchPath = `${path}?p_p_id=101_INSTANCE_&keywords=${encodeURIComponent(query)}`;
  return `${baseUrl}${searchPath}`;
}

/**
 * Live search Agenzia Entrate portal (fallback when pre-index has no results)
 * GAP-TSH-003 fix: Adds web scraping fallback for circolari search
 */
async function searchPortalLive(
  baseUrl: string,
  query: string,
  circolariPath: string,
  limit: number = 10
): Promise<{ results: CircolareResult[]; debug: { htmlLength: number; approach: string } }> {
  // Try multiple search URL patterns since AgE portal structure varies
  const searchUrls = [
    `${baseUrl}${circolariPath}?p_p_id=101_INSTANCE_&keywords=${encodeURIComponent(query)}`,
    `${baseUrl}/portale/web/guest/ricerca?p_p_id=com_liferay_portal_search_web_portlet_SearchPortlet&keywords=${encodeURIComponent(query)}&scope=circolari`,
    `${baseUrl}/portale/ricerca?query=${encodeURIComponent(query)}&category=circolari`,
  ];

  for (const searchUrl of searchUrls) {
    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        continue; // Try next URL
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const results: CircolareResult[] = [];
      const debug = { htmlLength: html.length, approach: "none" };

      // APPROACH 1: Liferay search results (AgE uses Liferay)
      $('.search-result, .asset-entry, .journal-article-content, .search-container-result').slice(0, limit).each((_, el) => {
        const $el = $(el);
        const title = $el.find('.asset-title, h4, h3, .title a, .entry-title').first().text().trim();
        const link = $el.find('a').first().attr('href') || '';
        const dateText = $el.find('.modified-date, .date, time, .entry-date').first().text().trim();
        const summary = $el.find('.asset-summary, .summary, .description, p').first().text().trim();

        // Extract number from title (e.g., "Circolare n. 33/E" or "33/E")
        const numberMatch = title.match(/n\.\s*(\d+\/[A-Z])/i) || title.match(/(\d+\/[A-Z])/i);
        const yearMatch = dateText.match(/\d{4}/) || title.match(/\d{4}/);

        if (title && title.length > 10) {
          results.push({
            number: numberMatch?.[1] || '',
            year: yearMatch ? parseInt(yearMatch[0]) : 0,
            title: title.substring(0, 300),
            date: dateText || '',
            topic: summary.substring(0, 200) || query,
            pdf_url: link.includes('.pdf') ? (link.startsWith('http') ? link : `${baseUrl}${link}`) : undefined,
            page_url: link.startsWith('http') ? link : `${baseUrl}${link}`,
          });
          debug.approach = "liferay";
        }
      });

      // APPROACH 2: Table-based results
      if (results.length === 0) {
        $('table tbody tr, .table-responsive tbody tr').slice(0, limit).each((_, el) => {
          const $el = $(el);
          const cells = $el.find('td');
          if (cells.length >= 2) {
            const title = cells.eq(0).text().trim() || cells.eq(1).text().trim();
            const link = $el.find('a').first().attr('href') || '';
            const dateText = cells.last().text().trim();

            const numberMatch = title.match(/(\d+\/[A-Z])/i);
            const yearMatch = dateText.match(/\d{4}/) || title.match(/\d{4}/);

            if (title && title.length > 5) {
              results.push({
                number: numberMatch?.[1] || '',
                year: yearMatch ? parseInt(yearMatch[0]) : 0,
                title: title.substring(0, 300),
                date: dateText,
                topic: query,
                pdf_url: link.includes('.pdf') ? (link.startsWith('http') ? link : `${baseUrl}${link}`) : undefined,
                page_url: link.startsWith('http') ? link : link ? `${baseUrl}${link}` : searchUrl,
              });
              debug.approach = "table";
            }
          }
        });
      }

      // APPROACH 3: List-based results
      if (results.length === 0) {
        $('ul.results li, ol.results li, .list-group-item, .search-results li').slice(0, limit).each((_, el) => {
          const $el = $(el);
          const title = $el.find('a, h4, h5').first().text().trim() || $el.text().trim().substring(0, 200);
          const link = $el.find('a').first().attr('href') || '';

          const numberMatch = title.match(/(\d+\/[A-Z])/i);
          const yearMatch = title.match(/\d{4}/);

          if (title && title.length > 10) {
            results.push({
              number: numberMatch?.[1] || '',
              year: yearMatch ? parseInt(yearMatch[0]) : 0,
              title: title.substring(0, 300),
              date: '',
              topic: query,
              page_url: link.startsWith('http') ? link : link ? `${baseUrl}${link}` : searchUrl,
            });
            debug.approach = "list";
          }
        });
      }

      // APPROACH 4: Any anchor containing "circolare"
      if (results.length === 0) {
        $('a[href*="circolar"], a:contains("Circolare"), a:contains("circolare")').slice(0, limit).each((_, el) => {
          const $el = $(el);
          const title = $el.text().trim();
          const link = $el.attr('href') || '';

          const numberMatch = title.match(/(\d+\/[A-Z])/i);
          const yearMatch = title.match(/\d{4}/);

          if (title && title.length > 10 && !title.toLowerCase().includes('menu') && !title.toLowerCase().includes('home')) {
            results.push({
              number: numberMatch?.[1] || '',
              year: yearMatch ? parseInt(yearMatch[0]) : 0,
              title: title.substring(0, 300),
              date: '',
              topic: query,
              page_url: link.startsWith('http') ? link : link ? `${baseUrl}${link}` : searchUrl,
            });
            debug.approach = "anchor";
          }
        });
      }

      if (results.length > 0) {
        return { results, debug };
      }
      // If no results with this URL, continue to next

    } catch (error) {
      console.error(`Live search error for ${searchUrl}: ${error}`);
      continue; // Try next URL
    }
  }

  return { results: [], debug: { htmlLength: 0, approach: "none" } };
}

/**
 * Lookup circolare by number and year
 */
function lookupByNumberYear(
  number: string,
  year: number
): CircolareResult | null {
  // Normalize the number format (e.g., "33/E" or "33E" or "33")
  const normalizedNumber = number.toUpperCase().replace(/\s/g, "");
  const key = `${normalizedNumber}-${year}`;

  // Try exact match first
  if (KNOWN_CIRCOLARI[key]) {
    return KNOWN_CIRCOLARI[key];
  }

  // Try variations
  for (const [k, v] of Object.entries(KNOWN_CIRCOLARI)) {
    if (v.year === year) {
      const kNumber = k.split("-")[0];
      if (
        kNumber === normalizedNumber ||
        kNumber.replace("/", "") === normalizedNumber.replace("/", "")
      ) {
        return v;
      }
    }
  }

  return null;
}

/**
 * Handle Agenzia Entrate tool calls
 */
export async function handleCircolari(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_circolari";

  // Check if source is enabled
  if (!isSourceEnabled("agenzia_entrate")) {
    return {
      status: "error",
      tool: toolName,
      error: "Agenzia Entrate source is disabled in configuration",
      code: "SOURCE_DISABLED",
    };
  }

  // Validate required arguments
  const input = args as unknown as CircolariSearchArgs;
  if (!input.query) {
    return {
      status: "error",
      tool: toolName,
      error: "The 'query' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const config = getSourceConfig("agenzia_entrate");
    const baseUrl = config.base_url || "https://www.agenziaentrate.gov.it";
    const circolariPath =
      config.circolari_path || "/portale/web/guest/normativa-e-prassi/circolari";

    // Direct lookup by number and year
    if (input.number && input.year) {
      const directResult = lookupByNumberYear(input.number, input.year);

      if (directResult) {
        return {
          status: "success",
          tool: toolName,
          source: "Agenzia delle Entrate",
          timestamp: new Date().toISOString(),
          data: {
            action: "direct_lookup",
            query: `${input.number}/${input.year}`,
            result: directResult,
            note: "Retrieved from pre-indexed circolari database",
          },
        };
      }

      // Not found in pre-indexed - search for it
      const searchResults = searchKnownCircolari(
        `${input.number} ${input.year}`,
        input.topic
      );

      return {
        status: "success",
        tool: toolName,
        source: "Agenzia delle Entrate",
        timestamp: new Date().toISOString(),
        data: {
          action: "direct_lookup",
          query: `${input.number}/${input.year}`,
          error: `Circolare ${input.number}/${input.year} not found in pre-indexed database`,
          suggestion:
            "Try searching on the official portal or check the number format",
          search_url: buildSearchUrl(
            baseUrl,
            `circolare ${input.number} ${input.year}`,
            circolariPath
          ),
          similar_results: searchResults.slice(0, 5),
        },
      };
    }

    // Search by keyword in pre-indexed circolari
    const knownResults = searchKnownCircolari(input.query, input.topic);

    // GAP-TSH-003: If no pre-indexed results, try live search
    let liveResults: CircolareResult[] = [];
    let liveDebug = { htmlLength: 0, approach: "none" };

    if (knownResults.length === 0) {
      const liveSearch = await searchPortalLive(baseUrl, input.query, circolariPath);
      liveResults = liveSearch.results;
      liveDebug = liveSearch.debug;
    }

    // Combine results (pre-indexed first, then live)
    const allResults = [...knownResults, ...liveResults];

    // Build portal search URL for additional results
    const portalSearchUrl = buildSearchUrl(baseUrl, input.query, circolariPath);

    return {
      status: "success",
      tool: toolName,
      source: "Agenzia delle Entrate",
      timestamp: new Date().toISOString(),
      data: {
        action: "search",
        query: input.query,
        topic: input.topic || "all",
        result_count: allResults.length,
        results: allResults,
        pre_indexed_count: knownResults.length,
        live_search_count: liveResults.length,
        portal_search_url: portalSearchUrl,
        debug_info: liveResults.length > 0 ? {
          live_search_html_length: liveDebug.htmlLength,
          live_search_approach: liveDebug.approach,
        } : undefined,
        note:
          allResults.length > 0
            ? knownResults.length > 0 && liveResults.length === 0
              ? "Results from pre-indexed circolari database. For more results, visit the portal URL."
              : knownResults.length === 0 && liveResults.length > 0
                ? `Found ${liveResults.length} results via live portal search (approach: ${liveDebug.approach}).`
                : `Found ${knownResults.length} pre-indexed + ${liveResults.length} live results.`
            : "No results found in pre-indexed database or live search. Visit the portal URL for manual search.",
        available_topics: Object.keys(TOPIC_KEYWORDS),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to search circolari: ${errorMessage}`,
      code: "SEARCH_ERROR",
    };
  }
}
