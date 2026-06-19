export default function StatCard({ title, value, icon: Icon, color = 'indigo', subtitle }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
                    <Icon size={20} />
                </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}
