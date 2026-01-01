/**
 * Normattiva Integration Tool
 * Fetches Italian legislation from normattiva.it
 *
 * Normattiva uses URN-based access for consolidated legislation:
 * - URN format: urn:nir:stato:{act_type}:{date};{number}
 * - URL: https://www.normattiva.it/uri-res/N2Ls?{urn}
 *
 * Supports:
 * - Direct lookup by act type + year + number
 * - Search by keywords (uses Playwright for JS-rendered content)
 * - Article list extraction
 */

import * as cheerio from "cheerio";
import { chromium, type Browser, type Page } from "playwright-core";
import { getSourceConfig, isSourceEnabled } from "../config/index.js";
import type {
  NormattivaSearchArgs,
  ToolSuccessResponse,
  ToolErrorResponse,
} from "../types.js";

/**
 * Mapping of act type names to URN codes
 */
const ACT_TYPE_URN_MAP: Record<string, string> = {
  legge: "legge",
  decreto_legislativo: "decreto.legislativo",
  decreto_legge: "decreto.legge",
  dpr: "decreto.presidente.repubblica",
  "d.lgs": "decreto.legislativo",
  "d.l.": "decreto.legge",
};

/**
 * Result structure for Normattiva queries
 */
interface NormattivaResult {
  title: string;
  urn: string;
  url: string;
  date: string;
  act_type: string;
  articles?: string[];
}

/**
 * Simple in-memory cache for Normattiva results
 * TTL: 7 days (legislation doesn't change frequently)
 */
const cache = new Map<string, { data: NormattivaResult; expires: number }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCached(key: string): NormattivaResult | null {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
}

function setCache(key: string, data: NormattivaResult): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * Browser singleton for Playwright
 * Reused across searches to avoid cold-start overhead
 */
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.error("[Normattiva] Launching browser...");
    // Try to use the Playwright-installed Chromium, fall back to system Chrome
    try {
      browserInstance = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    } catch (error) {
      console.error(`[Normattiva] Chromium launch failed, trying Chrome channel: ${error}`);
      browserInstance = await chromium.launch({
        headless: true,
        channel: "chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }
  }
  return browserInstance;
}

/**
 * Cleanup browser on process exit
 */
process.on("beforeExit", async () => {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
});

/**
 * Search Normattiva using Playwright for JavaScript-rendered content
 * This is the primary search method since Normattiva renders results via JS
 */
async function searchNormattivaWithPlaywright(
  baseUrl: string,
  query: string,
  limit: number = 10
): Promise<{ results: NormattivaResult[]; debug: { method: string; resultsFound: number; error?: string; currentUrl?: string; pageTitle?: string; bodyPreview?: string; linkCounts?: { caricaDettaglio: number; urnNir: number; allLinks: number } } }> {
  const searchPageUrl = `${baseUrl}/ricerca/semplice`;
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set Italian locale for proper rendering
    await page.setExtraHTTPHeaders({
      "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
    });

    console.error(`[Normattiva] Navigating to search page: ${searchPageUrl}`);
    await page.goto(searchPageUrl, { waitUntil: "networkidle", timeout: 30000 });

    // Fill the search form and submit (Normattiva ignores URL query params)
    console.error(`[Normattiva] Filling search form with: ${query}`);
    // Use the exact role-based selector that works with Normattiva
    await page.getByRole('textbox', { name: 'Ricerca semplice' }).fill(query);

    // Click the search button
    console.error(`[Normattiva] Clicking search button`);
    await page.getByRole('button', { name: 'cerca' }).click();

    // Wait for navigation to results page
    await page.waitForURL(/ricerca\/veloce|risultat/i, { timeout: 15000 }).catch(() => {
      // URL might not change, wait for content instead
    });

    // Wait for results to render (increased for slow connections)
    await page.waitForTimeout(5000);

    // Debug: Get current URL and page title
    const currentUrl = page.url();
    const pageTitle = await page.title();
    let bodyPreview = "";

    // Always get body preview for debugging
    bodyPreview = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.error(`[Normattiva] Current URL: ${currentUrl}`);
    console.error(`[Normattiva] Page title: ${pageTitle}`);
    console.error(`[Normattiva] Body preview: ${bodyPreview.substring(0, 200)}`);

    // Count how many potential result links exist
    const linkCount = await page.evaluate(() => {
      return {
        caricaDettaglio: document.querySelectorAll('a[href*="caricaDettaglioAtto"]').length,
        urnNir: document.querySelectorAll('a[href*="urn:nir"]').length,
        allLinks: document.querySelectorAll('a').length,
      };
    });
    console.error(`[Normattiva] Link counts: caricaDettaglio=${linkCount.caricaDettaglio}, urnNir=${linkCount.urnNir}, allLinks=${linkCount.allLinks}`);

    // Extract results from the rendered page
    const results = await page.evaluate(({ limit, baseUrl }: { limit: number; baseUrl: string }) => {
      const extractedResults: Array<{
        title: string;
        urn: string;
        url: string;
        date: string;
        act_type: string;
      }> = [];

      // Helper to extract URN from link
      const extractUrn = (href: string): string => {
        const match = href.match(/urn:nir:[^\s&"']+/);
        return match ? match[0] : "";
      };

      // Helper to determine act type
      const getActType = (text: string, urn: string): string => {
        if (urn) {
          const match = urn.match(/stato:([^:]+):/);
          if (match) return match[1];
        }
        const lower = text.toLowerCase();
        if (lower.includes("decreto legislativo") || lower.includes("d.lgs")) return "decreto.legislativo";
        if (lower.includes("decreto legge") || lower.includes("d.l.")) return "decreto.legge";
        if (lower.includes("legge")) return "legge";
        if (lower.includes("d.p.r")) return "decreto.presidente.repubblica";
        return "";
      };

      // Strategy 1: Links to act details (caricaDettaglioAtto) - primary result format
      document.querySelectorAll('a[href*="caricaDettaglioAtto"]').forEach((el) => {
        if (extractedResults.length >= limit) return;
        const anchor = el as HTMLAnchorElement;
        const title = anchor.textContent?.trim() || "";
        if (title.length < 5) return;

        const href = anchor.href;
        // Extract codiceRedazionale from URL as URN-like identifier
        const codiceMatch = href.match(/codiceRedazionale=([^&]+)/);
        const urn = codiceMatch ? `urn:nir:stato:${codiceMatch[1]}` : "";
        const dateMatch = title.match(/(\d{1,2}\s+\w+\s+\d{4}|\d{4})/i);

        // Get description from sibling paragraph
        const parent = anchor.closest('[class*="tab"], .generic, div');
        const descEl = parent?.querySelector('p:not(:first-child)');
        const description = descEl?.textContent?.trim() || "";

        extractedResults.push({
          title: `${title}${description ? ` - ${description.substring(0, 200)}` : ""}`.substring(0, 500),
          urn,
          url: href,
          date: dateMatch ? dateMatch[1] : "",
          act_type: getActType(title, urn),
        });
      });

      // Strategy 2: Links containing URN references
      if (extractedResults.length === 0) {
        document.querySelectorAll('a[href*="urn:nir"], a[href*="uri-res"]').forEach((el) => {
          if (extractedResults.length >= limit) return;
          const anchor = el as HTMLAnchorElement;
          const title = anchor.textContent?.trim() || "";
          if (title.length < 10) return;

          const href = anchor.href;
          const urn = extractUrn(href);
          const dateMatch = title.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\b\d{4}\b)/);

          extractedResults.push({
            title: title.substring(0, 500),
            urn,
            url: href,
            date: dateMatch ? dateMatch[1] : "",
            act_type: getActType(title, urn),
          });
        });
      }

      // Strategy 3: Table rows with legislation data
      if (extractedResults.length === 0) {
        document.querySelectorAll("table tr").forEach((row) => {
          if (extractedResults.length >= limit) return;
          const cells = row.querySelectorAll("td");
          if (cells.length === 0) return;

          const text = row.textContent?.trim() || "";
          if (text.length < 20) return;

          const anchor = row.querySelector("a") as HTMLAnchorElement | null;
          const href = anchor?.href || "";
          const urn = extractUrn(href);
          const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\b\d{4}\b)/);

          if (text.match(/legge|decreto|d\.l\.|d\.lgs/i)) {
            extractedResults.push({
              title: text.substring(0, 500),
              urn,
              url: href || `${baseUrl}/ricerca/semplice`,
              date: dateMatch ? dateMatch[1] : "",
              act_type: getActType(text, urn),
            });
          }
        });
      }

      // Strategy 3: List items with legislation
      if (extractedResults.length === 0) {
        document.querySelectorAll("li, .risultato, .result-item").forEach((el) => {
          if (extractedResults.length >= limit) return;
          const text = el.textContent?.trim() || "";
          if (text.length < 20 || !text.match(/legge|decreto|d\.l\.|d\.lgs/i)) return;

          const anchor = el.querySelector("a") as HTMLAnchorElement | null;
          const href = anchor?.href || "";
          const urn = extractUrn(href);
          const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\b\d{4}\b)/);

          extractedResults.push({
            title: text.substring(0, 500),
            urn,
            url: href || `${baseUrl}/ricerca/semplice`,
            date: dateMatch ? dateMatch[1] : "",
            act_type: getActType(text, urn),
          });
        });
      }

      // Strategy 4: Any element with legislation-like text
      if (extractedResults.length === 0) {
        const bodyText = document.body.innerText;
        const pattern = /((?:LEGGE|DECRETO LEGISLATIVO|DECRETO LEGGE|D\.L\.|D\.LGS\.)[^\n]{10,150}(?:\d{4})[^\n]{0,50})/gi;
        const matches = bodyText.match(pattern);
        if (matches) {
          matches.slice(0, limit).forEach((match) => {
            const dateMatch = match.match(/(\d{4})/);
            extractedResults.push({
              title: match.trim().substring(0, 300),
              urn: "",
              url: `${baseUrl}/ricerca/semplice`,
              date: dateMatch ? dateMatch[1] : "",
              act_type: getActType(match, ""),
            });
          });
        }
      }

      return extractedResults;
    }, { limit, baseUrl });

    // Deduplicate by title
    const seen = new Set<string>();
    const uniqueResults = results.filter((r) => {
      const key = r.title.toLowerCase().substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      results: uniqueResults,
      debug: {
        method: "playwright",
        resultsFound: uniqueResults.length,
        currentUrl,
        pageTitle,
        bodyPreview: bodyPreview || undefined,
        linkCounts: linkCount,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Normattiva] Playwright search error: ${errorMessage}`);
    return {
      results: [],
      debug: { method: "playwright", resultsFound: 0, error: errorMessage },
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Build URN from act type, year, and number
 * URN format: urn:nir:stato:{act_type}:{year};{number}
 */
function buildUrn(actType: string, year: number, number: number): string {
  const urnType = ACT_TYPE_URN_MAP[actType.toLowerCase()] || actType;
  return `urn:nir:stato:${urnType}:${year};${number}`;
}

/**
 * Fetch document by URN from Normattiva
 */
async function fetchByUrn(
  baseUrl: string,
  urn: string
): Promise<NormattivaResult | null> {
  // Check cache first
  const cacheKey = `normattiva_${urn}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${baseUrl}/uri-res/N2Ls?${urn}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LegalKnowledgeMCP/1.0)",
        Accept: "text/html",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title from various possible selectors
    const title =
      $("h1.titoloAtto, .intestazione h1, .titoloAtto, #titoloAtto, .titolo-atto")
        .first()
        .text()
        .trim() ||
      $("h1").first().text().trim() ||
      urn;

    // Extract article list
    const articles: string[] = [];
    $(
      ".articolo, .art, [class*='articolo'], [id*='art'], .art-rubrica"
    ).each((_, el) => {
      const artTitle = $(el)
        .find(".art_rubrica, h2, h3, .rubrica, strong")
        .first()
        .text()
        .trim();
      const artNum = $(el).find(".art-num, .numero-articolo").first().text().trim();
      if (artTitle) {
        articles.push(artNum ? `${artNum}: ${artTitle}` : artTitle);
      }
    });

    // Extract date from URN or page
    const dateMatch = urn.match(/:(\d{4})(?:-\d{2}-\d{2})?;/);
    const date = dateMatch ? dateMatch[1] : "";

    // Extract act type from URN
    const actTypeMatch = urn.match(/stato:([^:]+):/);
    const actType = actTypeMatch ? actTypeMatch[1] : "";

    const result: NormattivaResult = {
      title,
      urn,
      url,
      date,
      act_type: actType,
      articles: articles.length > 0 ? articles.slice(0, 50) : undefined, // Limit to first 50 articles
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Normattiva fetch error: ${error}`);
    return null;
  }
}

/**
 * Search Normattiva by keywords
 * IMPROVED: Multiple selector approaches with debug logging (GAP-TSH-001 fix)
 */
async function searchNormattiva(
  baseUrl: string,
  query: string,
  limit: number = 10
): Promise<{ results: NormattivaResult[]; debug: { htmlLength: number; title: string; approach: string } }> {
  const searchUrl = `${baseUrl}/ricerca/semplice?q=${encodeURIComponent(query)}`;

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
      console.error(`Normattiva search failed: ${response.status}`);
      return { results: [], debug: { htmlLength: 0, title: "HTTP Error", approach: "none" } };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // DEBUG: Log structure to understand page
    const debug = {
      htmlLength: html.length,
      title: $('title').text().trim(),
      approach: "none" as string,
    };

    const results: NormattivaResult[] = [];

    // Helper function to extract result from element
    const extractResult = ($el: ReturnType<typeof $>, textContent: string): NormattivaResult | null => {
      const title = textContent.substring(0, 500);
      if (!title || title.length < 10) return null;

      const link = $el.find('a').first().attr('href') || $el.closest('a').attr('href') || '';

      // Extract URN from link
      const urnMatch = link.match(/urn:nir:[^\s&"']+/);
      const urn = urnMatch ? urnMatch[0] : '';

      // Extract date
      const dateMatch = title.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4})/);
      const date = dateMatch ? dateMatch[1] : '';

      // Extract act type from URN or title
      let actType = '';
      if (urn) {
        const urnTypeMatch = urn.match(/stato:([^:]+):/);
        actType = urnTypeMatch ? urnTypeMatch[1] : '';
      } else if (title.toLowerCase().includes('decreto legislativo')) {
        actType = 'decreto.legislativo';
      } else if (title.toLowerCase().includes('decreto legge')) {
        actType = 'decreto.legge';
      } else if (title.toLowerCase().includes('legge')) {
        actType = 'legge';
      }

      return {
        title,
        urn,
        url: link.startsWith('http') ? link : link ? `${baseUrl}${link}` : '',
        date,
        act_type: actType,
      };
    };

    // APPROACH 1: Table-based results (Normattiva often uses tables)
    $('table.risultati tbody tr, table tbody tr, .tabella-risultati tr').each((i, el) => {
      if (results.length >= limit) return false;
      const $el = $(el);
      const cells = $el.find('td');
      if (cells.length > 0) {
        const textContent = cells.eq(0).text().trim() || $el.text().trim();
        const result = extractResult($el, textContent);
        if (result) {
          results.push(result);
          debug.approach = "table";
        }
      }
    });

    // APPROACH 2: List-based results
    if (results.length === 0) {
      $('ul.risultati li, ol.risultati li, .lista-risultati li, .elenco li, .results li').slice(0, limit).each((_, el) => {
        const $el = $(el);
        const textContent = $el.find('a').first().text().trim() || $el.text().trim();
        const result = extractResult($el, textContent);
        if (result) {
          results.push(result);
          debug.approach = "list";
        }
      });
    }

    // APPROACH 3: Div-based results
    if (results.length === 0) {
      $('.risultato, .item-risultato, .search-result, .result-item, [class*="risultat"], .atto').slice(0, limit).each((_, el) => {
        const $el = $(el);
        const textContent = $el.find('.titolo, h3, h4, a, .title').first().text().trim() || $el.text().trim();
        const result = extractResult($el, textContent);
        if (result) {
          results.push(result);
          debug.approach = "div";
        }
      });
    }

    // APPROACH 4: Any anchor with URN or normattiva link
    if (results.length === 0) {
      $('a[href*="normattiva"], a[href*="urn:nir"], a[href*="uri-res"]').slice(0, limit).each((_, el) => {
        const $el = $(el);
        const textContent = $el.text().trim();
        const result = extractResult($el, textContent);
        if (result && result.title.length > 10) {
          results.push(result);
          debug.approach = "anchor";
        }
      });
    }

    // APPROACH 5: Look for any text that looks like legislation
    if (results.length === 0) {
      // Look for patterns like "LEGGE 17 dicembre 2012, n. 221" or "D.L. 179/2012"
      const bodyText = $('body').text();
      const legislationPattern = /((?:LEGGE|DECRETO LEGISLATIVO|DECRETO LEGGE|D\.L\.|D\.LGS\.)[^\n]{10,100}(?:\d{4})[^\n]{0,50})/gi;
      const matches = bodyText.match(legislationPattern);

      if (matches) {
        matches.slice(0, limit).forEach(match => {
          const yearMatch = match.match(/(\d{4})/);
          results.push({
            title: match.trim().substring(0, 200),
            urn: '',
            url: searchUrl,
            date: yearMatch ? yearMatch[1] : '',
            act_type: match.toLowerCase().includes('decreto legislativo') || match.toLowerCase().includes('d.lgs')
              ? 'decreto.legislativo'
              : match.toLowerCase().includes('decreto legge') || match.toLowerCase().includes('d.l.')
                ? 'decreto.legge'
                : 'legge',
          });
          debug.approach = "regex";
        });
      }
    }

    return { results, debug };

  } catch (error) {
    console.error(`Normattiva search error: ${error}`);
    return { results: [], debug: { htmlLength: 0, title: "Error", approach: "error" } };
  }
}

/**
 * Handle Normattiva tool calls
 */
export async function handleNormattiva(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_search_normattiva";

  // Check if source is enabled
  if (!isSourceEnabled("normattiva")) {
    return {
      status: "error",
      tool: toolName,
      error: "Normattiva source is disabled in configuration",
      code: "SOURCE_DISABLED",
    };
  }

  const input = args as unknown as NormattivaSearchArgs;

  // Validate input
  if (!input.query && !(input.act_type && input.year && input.number)) {
    return {
      status: "error",
      tool: toolName,
      error:
        "Please provide either a search query or act_type + year + number for direct lookup",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const config = getSourceConfig("normattiva");
    const baseUrl = config.base_url || "https://www.normattiva.it";

    // Direct lookup by act type, year, number
    if (input.act_type && input.year && input.number) {
      const urn = buildUrn(input.act_type, input.year, input.number);
      const result = await fetchByUrn(baseUrl, urn);

      if (!result) {
        return {
          status: "error",
          tool: toolName,
          error: `Act not found: ${input.act_type} ${input.number}/${input.year}`,
          code: "NOT_FOUND",
          details: {
            urn_tried: urn,
            suggestion:
              "Try searching by keywords instead, or verify the act details",
          },
        };
      }

      return {
        status: "success",
        tool: toolName,
        source: "Normattiva",
        timestamp: new Date().toISOString(),
        cached: cache.has(`normattiva_${urn}`),
        data: {
          action: "direct_lookup",
          act_type: input.act_type,
          year: input.year,
          number: input.number,
          result,
        },
      };
    }

    // Search by query using Playwright (handles JS-rendered content)
    const { results, debug } = await searchNormattivaWithPlaywright(baseUrl, input.query);

    // Build portal search URL for fallback
    const portalSearchUrl = `${baseUrl}/ricerca/semplice?q=${encodeURIComponent(input.query)}`;

    return {
      status: "success",
      tool: toolName,
      source: "Normattiva",
      timestamp: new Date().toISOString(),
      data: {
        action: "search",
        query: input.query,
        result_count: results.length,
        results,
        portal_search_url: portalSearchUrl,
        debug_info: {
          method: debug.method,
          results_found: debug.resultsFound,
          error: debug.error,
          current_url: debug.currentUrl,
          page_title: debug.pageTitle,
          body_preview: debug.bodyPreview,
          link_counts: debug.linkCounts,
        },
        note:
          results.length === 0
            ? `No results found via Playwright.${debug.error ? ` Error: ${debug.error}` : ""} Visit the portal URL to search manually.`
            : `Found ${results.length} results using Playwright browser automation.`,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query Normattiva: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
