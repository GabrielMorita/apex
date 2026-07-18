import LegalDocumentPage from "@/components/privacy/LegalDocumentPage";
import { LEGAL_DOCUMENTS } from "@/lib/privacy/documents";

export default function PrivacyPage() {
  return <LegalDocumentPage document={LEGAL_DOCUMENTS.privacy_notice} />;
}
