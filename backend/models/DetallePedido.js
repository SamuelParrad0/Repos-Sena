/**
 * MODELO DETALLE PEDIDO
 *Define la tabla Detalle pedido en la base de datos 
 *Almacena los productos incluidos en caada pedido
 *relacion muchos a muchos entre pedido y producto
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

 //Importar instancia de sequelize
 const { sequelize } = require('../config/database');
const { subtle } = require('node:crypto');


 /**
  * Definir el modelo detalle de pedido
  */
 const DetallePedido = sequelize.define('DetallePedido', {
    //Campos de la tabla
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // pedidoId ID del pedido al que pertenece este detalle
    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Pedidos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', //si se elimina el pedido eliminar detalles
        validate: {
            notNull: {
                msg:'Debe especificar un pedido'
            }
        }
    },

     // ProductoId ID del producto incluido en el producto
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', //no se puede eliminar producto con pedidos
        validate: {
            notNull: {
                msg:'Debe especificar un producto'
            }
        }
    },

    // Cantidad de este producto en el pedido
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },

    /**
     * Precio Unitario precio del producto al momento del pedido
     * Se guarda para mantener el historial aunque el producto cambie de precio
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }

    },
    /**
     * Subtotal total de este item (precio + cantidad)
     * Se calcula automaticamente antes de guardar
     */
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allwNull: false,
        validate: {
            isDecimal: {
                msg:'El subtotal debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg:'El subtotal no puede ser negativo'
            }
        }
    }
}, {
    //Opciones del modelo

    tableName: 'detalle_pedidos',
    timestamps: false, //no necesita createAt/updateAt

    //Indices para mejorar las busquedas
    indexes: [
        {
            //  Indice para buscar detalles por pedido
            fields: ['pedidoId']
        },
        {
            //  Indice para buscar detalles por producto
            fields: ['productoId']
        },
    ],

/**
     * Hooks acciones automaticas
     */

    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un detalle de pedido
         * calcula el subtotal automaticamente
         */
        beforeCreate: (detalle) => {
            //calcular subtotal precio * cantidad
            detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
        },
        /**
         * beforeUpdate: se ejecuta antes de actualizar detalle de pedido
         * recalcula el subtotal si cambia precio o cantidad
         */
        beforeUpdate: (detalle) => {
             if (detalle.changed('precioUnitario') || detalle.changed('cantidad')) {
                detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
                
            }
        }
    }
 });

 //METODOS DE INSTANCIA 
 /**
  * Metodo para calcular el subtotal
  * 
  * @returns {number} - Subtotal calculado)
  */
 DetallePedido.prototype.calcularSubtotal = function () {
    return parseFloat(this.precioUnitario) * this.cantidad;
 };

 /**
  * Metodo para crear detalles del pedido desde el carrito
  * convierte los items del  carrito en detalles de pedido
  * @param {number} pedidoId - id del pedido
  * @param {Array} itemsCarrito - items del carrito 
  * @returns {Promise<Array>} Detalles del pedido creados *
  */
 DetallePedido.crearDesdeCarrito = async function (pedidoId, itemsCarrito) {
    const detalles = [];

    for (const item of itemsCarrito) {
        const detalle = await this.create({
            pedidoId: pedidoId,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
        });
        detalles.push(detalle);
    }
    return detalles;
};
 
 /**
  * Metodo para calcular el total de un pedido desde sus detalles
  * @param {number} pedidoId - id del pedido
  * @return {Promise<number>} - Total calculado
  */
 DetallePedido.calcularTotalPedido = async function (pedidoId) {
    const detalles = await this.findAll({
        where: {pedidoId}
    });

    let total =0;
    for (const detalle of datalles) {
        total += parseFloat(detalle.subtotal);
    }

    return total;
 };

 /**
  * Metodo para obtener resumen de productos mas vendidos
  * @param {number} limite numero de productos a retornar
  * @returns {Promise<Array>} productos mas vendidos
  */
 DetallePedido.obtenerMasVendidos= async function (limite = 10) {
    const { sequelize } = require('../config/database');
    
    return await this.findAll({
        attributes: [
            'productoId',
            [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendido']
        ],
        group: ['productoId'],
        order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
        limit: limite
    });
};

 //Exportar modelo
 module.exports =  DetallePedido;
