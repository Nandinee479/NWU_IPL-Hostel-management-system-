import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Users, Search, Eye, Inbox } from 'lucide-react';

export default function StudentManagement() {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [stats, setStats] = useState({ total: 0, fullyPaid: 0, partialPaid: 0, due: 0 });

    const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const FIXED_MONTHLY_BILL = 5000;

    function getMonthsSince(d) {
        if (!d) return 1;
        const s = d.toDate ? d.toDate() : new Date(d);
        if (isNaN(s.getTime())) return 1;
        const n = new Date();
        const m = (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
        return Math.max(1, m + 1);
    }

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const now = new Date();
                const currentMonth = `${FULL_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

                // 1. Fetch approved students
                const usersSnap = await getDocs(query(collection(db, "users"), where("status", "==", "approved")));
                const userMap = {};
                usersSnap.forEach(doc => { userMap[doc.id] = doc.data(); });

                // 2. Fetch all payments, group by student
                const paySnap = await getDocs(collection(db, "payments"));
                const payMap = {}; // studentId -> { totalPaid, currentPaid }
                paySnap.forEach(doc => {
                    const d = doc.data();
                    const sid = d.studentId;
                    if (!sid) return;
                    if (!payMap[sid]) payMap[sid] = { totalPaid: 0, currentPaid: 0 };
                    const amt = Number(d.paid || 0);
                    payMap[sid].totalPaid += amt;
                    if (d.month === currentMonth) payMap[sid].currentPaid += amt;
                });

                // 3. Build student list
                const studentList = [];
                let total = 0, fullyPaid = 0, partialPaid = 0, due = 0;

                Object.entries(userMap).forEach(([id, data]) => {
                    const p = payMap[id] || { totalPaid: 0, currentPaid: 0 };
                    const paidAmount = p.totalPaid;
                    const months = getMonthsSince(data.createdAt);
                    const totalExpected = months * FIXED_MONTHLY_BILL;
                    const dueAmount = Math.max(0, totalExpected - paidAmount);
                    const totalPayable = paidAmount + dueAmount;

                    let paymentStatus = 'Paid';
                    if (dueAmount > 0 && paidAmount > 0) {
                        paymentStatus = 'Partial';
                        partialPaid++;
                    } else if (dueAmount > 0 && paidAmount === 0) {
                        paymentStatus = 'Due';
                        due++;
                    } else {
                        paymentStatus = 'Paid';
                        fullyPaid++;
                    }

                    studentList.push({
                        id,
                        name: data.name || 'Unknown',
                        studentId: data.uid ? data.uid.substring(0, 7) : id.substring(0, 7),
                        email: data.email || 'N/A',
                        phone: data.phone || 'N/A',
                        total: `৳${totalPayable.toLocaleString()}`,
                        paid: `৳${paidAmount.toLocaleString()}`,
                        due: `৳${dueAmount.toLocaleString()}`,
                        status: paymentStatus
                    });
                    total++;
                });

                setStudents(studentList);
                setStats({ total, fullyPaid, partialPaid, due });
                setLoading(false);
            } catch (error) {
                console.error("Error loading students:", error);
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    // Filter students based on search term and status filter
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All Status' || student.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <AppLayout title="Student Management">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Approved Student Records...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Student Management">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Student Management</h1>
                <p className="text-sm text-gray-500">Manage and view all student records</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Students', value: stats.total, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { label: 'Fully Paid', value: stats.fullyPaid, icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
                    { label: 'Partial Paid', value: stats.partialPaid, icon: Users, color: 'text-orange-600', bgColor: 'bg-orange-50' },
                    { label: 'Payment Due', value: stats.due, icon: Users, color: 'text-red-600', bgColor: 'bg-red-50' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className={`p-3 ${stat.bgColor} ${stat.color} rounded-xl w-fit`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-gray-800">{stat.value}</h3>
                            <p className="text-xs font-medium text-gray-400 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg">All Students</h2>
                        <p className="text-xs text-gray-400">{filteredStudents.length} records</p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <select 
                            className="bg-gray-50 border border-gray-100 text-gray-600 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All Status">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Due">Due</option>
                        </select>
                        <div className="relative flex-1 md:w-64">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Student Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4 text-green-600">Paid</th>
                                <th className="px-6 py-4 text-red-500">Due</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-400 text-sm">
                                        <Inbox size={32} className="mx-auto mb-2 opacity-30" />
                                        <span>No approved students found matching the criteria.</span>
                                    </td>
                                </tr>
                            ) : filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm leading-tight">{student.name}</p>
                                                    <p className="text-xs text-gray-400">{student.studentId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600">{student.email}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{student.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-700">{student.total}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600">{student.paid}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-red-500">{student.due}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                                student.status === 'Paid' ? 'bg-green-50 text-green-600' :
                                                student.status === 'Partial' ? 'bg-orange-50 text-orange-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}