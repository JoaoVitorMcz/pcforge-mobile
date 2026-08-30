/**
 * Tokens visuais do app. Centralizados para que as telas nunca escrevam cor ou
 * espacamento cru, mantendo a identidade alinhada com o front web (PC Forge).
 */
export const cores = {
  fundo: "#0d1526",
  superficie: "#152238",
  superficieClara: "#1d2d4a",
  borda: "#25384f",
  texto: "#e8eef7",
  textoFraco: "#8fa3bd",
  primaria: "#00d4ff",
  primariaEscura: "#0097b5",
  perigo: "#ff4d6d",
  sucesso: "#3ddc97",
  alerta: "#ffc107",
} as const;

export const espaco = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const raio = {
  sm: 6,
  md: 12,
  lg: 20,
} as const;

export const fonte = {
  pequena: 13,
  corpo: 15,
  titulo: 20,
  destaque: 28,
} as const;

/** Formata um numero como moeda brasileira. */
export const formatarPreco = (valor: number): string =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
