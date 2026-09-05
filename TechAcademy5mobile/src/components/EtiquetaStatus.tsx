import { StyleSheet, Text, View } from "react-native";
import { ROTULO_STATUS } from "@/services/pedidos";
import { cores, espaco, raio } from "@/theme";
import type { StatusPedido } from "@/types";

/** Cor de fundo e de texto por status, para o estado ser lido de relance. */
const TONS: Record<StatusPedido, { fundo: string; texto: string }> = {
  pendente: { fundo: "#3b3320", texto: cores.alerta },
  pago: { fundo: "#153d35", texto: cores.sucesso },
  em_preparacao: { fundo: "#1e3350", texto: "#7db4ff" },
  enviado: { fundo: "#1e3350", texto: "#7db4ff" },
  entregue: { fundo: "#153d35", texto: cores.sucesso },
  cancelado: { fundo: "#3b2630", texto: cores.perigo },
};

export function EtiquetaStatus({ status }: { status: StatusPedido }) {
  const tom = TONS[status];

  return (
    <View style={[estilos.etiqueta, { backgroundColor: tom.fundo }]}>
      <Text style={[estilos.texto, { color: tom.texto }]}>{ROTULO_STATUS[status]}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    borderRadius: raio.sm,
    paddingHorizontal: espaco.sm,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  texto: {
    fontSize: 11,
    fontWeight: "700",
  },
});
