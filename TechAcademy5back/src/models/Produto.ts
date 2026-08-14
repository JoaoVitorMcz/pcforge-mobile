import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Categoria from "./Categoria";

interface ProdutoAttributes {
  id_produto: number;
  nome: string;
  descricao?: string | null;
  valor: number;
  ativo: boolean;
  id_categoria?: number | null;
  imagem?: string | null;
  destaque: boolean;
  estoque: number;
}

interface ProdutoCreationAttributes
  extends Optional<ProdutoAttributes, "id_produto"> {}

class Produto
  extends Model<ProdutoAttributes, ProdutoCreationAttributes>
  implements ProdutoAttributes
{
  public id_produto!: number;
  public nome!: string;
  public descricao!: string | null;
  public valor!: number;
  public ativo!: boolean;
  public id_categoria!: number | null;
  public imagem!: string | null;
  public destaque!: boolean;
  public estoque!: number;
}

Produto.init(
  {
    id_produto: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    id_categoria: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    imagem: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    destaque: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    estoque: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "produto",
    timestamps: false,
  }
);


Produto.belongsTo(Categoria, {
  foreignKey: "id_categoria",
  as: "categoria",
});

export default Produto;
