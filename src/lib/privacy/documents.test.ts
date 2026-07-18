import { describe, expect, it } from "vitest";
import { LEGAL_DOCUMENTS, PRIVACY_DOCUMENT_VERSION } from "@/lib/privacy/documents";

describe("documentos de privacidade", () => {
  it("mantém os três documentos versionados e publicamente endereçáveis", () => {
    expect(PRIVACY_DOCUMENT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(Object.keys(LEGAL_DOCUMENTS)).toHaveLength(3);
    expect(Object.values(LEGAL_DOCUMENTS).map((document) => document.path).sort()).toEqual(["/dados-saude", "/privacidade", "/termos"]);
  });
});
