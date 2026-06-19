import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../Layouts/AppLayout';
import { db } from '../../firebase'; 
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore'; 
import { ArrowLeft, ClipboardList, Coffee, Sun, Moon, UtensilsCrossed } from 'lucide-react';

export default function MealEntry() {
    const [loading, setLoading] = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentList, setStudentList] = useState([]);
    const [formData, setFormData] = useState({
        date: '',
        studentId: '',
        studentName: '',
        meals: {
            breakfast: false,
            lunch: false,
            dinner: false,
        }
    });

    // fetch student list from Firebase on component mount
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                // student list from Firebase where status is approved
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
                console.error("Error loading student list from Firebase:", error);
                setStudentsLoading(false);
            }
        };

        fetchStudents();
    }, []);

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

    // function to handle form submission and save meal record to Firebase
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.date || !formData.studentId) {
            return alert("Please select both date and student!");
        }
        if (!formData.meals.breakfast && !formData.meals.lunch && !formData.meals.dinner) {
            return alert("Please select at least one meal!");
        }

        setLoading(true);
        try {
            let totalMealsCount = 0;
            if (formData.meals.breakfast) totalMealsCount++;
            if (formData.meals.lunch) totalMealsCount++;
            if (formData.meals.dinner) totalMealsCount++;

            await addDoc(collection(db, "meal_orders"), {
                studentId: formData.studentId,
                studentName: formData.studentName,
                date: formData.date,
                breakfast: formData.meals.breakfast,
                lunch: formData.meals.lunch,
                dinner: formData.meals.dinner,
                totalCount: totalMealsCount,
                createdAt: new Date().toISOString()
            });

            alert("Meal record saved and synced with student database successfully! 🎉");
            
            setFormData({
                date: '',
                studentId: '',
                studentName: '',
                meals: { breakfast: false, lunch: false, dinner: false }
            });

        } catch (error) {
            console.error("Firebase saving error:", error);
            alert("Failed to save record. Try again!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Meal Entry">
            <Link to="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 transition-colors text-sm font-medium">
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Meal Entry</h1>
                <p className="text-sm text-gray-500">Record daily meal consumption for students</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-3xl">
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg leading-tight">Daily Meal Entry</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Select the meals consumed by the student</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Date *</label>
                            <input 
                                type="date" 
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Select Student *</label>
                            <select 
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">Select Meals *</label>

                        {/* Breakfast */}
                        <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                            formData.meals.breakfast ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:bg-gray-50/50'
                        }`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                                    <Coffee size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Breakfast</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">7:00 AM – 9:00 AM</p>
                                </div>
                            </div>
                            <input 
                                type="checkbox"
                                className="w-5 h-5 accent-emerald-600 rounded-full border-gray-300 cursor-pointer"
                                checked={formData.meals.breakfast}
                                onChange={(e) => setFormData({...formData, meals: { ...formData.meals, breakfast: e.target.checked }})}
                            />
                        </label>

                        {/* Lunch */}
                        <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                            formData.meals.lunch ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:bg-gray-50/50'
                        }`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-cyan-50 text-cyan-500 rounded-xl">
                                    <Sun size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Lunch</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">12:00 PM – 2:00 PM</p>
                                </div>
                            </div>
                            <input 
                                type="checkbox"
                                className="w-5 h-5 accent-emerald-600 rounded-full border-gray-300 cursor-pointer"
                                checked={formData.meals.lunch}
                                onChange={(e) => setFormData({...formData, meals: { ...formData.meals, lunch: e.target.checked }})}
                            />
                        </label>

                        {/* Dinner */}
                        <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                            formData.meals.dinner ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:bg-gray-50/50'
                        }`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl">
                                    <Moon size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Dinner</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">7:00 PM – 9:00 PM</p>
                                </div>
                            </div>
                            <input 
                                type="checkbox"
                                className="w-5 h-5 accent-emerald-600 rounded-full border-gray-300 cursor-pointer"
                                checked={formData.meals.dinner}
                                onChange={(e) => setFormData({...formData, meals: { ...formData.meals, dinner: e.target.checked }})}
                            />
                        </label>
                    </div>

                    {/* submit button  */}
                    <div className="pt-4 flex gap-3">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <UtensilsCrossed size={18} />
                            {loading ? 'Saving...' : 'Save Meal Entry'}
                        </button>
                        <button 
                            type="reset"
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}