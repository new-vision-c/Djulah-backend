// backend/swagger.js
import { dirname } from "path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Djulah API",
      version: "1.0.0",
      description: "API documentation for Djulah",
    },
    servers: [
      {
        url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:5000",
        description: process.env.VERCEL_URL ? "Production" : "Development",
      },
    ],
  },
  apis: ["./backend/routes/*.js", "./routes/*.js"], // Adapte selon ta structure
};

const specs = swaggerJsdoc(options);

// Configuration pour Vercel - Utilise CDN pour les assets
const swaggerOptions = {
  customCssUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js",
  ],
  explorer: true,
  customSiteTitle: "Djulah API Docs",
};

const swaggerDocs = (app) => {
  // Route pour le JSON brut
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  // Route pour l'UI avec CDN
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));
};

export default swaggerDocs;
