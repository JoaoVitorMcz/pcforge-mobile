import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Botao } from "@/components/Botao";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/services/config";
import { cores, espaco, fonte, raio } from "@/theme";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.valor} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

export default function Perfil() {
  const { cliente, isAdmin, sair } = useAuth();
  const router = useRouter();

  const aoSair = async () => {
    await sair();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <View style={estilos.painel}>
        <Linha rotulo="Nome" valor={cliente?.nome ?? "—"} />
        <Linha rotulo="E-mail" valor={cliente?.email ?? "—"} />
        <Linha rotulo="Perfil" valor={isAdmin ? "Administrador" : "Cliente"} />
      </View>

      {/*
        Pedidos e enderecos ficam fora da barra de abas, entao o perfil e o
        caminho para os dois. Sem o link de enderecos o cliente so conseguiria
        criar um, pelo carrinho, e nunca listar, editar ou excluir.
      */}
      <View style={estilos.acao}>
        <Botao
          titulo="Meus pedidos"
          variante="secundaria"
          aoPressionar={() => router.push("/(loja)/pedidos")}
        />
      </View>

      <View style={estilos.acao}>
        <Botao
          titulo="Meus endereços"
          variante="secundaria"
          aoPressionar={() => router.push("/(loja)/enderecos")}
        />
      </View>

      {/* Util no desenvolvimento: mostra para qual API o app esta apontando. */}
      <Text style={estilos.api}>API: {API_BASE_URL}</Text>

      <Botao titulo="Sair da conta" variante="perigo" aoPressionar={aoSair} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.md,
  },
  painel: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    marginBottom: espaco.md,
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: espaco.sm,
    gap: espaco.md,
  },
  rotulo: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  valor: {
    flexShrink: 1,
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  acao: {
    marginBottom: espaco.md,
  },
  api: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginBottom: espaco.md,
    textAlign: "center",
  },
});
