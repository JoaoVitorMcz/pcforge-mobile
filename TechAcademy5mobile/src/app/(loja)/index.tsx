import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { EstadoLista } from "@/components/EstadoLista";
import { ProdutoCard } from "@/components/ProdutoCard";
import { listarProdutos } from "@/services/produtos";
import { cores, espaco } from "@/theme";
import type { Produto } from "@/types";

export default function Catalogo() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // As atualizacoes de estado ficam depois do await de proposito: chamar
  // setState de forma sincrona dentro do efeito dispara renders em cascata.
  const carregar = useCallback(async () => {
    try {
      const lista = await listarProdutos();
      setProdutos(lista);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Nao foi possivel carregar o catalogo.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  // Recarrega ao focar a aba, para o catalogo nao ficar com dado velho.
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const estado = (
    <EstadoLista
      carregando={carregando}
      erro={erro}
      vazio={produtos.length === 0}
      mensagemVazio="Nenhum produto disponivel no momento."
      aoTentarNovamente={carregar}
    />
  );

  if (carregando || erro || produtos.length === 0) return estado;

  return (
    <FlatList
      data={produtos}
      keyExtractor={(item) => String(item.id_produto)}
      renderItem={({ item }) => <ProdutoCard produto={item} />}
      contentContainerStyle={estilos.lista}
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
  },
});
