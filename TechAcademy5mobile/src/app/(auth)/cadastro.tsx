import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Botao } from "@/components/Botao";
import { CampoTexto } from "@/components/CampoTexto";
import { cadastrar } from "@/services/clientes";
import { apenasDigitos, cpfValido, emailValido, formatarCpf, senhaForte } from "@/validacao";
import { cores, espaco, fonte } from "@/theme";

type Campo = "nome" | "email" | "cpf" | "senha";

export default function Cadastro() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const validar = (): boolean => {
    const novos: Partial<Record<Campo, string>> = {};

    if (!nome.trim()) novos.nome = "Informe seu nome.";
    if (!emailValido(email.trim())) novos.email = "E-mail invalido.";
    if (!cpfValido(cpf)) novos.cpf = "O CPF precisa ter 11 digitos.";
    if (!senhaForte(senha)) {
      novos.senha = "Minimo de 8 caracteres, com maiuscula, minuscula e numero.";
    }

    setErros(novos);
    return Object.keys(novos).length === 0;
  };

  const aoCadastrar = async () => {
    setErroGeral(null);

    if (!validar()) return;

    setEnviando(true);

    try {
      await cadastrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        cpf: apenasDigitos(cpf),
      });

      Alert.alert("Conta criada", "Agora e so entrar com seu e-mail e senha.");
      router.replace("/(auth)/login");
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : "Nao foi possivel criar a conta.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <CampoTexto rotulo="Nome" value={nome} onChangeText={setNome} erro={erros.nome} />

        <CampoTexto
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          erro={erros.email}
        />

        <CampoTexto
          rotulo="CPF"
          value={cpf}
          onChangeText={(valor) => setCpf(formatarCpf(valor))}
          keyboardType="number-pad"
          placeholder="000.000.000-00"
          erro={erros.cpf}
        />

        <CampoTexto
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          erro={erros.senha}
        />

        {!!erroGeral && <Text style={estilos.erro}>{erroGeral}</Text>}

        <Botao titulo="Criar conta" aoPressionar={aoCadastrar} carregando={enviando} />
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
    flexGrow: 1,
    justifyContent: "center",
    padding: espaco.lg,
  },
  erro: {
    color: cores.perigo,
    fontSize: fonte.pequena,
    marginBottom: espaco.md,
    textAlign: "center",
  },
});
