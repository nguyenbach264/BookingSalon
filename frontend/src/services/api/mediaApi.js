import api from "./axiosApi";

/**
 * Upload single media file to Cloudinary and link to entity owner
 * @param {'SERVICE' | 'STYLIST' | 'SALON' | 'PRODUCT' | 'USER'} ownerType
 * @param {string} ownerId UUID of the owner entity
 * @param {File} file File object to upload
 */
export const uploadMedia = async (ownerType, ownerId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/media/${ownerType}/${ownerId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

/**
 * Upload batch media files to Cloudinary and link to entity owner
 * @param {'SERVICE' | 'STYLIST' | 'SALON' | 'PRODUCT' | 'USER'} ownerType
 * @param {string} ownerId UUID
 * @param {File[]} files Array of files
 */
export const uploadBatchMedia = async (ownerType, ownerId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await api.post(`/media/${ownerType}/${ownerId}/batch`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

/**
 * Get all active media of an owner
 */
export const getMedias = async (ownerType, ownerId) => {
  const res = await api.get(`/media/${ownerType}/${ownerId}`);
  return res.data;
};

/**
 * Set a media as primary
 */
export const setPrimaryMedia = async (ownerType, ownerId, mediaId) => {
  const res = await api.patch(`/media/${ownerType}/${ownerId}/${mediaId}/primary`);
  return res.data;
};

/**
 * Delete a media from Cloudinary and DB
 */
export const deleteMedia = async (ownerType, ownerId, mediaId) => {
  const res = await api.delete(`/media/${ownerType}/${ownerId}/${mediaId}`);
  return res.data;
};
