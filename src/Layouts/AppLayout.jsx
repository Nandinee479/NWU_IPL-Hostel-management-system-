import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard, BedDouble, Users, CalendarCheck, CreditCard,
    Hotel, Menu, X, ChevronRight, LogOut, Coffee, FileText, MessageSquare,     ClipboardCheck, DollarSign
} from 'lucide-react';
import { Utensils } from 'lucide-react';
import { useAuth } from '../AuthContext';

// admin sidebar menu
const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/RoomManagement', label: 'Room Management', icon: BedDouble },
    { href: '/student-management', label: 'Student Management', icon: Users },
    { href: '/meal-entry', label: 'Meal Entry', icon: Utensils },
    { href: '/complain', label: 'Complain', icon: CalendarCheck },
    { href: '/payments', label: 'Payments', icon: CreditCard },
    { href: '/student-order', label: 'Student Orders', icon: Coffee },
    { href: '/registration', label: 'Registration', icon: ClipboardCheck },
];

// student sidebar menu
const studentNavItems = [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/order-meal', label: 'Order Meal', icon: Coffee },
    { href: '/meal-history', label: 'Meal History', icon: FileText },
    { href: '/make-payment', label: 'Make Payment', icon: DollarSign },
    { href: '/payment-history', label: 'Payment History', icon: CreditCard },
    { href: '/complain-stu', label: 'My Complaints', icon: MessageSquare },
];

export default function AppLayout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    // dynamic menu selection
    const currentNavItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

    const isActive = (href) => {
        if (href === '/dashboard' || href === '/student') {
            return location.pathname === href;
        }
        return location.pathname.startsWith(href);
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#1e2140] text-white flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                    <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Hotel size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight">Harmony House</p>
                        <p className="text-xs text-white/50">{user?.role === 'admin' ? 'Admin Portal' : 'Student Portal'}</p>
                    </div>
                    <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
                        <X size={18} className="text-white/60" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="px-3 text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Main Menu</p>
                    {currentNavItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            to={href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                                isActive(href) ? 'bg-indigo-600 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                            {isActive(href) && <ChevronRight size={14} className="ml-auto" />}
                        </Link>
                    ))}
                </nav>

                <div className="px-4 py-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold uppercase">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-white/40 truncate capitalize">{user?.role || 'Student'}</p>
                        </div>
                        <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors" title="Logout">
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-4 shrink-0">
                    <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
                        <Menu size={22} />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
