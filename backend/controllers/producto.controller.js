/**
 * controlador de productos
 * maneja las operaciones crud y activar y desactivar productos 
 * solo accesible por administradores
 */

/**
 * Importar modelos
 */

const Producto = require(".../models/producto");
const Categoria = require(".../models/categoria");
const Subcategoria = require(".../models/Subcategoria");

//Importar patch y fs para manejo de imagenes
const path = require ('path');
const fs = require ('fs');

/**
 * obtener todos los productos
 * GET /api/productos
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * subcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * activo: true/false (filtrar por estado)
 * IncluirSubcategorias: true/false (Incluir subcategorias relacionadas)
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductos = async (req, res) => {
  try {
    const { categoriaId, subcategoriaId, activo, conStock, buscar, pagina = 1, limite = 100 } = req.query;

    //Construir filtros
     const where = {};
     if (categoriaId) where.categoriaId = categoriaId;
     if (subcategoriaId) where.subcategoriaId = subcategoriaId;
     if (activo !== undefined) where.activo = activo === 'true';
     if (conStock === 'true') where.stock = { [require ('sequelize').Op.gt]: 0};

     //paginacion
     const offeset = (parseInt(pagina) - 1) * parseInt (limite);

    // opciones de consulta
    const opciones = {
      where,
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre', ]
        },
        {
            model: Subcategoria,
            as: 'subcategoria',
            attributes: ['id', 'nombre',]
        }
      ],
      limit: parseInt(limite), 
      offset,
      order: [['nombre', 'ASC']] 
    };

    //obtener productos y total 
    const { count, rows: productos } = await Producto.FindAndCountAll(opciones);
  
    //Respuesta Exitosa
    res.json({
      success: true,
      count: productos.length,
      data: {
        productos,
        paginacion: {
          total: count,
          pagIna: parseInt(pagina),
          limite: parseInt(limite),
          totalpaginas: Math.ceil(count / parseInt(limite))

        }
      },
    });
  } catch (error) {
    console.error("Error en getProductos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

/**
 * obtener todos los productos por Id
 * GET /api/categorias/:id/productos
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductosById = async (req, res) => {
  try {
    const { id } = req.params;

    // buscar productos con relacion
    const producto = await Producto.findByPk(
      id,
      {
        include: {
          model: Categoria,
          as: "productos ",
          attributes: ["id", "nombre", "activo"],
        },
      },
      {
        model: Subcategoria,
        attributes: ["id", 'nombre', 'activo'],
      },
    );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    //agregar contador de productos
    const productoJSON = producto.toJSON();
    productoJSON.totalProductos = productoJSON.productos.length;
    delete productoJSON.productos; //no enviar la lista completa solo el contador

    //Respuesta Exitosa
    res.json({
      success: true,
      data: {
        producto
      },
    });
  } catch (error) {
    console.error("Error en getProductosById: ", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

/**
 * Crear un Producto
 * POST /api/admin/productos
 * Body: { nombre, descripcion, stock, precio, categoriaId, subcategoriaId, imagen}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, stock, precio, categoriaId, subcategoriaId, } = req.body;

    //validacion 1 verificar campos requeridos
    if (!nombre || !precio ||!categoriaId || !subcategoriaId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos nombre, precio, categoriaId, subcategoriaId',
      });
    }
/**
    //validacion 2 verificar que el nombre no exista
    const productoExistente = await Producto.findOne({ where: { nombre } });

    if (productoExistente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un producto con el nombre "${nombre}"`,
      });
    }*/

      // valodacion 2 verifica si la categoria esta activa 
      const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `No existe una categoria con id "${categoriaId}"`
            });
        }
        if (!categoria.activo) {
          return res.status(400).json({
            success: false,
            message: `La categoria ${categoria.nombre} esta inactiva`
          });
        }

          //Validacion 3 verificar que la subcategoria existe y pertenece a una categoria
        const subcategoria = await Subcategoria.findByPk(subcategoriaId);        

        if (!subcategoria) {
            return res.status(400).json({
                success: false,
                message: `No existe una subcategoria con id ${subcategoriaId}`
            });
        }
        
        if (!subcategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria ${subcategoria.nombre} esta inactiva`
            });
        }
        
        if (!subcategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria ${subcategoria.nombre} no pertenece a la categoria con id ${categoriaId}`
            });
        }

        //Validacion 4 validar el precio y el stock
        if (parseFloat(precio) < 0 ) {
          return res.status(400).json({
            success: false,
            message: 'El precio debe ser mayor a 0'
          })
        }
        if (parseInt(stock) < 0 ) {
          return res.status(400).json({
            success: false,
            message: 'El stock debe ser negativo'
          })
        }

        //Obtener imagen
        const imagen = req.file ? req.file.filename : null;

    //Crear producto
    const nuevoProducto = await Producto.create({
      nombre,
      descripcion: descripcion || null, 
      precio: parseFloat(precio),
      stock: parseInt(stock),
      categoriaId: parseInt(categoriaId),
      subcategoria: parseInt(subcategoriaId),
      imagen,
      activo: true
    });

    //Recargar con relaciones
    await nuevoProducto.reload({
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre']},
        { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre']},
      ]
    });

    //Respuesta exitosa
    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: {
        producto: nuevoProducto,
      },
    });

  } catch (error) {
    console.error("Error en crearProducto: ", error);
    
    //si hubo un error eliminar la imagen subida
    if (req.file) {
      const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
      try {
        await fs.unlink(rutaImagen);
      } catch (err) {
        console.error('Error al eliminar imagen: ', err);
      }
    }

    if (error.name === 'SequelizateValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validacion',
        errors: error.errors.map(e = e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }}

/**
 * Actualizar producto
 * PUT /api/admin/productos/:id
 * Body: { nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    //Buscar producto
    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    //validacion 1 si se cambia el nombre verificar que no exista
    if (nombre && nombre !== categoria.nombre) {
      const categoriaConMismoNombre = await Categoria.findOne({
        where: { nombre },
      });

      if (categoriaConMismoNombre) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una categoria con el nombre "${nombre}"`,
        });
      }
    }
    //Aactualizar campos
    if (nombre !== undefined) categoria.nombre = nombre;
    if (descripcion !== undefined) categoria.descripcion = descripcion;
    if (activo !== undefined) categoria.activo = activo;

    //Guardar cambios
    await categoria.save();

    //Respuesta exitosa
    res.json({
      success: true,
      message: "Categoria actualizada exitosamente",
      data: {
        categoria,
      },
    });
  } catch (error) {
    console.error("Error en actualizarCategoria: ", error);

    if (error.name === "sequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      sucess: false,
      message: "Error al actualizar categoria",
      error: error.message,
    });
  }
};

/**
 * Activa/Desactivar categoria
 * PATCH /api/admin/categorias/:id/estado
 *
 * Al desactivar una categoria se desactivan todas las subcategorias relacionadas
 * Al desactivar una subcategoria se desactivan todos los productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
 */

const toggleCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    //buscar categoria
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria no encontrada",
      });
    }

    // Alternar estado activo
    const nuevoEstado = !categoria.activo;
    categoria.activo = nuevoEstado;

    //Guardar cambios
    await categoria.save();

    // Contar cuantos registros se afectaron
    const subcategoriasAfectadas = await Subcategoria.count({
      where: { categoriaId: id },
    });

    const productosAfectados = await Producto.count({
      where: { categoriaId: id },
    });

    //Respuesta exitosa
    res.json({
      success: true,
      message: `Categoria ${nuevoEstado ? "activada" : "desactivada"} exitosamente`,
      data: {
        categoria,
        afectados: {
          subcategorias: subcategoriasAfectadas,
          productos: productosAfectados,
        },
      },
    });
  } catch (error) {
    console.error("Error en toggleCategoria: ", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado de categoria",
      error: error.message,
    });
  }
};

/**
 * Eliminar categoria
 * DELETE /api/admin/categorias/:id
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
 */
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    //Buscar categoria
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria no encontrada",
      });
    }

    // Validacion verificar que no tenga subcategorias
    const subcategorias = await Subcategoria.count({
      where: { categoriaId: id },
    });

    if (subcategorias > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoria porque tiene ${subcategorias} subcategorias asociadas usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`,
      })
    }

        // Validacion verificar que no tenga productos
    const productos = await Producto.count({
      where: { categoriaId: id },
    });

    if (productos > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoria porque tiene ${productos} productos asociados usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`,
      });
    }

    //Eliminar categoria
    await categoria.destroy();

    //Respuesta exitosa
    res.json({
      success: true,
      message: "Categoria eliminada Exitosamente",
    });
  } catch (error) {
      console.error("Error al eliminar categoria", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar categoria",
        error: error.message
      });
  }
};

/**
 * Obtener estadisticas de una categoria
 * GET /api/admin/categorias/:id/estadisticas
 * retorna
 * Total de subcategorias activas / inactivas
 * Total de productos activos / inactivos
 * valor total del inventario
 * stock total 
 * @param {Object} req request express
 * @param {Object} res response express
 */
const getEstadisticasCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    //Verificar que la categoria exista
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria no encontrada",
      });
    }

    // contar subcategorias
    const totalSubcategorias = await Subcategoria.count({
      where: { categoriaId: id }
    });
    const subcategoriasActivas = await Subcategoria.count({
      where: { categoriaId: id, activo: true }
    });

    //contar productos
    const totalProductos = await Producto.count({
      where: { categoriaId: id }
    });
    const productosActivos = await Producto.count({
      where: { categoriaId: id, activo: true }
    });

    // obtener productos para calcular estadisticas
    const productos = await Producto.findAll({
      where: { categoriaId: id },
      attributes: ["precio", "stock"]
    });

    // calcular estadisticas de inventario
    let valorTotalInventario = 0;
    let stockTotal = 0;

    productos.forEach(producto => {
      valorTotalInventario += parseFloat(producto.precio) * producto.stock;
      stockTotal += producto.stock;
    });

    //Respuesta exitosa
    res.json({
      success: true,
      data: {
        categoria: {
          id: categoria.id,
          nombre: categoria.nombre,
          activo: categoria.activo
        },
        estadisticas:{
          subcategorias: {
            total: totalSubcategorias,
            activas: subcategoriasActivas,
            inactivas: totalSubcategorias - subcategoriasActivas
          },
          productos: {
            total: totalProductos,
            activos: productosActivos,
            inactivos: totalProductos - productosActivos
          },
          inventario: {
            stockTotal: stockTotal,
            valorTotal: valorTotalInventario.toFixed(2) // quitar decimales 
        }
      }
    }
  });
} catch (error) {
      console.error("Error en getEstadisticasCategoria: ", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadisticas",
        error: error.message
      });
    }
  };

  module.exports = {
    getCategorias,
    getCategoriasById,
    crearCategoria,
    actualizarCategoria,
    toggleCategoria,
    eliminarCategoria,
    getEstadisticasCategoria
  }