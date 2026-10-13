import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { adminApi } from './admin.service';
import { API_BASE_URL } from './api';

/**
 * Converts a relative backend upload path (e.g. /uploads/img_123.jpg)
 * into a fully qualified URL for React Native <Image /> components.
 */
export const resolveImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }

  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Prepend backend host (strip trailing /api)
  const hostBase = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${hostBase}${cleanPath}`;
};

/**
 * Pick image from library and upload to backend
 */
export const pickAndUploadImage = async (options?: {
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> => {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission Denied',
        'Please grant access to your photo library to upload custom images.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: options?.aspect || [4, 3],
      quality: options?.quality || 0.75,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Upload Error', 'Could not extract image data. Please try another image.');
      return null;
    }

    const mime = asset.mimeType || 'image/jpeg';
    const dataUri = `data:${mime};base64,${asset.base64}`;

    const res = await adminApi.post('/admin/upload-base64', {
      base64: dataUri,
      filename: asset.fileName || 'custom_upload.jpg',
    });

    if (res.data?.success && res.data?.data?.url) {
      return res.data.data.url;
    } else {
      throw new Error(res.data?.message || 'Upload failed');
    }
  } catch (err: any) {
    console.error('Image picker/upload error:', err);
    Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'Failed to upload image.');
    return null;
  }
};

/**
 * Capture photo from camera and upload to backend
 */
export const captureAndUploadPhoto = async (options?: {
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> => {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission Denied',
        'Please grant camera permissions to capture photos for upload.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: options?.aspect || [4, 3],
      quality: options?.quality || 0.75,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Upload Error', 'Could not read captured photo data.');
      return null;
    }

    const mime = asset.mimeType || 'image/jpeg';
    const dataUri = `data:${mime};base64,${asset.base64}`;

    const res = await adminApi.post('/admin/upload-base64', {
      base64: dataUri,
      filename: asset.fileName || 'camera_photo.jpg',
    });

    if (res.data?.success && res.data?.data?.url) {
      return res.data.data.url;
    } else {
      throw new Error(res.data?.message || 'Upload failed');
    }
  } catch (err: any) {
    console.error('Camera capture/upload error:', err);
    Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'Failed to upload photo.');
    return null;
  }
};
