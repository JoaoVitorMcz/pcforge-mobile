import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";


interface PermissaoAttributes {
  id_permissao: number;
  nome: string;
  recurso: string;
  acao: string;
  descricao?: string | null;
}

interface PermissaoCreationAttributes extends Optional<PermissaoAttributes, "id_permissao"> {}


class Permissao
  extends Model<PermissaoAttributes, PermissaoCreationAttributes>
  implements PermissaoAttributes
{
  public id_permissao!: number;
  public nome!: string;
  public recurso!: string;
  public acao!: string;
  public descricao!: string | null;
}


Permissao.init(
  {
    id_permissao: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Identificador legivel no formato "recurso:acao", ex.: "produto:criar".
    // E o valor que viaja no token e que authorizePermission compara.
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    recurso: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    acao: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "permissao",
    timestamps: false,
  }
);

export default Permissao;
