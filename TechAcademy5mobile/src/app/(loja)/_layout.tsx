import { Redirect, Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { cores } from "@/theme";

/** Icone textual simples: evita mais uma dependencia so por causa de glifos. */
const Icone = ({ simbolo, cor }: { simbolo: string; cor: ColorValue }) => (
  <Text style={{ color: cor, fontSize: 18 }}>{simbolo}</Text>
);

export default function LayoutLoja() {
  const { autenticado, carregando, isAdmin } = useAuth();

  if (carregando) return null;
  if (!autenticado) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTintColor: cores.texto,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoFraco,
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Catálogo",
          tabBarIcon: ({ color }) => <Icone simbolo="▤" cor={color} />,
        }}
      />
      <Tabs.Screen
        name="enderecos"
        options={{
          title: "Endereços",
          headerShown: false,
          tabBarIcon: ({ color }) => <Icone simbolo="⌂" cor={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Icone simbolo="☺" cor={color} />,
        }}
      />
      {/*
        A aba de administracao some para o cliente comum. Esconder nao e a
        protecao de verdade: (admin)/_layout.tsx redireciona quem nao e admin,
        e a API responde 403 de qualquer forma.
      */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? "/(loja)/admin" : null,
          tabBarIcon: ({ color }) => <Icone simbolo="◆" cor={color} />,
        }}
      />
    </Tabs>
  );
}
