import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EstadoLista } from "@/components/EstadoLista";
import { EtiquetaStatus } from "@/components/EtiquetaStatus";
import { useAuth } from "@/contexts/AuthContext";
import { listarPedidos, ROTULO_STATUS } from "@/services/pedidos";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Pedido, StatusPedido } from "@/types";

const STATUS: StatusPedido[] = [
  "pendente",
  "pago",
  "em_preparacao",
  "enviado",
  "entregue",
  "cancelado",
];

/** dd/mm/aaaa a partir do ISO da API; vazio quando a data nao veio. */
function formatarData(iso?: string | null): string {
  if (!iso) return "—";

  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleDateString("pt-BR");
}

function PedidoLinha({ pedido, aoAbrir }: { pedido: Pedido; aoAbrir: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir pedido ${pedido.id_pedido}`}
      activeOpacity={0.75}
      style={estilos.item}
      onPress={aoAbrir}
    >
      <View style={estilos.itemTopo}>
        <Text style={estilos.numero}>Pedido #{pedido.id_pedido}</Text>
        <EtiquetaStatus status={pedido.status ?? "pendente"} />
      </View>

      <Text style={estilos.cliente} numberOfLines={1}>
        {pedido.cliente?.nome ?? `Cliente ${pedido.id_cliente}`}
      </Text>

      <View style={estilos.itemRodape}>
        <Text style={estilos.data}>{formatarData(pedido.data_pedido)}</Text>
        <Text style={estilos.valor}>{formatarPreco(Number(pedido.valor ?? 0))}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Todos os pedidos da loja. GET /pedidos e restrito a admin no backend, entao
 * esta tela so carrega para quem tem o papel.
 */
export default function PedidosAdmin() {
  const { token } = useAuth();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<StatusPedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;

    try {
      setPedidos(await listarPedidos(token));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os pedidos.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [token]);

  // Volta da tela de detalhe ja refletindo a mudanca de status.
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const filtrados = useMemo(
    () => (filtro ? pedidos.filter((pedido) => (pedido.status ?? "pendente") === filtro) : pedidos),
    [filtro, pedidos]
  );

  if (carregando || erro) {
    return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  }

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(item) => String(item.id_pedido)}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={
        <>
          <Text style={estilos.contagem}>
            {filtrados.length} de {pedidos.length} pedidos
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.filtros}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: filtro === null }}
              style={[estilos.chip, filtro === null && estilos.chipAtivo]}
              onPress={() => setFiltro(null)}
            >
              <Text style={[estilos.chipTexto, filtro === null && estilos.chipTextoAtivo]}>
                Todos
              </Text>
            </TouchableOpacity>

            {STATUS.map((status) => (
              <TouchableOpacity
                key={status}
                accessibilityRole="button"
                accessibilityState={{ selected: filtro === status }}
                style={[estilos.chip, filtro === status && estilos.chipAtivo]}
                onPress={() => setFiltro(status)}
              >
                <Text style={[estilos.chipTexto, filtro === status && estilos.chipTextoAtivo]}>
                  {ROTULO_STATUS[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      }
      ListEmptyComponent={<EstadoLista vazio mensagemVazio="Nenhum pedido neste filtro." />}
      renderItem={({ item }) => (
        <PedidoLinha
          pedido={item}
          aoAbrir={() => router.push(`/(painel)/pedidos/${item.id_pedido}`)}
        />
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
  contagem: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginBottom: espaco.sm,
  },
  filtros: {
    gap: espaco.sm,
    paddingBottom: espaco.md,
  },
  chip: {
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.sm,
    backgroundColor: cores.superficie,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  chipAtivo: {
    borderColor: cores.primaria,
    backgroundColor: cores.superficieClara,
  },
  chipTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  chipTextoAtivo: {
    color: cores.primaria,
    fontWeight: "700",
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
  cliente: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: espaco.xs,
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
