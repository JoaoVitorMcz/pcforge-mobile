import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { EstadoLista } from "@/components/EstadoLista";
import { EtiquetaStatus } from "@/components/EtiquetaStatus";
import { useAuth } from "@/contexts/AuthContext";
import { atualizarStatus, buscarPedido, ROTULO_STATUS, TRANSICOES } from "@/services/pedidos";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Pedido, StatusPedido } from "@/types";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.valor}>{valor}</Text>
    </View>
  );
}

/** Monta o endereco em uma linha; os campos sao todos opcionais no model. */
function resumirEndereco(pedido: Pedido): string {
  const e = pedido.endereco_entrega;

  if (!e) return `Endereço #${pedido.id_endereco_entrega}`;

  const partes = [e.numero, e.bairro, e.cidade, e.estado, e.cep].filter(Boolean);
  return partes.length ? partes.join(", ") : `Endereço #${pedido.id_endereco_entrega}`;
}

export default function DetalhePedido() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idPedido = Number(id);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;

    try {
      setPedido(await buscarPedido(token, idPedido));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o pedido.");
    } finally {
      setCarregando(false);
    }
  }, [idPedido, token]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const mudarPara = async (destino: StatusPedido) => {
    if (!token) return;

    setSalvando(true);

    try {
      await atualizarStatus(token, idPedido, destino);
      await carregar();
    } catch (e) {
      // A API valida a transicao de novo e responde 409: se cair aqui, o
      // pedido mudou de estado por outra via desde que a tela carregou.
      Alert.alert(
        "Não foi possível mudar o status",
        e instanceof Error ? e.message : "Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  };

  if (carregando || erro || !pedido) {
    return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  }

  const statusAtual = pedido.status ?? "pendente";
  // A tela so oferece transicao que a API aceita, em vez de deixar tentar e
  // levar 409. entregue e cancelado sao terminais e nao listam nada.
  const destinos = TRANSICOES[statusAtual] ?? [];

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.numero}>Pedido #{pedido.id_pedido}</Text>
        <EtiquetaStatus status={statusAtual} />
      </View>

      <Text style={estilos.secao}>Cliente</Text>
      <View style={estilos.painel}>
        <Linha rotulo="Nome" valor={pedido.cliente?.nome ?? `#${pedido.id_cliente}`} />
        <Linha rotulo="E-mail" valor={pedido.cliente?.email ?? "—"} />
        <Linha rotulo="Entrega" valor={resumirEndereco(pedido)} />
      </View>

      <Text style={estilos.secao}>Itens</Text>
      <View style={estilos.painel}>
        {(pedido.itens ?? []).map((item) => (
          <View key={item.id_item} style={estilos.item}>
            <Text style={estilos.itemNome} numberOfLines={2}>
              {item.produto?.nome ?? `Produto #${item.id_produto}`}
            </Text>
            <Text style={estilos.itemQtd}>
              {item.quantidade} × {formatarPreco(Number(item.preco_unitario))}
            </Text>
          </View>
        ))}

        <View style={estilos.total}>
          <Text style={estilos.totalRotulo}>Total</Text>
          <Text style={estilos.totalValor}>{formatarPreco(Number(pedido.valor ?? 0))}</Text>
        </View>
      </View>

      <Text style={estilos.secao}>Mudar status</Text>
      <View style={estilos.painel}>
        {destinos.length === 0 ? (
          <Text style={estilos.terminal}>
            &quot;{ROTULO_STATUS[statusAtual]}&quot; é um estado final: o pedido não muda mais.
          </Text>
        ) : (
          <View style={estilos.acoes}>
            {destinos.map((destino) => (
              <TouchableOpacity
                key={destino}
                accessibilityRole="button"
                style={[estilos.acao, salvando && estilos.acaoDesativada]}
                disabled={salvando}
                onPress={() => mudarPara(destino)}
              >
                <Text style={estilos.acaoTexto}>{ROTULO_STATUS[destino]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.md,
    paddingBottom: espaco.xl,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: espaco.sm,
  },
  numero: {
    color: cores.texto,
    fontSize: fonte.destaque,
    fontWeight: "700",
  },
  secao: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
    marginTop: espaco.md,
    marginBottom: espaco.sm,
  },
  painel: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
  },
  linha: {
    paddingVertical: 12,
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
  },
  rotulo: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginBottom: 2,
  },
  valor: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: espaco.md,
    paddingVertical: 12,
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
  },
  itemNome: {
    flex: 1,
    color: cores.texto,
    fontSize: fonte.corpo,
  },
  itemQtd: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: espaco.md,
  },
  totalRotulo: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  totalValor: {
    color: cores.primaria,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  acoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: espaco.sm,
    paddingVertical: espaco.md,
  },
  acao: {
    borderColor: cores.primaria,
    borderWidth: 1,
    borderRadius: raio.sm,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  acaoDesativada: {
    opacity: 0.5,
  },
  acaoTexto: {
    color: cores.primaria,
    fontSize: fonte.pequena,
    fontWeight: "700",
  },
  terminal: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    paddingVertical: espaco.md,
  },
});
