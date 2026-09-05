import { Stack } from "expo-router";
import { cores } from "@/theme";

export default function LayoutProdutos() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTintColor: cores.texto,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Produtos" }} />
      <Stack.Screen name="novo" options={{ title: "Novo produto" }} />
      <Stack.Screen name="[id]" options={{ title: "Editar produto" }} />
    </Stack>
  );
}
