const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

// Clave secreta para firmar tokens de sesión internos
const JWT_SECRET = process.env.SESSION_SECRET || 'linkvault_super_secret_session_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

let googleClient = null;
if (GOOGLE_CLIENT_ID) {
  googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
}

/**
 * Genera un token de sesión seguro usando HMAC-SHA256 nativo de Node.js
 */
function createSessionToken(user) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    email: user.email.toLowerCase().trim(),
    name: user.name || user.email.split('@')[0],
    picture: user.picture || '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60) // 14 días de validez
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifica y decodifica un token de sesión interno
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Token expirado
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Valida un ID token recibido desde Google Identity Services (GIS)
 */
async function verifyGoogleCredential(credential) {
  if (!credential) {
    throw new Error('Credencial de Google no proporcionada');
  }

  // 1. Si GOOGLE_CLIENT_ID está configurado, verificar con google-auth-library
  if (GOOGLE_CLIENT_ID) {
    if (!googleClient) {
      googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    return {
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || '',
      sub: payload.sub
    };
  }

  // 2. Si no hay GOOGLE_CLIENT_ID en .env, decodificar el payload del JWT de Google
  // para permitir funcionamiento en modo desarrollo/pruebas
  try {
    const parts = credential.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (payload.email) {
        return {
          email: payload.email.toLowerCase().trim(),
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture || '',
          sub: payload.sub || ''
        };
      }
    }
  } catch (err) {
    console.warn('No se pudo decodificar credencial cruda:', err.message);
  }

  throw new Error('Credencial de Google inválida');
}

/**
 * Middleware Express para requerir autenticación en endpoints protegidos
 */
function requireAuth(req, res, next) {
  let token = null;

  // Leer desde header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    // Permitir token por query param para descargas directas de exportación
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED'
    });
  }

  const user = verifySessionToken(token);
  if (!user) {
    return res.status(401).json({
      error: 'Sesión inválida o expirada. Por favor vuelve a iniciar sesión.',
      code: 'AUTH_EXPIRED'
    });
  }

  req.user = user;
  next();
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  verifyGoogleCredential,
  requireAuth,
  getGoogleClientId: () => GOOGLE_CLIENT_ID
};

