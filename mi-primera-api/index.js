const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.static('public')); 

// --- CONFIGURACIÓN DE MONGODB ---

const MONGO_URI = 'mongodb+srv://Felipe_OrtZzz:12345Dfmo@cluster0.hllhbee.mongodb.net/mi_base_de_datos?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('⭐ Conectado exitosamente a MongoDB Atlas'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// --- MODELO DE DATOS (Equivalente a la tabla en SQL) ---
const Tarea = mongoose.model('Tarea', {
    titulo: { type: String, required: true },
    completada: { type: Boolean, default: false }
});

// --- RUTAS DE LA API ---

// 1. Obtener todas las tareas (GET)
app.get('/tareas', async (req, res) => {
    try {
        const tareas = await Tarea.find();
        res.json(tareas);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener tareas" });
    }
});

// 2. Crear una nueva tarea (POST)
app.post('/tareas', async (req, res) => {
    const { titulo } = req.body;
    
    if (!titulo) {
        return res.status(400).json({ error: "El título es obligatorio" });
    }

    try {
        const nuevaTarea = new Tarea({ titulo });
        await nuevaTarea.save();
        
        console.log(`➕ Tarea guardada en la nube: ${titulo}`);
        res.status(201).json(nuevaTarea);
    } catch (error) {
        res.status(500).json({ error: "Error al crear la tarea en MongoDB" });
    }
});

// 3. Marcar tarea como completada (PATCH)
app.patch('/tareas/:id', async (req, res) => {
    const { id } = req.params;
    const { completada } = req.body;

    try {
        const tareaActualizada = await Tarea.findByIdAndUpdate(
            id, 
            { completada: !!completada }, 
            { new: true }
        );
        
        if (!tareaActualizada) return res.status(404).json({ error: "Tarea no encontrada" });
        
        res.json({ mensaje: "Tarea actualizada correctamente", tarea: tareaActualizada });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar" });
    }
});

// 4. Eliminar una tarea (DELETE)
app.delete('/tareas/:id', async (req, res) => {
    try {
        const resultado = await Tarea.findByIdAndDelete(req.params.id);
        
        if (!resultado) {
            return res.status(404).json({ mensaje: "La tarea no existe" });
        }

        console.log(`🗑️ Tarea ID ${req.params.id} eliminada de la nube`);
        res.json({ mensaje: `Tarea eliminada correctamente` });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
});

// --- ARRANCAR EL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API Nivel Pro funcionando en http://localhost:${PORT}`);
    console.log(`📂 Base de datos: MongoDB Atlas`);
});