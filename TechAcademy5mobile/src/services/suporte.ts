/**
 * Envio do formulario de suporte pela API REST do EmailJS.
 *
 * Nao usa biblioteca: emailjs-com esta deprecado desde 2022 ("The SDK name
 * changed to @emailjs/browser") e ambas as SDKs sao voltadas para navegador.
 * Um fetch direto no endpoint publico funciona igual no nativo e no web, e
 * tira uma dependencia do projeto.
 *
 * As credenciais vem do ambiente, nunca do codigo: chave commitada e chave
 * vazada, e qualquer um poderia disparar e-mails pela conta ate estourar a
 * cota. Sao lidas de EXPO_PUBLIC_*, o mesmo padrao de services/config.ts.
 *
 * Ressalva: variavel EXPO_PUBLIC_ e embutida no bundle, entao isso protege o
 * repositorio, nao o aplicativo distribuido.
 */
const ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

const SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;

/** true quando as tres variaveis estao configuradas. */
export const suporteConfigurado = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

export interface MensagemSuporte {
  nome: string;
  email: string;
  pedido: string;
  produto: string;
  mensagem: string;
  tipo: string;
}

export async function enviarSuporte(dados: MensagemSuporte): Promise<void> {
  if (!suporteConfigurado) {
    throw new Error(
      "Envio de suporte não configurado. Defina as variáveis EXPO_PUBLIC_EMAILJS_* no .env."
    );
  }

  const resposta = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: dados,
    }),
  });

  if (!resposta.ok) {
    // O EmailJS responde texto puro, nao JSON. O 403 costuma ser a conta com
    // chamadas de fora do navegador bloqueadas, que se libera no painel.
    const detalhe = (await resposta.text().catch(() => "")).trim();

    throw new Error(
      resposta.status === 403
        ? "O EmailJS recusou o envio. Habilite chamadas de aplicações não-navegador no painel da conta."
        : detalhe || `Não foi possível enviar agora (erro ${resposta.status}).`
    );
  }
}
