import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { cores } from "@/theme";

/**
 * Porta de entrada: decide entre login e painel. Espera a leitura da sessao
 * terminar para nao piscar a tela de login em quem ja esta autenticado.
 *
 * O app e exclusivamente administrativo, entao so admin chega ao painel; quem
 * nao for cai de volta no login, que explica a restricao.
 */
export default function Entrada() {
  const { carregando, autenticado, isAdmin } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={cores.primaria} size="large" />
      </View>
    );
  }

  return <Redirect href={autenticado && isAdmin ? "/(painel)" : "/(auth)/login"} />;
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: cores.fundo,
  },
});
