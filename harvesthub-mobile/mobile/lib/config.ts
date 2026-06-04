// Backend API configuration
// For physical device testing, use your computer's IP address

const getDefaultApiUrl = () => {
  // Use your computer's IP for physical device testing
  // Replace 192.168.0.71 with your actual local IP from ipconfig
  return 'http://192.168.0.71:5272/api';
};

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

// Helper function to convert relative image paths to full URLs
export const getImageUrl = (relativePath: string | null | undefined): string => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${relativePath}`;
};
