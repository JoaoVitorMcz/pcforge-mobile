import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { EstadoLista } from "@/components/EstadoLista";
import { useAuth } from "@/contexts/AuthContext";
import { obterDashboard } from "@/services/dashboard";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Dashboard, StatusPedido } from "@/types";

const ROTULO_STATUS: Record<StatusPedido, string> = {
  pendente: "Pendente",
  pago: "Pago",
  em_preparacao: "Em preparação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.indicador}>
      <Text style={estilos.indicadorValor}>{valor}</Text>
      <Text style={estilos.indicadorRotulo}>{rotulo}</Text>
    </View>
  );
}

export default function DashboardAdmin() {
  const { token } = useAuth();

  const [dados, setDados] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Estado so muda depois do await: setState sincrono dentro do efeito
  // provoca renders em cascata.
  const carregar = useCallback(async () => {
    if (!token) return;

    try {
      const resposta = await obterDashboard(token);
      setDados(resposta);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Nao foi possivel carregar o dashboard.");
    } finally {
      setCarregando(false);
    }
  }, [token]);

  // Os numeros mudam conforme pedidos entram: recarrega ao focar a tela.
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  if (carregando || erro || !dados) {
    return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  }

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <View style={estilos.linha}>
        <Indicador rotulo="Faturamento" valor={formatarPreco(dados.faturamento)} />
        <Indicador rotulo="Pedidos" valor={String(dados.totalPedidos)} />
      </View>

      <View style={estilos.linha}>
        <Indicador rotulo="Clientes ativos" valor={String(dados.totalClientesAtivos)} />
        <Indicador rotulo="Produtos ativos" valor={String(dados.totalProdutosAtivos)} />
      </View>

      <Text style={estilos.secao}>Pedidos por status</Text>
      <View style={estilos.painel}>
        {(Object.keys(ROTULO_STATUS) as StatusPedido[]).map((status) => (
          <View key={status} style={estilos.item}>
            <Text style={estilos.itemRotulo}>{ROTULO_STATUS[status]}</Text>
            <Text style={estilos.itemValor}>{dados.pedidosPorStatus[status]}</Text>
          </View>
        ))}
      </View>

      <Text style={estilos.secao}>Estoque baixo</Text>
      <View style={estilos.painel}>
        {dados.produtosEstoqueBaixo.length === 0 ? (
          <Text style={estilos.vazio}>Nenhum produto abaixo do limite.</Text>
        ) : (
          dados.produtosEstoqueBaixo.map((produto) => (
            <View key={produto.id_produto} style={estilos.item}>
              <Text style={estilos.itemRotulo} numberOfLines={1}>
                {produto.nome}
              </Text>
              <Text style={[estilos.itemValor, estilos.alerta]}>{produto.estoque}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.md,
  },
  linha: {
    flexDirection: "row",
    gap: espaco.md,
    marginBottom: espaco.md,
  },
  indicador: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    padding: espaco.md,
  },
  indicadorValor: {
    color: cores.primaria,
    fontSize: fonte.titulo,
    fontWeight: "700",
  },
  indicadorRotulo: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: espaco.xs,
  },
  secao: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
    marginTop: espaco.sm,
    marginBottom: espaco.sm,
  },
  painel: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    marginBottom: espaco.md,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: espaco.sm,
    gap: espaco.md,
  },
  itemRotulo: {
    flex: 1,
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  itemValor: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  alerta: {
    color: cores.alerta,
  },
  vazio: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    paddingVertical: espaco.md,
  },
});
