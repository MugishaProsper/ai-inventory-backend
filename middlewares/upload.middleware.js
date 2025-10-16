import cloudinary from "../config/cloudinary.config.js";

export const uploadImage = (folder) => {
  return async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder
      });
      req.imageUrl = result.secure_url;
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  }
}

export const uploadImages = (folder) => {
  return async (req, res, next) => {
    try {
      const files = req.files;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return next();
      }
      const uploads = await Promise.all(files.map((f) => cloudinary.uploader.upload(f.path, { folder })));
      req.imageUrls = uploads.map(u => u.secure_url);
      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  }
}