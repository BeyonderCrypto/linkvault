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
const DEFAULT_OWNER_EMAIL = 'alfonso.segoviam@gmail.com';

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
    url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
    title: 'Learn Python - Full Course for Beginners [Tutorial]',
    description: 'This course will give you a full introduction into all of the core concepts in python.',
    summary: 'Curso exhaustivo de Python para principiantes que cubre variables, tipos de datos, estructuras de control, funciones y programación orientada a objetos básica.',
    source: 'YouTube',
    content_type: 'video',
    category: 'Educativo',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    is_favorite: 1,
    notes: 'Excelente material de referencia para principiantes o repaso rápido.',
    tags: 'python, programacion, tutorial, principiantes'
  },
  {
    url: 'https://techcrunch.com/2026/02/startups-funding-trends/',
    title: 'Global Tech Venture Investment Outlook 2026',
    description: 'An analysis of global venture capital trends in AI, climate tech and B2B SaaS.',
    summary: 'Reporte analítico que examina la evolución de rondas de inversión, la concentración en startups de IA generativa y la reactivación del mercado SaaS B2B.',
    source: 'Web',
    content_type: 'articulo',
    category: 'Negocios',
    thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    is_favorite: 0,
    notes: 'Revisar sección de valuaciones para la próxima reunión de estrategia.',
    tags: 'startups, finanzas, inversion, tecnologia, negocios'
  },
  {
    url: 'https://www.tiktok.com/@fitness_coach/video/7192837461528',
    title: 'Rutina HIIT de 15 Minutos en Casa sin Equipamiento',
    description: 'Quema calorías rápido con estos 5 ejercicios de alta intensidad.',
    summary: 'Entrenamiento dinámico por intervalos compuesto por jumping jacks, burpees adaptados, sentadillas con salto y escaladores de montaña.',
    source: 'TikTok',
    content_type: 'video',
    category: 'Ejercicios',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    is_favorite: 1,
    notes: 'Hacer los martes y jueves por la mañana.',
    tags: 'fitness, hiit, entrenamiento, ejercicios, casa'
  },
  {
    url: 'https://hubermanlab.com/optimize-your-sleep/',
    title: 'Master Your Sleep & Be More Alert When Awake | Huberman Lab Podcast',
    description: 'How to use light, temperature, and food timing to dramatically improve your sleep quality.',
    summary: 'Protocolo de neurobiología aplicada para optimizar el ritmo circadiano mediante exposición solar matutina, control térmico nocturno y suplementación específica.',
    source: 'Web',
    content_type: 'podcast',
    category: 'Salud',
    thumbnail: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80',
    is_favorite: 1,
    notes: 'Implementar la regla de luz solar antes de las 9 AM.',
    tags: 'salud, sueno, ritmo circadiano, bienestar, neurociencia'
  },
  {
    url: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide',
    title: 'Guía exhaustiva de JavaScript moderno (MDN Web Docs)',
    description: 'Recurso oficial de documentación sobre JavaScript estándar ECMAScript.',
    summary: 'Guía técnica definitiva que cubre desde fundamentos sintácticos hasta APIs modernas del DOM, Promises, async/await y módulos ES.',
    source: 'Web',
    content_type: 'articulo',
    category: 'Desarrollo de Software',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=80',
    is_favorite: 0,
    notes: 'Consultar siempre ante dudas sobre especificación oficial.',
    tags: 'javascript, mdn, documentacion, programacion, frontend'
  },
  {
    url: 'https://jamesclear.com/atomic-habits-summary',
    title: 'Resumen Clave: Hábitos Atómicos por James Clear',
    description: 'Cómo pequeños cambios de 1% provocan resultados transformadores a largo plazo.',
    summary: 'Síntesis de las 4 leyes del cambio de conducta: hacerlo obvio, atractivo, fácil y satisfactorio para diseñar hábitos sostenibles.',
    source: 'Web',
    content_type: 'articulo',
    category: 'Desarrollo Personal',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80',
    is_favorite: 1,
    notes: 'Aplicar la regla de los dos minutos en nuevas rutinas.',
    tags: 'habitos, productividad, desarrollo personal, libros'
  },
  {
    url: 'https://www.youtube.com/watch?v=5VSt_S6jBfE',
    title: 'Nutrición y Longevidad: Los Pilares del Envejecimiento Saludable',
    description: 'Conferencia médica sobre autofagia, restricción calórica y crononutrición.',
    summary: 'Revisión científica de cómo los horarios de ingesta y la densidad de nutrientes influyen en la inflamación sistémica celular y la longevidad.',
    source: 'YouTube',
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
        user_email TEXT NOT NULL DEFAULT '${DEFAULT_OWNER_EMAIL}',
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `);

    // 1. Migración segura para bases de datos existentes (locales o en Turso Cloud)
    // Verificar si la columna user_email existe en la tabla
    try {
      const tableInfo = await db.execute("PRAGMA table_info(links)");
      const columns = tableInfo.rows ? tableInfo.rows.map(col => col.name) : [];
      if (columns.length > 0 && !columns.includes('user_email')) {
        console.log('🔄 Migrando esquema: Agregando columna user_email a tabla links...');
        await db.execute(`ALTER TABLE links ADD COLUMN user_email TEXT DEFAULT '${DEFAULT_OWNER_EMAIL}'`);
      }
    } catch (colErr) {
      console.warn('Nota en verificación de columnas:', colErr.message);
    }

    // 2. Asociar todos los enlaces existentes huérfanos o sin email a alfonso.segoviam@gmail.com
    try {
      const updateResult = await db.execute({
        sql: `UPDATE links SET user_email = ? WHERE user_email IS NULL OR user_email = '' OR user_email = 'default'`,
        args: [DEFAULT_OWNER_EMAIL]
      });
      if (updateResult.rowsAffected > 0) {
        console.log(`🔗 Enlaces existentes asociados a ${DEFAULT_OWNER_EMAIL}: ${updateResult.rowsAffected}`);
      }
    } catch (updateErr) {
      console.warn('Nota en asociación de enlaces:', updateErr.message);
    }

    // 3. Crear índices para optimizar búsquedas por usuario y filtros
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_user_email ON links(user_email)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_category ON links(category)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_content_type ON links(content_type)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_source ON links(source)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_links_is_favorite ON links(is_favorite)`);

    // 4. Auto-sembrar si la base de datos está totalmente vacía
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
              notes, tags, is_fallback, user_email, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            item.url, item.title, item.description, item.summary, item.source,
            item.content_type, item.category, item.thumbnail, '', item.source,
            'active', item.is_favorite || 0, item.notes || '', item.tags || '',
            0, DEFAULT_OWNER_EMAIL, now, now
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

async function getAllLinks({
  userEmail = DEFAULT_OWNER_EMAIL,
  search,
  category,
  contentType,
  source,
  isFavorite,
  sort = 'newest'
} = {}) {
  await initSchema();
  const db = getClient();
  const targetEmail = (userEmail || DEFAULT_OWNER_EMAIL).toLowerCase().trim();

  let query = 'SELECT * FROM links WHERE user_email = ?';
  const args = [targetEmail];

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

async function getLinkById(id, userEmail = null) {
  await initSchema();
  const db = getClient();
  let query = 'SELECT * FROM links WHERE id = ?';
  const args = [Number(id)];

  if (userEmail) {
    query += ' AND user_email = ?';
    args.push(userEmail.toLowerCase().trim());
  }

  const result = await db.execute({ sql: query, args });
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
}

async function createLink(data, userEmail = DEFAULT_OWNER_EMAIL) {
  await initSchema();
  const db = getClient();
  const now = new Date().toISOString();
  const targetEmail = (userEmail || data.user_email || DEFAULT_OWNER_EMAIL).toLowerCase().trim();

  const result = await db.execute({
    sql: `
      INSERT INTO links (
        url, title, description, summary, source, content_type,
        category, thumbnail, author, site_name, status, is_favorite,
        notes, tags, is_fallback, user_email, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
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
      targetEmail,
      now,
      now
    ]
  });

  const lastId = result.lastInsertRowid;
  return await getLinkById(lastId, targetEmail);
}

async function updateLink(id, data, userEmail = null) {
  await initSchema();
  const db = getClient();
  const existing = await getLinkById(id, userEmail);
  if (!existing) return null;

  const now = new Date().toISOString();
  let query = `
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
  `;
  const args = [
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
  ];

  if (userEmail) {
    query += ' AND user_email = ?';
    args.push(userEmail.toLowerCase().trim());
  }

  await db.execute({ sql: query, args });
  return await getLinkById(id, userEmail);
}

async function toggleFavorite(id, userEmail = null) {
  await initSchema();
  const db = getClient();
  const existing = await getLinkById(id, userEmail);
  if (!existing) return null;

  const newFav = existing.is_favorite ? 0 : 1;
  let query = 'UPDATE links SET is_favorite = ? WHERE id = ?';
  const args = [newFav, Number(id)];

  if (userEmail) {
    query += ' AND user_email = ?';
    args.push(userEmail.toLowerCase().trim());
  }

  await db.execute({ sql: query, args });
  return { id: Number(id), is_favorite: newFav };
}

async function deleteLink(id, userEmail = null) {
  await initSchema();
  const db = getClient();
  let query = 'DELETE FROM links WHERE id = ?';
  const args = [Number(id)];

  if (userEmail) {
    query += ' AND user_email = ?';
    args.push(userEmail.toLowerCase().trim());
  }

  const result = await db.execute({ sql: query, args });
  return result.rowsAffected > 0;
}

async function getStats(userEmail = DEFAULT_OWNER_EMAIL) {
  await initSchema();
  const db = getClient();
  const targetEmail = (userEmail || DEFAULT_OWNER_EMAIL).toLowerCase().trim();

  const totalRes = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM links WHERE user_email = ?',
    args: [targetEmail]
  });
  const total = totalRes.rows[0]?.count || 0;

  const favRes = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM links WHERE user_email = ? AND is_favorite = 1',
    args: [targetEmail]
  });
  const favorites = favRes.rows[0]?.count || 0;

  const catRes = await db.execute({
    sql: 'SELECT category, COUNT(*) as count FROM links WHERE user_email = ? GROUP BY category ORDER BY count DESC',
    args: [targetEmail]
  });
  const byCategory = catRes.rows || [];

  const typeRes = await db.execute({
    sql: 'SELECT content_type, COUNT(*) as count FROM links WHERE user_email = ? GROUP BY content_type ORDER BY count DESC',
    args: [targetEmail]
  });
  const byContentType = typeRes.rows || [];

  const sourceRes = await db.execute({
    sql: 'SELECT source, COUNT(*) as count FROM links WHERE user_email = ? GROUP BY source ORDER BY count DESC',
    args: [targetEmail]
  });
  const bySource = sourceRes.rows || [];

  return {
    total,
    favorites,
    byCategory,
    byContentType,
    bySource,
    isCloud: isTursoCloud,
    userEmail: targetEmail
  };
}

async function exportAllLinks(userEmail = DEFAULT_OWNER_EMAIL) {
  await initSchema();
  const db = getClient();
  const targetEmail = (userEmail || DEFAULT_OWNER_EMAIL).toLowerCase().trim();
  const res = await db.execute({
    sql: 'SELECT * FROM links WHERE user_email = ? ORDER BY id DESC',
    args: [targetEmail]
  });
  return res.rows || [];
}

async function importLinks(items, userEmail = DEFAULT_OWNER_EMAIL) {
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
      }, userEmail);
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
  isCloud,
  DEFAULT_OWNER_EMAIL
};
