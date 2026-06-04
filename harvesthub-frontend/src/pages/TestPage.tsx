import SafeTestConnection from '@/components/SafeTestConnection';
import ApiDiagnosticsDetailed from '@/components/ApiDiagnosticsDetailed';

export default function TestPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    🧪 Тестовая страница разработчика HarvestHub
                </h1>
                <p className="text-gray-600">
                    Эта страница предназначена для безопасного тестирования API без автоматических редиректов.
                    Используется для отладки проблем с аутентификацией и CORS.
                </p>
            </header>

            {/* Предупреждение */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                    <div className="text-yellow-600 mr-3 mt-1">⚠️</div>
                    <div>
                        <h3 className="font-bold text-yellow-800 mb-1">Внимание! Только для разработки</h3>
                        <p className="text-yellow-700 text-sm">
                            Эта страница предназначена только для разработки. На ней отключены стандартные
                            механизмы редиректа при 401 ошибках. В продакшене страница должна быть удалена.
                        </p>
                    </div>
                </div>
            </div>

            {/* Компоненты */}
            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">🔌 Тест подключения к API</h2>
                    <SafeTestConnection />
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Диагностика API</h2>
                    <ApiDiagnosticsDetailed />
                </section>
            </div>

            {/* Информация */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-2">⚙️ Настройки подключения</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="font-medium text-gray-700">Бэкенд API</div>
                        <code className="bg-gray-800 text-gray-100 px-2 py-1 rounded font-mono">
                            http://localhost:5272
                        </code>
                    </div>
                    <div>
                        <div className="font-medium text-gray-700">Эндпоинты</div>
                        <ul className="space-y-1 mt-1">
                            <li><code className="bg-gray-200 px-1 rounded">/api/Products</code></li>
                            <li><code className="bg-gray-200 px-1 rounded">/api/Auth/login</code></li>
                            <li><code className="bg-gray-200 px-1 rounded">/api/Auth/register</code></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}