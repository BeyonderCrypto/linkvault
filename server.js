require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

const db = require('./services/db');
const analyzer = require('./services/analyzer');
const auth = require('./services/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de subida temporal usando os.tmpdir() (seguro para entornos serverless y locales)
const upload = multer({
  dest: path.join(os.tmpdir(), 'linkvault_uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para normalizar la ruta en entornos serverless (Netlify Functions)
app.use((req, res, next) => {
  // Eliminar prefijos de funciones de Netlify o /api para que las rutas coincidan limpiamente
  req.url = req.url.replace(/^\/\.netlify\/functions\/api/, '');
  req.url = req.url.replace(/^\/api/, '');
  if (!req.url.startsWith('/')) req.url = '/' + req.url;
  next();
});

// Router para endpoints de la API
const apiRouter = express.Router();

// ==============================================================
// RUTAS DE AUTENTICACIÓN
// ==============================================================

// 0.1 Obtener configuración pública de autenticación
apiRouter.get('/auth/config', (req, res) => {
  res.json({
    googleClientId: auth.getGoogleClientId(),
    hasGoogleConfig: Boolean(auth.getGoogleClientId()),
    defaultOwner: db.DEFAULT_OWNER_EMAIL
  });
});

// 0.2 Iniciar sesión con Google (recibe credencial JWT de GIS)
apiRouter.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Falta la credencial de Google' });
    }

    const userData = await auth.verifyGoogleCredential(credential);
    const token = auth.createSessionToken(userData);

    res.json({
      token,
      user: {
        email: userData.email,
        name: userData.name,
        picture: userData.picture
      }
    });
  } catch (error) {
    console.error('Error al autenticar con Google:', error.message);
    res.status(401).json({ error: 'No se pudo verificar la credencial de Google: ' + error.message });
  }
});

// 0.3 Inicio de sesión de desarrollo / demostración local
apiRouter.post('/auth/dev-login', (req, res) => {
  try {
    const email = (req.body.email || db.DEFAULT_OWNER_EMAIL).toLowerCase().trim();
    const name = req.body.name || (email === db.DEFAULT_OWNER_EMAIL ? 'Alfonso Segovia' : email.split('@')[0]);
    const picture = req.body.picture || '';

    const user = { email, name, picture };
    const token = auth.createSessionToken(user);

    res.json({
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar sesión' });
  }
});

// 0.4 Obtener perfil de la sesión actual
apiRouter.get('/auth/me', auth.requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ==============================================================
// RUTAS DE GESTIÓN DE ENLACES (PROTEGIDAS POR USUARIO)
// ==============================================================

// 1. Analizar URL
apiRouter.post('/analyze', auth.requireAuth, async (req, res) => {
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

// 2. Obtener enlaces del usuario con filtros
apiRouter.get('/links', auth.requireAuth, async (req, res) => {
  try {
    const { search, category, contentType, source, isFavorite, sort } = req.query;
    const links = await db.getAllLinks({
      userEmail: req.user.email,
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

// 3. Obtener un enlace por ID (perteneciente al usuario)
apiRouter.get('/links/:id', auth.requireAuth, async (req, res) => {
  try {
    const link = await db.getLinkById(req.params.id, req.user.email);
    if (!link) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Crear nuevo enlace asociado al usuario autenticado
apiRouter.post('/links', auth.requireAuth, async (req, res) => {
  try {
    const data = req.body;
    if (!data.url) {
      return res.status(400).json({ error: 'La URL es requerida' });
    }

    const created = await db.createLink(data, req.user.email);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error al guardar enlace:', error);
    res.status(500).json({ error: 'No se pudo guardar el enlace' });
  }
});

// 5. Actualizar enlace del usuario
apiRouter.put('/links/:id', auth.requireAuth, async (req, res) => {
  try {
    const updated = await db.updateLink(req.params.id, req.body, req.user.email);
    if (!updated) {
      return res.status(404).json({ error: 'Enlace no encontrado o no tienes permisos' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar enlace:', error);
    res.status(500).json({ error: 'Error al actualizar enlace' });
  }
});

// 6. Alternar favorito
apiRouter.patch('/links/:id/favorite', auth.requireAuth, async (req, res) => {
  try {
    const result = await db.toggleFavorite(req.params.id, req.user.email);
    if (!result) {
      return res.status(404).json({ error: 'Enlace no encontrado' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Eliminar enlace
apiRouter.delete('/links/:id', auth.requireAuth, async (req, res) => {
  try {
    const success = await db.deleteLink(req.params.id, req.user.email);
    if (!success) {
      return res.status(404).json({ error: 'Enlace no encontrado o ya eliminado' });
    }
    res.json({ message: 'Enlace eliminado correctamente', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Estadísticas del usuario
apiRouter.get('/stats', auth.requireAuth, async (req, res) => {
  try {
    const stats = await db.getStats(req.user.email);
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Exportar SQLite .db
apiRouter.get('/export/db', auth.requireAuth, async (req, res) => {
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

// 10. Exportar enlaces del usuario a JSON
apiRouter.get('/export/json', auth.requireAuth, async (req, res) => {
  try {
    const links = await db.exportAllLinks(req.user.email);
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="linkvault_export_${req.user.email.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.json"`);
    res.send(JSON.stringify(links, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar a JSON' });
  }
});

// 11. Importar JSON para el usuario autenticado
apiRouter.post('/import/json', auth.requireAuth, async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Se esperaba un arreglo JSON con enlaces' });
    }

    const result = await db.importLinks(items, req.user.email);
    res.json({ message: `Se importaron ${result.imported} enlaces exitosamente`, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Montar router
app.use(apiRouter);

// Iniciar servidor SOLO si se ejecuta directamente con `node server.js`
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 LinkVault Servidor activo en: http://localhost:${PORT}`);
    console.log(`📡 Motor de Base de Datos: ${db.isCloud() ? 'Turso Cloud SQLite' : 'SQLite Local (' + db.getDbPath() + ')'}`);
    console.log(`👤 Propietario de enlaces heredados: ${db.DEFAULT_OWNER_EMAIL}`);
    console.log(`🔑 Google Auth: ${auth.getGoogleClientId() ? 'Configurado (' + auth.getGoogleClientId().slice(0, 15) + '...)' : 'Modo desarrollo / Listo para GOOGLE_CLIENT_ID'}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
