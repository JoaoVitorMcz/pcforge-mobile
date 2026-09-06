import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, TextInput } from "react-native";
import { useFocusEffect } from "expo-router";
import { EstadoLista } from "@/components/EstadoLista";
import { ProdutoCard } from "@/components/ProdutoCard";
import { listarCategorias } from "@/services/categorias";
import { listarProdutos } from "@/services/produtos";
import { cores, espaco } from "@/theme";
import type { Produto } from "@/types";

const PALAVRAS_PERIFERICOS = [
  "periferico",
  "acessorio",
  "mouse",
  "teclado",
  "headset",
  "monitor",
  "webcam",
  "microfone",
  "controle",
];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function CatalogoSecao({ perifericos = false }: { perifericos?: boolean }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    try {
      const [lista, categorias] = await Promise.all([listarProdutos(), listarCategorias()]);
      const idsPerifericos = new Set(
        categorias
          .filter((categoria) =>
            PALAVRAS_PERIFERICOS.some((palavra) => normalizar(categoria.nome).includes(palavra))
          )
          .map((categoria) => categoria.id_categoria)
      );
      setProdutos(lista.filter((produto) => idsPerifericos.has(produto.id_categoria ?? -1) === perifericos));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os produtos.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [perifericos]);

  useFocusEffect(useCallback(() => void carregar(), [carregar]));

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return termo
      ? produtos.filter((produto) => normalizar(`${produto.nome} ${produto.descricao ?? ""}`).includes(termo))
      : produtos;
  }, [busca, produtos]);

  if (carregando || erro || produtos.length === 0) {
    return (
      <EstadoLista
        carregando={carregando}
        erro={erro}
        vazio={produtos.length === 0}
        mensagemVazio="Nenhum produto encontrado."
        aoTentarNovamente={carregar}
      />
    );
  }

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(item) => String(item.id_produto)}
      ListHeaderComponent={
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar produto"
          placeholderTextColor={cores.textoFraco}
          style={estilos.busca}
          accessibilityLabel="Buscar produto"
        />
      }
      ListEmptyComponent={<EstadoLista vazio mensagemVazio="Nenhum produto encontrado." />}
      renderItem={({ item }) => <ProdutoCard produto={item} />}
      contentContainerStyle={{ padding: espaco.md }}
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
  busca: {
    height: 48,
    marginBottom: espaco.md,
    paddingHorizontal: espaco.md,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    backgroundColor: cores.superficie,
    color: cores.texto,
  },
});
