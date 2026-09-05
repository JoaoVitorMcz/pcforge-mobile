import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EstadoLista } from "@/components/EstadoLista";
import { EtiquetaStatus } from "@/components/EtiquetaStatus";
import { useAuth } from "@/contexts/AuthContext";
import { listarPedidosDoCliente } from "@/services/pedidos";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Pedido } from "@/types";

/** dd/mm/aaaa a partir do ISO da API; travessão quando a data nao veio. */
function formatarData(iso?: string | null): string {
  if (!iso) return "—";

  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
}

export default function MeusPedidos() {
  const { token, cliente } = useAuth();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token || !cliente) return;

    try {
      setPedidos(await listarPedidosDoCliente(token, cliente.id_cliente));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar seus pedidos.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [cliente, token]);

  // Volta do detalhe (onde dá para cancelar) já com o status atualizado.
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  if (carregando || erro) {
    return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  }

  return (
    <FlatList
      data={pedidos}
      keyExtractor={(item) => String(item.id_pedido)}
      contentContainerStyle={estilos.lista}
      ListEmptyComponent={
        <EstadoLista vazio mensagemVazio="Você ainda não fez nenhum pedido." />
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Abrir pedido ${item.id_pedido}`}
          activeOpacity={0.75}
          style={estilos.item}
          onPress={() => router.push(`/(loja)/pedidos/${item.id_pedido}`)}
        >
          <View style={estilos.itemTopo}>
            <Text style={estilos.numero}>Pedido #{item.id_pedido}</Text>
            <EtiquetaStatus status={item.status ?? "pendente"} />
          </View>

          <View style={estilos.itemRodape}>
            <Text style={estilos.data}>{formatarData(item.data_pedido)}</Text>
            <Text style={estilos.valor}>{formatarPreco(Number(item.valor ?? 0))}</Text>
          </View>
        </TouchableOpacity>
      )}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => {
            setAtualizando(true);
            void carregar();
          }}
          tintColor={cores.primaria}
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    padding: espaco.md,
    flexGrow: 1,
  },
  item: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espaco.md,
    marginBottom: espaco.sm,
  },
  itemTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: espaco.sm,
  },
  numero: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  itemRodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: espaco.md,
  },
  data: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  valor: {
    color: cores.primaria,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
});
