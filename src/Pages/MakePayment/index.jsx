import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../../Layouts/AppLayout';
import { useAuth } from '../../AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { DollarSign, CreditCard, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const FIXED_MONTHLY_BILL = 5000;
const PENDING_KEY = 'hostel_pending_payment';

function getCurrentMonthLabel() {
    const now = new Date();
    return `${FULL_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

async function computePaymentsData(uid) {
    const q = query(collection(db, "payments"), where("studentId", "==", uid));
    const snap = await getDocs(q);
    let totalPaid = 0;
    snap.forEach(d => { totalPaid += Number(d.data().paid || 0); });
    let months = 1;
    try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
            const d = userSnap.data();
            if (d.createdAt) {
                const s = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
                if (!isNaN(s.getTime())) {
                    const n = new Date();
                    months = Math.max(1, (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth()) + 1);
                }
            }
        }
    } catch (e) {}
    const totalExpected = months * FIXED_MONTHLY_BILL;
    return { totalPaid, due: Math.max(0, totalExpected - totalPaid) };
}

export default function MakePayment() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [dueAmount, setDueAmount] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [formData, setFormData] = useState({ amount: '', paymentMethod: 'stripe' });
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState(null);
    const processedRef = useRef(null);

    // Load data from payments collection (no dependency on users doc)
    useEffect(() => {
        if (!user?.uid) return;
        const load = async () => {
            try {
                const { totalPaid: tp, due } = await computePaymentsData(user.uid);
                setTotalPaid(tp);
                setDueAmount(due);
                setPageLoading(false);
            } catch (err) {
                console.error("Load error:", err);
                setPageLoading(false);
            }
        };
        load();
    }, [user?.uid]);

    // Process payment from URL params OR localStorage fallback
    useEffect(() => {
        const successParam = searchParams.get('success');
        const paidAmountParam = searchParams.get('amt');
        const cancelParam = searchParams.get('cancel');

        if (cancelParam === 'true') {
            localStorage.removeItem(PENDING_KEY);
            setSearchParams({}, { replace: true });
            return;
        }

        let amountToProcess = null;
        if (successParam === 'true' && paidAmountParam) {
            amountToProcess = Number(paidAmountParam);
        }
        if (!amountToProcess) {
            const raw = localStorage.getItem(PENDING_KEY);
            if (raw) {
                try {
                    const p = JSON.parse(raw);
                    if (Date.now() - p.timestamp < 10 * 60 * 1000 && p.uid === user?.uid) {
                        amountToProcess = p.amount;
                    }
                } catch (e) {}
                localStorage.removeItem(PENDING_KEY);
            }
        }

        if (!amountToProcess || amountToProcess <= 0 || !user?.uid) return;
        if (processedRef.current === amountToProcess) return;
        processedRef.current = amountToProcess;

        const doPayment = async () => {
            try {
                const now = new Date();
                const monthLabel = getCurrentMonthLabel();

                // Get pre-payment due from payments collection (fresh, not from stale state)
                const pre = await computePaymentsData(user.uid);
                const newDue = Math.max(0, pre.due - amountToProcess);

                // Get current student name
                const snap = await getDoc(doc(db, "users", user.uid));
                const sName = snap.exists() ? (snap.data().name || user.displayName || 'Student') : (user.displayName || 'Student');

                // Write to payments collection only
                await addDoc(collection(db, "payments"), {
                    studentId: user.uid, studentName: sName,
                    billed: amountToProcess, paid: amountToProcess,
                    due: newDue,
                    status: 'Paid',
                    date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    month: monthLabel, createdAt: new Date().toISOString()
                });

                // Recompute state from ALL payments
                const { totalPaid: tp, due } = await computePaymentsData(user.uid);
                setTotalPaid(tp);
                setDueAmount(due);
                setPaymentSuccess(true);
                setSearchParams({}, { replace: true });
                setTimeout(() => setPaymentSuccess(false), 5000);
            } catch (err) {
                console.error("Payment processing error:", err);
                setError(`Write failed: ${err.message}. Please contact admin.`);
            }
        };
        doPayment();
    }, [user?.uid, searchParams, setSearchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(formData.amount);
        if (!amount || amount <= 0) return alert("Please enter a valid amount!");
        if (amount > dueAmount) return alert(`You cannot pay more than your current due of $${dueAmount}`);

        localStorage.setItem(PENDING_KEY, JSON.stringify({ amount, uid: user?.uid, timestamp: Date.now() }));

        setLoading(true);
        try {
            const successUrl = `${window.location.origin}/make-payment?success=true&amt=${amount}`;
            const cancelUrl = `${window.location.origin}/make-payment?cancel=true`;
            const stripeLink = `https://buy.stripe.com/test_cNi3cw1vQeIj2JQeBP7bW01?quantity=${amount}&success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
            window.location.href = stripeLink;
        } catch (err) {
            localStorage.removeItem(PENDING_KEY);
            console.error("Redirect Error:", err);
            alert("Could not open payment window. Please try again!");
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <AppLayout title="Make Payment">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">Loading Payment Info...</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Make Payment">
            <Link to="/payment-history" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 transition-colors text-sm font-medium">
                <ArrowLeft size={16} />
                <span>Back to Payment History</span>
            </Link>
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Make a Payment</h1>
                <p className="text-sm text-gray-500 mt-1">Pay your hostel dues securely</p>
            </div>

            {paymentSuccess && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Payment recorded successfully!</p>
                        <p className="text-xs mt-0.5">Your payment history has been updated across all panels.</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-500 shrink-0" />
                    <div><p className="font-bold text-sm">Error</p><p className="text-xs mt-0.5">{error}</p></div>
                </div>
            )}
            {searchParams.get('cancel') === 'true' && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} className="text-rose-500 shrink-0" />
                    <div><p className="font-bold text-sm">Payment Cancelled</p><p className="text-xs mt-0.5">The payment flow was cancelled. No charges were made.</p></div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><CreditCard size={22} /></div>
                        <div><h2 className="font-bold text-gray-800 text-lg">Payment Details</h2><p className="text-xs text-gray-400">Enter the amount you want to pay</p></div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Payment Amount ($) <span className="text-red-500">*</span></label>
                            <input type="number" placeholder="Enter amount..." className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3.5 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required min="1" />
                            <p className="text-[11px] text-gray-400">Minimum payment: $1 (Test Mode)</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-600 uppercase tracking-wider">Payment Method <span className="text-red-500">*</span></label>
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${formData.paymentMethod === 'stripe' ? 'border-blue-500 bg-blue-50/10' : 'border-gray-100'} transition-all`}>
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><CreditCard size={20} /></div>
                                    <div><p className="font-bold text-gray-800 text-sm">Stripe / Card Payment</p><p className="text-[11px] text-gray-400 mt-0.5">Pay using credit/debit card</p></div>
                                </div>
                                <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-blue-500"></div></div>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/10 transition-colors flex justify-center items-center gap-2">
                            {loading ? <span>Redirecting to Stripe...</span> : <><DollarSign size={18} /><span>Proceed to Pay</span></>}
                        </button>
                    </form>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-3xl shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Due Amount</p>
                        <p className="text-3xl font-black mt-2 tracking-tight">${dueAmount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Paid Till Date</p>
                        <p className="text-2xl font-black mt-2 text-gray-800 tracking-tight">${totalPaid}</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}