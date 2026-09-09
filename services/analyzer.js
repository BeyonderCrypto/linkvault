const cheerio = require('cheerio');

// Plataformas conocidas y sus patrones
const PLATFORM_RULES = [
  { name: 'YouTube', regex: /(?:youtube\.com|youtu\.be)/i, defaultType: 'video' },
  { name: 'TikTok', regex: /tiktok\.com/i, defaultType: 'video' },
  { name: 'Instagram', regex: /instagram\.com/i, defaultType: 'web' },
  { name: 'Facebook', regex: /(?:facebook\.com|fb\.watch|fb\.com)/i, defaultType: 'web' },
  { name: 'X / Twitter', regex: /(?:twitter\.com|x\.com)/i, defaultType: 'articulo' },
  { name: 'LinkedIn', regex: /linkedin\.com/i, defaultType: 'articulo' },
  { name: 'Reddit', regex: /reddit\.com/i, defaultType: 'articulo' },
  { name: 'Twitch', regex: /twitch\.tv/i, defaultType: 'video' },
  { name: 'GitHub', regex: /github\.com/i, defaultType: 'web', defaultCategory: 'Tecnología' },
  { name: 'Spotify', regex: /spotify\.com/i, defaultType: 'podcast' },
  { name: 'Apple Podcasts', regex: /podcasts\.apple\.com/i, defaultType: 'podcast' },
  { name: 'SoundCloud', regex: /soundcloud\.com/i, defaultType: 'podcast' },
  { name: 'Eventbrite', regex: /eventbrite\./i, defaultType: 'evento' },
  { name: 'Meetup', regex: /meetup\.com/i, defaultType: 'evento' },
  { name: 'Luma', regex: /lu\.ma/i, defaultType: 'evento' },
  { name: 'Medium', regex: /medium\.com/i, defaultType: 'articulo' },
  { name: 'Substack', regex: /substack\.com/i, defaultType: 'articulo' },
  { name: 'Amazon', regex: /(?:amazon\.|amzn\.)/i, defaultType: 'producto', defaultCategory: 'Negocios' },
  { name: 'MercadoLibre', regex: /mercadolibre\./i, defaultType: 'producto' },
  { name: 'Wikipedia', regex: /wikipedia\.org/i, defaultType: 'articulo', defaultCategory: 'Educativo' }
];

// Diccionarios de palabras clave para categorías
const CATEGORY_KEYWORDS = {
  'Educativo': [
    'curso', 'cursos', 'tutorial', 'tutoriales', 'aprende', 'aprender', 'educacion', 'educativo',
    'clase', 'universidad', 'escuela', 'estudio', 'estudiar', 'ciencia', 'historia', 'leccion',
    'academia', 'masterclass', 'investigacion', 'diplomado', 'capacitacion', 'guia', 'apuntes',
    'didactico', 'profesor', 'pedagogia', 'matematicas', 'fisica', 'quimica', 'filosofia',
    'how to', 'learn', 'learning', 'education', 'course', 'tutorial', 'lecture', 'teaching', 'guide'
  ],
  'Negocios': [
    'negocio', 'negocios', 'finanzas', 'financiero', 'dinero', 'inversion', 'inversiones', 'invertir',
    'emprendimiento', 'emprendedor', 'startup', 'startups', 'marketing', 'ventas', 'vender', 'b2b',
    'economia', 'economico', 'liderazgo', 'empresa', 'empresas', 'empresarial', 'ecommerce',
    'monetizar', 'crypto', 'cripto', 'bitcoin', 'acciones', 'bolsa de valores', 'trading', 'gestion',
    'business', 'finance', 'investing', 'money', 'sales', 'wealth', 'management', 'revenue'
  ],
  'Salud': [
    'salud', 'medicina', 'medico', 'doctor', 'nutricion', 'nutricional', 'dieta', 'enfermedad',
    'sintomas', 'terapia', 'psicologia', 'salud mental', 'bienestar', 'farmacia', 'medicamento',
    'clinica', 'alimentos saludables', 'vitaminas', 'recuperacion', 'inmunologico', 'pediatria',
    'cardiologia', 'ansiedad', 'depresion', 'estres', 'dormir', 'health', 'medicine', 'mental health',
    'wellness', 'nutrition', 'therapy', 'disease', 'symptoms'
  ],
  'Ejercicios': [
    'ejercicio', 'ejercicios', 'gym', 'gimnasio', 'rutina', 'rutinas', 'fitness', 'workout', 'workouts',
    'pesas', 'mancuernas', 'cardio', 'crossfit', 'calistenia', 'yoga', 'pilates', 'musculo', 'musculos',
    'entrenamiento', 'entrenar', 'correr', 'running', 'atletismo', 'deportes', 'deporte', 'futbol',
    'baloncesto', 'bodybuilding', 'fuerza', 'hiit', 'estiramientos', 'aerobico', 'bici', 'ciclismo'
  ],
  'Tecnología': [
    'tecnologia', 'programacion', 'programar', 'desarrollo', 'software', 'hardware', 'codigo', 'developer',
    'python', 'javascript', 'typescript', 'ia', 'inteligencia artificial', 'ai', 'gadget', 'gadgets',
    'computadora', 'servidor', 'app', 'aplicacion', 'ciberseguridad', 'linux', 'cloud', 'devops',
    'react', 'node', 'database', 'base de datos', 'api', 'tech', 'coding', 'machine learning', 'cybersecurity'
  ],
  'Entretenimiento': [
    'entretenimiento', 'comedia', 'humor', 'meme', 'memes', 'pelicula', 'peliculas', 'serie', 'series',
    'cine', 'musica', 'cancion', 'videojuego', 'videojuegos', 'gaming', 'gamer', 'chiste', 'chistes',
    'farandula', 'concierto', 'trailer', 'anime', 'manga', 'entertainment', 'movie', 'game', 'play',
    'funny', 'fun', 'diversion'
  ]
};

// Detección de plataforma a partir de URL
function detectPlatform(urlString) {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();

    for (const rule of PLATFORM_RULES) {
      if (rule.regex.test(host)) {
        return {
          name: rule.name,
          defaultType: rule.defaultType,
          defaultCategory: rule.defaultCategory
        };
      }
    }

    // Si no coincide con ninguna conocida, extraer el dominio legible
    let cleanHost = host.replace(/^www\./, '');
    let parts = cleanHost.split('.');
    if (parts.length > 1) {
      // E.g. nytimes.com -> NYTimes o Nytimes
      let brand = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      return { name: brand, defaultType: 'web' };
    }

    return { name: 'Página Web', defaultType: 'web' };
  } catch {
    return { name: 'Página Web', defaultType: 'web' };
  }
}

// Detección de tipo de contenido
function detectContentType(url, platformInfo, meta = {}, textContent = '') {
  const urlLower = url.toLowerCase();
  const ogType = (meta.ogType || '').toLowerCase();

  // 1. Detección de eventos
  if (
    platformInfo.defaultType === 'evento' ||
    urlLower.includes('/event/') ||
    urlLower.includes('/events/') ||
    urlLower.includes('/evento/') ||
    urlLower.includes('/meetup/') ||
    meta.schemaType === 'Event' ||
    /(?:fecha|date|registro|tickets|boletos|horario|ubicacion|inscribete)/i.test(meta.title + ' ' + meta.description)
  ) {
    if (platformInfo.name === 'Eventbrite' || platformInfo.name === 'Meetup' || platformInfo.name === 'Luma' || urlLower.includes('/events/')) {
      return 'evento';
    }
  }

  // 2. Detección de videos
  if (
    platformInfo.defaultType === 'video' ||
    ogType.includes('video') ||
    meta.hasVideoTag ||
    urlLower.includes('/watch') ||
    urlLower.includes('/reel/') ||
    urlLower.includes('/reels/') ||
    urlLower.includes('/shorts/') ||
    urlLower.includes('/video/') ||
    urlLower.includes('/videos/') ||
    urlLower.endsWith('.mp4')
  ) {
    return 'video';
  }

  // 3. Detección de audio / podcast
  if (
    platformInfo.defaultType === 'podcast' ||
    ogType.includes('music') ||
    ogType.includes('audio') ||
    urlLower.includes('/podcast/') ||
    urlLower.includes('/episode/') ||
    urlLower.includes('/track/')
  ) {
    return 'podcast';
  }

  // 4. Detección de producto / tienda
  if (
    platformInfo.defaultType === 'producto' ||
    ogType.includes('product') ||
    urlLower.includes('/dp/') ||
    urlLower.includes('/item/') ||
    urlLower.includes('/p/') && (platformInfo.name === 'MercadoLibre' || platformInfo.name === 'Amazon')
  ) {
    return 'producto';
  }

  // 5. Detección de artículo / publicación
  if (
    ogType.includes('article') ||
    urlLower.includes('/blog/') ||
    urlLower.includes('/article/') ||
    urlLower.includes('/noticia/') ||
    urlLower.includes('/post/') ||
    platformInfo.name === 'Medium' ||
    platformInfo.name === 'Substack' ||
    platformInfo.name === 'Wikipedia'
  ) {
    return 'articulo';
  }

  return platformInfo.defaultType || 'web';
}

// Clasificación de categoría temática
function classifyCategory(textToAnalyze, platformInfo) {
  if (platformInfo.defaultCategory) {
    return platformInfo.defaultCategory;
  }

  const normalized = (textToAnalyze || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quitar tildes para comparación uniforme

  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const kw of keywords) {
      const normalizedKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Búsqueda de palabra o frase
      const regex = new RegExp(`\\b${normalizedKw}\\b`, 'gi');
      const matches = normalized.match(regex);
      if (matches) {
        scores[category] += matches.length * (kw.length > 6 ? 2 : 1);
      }
    }
  }

  // Buscar categoría con mayor puntuación
  let bestCategory = 'Otro';
  let highestScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  return highestScore > 0 ? bestCategory : 'Otro';
}

// Generador de resumen inteligente en español
function generateSummary(title, metaDescription, pageText, contentType, platformName) {
  let summary = '';

  // Limpiar descripciones comunes
  const cleanMeta = (metaDescription || '').trim().replace(/\s+/g, ' ');

  if (cleanMeta && cleanMeta.length >= 40 && !cleanMeta.toLowerCase().includes('javascript is required')) {
    summary = cleanMeta;
  } else if (pageText && pageText.trim().length >= 60) {
    // Tomar los primeros párrafos significativos
    const paragraphs = pageText
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 30 && !p.toLowerCase().includes('cookie') && !p.toLowerCase().includes('privacy'));

    if (paragraphs.length > 0) {
      summary = paragraphs.slice(0, 2).join(' ');
    }
  }

  // Si aún está vacío o es muy escueto, crear un resumen descriptivo contextual
  if (!summary || summary.length < 25) {
    const typeLabel = {
      video: 'Contenido en formato de video',
      evento: 'Evento y convocatoria',
      articulo: 'Artículo informativo / publicación',
      podcast: 'Audio o episodio de podcast',
      producto: 'Página de producto comercial',
      web: 'Recurso web'
    }[contentType] || 'Recurso web';

    summary = `${typeLabel} publicado en ${platformName}. ${title ? `Referente a: "${title}".` : ''}`;
  }

  // Truncar si es excesivamente largo (mantenerlo claro y legible)
  if (summary.length > 380) {
    summary = summary.slice(0, 375).trim() + '...';
  }

  return summary;
}

// Fallback cuando la página no se puede leer (403, CORS, Auth wall, etc.)
function createFallbackMetadata(url, platformInfo, errorMessage = '') {
  let inferredTitle = '';
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const last = pathSegments[pathSegments.length - 1];
      inferredTitle = decodeURIComponent(last)
        .replace(/[-_]/g, ' ')
        .replace(/\.(html|php|aspx|jsp)$/i, '');
      inferredTitle = inferredTitle.charAt(0).toUpperCase() + inferredTitle.slice(1);
    }
  } catch {}

  if (!inferredTitle || inferredTitle.length < 3) {
    inferredTitle = `Enlace de ${platformInfo.name}`;
  }

  const contentType = detectContentType(url, platformInfo, { title: inferredTitle });
  const category = classifyCategory(inferredTitle + ' ' + url, platformInfo);

  return {
    url,
    title: inferredTitle,
    description: '',
    summary: `Enlace guardado de ${platformInfo.name}. El sitio requiere inicio de sesión o restringe el acceso directo para extracción de texto.`,
    source: platformInfo.name,
    content_type: contentType,
    category: category,
    thumbnail: '',
    author: '',
    site_name: platformInfo.name,
    is_fallback: 1,
    fallback_reason: errorMessage || 'Acceso restringido por la plataforma'
  };
}

// Función principal de análisis
async function analyzeUrl(urlString) {
  let url = urlString.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  const platformInfo = detectPlatform(url);

  // Intentar descargar y raspar la página
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none'
    };

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return createFallbackMetadata(url, platformInfo, `HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraer títulos posibles
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const docTitle = $('title').text();
    const h1Title = $('h1').first().text();
    const title = (ogTitle || twitterTitle || docTitle || h1Title || '').trim().replace(/\s+/g, ' ') || 'Sin título';

    // Extraer descripciones
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const twitterDescription = $('meta[name="twitter:description"]').attr('content');
    const metaDescription = $('meta[name="description"]').attr('content');
    const rawDescription = (ogDescription || twitterDescription || metaDescription || '').trim().replace(/\s+/g, ' ');

    // Extraer imagen miniatura
    const ogImage = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content') ||
                    $('link[rel="image_src"]').attr('href') || '';

    // Extraer otros metadatos
    const ogType = $('meta[property="og:type"]').attr('content') || '';
    const siteName = $('meta[property="og:site_name"]').attr('content') || platformInfo.name;
    const author = $('meta[name="author"]').attr('content') ||
                   $('meta[property="article:author"]').attr('content') || '';

    // Detección de schema.org Event
    let schemaType = '';
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json['@type']) schemaType = json['@type'];
        if (Array.isArray(json['@graph'])) {
          const ev = json['@graph'].find(item => item['@type'] === 'Event');
          if (ev) schemaType = 'Event';
        }
      } catch {}
    });

    // Extraer texto legible para análisis semántico y resumen
    $('script, style, noscript, nav, footer, header, svg').remove();
    const pageText = $('body').text().replace(/\s+/g, ' ').slice(0, 3000);

    const metaObj = {
      title,
      description: rawDescription,
      ogType,
      schemaType,
      hasVideoTag: $('video').length > 0
    };

    // Determinar tipo de contenido
    const contentType = detectContentType(url, platformInfo, metaObj, pageText);

    // Clasificar temática
    const textForClassification = `${title} ${rawDescription} ${pageText.slice(0, 1000)} ${url}`;
    const category = classifyCategory(textForClassification, platformInfo);

    // Generar resumen
    const summary = generateSummary(title, rawDescription, pageText, contentType, siteName);

    return {
      url,
      title,
      description: rawDescription,
      summary,
      source: siteName || platformInfo.name,
      content_type: contentType,
      category,
      thumbnail: ogImage,
      author,
      site_name: siteName,
      is_fallback: 0
    };

  } catch (err) {
    // Si la solicitud falla (timeout, CORS, error de red, bloqueo bot)
    return createFallbackMetadata(url, platformInfo, err.message);
  }
}

module.exports = {
  analyzeUrl,
  detectPlatform,
  detectContentType,
  classifyCategory,
  CATEGORY_KEYWORDS
};
