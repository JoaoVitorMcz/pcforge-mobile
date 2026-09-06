import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useCarrinho } from "@/contexts/CarrinhoContext";
import { cores, espaco, fonte } from "@/theme";

export function MarcaLoja() {
  return (
    <View style={estilos.marca}>
      <Text style={estilos.marcaPrincipal}>PC</Text>
      <Text style={estilos.marcaSecundaria}>FORGE</Text>
    </View>
  );
}

export function AcoesCabecalho() {
  const router = useRouter();
  const { cliente } = useAuth();
  const { quantidadeTotal } = useCarrinho();
  const primeiroNome = cliente?.nome?.split(" ")[0] ?? "cliente";

  return (
    <View style={estilos.acoes}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
        style={estilos.usuario}
        onPress={() => router.push("/(loja)/perfil")}
      >
        <Ionicons name="person-circle-outline" size={22} color={cores.primaria} />
        <Text style={estilos.saudacao} numberOfLines={1}>
          Olá, {primeiroNome}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Abrir carrinho${quantidadeTotal > 0 ? ` com ${quantidadeTotal} itens` : ""}`}
        style={estilos.carrinho}
        onPress={() => router.push("/(loja)/carrinho")}
      >
        <Ionicons name="cart-outline" size={22} color={cores.primaria} />
        {quantidadeTotal > 0 && (
          <View style={estilos.badge}>
            <Text style={estilos.badgeTexto}>{quantidadeTotal}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  marca: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  marcaPrincipal: {
    color: cores.primaria,
    fontSize: fonte.titulo,
    fontWeight: "900",
    letterSpacing: 1,
  },
  marcaSecundaria: {
    color: cores.texto,
    fontSize: fonte.pequena,
    fontWeight: "700",
    letterSpacing: 2,
  },
  acoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.sm,
    marginRight: espaco.sm,
  },
  usuario: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 130,
    gap: 4,
  },
  saudacao: {
    color: cores.texto,
    fontSize: 12,
    fontWeight: "600",
  },
  carrinho: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: cores.primaria,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -6,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: cores.primaria,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTexto: {
    color: cores.fundo,
    fontSize: 10,
    fontWeight: "800",
  },
});
