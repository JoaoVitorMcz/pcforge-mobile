import { Stack } from "expo-router";
import { cores } from "@/theme";

export default function LayoutPedidosCliente() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTintColor: cores.texto,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Meus pedidos" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalhe do pedido" }} />
    </Stack>
  );
}
