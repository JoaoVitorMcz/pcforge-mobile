import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";


/**
 * Tabela de juncao entre role e permissao (ROLE_PERM no modelo RBAC classico).
 *
 * Chave primaria composta pelo mesmo motivo de cliente_role: impede que a
 * mesma permissao seja concedida duas vezes ao mesmo papel.
 */
interface RolePermissaoAttributes {
  id_role: number;
  id_permissao: number;
}


class RolePermissao extends Model<RolePermissaoAttributes> implements RolePermissaoAttributes {
  public id_role!: number;
  public id_permissao!: number;
}


RolePermissao.init(
  {
    id_role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "role",
        key: "id_role",
      },
    },
    id_permissao: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "permissao",
        key: "id_permissao",
      },
    },
  },
  {
    sequelize,
    tableName: "role_permissao",
    timestamps: false,
  }
);

export default RolePermissao;
