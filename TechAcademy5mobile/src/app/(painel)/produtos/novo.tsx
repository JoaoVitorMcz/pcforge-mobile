import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert } from "react-native";
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
import { criarProduto } from "@/services/produtos";
import type { Categoria } from "@/types";

export default function NovoProduto() {
  const { token } = useAuth();
  const router = useRouter();

  const [valores, setValores] = useState<ValoresProduto>(VALORES_INICIAIS);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [erros, setErros] = useState<ReturnType<typeof validarProduto>>({});
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCategorias(await listarCategorias());
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as categorias.");
    } finally {
      setCarregando(false);
    }
  }, []);

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
      await criarProduto(token, paraPayload(valores));
      router.back();
    } catch (e) {
      Alert.alert(
        "Não foi possível criar",
        e instanceof Error ? e.message : "Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
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
      rotuloEnvio="Criar produto"
      enviando={enviando}
      aoEnviar={salvar}
      seletorDeImagem={
        <SeletorImagem
          imagem={valores.imagem}
          token={token}
          aoEnviar={(url) => setValores((atual) => ({ ...atual, imagem: url }))}
          aoRemover={() => setValores((atual) => ({ ...atual, imagem: null }))}
        />
      }
    />
  );
}
