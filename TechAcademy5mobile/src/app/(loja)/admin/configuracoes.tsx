import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/services/config";
import { cores, espaco, fonte, raio } from "@/theme";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) { return <View style={estilos.linha}><Text style={estilos.rotulo}>{rotulo}</Text><Text style={estilos.valor} numberOfLines={1}>{valor}</Text></View>; }
export default function ConfiguracoesAdmin() { const { cliente } = useAuth(); return <View style={estilos.conteudo}><Text style={estilos.intro}>Dados da administração</Text><View style={estilos.painel}><Linha rotulo="Administrador" valor={cliente?.nome ?? "—"} /><Linha rotulo="E-mail" valor={cliente?.email ?? "—"} /><Linha rotulo="Permissão" valor="Administrador" /></View><Text style={estilos.intro}>Conexão</Text><View style={estilos.painel}><Linha rotulo="API" valor={API_BASE_URL} /><Linha rotulo="Aplicativo" valor="PC Forge Mobile" /></View></View>; }
const estilos = StyleSheet.create({ conteudo: { padding: espaco.md }, intro: { color: cores.textoFraco, fontSize: fonte.pequena, marginBottom: espaco.sm, marginTop: espaco.md }, painel: { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1, borderRadius: raio.md, paddingHorizontal: espaco.md }, linha: { paddingVertical: 14, borderBottomColor: cores.borda, borderBottomWidth: 1 }, rotulo: { color: cores.textoFraco, fontSize: fonte.pequena, marginBottom: 3 }, valor: { color: cores.texto, fontSize: fonte.corpo, fontWeight: "600" } });
