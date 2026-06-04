// src/utils/api-test.ts
export const testBackendConnection = async (): Promise<boolean> => {
    try {
        const response = await fetch('http://localhost:5272/api/health');
        return response.ok;
    } catch (error) {
        console.error('Бэкенд недоступен:', error);
        return false;
    }
};