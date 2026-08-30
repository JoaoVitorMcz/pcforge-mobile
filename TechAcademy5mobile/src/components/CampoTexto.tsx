import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { cores, espaco, fonte, raio } from "@/theme";

interface Props extends TextInputProps {
  rotulo: string;
  erro?: string;
}

export function CampoTexto({ rotulo, erro, style, ...resto }: Props) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoFraco}
        style={[estilos.campo, !!erro && estilos.campoComErro, style]}
        {...resto}
      />
      {!!erro && <Text style={estilos.erro}>{erro}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: {
    marginBottom: espaco.md,
  },
  rotulo: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginBottom: espaco.xs,
  },
  campo: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    color: cores.texto,
    backgroundColor: cores.superficie,
    fontSize: fonte.corpo,
  },
  campoComErro: {
    borderColor: cores.perigo,
  },
  erro: {
    color: cores.perigo,
    fontSize: fonte.pequena,
    marginTop: espaco.xs,
  },
});
