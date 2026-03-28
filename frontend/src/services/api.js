/**
 * SporeNet API Service
 * Handles communication with the FastAPI backend.
 */

import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s timeout for model inference
});

/**
 * Send a microscopic image to the backend for spore detection.
 * @param {File} imageFile - The image file to analyze.
 * @param {function} onProgress - Optional progress callback (0-100).
 * @returns {Promise<object>} Detection results with risk assessment.
 */
export const predictSpores = async (imageFile, cropType = 'Unknown', onProgress = null) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('crop_type', cropType);

  const response = await apiClient.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data;
};

/**
 * Check if the backend is running and model is loaded.
 * @returns {Promise<object>} Health status.
 */
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Send a question to the general farming assistant.
 * @param {object} payload - Assistant request payload.
 * @returns {Promise<object>} Assistant reply.
 */
export const sendFarmingAssistantMessage = async ({ message, cropType = '', history = [] }) => {
  const response = await apiClient.post('/ai/chat', {
    message,
    crop_type: cropType,
    history,
  });

  return response.data;
};

/**
 * Ask the image diagnosis assistant about a completed analysis.
 * @param {object} payload - Image diagnosis payload.
 * @returns {Promise<object>} Structured diagnosis response.
 */
export const requestImageDiagnosis = async ({ analysis, cropType = '', question = '', history = [] }) => {
  const response = await apiClient.post('/ai/image-diagnosis', {
    analysis,
    crop_type: cropType,
    question,
    history,
  });

  return response.data;
};

/**
 * Get the full URL for an annotated image path.
 * @param {string} relativePath - Relative path from API response.
 * @returns {string} Full URL to the image.
 */
export const getImageUrl = (relativePath) => {
  if (!relativePath) return '';
  return `${API_BASE}${relativePath}`;
};
