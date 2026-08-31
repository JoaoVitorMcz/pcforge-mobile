/**
 * Regras espelhadas de TechAcademy5back/src/utils/cliente.validation.ts.
 * Validar antes de enviar evita ida e volta na rede e devolve a mensagem no
 * campo certo, em vez de um erro generico vindo da API.
 *
 * CPF, CEP e senha forte sairam junto com as telas de cliente: cadastro e
 * endereco acontecem na loja web, nao no painel. As validacoes de produto
 * ficam em components/FormularioProduto.tsx, perto do formulario que as usa.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailValido = (email: string): boolean => EMAIL_REGEX.test(email);
