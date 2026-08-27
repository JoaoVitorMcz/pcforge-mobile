import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { cores } from "@/theme";

/**
 * Guarda da area administrativa. Esconder a aba no layout de tabs e apenas
 * cosmetico: quem chegar aqui por deep link ou navegacao direta cai neste
 * redirect. A API tambem responde 403 (adminMiddleware), entao sao tres
 * camadas independentes.
 */
export default function LayoutAdmin() {
  const { carregando, autenticado, isAdmin } = useAuth();

  if (carregando) return null;
  if (!autenticado) return <Redirect href="/(auth)/login" />;
  if (!isAdmin) return <Redirect href="/(loja)" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTintColor: cores.texto,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Dashboard" }} />
      <Stack.Screen name="produtos" options={{ title: "Gerenciar produtos" }} />
      <Stack.Screen name="clientes" options={{ title: "Clientes" }} />
      <Stack.Screen name="configuracoes" options={{ title: "Configurações" }} />
    </Stack>
  );
}
