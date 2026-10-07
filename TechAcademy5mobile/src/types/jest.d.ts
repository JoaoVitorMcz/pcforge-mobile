/**
 * Globais do Jest (describe, it, expect, jest) para o typecheck.
 *
 * Uma referencia de tipo, e nao "types": ["jest"] no tsconfig: aquela opcao
 * desliga a inclusao automatica dos outros @types, e o projeto depende dos
 * globais do Node (process.env em services/config.ts e services/suporte.ts).
 */
/// <reference types="jest" />
