/**
 * Controlar pedidos
 * gestion de pedidos
 * requiere autenticacion
 */
//Importar modelos

const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * Crear pedido desde el carrito (checkout)
 * POST /api/cliente/pedidos
 */

const crearPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;

        //validacion 1 Direccion requerida
        if (!direccionEnvio || direccionEnvio.trim() ==='') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'La direccion de envio es requerida',
            })
        }
        //Validacion 2 telefono requerido
        if (!telefono || telefono.trim() ==='') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El telefono es requerido',
            })
        }
        //Validacion 3 metodoPago requerido
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
        if (!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `metodo de pago invalido, opciones: ${metodosValidos.join(', ')}`
            });
        }

        //obtener items del carrito

        const carritoItems = await Carrito.findAll({
            where: { usuarioId: req.user.usuarioId },
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'activo']
            }],
            transaction: t
        });

        if (itemsCarrito.length === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El carrito esta vacio'
            })
        }
    }
} 