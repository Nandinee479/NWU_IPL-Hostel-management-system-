import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { useAuth } from '../../AuthContext';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { DollarSign, CheckCircle2, XCircle, Inbox } from 'lucide-react';

const FIXED_MONTHLY_BILL = 5000;

export default function PaymentHistory() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({ totalAmount: 0, totalPaid: 0, totalDue: 0, paidPercentage: 0 });

    useEffect(() => {
        const fetchPaymentHistory = async () => {
            if (!user?.uid) return;
            try {
                // 1. Try reading from payments collection
                let totalBilled = 0, totalPaidAmount = 0, totalDueAmount = 0;
                let paymentList = [];

                try {
                    const q = query(
                        collection(db, "payments"),
                        where("studentId", "==", user.uid)
                    );
                    const querySnapshot = await getDocs(q);

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        paymentList.push({ id: doc.id, ...data });
                        totalBilled += Number(data.billed || 0);
                        totalPaidAmount += Number(data.paid || 0);
                        totalDueAmount += Number(data.due || 0);
                    });
                } catch (e) {
                    console.warn("Payments collection query failed, falling back to user doc:", e);
                }

                paymentList.sort((a, b) => ((b.createdAt || '')).localeCompare(a.createdAt || ''));
                setPayments(paymentList);

                // 2. Fallback: read from user doc for paid/due amounts
                if (totalBilled === 0) {
                    try {
                        const userSnap = await getDoc(doc(db, "users", user.uid));
                        if (userSnap.exists()) {
                            const d = userSnap.data();
                            const paid = Number(d.total_paid || 0);
                            let due = d.due_amount !== undefined ? Number(d.due_amount) : FIXED_MONTHLY_BILL;
                            if (d.due_amount === undefined && paid > 0) {
                                due = Math.max(0, FIXED_MONTHLY_BILL - paid);
                            }
                            totalBilled = paid + due;
                            totalPaidAmount = paid;
                            totalDueAmount = due;
                        }
                    } catch (e) {
                        console.warn("User doc fallback failed:", e);
                    }
                }

                if (totalBilled > 0) {
                    const percentage = Math.round((totalPaidAmount / totalBilled) * 100);
                    setStats({
                        totalAmount: totalBilled,
                        totalPaid: totalPaidAmount,
                        totalDue: totalDueAmount,
                        paidPercentage: percentage
                    });
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching payment history:", error);
                setLoading(false);
            }
        };

        fetchPaymentHistory();
    }, [user?.uid]);

    if (loading) {
        return (
            <AppLayout title="Payment History">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Payment History...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Payment History">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Payment History</h1>
                <p className="text-sm text-gray-500 mt-1">Track your monthly payments and dues</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Amount */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit">
                        <DollarSign size={18} />
                    </div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">৳{stats.totalAmount.toLocaleString()}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Total billed amount</p>
                    </div>
                </div>

                {/* Total Paid */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36 relative">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                        <CheckCircle2 size={18} />
                    </div>
                    {stats.paidPercentage > 0 && (
                        <span className="absolute top-6 right-6 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                            ↑ {stats.paidPercentage}%
                        </span>
                    )}
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Paid</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">৳{stats.totalPaid.toLocaleString()}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{stats.paidPercentage}% of total</p>
                    </div>
                </div>

                {/* Total Due */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-36">
                    <div className="p-2.5 bg-red-50 text-red-500 rounded-xl w-fit">
                        <XCircle size={18} />
                    </div>
                    <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Due</p>
                        <h3 className="text-2xl font-black text-gray-800 mt-1">৳{stats.totalDue.toLocaleString()}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Pending payment</p>
                    </div>
                </div>
            </div>

            {/* Payment Details Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-50">
                    <h2 className="font-bold text-gray-800 text-base">Monthly Payment Details</h2>
                    <p className="text-[11px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">All billing records</p>
                </div>

                {payments.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Inbox size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
                        <p className="text-sm font-semibold">No billing records found</p>
                        <p className="text-xs text-gray-400 mt-1">Your monthly invoices and payments will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/20">
                                    <th className="px-8 py-4">Month</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Billed</th>
                                    <th className="px-6 py-4">Paid</th>
                                    <th className="px-6 py-4">Due</th>
                                    <th className="px-8 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-8 py-5 font-bold text-gray-700 text-sm">{payment.month}</td>
                                        <td className="px-6 py-5 text-gray-500 text-xs">{payment.date}</td>
                                        <td className="px-6 py-5 font-bold text-gray-700 text-sm">৳{Number(payment.billed).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600 text-sm">৳{Number(payment.paid).toLocaleString()}</td>
                                        <td className="px-6 py-5 font-bold text-orange-600 text-sm">৳{Number(payment.due).toLocaleString()}</td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex justify-center">
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                                    payment.status?.toLowerCase() === 'paid' 
                                                    ? 'bg-green-50 text-green-600' 
                                                    : payment.status?.toLowerCase() === 'due'
                                                    ? 'bg-red-50 text-red-600'
                                                    : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        payment.status?.toLowerCase() === 'paid' 
                                                        ? 'bg-green-500' 
                                                        : payment.status?.toLowerCase() === 'due'
                                                        ? 'bg-red-500'
                                                        : 'bg-orange-500'
                                                    }`} />
                                                    {payment.status}
                                                </span>
                                            </div>
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
