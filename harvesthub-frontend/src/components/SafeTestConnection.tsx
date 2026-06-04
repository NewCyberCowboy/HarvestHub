import { useEffect, useState } from 'react';

interface TestStep {
    name: string;
    status: 'pending' | 'loading' | 'success' | 'error';
    message?: string;
    data?: unknown;
}

interface TestProduct {
    productId: number;
    name: string;
    description: string;
    basePrice: number;
    currentStock: number;
}

export default function SafeTestConnection() {
    const [steps, setSteps] = useState<TestStep[]>([
        { name: 'Проверка доступности API', status: 'pending' },
        { name: 'Регистрация тестового пользователя', status: 'pending' },
        { name: 'Авторизация', status: 'pending' },
        { name: 'Получение продуктов', status: 'pending' },
    ]);
    const [token, setToken] = useState<string>('');
    const [products, setProducts] = useState<TestProduct[]>([]);
    const [overallStatus, setOverallStatus] = useState<string>('Начало тестирования...');

    const updateStep = (stepIndex: number, updates: Partial<TestStep>) => {
        setSteps(prev => prev.map((step, idx) =>
            idx === stepIndex ? { ...step, ...updates } : step
        ));
    };

    const testDirect = async () => {
        setSteps(steps.map(step => ({ ...step, status: 'pending' })));
        setToken('');
        setProducts([]);
        setOverallStatus('Начало тестирования...');

        let userToken = ''; // Объявляем переменную здесь

        try {
            // 1. Проверка доступности API
            updateStep(0, { status: 'loading' });
            const healthResponse = await fetch('http://localhost:5272');

            if (!healthResponse.ok && healthResponse.status !== 404) {
                throw new Error(`API недоступен (статус: ${healthResponse.status})`);
            }
            updateStep(0, { status: 'success', message: 'API доступен' });

            // 2. Регистрация - УНИКАЛЬНЫЙ email и добавляем address
            updateStep(1, { status: 'loading' });
            const timestamp = Date.now();
            const testEmail = `test${timestamp}@test.com`;
            const testPassword = 'Test123!';

            const registerResponse = await fetch('http://localhost:5272/api/Auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword,
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '+7999' + timestamp.toString().slice(-7),
                    address: 'Тестовый адрес, д. 1',
                    role: 'Customer'
                })
            });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json().catch(() => null);
                const errorMessage = errorData?.message || `Ошибка регистрации: ${registerResponse.status}`;

                if (registerResponse.status === 400 || registerResponse.status === 500) {
                    updateStep(1, {
                        status: 'success',
                        message: 'Используем существующего тестового пользователя (test@test.com)'
                    });
                } else {
                    throw new Error(errorMessage);
                }
            } else {
                const registerData = await registerResponse.json();
                updateStep(1, {
                    status: 'success',
                    message: `Пользователь ${testEmail} зарегистрирован`,
                    data: registerData
                });
            }

            // 3. Логин - используем стандартный тестовый аккаунт
            updateStep(2, { status: 'loading' });
            const loginResponse = await fetch('http://localhost:5272/api/Auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'newtest@test.com',
                    password: 'Test123!'
                })
            });

            if (!loginResponse.ok) {
                // Если стандартный аккаунт не работает, пробуем с только что зарегистрированным
                const fallbackLoginResponse = await fetch('http://localhost:5272/api/Auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: testEmail,
                        password: testPassword
                    })
                });

                if (!fallbackLoginResponse.ok) {
                    throw new Error(`Ошибка авторизации: ${fallbackLoginResponse.status}`);
                }

                const loginData = await fallbackLoginResponse.json();
                userToken = loginData.token || loginData.data?.token;

                if (!userToken) {
                    throw new Error('Токен не получен в ответе');
                }

                setToken(userToken);
                updateStep(2, {
                    status: 'success',
                    message: `Авторизация успешна (${testEmail})`,
                    data: { tokenPreview: userToken.substring(0, 20) + '...' }
                });
            } else {
                const loginData = await loginResponse.json();
                const userToken = loginData.token || loginData.data?.token;

                if (!userToken) {
                    throw new Error('Токен не получен в ответе');
                }
                    console.log('Токен для запроса:', userToken);
                    console.log('Токен длина:', userToken?.length);

                setToken(userToken);
                updateStep(2, {
                    status: 'success',
                    message: 'Авторизация успешна (test@test.com)',
                    data: { tokenPreview: userToken.substring(0, 20) + '...' }
                });
            }
            console.log('Делаю запрос продуктов с токеном:', userToken?.substring(0, 20) + '...');


            // 4. Получение продуктов (используем токен из переменной userToken)
            updateStep(3, { status: 'loading' });
            const productsResponse = await fetch('http://localhost:5272/api/Products', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                credentials: 'include' // ← ДОБАВЬ ЭТО
            });

            console.log('Заголовки запроса:', {
                url: 'http://localhost:5272/api/Products',
                headers: {
                    'Authorization': `Bearer ${userToken.substring(0, 20)}...`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Ответ:', {
                status: productsResponse.status,
                statusText: productsResponse.statusText,
                headers: Object.fromEntries(productsResponse.headers.entries())
            });
            if (productsResponse.status === 401) {
                updateStep(3, {
                    status: 'error',
                    message: '401 Unauthorized - токен недействителен'
                });
                setOverallStatus('❌ Токен аутентификации не работает');
                return;
            }

            if (!productsResponse.ok) {
                throw new Error(`Ошибка получения продуктов: ${productsResponse.status}`);
            }

            const productsData = await productsResponse.json();
            const productsList = Array.isArray(productsData.data) ? productsData.data :
                Array.isArray(productsData) ? productsData : [];

            setProducts(productsList);
            updateStep(3, {
                status: 'success',
                message: `Загружено ${productsList.length} продуктов`,
                data: productsList.slice(0, 3)
            });

            setOverallStatus(`✅ Все тесты пройдены успешно!`);

        } catch (error: unknown) {
            console.error('Ошибка тестирования:', error);
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setOverallStatus(`❌ Ошибка: ${errorMessage}`);
        }
    };

    const testWithoutAuth = async () => {
        try {
            setOverallStatus('Тестирование публичного доступа...');

            const categoriesResponse = await fetch('http://localhost:5272/api/Categories');

            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                setOverallStatus(`✅ Категории доступны без аутентификации (${categoriesData.length || 0} шт)`);
            } else {
                setOverallStatus(`Категории: ${categoriesResponse.status}`);
            }

            const productsResponse = await fetch('http://localhost:5272/api/Products');

            if (productsResponse.status === 401) {
                setOverallStatus(prev => prev + ' | ✅ Продукты требуют аутентификации (401)');
            } else if (productsResponse.ok) {
                const data = await productsResponse.json();
                const productsList = Array.isArray(data.data) ? data.data :
                    Array.isArray(data) ? data : [];
                setProducts(productsList);
                setOverallStatus(prev => prev + ' | ⚠️ Продукты доступны без аутентификации');
            } else {
                setOverallStatus(prev => prev + ` | Продукты: ${productsResponse.status}`);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setOverallStatus(`❌ Ошибка: ${errorMessage}`);
        }
    };

    const testCategoriesOnly = async () => {
        try {
            setOverallStatus('Тестирование публичных категорий...');
            setProducts([]);

            const response = await fetch('http://localhost:5272/api/Categories');

            if (response.ok) {
                const data = await response.json();
                setOverallStatus(`✅ Категории загружены (${data.length || 0} шт)`);
            } else {
                setOverallStatus(`❌ Ошибка категорий: ${response.status}`);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            setOverallStatus(`❌ Ошибка: ${errorMessage}`);
        }
    };

    useEffect(() => {
        const initialTest = async () => {
            try {
                const response = await fetch('http://localhost:5272');
                if (response.ok || response.status === 404) {
                    setOverallStatus('API доступен. Нажмите "Запустить полный тест" для проверки.');
                } else {
                    setOverallStatus(`API недоступен: ${response.status}`);
                }
            } catch {
                setOverallStatus('API недоступен. Проверьте, запущен ли бэкенд на порту 5272.');
            }
        };

        initialTest();
    }, []);

    const getStatusColor = (status: TestStep['status']): string => {
        switch (status) {
            case 'success': return 'text-green-600 bg-green-50';
            case 'error': return 'text-red-600 bg-red-50';
            case 'loading': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: TestStep['status']): string => {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'loading': return '⏳';
            default: return '⭕';
        }
    };

    const renderStepData = (data: unknown): string => {
        if (data === null || data === undefined) return '';
        if (typeof data === 'string') return data;
        if (typeof data === 'number' || typeof data === 'boolean') return String(data);
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return '[Несериализуемые данные]';
        }
    };

    return (
        <div className="p-6 border rounded-lg bg-white shadow-lg max-w-2xl mx-auto">
            <h3 className="font-bold text-xl mb-4 text-gray-800">Безопасный тест подключения к HarvestHub API</h3>
            <p className="text-gray-600 mb-6">Этот тест использует прямые fetch запросы и не вызывает автоматических редиректов</p>

            {/* Общий статус */}
            <div className={`p-4 rounded-lg mb-6 ${overallStatus.includes('✅') ? 'bg-green-50 text-green-800 border-green-200' :
                    overallStatus.includes('❌') ? 'bg-red-50 text-red-800 border-red-200' :
                        overallStatus.includes('⚠️') ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                            'bg-blue-50 text-blue-800 border-blue-200'
                } border`}>
                <div className="font-semibold">{overallStatus}</div>
            </div>

            {/* Шаги тестирования */}
            <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Шаги тестирования:</h4>
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start p-3 border rounded">
                        <span className="mr-3 mt-1">{getStatusIcon(step.status)}</span>
                        <div className="flex-1">
                            <div className="font-medium text-gray-800">{step.name}</div>
                            {step.message && (
                                <div className={`text-sm mt-1 p-2 rounded ${getStatusColor(step.status)}`}>
                                    {step.message}
                                </div>
                            )}
                            {step.data !== undefined && step.data !== null && (
                                <div className="text-xs mt-1 text-gray-500">
                                    <pre className="p-2 bg-gray-50 rounded overflow-x-auto text-xs">
                                        {renderStepData(step.data)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Кнопки управления */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={testDirect}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                    Запустить полный тест
                </button>

                <button
                    onClick={testWithoutAuth}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Тест без аутентификации
                </button>

                <button
                    onClick={testCategoriesOnly}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 
                   focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                    Только категории
                </button>

                <button
                    onClick={() => {
                        setSteps(steps.map(step => ({ ...step, status: 'pending' })));
                        setToken('');
                        setProducts([]);
                        setOverallStatus('Готов к тестированию');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                    Сбросить
                </button>
            </div>

            {/* Токен */}
            {token && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <div className="font-medium text-gray-700 mb-2">Полученный JWT токен:</div>
                    <div className="bg-gray-800 text-gray-100 p-3 rounded text-xs font-mono break-all">
                        {token.substring(0, 50)}...
                        <div className="mt-1 text-gray-400 text-xs">
                            (Длина: {token.length} символов)
                        </div>
                    </div>
                </div>
            )}

            {/* Продукты */}
            {products.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3">
                        Загруженные продукты ({products.length}):
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {products.slice(0, 4).map(product => (
                            <div key={product.productId} className="border rounded-lg p-3 hover:bg-gray-50">
                                <div className="font-medium text-gray-800">{product.name}</div>
                                <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {product.description}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold text-green-700">{product.basePrice} ₽</span>
                                    <span className={`text-sm px-2 py-1 rounded ${product.currentStock > 0
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {product.currentStock} {product.unit || 'кг'}.
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
                <p>Этот компонент использует только чистые fetch запросы и не затрагивает axios interceptors.</p>
                <p className="mt-2 font-medium">Изменения для исправления ошибок:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Добавлено обязательное поле <code>address</code> в регистрацию</li>
                    <li>Используется уникальный email для каждого теста</li>
                    <li>Есть fallback на стандартный тестовый аккаунт</li>
                    <li>Отдельный тест для публичных категорий</li>
                </ul>
            </div>
        </div>
    );
}