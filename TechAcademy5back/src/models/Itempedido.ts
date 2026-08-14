import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import Produto from "./Produto";


interface ItemPedidoAttributes {
  id_item: number;
  id_pedido: number;
  id_produto: number;
  quantidade: number;
  preco_unitario: number;
}

interface ItemPedidoCreationAttributes extends Optional<ItemPedidoAttributes, "id_item"> {}


class ItemPedido
  extends Model<ItemPedidoAttributes, ItemPedidoCreationAttributes>
  implements ItemPedidoAttributes
{
  public id_item!: number;
  public id_pedido!: number;
  public id_produto!: number;
  public quantidade!: number;
  public preco_unitario!: number;
}


ItemPedido.init(
  {
    id_item: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "pedido",
        key: "id_pedido",
      },
    },
    id_produto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "produto",
        key: "id_produto",
      },
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    tableName: "item_pedido",
    timestamps: false,
  }
);


ItemPedido.belongsTo(Produto, { foreignKey: "id_produto", as: "produto" });
Produto.hasMany(ItemPedido, { foreignKey: "id_produto", as: "itens_pedido" });

export default ItemPedido;