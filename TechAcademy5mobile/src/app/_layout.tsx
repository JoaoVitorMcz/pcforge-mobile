import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { CarrinhoProvider } from "@/contexts/CarrinhoContext";
import { cores } from "@/theme";

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      {/* O carrinho e por cliente, entao depende da sessao: fica por dentro. */}
      <AuthProvider>
        <CarrinhoProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: cores.superficie },
              headerTintColor: cores.texto,
              contentStyle: { backgroundColor: cores.fundo },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(loja)" options={{ headerShown: false }} />
          </Stack>
        </CarrinhoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
