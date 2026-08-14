const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CPF_REGEX = /^\d{11}$/;
const SENHA_FORTE_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const sanitizeCpf = (cpf: string): string => cpf.replace(/\D/g, "");

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

export const isValidCpf = (cpf: string): boolean => CPF_REGEX.test(sanitizeCpf(cpf));

export const isStrongPassword = (senha: string): boolean => SENHA_FORTE_REGEX.test(senha);
