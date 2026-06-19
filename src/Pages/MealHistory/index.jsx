import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { useAuth } from '../../AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Utensils, Calendar, Search, CheckCircle2, XCircle, Inbox } from 'lucide-react';

export default function MealHistory() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [meals, setMeals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalMeals: 0, averagePerDay: 0, thisMonth: 0 });

    useEffect(() => {
        const fetchMealHistory = async () => {
            if (!user?.uid) return;
            try {
                const q = query(
                    collection(db, "meal_orders"),
                    where("studentId", "==", user.uid)
                );
                const querySnapshot = await getDocs(q);
                const mealList = [];
                let total = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    mealList.push({ id: doc.id, ...data });
                    total += (data.totalCount || 0);
                });

                mealList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                setMeals(mealList);

                if (mealList.length > 0) {
                    const avg = (total / mealList.length).toFixed(1);
                    setStats({
                        totalMeals: total,
                        averagePerDay: Number(avg),
                        thisMonth: total 
                    });
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching meal history:", error);
                setLoading(false);
            }
        };

        fetchMealHistory();
    }, [user?.uid]);

    // Search filter logic
    const filteredMeals = meals.filter(meal => 
        meal.date?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AppLayout title="Meal History">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Meal History...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Meal History">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Meal History</h1>
                <p className="text-sm text-gray-500 mt-1">Track your daily meal consumption</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Meals */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit">
                        <Utensils size={18} />
                    </div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Meals</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.totalMeals}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Last 30 days</p>
                    </div>
                </div>

                {/* Average Per Day */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                        <Calendar size={18} />
                    </div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Average Per Day</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.averagePerDay}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Meals per day</p>
                    </div>
                </div>

                {/* This Month */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl w-fit">
                        <Calendar size={18} />
                    </div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This Month</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.thisMonth}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Current Month</p>
                    </div>
                </div>
            </div>

            {/* Detailed Meal History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* table header and search bar */}
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50">
                    <div>
                        <h2 className="font-bold text-gray-800 text-base">Detailed Meal History</h2>
                        <p className="text-[11px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">{filteredMeals.length} records found</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search by date..." 
                            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* table body and no data state */}
                {filteredMeals.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Inbox size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                        <p className="text-sm font-semibold">No meal records found</p>
                        <p className="text-xs text-gray-400 mt-1">Your daily meal entries will appear here once recorded.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/20">
                                    <th className="px-8 py-4">Date</th>
                                    <th className="px-6 py-4 text-center">Breakfast</th>
                                    <th className="px-6 py-4 text-center">Lunch</th>
                                    <th className="px-6 py-4 text-center">Dinner</th>
                                    <th className="px-8 py-4 text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredMeals.map((meal) => (
                                    <tr key={meal.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-8 py-5 font-bold text-gray-700 text-sm">{meal.date}</td>
                                        
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center">
                                                {meal.breakfast ? (
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                ) : (
                                                    <XCircle size={16} className="text-gray-300 opacity-60" />
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center">
                                                {meal.lunch ? (
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                ) : (
                                                    <XCircle size={16} className="text-gray-300 opacity-60" />
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center">
                                                {meal.dinner ? (
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                ) : (
                                                    <XCircle size={16} className="text-gray-300 opacity-60" />
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-8 py-5 text-center font-bold text-gray-700">
                                            {meal.totalCount ?? 0}
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
   