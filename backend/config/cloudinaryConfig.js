// config/cloudinaryConfig.js - Configuration et validation de Cloudinary
import { v2 as cloudinary } from "cloudinary";
import config from "./index.js";

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Fonction pour vérifier la connexion Cloudinary
export const testCloudinaryConnection = async () => {
  try {
    console.log("☁️ Test de connexion Cloudinary...");

    if (
      !config.cloudinary.cloudName ||
      !config.cloudinary.apiKey ||
      !config.cloudinary.apiSecret
    ) {
      console.error("❌ Configuration Cloudinary manquante");
      return { success: false, error: "Configuration manquante" };
    }

    // Test de connexion via API call simple
    const result = await cloudinary.api.ping();

    if (result && result.status === "ok") {
      console.log("✅ Connexion Cloudinary établie avec succès");
      console.log(`📱 Cloud Name: ${config.cloudinary.cloudName}`);
      console.log(
        `🔑 API Key: ${config.cloudinary.apiKey?.substring(0, 8)}...`,
      );
      return { success: true, message: "Connexion réussie" };
    } else {
      console.error("❌ Réponse inattendue de Cloudinary:", result);
      return { success: false, error: "Réponse invalide" };
    }
  } catch (error) {
    console.error("❌ Erreur de connexion Cloudinary:", error.message);
    return { success: false, error: error.message };
  }
};

// Fonction pour uploader une image
export const uploadImage = async (fileBuffer, folder = "djulah") => {
  try {
    console.log("📤 Upload d'image vers Cloudinary...");

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: folder,
            quality: "auto",
            fetch_format: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(fileBuffer);
    });

    console.log("✅ Image uploadée avec succès:", result.secure_url);
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
    };
  } catch (error) {
    console.error("❌ Erreur upload image:", error.message);
    return { success: false, error: error.message };
  }
};

// Fonction pour supprimer une image
export const deleteImage = async (publicId) => {
  try {
    console.log("🗑️ Suppression de l'image:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log("✅ Image supprimée avec succès");
      return { success: true };
    } else {
      console.error("❌ Échec suppression image:", result);
      return { success: false, error: result.result };
    }
  } catch (error) {
    console.error("❌ Erreur suppression image:", error.message);
    return { success: false, error: error.message };
  }
};

// Export de l'instance cloudinary
export default cloudinary;
