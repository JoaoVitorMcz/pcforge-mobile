import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface CategoriaAttributes {
  id_categoria: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

interface CategoriaCreationAttributes
  extends Optional<CategoriaAttributes, "id_categoria"> {}

class Categoria
  extends Model<CategoriaAttributes, CategoriaCreationAttributes>
  implements CategoriaAttributes
{
  public id_categoria!: number;
  public nome!: string;
  public descricao?: string;
  public ativo!: boolean;
}

Categoria.init(
  {
    id_categoria: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descricao: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "categoria",
    timestamps: false,
  }
);

export default Categoria;