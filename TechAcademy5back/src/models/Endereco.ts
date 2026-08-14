import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Cliente from "./Cliente";


interface EnderecoAttributes {
  id_endereco: number;
  id_cliente: number;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}

interface EnderecoCreationAttributes extends Optional<EnderecoAttributes, "id_endereco"> {}


class Endereco
  extends Model<EnderecoAttributes, EnderecoCreationAttributes>
  implements EnderecoAttributes
{
  public id_endereco!: number;
  public id_cliente!: number;
  public numero!: string | null;
  public complemento!: string | null;
  public bairro!: string | null;
  public cidade!: string | null;
  public estado!: string | null;
  public cep!: string | null;
}


Endereco.init(
  {
    id_endereco: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_cliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cliente",
        key: "id_cliente",
      },
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    complemento: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    bairro: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    cep: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "endereco",
    timestamps: false,
  }
);


Endereco.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });
Cliente.hasMany(Endereco, { foreignKey: "id_cliente", as: "enderecos" });

export default Endereco;