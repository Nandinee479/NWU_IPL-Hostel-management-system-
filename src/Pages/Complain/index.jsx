import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { db } from '../../firebase'; 
import { collection, getDocs, doc, updateDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { MessageSquare, Clock, Info, CheckCircle2, Inbox } from 'lucide-react';

export default function AdminComplaints() {
    const [loading, setLoading] = useState(true);
    const [complaints, setComplaints] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

    // Load complaints from Firestore and calculate stats
    const fetchComplaints = async () => {
        try {
            const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const list = [];
            let total = 0, pending = 0, inProgress = 0, resolved = 0;

            // Loop through all student complaints to match real names from the users collection
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

                list.push({ 
                    id: document.id, 
                    ...data,
                    studentName: realName || 'Student'
                });

                total++;
                const currentStatus = data.status ? data.status.toLowerCase() : '';
                if (currentStatus === 'pending') pending++;
                if (currentStatus === 'in progress') inProgress++;
                if (currentStatus === 'resolved') resolved++;
            }

            setComplaints(list);
            setStats({ total, pending, inProgress, resolved });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching complaints:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    // Status update handler
    const handleStatusChange = async (id, newStatus) => {
        try {
            const docRef = doc(db, "complaints", id);
            await updateDoc(docRef, { status: newStatus });
            alert(`Status updated to ${newStatus} successfully! 🎉`);
            fetchComplaints(); // Real-time refresh
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status. Try again!");
        }
    };

    // Filter logic
    const filteredComplaints = complaints.filter(item => {
        if (statusFilter === 'All') return true;
        return item.status?.toLowerCase() === statusFilter.toLowerCase();
    });

    if (loading) {
        return (
            <AppLayout title="Complaints Management">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Student Complaints...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Complaints Management">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Complaints Management</h1>
                <p className="text-sm text-gray-500">View and manage all student complaints</p>
            </div>

            {/* Status Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'TOTAL COMPLAINTS', value: stats.total, subtitle: 'All time', icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                    { label: 'PENDING', value: stats.pending, subtitle: 'Awaiting action', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
                    { label: 'IN PROGRESS', value: stats.inProgress, subtitle: 'Being addressed', icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50' },
                    { label: 'RESOLVED', value: stats.resolved, subtitle: 'Completed', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className={`p-2.5 ${stat.bgColor} ${stat.color} rounded-xl w-fit`}><stat.icon size={20} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">{stat.value}</h3>
                            <p className="text-[10px] text-gray-400 font-medium">{stat.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-500 ml-2">Filter by status:</span>
                <div className="flex gap-2">
                    {['All', 'Pending', 'In Progress', 'Resolved'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === status 
                                ? 'bg-[#1e293b] text-white shadow-lg shadow-slate-200' 
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">All Complaints</h2>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Showing {filteredComplaints.length} records</p>
                </div>

                {filteredComplaints.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Inbox size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                        <p className="text-sm font-semibold">No complaints found</p>
                        <p className="text-xs text-gray-400 mt-1">Complaints submitted by students under this status will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/20 border-b border-gray-50">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4 text-center">Priority</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredComplaints.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-6 font-bold text-gray-700 text-sm">#C00{complaints.length - index}</td>
                                        <td className="px-6 py-6">
                                            <div className="leading-tight">
                                                <p className="font-bold text-gray-800 text-sm">{item.studentName}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">ID: {item.studentId?.substring(0, 5)}...</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-sm text-gray-500 capitalize">{item.type}</td>
                                        <td className="px-6 py-6">
                                            <div className="max-w-[200px]">
                                                <p className="font-bold text-gray-800 text-sm">{item.subject}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{item.description}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                                                item.priority === 'High' ? 'bg-red-100 text-red-600' :
                                                item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <select
                                                value={item.status || 'Pending'}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                className={`px-3 py-1 text-sm font-bold rounded-lg border ${
                                                    (item.status || 'Pending').toLowerCase() === 'pending' ? 'border-orange-300 bg-orange-50 text-orange-600' :
                                                    (item.status || 'Pending').toLowerCase() === 'in progress' ? 'border-blue-300 bg-blue-50 text-blue-600' :
                                                    (item.status || 'Pending').toLowerCase() === 'resolved' ? 'border-green-300 bg-green-50 text-green-600' :
                                                    'border-gray-300 bg-gray-50 text-gray-600'
                                                }`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
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