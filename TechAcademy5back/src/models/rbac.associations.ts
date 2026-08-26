import Cliente from "./Cliente";
import Role from "./Role";
import Permissao from "./Permissao";
import ClienteRole from "./ClienteRole";
import RolePermissao from "./RolePermissao";

/**
 * As duas relacoes N:N do RBAC classico, num modulo separado de proposito.
 *
 * Os demais models declaram as associacoes no proprio arquivo, mas aqui isso
 * nao funciona: belongsToMany exige que as duas pontas sejam Model de verdade,
 * e as suites que fazem jest.mock("../models/Cliente") passam um mock. Deixando
 * as associacoes fora de Role.ts, importar o model continua barato e so quem
 * realmente fala com o banco (index.ts e o seed) carrega o grafo.
 */
Cliente.belongsToMany(Role, {
  through: ClienteRole,
  foreignKey: "id_cliente",
  otherKey: "id_role",
  as: "roles",
});
Role.belongsToMany(Cliente, {
  through: ClienteRole,
  foreignKey: "id_role",
  otherKey: "id_cliente",
  as: "clientes",
});

Role.belongsToMany(Permissao, {
  through: RolePermissao,
  foreignKey: "id_role",
  otherKey: "id_permissao",
  as: "permissoes",
});
Permissao.belongsToMany(Role, {
  through: RolePermissao,
  foreignKey: "id_permissao",
  otherKey: "id_role",
  as: "roles",
});
