import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            {links.map((link, i) => {
                if (link.label === '&laquo; Previous') {
                    return (
                        <span key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${link.url ? 'text-gray-600 cursor-pointer hover:bg-gray-100' : 'text-gray-300 pointer-events-none'}`}>
                            <ChevronLeft size={14} /> Prev
                        </span>
                    );
                }
                if (link.label === 'Next &raquo;') {
                    return (
                        <span key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${link.url ? 'text-gray-600 cursor-pointer hover:bg-gray-100' : 'text-gray-300 pointer-events-none'}`}>
                            Next <ChevronRight size={14} />
                        </span>
                    );
                }
                return (
                    <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                        link.active ? 'bg-indigo-600 text-white' : link.url ? 'text-gray-600 cursor-pointer hover:bg-gray-100' : 'text-gray-300 pointer-events-none'
                    }`}>
                        {link.label}
                    </span>
                );
            })}
        </div>
    );
}
