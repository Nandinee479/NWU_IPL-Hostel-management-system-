import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '../../Layouts/AppLayout';
import StatCard from '../../Components/StatCard';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FIXED_MONTHLY_BILL = 5000;

function getMonthsSince(d) {
    if (!d) return 1;
    const s = d.toDate ? d.toDate() : new Date(d);
    if (isNaN(s.getTime())) return 1;
    const n = new Date();
    const m = (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
    return Math.max(1, m + 1);
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalStudents: 0, totalCollections: 0, totalDue: 0, thisMonth: 0 });
    const [collectionData, setCollectionData] = useState([]);
    const [paymentData, setPaymentData] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const now = new Date();
                const currentFullMonth = `${FULL_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

                // 1. count approved students & get student list
                const usersSnap = await getDocs(query(collection(db, "users"), where("status", "==", "approved")));
                const totalStudents = usersSnap.size;
                const studentList = [];
                usersSnap.forEach(d => studentList.push({ id: d.id, ...d.data() }));

                // 2. get ALL payments, compute per-student current-month payment
                const paymentsSnap = await getDocs(collection(db, "payments"));
                let totalCollections = 0, totalDue = 0, thisMonth = 0;
                const monthlyMap = {};
                const studentPaymentMap = {}; // studentId -> current month paid amount
                const studentTotalMap = {};   // studentId -> total paid all time

                paymentsSnap.forEach(doc => {
                    const d = doc.data();
                    const amt = Number(d.paid || d.amount || 0);
                    const month = d.month || '';
                    const sid = d.studentId;
                    totalCollections += amt;
                    if (sid) {
                        studentTotalMap[sid] = (studentTotalMap[sid] || 0) + amt;
                    }
                    if (month === currentFullMonth) {
                        thisMonth += amt;
                        if (sid) {
                            studentPaymentMap[sid] = (studentPaymentMap[sid] || 0) + amt;
                        }
                    }
                    if (month) {
                        monthlyMap[month] = (monthlyMap[month] || 0) + amt;
                    }
                });

                // 3. compute per-student due from total expected vs total paid
                let fullyPaid = 0, partialPaid = 0, dueCount = 0;
                studentList.forEach(s => {
                    const totalPaid = studentTotalMap[s.id] || 0;
                    const currentMonthPaid = studentPaymentMap[s.id] || 0;
                    const months = getMonthsSince(s.createdAt);
                    const totalExpected = months * FIXED_MONTHLY_BILL;
                    const due = Math.max(0, totalExpected - totalPaid);
                    totalDue += due;
                    if (due === 0) fullyPaid++;
                    else if (currentMonthPaid > 0) partialPaid++;
                    else dueCount++;
                });
                if (totalStudents === 0) fullyPaid = 1;

                // 4. build last 6 months collection data
                const last6 = [];
                for (let i = 5; i >= 0; i--) {
                    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const label = `${FULL_MONTHS[m.getMonth()]} ${m.getFullYear()}`;
                    last6.push({ month: SHORT_MONTHS[m.getMonth()], amount: monthlyMap[label] || 0 });
                }

                // 5. payment distribution
                const paymentDist = [
                    { name: 'Paid', value: Math.max(fullyPaid, 1), color: '#10B981' },
                    { name: 'Partial', value: partialPaid || 0, color: '#F59E0B' },
                    { name: 'Due', value: dueCount || 0, color: '#EF4444' },
                ];

                // 6. recent complaints as activities
                const complaintsSnap = await getDocs(
                    query(collection(db, "complaints"), orderBy("createdAt", "desc"), limit(5))
                );
                const activities = [];
                complaintsSnap.forEach(doc => {
                    const d = doc.data();
                    activities.push({
                        id: doc.id,
                        text: `${d.studentName || 'A student'} submitted a ${d.type || 'complaint'}: ${d.subject || ''}`,
                        time: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
                        type: 'complaint'
                    });
                });

                setStats({ totalStudents, totalCollections, totalDue, thisMonth });
                setCollectionData(last6);
                setPaymentData(paymentDist);
                setRecentActivities(activities);
                setLoading(false);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <AppLayout title="Dashboard">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Dashboard Data...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="TOTAL STUDENTS" value={stats.totalStudents} icon={Users} color="indigo" subtitle="Active enrollments" />
                <StatCard title="TOTAL COLLECTED" value={`৳${stats.totalCollections.toLocaleString()}`} icon={DollarSign} color="blue" subtitle="All-time collection" />
                <StatCard title="TOTAL DUE" value={`৳${stats.totalDue.toLocaleString()}`} icon={AlertCircle} color="purple" subtitle="Pending amount" />
                <StatCard title="THIS MONTH" value={`৳${stats.thisMonth.toLocaleString()}`} icon={DollarSign} color="green" subtitle="Monthly collection" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* bar chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg">Monthly Collection Trend</h2>
                            <p className="text-xs text-gray-400">Last 6 months</p>
                        </div>
                        <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">2025-26</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={collectionData} margin={{ left: -15 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* pie chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-bold text-gray-800 text-lg">Payment Status</h2>
                            <p className="text-xs text-gray-400">Student payment distribution</p>
                        </div>
                        <span className="text-xs font-semibold text-purple-500 bg-purple-50 px-2 py-1 rounded">Current</span>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={paymentData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                        {paymentData.map((item) => (
                            <div key={item.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                                <span className="text-xs font-medium text-gray-600">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Recent Activities</h2>
                    <Link to="/complain" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
                </div>
                {recentActivities.length === 0 ? (
                    <div className="p-5 text-center text-gray-400">
                        <p className="text-sm">No recent activities</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentActivities.map(act => (
                            <div key={act.id} className="px-5 py-3 flex items-center justify-between">
                                <p className="text-sm text-gray-700">{act.text}</p>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{act.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
