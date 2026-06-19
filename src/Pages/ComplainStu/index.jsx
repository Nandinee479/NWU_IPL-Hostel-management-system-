import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { useAuth } from '../../AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { MessageSquare, Info, Clock } from 'lucide-react';

export default function ComplainStu() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [complaints, setComplaints] = useState([]);
    const [formData, setFormData] = useState({
        type: 'Room Issue',
        subject: '',
        description: '',
        priority: 'Low' // default priority level for new complaints
    });

    // fetch complaints for the logged-in student
    const fetchComplaints = async () => {
        if (!user?.uid) return;
        try {
            const q = query(
                collection(db, "complaints"),
                where("studentId", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            list.sort((a, b) => ((b.createdAt || '')).localeCompare(a.createdAt || ''));
            setComplaints(list);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, [user?.uid]);

    // submit handler with validation and priority level
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.description) {
            return alert("Please fill out all required fields!");
        }

        setLoading(true);
        try {
            const complaintData = {
                studentId: user.uid,
                studentName: user.displayName || 'Student',
                type: formData.type.replace(" Issue", ""), // only the main type (e.g., "Room", "Meal", "Other")
                subject: formData.subject,
                description: formData.description,
                priority: formData.priority, // Storing priority level in the database
                status: 'Pending', // Default status when a complaint is created
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "complaints"), complaintData);
            alert("Complaint submitted successfully!");
            
            // Form reset and list refresh
            setFormData({ type: 'Room Issue', subject: '', description: '', priority: 'Low' });
            fetchComplaints(); // List refresh
        } catch (error) {
            console.error("Error submitting complaint:", error);
            alert("Failed to submit. Try again!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Complaints">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Submit a Complaint</h1>
                <p className="text-sm text-gray-500 mt-1">Report any issues or concerns about your stay</p>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                
                {/* New Complaint Form */}
                <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 text-base">New Complaint</h2>
                            <p className="text-xs text-gray-400">Fill out the form below</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Complaint Type */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Complaint Type <span className="text-red-500">*</span>
                            </label>
                            <select 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer text-gray-700"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                            >
                                <option value="Room Issue">Room Issue</option>
                                <option value="Meal Issue">Meal Issue</option>
                                <option value="Other Issue">Other Issue</option>
                            </select>
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                placeholder="Brief title of your complaint"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea 
                                rows="5"
                                placeholder="Please describe your complaint in detail..."
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                required
                            ></textarea>
                        </div>

                        {/* Priority Level */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                Priority Level
                            </label>
                            <select 
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer text-gray-700"
                                value={formData.priority}
                                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-[#1d3557] text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                {loading ? "Submitting..." : "Submit Complaint"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Your Complaints */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Info size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 text-base">Your Complaints</h2>
                            <p className="text-xs text-gray-400">Track your submitted complaints</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {complaints.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 text-purple-600 mb-4">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800">No complaints submitted yet</h3>
                                <p className="text-xs text-gray-400 mt-2">Use the form on the left to submit your first complaint.</p>
                            </div>
                        ) : (
                            <>
                                {complaints.map((complaint) => (
                                    <div key={complaint.id} className="p-4 rounded-3xl border border-gray-100 bg-slate-50">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.2em] font-bold text-gray-400">{complaint.type}</p>
                                                <h3 className="text-sm font-bold text-gray-800 mt-1">{complaint.subject}</h3>
                                            </div>
                                            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                                                complaint.status?.toLowerCase() === 'pending'
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : complaint.status?.toLowerCase() === 'resolved'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {complaint.status || 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-3">{complaint.description}</p>
                                        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                            <span>Priority: {complaint.priority || 'Low'}</span>
                                            <span>{complaint.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
