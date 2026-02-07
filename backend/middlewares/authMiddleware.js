import jwt from "jsonwebtoken";
import config from "../config/index.js";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login to access this resource.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    // Check if user is verified (skip in development for easier testing)
    if (!user.isVerified && config.isProd) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before accessing this resource.",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// Helper function to generate JWT token
export const generateToken = (userId, options = {}) => {
  const payload = { id: userId };
  if (options.step) payload.step = options.step;
  if (options.type) payload.type = options.type;
  const signOptions = {};
  if (options.expiresIn) signOptions.expiresIn = options.expiresIn;
  return jwt.sign(payload, config.jwt.secret, signOptions);
};
