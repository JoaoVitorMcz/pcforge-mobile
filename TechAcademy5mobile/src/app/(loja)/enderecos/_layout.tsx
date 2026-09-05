import { Stack } from "expo-router";
import { cores } from "@/theme";

export default function LayoutEnderecos() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTintColor: cores.texto,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Meus endereços" }} />
      <Stack.Screen name="[id]" options={{ title: "Endereço" }} />
    </Stack>
  );
}
