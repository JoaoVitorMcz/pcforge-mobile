/**
 * Erro de validacao de arquivo enviado (extensao ou mimetype recusados).
 *
 * Existe para que o error handler em index.ts identifique o caso por
 * `instanceof` em vez de comparar o texto da mensagem: assim a mensagem pode
 * mudar livremente sem que a resposta vire 500 por engano.
 */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}
