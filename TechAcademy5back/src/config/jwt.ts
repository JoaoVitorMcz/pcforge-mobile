

export interface TokenPayload {
  id_cliente: number;
  email: string;
  /**
   * Espelho de roles.includes("admin"), mantido porque a web e o app mobile
   * leem este campo. Enquanto os dois modelos coexistem, qualquer um dos dois
   * basta para ser admin.
   */
  admin: boolean;
  /**
   * Opcionais de proposito: tokens emitidos antes do RBAC (validade de 1 dia)
   * continuam validos, e authorizeRole cai no fallback derivado de `admin`.
   */
  roles?: string[];
  permissoes?: string[];
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET nao configurado no arquivo de ambiente.");
  }

  return secret;
}
