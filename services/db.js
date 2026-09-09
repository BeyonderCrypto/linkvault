require('dotenv').config();
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const LOCAL_DB_PATH = path.join(DB_DIR, 'links.db');

// Si existe TURSO_DATABASE_URL, nos conectamos a Turso Cloud.
// Si no, usamos el archivo local SQLite en data/links.db
const isTursoCloud = Boolean(process.env.TURSO_DATABASE_URL);

let client = null;

function getClient() {
  if (!client) {
    if (isTursoCloud) {
      console.log('📡 Conectando a Turso Cloud SQLite:', process.env.TURSO_DATABASE_URL);
      client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
      });
    } else {
      // Conexión local con archivo SQLite
      client = createClient({
        url: `file:${LOCAL_DB_PATH}`
      });
    }
  }
  return client;
}

let schemaInitialized = false;

async function initSchema() {
  if (schemaInitialized) return;
  const db = getClient();

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

  schemaInitialized = true;
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
