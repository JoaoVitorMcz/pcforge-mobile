import Constants from "expo-constants";

/**
 * Endereco da API.
 *
 * O celular nao alcanca "localhost" da maquina de desenvolvimento, e o Nginx
 * usa um certificado autoassinado para pcforge.local que o aparelho nao
 * confia. Por isso apontamos direto para a porta 3000 publicada pelo compose.
 *
 * O IP e deduzido do host do proprio dev server do Expo (hostUri e algo como
 * "192.168.15.10:8081"), entao o app funciona na maquina de qualquer um da
 * dupla sem ninguem precisar editar arquivo. EXPO_PUBLIC_API_URL sobrescreve
 * quando for necessario apontar para outro lugar.
 */
const PORTA_API = 3000;

const hostDoDevServer = Constants.expoConfig?.hostUri?.split(":")[0];

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (hostDoDevServer ? `http://${hostDoDevServer}:${PORTA_API}` : `http://localhost:${PORTA_API}`);
