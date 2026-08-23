import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Botao } from "@/components/Botao";
import { CampoTexto } from "@/components/CampoTexto";
import { useAuth } from "@/contexts/AuthContext";
import { atualizarEndereco, criarEndereco, listarEnderecos } from "@/services/enderecos";
import { formatarCep } from "@/validacao";
import { cores, espaco, fonte } from "@/theme";
import type { EnderecoFormulario } from "@/types";

const VAZIO: EnderecoFormulario = {
  cep: "",
  cidade: "",
  estado: "",
  bairro: "",
  numero: "",
  complemento: "",
};

type Campo = keyof EnderecoFormulario;

/**
 * Mesma tela cria e edita: a rota /enderecos/novo cai aqui com id = "novo".
 * Evita duplicar formulario e validacao em dois arquivos.
 */
export default function FormularioEndereco() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cliente, token } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const editando = id !== "novo";
  const idEndereco = Number(id);

  const [form, setForm] = useState<EnderecoFormulario>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editando ? "Editar endereço" : "Novo endereço" });
  }, [navigation, editando]);

  // A API nao expoe GET /enderecos/:id para o dono sem passar pelo admin,
  // entao buscamos na lista do cliente, que ja e protegida por selfOrAdmin.
  useEffect(() => {
    if (!editando || !cliente || !token) return;

    (async () => {
      try {
        const lista = await listarEnderecos(cliente.id_cliente, token);
        const atual = lista.find((item) => item.id_endereco === idEndereco);

        if (!atual) {
          setErroGeral("Endereço não encontrado.");
          return;
        }

        setForm({
          cep: atual.cep ?? "",
          cidade: atual.cidade ?? "",
          estado: atual.estado ?? "",
          bairro: atual.bairro ?? "",
          numero: atual.numero ?? "",
          complemento: atual.complemento ?? "",
        });
      } catch (e) {
        setErroGeral(e instanceof Error ? e.message : "Falha ao carregar o endereço.");
      } finally {
        setCarregando(false);
      }
    })();
  }, [editando, cliente, token, idEndereco]);

  const alterar = useCallback((campo: Campo, valor: string) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }, []);

  /**
   * O banco aceita todos os campos nulos, mas um endereco de entrega sem
   * cidade, estado e CEP nao serve para nada: a regra de negocio e da tela.
   */
  const validar = (): boolean => {
    const novos: Partial<Record<Campo, string>> = {};

    if (!form.cidade?.trim()) novos.cidade = "Informe a cidade.";
    if (!form.estado?.trim()) novos.estado = "Informe o estado.";
    if ((form.cep ?? "").replace(/\D/g, "").length !== 8) novos.cep = "O CEP precisa ter 8 dígitos.";

    setErros(novos);
    return Object.keys(novos).length === 0;
  };

  const salvar = async () => {
    setErroGeral(null);

    if (!validar() || !cliente || !token) return;

    setSalvando(true);

    try {
      if (editando) {
        await atualizarEndereco(idEndereco, form, token);
      } else {
        await criarEndereco({ ...form, id_cliente: cliente.id_cliente }, token);
      }

      router.back();
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return <Text style={estilos.carregando}>Carregando…</Text>;
  }

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <CampoTexto
          rotulo="CEP"
          value={form.cep ?? ""}
          onChangeText={(valor) => alterar("cep", formatarCep(valor))}
          keyboardType="number-pad"
          placeholder="00000-000"
          erro={erros.cep}
        />
        <CampoTexto
          rotulo="Cidade"
          value={form.cidade ?? ""}
          onChangeText={(valor) => alterar("cidade", valor)}
          erro={erros.cidade}
        />
        <CampoTexto
          rotulo="Estado"
          value={form.estado ?? ""}
          onChangeText={(valor) => alterar("estado", valor)}
          erro={erros.estado}
        />
        <CampoTexto
          rotulo="Bairro"
          value={form.bairro ?? ""}
          onChangeText={(valor) => alterar("bairro", valor)}
        />
        <CampoTexto
          rotulo="Número"
          value={form.numero ?? ""}
          onChangeText={(valor) => alterar("numero", valor)}
          keyboardType="number-pad"
        />
        <CampoTexto
          rotulo="Complemento"
          value={form.complemento ?? ""}
          onChangeText={(valor) => alterar("complemento", valor)}
        />

        {!!erroGeral && <Text style={estilos.erro}>{erroGeral}</Text>}

        <Botao
          titulo={editando ? "Salvar alterações" : "Cadastrar endereço"}
          aoPressionar={salvar}
          carregando={salvando}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    padding: espaco.lg,
  },
  carregando: {
    color: cores.textoFraco,
    padding: espaco.lg,
  },
  erro: {
    color: cores.perigo,
    fontSize: fonte.pequena,
    marginBottom: espaco.md,
    textAlign: "center",
  },
});
