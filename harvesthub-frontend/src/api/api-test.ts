// src/utils/api-test.ts
export const testBackendConnection = async () => {
    try {
        const response = await fetch('http://localhost:5272/api/health');
        const data = await response.json();
        console.log('✅ Бэкенд доступен:', data);
        return true;
    } catch (error) {
        console.error('❌ Бэкенд недоступен:', error);
        return false;
    }
};