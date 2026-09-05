import { Stack } from "expo-router";
import { cores } from "@/theme";

export default function LayoutPedidos() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTintColor: cores.texto,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Pedidos" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalhe do pedido" }} />
    </Stack>
  );
}
