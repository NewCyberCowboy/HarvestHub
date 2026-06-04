import * as ImagePicker from 'expo-image-picker';

export interface ImageUploadResult {
  uri: string;
  base64?: string;
  width: number;
  height: number;
  fileSize?: number;
}

const MAX_IMAGE_WIDTH = 1024;
const MAX_IMAGE_HEIGHT = 1024;
const JPEG_QUALITY = 0.8;

export const productImagesService = {
  // Request camera permission
  requestCameraPermission: async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  },

  // Request media library permission
  requestMediaLibraryPermission: async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  },

  // Take photo with camera
  takePhoto: async (): Promise<ImageUploadResult | null> => {
    const hasPermission = await productImagesService.requestCameraPermission();
    if (!hasPermission) {
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: JPEG_QUALITY,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.uri) return null;
    return {
      uri: asset.uri,
      base64: asset.base64 ?? undefined,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize ?? undefined,
    };
  },

  // Pick image from gallery
  pickFromGallery: async (): Promise<ImageUploadResult | null> => {
    const hasPermission = await productImagesService.requestMediaLibraryPermission();
    if (!hasPermission) {
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: JPEG_QUALITY,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset.uri) return null;
    return {
      uri: asset.uri,
      base64: asset.base64 ?? undefined,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize ?? undefined,
    };
  },

  // Compress image by resizing if needed
  getCompressionInfo: (width: number, height: number): { shouldResize: boolean; targetWidth: number; targetHeight: number } => {
    let targetWidth = width;
    let targetHeight = height;
    let shouldResize = false;

    if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
      shouldResize = true;
      const aspectRatio = width / height;

      if (width > height) {
        targetWidth = MAX_IMAGE_WIDTH;
        targetHeight = Math.round(MAX_IMAGE_WIDTH / aspectRatio);
      } else {
        targetHeight = MAX_IMAGE_HEIGHT;
        targetWidth = Math.round(MAX_IMAGE_HEIGHT * aspectRatio);
      }
    }

    return { shouldResize, targetWidth, targetHeight };
  },

  // Estimate file size from base64
  estimateFileSize: (base64String: string): number => {
    // Base64 is ~4/3 of binary size
    return Math.round((base64String.length * 3) / 4);
  },

  // Upload image to backend using FormData
  uploadToBackend: async (
    uri: string,
    token: string
  ): Promise<string> => {
    const formData = new FormData();

    // Handle web vs native differently
    if (typeof window !== 'undefined' && window.location) {
      // Web version - use fetch with blob
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, 'image.jpg');
    } else {
      // Native version
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
    }

    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.71:5272/api';

    const uploadResponse = await fetch(`${API_BASE_URL}/Images/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await uploadResponse.json();
    return data.data; // Returns the image URL
  },
};
