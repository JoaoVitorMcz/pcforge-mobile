import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";


interface ClienteAttributes {
  id_cliente: number;
  nome: string;
  email: string;
  senha: string;
  telefone?: string | null;
  cpf?: string | null;
  ativo: boolean;
  admin: boolean;
}


interface ClienteCreationAttributes extends Optional<ClienteAttributes, "id_cliente"> {}

class Cliente
  extends Model<ClienteAttributes, ClienteCreationAttributes>
  implements ClienteAttributes
{
  public id_cliente!: number;
  public nome!: string;
  public email!: string;
  public senha!: string;
  public telefone!: string | null;
  public cpf!: string | null;
  public ativo!: boolean;
  public admin!: boolean;
}



Cliente.init(
  {
    id_cliente: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    cpf: {
      type: DataTypes.STRING(14),
      allowNull: false,
      unique: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "cliente",
    timestamps: false, 
  }
);

export default Cliente;
