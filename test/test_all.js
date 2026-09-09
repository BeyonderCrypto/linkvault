const assert = require('assert');
const db = require('../services/db');
const analyzer = require('../services/analyzer');

async function runTests() {
  console.log('🧪 Iniciando pruebas automatizadas de LinkVault...\n');

  // Test 1: Detección de Plataformas
  console.log('1. Probando detección de plataformas de origen...');
  const yt = analyzer.detectPlatform('https://www.youtube.com/watch?v=123');
  assert.strictEqual(yt.name, 'YouTube', 'Debe detectar YouTube');

  const tt = analyzer.detectPlatform('https://www.tiktok.com/@user/video/456');
  assert.strictEqual(tt.name, 'TikTok', 'Debe detectar TikTok');

  const ig = analyzer.detectPlatform('https://www.instagram.com/reel/789');
  assert.strictEqual(ig.name, 'Instagram', 'Debe detectar Instagram');

  const fb = analyzer.detectPlatform('https://www.facebook.com/watch/?v=111');
  assert.strictEqual(fb.name, 'Facebook', 'Debe detectar Facebook');

  const eb = analyzer.detectPlatform('https://www.eventbrite.com/e/conferencia-123');
  assert.strictEqual(eb.name, 'Eventbrite', 'Debe detectar Eventbrite');
  console.log('   ✅ Detección de plataformas OK');

  // Test 2: Detección de Tipos de Contenido
  console.log('2. Probando detección de tipo de contenido (Video, Evento, etc.)...');
  const typeVideo = analyzer.detectContentType('https://www.youtube.com/watch?v=123', yt);
  assert.strictEqual(typeVideo, 'video', 'YouTube debe ser tipo video');

  const typeEvent = analyzer.detectContentType('https://www.eventbrite.com/e/tickets-123', eb);
  assert.strictEqual(typeEvent, 'evento', 'Eventbrite debe ser tipo evento');
  console.log('   ✅ Detección de tipo de contenido OK');

  // Test 3: Clasificación Temática
  console.log('3. Probando clasificación temática por palabras clave...');
  const catEdu = analyzer.classifyCategory('Aprende programación con este curso y tutorial paso a paso', { name: 'Web' });
  assert.strictEqual(catEdu, 'Educativo', 'Debe clasificar como Educativo');

  const catBiz = analyzer.classifyCategory('Estrategias de inversión, finanzas y marketing para startups', { name: 'Web' });
  assert.strictEqual(catBiz, 'Negocios', 'Debe clasificar como Negocios');

  const catHealth = analyzer.classifyCategory('Guía médica sobre síntomas, nutrición balanceada y salud mental', { name: 'Web' });
  assert.strictEqual(catHealth, 'Salud', 'Debe clasificar como Salud');

  const catFit = analyzer.classifyCategory('Rutina de ejercicios en el gimnasio y entrenamiento de pesas HIIT', { name: 'Web' });
  assert.strictEqual(catFit, 'Ejercicios', 'Debe clasificar como Ejercicios');
  console.log('   ✅ Clasificación temática OK');

  // Test 4: Manejo de Fallback ante enlaces bloqueados o inaccesibles
  console.log('4. Probando tolerancia a fallos (Fallback en enlaces inaccesibles)...');
  const fallbackResult = await analyzer.analyzeUrl('https://dominio-inexistente-o-bloqueado-12345.com/recurso');
  assert.strictEqual(fallbackResult.is_fallback, 1, 'Debe marcar is_fallback = 1');
  assert.ok(fallbackResult.title, 'Debe inferir un título tentativo');
  assert.ok(fallbackResult.source, 'Debe extraer un origen');
  console.log('   ✅ Fallback tolerante a fallos OK');

  // Test 5: Base de Datos Portable SQLite / Turso
  console.log('5. Probando operaciones de Base de Datos SQLite (CRUD)...');
  const created = await db.createLink({
    url: 'https://test-link.com/tutorial',
    title: 'Enlace de Prueba SQLite',
    summary: 'Resumen de prueba',
    source: 'Web',
    content_type: 'articulo',
    category: 'Educativo',
    notes: 'Nota importante de prueba'
  });
  assert.ok(created.id, 'Debe generar un ID en SQLite');

  const fetched = await db.getLinkById(created.id);
  assert.strictEqual(fetched.title, 'Enlace de Prueba SQLite', 'Debe recuperar el enlace correcto');

  // Toggle favorite
  const favResult = await db.toggleFavorite(created.id);
  assert.strictEqual(favResult.is_favorite, 1, 'Debe alternar favorito');

  // Update
  const updated = await db.updateLink(created.id, { title: 'Título Actualizado' });
  assert.strictEqual(updated.title, 'Título Actualizado');

  // Delete
  const deleted = await db.deleteLink(created.id);
  assert.strictEqual(deleted, true, 'Debe eliminar el registro');
  console.log('   ✅ Operaciones SQLite OK');

  // Test 6: Exportación de datos
  console.log('6. Probando exportación de base de datos...');
  const exportItems = await db.exportAllLinks();
  assert.ok(Array.isArray(exportItems), 'Debe retornar arreglo de enlaces');
  console.log(`   ✅ Exportación OK (${exportItems.length} enlaces exportados)`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO!\n');
}

runTests().catch(err => {
  console.error('❌ Error en las pruebas:', err);
  process.exit(1);
});
