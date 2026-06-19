import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../Layouts/AppLayout';
import { db } from '../../firebase'; 
import { collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { ArrowLeft, DollarSign, Lightbulb } from 'lucide-react';

export default function AddPayment() {
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentList, setStudentList] = useState([]);
    const [formData, setFormData] = useState({
        studentId: '',
        studentName: '',
        amount: '',
        date: '',
        month: ''
    });

    // Loa
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const q = query(collection(db, "users"), where("status", "==", "approved"));
                const querySnapshot = await getDocs(q);
                const list = [];
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    list.push({
                        id: doc.id,
                        name: data.name || 'Unknown Student',
                        room: data.room_type || 'No Room'
                    });
                });
                
                setStudentList(list);
                setStudentsLoading(false);
            } catch (error) {
                console.error("Error loading student list:", error);
                setStudentsLoading(false);
            }
        };

        fetchStudents();
    }, []);

    // Dropdown change handler for student selection
    const handleStudentChange = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) {
            setFormData(prev => ({ ...prev, studentId: '', studentName: '' }));
            return;
        }
        const selectedStudent = studentList.find(stu => stu.id === selectedId);
        setFormData(prev => ({
            ...prev,
            studentId: selectedId,
            studentName: selectedStudent ? selectedStudent.name : ''
        }));
    };

    // Function to handle form submission and save payment record to Firebase
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.studentId || !formData.amount || !formData.date || !formData.month) {
            return alert("Please fill out all required fields!");
        }

        setLoading(true);
        try {
            // Save payment record to "payments" collection
            await addDoc(collection(db, "payments"), {
                studentId: formData.studentId,
                studentName: formData.studentName,
                billed: formData.amount, // due amount before payment
                paid: formData.amount,
                due: 0, // after payment, due is 0
                status: 'Paid',
                date: formData.date,
                month: formData.month,
                createdAt: new Date().toISOString()
            });

            // Update user's total_paid and due_amount in users collection
            try {
                const userRef = doc(db, "users", formData.studentId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const currentPaid = Number(userData.total_paid || 0);
                    const currentDue = Number(userData.due_amount || 0);
                    const paidAmt = Number(formData.amount);
                    const newPaid = currentPaid + paidAmt;
                    const newDue = Math.max(0, currentDue - paidAmt);
                    await updateDoc(userRef, { total_paid: newPaid, due_amount: newDue });
                }
            } catch (err) {
                console.warn("Failed to update user totals:", err);
            }

            alert("Payment record saved successfully and synced with student history! 🎉");
            
            // Reset form after successful submission
            setFormData({
                studentId: '',
                studentName: '',
                amount: '',
                date: '',
                month: ''
            });

        } catch (error) {
            console.error("Firebase payment saving error:", error);
            alert("Failed to save payment record. Try again!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Add Payment">
            {/* Back link */}
            <Link to="/payments" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 transition-colors text-sm">
                <ArrowLeft size={16} />
                <span>Back to Payment Records</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Add Payment</h1>
                <p className="text-sm text-gray-500">Record a new payment for a student</p>
            </div>

            {/* Main Form Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-3xl">
                <div className="flex items-start gap-4 mb-10">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg">Payment Information</h2>
                        <p className="text-xs text-gray-400">Fill in the details to record a new payment</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Student Select Dropdown */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Select Student *</label>
                            <select 
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-600"
                                value={formData.studentId}
                                onChange={handleStudentChange}
                                required
                                disabled={studentsLoading}
                            >
                                <option value="">{studentsLoading ? "Loading students..." : "Choose a student..."}</option>
                                {studentList.map(stu => (
                                    <option key={stu.id} value={stu.id}>
                                        {stu.name} (Room: {stu.room})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Amount and Date Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Amount (৳) *</label>
                                <input 
                                    type="number" 
                                    placeholder="0"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Date *</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        {/* Month Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Payment For Month *</label>
                            <select 
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-gray-600"
                                value={formData.month}
                                onChange={(e) => setFormData({...formData, month: e.target.value})}
                                required
                            >
                                <option value="">Select month...</option>
                                <option value="January 2026">January 2026</option>
                                <option value="February 2026">February 2026</option>
                                <option value="March 2026">March 2026</option>
                                <option value="April 2026">April 2026</option>
                                <option value="May 2026">May 2026</option>
                                <option value="June 2026">June 2026</option>
                            </select>
                        </div>
                    </div>

                    {/* Button Section */}
                    <div className="mt-8 flex items-center gap-3">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-12 py-3.5 bg-[#1e3a8a] text-white rounded-xl text-sm font-bold hover:bg-[#1e40af] transition-all shadow-lg shadow-blue-100 disabled:opacity-50 cursor-pointer"
                        >
                            <DollarSign size={16} /> {loading ? "Recording..." : "Add Payment"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tips Card */}
            <div className="mt-10 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-md shadow-sm text-yellow-600">
                        <Lightbulb size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm mb-1">Quick Tip</h4>
                        <p className="text-xs text-blue-700 leading-relaxed opacity-80">
                            Partial payments are supported. The system will automatically calculate
                            the due amount based on the total amount and payments received.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}