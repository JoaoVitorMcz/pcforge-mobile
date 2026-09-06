import { API_BASE_URL } from "./config";
import { ApiError, notificarSessaoExpirada } from "./api";

/** Extensoes que o backend aceita (config/upload.ts). */
const EXTENSOES_PERMITIDAS = ["jpg", "jpeg", "png", "webp", "gif"];

const TIPOS_POR_EXTENSAO: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Envia a imagem escolhida no aparelho para POST /upload/imagem.
 *
 * Nao usa o `requisitar` de api.ts porque aquele serializa o corpo em JSON e
 * fixa Content-Type. Aqui o corpo e FormData: o proprio fetch precisa definir
 * o boundary do multipart, entao o header nao pode ser escrito na mao.
 *
 * O backend valida extensao, tipo MIME e tamanho, e responde 400 ou 413. As
 * mensagens sao repassadas como ApiError para a tela distinguir os casos.
 */
export async function enviarImagem(token: string, uri: string): Promise<string> {
  const extensao = (uri.split(".").pop() ?? "").toLowerCase().split("?")[0];

  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    throw new ApiError(400, `Formato não permitido: .${extensao || "sem extensão"}`);
  }

  const corpo = new FormData();

  // O React Native aceita este formato de "arquivo" no FormData; o campo tem
  // de se chamar "imagem", que e o que upload.single espera na rota.
  corpo.append("imagem", {
    uri,
    name: `produto.${extensao}`,
    type: TIPOS_POR_EXTENSAO[extensao],
  } as unknown as Blob);

  const resposta = await fetch(`${API_BASE_URL}/upload/imagem`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: corpo,
  });

  if (!resposta.ok) {
    if (resposta.status === 401) {
      notificarSessaoExpirada();
    }

    let mensagem = `Erro ${resposta.status}`;

    try {
      const json = await resposta.json();
      mensagem = json?.error ?? json?.mensagem ?? mensagem;
    } catch {
      // 413 pode vir sem corpo JSON: a mensagem generica abaixo cobre.
      if (resposta.status === 413) {
        mensagem = "Imagem maior que 5 MB.";
      } else if (resposta.status === 403) {
        mensagem = "Você não tem permissão para enviar imagens.";
      }
    }

    throw new ApiError(resposta.status, mensagem);
  }

  const { url } = (await resposta.json()) as { url: string };
  return url;
}
