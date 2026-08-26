import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";


/**
 * Tabela de juncao entre cliente e role (USER_ROLE no modelo RBAC classico).
 *
 * A chave primaria e composta pelas duas colunas: um cliente nao pode receber
 * o mesmo papel duas vezes, e a restricao vive no banco, nao so no seed.
 */
interface ClienteRoleAttributes {
  id_cliente: number;
  id_role: number;
}


class ClienteRole extends Model<ClienteRoleAttributes> implements ClienteRoleAttributes {
  public id_cliente!: number;
  public id_role!: number;
}


ClienteRole.init(
  {
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "cliente",
        key: "id_cliente",
      },
    },
    id_role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "role",
        key: "id_role",
      },
    },
  },
  {
    sequelize,
    tableName: "cliente_role",
    timestamps: false,
  }
);

export default ClienteRole;
