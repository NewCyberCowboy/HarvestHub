// src/components/TestRegistration.tsx
import { useState } from 'react';
import { authApi } from '@/api/auth.api';

export default function TestRegistration() {
    const [status, setStatus] = useState<string>('Готов к регистрации');
    const [formData, setFormData] = useState({
        email: 'customer@test.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
        firstName: 'Иван',
        lastName: 'Иванов',
        phone: '+79991234567',
        address: 'ул. Примерная, д. 1'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const registerUser = async () => {
        try {
            setStatus('Регистрируем пользователя...');
            
            // Подготавливаем данные для C# API
            const registerData = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                address: formData.address,
                role: 'Customer'
            };
            
            const response = await authApi.register(registerData);
            
            setStatus(`✅ Успешно! Пользователь ${response.user.email} зарегистрирован`);
            console.log('Токен:', response.token);
            console.log('Пользователь:', response.user);
            
            // Сохраняем токен
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
        } catch (error: any) {
            setStatus(`❌ Ошибка: ${error.message}`);
            console.error('Детали ошибки:', error);
        }
    };

    const testLogin = async () => {
        try {
            setStatus('Пробуем войти...');
            
            const response = await authApi.login({
                email: formData.email,
                password: formData.password
            });
            
            setStatus(`✅ Вход успешен! User: ${response.user.email}`);
            
            // Сохраняем токен
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
        } catch (error: any) {
            setStatus(`❌ Ошибка входа: ${error.message}`);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-white shadow">
            <h3 className="font-bold text-lg mb-3">Тестовая регистрация и вход</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Пароль *</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Имя *</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Фамилия *</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Телефон *</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Адрес</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                </div>
            </div>
            
            <div className="flex gap-2 mb-4">
                <button
                    onClick={registerUser}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Зарегистрировать
                </button>
                
                <button
                    onClick={testLogin}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Войти
                </button>
            </div>
            
            <div className={`p-3 rounded ${
                status.includes('✅') ? 'bg-green-100' : 
                status.includes('❌') ? 'bg-red-100' : 'bg-blue-100'
            }`}>
                {status}
            </div>
        </div>
    );
}