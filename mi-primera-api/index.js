const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Importamos JWT

const app = express();
const CLAVE_SECRETA = "123456789DFmO@"; // Tu llave maestra

// --- MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.static('public')); 

// --- CONFIGURACIÓN DE MONGODB ---
const MONGO_URI = 'mongodb+srv://Felipe_OrtZzz:12345Dfmo@cluster0.hllhbee.mongodb.net/mi_base_de_datos?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('⭐ Conectado exitosamente a MongoDB Atlas'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// --- MODELO DE DATOS ---
const Tarea = mongoose.model('Tarea', {
    titulo: { type: String, required: true },
    completada: { type: Boolean, default: false }
});

// --- SEGURIDAD (Middleware) ---
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // El token suele venir como "Bearer CODIGO..."
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ error: "Acceso denegado. Se requiere token." });

    jwt.verify(token, CLAVE_SECRETA, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Sesión expirada o token inválido" });
        req.usuario = decoded;
        next();
    });
};

// --- RUTA DE LOGIN ---
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    
    // Credenciales quemadas (luego podrías usar una tabla de usuarios)
    if (usuario === 'felipe' && password === 'admin123') {
        const token = jwt.sign({ user: 'felipe' }, CLAVE_SECRETA, { expiresIn: '2h' });
        return res.json({ token });
    }
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
});

// --- RUTAS DE LA API ---

// 1. Obtener tareas (PÚBLICA con paginación)
app.get('/tareas', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const total = await Tarea.countDocuments();
        const tareas = await Tarea.find().skip(skip).limit(limit);

        res.json({
            tareas,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalTasks: total
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener tareas" });
    }
});

// 2. Crear tarea (PROTEGIDA)
app.post('/tareas', verificarToken, async (req, res) => {
    const { titulo } = req.body;
    if (!titulo) return res.status(400).json({ error: "El título es obligatorio" });

    try {
        const nuevaTarea = new Tarea({ titulo });
        await nuevaTarea.save();
        res.status(201).json(nuevaTarea);
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// 3. Marcar completada (PROTEGIDA)
app.patch('/tareas/:id', verificarToken, async (req, res) => {
    try {
        const tareaActualizada = await Tarea.findByIdAndUpdate(
            req.params.id, 
            { completada: !!req.body.completada }, 
            { new: true }
        );
        if (!tareaActualizada) return res.status(404).json({ error: "No existe" });
        res.json(tareaActualizada);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 4. Eliminar (PROTEGIDA)
app.delete('/tareas/:id', verificarToken, async (req, res) => {
    try {
        const resultado = await Tarea.findByIdAndDelete(req.params.id);
        if (!resultado) return res.status(404).json({ mensaje: "No encontrada" });
        res.json({ mensaje: "Eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

// --- ARRANCAR EL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API con Seguridad JWT en http://localhost:${PORT}`);
});