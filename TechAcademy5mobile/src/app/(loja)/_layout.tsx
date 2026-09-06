import { Redirect, Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { AcoesCabecalho, MarcaLoja } from "@/components/CabecalhoLoja";
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
        headerStyle: { backgroundColor: "#070b14", height: 72 },
        headerTintColor: cores.texto,
        headerTitle: () => <MarcaLoja />,
        headerTitleAlign: "left",
        headerRight: () => <AcoesCabecalho />,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoFraco,
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Icone simbolo="▤" cor={color} />,
        }}
      />
      <Tabs.Screen
        name="pecas"
        options={{
          title: "Peças",
          tabBarIcon: ({ color }) => <Icone simbolo="▦" cor={color} />,
        }}
      />
      <Tabs.Screen name="perifericos" options={{ title: "Periféricos", tabBarIcon: ({ color }) => <Icone simbolo="◉" cor={color} /> }} />
      <Tabs.Screen name="suporte" options={{ title: "Suporte", tabBarIcon: ({ color }) => <Icone simbolo="?" cor={color} /> }} />
      {/*
        "Meus pedidos" fica fora da barra: com catalogo, carrinho, enderecos,
        perfil e admin ja sao cinco abas. Chega-se por ele pelo perfil e pela
        confirmacao do checkout.
      */}
      <Tabs.Screen name="pedidos" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="carrinho" options={{ href: null, headerShown: false }} />
      <Tabs.Screen
        name="enderecos"
        options={{
          title: "Endereços",
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          href: null,
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
