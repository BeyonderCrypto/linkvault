require('dotenv').config();
const db = require('./services/db');

async function seedDemoData() {
  const existing = await db.getAllLinks();
  if (existing.length >= 5) {
    console.log(`La base de datos ya contiene ${existing.length} enlaces. Omitiendo seed.`);
    return;
  }

  const demoLinks = [
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
    },
    {
      url: 'https://github.com/features/actions',
      title: 'GitHub Actions: Automatización y CI/CD en la Nube',
      description: 'Automatiza tus flujos de trabajo de desarrollo de software con integración continua.',
      summary: 'Plataforma oficial de automatización para pipelines de compilación, pruebas y despliegue continuo de código directamente desde repositorios GitHub.',
      source: 'GitHub',
      content_type: 'web',
      category: 'Tecnología',
      thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80',
      is_favorite: 0,
      notes: 'Revisar para automatizar los tests de backend.',
      tags: 'cicd, devops, github, automatizacion'
    }
  ];

  for (const item of demoLinks) {
    await db.createLink(item);
  }

  console.log(`Se insertaron ${demoLinks.length} enlaces de demostración en SQLite/Turso.`);
}

seedDemoData().catch(console.error);
