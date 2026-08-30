import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Botao } from "./Botao";
import { CampoTexto } from "./CampoTexto";
import type { ProdutoFormulario } from "@/services/produtos";
import { cores, espaco, fonte, raio } from "@/theme";
import type { Categoria } from "@/types";

/**
 * Estado do formulario em texto, nao em numero.
 *
 * O TextInput sempre devolve string, e converter a cada tecla impede digitar
 * "12," ou apagar o campo inteiro. A conversao acontece so na validacao.
 */
export interface ValoresProduto {
  nome: string;
  descricao: string;
  valor: string;
  estoque: string;
  id_categoria: number | null;
  imagem: string | null;
  destaque: boolean;
}

type Erros = Partial<Record<"nome" | "valor" | "estoque" | "categoria", string>>;

export const VALORES_INICIAIS: ValoresProduto = {
  nome: "",
  descricao: "",
  valor: "",
  estoque: "0",
  id_categoria: null,
  imagem: null,
  destaque: false,
};

/**
 * Regras de negocio do produto, no mesmo lugar para as telas de criar e editar
 * nao divergirem.
 *
 * Preco zerado ou negativo quebraria o total do pedido, e estoque negativo
 * quebraria a baixa que o backend faz na compra. O backend so exige nome e
 * valor, entao estas barreiras existem para o dado nao nascer torto.
 */
export function validarProduto(valores: ValoresProduto): Erros {
  const erros: Erros = {};
  const valor = Number(valores.valor.replace(",", "."));
  const estoque = Number(valores.estoque);

  if (!valores.nome.trim()) {
    erros.nome = "Informe o nome do produto.";
  }

  if (!valores.valor.trim()) {
    erros.valor = "Informe o preço.";
  } else if (!Number.isFinite(valor)) {
    erros.valor = "Preço inválido.";
  } else if (valor <= 0) {
    erros.valor = "O preço deve ser maior que zero.";
  }

  if (!valores.estoque.trim()) {
    erros.estoque = "Informe o estoque.";
  } else if (!Number.isInteger(estoque)) {
    erros.estoque = "O estoque deve ser um número inteiro.";
  } else if (estoque < 0) {
    erros.estoque = "O estoque não pode ser negativo.";
  }

  if (!valores.id_categoria) {
    erros.categoria = "Escolha uma categoria.";
  }

  return erros;
}

/** Converte o formulario validado no corpo que a API espera. */
export function paraPayload(valores: ValoresProduto): ProdutoFormulario {
  return {
    nome: valores.nome.trim(),
    descricao: valores.descricao.trim() || null,
    valor: Number(valores.valor.replace(",", ".")),
    estoque: Number(valores.estoque),
    id_categoria: valores.id_categoria,
    imagem: valores.imagem,
    destaque: valores.destaque,
  };
}

interface Props {
  valores: ValoresProduto;
  aoMudar: (valores: ValoresProduto) => void;
  categorias: Categoria[];
  erros: Erros;
  aoLimparErro: (campo: keyof Erros) => void;
  rotuloEnvio: string;
  enviando: boolean;
  aoEnviar: () => void;
  seletorDeImagem?: React.ReactNode;
}

export function FormularioProduto({
  valores,
  aoMudar,
  categorias,
  erros,
  aoLimparErro,
  rotuloEnvio,
  enviando,
  aoEnviar,
  seletorDeImagem,
}: Props) {
  const [buscaCategoria, setBuscaCategoria] = useState("");

  const definir = <C extends keyof ValoresProduto>(campo: C, valor: ValoresProduto[C]) => {
    aoMudar({ ...valores, [campo]: valor });
  };

  const categoriasVisiveis = categorias.filter((categoria) =>
    categoria.nome.toLocaleLowerCase("pt-BR").includes(buscaCategoria.toLocaleLowerCase("pt-BR"))
  );

  return (
    <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
      <CampoTexto
        rotulo="Nome"
        value={valores.nome}
        onChangeText={(texto) => {
          definir("nome", texto);
          if (erros.nome) aoLimparErro("nome");
        }}
        erro={erros.nome}
        placeholder="Ex.: GeForce RTX 4070"
      />

      <CampoTexto
        rotulo="Descrição"
        value={valores.descricao}
        onChangeText={(texto) => definir("descricao", texto)}
        placeholder="Opcional"
        multiline
        numberOfLines={3}
        style={estilos.textoLongo}
      />

      <CampoTexto
        rotulo="Preço (R$)"
        value={valores.valor}
        onChangeText={(texto) => {
          definir("valor", texto);
          if (erros.valor) aoLimparErro("valor");
        }}
        erro={erros.valor}
        keyboardType="decimal-pad"
        placeholder="0,00"
      />

      <CampoTexto
        rotulo="Estoque"
        value={valores.estoque}
        onChangeText={(texto) => {
          definir("estoque", texto);
          if (erros.estoque) aoLimparErro("estoque");
        }}
        erro={erros.estoque}
        keyboardType="number-pad"
        placeholder="0"
      />

      <Text style={estilos.rotulo}>Categoria</Text>

      {categorias.length > 6 && (
        <CampoTexto
          rotulo=""
          value={buscaCategoria}
          onChangeText={setBuscaCategoria}
          placeholder="Filtrar categorias"
        />
      )}

      <View style={estilos.categorias}>
        {categoriasVisiveis.map((categoria) => {
          const escolhida = valores.id_categoria === categoria.id_categoria;

          return (
            <TouchableOpacity
              key={categoria.id_categoria}
              accessibilityRole="button"
              accessibilityState={{ selected: escolhida }}
              style={[estilos.chip, escolhida && estilos.chipEscolhido]}
              onPress={() => {
                definir("id_categoria", categoria.id_categoria);
                if (erros.categoria) aoLimparErro("categoria");
              }}
            >
              <Text style={[estilos.chipTexto, escolhida && estilos.chipTextoEscolhido]}>
                {categoria.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!erros.categoria && <Text style={estilos.erro}>{erros.categoria}</Text>}

      <View style={estilos.linhaDestaque}>
        <View style={estilos.destaqueTexto}>
          <Text style={estilos.rotulo}>Destaque</Text>
          <Text style={estilos.ajuda}>Aparece na vitrine da loja web</Text>
        </View>
        <Switch
          value={valores.destaque}
          onValueChange={(ligado) => definir("destaque", ligado)}
          trackColor={{ false: cores.borda, true: cores.primaria }}
          accessibilityLabel="Marcar como destaque"
        />
      </View>

      {seletorDeImagem}

      <View style={estilos.acao}>
        <Botao titulo={rotuloEnvio} aoPressionar={aoEnviar} carregando={enviando} />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.md,
    paddingBottom: espaco.xl,
  },
  textoLongo: {
    height: 96,
    textAlignVertical: "top",
    paddingTop: espaco.sm,
  },
  rotulo: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
    marginBottom: espaco.xs,
  },
  ajuda: {
    color: cores.textoFraco,
    fontSize: 11,
  },
  categorias: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: espaco.sm,
    marginBottom: espaco.md,
  },
  chip: {
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.sm,
    backgroundColor: cores.superficie,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  chipEscolhido: {
    borderColor: cores.primaria,
    backgroundColor: cores.superficieClara,
  },
  chipTexto: {
    color: cores.textoFraco,
    fontSize: fonte.pequena,
  },
  chipTextoEscolhido: {
    color: cores.primaria,
    fontWeight: "700",
  },
  erro: {
    color: cores.perigo,
    fontSize: fonte.pequena,
    marginBottom: espaco.md,
  },
  linhaDestaque: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raio.md,
    padding: espaco.md,
    marginBottom: espaco.md,
  },
  destaqueTexto: {
    flex: 1,
  },
  acao: {
    marginTop: espaco.md,
  },
});
