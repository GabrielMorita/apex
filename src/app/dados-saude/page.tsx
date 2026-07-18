import LegalDocumentPage from "@/components/privacy/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/lib/privacy/documents";

export default function HealthDataPage() {
  return <LegalDocumentPage document={LEGAL_DOCUMENTS.health_data_consent} />;
}
