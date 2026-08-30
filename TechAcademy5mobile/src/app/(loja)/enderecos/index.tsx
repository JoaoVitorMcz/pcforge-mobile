import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Botao } from "@/components/Botao";
import { EstadoLista } from "@/components/EstadoLista";
import { useAuth } from "@/contexts/AuthContext";
import { excluirEndereco, listarEnderecos } from "@/services/enderecos";
import { cores, espaco, fonte, raio } from "@/theme";
import type { Endereco } from "@/types";

export default function ListaEnderecos() {
  const { cliente, token } = useAuth();
  const router = useRouter();

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!cliente || !token) return;

    try {
      const lista = await listarEnderecos(cliente.id_cliente, token);
      setEnderecos(lista);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Nao foi possivel carregar os enderecos.");
    } finally {
      setCarregando(false);
    }
  }, [cliente, token]);

  // Recarrega ao voltar do formulario, para a lista refletir o que mudou.
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const confirmarExclusao = (endereco: Endereco) => {
    Alert.alert("Excluir endereço", "Essa ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          if (!token) return;

          try {
            await excluirEndereco(endereco.id_endereco, token);
            setEnderecos((atuais) =>
              atuais.filter((item) => item.id_endereco !== endereco.id_endereco)
            );
          } catch (e) {
            Alert.alert("Erro", e instanceof Error ? e.message : "Falha ao excluir.");
          }
        },
      },
    ]);
  };

  const estado = (
    <EstadoLista
      carregando={carregando}
      erro={erro}
      vazio={enderecos.length === 0}
      mensagemVazio="Você ainda não cadastrou endereços."
      aoTentarNovamente={carregar}
    />
  );

  return (
    <View style={estilos.tela}>
      {carregando || erro || enderecos.length === 0 ? (
        estado
      ) : (
        <FlatList
          data={enderecos}
          keyExtractor={(item) => String(item.id_endereco)}
          contentContainerStyle={estilos.lista}
          renderItem={({ item }) => (
            <View style={estilos.card}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(`/(loja)/enderecos/${item.id_endereco}`)}
              >
                <Text style={estilos.titulo}>
                  {[item.cidade, item.estado].filter(Boolean).join(" - ") || "Endereço"}
                </Text>
                <Text style={estilos.detalhe}>
                  {[item.bairro, item.numero, item.complemento].filter(Boolean).join(", ") || "—"}
                </Text>
                {!!item.cep && <Text style={estilos.detalhe}>CEP {item.cep}</Text>}
              </Pressable>

              <View style={estilos.acoes}>
                <View style={estilos.acao}>
                  <Botao
                    titulo="Editar"
                    variante="secundaria"
                    aoPressionar={() => router.push(`/(loja)/enderecos/${item.id_endereco}`)}
                  />
                </View>
                <View style={estilos.acao}>
                  <Botao
                    titulo="Excluir"
                    variante="perigo"
                    aoPressionar={() => confirmarExclusao(item)}
                  />
                </View>
              </View>
            </View>
          )}
        />
      )}

      <View style={estilos.rodape}>
        <Botao titulo="Novo endereço" aoPressionar={() => router.push("/(loja)/enderecos/novo")} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  lista: {
    padding: espaco.md,
  },
  card: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    padding: espaco.md,
    marginBottom: espaco.md,
  },
  titulo: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  detalhe: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: espaco.xs,
  },
  acoes: {
    flexDirection: "row",
    gap: espaco.sm,
    marginTop: espaco.md,
  },
  acao: {
    flex: 1,
  },
  rodape: {
    padding: espaco.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    backgroundColor: cores.superficie,
  },
});
