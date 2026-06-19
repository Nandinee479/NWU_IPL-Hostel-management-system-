const variants = {
    available: 'bg-green-100 text-green-700',
    occupied: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-gray-100 text-gray-600',
    confirmed: 'bg-indigo-100 text-indigo-700',
    checked_in: 'bg-green-100 text-green-700',
    checked_out: 'bg-slate-100 text-slate-600',
    cancelled: 'bg-red-100 text-red-600',
    paid: 'bg-green-100 text-green-700',
    refunded: 'bg-orange-100 text-orange-700',
    default: 'bg-gray-100 text-gray-600',
};

export default function Badge({ status }) {
    const cls = variants[status] ?? variants.default;
    const label = status?.replace(/_/g, ' ');
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
            {label}
        </span>
    );
}
