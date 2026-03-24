const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const CLAVE_SECRETA = "123456789DFmO@";

app.use(cors()); 
app.use(express.json()); 
app.use(express.static('public')); 

const MONGO_URI = 'mongodb+srv://Felipe_OrtZzz:12345Dfmo@cluster0.hllhbee.mongodb.net/mi_base_de_datos?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('⭐ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error:', err));

const Tarea = mongoose.model('Tarea', {
    titulo: { type: String, required: true },
    completada: { type: Boolean, default: false }
});

// Middleware de seguridad
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

app.post('/login', (req, res) => {
    const { usuario, password } = req.body;
    if (usuario === 'felipe' && password === 'admin123') {
        const token = jwt.sign({ user: 'felipe' }, CLAVE_SECRETA, { expiresIn: '2h' });
        return res.json({ token });
    }
    res.status(401).json({ error: "Error" });
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
        res.status(500).json({ error: "Error" });
    }
});

app.post('/tareas', verificarToken, async (req, res) => {
    try {
        const nuevaTarea = new Tarea({ titulo: req.body.titulo });
        await nuevaTarea.save();
        res.status(201).json(nuevaTarea);
    } catch (e) { res.status(500).send(); }
});

app.patch('/tareas/:id', verificarToken, async (req, res) => {
    try {
        const tarea = await Tarea.findByIdAndUpdate(req.params.id, { completada: req.body.completada }, { new: true });
        res.json(tarea);
    } catch (e) { res.status(500).send(); }
});

app.delete('/tareas/:id', verificarToken, async (req, res) => {
    try {
        await Tarea.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "ok" });
    } catch (e) { res.status(500).send(); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Puerto ${PORT}`));