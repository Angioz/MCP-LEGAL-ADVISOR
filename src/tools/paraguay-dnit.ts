/**
 * Paraguay DNIT (Dirección Nacional de Ingresos Tributarios) Integration Tool
 * Queries Paraguayan tax authority for RUC validation and tax guidance
 *
 * Sources:
 *   - RUC API: https://servicios.set.gov.py/EsetApiWS/ApiWS/consultaRUC
 *   - Open Data: https://www.dnit.gov.py/datos-abiertos
 *   - Portal: https://www.dnit.gov.py
 */

import type { ToolSuccessResponse, ToolErrorResponse } from "../types.js";
import { searchIndexedLaws } from "../utils/keyword-search.js";
import { PARAGUAY_LAWS } from "../data/indexed-laws.js";

const DNIT_PORTAL = "https://www.dnit.gov.py";
const RUC_API = "https://servicios.set.gov.py/EsetApiWS/ApiWS/consultaRUC";

export interface ParaguayDnitArgs {
  query: string;
  ruc?: string;
  topic?: "renta" | "iva" | "residencia_fiscal" | "ruc" | "all";
}

interface RucResult {
  ruc: string;
  razonSocial?: string;
  estado?: string;
  [key: string]: unknown;
}

/**
 * Pre-indexed key Paraguayan tax references
 */
const INDEXED_TAX_REFS: Record<
  string,
  Array<{
    title: string;
    description: string;
    law: string;
    url: string;
  }>
> = {
  residencia: [
    {
      title: "Ley 6380/2019 - Modernización y Simplificación del Sistema Tributario Nacional",
      description:
        "Main tax reform law. Establishes territorial taxation, tax residency rules (120-day threshold), and income tax rates (8-10%).",
      law: "Ley 6380/2019",
      url: "https://www.dnit.gov.py/documents/20123/0/LEY+6380.pdf",
    },
    {
      title: "Resolución General N° 77/2021 - Certificado de Residencia Fiscal",
      description:
        "Procedure to obtain tax residency certificate from DNIT. Required documents: Cédula, RUC, proof of domicile.",
      law: "RG 77/2021",
      url: `${DNIT_PORTAL}/web/portal-institucional/resoluciones`,
    },
  ],
  renta: [
    {
      title: "Impuesto a la Renta Personal (IRP)",
      description:
        "Personal income tax. Territorial system: only Paraguayan-source income taxed. Rates: 8% (up to 50M PYG excess), 10% (above). Foreign-source income: 0%.",
      law: "Ley 6380/2019, Libro I",
      url: `${DNIT_PORTAL}/web/portal-institucional/irp`,
    },
    {
      title: "Impuesto a la Renta Empresarial (IRE)",
      description:
        "Corporate income tax. 10% flat rate on net Paraguayan-source income. Territorial basis — foreign income excluded.",
      law: "Ley 6380/2019, Libro I",
      url: `${DNIT_PORTAL}/web/portal-institucional/ire`,
    },
  ],
  iva: [
    {
      title: "Impuesto al Valor Agregado (IVA)",
      description:
        "VAT at 10% standard rate, 5% reduced rate (basic goods, rent, interest). Export of services: 0%.",
      law: "Ley 6380/2019, Libro II",
      url: `${DNIT_PORTAL}/web/portal-institucional/iva`,
    },
  ],
  ruc: [
    {
      title: "Registro Único del Contribuyente (RUC)",
      description:
        "Taxpayer identification number. Required for all tax operations. Obtain at DNIT with Cédula + proof of domicile.",
      law: "Decreto 3107/2019",
      url: `${DNIT_PORTAL}/web/portal-institucional/ruc`,
    },
  ],
  nomade: [
    {
      title: "Paraguay Digital Nomad Tax Framework",
      description:
        "No specific digital nomad visa. Tax residency via temporary/permanent immigration residency + RUC + tax certificate. 120-day rule for deemed residency. Foreign-source income: 0% under territorial system.",
      law: "Ley 6380/2019 + Ley 978/1996 (Migration)",
      url: `${DNIT_PORTAL}/web/portal-institucional`,
    },
  ],
};

async function lookupRuc(
  ruc: string
): Promise<RucResult | null> {
  try {
    const response = await fetch(`${RUC_API}?ruc=${encodeURIComponent(ruc)}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "LegalKnowledgeMCP/1.0",
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as RucResult;
  } catch {
    return null;
  }
}

export async function handleParaguayDnit(
  args: Record<string, unknown>
): Promise<ToolSuccessResponse | ToolErrorResponse> {
  const toolName = "legal_query_paraguay_dnit";
  const input = args as unknown as ParaguayDnitArgs;

  if (!input.query) {
    return {
      status: "error",
      tool: toolName,
      error: "The 'query' parameter is required",
      code: "INVALID_ARGUMENTS",
    };
  }

  try {
    const queryLower = input.query.toLowerCase();

    // If RUC number provided, do lookup
    if (input.ruc) {
      const rucData = await lookupRuc(input.ruc);
      return {
        status: "success",
        tool: toolName,
        source: "DNIT - Dirección Nacional de Ingresos Tributarios (Paraguay)",
        timestamp: new Date().toISOString(),
        data: {
          query: input.query,
          ruc_lookup: input.ruc,
          result: rucData || { error: "RUC not found or service unavailable" },
          portal_url: DNIT_PORTAL,
        },
      };
    }

    // Layer 1: Multilingual fuzzy search on comprehensive indexed laws
    const topicFilter = input.topic || "all";
    const topicMap: Record<string, string> = {
      renta: "tax",
      iva: "tax",
      residencia_fiscal: "tax",
      ruc: "tax",
    };
    const mappedTopic = topicFilter === "all" ? undefined : (topicMap[topicFilter] || topicFilter);
    const indexedResults = searchIndexedLaws(PARAGUAY_LAWS, input.query, mappedTopic, 15);

    // Layer 2: Also check local INDEXED_TAX_REFS for backward compat
    type RefEntry = (typeof INDEXED_TAX_REFS)[string][number];
    let results: RefEntry[] = indexedResults.map(l => ({
      title: l.title,
      description: l.description,
      law: l.law_ref,
      url: l.url,
    }));

    // Supplement with local refs if not already included
    for (const refs of Object.values(INDEXED_TAX_REFS)) {
      for (const ref of refs) {
        if (
          !results.some((r) => r.title === ref.title) &&
          (ref.title.toLowerCase().includes(queryLower) ||
           ref.description.toLowerCase().includes(queryLower))
        ) {
          results.push(ref);
        }
      }
    }

    return {
      status: "success",
      tool: toolName,
      source: "DNIT - Dirección Nacional de Ingresos Tributarios (Paraguay)",
      timestamp: new Date().toISOString(),
      data: {
        query: input.query,
        topic_filter: topicFilter,
        result_count: results.length,
        results,
        portal_url: DNIT_PORTAL,
        open_data_url: `${DNIT_PORTAL}/web/portal-institucional/datos-abiertos`,
        note:
          results.length === 0
            ? `No indexed results for "${input.query}". Browse the DNIT portal at ${DNIT_PORTAL}`
            : "Results from pre-indexed Paraguayan tax legislation. For official interpretations, consult DNIT directly.",
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      tool: toolName,
      error: `Failed to query Paraguay DNIT: ${errorMessage}`,
      code: "NETWORK_ERROR",
    };
  }
}
