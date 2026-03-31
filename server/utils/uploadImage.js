import imagekit from "../config/imagekit.js";

export const uploadImage = async (file) => {
  try {
    const response = await imagekit.upload({
      file: file.buffer, // multer memory storage
      fileName: Date.now() + "-" + file.originalname,
      folder: "/uploads",
    });

    return {
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw new Error("Image upload failed");
  }
};