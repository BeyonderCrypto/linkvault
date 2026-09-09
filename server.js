require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = require('./services/db');
const analyzer = require('./services/analyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de subida temporal
const upload = multer({
  dest: path.join(__dirname, 'data', 'temp_uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// Router para endpoints de la API (compatible con /api y con Netlify Functions)
const apiRouter = express.Router();

// 1. Analizar URL
apiRouter.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Debes proporcionar una URL válida' });
    }

    const metadata = await analyzer.analyzeUrl(url.trim());
    res.json(metadata);
  } catch (error) {
    console.error('Error al analizar URL:', error);
    res.status(500).json({
      error: 'Ocurrió un problema inesperado al analizar el enlace',
      details: error.message
    });
  }
});

// 2. Obtener enlaces con filtros
apiRouter.get('/links', async (req, res) => {
  try {
    const { search, category, contentType, source, isFavorite, sort } = req.query;
    const links = await db.getAllLinks({
      search,
      category,
      contentType,
      source,
      isFavorite,
      sort
    });
    res.json(links);
  } catch (error) {
    console.error('Error al obtener enlaces:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// 3. Obtener un enlace por ID
apiRouter.get('/links/:id', async (req, res) => {
  try {
    const link = await db.getLinkById(req.params.id);
    if (!link) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Crear nuevo enlace
apiRouter.post('/links', async (req, res) => {
  try {
    const data = req.body;
    if (!data.url) {
      return res.status(400).json({ error: 'La URL es requerida' });
    }

    const created = await db.createLink(data);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error al guardar enlace:', error);
    res.status(500).json({ error: 'No se pudo guardar el enlace' });
  }
});

// 5. Actualizar enlace
apiRouter.put('/links/:id', async (req, res) => {
  try {
    const updated = await db.updateLink(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar enlace:', error);
    res.status(500).json({ error: 'Error al actualizar enlace' });
  }
});

// 6. Alternar favorito
apiRouter.patch('/links/:id/favorite', async (req, res) => {
  try {
    const result = await db.toggleFavorite(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Eliminar enlace
apiRouter.delete('/links/:id', async (req, res) => {
  try {
    const success = await db.deleteLink(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Enlace no encontrado o ya eliminado' });
    }
    res.json({ message: 'Enlace eliminado correctamente', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Estadísticas
apiRouter.get('/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Exportar SQLite .db (solo disponible si se usa almacenamiento local o archivo disponible)
apiRouter.get('/export/db', async (req, res) => {
  try {
    const dbPath = db.getDbPath();
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({
        error: 'Estás conectado a Turso Cloud. Utiliza la opción "Exportar a JSON" para descargar tus datos.'
      });
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    res.download(dbPath, `linkvault_backup_${timestamp}.db`);
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar base de datos' });
  }
});

// 10. Exportar a JSON
apiRouter.get('/export/json', async (req, res) => {
  try {
    const links = await db.exportAllLinks();
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="linkvault_export_${timestamp}.json"`);
    res.send(JSON.stringify(links, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar a JSON' });
  }
});

// 11. Importar JSON
apiRouter.post('/import/json', async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Se esperaba un arreglo JSON con enlaces' });
    }

    const result = await db.importLinks(items);
    res.json({ message: `Se importaron ${result.imported} enlaces exitosamente`, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Montar router en prefijos correspondientes
app.use('/api', apiRouter);
app.use('/.netlify/functions/api/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);

// Iniciar servidor standalone si no es importado por Netlify
if (process.env.NETLIFY !== 'true' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 LinkVault Servidor activo en: http://localhost:${PORT}`);
    console.log(`📡 Motor de Base de Datos: ${db.isCloud() ? 'Turso Cloud SQLite' : 'SQLite Local (' + db.getDbPath() + ')'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
