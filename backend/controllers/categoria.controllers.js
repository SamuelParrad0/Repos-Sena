/**
 * Controller de categorias
 * maneja las operaciones crud y activar y desactivar categorias
 * solo accesible para administradores
 */

/**
 * Importar modelos
 */

const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Producto = require('../models/Producto');

/**
 * Obtener todas las categorias
 * query params: 
 * Activo true/false (filtrar por estado)
 * Incluirsubcategorias true/false(incluir subcategorias relacionadas)
 * 
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const getCategorias = async (req, res) => {
    try {
        const { activo, IncluirSubcategorias} = req.query;

        //Opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] //ordenar de manera alfabetica
        };

        //Filtrar por estado activo si se especifica
        if (activo !== undefined) {
            opciones.where = { activo: activo === 'true' };
        }

        //Incluir subcategorias si se solicita
        if (IncluirSubcategorias === 'true') {
            opciones.include == [{
                model: Subcategoria,
                as: 'subcategorias', // Campo del alias para la relacion
                attributes: ['id', 'nombre', 'descripcion', 'activo'] //Campos a incluir de la subcategoria
            }]
        }

        //Opciones categorias
        const categorias = await Categoria.findAll (opciones);

        //Respuesta Exitosa
        res.json({
            success: true,
            count: categorias.length,
            data: {
                categorias
            }
        });

    } catch (error) {
        console.error('Error en getCategorias; ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        })
    }
};

/**
 * Obtener las cateogiras por Id
 * GET /api/categorias/:id 
 * 
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const getCategoriasById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar categorias con subcategorias y contar productos
        const categoria = await Categoria.findByPk ( id, {
        include: [{
                model: Subcategoria,
                as: 'subcategorias',
                attributes: ['id', 'nombre', 'descripcion', 'activo']
            },
            {
                model: Producto,
                as: 'productos',
                attributes: ['id']
            }
        ]
        });

        if (!categoria) {
            return res.status(404).json({
                seccess: false,
                message: 'Categoria no encontrada'
            });
        }

        //Agregar contador de produtos
        const categoriaJSON = categoria.toJSON();
        categoriaJSON.totalProductos = categoriaJSON.productos.length;
        delete categoriaJSON.productos; //no enviar la lista completa solo el contador

        //Respuesta Exitosa
        res.json({
            success: true,
            data: {
                categoria: categoriaJSON
            }
        });

    } catch (error) {
        console.error('Error en getCategoriaById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        })
    }
};


/**
 * Crea una categoria
 * POST /api/admin/categorias
 * Body: { nombre, descripcion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearCategoria = async (res, res) => {
    try {
        const {nombre, descripcion} = req.body;

            //validacion 1- velificar campos requiridos
            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la categoria es requerido' 
                });
            }

            //Validacion 2 verificar que el nombre no exista
            const categoriaExistente = await Categoria.findOne({ where: {nombre}
            });

            if (categoriaExistente) {
                return res.status(400).json({
                    success: false,
                    message: `Ya exixste una categoria con el nombre "${nombre}"`
                });
            }

            //Crear categoria
            const nuevaCategoria = await Categoria.create({
                nommbre,
                descripcion: descripcion || null, // si no se proporciona la descripcion se establece como null
                activo: true
            });

            //Respuesta exitosa
            res.status(201).json({
                success: true,
                message:'Categoria creada correctamente',
                data: {
                    categoria: nuevaCategoria
                }
            });
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear categoria',
            error: error.message
        });
    }
};
