import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { urlDaImagem } from "@/services/imagens";
import { enviarImagem } from "@/services/upload";
import { cores, espaco, fonte, raio } from "@/theme";

interface Props {
  /** URL ja gravada no produto, como "/uploads/123.png" ou so o nome do arquivo. */
  imagem: string | null;
  token: string | null;
  aoEnviar: (url: string) => void;
  aoRemover: () => void;
}

/**
 * Escolhe uma imagem do aparelho e envia para a API antes de salvar o produto.
 *
 * O upload acontece na hora da escolha, e nao no envio do formulario, para o
 * erro de imagem (400 de formato, 413 de tamanho) aparecer imediatamente em
 * vez de derrubar o salvamento inteiro depois de tudo preenchido.
 */
export function SeletorImagem({ imagem, token, aoEnviar, aoRemover }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const escolher = async () => {
    setErro(null);

    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      setErro("Permissão de acesso às fotos negada.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (resultado.canceled || !token) return;

    setEnviando(true);

    try {
      aoEnviar(await enviarImagem(token, resultado.assets[0].uri));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviando(false);
    }
  };

  const previa = urlDaImagem(imagem);

  return (
    <View style={estilos.bloco}>
      <Text style={estilos.rotulo}>Imagem</Text>

      {previa ? (
        <Image source={{ uri: previa }} style={estilos.previa} resizeMode="contain" />
      ) : (
        <View style={[estilos.previa, estilos.previaVazia]}>
          <Text style={estilos.previaTexto}>
            {imagem ? `Servida pela loja web: ${imagem}` : "Nenhuma imagem"}
          </Text>
        </View>
      )}

      <View style={estilos.acoes}>
        <TouchableOpacity
          accessibilityRole="button"
          style={estilos.botao}
          onPress={escolher}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color={cores.primaria} />
          ) : (
            <Text style={estilos.botaoTexto}>{imagem ? "Trocar imagem" : "Escolher imagem"}</Text>
          )}
        </TouchableOpacity>

        {!!imagem && !enviando && (
          <TouchableOpacity accessibilityRole="button" style={estilos.botao} onPress={aoRemover}>
            <Text style={[estilos.botaoTexto, estilos.remover]}>Remover</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!erro && <Text style={estilos.erro}>{erro}</Text>}

      <Text style={estilos.ajuda}>JPG, PNG, WEBP ou GIF, até 5 MB.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    marginBottom: espaco.md,
  },
  rotulo: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginBottom: espaco.xs,
  },
  previa: {
    height: 160,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  previaVazia: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: espaco.md,
  },
  previaTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    textAlign: "center",
  },
  acoes: {
    flexDirection: "row",
    gap: espaco.sm,
    marginTop: espaco.sm,
  },
  botao: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  botaoTexto: {
    color: cores.primaria,
    fontSize: fonte.pequena,
    fontWeight: "600",
  },
  remover: {
    color: cores.perigo,
  },
  erro: {
    color: cores.perigo,
    fontSize: fonte.pequena,
    marginTop: espaco.sm,
  },
  ajuda: {
    color: cores.textoFraco,
    fontSize: 11,
    marginTop: espaco.sm,
  },
});
