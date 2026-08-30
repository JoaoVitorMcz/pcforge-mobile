import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { cores } from "@/theme";

/**
 * Porta de entrada: decide entre login e loja. Espera a leitura do SecureStore
 * terminar para nao piscar a tela de login em quem ja esta autenticado.
 */
export default function Entrada() {
  const { carregando, autenticado } = useAuth();

  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={cores.primaria} size="large" />
      </View>
    );
  }

  return <Redirect href={autenticado ? "/(loja)" : "/(auth)/login"} />;
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: cores.fundo,
  },
});
