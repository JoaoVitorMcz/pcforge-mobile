import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { Botao } from "@/components/Botao";
import { EstadoLista } from "@/components/EstadoLista";
import {
  FormularioProduto,
  paraPayload,
  validarProduto,
  VALORES_INICIAIS,
  type ValoresProduto,
} from "@/components/FormularioProduto";
import { SeletorImagem } from "@/components/SeletorImagem";
import { useAuth } from "@/contexts/AuthContext";
import { listarCategorias } from "@/services/categorias";
import { atualizarProduto, buscarProduto, desativarProduto } from "@/services/produtos";
import { espaco } from "@/theme";
import type { Categoria } from "@/types";

export default function EditarProduto() {
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idProduto = Number(id);

  const [valores, setValores] = useState<ValoresProduto>(VALORES_INICIAIS);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erros, setErros] = useState<ReturnType<typeof validarProduto>>({});
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [produto, listaCategorias] = await Promise.all([
        buscarProduto(idProduto),
        listarCategorias(),
      ]);

      setValores({
        nome: produto.nome,
        descricao: produto.descricao ?? "",
        // O formulario trabalha em texto; a virgula e o separador que o
        // teclado decimal oferece em pt-BR.
        valor: String(produto.valor).replace(".", ","),
        estoque: String(produto.estoque),
        id_categoria: produto.id_categoria ?? null,
        imagem: produto.imagem ?? null,
        destaque: Boolean(produto.destaque),
      });
      setCategorias(listaCategorias);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o produto.");
    } finally {
      setCarregando(false);
    }
  }, [idProduto]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const salvar = async () => {
    const novosErros = validarProduto(valores);

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    if (!token) return;

    setErros({});
    setEnviando(true);

    try {
      await atualizarProduto(token, idProduto, paraPayload(valores));
      router.back();
    } catch (e) {
      Alert.alert("Não foi possível salvar", e instanceof Error ? e.message : "Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const confirmarDesativacao = () => {
    Alert.alert(
      "Desativar produto",
      // Nao e exclusao: o produto sai da vitrine mas continua existindo para os
      // pedidos que ja o referenciam.
      `"${valores.nome}" sai da vitrine da loja, mas continua nos pedidos já feitos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: async () => {
            if (!token) return;

            try {
              await desativarProduto(token, idProduto);
              router.back();
            } catch (e) {
              Alert.alert(
                "Não foi possível desativar",
                e instanceof Error ? e.message : "Tente novamente."
              );
            }
          },
        },
      ]
    );
  };

  if (carregando || erro) {
    return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  }

  return (
    <FormularioProduto
      valores={valores}
      aoMudar={setValores}
      categorias={categorias}
      erros={erros}
      aoLimparErro={(campo) => setErros((atual) => ({ ...atual, [campo]: undefined }))}
      rotuloEnvio="Salvar alterações"
      enviando={enviando}
      aoEnviar={salvar}
      seletorDeImagem={
        <>
          <SeletorImagem
            imagem={valores.imagem}
            token={token}
            aoEnviar={(url) => setValores((atual) => ({ ...atual, imagem: url }))}
            aoRemover={() => setValores((atual) => ({ ...atual, imagem: null }))}
          />

          <View style={estilos.perigo}>
            <Botao titulo="Desativar produto" variante="secundaria" aoPressionar={confirmarDesativacao} />
          </View>
        </>
      }
    />
  );
}

const estilos = StyleSheet.create({
  perigo: {
    marginBottom: espaco.md,
  },
});
