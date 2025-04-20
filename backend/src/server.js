require('dotenv').config(); // Carga variables de .env si existe (para desarrollo local)
const express = require('express');
const cors = require('cors'); // 👈 Importa CORS
const mysql = require('mysql2/promise'); // Usar la versión con promesas

const app = express();
const port = process.env.PORT || 3000;

// --- Configuración de la Base de Datos ---
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'userdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// --- Inicializar DB ---
async function initializeDbPool() {
  console.log("Intentando conectar a la base de datos...");
  console.log("Host:", dbConfig.host);
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('Conectado exitosamente a la base de datos MySQL!');
    connection.release();
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.code, error.message);
    console.log('Reintentando conexión en 5 segundos...');
    setTimeout(initializeDbPool, 5000);
  }
}

// --- Middlewares ---
app.use(cors({ origin: 'http://localhost:5173' })); // 👈 Habilita CORS para tu frontend
app.use(express.json());

// --- Middleware para verificar conexión a DB ---
app.use(async (req, res, next) => {
  if (!pool) {
    console.log("Esperando inicialización del pool de DB...");
    return res.status(503).json({ message: 'Servicio no disponible temporalmente (DB no lista)' });
  }
  next();
});

// --- Rutas CRUD ---
app.get('/', (req, res) => {
  res.send('API CRUD de Usuarios con Node.js, Express, MySQL y Docker');
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Nombre y email son requeridos' });
  }
  try {
    const [result] = await pool.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El email ya está registrado.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al crear usuario', error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: 'Error interno del servidor al obtener usuarios', error: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
    res.status(500).json({ message: 'Error interno del servidor al obtener usuario', error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Nombre y email son requeridos para actualizar' });
  }
  try {
    const [result] = await pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado para actualizar' });
    }
    if (result.changedRows === 0 && result.affectedRows === 1) {
      return res.status(200).json({ message: 'Usuario no modificado (datos iguales)', id: parseInt(id), name, email });
    }
    res.json({ message: 'Usuario actualizado exitosamente', id: parseInt(id), name, email });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El email ya está en uso por otro usuario.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al actualizar usuario', error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado para borrar' });
    }
    res.json({ message: 'Usuario borrado exitosamente' });
  } catch (error) {
    console.error("Error al borrar usuario:", error);
    res.status(500).json({ message: 'Error interno del servidor al borrar usuario', error: error.message });
  }
});

// --- Iniciar Servidor ---
initializeDbPool().then(() => {
  app.listen(port, () => {
    console.log(`Servidor API corriendo en http://localhost:${port}`);
  });
}).catch(err => {
  console.error("Fallo crítico al inicializar el pool de DB:", err);
  process.exit(1);
});

// --- Cierre de conexión ---
process.on('SIGINT', async () => {
  console.log('Cerrando pool de conexiones...');
  if (pool) await pool.end();
  console.log('Pool cerrado. Saliendo.');
  process.exit(0);
});
