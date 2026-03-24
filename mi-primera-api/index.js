const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();


const CLAVE_SECRETA = process.env.CLAVE_SECRETA || "123456789DFmO@";
const MONGO_URI = process.env.MONGO_URI; 

app.use(cors()); 
app.use(express.json()); 
app.use(express.static('public')); 

// Conexión a Base de Datos
mongoose.connect(MONGO_URI)
    .then(() => console.log('⭐ Conectado a MongoDB Atlas de forma segura'))
    .catch(err => console.error('❌ Error de conexión:', err));

const Tarea = mongoose.model('Tarea', {
    titulo: { type: String, required: true },
    completada: { type: Boolean, default: false }
});

// --- MIDDLEWARE DE SEGURIDAD ---
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ error: "No token" });

    jwt.verify(token, CLAVE_SECRETA, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token inválido" });
        req.usuario = decoded;
        next();
    });
};

// --- RUTAS API ---

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    // Aquí podrías usar otra variable de entorno para el password si quisieras
    if (usuario === 'felipe' && password === 'admin123') {
        const token = jwt.sign({ user: 'felipe' }, CLAVE_SECRETA, { expiresIn: '2h' });
        return res.json({ token });
    }
    res.status(401).json({ error: "Credenciales incorrectas" });
});

// 1. Obtener tareas con Filtro y Paginación
app.get('/tareas', verificarToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const filter = req.query.filter; 
        const limit = 5;
        const skip = (page - 1) * limit;

        let query = {};
        if (filter === 'pending') query.completada = false;
        if (filter === 'completed') query.completada = true;

        const total = await Tarea.countDocuments(query);
        const tareas = await Tarea.find(query).sort({ _id: -1 }).skip(skip).limit(limit);

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

// 2. Crear tarea
app.post('/tareas', verificarToken, async (req, res) => {
    try {
        const nuevaTarea = new Tarea({ titulo: req.body.titulo });
        await nuevaTarea.save();
        res.status(201).json(nuevaTarea);
    } catch (e) { res.status(500).json({ error: "Error al guardar" }); }
});

// 3. Actualizar tarea (completada O título)
app.patch('/tareas/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { completada, titulo } = req.body;

    try {
        const updateData = {};
        if (completada !== undefined) updateData.completada = !!completada;
        if (titulo !== undefined) updateData.titulo = titulo;

        const tareaActualizada = await Tarea.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!tareaActualizada) return res.status(404).json({ error: "No existe" });
        res.json(tareaActualizada);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 4. Eliminar tarea
app.delete('/tareas/:id', verificarToken, async (req, res) => {
    try {
        const resultado = await Tarea.findByIdAndDelete(req.params.id);
        if (!resultado) return res.status(404).json({ error: "No encontrada" });
        res.json({ mensaje: "ok" });
    } catch (e) { res.status(500).json({ error: "Error al eliminar" }); }
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en línea en puerto ${PORT}`));