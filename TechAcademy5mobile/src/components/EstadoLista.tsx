import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { cores, espaco, fonte } from "@/theme";
import { Botao } from "./Botao";

interface Props {
  carregando?: boolean;
  erro?: string | null;
  vazio?: boolean;
  mensagemVazio?: string;
  aoTentarNovamente?: () => void;
}

/**
 * Estados de carregamento, erro e lista vazia em um lugar so, para que as
 * telas nao repitam esse bloco e o comportamento fique consistente.
 * Retorna null quando ha conteudo para exibir.
 */
export function EstadoLista({
  carregando = false,
  erro = null,
  vazio = false,
  mensagemVazio = "Nada por aqui ainda.",
  aoTentarNovamente,
}: Props) {
  if (carregando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={cores.primaria} size="large" />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.erro}>{erro}</Text>
        {aoTentarNovamente && (
          <View style={estilos.acao}>
            <Botao titulo="Tentar novamente" variante="secundaria" aoPressionar={aoTentarNovamente} />
          </View>
        )}
      </View>
    );
  }

  if (vazio) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.vazio}>{mensagemVazio}</Text>
      </View>
    );
  }

  return null;
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: espaco.lg,
  },
  erro: {
    color: cores.perigo,
    fontSize: fonte.corpo,
    textAlign: "center",
  },
  vazio: {
    color: cores.textoFraco,
    fontSize: fonte.corpo,
    textAlign: "center",
  },
  acao: {
    marginTop: espaco.md,
    alignSelf: "stretch",
  },
});
