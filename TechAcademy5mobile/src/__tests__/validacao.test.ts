import {
  apenasDigitos,
  cpfValido,
  emailValido,
  formatarCep,
  formatarCpf,
  senhaForte,
} from "@/validacao";

/**
 * As regras de validacao.ts espelham TechAcademy5back/src/utils/cliente.validation.ts.
 * O teste fixa o comportamento dos dois lados: se a regra do backend mudar e a
 * daqui nao, o cadastro passa na tela e volta 400 da API.
 */
describe("validacao de formulario", () => {
  describe("emailValido", () => {
    it("aceita e-mail com dominio", () => {
      expect(emailValido("cliente@pcforge.com")).toBe(true);
    });

    it.each(["sem-arroba.com", "sem@dominio", "com espaco@pcforge.com", ""])(
      "recusa %p",
      (entrada) => {
        expect(emailValido(entrada)).toBe(false);
      }
    );
  });

  describe("senhaForte", () => {
    it("aceita a senha do seed, que tem maiuscula, minuscula, numero e 8 caracteres", () => {
      expect(senhaForte("Senha@123")).toBe(true);
    });

    it.each([
      ["curta demais", "Senha1"],
      ["sem maiuscula", "senha123"],
      ["sem minuscula", "SENHA123"],
      ["sem numero", "SenhaSenha"],
    ])("recusa senha %s", (_caso, senha) => {
      expect(senhaForte(senha)).toBe(false);
    });
  });

  describe("cpfValido", () => {
    it("aceita 11 digitos, com ou sem mascara", () => {
      expect(cpfValido("123.456.789-09")).toBe(true);
      expect(cpfValido("12345678909")).toBe(true);
    });

    it("recusa quantidade diferente de 11 digitos", () => {
      expect(cpfValido("123456789")).toBe(false);
    });
  });

  describe("formatacao progressiva", () => {
    it("formata o CPF conforme o usuario digita", () => {
      expect(formatarCpf("123")).toBe("123");
      expect(formatarCpf("123456")).toBe("123.456");
      expect(formatarCpf("123456789")).toBe("123.456.789");
      expect(formatarCpf("12345678909")).toBe("123.456.789-09");
    });

    it("descarta digito que passa do tamanho do CPF", () => {
      expect(formatarCpf("1234567890999")).toBe("123.456.789-09");
    });

    it("formata o CEP e ignora o que nao e digito", () => {
      expect(formatarCep("01001")).toBe("01001");
      expect(formatarCep("01001000")).toBe("01001-000");
      expect(formatarCep("abc01001000xyz")).toBe("01001-000");
    });
  });

  it("apenasDigitos remove mascara", () => {
    expect(apenasDigitos("(11) 98765-4321")).toBe("11987654321");
  });
});
