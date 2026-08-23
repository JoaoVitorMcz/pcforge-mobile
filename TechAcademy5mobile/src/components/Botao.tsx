import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { cores, espaco, fonte, raio } from "@/theme";

type Variante = "primaria" | "secundaria" | "perigo";

interface Props {
  titulo: string;
  aoPressionar: () => void;
  variante?: Variante;
  carregando?: boolean;
  desabilitado?: boolean;
}

const fundoPorVariante: Record<Variante, string> = {
  primaria: cores.primaria,
  secundaria: "transparent",
  perigo: cores.perigo,
};

const textoPorVariante: Record<Variante, string> = {
  primaria: cores.fundo,
  secundaria: cores.textoFraco,
  perigo: cores.texto,
};

export function Botao({
  titulo,
  aoPressionar,
  variante = "primaria",
  carregando = false,
  desabilitado = false,
}: Props) {
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      onPress={aoPressionar}
      disabled={inativo}
      style={({ pressed }) => [
        estilos.base,
        { backgroundColor: fundoPorVariante[variante] },
        variante === "secundaria" && estilos.contorno,
        (pressed || inativo) && estilos.esmaecido,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={textoPorVariante[variante]} />
      ) : (
        <Text style={[estilos.texto, { color: textoPorVariante[variante] }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: raio.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: espaco.md,
  },
  contorno: {
    borderWidth: 1,
    borderColor: cores.borda,
  },
  esmaecido: {
    opacity: 0.6,
  },
  texto: {
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
});
