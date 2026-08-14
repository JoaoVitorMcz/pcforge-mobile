

export interface TokenPayload {
  id_cliente: number;
  email: string;
  admin: boolean;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET nao configurado no arquivo de ambiente.");
  }

  return secret;
}
