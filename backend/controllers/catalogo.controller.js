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
            categoriaID, 
            subcategoriaID, 
            buscar, 
            precioMin, 
            precioMax, 
            orden = 'reciente', 
            pagina = 1, 
            limite = 12 } = req.query;
            const { Op } = require('sequelize');


        // filtros base solo para productoss activos y con stock
            const where = {
                activo: true,
                stock: { [Op.gt]: 0 }
            };
            //filtros opcionales
        if (categoriaId)    where.categoriaId = categoriaId;
        if (subcategoriaId)  where.subcategoriaId = subcategoriaId;

        //busqueda de texto 
        if (buscar) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${buscar}%`} },
                { descripcion: { [Op.like]: `%${buscar}%`} }, // permite buscar por nombre o descripcion
            ];
        }

        //filtro por rango de precio
        if (precioMin && precioMax) {
            where.precio = {};
            if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
            if (precioMax) where.precio[Op.gte] = parseFloat(precioMax);
        }

        //Ordenamiento
        let order;
        switch (order) {
            case 'precio_asc':
                order = [['precio', 'ASC']];
                break;
            case 'precio_desc':
                order = [['precio', 'DESC']];
                break;
            case 'nombre':
                order = [['nombre', 'ASC']];
                break;
            case 'reciente':
                order = [['createdAt', 'DESC']];
                break;
        }


        if (activo !== undefined) where.activo = activo === 'true';
        if (constock === 'true') where.stock = { [Op.gt]: 0 };

        //paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        

        /**
         * opciones de consulta
         */
        const opciones = {
            where,
            include: [
                {
                    model: categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'] // campos a incluir de categoria
                },
                {
                    model: subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre',] // campos a incluir de subcategoria
                }
                
            ],
            limit : parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
            // ordenar por nombre ascendente
        };

        //obtener productos y total
        const { count, rows: productos } = await producto.findAndCountAll(opciones);

        //respuesta exitosa
        res.json({
            success: true,
            data: {productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    paginasTotales: Math.ceil(count / parseInt(limite))
                },
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

        // Buscar productos con relacion 
        const Producto = await producto.findByPk(id, {
            include: [{ 
                model: categoria, 
                as: 'categoria',
                attributes: ['id', 'nombre', 'descripcion', 'activo'],
        },
        {
            model: subcategoria,
            as: 'subcategoria',
            attributes:['id','nombre','descripcion','activo']
                }
            ] 
     });

        if (!Producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        // agregar contador de productos a la respuesta
        const productoJSON = Producto.toJSON();
        productoJSON.totalProductos= productoJSON.productos.length;
        delete productoJSON.productos; // eliminar el array de productos para no enviar datos innecesarios
        //Incluir subcategorias si se especifica

        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                producto: productoJSON
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
 * crear un producto 
 * POST /api/admin/productos
 * body: {nombre, descripcion, precio, categoriaId}
 * @param {object} req - request express
 * @param {object} res - response express
 */


const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, subcategoriaID,categoriaId } = req.body;

        // Validacion 1 verificar campos requeridos
        if (!nombre || !precio  || !categoriaId || !subcategoriaID) {
            return res.status(400).json({
                success: false,
                message: 'El nombre, precio, stock, subcategoriaID y categoriaId son requeridos'
            });

        }
        /**
        // Validacion 2 verificar que no exista una producto con el mismo nombre
        const productoExistente = await producto.findOne({ where: { nombre } });
        if (productoExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe una producto con ese nombre "${nombre}"`
            });
    }     */

        // Validacion 2 verificar que la categoria exista y este activa
        const Categoria = await categoria.findByPk(categoriaId);
        if (!Categoria) {
         return res.status(400).json({
            success: false,
            message: `La categoria "${categoriaId}" no existe`
         });
        }
        if (!Categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${Categoria.nombre}" esta inactiva no se pueden crear productos en categorias inactivas`
            });
        }
        // Validacion 3 verificar que la subcategoria existe y pertenece a una categoria
        const Subcategoria = await subcategoria.findByPk(subcategoriaID);
        if (!Subcategoria) {
            return res.status(404).json({
                success: false,
                message: `La subcategoria "${subcategoriaID}" no existe`
            });
        }
            if (Subcategoria.activo !== categoriaId) {
            return res.status(400).json({
                success: false, 
                message: `La subcategoria "${Subcategoria.nombre}" esta inactiva no se pueden crear productos en subcategorias inactivas`
            });
        }
        
        if (Subcategoria.categoriaID !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false, 
                message: `La subcategoria "${Subcategoria.nombre}" no pertenece a la categoria "${Categoria.nombre}"`
            });
        }

        // validacion 4 validar el precio y stock sean numeros positivos
        if (parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un numero positivo'
            });
        }
        if (parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un numero entero positivo'
            });
        }

        //obtener imagen
        const imagen = req.file ? req.file.filename : null;

        // Crear producto
        const nuevoProducto = await producto.create({
            nombre,
            descripcion: descripcion || null,
            precio: parseFloat(precio).toFixed(2), // formatear a 2 decimales
            stock: parseInt(stock),
            imagen,
            subcategoriaID: parseInt(subcategoriaID),
            categoriaId: parseInt(categoriaId),
            activo: true
        });


        // recargar con relaciones
        await nuevoProducto.reload({
            include: [
                {   model: categoria, as: 'categoria', attributes: ['id', 'nombre']},
                {   model: subcategoria, as: 'subcategoria', attributes: ['id', 'nombre']}
            ]
        });

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: { producto: nuevoProducto }
        });
    } catch (error) {
        console.error('Error en crearProducto:', error);

        //si hubo un error eliminar la imaggen subida
        if (req.file) {
            const rutaImagen = path.join(__dirname, '..', 'uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error(`Error al eliminar imagen`, err);
            }
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
    }
};      



/**
 * Actualizar un producto
 * PUT /api/admin/productos/:id
 * body: {nombre, descripcion, precio, stock, activo, categoriaID, subcategoriaID}
 * @param {object} req - request express
 * @param {object} res - response express
 */

const actualizarProducto = async (req, res) => {
    try {   
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, activo, categoriaID,subcategoriaID } = req.body;
        // Buscar producto
        const producto = await producto.findByPk(id);
       
       
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // validacion 1 si se cambia el nombre verificar que no exista
        if (categoriaID&& categoriaID !== producto.categoriaID) {
            const Categoria = await categoria.findOne(categoriaID);

            if (Categoria || !Categoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: `CATEGORIA INVALIDA O INACTIVA`
                });
            }
        }
        if (subcategoriaID&& subcategoriaID !== producto.subcategoriaID) {
            const Subcategoria = await subcategoria.findOne(subcategoriaID);

            if (Subcategoria || !Subcategoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: `SUBCATEGORIA INVALIDA O INACTIVA`
                });
            }

            const catID = categoriaID || producto.categoriaID; // usar el nuevo categoriaID si se proporciona, de lo contrario usar el existente
            if (Subcategoria.CategoriaID !== parseInt(catID)) {
                return res.status(400).json({
                    success: false,
                    message: `SUBCATEGORIA NO PERTENECE A LA CATEGORIA SELECCIONADA`
                });
            }
        }

        // validacion 2 validar el precio y stock sean numeros positivos
        if (precio !== undefined && parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un numero positivo'
            });
        }
        if (stock !== undefined && parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un numero entero positivo'
            });
        }

        // validacion 3 si se actualiza la imagen eliminar la anterior
        if (req.file) {
            // eliminar imagen anterior si existe
            if (producto.imagen) {
                const rutaImagen = path.join(__dirname, '..', 'uploads', producto.imagen);
                try {
                    await fs.unlink(rutaImagen);
                } catch (err) {
                    console.error(`Error al eliminar imagen anterior`, err);
                }
            }
            producto.imagen = req.file.filename;    
        }

        if(!nuevaCategoria.activo){
            return res.status(400).json({
                success: false,
                message: 'No se puede asignar una categoria inactiva'
            });
        }

        //actualizar campos
        if(nombre!== undefined) producto.nombre = nombre;
        if(descripcion !== undefined) producto.descripcion = descripcion;
        if(precio !== undefined) producto.precio = parseFloat(precio);
        if(stock !== undefined) producto.stock = parseInt(stock);
        if(activo !== undefined) producto.activo = activo;
        if(categoriaID !== undefined) producto.categoriaID =parseInt(categoriaID);
        if(subcategoriaID !== undefined) producto.subcategoriaID = parseInt(subcategoriaID);


        //guardar cambios
        await producto.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: { producto }
        });

    } catch (error) {
        console.error('Error en actualizarProducto:', error);
        if (req.file) {
          const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
          try {
            await fs.unlink(rutaImagen);
          } catch (err) {
            console.error('Error al eliminar imagen: ', err);
          }
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    }

};

/**
 * Activar o desactivar un producto
 * PATCH /api/admin/productos/:id/estado
 * 
 * Al desactivar un producto se desactivan todas las subcategorias relacionadas
 * @param {object} req - request express
 * @param {object} res - response express
 */

const toggleproducto = async (req, res) => {
    try {
        const { id } = req.params;
        // Buscar producto
        const producto = await producto.findByPk(id);


        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        producto.activo = !producto.activo;
        await Producto.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: `Producto ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
            data: {
                producto
            }
        });
    } catch (error) {
        console.error('Error en toggleProducto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de producto',
            error: error.message
        });
    }
};
    /**
     * Eliminar un Producto
     * DELETE /api/admin/productos/:id
     * Elimina el producto y su imagen
     * @param {object} req - request express
     * @param {object} res - response express
     */
    const eliminarProducto = async (req, res) => {
        try {
            const { id } = req.params;
            // Buscar producto
            const producto = await producto.findByPk(id);

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            // el hook beforeDestroy se encarga de eliminar la imagen
            await producto.destroy();

            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error en eliminar Producto: ', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar producto',
                error: error.message
            });
        }
    };

    /**
     * Actualizar stock de un producto
     * 
     * PATCH /api/admin/productos/:id/stock
     * body: {cantidad, operacion: 'aumentar' | 'reducir' | 'establecer' }
     * @param {Object} req request Express
     * @param {Object} res response Express
     */
    const actualizarStock = async (req, res) => {
        try {
            const { id } = req.params;
            const { cantidad, operacion } = req.body;
            
            if (!cantidad || !operacion) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere cantidad y operacion'
                });
            }

            const cantidadNUm = parseInt(cantidad);
            if (cantidadNUm < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad no puede ser negativa'
                });
            }
            const producto = await Producto.findByPk (id);

            if (!producto) {
                return res.status(400).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            let nuevoStock;

            switch (operacion) {
                case 'aumentar':
                    nuevoStock = producto.aumentarStock(cantidadNUm);
                    break;
                case 'reducir':
                    if (cantidadNUm > producto.stock) {
                        return res.status(400).json({
                            success: false,
                            message: `No hay suficiente stock. stock actual: ${producto.stock}`
                        });
                    }
                    nuevoStock = producto.reducirStock(cantidadNUm);
                    break;
                case 'establecer':
                    nuevoStock = cantidadNUm;
                    break;
                default: 
                    return res.status(400).json({
                        success: false,
                        message: 'Operacion invalida usa aumentar, reducir o establecer'
                    });
            }

            producto.stock = nuevoStock;
            await producto.save();

            res.json({
                success: true,
                message: `Stock ${operacion === 'aumentar' ? 'aumentado' : operacion === 'reducir' ? 'reducido': 'establecido'} exitosamente`,
                data: {
                    productoId: producto.id,
                    nombre: producto.nombre,
                    stockAnterior: operacion === 'establecer' ? null : (operacion === 'aumentar' ? producto.stock - cantidadNUm : producto.stock + cantidadNUm),
                    stockNuevo: producto.stock
                }
            });

        } catch (error) {
            console.error('error en actualizarStock: ', error);
            res.status(500).json({
                success: false,
                message: 'error al actualizar stock',
                error: error.message
            });
        }
};

// Exportar todos los controladores
module.exports = {
    getProductos,
    getproductoById,
    crearProducto,  
    actualizarProducto,
    toggleproducto,
    eliminarProducto,
    actualizarStock
};