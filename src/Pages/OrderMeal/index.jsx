import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom'; // useSearchParams এবং useNavigate যোগ করা হয়েছে
import AppLayout from '../../Layouts/AppLayout';
import { useAuth } from '../../AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Coffee, Sun, Moon, Calendar, Info, UtensilsCrossed, AlertCircle } from 'lucide-react';

export default function OrderMeal() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [upcomingOrders, setUpcomingOrders] = useState([]);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        date: '',
        breakfast: false,
        lunch: false,
        dinner: false,
    });

const PRICES = { breakfast: 65, lunch: 80, dinner: 70 };

    const calculateTotalCost = () => {
        let total = 0;
        if (formData.breakfast) total += PRICES.breakfast;
        if (formData.lunch) total += PRICES.lunch;
        if (formData.dinner) total += PRICES.dinner;
        return total;
    };

    // Fetch upcoming orders for the logged-in student
    const fetchOrders = async () => {
        if (!user?.uid) return;
        try {
            const q = query(
                collection(db, "meal_orders"),
                where("studentId", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);
            const ordersList = [];
            querySnapshot.forEach((doc) => {
                ordersList.push({ id: doc.id, ...doc.data() });
            });
            ordersList.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
            setUpcomingOrders(ordersList);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const PENDING_ORDER_KEY = 'hostel_pending_order';
    const processedRef = useRef(null);

    useEffect(() => {
        const successParam = searchParams.get('success');
        const dateParam = searchParams.get('date');
        const bfParam = searchParams.get('bf') === 'true';
        const lnParam = searchParams.get('ln') === 'true';
        const dnParam = searchParams.get('dn') === 'true';
        const totalParam = Number(searchParams.get('total') || 0);

        // 1) Try URL params first
        let orderDate = dateParam;
        let bf = bfParam, ln = lnParam, dn = dnParam, total = totalParam;
        let hasOrder = successParam === 'true' && !!orderDate;

        // 2) Fallback: localStorage pending order
        let fromLocalStorage = false;
        if (!hasOrder) {
            const raw = localStorage.getItem(PENDING_ORDER_KEY);
            if (raw) {
                try {
                    const p = JSON.parse(raw);
                    if (Date.now() - p.timestamp < 10 * 60 * 1000 && p.uid === user?.uid) {
                        orderDate = p.date; bf = p.bf; ln = p.ln; dn = p.dn; total = p.total;
                        hasOrder = true;
                        fromLocalStorage = true;
                    }
                } catch (e) {}
            }
        }

        if (!hasOrder || !orderDate || !user?.uid) return;

        const orderKey = `${user.uid}_${orderDate}_${bf}_${ln}_${dn}`;
        if (processedRef.current === orderKey) return;
        processedRef.current = orderKey;

        if (fromLocalStorage) localStorage.removeItem(PENDING_ORDER_KEY);

        setLoading(true);
        const saveOrder = async () => {
            try {
                const orderData = {
                    studentId: user.uid,
                    studentName: user.displayName || 'Student',
                    date: orderDate,
                    breakfast: bf, lunch: ln, dinner: dn,
                    totalCount: (bf ? 1 : 0) + (ln ? 1 : 0) + (dn ? 1 : 0),
                    amountPaid: total,
                    status: 'Paid & Confirmed',
                    createdAt: new Date().toISOString()
                };

                await addDoc(collection(db, "meal_orders"), orderData);
                setError(null);
                navigate(window.location.pathname, { replace: true });
                setTimeout(() => fetchOrders(), 300);
            } catch (error) {
                console.error("Error saving meal order after payment:", error);
                setError(`Firestore write failed: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        saveOrder();
    }, [user?.uid, searchParams, navigate]);

    useEffect(() => {
        fetchOrders();
    }, [user?.uid]);

    // New order submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.date) return alert("Please select a date!");
        if (!formData.breakfast && !formData.lunch && !formData.dinner) {
            return alert("Please select at least one meal!");
        }

        const totalCost = calculateTotalCost();

        // Save to localStorage before Stripe redirect (fallback if Stripe ignores success_url)
        const PENDING_ORDER_KEY = 'hostel_pending_order';
        localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
            date: formData.date, bf: formData.breakfast, ln: formData.lunch,
            dn: formData.dinner, total: totalCost, uid: user?.uid, timestamp: Date.now()
        }));

        setLoading(true);
        try {
            const baseStripeUrl = "https://buy.stripe.com/test_cNi3cw1vQeIj2JQeBP7bW01"; 
            const successUrl = `${window.location.origin}${window.location.pathname}?success=true&date=${formData.date}&bf=${formData.breakfast}&ln=${formData.lunch}&dn=${formData.dinner}&total=${totalCost}`;
            const cancelUrl = `${window.location.origin}${window.location.pathname}`;
            const finalUrl = `${baseStripeUrl}?prefilled_amount=${totalCost * 100}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
            window.location.href = finalUrl;
        } catch (error) {
            localStorage.removeItem('hostel_pending_order');
            console.error("Error redirecting to Stripe for meal payment:", error);
            alert("Payment connection failed. Try again!");
            setLoading(false);
        }
    };

    return (
        <AppLayout title="Order Meals">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                
                {/* Place New Order form */}
                <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                    <div className="mb-6">
                        <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                            <UtensilsCrossed size={20} className="text-blue-500" />
                            <span>Book Upcoming Meals</span>
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">Select your date and prefered meal plan</p>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle size={16} />
                            <p className="text-xs font-semibold">{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Date Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                                Select Date <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="date" 
                                className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                required
                            />
                            <p className="text-[11px] text-gray-400">Orders must be placed at least 1 day in advance</p>
                        </div>

                        {/* Meal Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-600 uppercase tracking-wider block">
                                Select Meals <span className="text-red-500">*</span>
                            </label>

                            {/* Breakfast */}
                            <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                formData.breakfast ? 'border-blue-500 bg-blue-50/10' : 'border-gray-100 hover:bg-gray-50/50'
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
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">৳{PRICES.breakfast}</span>
                                    <input 
                                        type="checkbox"
                                        className="w-5 h-5 accent-blue-600 rounded-full cursor-pointer"
                                        checked={formData.breakfast}
                                        onChange={(e) => setFormData({...formData, breakfast: e.target.checked})}
                                    />
                                </div>
                            </label>

                            {/* Lunch */}
                            <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                formData.lunch ? 'border-blue-500 bg-blue-50/10' : 'border-gray-100 hover:bg-gray-50/50'
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
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">৳{PRICES.lunch}</span>
                                    <input 
                                        type="checkbox"
                                        className="w-5 h-5 accent-blue-600 rounded-full cursor-pointer"
                                        checked={formData.lunch}
                                        onChange={(e) => setFormData({...formData, lunch: e.target.checked})}
                                    />
                                </div>
                            </label>

                            {/* Dinner */}
                            <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                formData.dinner ? 'border-blue-500 bg-blue-50/10' : 'border-gray-100 hover:bg-gray-50/50'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl">
                                        <Moon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Dinner</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">7:00 PM – 9:00 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">৳{PRICES.dinner}</span>
                                    <input 
                                        type="checkbox"
                                        className="w-5 h-5 accent-blue-600 rounded-full cursor-pointer"
                                        checked={formData.dinner}
                                        onChange={(e) => setFormData({...formData, dinner: e.target.checked})}
                                    />
                                </div>
                            </label>
                        </div>

                        {/* Order Summary & Pay Button */}
                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Total Payable</p>
                                <p className="text-2xl font-black text-gray-800 mt-1">৳{calculateTotalCost()}</p>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || calculateTotalCost() === 0}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/10 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Processing..." : `Pay ৳${calculateTotalCost()} & Order`}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Upcoming Orders Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 max-h-[500px] overflow-y-auto">
                        <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <span>Your Meal History</span>
                        </h3>
                        {upcomingOrders.length === 0 ? (
                            <p className="text-xs text-gray-400 font-medium">No meal orders found.</p>
                        ) : (
                            <div className="space-y-3">
                                {upcomingOrders.map((order) => (
                                    <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-gray-700">{order.date}</span>
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">{order.status}</span>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {order.breakfast && <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Breakfast</span>}
                                            {order.lunch && <span className="text-[10px] font-medium text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">Lunch</span>}
                                            {order.dinner && <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Dinner</span>}
                                        </div>
                                        <p className="text-[11px] font-black text-gray-500 mt-2">Paid: ৳{order.amountPaid || 0}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
