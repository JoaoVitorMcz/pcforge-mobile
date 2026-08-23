/**
 * Regras espelhadas de TechAcademy5back/src/utils/cliente.validation.ts.
 * Validar antes de enviar evita ida e volta na rede e devolve a mensagem no
 * campo certo, em vez de um erro generico vindo da API.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_FORTE_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const apenasDigitos = (valor: string): string => valor.replace(/\D/g, "");

export const emailValido = (email: string): boolean => EMAIL_REGEX.test(email);

export const cpfValido = (cpf: string): boolean => apenasDigitos(cpf).length === 11;

export const senhaForte = (senha: string): boolean => SENHA_FORTE_REGEX.test(senha);

/** Formata progressivamente enquanto o usuario digita: 000.000.000-00 */
export function formatarCpf(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);

  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Formata progressivamente: 00000-000 */
export function formatarCep(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}
