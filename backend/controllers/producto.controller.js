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
    const { categoriaId, subcategoriaId, activo, IncluirSubcategorias } = req.query;

    // opciones de consulta
    const opciones = {
      order: [["nombre", "ASC"]], // ordenar de manera alfabetica
    };
    

    // Filtrar por categoria si se especifica
    if (categoriaId) {
      opciones.where = { ...opciones.where, categoriaId };
    }

    // Filtrar por subcategoria si se especifica
    if (subcategoriaId) {
      opciones.where = { ...opciones.where, subcategoriaId };
    }

    // Incluir subcategorias si se solicita
    if (IncluirSubcategorias === "true") {
      opciones.include = [
        {
          model: Subcategoria,
          as: "subcategorias", //campo de alias para la relacion
          attributes: ["id", "nombre", "descripcion", "activo"], //campos a incluir en la subcategoria
        },
      ];
    }
        // Incluir activo si se especifica
     if (activo === "true") {
      opciones.where = { ...opciones.where, activo: true };
    } else if (activo === "false") {
      opciones.where = { ...opciones.where, activo: false };
    }

    //obtener productos con las opciones de consulta
    const productos = await Producto.findAll(opciones);

    //Respuesta Exitosa
    res.json({
      success: true,
      count: productos.length,
      data: {
        productos,
      },
    });
  } catch (error) {
    console.error("Error en getProductos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los productos",
      error: error.message,
    });
  }
};

/**
 * obtener todos los productos de una categoria
 * GET /api/categorias/:id/productos
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductosById = async (req, res) => {
  try {
    const { id } = req.params;

    // buscar productos de la categoria con subcategorias
    const categoria = await Categoria.findByPk(
      id,
      {
        include: {
          model: Producto,
          as: "productos ",
          attributes: ["id", "nombre", "precio", "stock", "activo"],
        },
      },
      {
        model: Producto,
        attributes: ["id"],
      },
    );



    //agregar contador de productos
    const productoJSON = producto.toJSON();
    categoriaJSON.totalProductos = categoriaJSON.productos.length;
    delete categoriaJSON.productos; //no enviar la lista completa solo el contador

    //Respuesta Exitosa
    res.json({
      success: true,
      data: {
        categoria: categoriaJSON,
      },
    });
  } catch (error) {
    console.error("Error en getCategoriaById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener categoria",
      error: error.message,
    });
  }
};

/**
 * Crear una categoria
 * POST /api/admin/categorias
 * Body: { nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    //validacion 1 verificar campos requeridos
    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: "El  nombre es requerido",
      });
    }

    //validacion 2 verificar que el nombre no exista
    const categoriaExistente = await Categoria.findOne({ where: { nombre } });

    if (categoriaExistente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una categoria con el nombre "${nombre}"`,
      });
    }
    //Crear categoria
    const nuevaCategoria = await Categoria.create({
      nombre,
      descripcion: descripcion || null, //si no se proporciona la descipcion se establece como null
      activo: true,
    });

    //Respuesta exitosa
    res.status(201).json({
      success: true,
      message: "Categoria creada exitosamente",
      data: {
        categoria: nuevaCategoria,
      },
    });
  } catch (error) {
    console.error("Error en crearCategoria: ", error);
    return res.status(400).json({
      success: false,
      message: "Error de validacion",
      errors: error.errors.map((e) => e.message),
    });
  }

  res.status(500).json({
    success: false,
    message: "Error al crear categoria",
    error: error.message,
  });
};

/**
 * Actualizar categoria
 * PUT /api/admin/categorias/:id
 * Body: { nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    //Buscar categoria
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria no encontrada",
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