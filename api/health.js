// api/health.js - Test simple pour Vercel
export default function handler(req, res) {
  res.status(200).json({
    status: "OK",
    service: "Djulah API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: "production",
  });
}
