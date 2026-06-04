import { useState } from 'react';


interface LoginResponse {
    token?: string;
    data?: {
        token?: string;
    };
    message?: string;
}

export default function SimpleApiTest() {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string>('');

    const testDirectFetch = async () => {
        setLoading(true);
        setResult('Начинаем тест...\n');
        setToken('');

        try {
            // 1. Логин напрямую
            const loginResponse = await fetch('http://localhost:5272/api/Auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@test.com',
                    password: 'Test123!'
                })
            });

            setResult(prev => prev + `Логин: ${loginResponse.status}\n`);

            if (!loginResponse.ok) {
                const errorText = await loginResponse.text();
                setResult(prev => prev + `Ошибка логина: ${errorText}\n`);
                return;
            }

            const loginData: LoginResponse = await loginResponse.json();
            const userToken = loginData.token || loginData.data?.token;

            setResult(prev => prev + `Токен получен: ${userToken ? 'ДА' : 'НЕТ'}\n`);
            if (userToken) {
                setToken(userToken);
            }

            if (!userToken) {
                setResult(prev => prev + `Данные ответа: ${JSON.stringify(loginData)}\n`);
                return;
            }

            // 2. Проверяем продукты с токеном
            const productsResponse = await fetch('http://localhost:5272/api/Products', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                }
            });

            setResult(prev => prev + `Продукты: ${productsResponse.status}\n`);

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                const productsCount = Array.isArray(productsData)
                    ? productsData.length
                    : Array.isArray(productsData.data)
                        ? productsData.data.length
                        : 'unknown';
                setResult(prev => prev + `Успех! Продуктов: ${productsCount}\n`);
            } else {
                const errorText = await productsResponse.text();
                setResult(prev => prev + `Ошибка продуктов: ${errorText}\n`);
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setResult(prev => prev + `Исключение: ${errorMessage}\n`);
        } finally {
            setLoading(false);
        }
    };

    const testWithCurlCommand = () => {
        const curl = `curl -X POST http://localhost:5272/api/Auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@test.com","password":"Test123!"}'`;

        setResult(curl + '\n\nЗапусти эту команду в терминале и покажи результат');
    };

    const testTokenManually = async () => {
        if (!token) {
            setResult('Сначала получите токен через "Запустить тест"');
            return;
        }

        setLoading(true);
        try {
            // Пробуем разные варианты заголовков
            const headersList = [
                { name: 'Bearer token', value: `Bearer ${token}` },
                { name: 'Simple token', value: token },
                { name: 'No auth', value: '' }
            ];

            for (const header of headersList) {
                const startTime = Date.now();
                const response = await fetch('http://localhost:5272/api/Products', {
                    headers: header.value
                        ? { 'Authorization': header.value, 'Content-Type': 'application/json' }
                        : { 'Content-Type': 'application/json' }
                });
                const time = Date.now() - startTime;

                setResult(prev => prev + `\n${header.name}: ${response.status} (${time}ms)\n`);
                if (!response.ok) {
                    const text = await response.text();
                    setResult(prev => prev + `Ошибка: ${text}\n`);
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setResult(prev => prev + `\nИсключение: ${errorMessage}\n`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-white">
            <h3 className="font-bold text-lg mb-3">Простой тест API</h3>

            <div className="space-y-3">
                <button
                    onClick={testDirectFetch}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                    {loading ? 'Тестируем...' : 'Запустить тест'}
                </button>

                <button
                    onClick={testTokenManually}
                    disabled={loading || !token}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
                >
                    Тестировать токен
                </button>

                <button
                    onClick={testWithCurlCommand}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Показать curl команду
                </button>

                <button
                    onClick={() => {
                        setResult('');
                        setToken('');
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Очистить
                </button>
            </div>

            {token && (
                <div className="mt-4 p-3 bg-gray-100 border rounded">
                    <div className="font-medium mb-1">Токен (первые 50 символов):</div>
                    <code className="text-xs break-all">{token.substring(0, 50)}...</code>
                </div>
            )}

            {result && (
                <div className="mt-4 p-3 bg-gray-50 border rounded">
                    <div className="font-medium mb-2">Результат:</div>
                    <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
                </div>
            )}

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="font-medium text-yellow-800">Что проверить:</p>
                <ol className="list-decimal pl-5 mt-1 space-y-1 text-yellow-700">
                    <li>Запущен ли бэкенд на порту 5272</li>
                    <li>Существует ли пользователь test@test.com с паролем Test123!</li>
                    <li>Проверьте логи бэкенда после нажатия кнопки</li>
                    <li>Попробуйте curl команду в терминале</li>
                </ol>
            </div>
        </div>
    );
}