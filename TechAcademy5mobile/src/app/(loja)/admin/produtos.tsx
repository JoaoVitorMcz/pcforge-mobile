import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { EstadoLista } from "@/components/EstadoLista";
import { listarProdutos } from "@/services/produtos";
import { cores, espaco, fonte, formatarPreco, raio } from "@/theme";
import type { Produto } from "@/types";

export default function ProdutosAdmin() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const carregar = useCallback(async () => { try { setProdutos(await listarProdutos()); setErro(null); } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar os produtos."); } finally { setCarregando(false); setAtualizando(false); } }, []);
  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));
  const filtrados = useMemo(() => produtos.filter((produto) => produto.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))), [busca, produtos]);
  if (carregando || erro) return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  return <FlatList data={filtrados} keyExtractor={(item) => String(item.id_produto)} contentContainerStyle={estilos.lista} ListHeaderComponent={<><View style={estilos.resumo}><Text style={estilos.resumoValor}>{produtos.length}</Text><Text style={estilos.resumoTexto}>produtos no catálogo</Text></View><TextInput value={busca} onChangeText={setBusca} placeholder="Buscar produto" placeholderTextColor={cores.textoFraco} style={estilos.busca} accessibilityLabel="Buscar produto" /></>} ListEmptyComponent={<EstadoLista vazio mensagemVazio="Nenhum produto encontrado." />} renderItem={({ item }) => <ProdutoLinha produto={item} />} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); void carregar(); }} tintColor={cores.primaria} />} />;
}

function ProdutoLinha({ produto }: { produto: Produto }) { const semEstoque = produto.estoque <= 0; const baixo = produto.estoque > 0 && produto.estoque < 5; return <View style={estilos.item}><View style={estilos.itemTopo}><Text style={estilos.nome} numberOfLines={2}>{produto.nome}</Text>{produto.destaque && <Text style={estilos.destaque}>DESTAQUE</Text>}</View><View style={estilos.itemRodape}><Text style={estilos.preco}>{formatarPreco(produto.valor)}</Text><Text style={[estilos.estoque, (semEstoque || baixo) && estilos.estoqueAlerta]}>{semEstoque ? "Esgotado" : `${produto.estoque} em estoque`}</Text></View></View>; }

const estilos = StyleSheet.create({ lista: { padding: espaco.md, flexGrow: 1 }, resumo: { flexDirection: "row", alignItems: "baseline", marginBottom: espaco.md }, resumoValor: { color: cores.primaria, fontSize: fonte.titulo, fontWeight: "700", marginRight: espaco.xs }, resumoTexto: { color: cores.textoFraco, fontSize: fonte.pequena }, busca: { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1, borderRadius: raio.md, color: cores.texto, fontSize: fonte.corpo, paddingHorizontal: espaco.md, height: 48, marginBottom: espaco.md }, item: { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1, borderRadius: raio.md, padding: espaco.md, marginBottom: espaco.sm }, itemTopo: { flexDirection: "row", gap: espaco.sm, alignItems: "flex-start" }, nome: { flex: 1, color: cores.texto, fontSize: fonte.corpo, fontWeight: "600" }, destaque: { color: cores.primaria, fontSize: 10, fontWeight: "700" }, itemRodape: { flexDirection: "row", justifyContent: "space-between", marginTop: espaco.md }, preco: { color: cores.primaria, fontSize: fonte.corpo, fontWeight: "700" }, estoque: { color: cores.sucesso, fontSize: fonte.pequena, fontWeight: "600" }, estoqueAlerta: { color: cores.alerta } });
