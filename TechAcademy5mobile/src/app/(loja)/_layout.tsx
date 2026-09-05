import { Redirect, Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useCarrinho } from "@/contexts/CarrinhoContext";
import { cores } from "@/theme";

/** Icone textual simples: evita mais uma dependencia so por causa de glifos. */
const Icone = ({ simbolo, cor }: { simbolo: string; cor: ColorValue }) => (
  <Text style={{ color: cor, fontSize: 18 }}>{simbolo}</Text>
);

export default function LayoutLoja() {
  const { autenticado, carregando, isAdmin } = useAuth();
  const { quantidadeTotal } = useCarrinho();

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
        name="carrinho"
        options={{
          title: "Carrinho",
          // O badge some quando zerado: undefined, nao 0, senao o Tabs
          // desenha um circulo com "0" dentro.
          tabBarBadge: quantidadeTotal > 0 ? quantidadeTotal : undefined,
          tabBarBadgeStyle: { backgroundColor: cores.primaria },
          tabBarIcon: ({ color }) => <Icone simbolo="◫" cor={color} />,
        }}
      />
      {/*
        "Meus pedidos" fica fora da barra: com catalogo, carrinho, enderecos,
        perfil e admin ja sao cinco abas. Chega-se por ele pelo perfil e pela
        confirmacao do checkout.
      */}
      <Tabs.Screen name="pedidos" options={{ href: null, headerShown: false }} />
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
