/**
 * Controller de autenticacion
 * maneja el registro , login y obtencion del perfil de usuario
 */

/**
 * Importar modelos
 */

const Usuario = require('../models/Usuario');
const { generateToken } = require('../config/jwt');

/**
 * Obtener todos los usuarios
 * GET /api/usuarios
 * query params: 
 * Activo true/false (filtrar por estado)
 * 
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const register = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion} = req.query;

        //validacion 1 verificar q todos los campos requeridos esten presentes
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, apellido, email, password'
            });
        }

        //validacion 2 verificar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email invalido'
            });
        }

        //validacion 3 verificar la longitud de la contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        //validacion 4 verificar que el email no este registrado
        const usuarioExistente = await Usuario.findOne({ where: { email }});
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya esta registrado'
            });
        }

/**
 * Crear usuario
 * el hook beforeCreate en el modelo se encarga de hashear la contraseña antes de gaurdarla
 * en el rol por defecto es cliente
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

         //crear usuario
            const nuevoUsuario = await Usuario.create({
                nombre,
                apellido,
                email,
                password,
                rol,
                telefono: telefono || null,
                direccion: direccion || null, // si no se proporciona se establece como null
                rol: 'cliente' // rol por defecto
            });

            //generar Token JWT con datos del usuario
            const token = generarToken({
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            });

            //Respuesta exitosa
            const usuarioRespuesta = nuevoUsuario.toJSON();
            delete usuarioRespuesta.password; //elimina el campo del contraseña
            res.status(201).json({
                success: true,
                message: 'Usuario registrado correctamente',
                data: {
                    usuario: usuarioRespuesta,
                    token
                    }
            });
        } catch (error) {
                console.error('Error en registrar ', error);
                res.status(400).json({
                    success: false,
                    message: 'Error de registrar usuario',
                    errors: error.message
                });
            }
};

/**
 * Inicar sesion login 
 * Autentica un usuario con email y contraseña
 * retorna el usuario y un token JWT si las credenciales son correctas
 * POST /api/auth/login
 * body: { email, password}
 */

const login = async (req, res) => {
    try {
        //Extraer credenciales del body
        const { email, password }= req.body;

        //validacion 1: verificar que se proporciona email y contraseña
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                messsage: 'Email y password son requeridos'
            });
        }

        //validacion 2: buscar usuario por email
        //necesitamos incluir el password aqui normalmente se exckuye por seguridad
        const usuario = await usuario.scope('withPassword').findOne({
            where: { email }
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidadas'
            });
        }

        //validacion 3 verificar que el usuario este activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo, contacte al administrador'
            });
        }

            //validacion 4: verificar la contraseña
            //usamos el metodo compararPassword del modelo usuario
            const passwordValida = await usuario.compararPassword(password);

            if (!passwordValida) {
                return res.status(401).json({
                    success: false,
                    message: 'credenciales invalidas'
                });
            }
            // generar token jwt con datos basicos del usuario
            const token = generateToken({
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol,
            });

            //preparar respuesta si password
            const usuarioSinPassword = usuario.toJSON();
            delete usuarioSinPassword.password;

            //respuesta exitosa
            res.json({
                success: true,
                message: 'inicio de sesion exitoso',
                data: {
                    usuario: usuarioSinPassword,
                    token
                }
            });
        } catch (error) {
            console.error('Error en login', error);
            res.status(500).json({
                success: false,
                message: 'Error en iniciar sesion',
                error: error.message
            })
        }
    };

    /**
     * Obtener perfil de usuario autenticado
     * requiere middleware verificarAuth
     * get /api/auth/me
     * headers: { Authorization: 'Bearer TOKEN' }
     */

    const getMe = async (req, res) => {
        try {
            //El usuario ya esta en req.usuario 
            const usuario = await Usuario.findByPk(req.usuario.id, {
                attributes: { exclude: ['password'] }
            });

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            //respuesta exitosa
            res.json({
                success: true,
                data: {
                    usuario
                }
            });
        } catch (error) {
            console.error('Error en getMe', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil',
                error: error.message
            })
        }
    };

/**Actualizar perfil de usuario autenticado
 * permite al usuaario actualizar su informacion personal
 * PUT /api/auth/me
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const updateMe = async (req, res) => {
    try {
        const {nombre, apellido, telefono, direccion} = req.body;

        //Buscar usuario
        const usuario = await Usuario.findByPk(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;

        //guardar cambios 
        await usuario.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'perfil actualizado correctamente',
            data: {
                usuario: usuario.toJSON()
            }
        });
    } catch (error) {
        console.error('Error en uptdateMe: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    } 
};

/**
 * cambiat la contraseña del usuario autenticado
 * permite al usuario cambiar su contraseña
 * requiere su contrasñea actual por seguridad
 * PUT /api/auth/change-password
 */

const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva} = req.body;

        //validacion 1 verificar que se proporcionaron ambas contraseñas
        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere contrasela actual y nueva contraseña'
            });
        }
        //validacion 2 verificar que se proporcionaron ambas contraseñas
        if (passwordActual.legth < 6 ) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual debe tener al menos 6 caracteres'
            });
        }
        
        
        //validacion 4 verificar que la contraseña actual sea correcta
        const passwordValida = await usuario.compararPassword('passwordActual');
        if (!passwordValida) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        //actualizar contraseña
        usuario.password = ppasswordNueva;
        await usuario.save();

        // respuesta exitosa
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error en changePassword ', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        })
    }
};

//Exportar todos los controladores
module.exports = {
   register,
   login,
   getMe,
   updateMe,
   changePassword
};
