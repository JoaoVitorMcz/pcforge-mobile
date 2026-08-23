import { Stack } from "expo-router";
import { cores } from "@/theme";

export default function LayoutAuth() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTintColor: cores.texto,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Entrar" }} />
      <Stack.Screen name="cadastro" options={{ title: "Criar conta" }} />
    </Stack>
  );
}
