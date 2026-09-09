# 🚀 Guía de Despliegue: LinkVault en Netlify + Turso (SQLite en la Nube)

Esta guía te muestra paso a paso cómo desplegar **LinkVault** de forma 100% gratuita utilizando **Netlify** para el frontend y funciones serverless, y **Turso** como base de datos SQLite en la nube.

---

## 📋 ¿Cómo funciona la arquitectura?
- **Netlify**: Aloja el frontend web responsivo y ejecuta las funciones de scraping (`netlify/functions/api.js`) sin restricciones de CORS.
- **Turso**: Almacena de forma persistente tus enlaces en una base de datos **SQLite distribuida en la nube**, conservando la misma velocidad, dialecto y portabilidad de SQLite.
- **Híbrido**: Cuando ejecutas el proyecto en tu máquina (`npm start`), usa automáticamente tu archivo local `data/links.db`. Cuando está en Netlify, se conecta a Turso.

---

## Paso 1: Crear tu Base de Datos SQLite gratuita en Turso

1. Entra a **[https://turso.tech](https://turso.tech)** y crea una cuenta gratuita (puedes iniciar sesión con tu cuenta de GitHub).
2. Tienes dos opciones para crear tu base de datos:

### Opción A: Desde el panel web de Turso
1. En el panel principal, haz clic en **"Create Database"**.
2. Asigna un nombre a tu base de datos (por ejemplo: `linkvault-db`).
3. Selecciona la región más cercana a ti.
4. Una vez creada, copia:
   - **Database URL**: Tiene la forma `libsql://linkvault-db-tuusuario.turso.io`.
5. Ve a la pestaña **Tokens** (o haz clic en **"Create Token"**) y genera un nuevo token de acceso. Copia este valor.

### Opción B: Usando la CLI de Turso (Opcional)
```bash
# Instalar turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Iniciar sesión
turso auth signup

# Crear base de datos
turso db create linkvault-db

# Obtener URL
turso db show linkvault-db --url

# Crear token de acceso
turso db tokens create linkvault-db
```

---

## Paso 2: Subir tu código a GitHub

Si aún no lo has subido a un repositorio de GitHub:

```bash
git init
git add .
git commit -m "LinkVault con soporte para Netlify y Turso"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/linkvault.git
git push -u origin main
```

*(El archivo `.gitignore` ya está configurado para que tus archivos locales temporales no se suban).*

---

## Paso 3: Conectar y Desplegar en Netlify

1. Inicia sesión en **[https://www.netlify.com](https://www.netlify.com)**.
2. Haz clic en **"Add new site"** > **"Import an existing project"**.
3. Selecciona **GitHub** y elige tu repositorio `linkvault`.
4. En la configuración de construcción (*Build settings*), Netlify detectará automáticamente el archivo [netlify.toml](file:///c:/proyectos/Antigravity/almacenar_link/netlify.toml):
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
5. **Configurar las Variables de Entorno en Netlify**:
   - Antes de presionar desplegar, ve a **"Environment variables"** (o en *Site configuration* > *Environment variables*):
   - Agrega las siguientes 2 variables:

| Variable | Valor |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://linkvault-db-tuusuario.turso.io` |
| `TURSO_AUTH_TOKEN` | `tu_token_generado_en_turso` |

6. Haz clic en **"Deploy Site"**.

---

## Paso 4: ¡Listo! 🎉

Netlify te generará una URL pública con HTTPS (por ejemplo: `https://linkvault-app.netlify.app`).

Al entrar desde tu computadora o desde el navegador de tu teléfono móvil:
- Podrás agregar cualquier link de YouTube, TikTok, Instagram, noticias, etc.
- Se clasificará y resumirá automáticamente en la nube.
- Todos los datos quedarán guardados en tu SQLite de Turso.
- Desde la barra inferior en tu móvil podrás buscar, filtrar por categorías y exportar tus datos a JSON cuando gustes.
