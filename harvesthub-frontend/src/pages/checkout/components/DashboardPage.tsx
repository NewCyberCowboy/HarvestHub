import { Outlet } from 'react-router-dom';

export default function DashboardPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <h3 className="font-semibold mb-2">Total Orders</h3>
                    <p className="text-2xl font-bold">12</p>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-2">Pending</h3>
                    <p className="text-2xl font-bold">3</p>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-2">Completed</h3>
                    <p className="text-2xl font-bold">8</p>
                </div>
                <div className="card">
                    <h3 className="font-semibold mb-2">Total Spent</h3>
                    <p className="text-2xl font-bold">$458.76</p>
                </div>
            </div>
            <Outlet />
        </div>
    );
}