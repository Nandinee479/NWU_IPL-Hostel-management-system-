import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../Layouts/AppLayout';
import { Utensils, Calendar, DollarSign, AlertCircle, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../AuthContext'; 
import { db } from '../../firebase'; 
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const FIXED_MONTHLY_BILL = 5000;

function getMonthsSince(d) {
    if (!d) return 1;
    const s = new Date(d);
    if (isNaN(s.getTime())) return 1;
    const n = new Date();
    const m = (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
    return Math.max(1, m + 1);
}

export default function StudentDashboard() {
    const { user } = useAuth(); 
    const [dbData, setDbData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentMeals, setRecentMeals] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [mealStats, setMealStats] = useState({ today: 0, monthly: 0 });
    const [payStats, setPayStats] = useState({ totalPaid: 0, dueAmount: 0, totalPayable: 0 });

    useEffect(() => {
        const fetchStudentData = async () => {
            if (!user?.uid) return;
            try {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const currentMonth = FULL_MONTHS[now.getMonth()];

                // 1. Fetch user doc for basic info
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                let userData = {};
                if (docSnap.exists()) userData = docSnap.data();
                setDbData(userData);

                // 2. Fetch meal orders for this student
                const mealsSnap = await getDocs(
                    query(collection(db, "meal_orders"), where("studentId", "==", user.uid))
                );
                const mealsList = [];
                let todayCount = 0, monthlyCount = 0;
                mealsSnap.forEach(doc => {
                    const d = doc.data();
                    mealsList.push({ id: doc.id, ...d });
                    const count = d.totalCount || 0;
                    if (d.date === todayStr) todayCount += count;
                    if (d.date && d.date.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)) {
                        monthlyCount += count;
                    }
                });
                mealsList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                setRecentMeals(mealsList.slice(0, 5));
                setMealStats({ today: todayCount, monthly: monthlyCount });

                // 3. Fetch payments for this student
                const paySnap = await getDocs(
                    query(collection(db, "payments"), where("studentId", "==", user.uid))
                );
                const payList = [];
                let totalPaid = 0;
                let currentMonthPaid = 0;
                const currentFullMonth = `${FULL_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
                paySnap.forEach(doc => {
                    const d = doc.data();
                    payList.push({ id: doc.id, ...d });
                    const amt = Number(d.paid || 0);
                    totalPaid += amt;
                    if (d.month === currentFullMonth) currentMonthPaid += amt;
                });
                payList.sort((a, b) => ((b.createdAt || '')).localeCompare(a.createdAt || ''));
                setPaymentHistory(payList.slice(0, 5));

                // 4. Calculate dues from total expected vs total paid
                const months = getMonthsSince(userData.createdAt);
                const totalExpected = months * FIXED_MONTHLY_BILL;
                const due = Math.max(0, totalExpected - totalPaid);
                const payable = totalPaid + due;
                setPayStats({ totalPaid, dueAmount: due, totalPayable: payable });

                setLoading(false);
            } catch (error) {
                console.error("Error fetching student data:", error);
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [user?.uid]);

    if (loading) {
        return (
            <AppLayout title="Dashboard">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Portal Data...
                </div>
            </AppLayout>
        );
    }

    const stats = [
        { label: "TODAY'S MEALS", value: String(mealStats.today), sub: "Breakfast, Lunch, Dinner", icon: Utensils, color: "text-blue-600", bgColor: "bg-blue-50" },
        { label: "MONTHLY MEALS", value: String(mealStats.monthly), sub: "This month's total", icon: Calendar, color: "text-purple-600", bgColor: "bg-purple-50" },
        { label: "TOTAL PAID", value: `৳${payStats.totalPaid.toLocaleString()}`, sub: `Out of ৳${payStats.totalPayable.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50" },
        { label: "DUE AMOUNT", value: `৳${payStats.dueAmount.toLocaleString()}`, sub: "Pending payment", icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-50" },
    ];

    return (
        <AppLayout title="Dashboard">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                    Welcome back, {dbData?.name || user?.displayName}!
                </h1>
                <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">
                    Email: {user?.email} • Room: {dbData?.room_type || 'Not Assigned'}
                </p>
            </div>

            <div className="bg-[#0b2545] text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl text-white">
                        <ShoppingBag size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base leading-tight">Pre-order Your Meals</h3>
                        <p className="text-xs text-white/60 mt-0.5">Order meals up to 7 days in advance</p>
                    </div>
                </div>
                <Link to="/order-meal" className="flex items-center gap-2 bg-white text-gray-800 px-5 py-2.5 rounded-xl text-xs font-black hover:bg-gray-100 transition-all shadow-md self-start sm:self-center">
                    <Utensils size={14} /> Order Now <ArrowRight size={14} />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 ${stat.bgColor} ${stat.color} rounded-xl`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">{stat.value}</h3>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800">Recent Meals</h3>
                            <p className="text-xs text-gray-400">Last few days</p>
                        </div>
                        <Link to="/meal-history" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                            View all <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentMeals.length === 0 ? (
                            <p className="text-gray-400 text-sm italic py-4 text-center">No recent meals recorded.</p>
                        ) : (
                            recentMeals.map((meal) => (
                                <div key={meal.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 text-gray-600 rounded-xl">
                                            <Utensils size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{meal.date}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                {[meal.breakfast && 'Breakfast', meal.lunch && 'Lunch', meal.dinner && 'Dinner'].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                        {meal.totalCount || 0} meals
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-gray-800">Payment Summary</h3>
                            <p className="text-xs text-gray-400">Current billing cycle</p>
                        </div>
                        <Link to="/payment-history" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                            History <ArrowRight size={12} />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {paymentHistory.length === 0 ? (
                            <p className="text-gray-400 text-sm italic py-4 text-center">No billing data found.</p>
                        ) : (
                            paymentHistory.map((pay) => (
                                <div key={pay.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{pay.month || pay.date}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{pay.date || ''}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 text-sm">৳{Number(pay.paid || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-green-600 font-bold mt-0.5">{pay.status}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
