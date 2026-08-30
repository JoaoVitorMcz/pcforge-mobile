import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

function Indicador({
  rotulo,
  valor,
  tom = "normal",
}: {
  rotulo: string;
  valor: string;
  tom?: "normal" | "alerta";
}) {
  return (
    <View style={estilos.indicador}>
      <Text style={[estilos.indicadorValor, tom === "alerta" && estilos.alerta]}>{valor}</Text>
      <Text style={estilos.indicadorRotulo}>{rotulo}</Text>
    </View>
  );
}

function Atalho({
  icone,
  titulo,
  descricao,
  aoPressionar,
}: {
  icone: string;
  titulo: string;
  descricao: string;
  aoPressionar: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.75}
      style={estilos.atalho}
      onPress={aoPressionar}
    >
      <View style={estilos.atalhoIcone}>
        <Text style={estilos.atalhoIconeTexto}>{icone}</Text>
      </View>

      <View style={estilos.atalhoTexto}>
        <Text style={estilos.atalhoTitulo}>{titulo}</Text>
        <Text style={estilos.atalhoDescricao}>{descricao}</Text>
      </View>

      <Text style={estilos.seta}>›</Text>
    </TouchableOpacity>
  );
}

export default function DashboardAdmin() {
  const { token, cliente } = useAuth();
  const router = useRouter();

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
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o painel administrativo.");
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
      <View style={estilos.boasVindas}>
        <Text style={estilos.sobreTitulo}>PAINEL ADMINISTRATIVO</Text>
        <Text style={estilos.titulo}>Olá, {cliente?.nome?.split(" ")[0] ?? "Admin"}</Text>
        <Text style={estilos.subtitulo}>Acompanhe o catálogo e mantenha sua loja em dia.</Text>
      </View>

      <Text style={estilos.secao}>Visão geral</Text>

      <View style={estilos.grade}>
        <Indicador rotulo="Faturamento" valor={formatarPreco(dados.faturamento)} />
        <Indicador rotulo="Pedidos" valor={String(dados.totalPedidos)} />
      </View>

      <View style={estilos.grade}>
        <Indicador rotulo="Produtos ativos" valor={String(dados.totalProdutosAtivos)} />
        <Indicador rotulo="Clientes ativos" valor={String(dados.totalClientesAtivos)} />
        <Indicador
          rotulo="Estoque baixo"
          valor={String(dados.produtosEstoqueBaixo.length)}
          tom="alerta"
        />
      </View>

      <Text style={estilos.secao}>Gerenciar loja</Text>

      <View style={estilos.painel}>
        <Atalho
          icone="▣"
          titulo="Produtos"
          descricao="Catálogo, preços e estoque"
          aoPressionar={() => router.push("/(painel)/produtos")}
        />
        <Atalho
          icone="≡"
          titulo="Pedidos"
          descricao="Acompanhar e mudar o status"
          aoPressionar={() => router.push("/(painel)/pedidos")}
        />
        <Atalho
          icone="◉"
          titulo="Clientes"
          descricao="Pessoas cadastradas na loja"
          aoPressionar={() => router.push("/(painel)/clientes")}
        />
      </View>

      <Text style={estilos.secao}>Pedidos por status</Text>

      <View style={estilos.painel}>
        {(Object.keys(ROTULO_STATUS) as StatusPedido[]).map((status) => (
          <View key={status} style={estilos.linhaPainel}>
            <Text style={estilos.linhaRotulo}>{ROTULO_STATUS[status]}</Text>
            <Text style={estilos.linhaValor}>{dados.pedidosPorStatus[status]}</Text>
          </View>
        ))}
      </View>

      <Text style={estilos.secao}>Atenção ao estoque</Text>

      <View style={estilos.painel}>
        {dados.produtosEstoqueBaixo.length === 0 ? (
          <Text style={estilos.vazio}>Seu estoque está saudável. Nenhum produto abaixo do limite.</Text>
        ) : (
          dados.produtosEstoqueBaixo.map((produto) => (
            <View key={produto.id_produto} style={estilos.linhaPainel}>
              <Text style={estilos.linhaRotulo} numberOfLines={1}>
                {produto.nome}
              </Text>
              <Text style={[estilos.linhaValor, estilos.alerta]}>{produto.estoque} un.</Text>
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
    paddingBottom: espaco.xl,
  },
  boasVindas: {
    marginBottom: espaco.lg,
  },
  sobreTitulo: {
    color: cores.primaria,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: espaco.xs,
  },
  titulo: {
    color: cores.texto,
    fontSize: fonte.destaque,
    fontWeight: "700",
  },
  subtitulo: {
    color: cores.textoFraco,
    fontSize: fonte.corpo,
    marginTop: espaco.xs,
  },
  secao: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
    marginBottom: espaco.sm,
    marginTop: espaco.md,
  },
  grade: {
    flexDirection: "row",
    gap: espaco.sm,
    marginBottom: espaco.sm,
  },
  indicador: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espaco.sm,
    minHeight: 92,
    justifyContent: "space-between",
  },
  indicadorValor: {
    color: cores.primaria,
    fontSize: fonte.titulo,
    fontWeight: "700",
  },
  indicadorRotulo: {
    color: cores.textoFraco,
    fontSize: 11,
    lineHeight: 15,
  },
  alerta: {
    color: cores.alerta,
  },
  painel: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
  },
  atalho: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  atalhoIcone: {
    backgroundColor: cores.superficieClara,
    width: 38,
    height: 38,
    borderRadius: raio.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: espaco.sm,
  },
  atalhoIconeTexto: {
    color: cores.primaria,
    fontSize: 18,
    fontWeight: "700",
  },
  atalhoTexto: {
    flex: 1,
  },
  atalhoTitulo: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  atalhoDescricao: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: 2,
  },
  seta: {
    color: cores.textoFraco,
    fontSize: 26,
    lineHeight: 26,
  },
  linhaPainel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
    gap: espaco.md,
  },
  linhaRotulo: {
    flex: 1,
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  linhaValor: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  vazio: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    paddingVertical: espaco.md,
    textAlign: "center",
  },
});
