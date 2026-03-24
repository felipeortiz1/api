const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Importante: haber hecho 'npm install jsonwebtoken'

const app = express();
const CLAVE_SECRETA = "123456789DFmO@"; // Tu llave para cifrar los tokens

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

// --- SEGURIDAD: Función para proteger rutas ---
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // El token suele venir como "Bearer CODIGO..."
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: "Acceso denegado. Se requiere token." });
    }

    jwt.verify(token, CLAVE_SECRETA, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Sesión expirada o token inválido" });
        }
        req.usuario = decoded;
        next();
    });
};

// --- RUTA DE LOGIN ---
app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    
    // Credenciales de prueba
    if (usuario === 'felipe' && password === 'admin123') {
        const token = jwt.sign({ user: 'felipe' }, CLAVE_SECRETA, { expiresIn: '2h' });
        return res.json({ token });
    }
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
});

// --- RUTAS DE LA API ---
// 1. Obtener tareas (PROTEGIDA y con Paginación mejorada)
app.get('/tareas', verificarToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const filter = req.query.filter; // 'pending' o 'completed'
        const limit = 5;
        const skip = (page - 1) * limit;

        // Construimos el objeto de búsqueda dinámicamente
        let query = {};
        if (filter === 'pending') query.completada = false;
        if (filter === 'completed') query.completada = true;

        const total = await Tarea.countDocuments(query); // Contar según el filtro
        const tareas = await Tarea.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            tareas,
            totalPages: Math.ceil(total / limit) || 1,
            currentPage: page,
            totalTasks: total
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener tareas" });
    }
});

// 2. Crear una nueva tarea (PROTEGIDA)
app.post('/tareas', verificarToken, async (req, res) => {
    const { titulo } = req.body;
    
    if (!titulo) {
        return res.status(400).json({ error: "El título es obligatorio" });
    }

    try {
        const nuevaTarea = new Tarea({ titulo });
        await nuevaTarea.save();
        console.log(`➕ Tarea guardada: ${titulo}`);
        res.status(201).json(nuevaTarea);
    } catch (error) {
        res.status(500).json({ error: "Error al crear la tarea" });
    }
});

// 3. Marcar tarea como completada (PROTEGIDA)
app.patch('/tareas/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { completada } = req.body;

    try {
        const tareaActualizada = await Tarea.findByIdAndUpdate(
            id, 
            { completada: !!completada }, 
            { new: true }
        );
        
        if (!tareaActualizada) return res.status(404).json({ error: "Tarea no encontrada" });
        res.json({ mensaje: "Actualizada", tarea: tareaActualizada });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 4. Eliminar una tarea (PROTEGIDA)
app.delete('/tareas/:id', verificarToken, async (req, res) => {
    try {
        const resultado = await Tarea.findByIdAndDelete(req.params.id);
        
        if (!resultado) {
            return res.status(404).json({ mensaje: "La tarea no existe" });
        }

        console.log(`🗑️ Tarea eliminada: ${req.params.id}`);
        res.json({ mensaje: "Eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

// --- ARRANCAR EL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Pro con Seguridad JWT en puerto ${PORT}`);
});