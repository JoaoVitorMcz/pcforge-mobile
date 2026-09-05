import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Botao } from "@/components/Botao";
import { EstadoLista } from "@/components/EstadoLista";
import { useAuth } from "@/contexts/AuthContext";
import { useCarrinho } from "@/contexts/CarrinhoContext";
import { ApiError } from "@/services/api";
import { listarEnderecos } from "@/services/enderecos";
import { criarPedido } from "@/services/pedidos";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Endereco, ItemCarrinho } from "@/types";

/** Resume o endereco em uma linha; todos os campos sao opcionais no model. */
function resumir(endereco: Endereco): string {
  const partes = [endereco.numero, endereco.bairro, endereco.cidade, endereco.estado].filter(
    Boolean
  );

  return partes.length > 0 ? partes.join(", ") : `Endereço #${endereco.id_endereco}`;
}

function LinhaItem({
  item,
  aoAumentar,
  aoDiminuir,
  aoRemover,
}: {
  item: ItemCarrinho;
  aoAumentar: () => void;
  aoDiminuir: () => void;
  aoRemover: () => void;
}) {
  const noLimite = item.quantidade >= item.produto.estoque;

  return (
    <View style={estilos.item}>
      <View style={estilos.itemTopo}>
        <Text style={estilos.itemNome} numberOfLines={2}>
          {item.produto.nome}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Remover ${item.produto.nome}`}
          onPress={aoRemover}
        >
          <Text style={estilos.remover}>Remover</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.itemRodape}>
        <View style={estilos.contador}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Diminuir quantidade"
            style={[estilos.passo, item.quantidade <= 1 && estilos.passoBloqueado]}
            disabled={item.quantidade <= 1}
            onPress={aoDiminuir}
          >
            <Text style={estilos.passoTexto}>−</Text>
          </TouchableOpacity>

          <Text style={estilos.quantidade}>{item.quantidade}</Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Aumentar quantidade"
            style={[estilos.passo, noLimite && estilos.passoBloqueado]}
            disabled={noLimite}
            onPress={aoAumentar}
          >
            <Text style={estilos.passoTexto}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={estilos.subtotal}>
          {formatarPreco(Number(item.produto.valor) * item.quantidade)}
        </Text>
      </View>

      {noLimite && (
        <Text style={estilos.aviso}>
          Estoque disponível: {item.produto.estoque}. Não dá para aumentar mais.
        </Text>
      )}
    </View>
  );
}

/**
 * Carrinho e checkout na mesma tela.
 *
 * Juntar os dois deixa o endereco de entrega ao lado do total, que e onde o
 * cliente decide, e evita uma tela intermediaria que so repetiria a lista.
 */
export default function Carrinho() {
  const { itens, carregando, total, aumentar, diminuir, remover, limpar } = useCarrinho();
  const { token, cliente } = useAuth();
  const router = useRouter();

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [idEndereco, setIdEndereco] = useState<number | null>(null);
  const [buscandoEnderecos, setBuscandoEnderecos] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  const carregarEnderecos = useCallback(async () => {
    if (!token || !cliente) return;

    try {
      const lista = await listarEnderecos(cliente.id_cliente, token);
      setEnderecos(lista);
      // Um endereco so: escolhe sozinho, para nao pedir um toque inutil.
      setIdEndereco((atual) => atual ?? (lista.length === 1 ? lista[0].id_endereco : null));
    } catch {
      setEnderecos([]);
    } finally {
      setBuscandoEnderecos(false);
    }
  }, [cliente, token]);

  // Volta do cadastro de endereco ja com o endereco novo na lista.
  useFocusEffect(
    useCallback(() => {
      void carregarEnderecos();
    }, [carregarEnderecos])
  );

  const finalizar = async () => {
    if (!token || !idEndereco) return;

    setFinalizando(true);

    try {
      const { pedido } = await criarPedido(token, {
        id_endereco_entrega: idEndereco,
        itens: itens.map((item) => ({
          id_produto: item.produto.id_produto,
          quantidade: item.quantidade,
        })),
      });

      limpar();

      Alert.alert("Pedido criado", `Seu pedido #${pedido.id_pedido} foi registrado.`, [
        { text: "Ver meus pedidos", onPress: () => router.push("/(loja)/pedidos") },
        { text: "Continuar comprando", style: "cancel" },
      ]);
    } catch (e) {
      // 409 vem do backend quando o estoque mudou entre montar o carrinho e
      // finalizar. A mensagem nomeia o produto, entao vale mostrar como veio.
      const mensagem =
        e instanceof ApiError
          ? e.message
          : e instanceof TypeError
            ? "Não foi possível conectar ao servidor."
            : "Não foi possível finalizar o pedido.";

      Alert.alert(e instanceof ApiError && e.status === 409 ? "Estoque insuficiente" : "Erro", mensagem);

      // O estoque mudou: recarrega para o carrinho refletir o que existe agora.
      if (e instanceof ApiError && e.status === 409) {
        router.replace("/(loja)/carrinho");
      }
    } finally {
      setFinalizando(false);
    }
  };

  if (carregando) {
    return <EstadoLista carregando />;
  }

  if (itens.length === 0) {
    return (
      <View style={estilos.vazio}>
        <Text style={estilos.vazioTitulo}>Seu carrinho está vazio</Text>
        <Text style={estilos.vazioTexto}>Escolha componentes no catálogo para começar.</Text>
        <View style={estilos.vazioAcao}>
          <Botao titulo="Ver catálogo" aoPressionar={() => router.push("/(loja)")} />
        </View>
      </View>
    );
  }

  const semEndereco = !buscandoEnderecos && enderecos.length === 0;

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      {itens.map((item) => (
        <LinhaItem
          key={item.produto.id_produto}
          item={item}
          aoAumentar={() => aumentar(item.produto.id_produto)}
          aoDiminuir={() => diminuir(item.produto.id_produto)}
          aoRemover={() => remover(item.produto.id_produto)}
        />
      ))}

      <Text style={estilos.secao}>Endereço de entrega</Text>

      {semEndereco ? (
        <View style={estilos.painel}>
          <Text style={estilos.aviso}>
            Você precisa de um endereço cadastrado para finalizar a compra.
          </Text>
          <View style={estilos.painelAcao}>
            <Botao
              titulo="Cadastrar endereço"
              variante="secundaria"
              aoPressionar={() => router.push("/(loja)/enderecos/novo")}
            />
          </View>
        </View>
      ) : (
        <View style={estilos.painel}>
          {enderecos.map((endereco) => {
            const escolhido = idEndereco === endereco.id_endereco;

            return (
              <TouchableOpacity
                key={endereco.id_endereco}
                accessibilityRole="radio"
                accessibilityState={{ selected: escolhido }}
                style={[estilos.endereco, escolhido && estilos.enderecoEscolhido]}
                onPress={() => setIdEndereco(endereco.id_endereco)}
              >
                <Text style={[estilos.enderecoTexto, escolhido && estilos.enderecoTextoEscolhido]}>
                  {resumir(endereco)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={estilos.totalLinha}>
        <Text style={estilos.totalRotulo}>Total</Text>
        <Text style={estilos.totalValor}>{formatarPreco(total)}</Text>
      </View>

      <Botao
        titulo="Finalizar pedido"
        carregando={finalizando}
        aoPressionar={finalizar}
        desabilitado={!idEndereco || finalizando}
      />

      {!idEndereco && !semEndereco && (
        <Text style={estilos.aviso}>Escolha um endereço de entrega para continuar.</Text>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.md,
    paddingBottom: espaco.xl,
  },
  vazio: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: espaco.lg,
  },
  vazioTitulo: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  vazioTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: espaco.xs,
    textAlign: "center",
  },
  vazioAcao: {
    marginTop: espaco.lg,
    alignSelf: "stretch",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: espaco.sm,
  },
  itemNome: {
    flex: 1,
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  remover: {
    color: cores.perigo,
    fontSize: fonte.pequena,
    fontWeight: "600",
  },
  itemRodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: espaco.md,
  },
  contador: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.md,
  },
  passo: {
    width: 36,
    height: 36,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficieClara,
    alignItems: "center",
    justifyContent: "center",
  },
  passoBloqueado: {
    opacity: 0.4,
  },
  passoTexto: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  quantidade: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },
  subtotal: {
    color: cores.primaria,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  aviso: {
    color: cores.alerta,
    fontSize: fonte.pequena,
    marginTop: espaco.sm,
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
    padding: espaco.md,
    marginBottom: espaco.md,
  },
  painelAcao: {
    marginTop: espaco.md,
  },
  endereco: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    padding: espaco.md,
    marginBottom: espaco.sm,
  },
  enderecoEscolhido: {
    borderColor: cores.primaria,
    backgroundColor: cores.superficieClara,
  },
  enderecoTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  enderecoTextoEscolhido: {
    color: cores.primaria,
    fontWeight: "700",
  },
  totalLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: espaco.md,
  },
  totalRotulo: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "700",
  },
  totalValor: {
    color: cores.primaria,
    fontSize: fonte.titulo,
    fontWeight: "700",
  },
});
