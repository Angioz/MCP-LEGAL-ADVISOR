/**
 * PDF text extraction utility for Legal Knowledge MCP server.
 * Downloads and extracts text from PDF documents with caching support.
 */

import pdf from "pdf-parse";
import { getCached, setCache, generateCacheKey } from "./cache.js";

/**
 * Extracted PDF content structure
 */
export interface PdfContent {
  text: string;
  pages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
  };
  metadata: Record<string, unknown> | null;
  extractedAt: number;
  sourceUrl: string;
}

/**
 * Search result from PDF content
 */
export interface PdfSearchResult {
  found: boolean;
  matches: string[];
  context: string[];
  totalMatches: number;
  sourceUrl: string;
}

// Cache TTL for PDFs: 30 days (documents rarely change)
const PDF_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Cache source identifier
const PDF_CACHE_SOURCE = "pdf";

/**
 * Extract text content from a PDF at the given URL
 * Results are cached for 30 days since legal PDFs rarely change.
 *
 * @param url - URL to the PDF document
 * @param cacheKey - Optional custom cache key (defaults to URL-based key)
 * @returns Extracted PDF content or null if extraction fails
 */
export async function extractPdfText(
  url: string,
  cacheKey?: string
): Promise<PdfContent | null> {
  const key = cacheKey || generateCacheKey("pdf_extract", { url });

  // Check cache first
  const cached = getCached<PdfContent>(key);
  if (cached) {
    console.error(`[PDF] Cache hit for: ${url}`);
    return cached;
  }

  console.error(`[PDF] Downloading and extracting: ${url}`);

  try {
    // Download PDF with appropriate headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LegalKnowledgeMCP/1.0)",
        "Accept": "application/pdf,application/octet-stream,*/*",
      },
      // Follow redirects
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(`[PDF] Download failed: ${response.status} ${response.statusText}`);
      return null;
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      console.error(`[PDF] Unexpected content type: ${contentType}`);
      // Continue anyway - some servers don't set correct content type
    }

    // Get buffer from response
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      console.error("[PDF] Downloaded empty file");
      return null;
    }

    // Parse PDF
    const data = await pdf(buffer);

    const content: PdfContent = {
      text: data.text || "",
      pages: data.numpages || 0,
      info: {
        title: data.info?.Title as string | undefined,
        author: data.info?.Author as string | undefined,
        subject: data.info?.Subject as string | undefined,
        keywords: data.info?.Keywords as string | undefined,
        creationDate: data.info?.CreationDate as string | undefined,
      },
      metadata: data.metadata?._metadata || null,
      extractedAt: Date.now(),
      sourceUrl: url,
    };

    // Validate we got some text
    if (!content.text || content.text.trim().length === 0) {
      console.error("[PDF] No text extracted (may be scanned/image PDF)");
      // Still cache the result to avoid re-downloading
      content.text = "[No extractable text - PDF may contain only images]";
    }

    // Cache for 30 days
    setCache(key, content, PDF_CACHE_TTL_MS, PDF_CACHE_SOURCE);

    console.error(`[PDF] Extracted ${content.pages} pages, ${content.text.length} chars`);
    return content;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[PDF] Extraction error: ${errorMessage}`);
    return null;
  }
}

/**
 * Search for text within a PDF document
 * Downloads and extracts the PDF if not cached.
 *
 * @param url - URL to the PDF document
 * @param query - Search text (case-insensitive)
 * @returns Search results with matching lines and context
 */
export async function searchPdfContent(
  url: string,
  query: string
): Promise<PdfSearchResult> {
  const content = await extractPdfText(url);

  if (!content) {
    return {
      found: false,
      matches: [],
      context: [],
      totalMatches: 0,
      sourceUrl: url,
    };
  }

  const queryLower = query.toLowerCase();
  const lines = content.text.split("\n");
  const matches: string[] = [];
  const context: string[] = [];
  let totalMatches = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    // Count all occurrences in this line
    let searchIndex = 0;
    while ((searchIndex = lineLower.indexOf(queryLower, searchIndex)) !== -1) {
      totalMatches++;
      searchIndex += queryLower.length;
    }

    // If line contains query, add to results
    if (lineLower.includes(queryLower)) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0 && !matches.includes(trimmedLine)) {
        matches.push(trimmedLine);

        // Get surrounding context (2 lines before/after)
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 3);
        const contextBlock = lines
          .slice(start, end)
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .join("\n");

        if (contextBlock.length > 0 && !context.includes(contextBlock)) {
          context.push(contextBlock);
        }
      }
    }
  }

  return {
    found: matches.length > 0,
    matches: matches.slice(0, 10), // Limit to 10 unique matches
    context: context.slice(0, 5),   // Limit to 5 context blocks
    totalMatches,
    sourceUrl: url,
  };
}

/**
 * Get PDF metadata without full text extraction
 * Useful for quick checks before full extraction.
 *
 * @param url - URL to the PDF document
 * @returns Basic PDF info or null if unavailable
 */
export async function getPdfInfo(
  url: string
): Promise<Pick<PdfContent, "pages" | "info" | "sourceUrl"> | null> {
  // Check if we have cached content first
  const key = generateCacheKey("pdf_extract", { url });
  const cached = getCached<PdfContent>(key);

  if (cached) {
    return {
      pages: cached.pages,
      info: cached.info,
      sourceUrl: cached.sourceUrl,
    };
  }

  // Otherwise do full extraction (which will cache the result)
  const content = await extractPdfText(url);
  if (!content) {
    return null;
  }

  return {
    pages: content.pages,
    info: content.info,
    sourceUrl: content.sourceUrl,
  };
}

/**
 * Extract specific pages from a PDF (by text content)
 * Note: This extracts all text and then filters, as pdf-parse
 * doesn't support per-page extraction easily.
 *
 * @param url - URL to the PDF document
 * @param pageNumbers - Array of 1-based page numbers to extract
 * @returns Extracted text for specified pages (approximate)
 */
export async function extractPdfPages(
  url: string,
  pageNumbers: number[]
): Promise<string | null> {
  const content = await extractPdfText(url);

  if (!content) {
    return null;
  }

  // pdf-parse doesn't give us per-page content easily
  // Return full text with a note about limitations
  console.error(`[PDF] Note: Page-specific extraction not supported, returning full text`);
  return content.text;
}
