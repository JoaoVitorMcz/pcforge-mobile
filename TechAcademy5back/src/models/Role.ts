import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Permissao from "./Permissao";


interface RoleAttributes {
  id_role: number;
  nome: string;
  descricao?: string | null;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, "id_role"> {}


class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id_role!: number;
  public nome!: string;
  public descricao!: string | null;

  // Preenchido quando a consulta usa include: { model: Permissao, as: "permissoes" }
  public readonly permissoes?: Permissao[];
}


Role.init(
  {
    id_role: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // E o valor que viaja no token e que authorizeRole compara: "admin", "cliente".
    nome: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    descricao: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "role",
    timestamps: false,
  }
);

export default Role;
