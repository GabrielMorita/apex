import { redirect } from "next/navigation";

export default function BibliotecaPage() {
  redirect("/?destino=planejamento%3Abiblioteca");
}
