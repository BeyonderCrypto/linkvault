const assert = require('assert');
const db = require('../services/db');
const analyzer = require('../services/analyzer');
const auth = require('../services/auth');

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

  // Test 5: Asociación de enlaces a alfonso.segoviam@gmail.com
  console.log('5. Verificando vinculación de enlaces existentes a alfonso.segoviam@gmail.com...');
  await db.initSchema();
  const alfonsoLinks = await db.getAllLinks({ userEmail: 'alfonso.segoviam@gmail.com' });
  assert.ok(alfonsoLinks.length > 0, 'Debe tener enlaces asociados');
  const allBelongToAlfonso = alfonsoLinks.every(l => l.user_email === 'alfonso.segoviam@gmail.com');
  assert.strictEqual(allBelongToAlfonso, true, 'Todos los enlaces deben pertenecer a alfonso.segoviam@gmail.com');
  console.log(`   ✅ Enlaces asociados a alfonso.segoviam@gmail.com OK (${alfonsoLinks.length} enlaces confirmados)`);

  // Test 6: Aislamiento estricto multi-usuario
  console.log('6. Probando aislamiento de datos entre distintos usuarios...');
  const testUserEmail = 'usuario_prueba_2026@gmail.com';
  
  // El nuevo usuario no debe ver los enlaces de Alfonso
  const newUserData = await db.getAllLinks({ userEmail: testUserEmail });
  assert.strictEqual(newUserData.length, 0, 'El nuevo usuario debe comenzar con 0 enlaces');

  // Crear un enlace para el nuevo usuario
  const userLink = await db.createLink({
    url: 'https://otro-enlace.com/guia',
    title: 'Guía del Nuevo Usuario',
    summary: 'Resumen privado',
    category: 'Tecnología'
  }, testUserEmail);

  assert.strictEqual(userLink.user_email, testUserEmail);

  // El nuevo usuario ve 1 enlace
  const updatedUserLinks = await db.getAllLinks({ userEmail: testUserEmail });
  assert.strictEqual(updatedUserLinks.length, 1);
  assert.strictEqual(updatedUserLinks[0].title, 'Guía del Nuevo Usuario');

  // Alfonso no ve el enlace del nuevo usuario
  const alfonsoUpdated = await db.getAllLinks({ userEmail: 'alfonso.segoviam@gmail.com' });
  const hasUserLink = alfonsoUpdated.some(l => l.id === userLink.id);
  assert.strictEqual(hasUserLink, false, 'Alfonso no debe ver enlaces del otro usuario');

  // El nuevo usuario no puede actualizar ni borrar enlaces de Alfonso
  const targetAlfonsoLink = alfonsoLinks[0];
  const unauthorizedUpdate = await db.updateLink(targetAlfonsoLink.id, { title: 'Hackeado' }, testUserEmail);
  assert.strictEqual(unauthorizedUpdate, null, 'Un usuario no puede editar enlaces ajenos');

  const unauthorizedDelete = await db.deleteLink(targetAlfonsoLink.id, testUserEmail);
  assert.strictEqual(unauthorizedDelete, false, 'Un usuario no puede borrar enlaces ajenos');

  // Limpiar enlace de prueba del nuevo usuario
  await db.deleteLink(userLink.id, testUserEmail);
  console.log('   ✅ Aislamiento multi-usuario verificado exitosamente');

  // Test 7: Autenticación de sesiones y tokens JWT
  console.log('7. Probando generación y validación de tokens de sesión...');
  const sampleUser = { email: 'alfonso.segoviam@gmail.com', name: 'Alfonso Segovia' };
  const token = auth.createSessionToken(sampleUser);
  assert.ok(typeof token === 'string' && token.split('.').length === 3, 'Debe generar token JWT válido');

  const verified = auth.verifySessionToken(token);
  assert.strictEqual(verified.email, 'alfonso.segoviam@gmail.com');
  assert.strictEqual(verified.name, 'Alfonso Segovia');

  const invalidToken = auth.verifySessionToken('token.invalido.123');
  assert.strictEqual(invalidToken, null, 'Token manipulado debe retornar null');
  console.log('   ✅ Generación y verificación de tokens de sesión OK');

  // Test 8: Exportación aislada por usuario
  console.log('8. Probando exportación JSON aislada por usuario...');
  const exportItems = await db.exportAllLinks('alfonso.segoviam@gmail.com');
  assert.ok(Array.isArray(exportItems), 'Debe retornar arreglo de enlaces');
  assert.strictEqual(exportItems.every(l => l.user_email === 'alfonso.segoviam@gmail.com'), true);
  console.log(`   ✅ Exportación OK (${exportItems.length} enlaces exportados para alfonso.segoviam@gmail.com)`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO!\n');
}

runTests().catch(err => {
  console.error('❌ Error en las pruebas:', err);
  process.exit(1);
});
