/**
 * O preset jest-expo ja traz os transforms do Metro e os mocks dos modulos
 * nativos do Expo, entao a suite roda sem emulador nem aparelho.
 *
 * moduleNameMapper espelha o alias "@/*" do tsconfig.json: o TypeScript
 * resolve esse caminho na compilacao, mas o Jest resolve em tempo de execucao
 * e nao le o tsconfig sozinho.
 */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts?(x)"],
};
