import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Botao } from "@/components/Botao";
import { CampoTexto } from "@/components/CampoTexto";
import { useAuth } from "@/contexts/AuthContext";
import { cores, espaco, fonte } from "@/theme";

export default function Login() {
  const { entrar } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoEntrar = async () => {
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }

    setErro(null);
    setEnviando(true);

    try {
      await entrar(email.trim(), senha);
      router.replace("/(loja)");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Nao foi possivel entrar.");
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
        <Text style={estilos.titulo}>PC Forge</Text>
        <Text style={estilos.subtitulo}>Componentes para o seu setup</Text>

        <CampoTexto
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="voce@exemplo.com"
        />

        <CampoTexto
          rotulo="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="Sua senha"
        />

        {!!erro && <Text style={estilos.erro}>{erro}</Text>}

        <Botao titulo="Entrar" aoPressionar={aoEntrar} carregando={enviando} />

        <View style={estilos.rodape}>
          <Text style={estilos.rodapeTexto}>Ainda nao tem conta? </Text>
          <Link href="/(auth)/cadastro" style={estilos.link}>
            Cadastre-se
          </Link>
        </View>
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
  titulo: {
    color: cores.primaria,
    fontSize: fonte.destaque,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitulo: {
    color: cores.textoFraco,
    fontSize: fonte.corpo,
    textAlign: "center",
    marginBottom: espaco.xl,
  },
  erro: {
    color: cores.perigo,
    fontSize: fonte.pequena,
    marginBottom: espaco.md,
    textAlign: "center",
  },
  rodape: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: espaco.lg,
  },
  rodapeTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  link: {
    color: cores.primaria,
    fontSize: fonte.pequena,
    fontWeight: "600",
  },
});
