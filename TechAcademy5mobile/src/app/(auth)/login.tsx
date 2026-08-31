import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Botao } from "@/components/Botao";
import { CampoTexto } from "@/components/CampoTexto";
import { AcessoRestritoError, useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/api";
import { cores, espaco, fonte } from "@/theme";
import { emailValido } from "@/validacao";

export default function Login() {
  const { entrar } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoEntrar = async () => {
    const emailNormalizado = email.trim();
    const novosErros: { email?: string; senha?: string } = {};

    if (!emailNormalizado) {
      novosErros.email = "Informe seu e-mail.";
    } else if (!emailValido(emailNormalizado)) {
      novosErros.email = "Informe um e-mail válido.";
    }

    if (!senha) {
      novosErros.senha = "Informe sua senha.";
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      setErro(null);
      return;
    }

    setErros({});
    setErro(null);
    setEnviando(true);

    try {
      await entrar(emailNormalizado, senha);
      router.replace("/(painel)");
    } catch (e) {
      if (e instanceof AcessoRestritoError) {
        setErro("Acesso restrito: este aplicativo é o painel administrativo da loja.");
      } else if (e instanceof ApiError && e.status === 401) {
        setErro("E-mail ou senha incorretos.");
      } else if (e instanceof TypeError) {
        setErro("Não foi possível conectar ao servidor.");
      } else {
        setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
      }
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
        <View style={estilos.formulario}>
          <Text style={estilos.titulo}>PC Forge</Text>
          <Text style={estilos.subtitulo}>Painel administrativo</Text>

          <CampoTexto
            rotulo="E-mail"
            value={email}
            onChangeText={(valor) => {
              setEmail(valor);
              if (erros.email) setErros((atual) => ({ ...atual, email: undefined }));
            }}
            erro={erros.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="voce@exemplo.com"
          />

          <CampoTexto
            rotulo="Senha"
            value={senha}
            onChangeText={(valor) => {
              setSenha(valor);
              if (erros.senha) setErros((atual) => ({ ...atual, senha: undefined }));
            }}
            erro={erros.senha}
            secureTextEntry
            placeholder="Sua senha"
          />

          {!!erro && <Text style={estilos.erro}>{erro}</Text>}

          <Botao titulo="Entrar" aoPressionar={aoEntrar} carregando={enviando} />

          <Text style={estilos.rodapeTexto}>
            Acesso exclusivo da administração. Clientes compram pela loja web.
          </Text>
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
    alignItems: "center",
  },
  formulario: {
    width: "100%",
    maxWidth: 480,
    padding: espaco.xl,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 20,
    backgroundColor: cores.superficie,
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
  rodapeTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    textAlign: "center",
    marginTop: espaco.lg,
  },
});
