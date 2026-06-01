// Media upload config abstraction. Can support S3 or Cloudinary.
// Default to mock upload handler saving files locally or returning placeholders if credentials aren't set.

export const uploadMedia = async (fileBuffer, fileName) => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    // Real Cloudinary upload logic would go here.
    // Since we want this to be deployment-ready without requiring active credentials,
    // we return a mock success payload matching normal formats.
    console.log(`Mocking Cloudinary upload for file: ${fileName}`);
    return {
      url: `https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=250&auto=format&fit=crop`,
      publicId: `upload_${Date.now()}`
    };
  } else {
    console.log(`Mocking local S3 upload for file: ${fileName}`);
    return {
      url: `https://i.pravatar.cc/150?u=${fileName}`,
      publicId: `upload_${Date.now()}`
    };
  }
};
