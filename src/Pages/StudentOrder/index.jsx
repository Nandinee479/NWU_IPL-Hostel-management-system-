import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Utensils, Coffee, Sun, Moon, Search, Calendar, Inbox } from 'lucide-react';

export default function StudentOrders() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, breakfast: 0, lunch: 0, dinner: 0 });

    useEffect(() => {
        const fetchAllOrders = async () => {
            try {
                const q = query(collection(db, "meal_orders"), orderBy("date", "desc"));
                const querySnapshot = await getDocs(q);
                
                const ordersList = [];
                let total = 0, breakfast = 0, lunch = 0, dinner = 0;

                // Loop through each order document and fetch the real student name if necessary
                for (const document of querySnapshot.docs) {
                    const data = document.data();
                    let realName = data.studentName;

                    // If the name in Firestore is just 'Student' or empty, fetch the actual name from the users collection
                    if (!realName || realName === 'Student') {
                        if (data.studentId) {
                            const userDocRef = doc(db, "users", data.studentId);
                            const userDocSnap = await getDoc(userDocRef);
                            if (userDocSnap.exists()) {
                                realName = userDocSnap.data().name || 'Unknown Student';
                            }
                        }
                    }

                    ordersList.push({ 
                        id: document.id, 
                        ...data,
                        studentName: realName || 'Student' // Set the actual name in the object
                    });

                    if (data.breakfast) breakfast++;
                    if (data.lunch) lunch++;
                    if (data.dinner) dinner++;
                    total++;
                }

                setOrders(ordersList);
                setStats({ total, breakfast, lunch, dinner });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching student orders:", error);
                setLoading(false);
            }
        };

        fetchAllOrders();
    }, []);

    const filteredOrders = orders.filter(order => 
        order.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.date?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AppLayout title="Student Meal Orders">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Student Meal Orders...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Student Meal Orders">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Student Meal Orders</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor all pre-ordered meals submitted by students</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit"><Utensils size={18} /></div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.total}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Active applications</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl w-fit"><Coffee size={18} /></div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Breakfasts</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.breakfast}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">To be prepared</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-cyan-50 text-cyan-500 rounded-xl w-fit"><Sun size={18} /></div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lunches</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.lunch}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">To be prepared</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl w-fit"><Moon size={18} /></div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dinners</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.dinner}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">To be prepared</p>
                    </div>
                </div>
            </div>

            {/* Student Orders Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50">
                    <div>
                        <h2 className="font-bold text-gray-800 text-base">All Active Pre-Orders</h2>
                        <p className="text-[11px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">{filteredOrders.length} active records</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            placeholder="Search by student or date..." 
                            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Inbox size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                        <p className="text-sm font-semibold">No student orders found</p>
                        <p className="text-xs text-gray-400 mt-1">When students pre-order meals, they will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/20">
                                    <th className="px-8 py-4">Student</th>
                                    <th className="px-6 py-4">Target Date</th>
                                    <th className="px-6 py-4 text-center">Breakfast</th>
                                    <th className="px-6 py-4 text-center">Lunch</th>
                                    <th className="px-6 py-4 text-center">Dinner</th>
                                    <th className="px-8 py-4 text-center">Total Meals</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#1e293b] flex items-center justify-center text-white font-black text-xs uppercase shadow-inner">
                                                    {order.studentName?.charAt(0) || 'S'}
                                                </div>
                                                <div className="leading-tight">
                                                    <p className="font-bold text-gray-800 text-sm">{order.studentName}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{order.studentId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-sm font-medium">{order.date || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.breakfast ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                                                {order.breakfast ? '✓' : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.lunch ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-50 text-gray-400'}`}>
                                                {order.lunch ? '✓' : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.dinner ? 'bg-purple-100 text-purple-600' : 'bg-gray-50 text-gray-400'}`}>
                                                {order.dinner ? '✓' : '—'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">
                                                {(order.breakfast ? 1 : 0) + (order.lunch ? 1 : 0) + (order.dinner ? 1 : 0)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}