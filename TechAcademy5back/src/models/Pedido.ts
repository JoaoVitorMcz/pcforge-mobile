import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Cliente from "./Cliente";
import Endereco from "./Endereco";
import ItemPedido from "./Itempedido";



interface PedidoAttributes {
  id_pedido: number;
  id_cliente: number;
  id_endereco_entrega: number;
  data_pedido?: Date;
  metodo?: string | null;
  valor?: number | null;
  status?: string | null;
  data_pagamento?: Date | null;
}

interface PedidoCreationAttributes extends Optional<PedidoAttributes, "id_pedido"> {}


class Pedido
  extends Model<PedidoAttributes, PedidoCreationAttributes>
  implements PedidoAttributes
{
  public id_pedido!: number;
  public id_cliente!: number;
  public id_endereco_entrega!: number;
  public data_pedido!: Date;
  public metodo!: string | null;
  public valor!: number | null;
  public status!: string | null;
  public data_pagamento!: Date | null;
}



Pedido.init(
  {
    id_pedido: {
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
    id_endereco_entrega: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "endereco",
        key: "id_endereco",
      },
    },
    data_pedido: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    metodo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "pendente",
    },
    data_pagamento: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "pedido",
    timestamps: false,
  }
);



Pedido.belongsTo(Cliente, { foreignKey: "id_cliente", as: "cliente" });
Cliente.hasMany(Pedido, { foreignKey: "id_cliente", as: "pedidos" });

Pedido.belongsTo(Endereco, { foreignKey: "id_endereco_entrega", as: "endereco_entrega" });

Pedido.hasMany(ItemPedido, { foreignKey: "id_pedido", as: "itens" });
ItemPedido.belongsTo(Pedido, { foreignKey: "id_pedido", as: "pedido" });

export default Pedido;