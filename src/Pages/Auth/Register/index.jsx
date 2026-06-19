import React, { useState, useEffect } from "react";
import AppLayout from "../../../Layouts/AppLayout"; 

import { UserCheck, Clock, CheckCircle2, XCircle, Mail, Phone, Users, Home } from "lucide-react";
import { db } from "../../../firebase"; 
import { collection, getDocs, doc, updateDoc, query, orderBy, setDoc, getDoc } from 'firebase/firestore';

export default function RegistrationRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, declined: 0 });

    // Fetch registration requests from Firebase and calculate stats
    const fetchRequests = async () => {
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const requestList = [];
            let total = 0, pending = 0, approved = 0, declined = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // only include non-admin users in the request list and stats
                if (data.role !== 'admin') {
                    requestList.push({ id: doc.id, ...data });

                    total++;
                    const currentStatus = data.status ? data.status.toLowerCase() : '';
                    if (currentStatus === 'pending') pending++;
                    if (currentStatus === 'approved') approved++;
                    if (currentStatus === 'declined') declined++;
                }
            });

            setRequests(requestList);
            setStats({ total, pending, approved, declined });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching requests: ", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Real-time status update handler with confirmation and automation for room assignment
    const handleStatusUpdate = async (id, newStatus) => {
        const confirmAction = window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this registration request?`);
        if (!confirmAction) return;

        try {
            const requestRef = doc(db, "users", id);
            
            // Update the user's status in Firebase
            await updateDoc(requestRef, { 
                status: newStatus.toLowerCase() 
            });

            // If admin approves the request, automatically assign the student to their requested room
            if (newStatus.toLowerCase() === 'approved') {
                const selectedStudent = requests.find(req => req.id === id);
                
                if (selectedStudent && selectedStudent.room_type) {
                    // Check if the room document already exists in Firebase
                    const roomDocRef = doc(db, "rooms", selectedStudent.room_type);
                    const roomDocSnap = await getDoc(roomDocRef);

                    const studentName = selectedStudent.name || 'Unknown Student';
                    const studentId = selectedStudent.uid ? selectedStudent.uid.substring(0, 7) : id.substring(0, 7);
                    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    if (roomDocSnap.exists()) {
                        // If the room document already exists in Firebase, update its status and student info
                        await updateDoc(roomDocRef, {
                            status: 'Occupied',
                            student: studentName,
                            studentId: studentId,
                            joinDate: currentDate
                        });
                    } else {
                        // If no document exists for the room in Firebase, create a new one
                        await setDoc(roomDocRef, {
                            roomNo: selectedStudent.room_type,
                            floor: `Floor ${selectedStudent.room_type.charAt(0)}`,
                            status: 'Occupied',
                            student: studentName,
                            studentId: studentId,
                            joinDate: currentDate,
                            rent: 5000
                        });
                    }
                }
            }
            
            alert(`Student request successfully ${newStatus.toLowerCase()} and room assigned automatically! 🎉`);
            fetchRequests(); // Screen refresh to show updated status and stats
        } catch (error) {
            console.error("Automation Error: ", error);
            alert("Status updated, but room sync ran into an issue. Please try again.");
            fetchRequests();
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

    const pendingRequests = requests.filter(req => req.status?.toLowerCase() === 'pending');

    return (
        <AppLayout title="Registration Requests">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Registration Requests</h1>
                <p className="text-sm text-gray-500 mt-1">Review and manage student registration applications</p>
            </div>

            {/* Status Cards Grid */}
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
                {pendingRequests.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400 text-sm italic shadow-sm">
                        No pending registration requests found at the moment.
                    </div>
                ) : (
                    pendingRequests.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-gray-200 transition-all">
                            <span className="absolute top-6 right-6 px-3 py-1 bg-orange-50 text-orange-500 text-xs font-bold rounded-full capitalize">{item.status}</span>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[#1e293b] flex items-center justify-center text-white font-black text-lg shadow-inner uppercase">
                                        {item.name?.charAt(0) || 'S'}
                                    </div>
                                    <div className="leading-tight">
                                        <h3 className="text-lg font-black text-gray-800">{item.name || 'Anonymous'}</h3>
                                        <p className="text-xs text-gray-400 mt-1">UID: {item.uid ? item.uid.substring(0, 8) : item.id.substring(0, 8)}...</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 flex-1 lg:max-w-2xl ml-2">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Mail size={14} className="text-gray-400" /><span>{item.email || 'N/A'}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Phone size={14} className="text-gray-400" /><span>{item.phone || 'N/A'}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Users size={14} className="text-gray-400" /><span>Guardian: {item.guardian_phone || 'N/A'}</span></div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Home size={14} className="text-gray-400" /><span>Room: {item.room_type || 'N/A'}</span></div>
                                </div>

                                {/* Fixed Container and Buttons */}
                                <div className="flex gap-4 mt-4 lg:mt-0">
                                    <button onClick={() => handleStatusUpdate(item.id, 'Approved')} className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600 transition">Approve</button>
                                    <button onClick={() => handleStatusUpdate(item.id, 'Declined')} className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition">Decline</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}