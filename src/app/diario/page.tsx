import { redirect } from "next/navigation";

export default function DiarioPage() {
  redirect("/?destino=hoje");
}
