import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { UserCheck, Clock, CheckCircle2, XCircle, Mail, Phone, Users, Home } from 'lucide-react';
import { db } from '../../firebase'; 
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';


export default function RegistrationRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, declined: 0 });

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const requestList = [];
                let total = 0, pending = 0, approved = 0, declined = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    requestList.push({ id: doc.id, ...data });

                    total++;
                   
                    const currentStatus = data.status ? data.status.toLowerCase() : '';
                    if (currentStatus === 'pending') pending++;
                    if (currentStatus === 'approved') approved++;
                    if (currentStatus === 'declined') declined++;
                });

                setRequests(requestList);
                setStats({ total, pending, approved, declined });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data: ", error);
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

       const handleStatusUpdate = async (id, newStatus) => {
        try {
            
            const requestRef = doc(db, "users", id); 
            await updateDoc(requestRef, { status: newStatus.toLowerCase() }); 
            
            
            setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus.toLowerCase() } : req));
            
            setStats(prev => {
                const updated = { ...prev };
                updated[newStatus.toLowerCase()]++;
                updated.pending--;
                return updated;
            });

            if (newStatus.toLowerCase() === 'approved') {
              
                const currentStudent = requests.find(req => req.id === id);
                
                if (currentStudent && currentStudent.email) {
                    const templateParams = {
                        name: currentStudent.name || "Student", 
                        email: currentStudent.email,          
                    };

                    await emailjs.send(
                        import.meta.env.VITE_EMAILJS_SERVICE_ID, 
                        import.meta.env.VITE_EMAILJS_TEMPLATE_ID, 
                        templateParams,
                        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
                    );
                    
                    alert(`Request successfully Approved & Confirmation Email Sent!`);
                } else {
                    alert(`Request approved, but email couldn't be sent (Email not found).`);
                }
            } else {
                alert(`Request successfully ${newStatus}!`);
            }

        } catch (error) {
            console.error("Status update error: ", error);
            alert("Something went wrong! Please try again.");
        }
    };

    if (loading) {
        return (
            <AppLayout title="Registration Requests">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading requests from Firebase...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Registration Requests">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Registration Requests</h1>
                <p className="text-sm text-gray-500 mt-1">Review and manage student registration applications</p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Requests', value: stats.total, icon: UserCheck, color: 'text-gray-600', bgColor: 'bg-gray-100', border: 'border-gray-100' },
                    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50', border: 'border-slate-800' },
                    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-50', border: 'border-gray-100' },
                    { label: 'Declined', value: stats.declined, icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-50', border: 'border-gray-100' },
                ].map((stat, index) => (
                    <div key={index} className={`bg-white p-6 rounded-2xl border-2 ${stat.border} shadow-sm flex justify-between items-center`}>
                        <div>
                            <p className="text-xs font-semibold text-gray-400">{stat.label}</p>
                            <h3 className={`text-3xl font-black mt-2 ${stat.color === 'text-gray-600' ? 'text-gray-800' : stat.color}`}>{stat.value}</h3>
                        </div>
                        <div className={`p-3 ${stat.bgColor} ${stat.color} rounded-2xl`}><stat.icon size={22} /></div>
                    </div>
                ))}
            </div>

            <div className="mb-6"><h2 className="text-lg font-bold text-gray-800">Pending Registrations</h2></div>

            {/* Request List */}
            <div className="space-y-4 max-w-5xl">
                {requests.filter(req => req.status?.toLowerCase() === 'pending').length === 0 ? (
                    <p className="text-gray-400 text-sm italic py-4">No pending registration requests found.</p>
                ) : (
                    requests.filter(req => req.status?.toLowerCase() === 'pending').map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative">
                            <span className="absolute top-6 right-6 px-3 py-1 bg-orange-50 text-orange-500 text-xs font-bold rounded-full capitalize">{item.status}</span>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[#1e293b] flex items-center justify-center text-white font-black text-lg shadow-inner">
                                        {item.name?.charAt(0)}
                                    </div>
                                    <div className="leading-tight">
                                        <h3 className="text-lg font-black text-gray-800">{item.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1">ID: {item.uid?.substring(0, 8)}...</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 flex-1 lg:max-w-2xl ml-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Mail size={14} className="text-gray-400" /><span>{item.email}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Phone size={14} className="text-gray-400" /><span>{item.phone}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Users size={14} className="text-gray-400" /><span>Guardian: {item.guardian_phone}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Home size={14} className="text-gray-400" /><span>Room Type: {item.room_type}</span></div>
                                </div>
                                <div className="flex items-center gap-3 self-end lg:self-center mt-4 lg:mt-0">
                                    <button onClick={() => handleStatusUpdate(item.id, 'Approved')} className="flex items-center gap-1.5 px-5 py-2.5 bg-[#10B981] text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-md">
                                        <CheckCircle2 size={14} /> Approve
                                    </button>
                                    <button onClick={() => handleStatusUpdate(item.id, 'Declined')} className="flex items-center gap-1.5 px-5 py-2.5 bg-[#EF4444] text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-md">
                                        <XCircle size={14} /> Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
