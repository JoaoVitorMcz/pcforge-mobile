export interface DadosCep {
  bairro: string;
  cidade: string;
  estado: string;
}

/** Consulta o endereco nacional e retorna apenas os campos usados pelo app. */
export async function buscarCep(cep: string, signal?: AbortSignal): Promise<DadosCep> {
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });

  if (!resposta.ok) {
    throw new Error("Não foi possível consultar o CEP agora.");
  }

  const dados: {
    erro?: boolean;
    bairro?: string;
    localidade?: string;
    uf?: string;
  } = await resposta.json();

  if (dados.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    bairro: dados.bairro ?? "",
    cidade: dados.localidade ?? "",
    estado: dados.uf ?? "",
  };
}
