import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { EstadoLista } from "@/components/EstadoLista";
import { useAuth } from "@/contexts/AuthContext";
import { listarClientes } from "@/services/clientes";
import { cores, espaco, fonte, raio } from "@/theme";
import type { Cliente } from "@/types";

function ClienteLinha({ cliente }: { cliente: Cliente }) {
  const inativo = cliente.ativo === false;

  return (
    <View style={estilos.item}>
      <View style={estilos.avatar}>
        <Text style={estilos.avatarTexto}>{cliente.nome.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={estilos.info}>
        <Text style={estilos.nome}>{cliente.nome}</Text>
        <Text style={estilos.email} numberOfLines={1}>
          {cliente.email}
        </Text>
      </View>

      <View style={[estilos.status, inativo && estilos.inativo]}>
        <Text style={[estilos.statusTexto, inativo && estilos.statusTextoInativo]}>
          {inativo ? "Inativo" : "Ativo"}
        </Text>
      </View>
    </View>
  );
}

/**
 * Lista de clientes do admin. GET /clientes e protegido por
 * authorizeRole(["admin"]) no backend, entao esta tela so carrega para quem
 * tem o papel: o token do cliente comum recebe 403.
 */
export default function ClientesAdmin() {
  const { token } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;

    try {
      setClientes(await listarClientes(token));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const filtrados = useMemo(
    () =>
      clientes.filter((cliente) =>
        `${cliente.nome} ${cliente.email}`
          .toLocaleLowerCase("pt-BR")
          .includes(busca.toLocaleLowerCase("pt-BR"))
      ),
    [busca, clientes]
  );

  if (carregando || erro) {
    return <EstadoLista carregando={carregando} erro={erro} aoTentarNovamente={carregar} />;
  }

  return (
    <FlatList
      data={filtrados}
      keyExtractor={(item) => String(item.id_cliente)}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={
        <>
          <Text style={estilos.contagem}>{clientes.length} clientes cadastrados</Text>

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar nome ou e-mail"
            placeholderTextColor={cores.textoFraco}
            style={estilos.busca}
            accessibilityLabel="Buscar cliente"
          />
        </>
      }
      ListEmptyComponent={<EstadoLista vazio mensagemVazio="Nenhum cliente encontrado." />}
      renderItem={({ item }) => <ClienteLinha cliente={item} />}
      refreshControl={
        <RefreshControl
          refreshing={atualizando}
          onRefresh={() => {
            setAtualizando(true);
            void carregar();
          }}
          tintColor={cores.primaria}
        />
      }
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    padding: espaco.md,
    flexGrow: 1,
  },
  contagem: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginBottom: espaco.sm,
  },
  busca: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    color: cores.texto,
    fontSize: fonte.corpo,
    paddingHorizontal: espaco.md,
    height: 48,
    marginBottom: espaco.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espaco.md,
    marginBottom: espaco.sm,
    gap: espaco.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.superficieClara,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: {
    color: cores.primaria,
    fontWeight: "700",
    fontSize: fonte.corpo,
  },
  info: {
    flex: 1,
  },
  nome: {
    color: cores.texto,
    fontSize: fonte.corpo,
    fontWeight: "600",
  },
  email: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginTop: 2,
  },
  status: {
    backgroundColor: "#153d35",
    borderRadius: raio.sm,
    paddingHorizontal: espaco.sm,
    paddingVertical: 4,
  },
  inativo: {
    backgroundColor: "#3b2630",
  },
  statusTexto: {
    color: cores.sucesso,
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextoInativo: {
    color: cores.perigo,
  },
});
