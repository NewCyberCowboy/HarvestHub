// src/components/TestConnection.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useEffect, useState } from 'react';
import { productsApi } from '@/api/products.api';
import { ProductDto } from '@/types/backend';

export default function TestConnection() {
    const [status, setStatus] = useState<string>('Проверка подключения...');
    const [products, setProducts] = useState<ProductDto[]>([]);

    const testConnection = async () => {
        try {
            setStatus('Проверяем подключение к API...');

            // Пробуем получить продукты
            const data = await productsApi.getProducts();

            setProducts(data);
            setStatus(`✅ Успешно! Загружено ${data.length} продуктов`);

        } catch (error: unknown) {
            console.error('Ошибка подключения:', error);
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setStatus(`❌ Ошибка: ${errorMessage}`);
        }
    };

    useEffect(() => {
        // Используем setTimeout для избежания синхронного вызова setState в useEffect
        const timer = setTimeout(() => {
            testConnection();
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="p-4 border rounded-lg bg-white shadow">
            <h3 className="font-bold text-lg mb-3">Тест подключения к бэкенду</h3>
            <div className={`p-3 rounded mb-3 ${status.includes('✅') ? 'bg-green-100 text-green-800' :
                    status.includes('❌') ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                }`}>
                {status}
            </div>

            {products.length > 0 && (
                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Загруженные продукты:</h4>
                    <ul className="space-y-2">
                        {products.slice(0, 5).map(product => (
                            <li key={product.productId} className="border p-2 rounded">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-600">
                                    Цена: {product.basePrice} ₽ | Категория: {product.categoryName}
                                </div>
                            </li>
                        ))}
                    </ul>
                    {products.length > 5 && (
                        <div className="text-sm text-gray-500 mt-2">
                            и еще {products.length - 5} продуктов...
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={testConnection}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Проверить снова
            </button>
        </div>
    );
}