import { Redirect, Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { cores } from "@/theme";

/** Icone textual simples: evita mais uma dependencia so por causa de glifos. */
const Icone = ({ simbolo, cor }: { simbolo: string; cor: ColorValue }) => (
  <Text style={{ color: cor, fontSize: 18 }}>{simbolo}</Text>
);

/**
 * Guarda do painel. Antes a area administrativa era um subconjunto do app e
 * so ela ficava protegida; agora o app inteiro e administrativo, entao a
 * guarda subiu para o layout do grupo e vale para todas as telas.
 *
 * Continuam sendo tres camadas independentes: o login recusa quem nao e admin,
 * este layout redireciona quem chegar por deep link, e a API responde 403 pelo
 * authorizeRole. Nenhuma delas sozinha e a protecao.
 */
export default function LayoutPainel() {
  const { autenticado, carregando, isAdmin } = useAuth();

  if (carregando) return null;
  if (!autenticado || !isAdmin) return <Redirect href="/(auth)/login" />;

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
          title: "Painel",
          tabBarIcon: ({ color }) => <Icone simbolo="◆" cor={color} />,
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: "Produtos",
          headerShown: false,
          tabBarIcon: ({ color }) => <Icone simbolo="▣" cor={color} />,
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          headerShown: false,
          tabBarIcon: ({ color }) => <Icone simbolo="≡" cor={color} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color }) => <Icone simbolo="◉" cor={color} />,
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => <Icone simbolo="⚙" cor={color} />,
        }}
      />
    </Tabs>
  );
}
