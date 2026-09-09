require('dotenv').config();
const path = require('path');
const fs = require('fs');
const os = require('os');

// Detección de entorno Serverless (Netlify / AWS Lambda)
const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

const isTursoCloud = Boolean(process.env.TURSO_DATABASE_URL);

// Determinar ruta de base de datos local
let LOCAL_DB_PATH = '';
if (!isTursoCloud) {
  if (isServerless) {
    // En Lambda/Netlify el único directorio con permisos de escritura es /tmp
    LOCAL_DB_PATH = path.join(os.tmpdir(), 'links.db');
  } else {
    const DB_DIR = path.join(__dirname, '..', 'data');
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('No se pudo crear carpeta data local:', e.message);
    }
    LOCAL_DB_PATH = path.join(DB_DIR, 'links.db');
  }
}

let client = null;

function getClient() {
  if (!client) {
    if (isTursoCloud) {
      console.log('📡 Conectando a Turso Cloud SQLite:', process.env.TURSO_DATABASE_URL);
      // Usar cliente web puro en JS (sin dependencias binarias nativas C++ para Lambda)
      const { createClient } = require('@libsql/client/web');
      client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
      });
    } else {
      console.log('📁 Usando SQLite local en:', LOCAL_DB_PATH);
      const { createClient } = require('@libsql/client');
      client = createClient({
        url: `file:${LOCAL_DB_PATH}`
      });
    }
  }
  return client;
}

let schemaInitialized = false;

// Datos de demostración iniciales para cuando la base de datos está vacía
const INITIAL_DEMO_LINKS = [
  {
    url: 'https://www.facebook.com/share/r/1Vi1Fowant/',
    title: '11 comandos que convierten ChatGPT en tu restaurador de fotos, tu diseñador de anuncios y tu sistema de estudio',
    description: 'Comandos y prompts clave para aprovechar la inteligencia artificial generativa con ChatGPT.',
    summary: 'Video corto de Facebook Reels donde se explican 11 comandos prácticos para restaurar fotos, mejorar imágenes y optimizar el estudio usando ChatGPT.',
    source: 'Facebook',
    content_type: 'video',
    category: 'Tecnología',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
    is_favorite: 1,
    notes: 'Revisar comandos /restore y /upscale para imágenes.',
    tags: 'chatgpt, ia, prompts, facebook'
  },
  {
    url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    title: 'Python for Beginners - Full Course (Tutorial)',
    description: 'Aprende programación desde cero con Python en este curso completo y detallado.',
    summary: 'Curso interactivo en video donde se enseñan los fundamentos de la programación en Python: variables, funciones, bucles y estructuras de datos.',
    source: 'YouTube',
    content_type: 'video',
    category: 'Educativo',
    thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80',
    is_favorite: 1,
    notes: 'Excelente referencia para repasar sintaxis básica.',
    tags: 'python, programacion, tutorial'
  },
  {
    url: 'https://www.tiktok.com/@fitnesscoach/video/723456789',
    title: 'Rutina HIIT de 15 Minutos para Quemar Grasa en Casa',
    description: 'Ejercicios intensos de calistenia y cardio sin equipo.',
    summary: 'Video corto de TikTok con rutina exprés de 5 ejercicios combinados (burpees, sentadillas con salto y plancha) para realizar en casa sin pesas.',
    source: 'TikTok',
    content_type: 'video',
    category: 'Ejercicios',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    is_favorite: 1,
    notes: 'Hacerla los martes y jueves por la mañana.',
    tags: 'hiit, cardio, fitness, casa'
  },
  {
    url: 'https://www.eventbrite.com/e/global-business-marketing-summit-2026-tickets-998877',
    title: 'Cumbre Global de Emprendimiento y Finanzas 2026',
    description: 'Conferencia presencial y virtual sobre inversiones, escalamiento de startups y marketing digital.',
    summary: 'Evento para líderes empresariales y fundadores de startups. Incluye paneles con inversores ángel y talleres de crecimiento B2B.',
    source: 'Eventbrite',
    content_type: 'evento',
    category: 'Negocios',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
    is_favorite: 0,
    notes: 'El registro temprano vence a fin de mes.',
    tags: 'conferencia, negocios, startups, inversion'
  },
  {
    url: 'https://www.instagram.com/reel/C89abcdef/',
    title: 'Tips de Nutrición y Hábitos de Sueño para Longevidad',
    description: 'Guía práctica de un médico especialista en hábitos saludables.',
    summary: 'Publicación en Instagram con recomendaciones médicas sobre cómo regular los ritmos circadianos, la exposición a la luz matutina y alimentos antiinflamatorios.',
    source: 'Instagram',
    content_type: 'video',
    category: 'Salud',
    thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80',
    is_favorite: 0,
    notes: 'Probar cenar al menos 3 horas antes de dormir.',
    tags: 'salud, nutricion, descanso, longevidad'
  }
];

async function initSchema() {
  if (schemaInitialized) return;
  const db = getClient();

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        summary TEXT,
        source TEXT,
        content_type TEXT,
        category TEXT,
        thumbnail TEXT,
        author TEXT,
        site_name TEXT,
        status TEXT DEFAULT 'active',
        is_favorite INTEGER DEFAULT 0,
        notes TEXT,
        tags TEXT,
        is_fallback INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_category ON links(category)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_content_type ON links(content_type)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_source ON links(source)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_is_favorite ON links(is_favorite)`);

    // Auto-sembrar si la base de datos está totalmente vacía
    const countRes = await db.execute('SELECT COUNT(*) as count FROM links');
    const totalCount = countRes.rows[0]?.count || 0;
    if (totalCount === 0) {
      console.log('🌱 Sembrando datos de demostración iniciales...');
      const now = new Date().toISOString();
      for (const item of INITIAL_DEMO_LINKS) {
        await db.execute({
          sql: `
            INSERT INTO links (
              url, title, description, summary, source, content_type,
              category, thumbnail, author, site_name, status, is_favorite,
              notes, tags, is_fallback, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            item.url, item.title, item.description, item.summary, item.source,
            item.content_type, item.category, item.thumbnail, '', item.source,
            'active', item.is_favorite || 0, item.notes || '', item.tags || '',
            0, now, now
          ]
        });
      }
      console.log('✅ Datos de demostración insertados con éxito.');
    }

    schemaInitialized = true;
  } catch (err) {
    console.error('Error al inicializar el esquema de la base de datos:', err);
    throw err;
  }
}

async function getAllLinks({ search, category, contentType, source, isFavorite, sort = 'newest' } = {}) {
  await initSchema();
  const db = getClient();

  let query = 'SELECT * FROM links WHERE 1=1';
  const args = [];

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    query += ' AND (title LIKE ? OR summary LIKE ? OR description LIKE ? OR notes LIKE ? OR url LIKE ? OR tags LIKE ?)';
    args.push(s, s, s, s, s, s);
  }

  if (category && category !== 'all') {
    query += ' AND category = ?';
    args.push(category);
  }

  if (contentType && contentType !== 'all') {
    query += ' AND content_type = ?';
    args.push(contentType);
  }

  if (source && source !== 'all') {
    query += ' AND source = ?';
    args.push(source);
  }

  if (isFavorite === '1' || isFavorite === 1 || isFavorite === true) {
    query += ' AND is_favorite = 1';
  }

  switch (sort) {
    case 'oldest':
      query += ' ORDER BY id ASC';
      break;
    case 'title_asc':
      query += ' ORDER BY title COLLATE NOCASE ASC';
      break;
    case 'title_desc':
      query += ' ORDER BY title COLLATE NOCASE DESC';
      break;
    case 'newest':
    default:
      query += ' ORDER BY id DESC';
      break;
  }

  const result = await db.execute({ sql: query, args });
  return result.rows || [];
}

async function getLinkById(id) {
  await initSchema();
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT * FROM links WHERE id = ?',
    args: [Number(id)]
  });
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
}

async function createLink(data) {
  await initSchema();
  const db = getClient();
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: `
      INSERT INTO links (
        url, title, description, summary, source, content_type,
        category, thumbnail, author, site_name, status, is_favorite,
        notes, tags, is_fallback, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `,
    args: [
      data.url || '',
      data.title || 'Sin título',
      data.description || '',
      data.summary || '',
      data.source || 'Web',
      data.content_type || 'web',
      data.category || 'Otro',
      data.thumbnail || '',
      data.author || '',
      data.site_name || '',
      data.status || 'active',
      data.is_favorite ? 1 : 0,
      data.notes || '',
      data.tags || '',
      data.is_fallback ? 1 : 0,
      now,
      now
    ]
  });

  const lastId = result.lastInsertRowid;
  return await getLinkById(lastId);
}

async function updateLink(id, data) {
  await initSchema();
  const db = getClient();
  const existing = await getLinkById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  await db.execute({
    sql: `
      UPDATE links SET
        url = ?,
        title = ?,
        description = ?,
        summary = ?,
        source = ?,
        content_type = ?,
        category = ?,
        thumbnail = ?,
        author = ?,
        site_name = ?,
        status = ?,
        is_favorite = ?,
        notes = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      data.url !== undefined ? data.url : existing.url,
      data.title !== undefined ? data.title : existing.title,
      data.description !== undefined ? data.description : existing.description,
      data.summary !== undefined ? data.summary : existing.summary,
      data.source !== undefined ? data.source : existing.source,
      data.content_type !== undefined ? data.content_type : existing.content_type,
      data.category !== undefined ? data.category : existing.category,
      data.thumbnail !== undefined ? data.thumbnail : existing.thumbnail,
      data.author !== undefined ? data.author : existing.author,
      data.site_name !== undefined ? data.site_name : existing.site_name,
      data.status !== undefined ? data.status : existing.status,
      data.is_favorite !== undefined ? (data.is_favorite ? 1 : 0) : existing.is_favorite,
      data.notes !== undefined ? data.notes : existing.notes,
      data.tags !== undefined ? data.tags : existing.tags,
      now,
      Number(id)
    ]
  });

  return await getLinkById(id);
}

async function toggleFavorite(id) {
  await initSchema();
  const db = getClient();
  const existing = await getLinkById(id);
  if (!existing) return null;

  const newFav = existing.is_favorite ? 0 : 1;
  await db.execute({
    sql: 'UPDATE links SET is_favorite = ? WHERE id = ?',
    args: [newFav, Number(id)]
  });
  return { id: Number(id), is_favorite: newFav };
}

async function deleteLink(id) {
  await initSchema();
  const db = getClient();
  const result = await db.execute({
    sql: 'DELETE FROM links WHERE id = ?',
    args: [Number(id)]
  });
  return result.rowsAffected > 0;
}

async function getStats() {
  await initSchema();
  const db = getClient();

  const totalRes = await db.execute('SELECT COUNT(*) as count FROM links');
  const total = totalRes.rows[0]?.count || 0;

  const favRes = await db.execute('SELECT COUNT(*) as count FROM links WHERE is_favorite = 1');
  const favorites = favRes.rows[0]?.count || 0;

  const catRes = await db.execute('SELECT category, COUNT(*) as count FROM links GROUP BY category ORDER BY count DESC');
  const byCategory = catRes.rows || [];

  const typeRes = await db.execute('SELECT content_type, COUNT(*) as count FROM links GROUP BY content_type ORDER BY count DESC');
  const byContentType = typeRes.rows || [];

  const sourceRes = await db.execute('SELECT source, COUNT(*) as count FROM links GROUP BY source ORDER BY count DESC');
  const bySource = sourceRes.rows || [];

  return {
    total,
    favorites,
    byCategory,
    byContentType,
    bySource,
    isCloud: isTursoCloud
  };
}

async function exportAllLinks() {
  await initSchema();
  const db = getClient();
  const res = await db.execute('SELECT * FROM links ORDER BY id DESC');
  return res.rows || [];
}

async function importLinks(items) {
  if (!Array.isArray(items)) {
    throw new Error('El formato debe ser una lista de enlaces');
  }

  let imported = 0;
  for (const item of items) {
    if (item.url) {
      await createLink({
        url: item.url,
        title: item.title || 'Sin título',
        description: item.description || '',
        summary: item.summary || '',
        source: item.source || 'Web',
        content_type: item.content_type || 'web',
        category: item.category || 'Otro',
        thumbnail: item.thumbnail || '',
        author: item.author || '',
        site_name: item.site_name || '',
        is_favorite: item.is_favorite ? 1 : 0,
        notes: item.notes || '',
        tags: item.tags || '',
        is_fallback: item.is_fallback ? 1 : 0
      });
      imported++;
    }
  }
  return { imported };
}

function getDbPath() {
  return LOCAL_DB_PATH;
}

function isCloud() {
  return isTursoCloud;
}

module.exports = {
  getClient,
  initSchema,
  getAllLinks,
  getLinkById,
  createLink,
  updateLink,
  toggleFavorite,
  deleteLink,
  getStats,
  exportAllLinks,
  importLinks,
  getDbPath,
  isCloud
};
