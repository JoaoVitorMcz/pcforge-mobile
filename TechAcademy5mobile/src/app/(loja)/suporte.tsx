import { useState } from "react";
import { enviarSuporte, suporteConfigurado } from "@/services/suporte";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { cores, espaco, fonte, raio } from "@/theme";

const TAGS = [
  "Dúvida sobre produto",
  "Problema com pedido",
  "Compatibilidade",
  "Troca / Devolução",
  "Garantia",
  "Outro",
];

export default function Suporte() {
  const [tagAtiva, setTagAtiva] = useState(TAGS[0]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pedido, setPedido] = useState("");
  const [produto, setProduto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [status, setStatus] = useState<"ocioso" | "enviando" | "sucesso" | "erro">("ocioso");
  // Campo faltando e falha no envio sao coisas diferentes: antes as duas
  // mostravam "preencha os campos obrigatorios", o que confundia quem tinha
  // preenchido tudo e caiu numa falha de rede.
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      setErro("Preencha nome, e-mail e mensagem para enviar.");
      setStatus("erro");
      return;
    }

    setErro(null);
    setStatus("enviando");

    try {
      await enviarSuporte({ nome, email, pedido, produto, mensagem, tipo: tagAtiva });
      setNome("");
      setEmail("");
      setPedido("");
      setProduto("");
      setMensagem("");
      setStatus("sucesso");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar agora.");
      setStatus("erro");
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.tela} keyboardShouldPersistTaps="handled">
      <View style={estilos.painel}>
        <Text style={estilos.titulo}>Suporte Técnico</Text>
        <Text style={estilos.texto}>Resposta em até 24h úteis</Text>
        <Text style={estilos.contato}>suporte@pcforge.com.br</Text>
        <Text style={estilos.subtitulo}>Selecione o tipo de solicitação:</Text>
        <View style={estilos.tags}>
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[estilos.tag, tagAtiva === tag && estilos.tagAtiva]}
              onPress={() => setTagAtiva(tag)}
            >
              <Text style={[estilos.tagTexto, tagAtiva === tag && estilos.tagTextoAtivo]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Campo label="Nome" valor={nome} aoMudar={setNome} placeholder="Seu nome completo" obrigatorio />
        <Campo label="E-mail" valor={email} aoMudar={setEmail} placeholder="seu@email.com" teclado="email-address" obrigatorio />
        <Campo label="Número do pedido" valor={pedido} aoMudar={setPedido} placeholder="Ex: #00123 (opcional)" />
        <Campo label="Produto relacionado" valor={produto} aoMudar={setProduto} placeholder="Ex: RTX 4070, Ryzen 7..." />
        <Campo
          label="Descreva o problema"
          valor={mensagem}
          aoMudar={setMensagem}
          placeholder="Conte com detalhes o que está acontecendo."
          multilinha
          obrigatorio
        />

        <Text style={estilos.nota}>Campos obrigatórios: nome, e-mail e mensagem.</Text>
        <TouchableOpacity style={estilos.botao} onPress={() => void enviar()} disabled={status === "enviando"}>
          {status === "enviando" ? <ActivityIndicator color={cores.fundo} /> : <Text style={estilos.botaoTexto}>Enviar</Text>}
        </TouchableOpacity>

        {status === "sucesso" && <Text style={estilos.sucesso}>Mensagem enviada! Responderemos em até 24h.</Text>}
        {status === "erro" && !!erro && <Text style={estilos.erro}>{erro}</Text>}

        {!suporteConfigurado && (
          <Text style={estilos.erro}>
            Envio indisponível: as variáveis EXPO_PUBLIC_EMAILJS_* não estão configuradas.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function Campo({
  label,
  valor,
  aoMudar,
  placeholder,
  teclado,
  multilinha = false,
  obrigatorio = false,
}: {
  label: string;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder: string;
  teclado?: "email-address";
  multilinha?: boolean;
  obrigatorio?: boolean;
}) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.rotulo}>{label}{obrigatorio ? " *" : ""}</Text>
      <TextInput
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.textoFraco}
        keyboardType={teclado}
        multiline={multilinha}
        style={[estilos.input, multilinha && estilos.textarea]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, padding: espaco.md },
  painel: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espaco.lg,
  },
  titulo: { color: cores.texto, fontSize: fonte.titulo, fontWeight: "700", marginBottom: espaco.md },
  texto: { color: cores.textoFraco, fontSize: fonte.corpo, lineHeight: 22 },
  contato: { color: cores.primaria, fontSize: fonte.corpo, fontWeight: "700", marginVertical: espaco.md },
  subtitulo: { color: cores.texto, fontSize: fonte.corpo, marginBottom: espaco.sm },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm, marginBottom: espaco.md },
  tag: { borderWidth: 1, borderColor: cores.borda, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  tagAtiva: { borderColor: cores.primaria, backgroundColor: cores.primaria },
  tagTexto: { color: cores.textoFraco, fontSize: fonte.pequena },
  tagTextoAtivo: { color: cores.fundo, fontWeight: "700" },
  campo: { marginTop: espaco.sm },
  rotulo: { color: cores.texto, fontSize: fonte.pequena, marginBottom: espaco.xs },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    backgroundColor: cores.fundo,
    color: cores.texto,
    paddingHorizontal: espaco.sm,
    paddingVertical: espaco.sm,
  },
  textarea: { minHeight: 110, textAlignVertical: "top" },
  nota: { color: cores.textoFraco, fontSize: 12, marginTop: espaco.md },
  botao: { height: 46, marginTop: espaco.md, borderRadius: raio.sm, backgroundColor: cores.primaria, alignItems: "center", justifyContent: "center" },
  botaoTexto: { color: cores.fundo, fontWeight: "700" },
  sucesso: { color: cores.sucesso, marginTop: espaco.md, textAlign: "center" },
  erro: { color: cores.perigo, marginTop: espaco.md, textAlign: "center" },
});
