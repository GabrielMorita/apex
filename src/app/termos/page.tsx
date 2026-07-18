import LegalDocumentPage from "@/components/privacy/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/lib/privacy/documents";

export default function TermsPage() {
  return <LegalDocumentPage document={LEGAL_DOCUMENTS.terms_of_use} />;
}
