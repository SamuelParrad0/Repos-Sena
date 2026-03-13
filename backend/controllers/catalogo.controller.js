/**
 * Controlador de catalogo
 * permite ver los productos sin inciair sesion
 * solo accesible por administradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * Obtener todos los productos al publico
 * Get /api/catalogo/productos
 * query params:
 * categoriaID => filtrar por categoria
 * subcategoriaID => filtrar por subcategoria 
 * preciomin, preciomax, rengo de precios hombre reciente
 * @param {object} req - request express
 * @param {object} res - response express
 * solo muestra los productos activos y con stock
 */


const getProductos = async (req, res) => {
    try {
        const {
            categoriaId,
            subcategoriaId,
            buscar,
            precioMin,
            precioMax,
            orden = 'reciente',
            pagina = 1,
            limite = 12
        } = req.query;

        const { Op } = require('sequelize');

        // filtros base: solo productos activos y con stock
        const where = {
            activo: true,
            stock: { [Op.gt]: 0 }
        };

        // filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;

        // búsqueda de texto
        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${buscar}%` } },
                { descripcion: { [Op.like]: `%${buscar}%` } }
            ];
        }

        // rango de precios
        if (precioMin || precioMax) {
            where.precio = {};
            if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
            if (precioMax) where.precio[Op.lte] = parseFloat(precioMax);
        }

        // ordenamiento
        let orderOption = [['createdAt', 'DESC']];
        switch (orden) {
            case 'precio_asc':
                orderOption = [['precio', 'ASC']];
                break;
            case 'precio_desc':
                orderOption = [['precio', 'DESC']];
                break;
            case 'nombre':
                orderOption = [['nombre', 'ASC']];
                break;
            case 'reciente':
            default:
                orderOption = [['createdAt', 'DESC']];
                break;
        }

        // paginación
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        // consultar productos
        const { count, rows: productos } = await Producto.findAndCountAll({
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                }
            ],
            limit: parseInt(limite),
            offset,
            order: orderOption
        });

        // respuesta exitosa
        res.json({
            success: true,
            data: {
                productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    paginasTotales: Math.ceil(count / parseInt(limite))
                }
            }
        });

    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

/**
 * Obtener el producto por id
 * GET /api/admin/productos/:id
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */

const getproductoById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar producto activo
        const producto = await Producto.findOne({
            where: {
                id,
                activo: true
            },
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre', 'activo'],
                    where: { activo: true }
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo'],
                    where: { activo: true }
                }
            ]
        });

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado o no disponible'
            });
        }

        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                producto
            }
        });

    } catch (error) {
        console.error('Error en getProductoById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

/**
 * Obtener el producto por id
 * GET /api/admin/productos/:id
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getCategorias = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // Buscar categorias activas
        const categorias = await Categoria.findAll({
            where: {activo: true},
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });

        //Para cada categoria contar buscar productos activos con stock 
        const categoriasConConteo = await Promise.all(
            categorias.map(async (categoria) => {
                const totalProductos = await Producto.count({
                    where: {
                        categoriaId: categoria.id,
                        activo: true,
                        stock: { [Op.gt]: 0 }
                    }
                });
                return { ...categoria.toJSON(), totalProductos };
            })
        );

        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                categorias: categoriasConConteo
             }
        });

    } catch (error) {
        console.error('Error en getCategorias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        });
    }
};

/**
 * Obtener las subcategorias por id
 * GET /api/admin/productos/:id
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getSubcategoriasPorCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { Op } = require('sequelize');

        // Verificar que la categoria exista y este activa
        const categoria = await Categoria.findOne({
            where: {id, activo: true},
        });
        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Buscar subcategorias activas
        const subcategorias = await Subcategoria.findAll({
            where: {
                categoriaId: id,
                activo: true
            },
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });

        //contar productos activos con stock para cada subcategoria
        const subcategoriasConConteo = await Promise.all(
            subcategorias.map(async (subcategoria) => {
                const totalProductos = await Producto.count({
                    where: {
                        subcategoriaId: subcategoria.id,
                        activo: true,
                        stock: { [Op.gt]: 0 }
                    }
                });
                return { ...subcategoria.toJSON(), totalProductos };
            })
        );

        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre,
                },
                subcategorias: subcategoriasConConteo
             }
        });

    } catch (error) {
        console.error('Error en getSubcategoriasPorCategorias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        })
    }
};
/**
 * Obtener productos destacados
 * GET /api/catalogo/destacados
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getProductosDestacados = async (req, res) => {
    try {
        const { limite = 8 } = req.query;
        const { Op } = require('sequelize');

        // Obtener productos mas recientes
        const productos = await Producto.findAll({
            where: {
                activo: true, 
                stock: { [Op.gt]: 0 }
            },
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limite)
        });

        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                productos
             }
        });

    } catch (error) {
        console.error('Error en getProductosDestacados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos destacados',
            error: error.message
        });
    }
};

// Exportar todos los controladores
module.exports = {
    getProductos,
    getproductoById,
    getCategorias,
    getSubcategoriasPorCategoria,
    getProductosDestacados
};