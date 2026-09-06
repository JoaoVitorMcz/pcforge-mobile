import { API_BASE_URL } from "./config";

/** Converte nomes legados e caminhos de upload em URLs acessiveis pelo app. */
export function urlDaImagem(imagem: string | null | undefined): string | null {
  if (!imagem) return null;
  if (imagem.startsWith("http://") || imagem.startsWith("https://")) return imagem;
  if (imagem.startsWith("/")) return `${API_BASE_URL}${imagem}`;
  return `${API_BASE_URL}/imagens/produtos/${encodeURIComponent(imagem)}`;
}
