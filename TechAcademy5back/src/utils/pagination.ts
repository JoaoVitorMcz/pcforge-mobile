import { Request } from "express";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  dados: T[];
  paginacao: {
    paginaAtual: number;
    porPagina: number;
    totalItens: number;
    totalPaginas: number;
  };
}

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

export const getPaginationParams = (req: Request): PaginationParams => {
  const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
  const requestedLimit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

export const buildPaginatedResponse = <T>(
  dados: T[],
  totalItens: number,
  page: number,
  limit: number
): PaginatedResponse<T> => ({
  dados,
  paginacao: {
    paginaAtual: page,
    porPagina: limit,
    totalItens,
    totalPaginas: totalItens === 0 ? 0 : Math.ceil(totalItens / limit),
  },
});