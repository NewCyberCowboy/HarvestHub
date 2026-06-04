/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ApiDiagnosticsDetailed.tsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState } from 'react';
import axios, { AxiosResponse } from 'axios';

type Endpoint = {
    name: string;
    method: 'GET' | 'POST';
    url: string;
    data?: any;
};

export default function ApiDiagnosticsDetailed() {
    const [results, setResults] = useState<string[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    const testEndpoints = async () => {
        setIsTesting(true);
        setResults([]);

        const endpoints: Endpoint[] = [
            {
                name: 'Products API (GET /api/Products)',
                method: 'GET',
                url: 'http://localhost:5272/api/Products'
            },
            {
                name: 'Products API (GET /Products)',
                method: 'GET',
                url: 'http://localhost:5272/Products'
            },
            {
                name: 'Auth API (POST /api/Auth/login)',
                method: 'POST',
                url: 'http://localhost:5272/api/Auth/login',
                data: { email: 'test@test.com', password: 'test123' }
            },
            {
                name: 'Categories API (GET /api/Categories)',
                method: 'GET',
                url: 'http://localhost:5272/api/Categories'
            },
            {
                name: 'Root',
                method: 'GET',
                url: 'http://localhost:5272/'
            },
        ];

        for (const endpoint of endpoints) {
            const start = Date.now();

            try {
                let response: AxiosResponse;

                if (endpoint.method === 'POST') {
                    response = await axios.post(endpoint.url, endpoint.data, {
                        timeout: 5000
                    });
                } else {
                    response = await axios.get(endpoint.url, {
                        timeout: 5000
                    });
                }

                const time = Date.now() - start;
                setResults(prev => [...prev,
                `✅ ${endpoint.name}: ${response.status} (${time}ms)`
                ]);

                if (response.data) {
                    console.log(`Response from ${endpoint.url}:`, response.data);
                }
            } catch (error: unknown) {
                const time = Date.now() - start;
                let status = 'No response';
                let message = 'Unknown error';

                if (error && typeof error === 'object' && 'response' in error) {
                    const axiosError = error as { response?: { status?: number } };
                    status = String(axiosError.response?.status || 'No response');
                }

                if (error instanceof Error) {
                    message = error.message;
                }

                setResults(prev => [...prev,
                `❌ ${endpoint.name}: ${status} - ${message} (${time}ms)`
                ]);
                console.error(`Error from ${endpoint.url}:`, error);
            }
        }

        setIsTesting(false);
    };

    return (
        <div className="p-4 border rounded-lg bg-white shadow">
            <h3 className="font-bold text-lg mb-3">Детальная диагностика API</h3>
            <p className="text-sm text-gray-600 mb-4">
                Проверяем все возможные пути API
            </p>

            <button
                onClick={testEndpoints}
                disabled={isTesting}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {isTesting ? 'Тестируем...' : 'Запустить диагностику'}
            </button>

            <div className="space-y-2">
                {results.map((result, index) => (
                    <div key={index} className={`p-2 border rounded ${result.includes('✅') ? 'bg-green-50' :
                            result.includes('❌') ? 'bg-red-50' : 'bg-gray-50'
                        }`}>
                        <code className="text-sm">{result}</code>
                    </div>
                ))}
            </div>
        </div>
    );
}