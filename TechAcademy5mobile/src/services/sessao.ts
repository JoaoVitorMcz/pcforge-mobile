import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Persistencia local por plataforma, usada pela sessao e pelo carrinho.
 *
 * expo-secure-store nao existe no web: encosta no Keychain do iOS e no
 * Keystore do Android, que nao tem equivalente no navegador. A build web cai
 * no localStorage, que e legivel por qualquer script da pagina — aceitavel
 * porque o web e so a versao de demonstracao. O entregavel nativo continua no
 * armazenamento seguro do sistema.
 *
 * O SecureStore do Android recomenda menos de 2 KB por valor, entao quem grava
 * aqui deve guardar o minimo: o carrinho persiste so ids e quantidades.
 */
export const lerSessao = async (chave: string): Promise<string | null> =>
  Platform.OS === "web" ? localStorage.getItem(chave) : SecureStore.getItemAsync(chave);

export const salvarSessao = async (chave: string, valor: string): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.setItem(chave, valor);
    return;
  }

  await SecureStore.setItemAsync(chave, valor);
};

export const removerSessao = async (chave: string): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.removeItem(chave);
    return;
  }

  await SecureStore.deleteItemAsync(chave);
};
