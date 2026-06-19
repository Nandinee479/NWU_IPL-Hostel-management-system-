import React, { useState, useEffect } from 'react';
import AppLayout from '../../Layouts/AppLayout';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { BedDouble, Search, Inbox, Users } from 'lucide-react';

export default function RoomManagement() {
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');
    const [stats, setStats] = useState({ total: 0, occupied: 0, vacant: 0, maintenance: 0, rate: 0 });

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                // First try to read from rooms collection
                let roomList = [];
                let totalRooms = 0;

                const roomsSnap = await getDocs(query(collection(db, "rooms"), orderBy("roomNo", "asc")));
                
                if (!roomsSnap.empty) {
                    // rooms collection exists with data
                    roomsSnap.forEach((doc) => {
                        const data = doc.data();
                        let detectedFloor = "1st Floor";
                        if (data.roomNo && data.roomNo.includes('-')) {
                            const floorNum = data.roomNo.split('-')[1]?.charAt(0);
                            if (floorNum === '1') detectedFloor = "1st Floor";
                            else if (floorNum === '2') detectedFloor = "2nd Floor";
                            else if (floorNum === '3') detectedFloor = "3rd Floor";
                            else if (floorNum === '4') detectedFloor = "4th Floor";
                            else if (floorNum === '5') detectedFloor = "5th Floor";
                            else detectedFloor = `${floorNum}th Floor`;
                        }
                        roomList.push({ id: doc.id, floor: detectedFloor, monthlyRent: 5000, ...data });
                    });
                }

                // Read approved students with room info
                const usersSnap = await getDocs(query(collection(db, "users"), where("status", "==", "approved")));
                const roomMap = {};

                usersSnap.forEach((doc) => {
                    const data = doc.data();
                    const roomNo = data.room_type || '';
                    if (!roomNo) return;
                    
                    if (!roomMap[roomNo]) {
                        roomMap[roomNo] = {
                            roomNo,
                            status: 'occupied',
                            students: []
                        };
                        // auto floor detection
                        let detectedFloor = "1st Floor";
                        if (roomNo.includes('-')) {
                            const floorNum = roomNo.split('-')[1]?.charAt(0);
                            if (floorNum === '1') detectedFloor = "1st Floor";
                            else if (floorNum === '2') detectedFloor = "2nd Floor";
                            else if (floorNum === '3') detectedFloor = "3rd Floor";
                            else if (floorNum === '4') detectedFloor = "4th Floor";
                            else if (floorNum === '5') detectedFloor = "5th Floor";
                            else detectedFloor = `${floorNum}th Floor`;
                        }
                        roomMap[roomNo].floor = detectedFloor;
                    }
                    roomMap[roomNo].students.push({
                        name: data.name || 'Unknown',
                        uid: data.uid || doc.id
                    });
                });

                // Merge: if rooms collection had data, use it; otherwise build from students
                if (roomList.length > 0) {
                    // Mark rooms as occupied if matching student found
                    roomList.forEach(room => {
                        if (roomMap[room.roomNo]) {
                            room.status = 'occupied';
                            room.student = roomMap[room.roomNo].students[0]?.name || '-';
                            room.studentId = roomMap[room.roomNo].students[0]?.uid?.substring(0, 7) || '-';
                        }
                    });
                } else {
                    // Build room list from student room data
                    roomList = Object.values(roomMap).map(r => ({
                        id: r.roomNo,
                        roomNo: r.roomNo,
                        floor: r.floor,
                        status: 'occupied',
                        student: r.students[0]?.name || '-',
                        studentId: r.students[0]?.uid?.substring(0, 7) || '-',
                        monthlyRent: 5000,
                        joinDate: '-'
                    }));
                }

                let occupied = 0, vacant = 0, maintenance = 0;
                roomList.forEach(r => {
                    const s = r.status?.toLowerCase();
                    if (s === 'occupied') occupied++;
                    else if (s === 'vacant') vacant++;
                    else if (s === 'maintenance') maintenance++;
                });

                totalRooms = roomList.length;
                setRooms(roomList);
                setStats({
                    total: totalRooms,
                    occupied,
                    vacant,
                    maintenance,
                    rate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0
                });
                setLoading(false);
            } catch (error) {
                console.error("Error loading rooms:", error);
                setLoading(false);
            }
        };

        fetchRooms();
    }, []);

    const filteredRooms = rooms.filter(room => {
        if (statusFilter === 'All') return true;
        return room.status?.toLowerCase() === statusFilter.toLowerCase();
    });

    if (loading) {
        return (
            <AppLayout title="Room Management">
                <div className="flex justify-center items-center h-64 text-gray-500 font-bold">
                    Loading Rooms from Student Records...
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Room Management">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Room Management</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor and manage all hostel rooms</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Rooms</p>
                    <h3 className="text-3xl font-black text-gray-800">{stats.total}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative">
                    {stats.rate > 0 && (
                        <span className="absolute top-6 right-6 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                            ↑ {stats.rate}%
                        </span>
                    )}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Occupied</p>
                    <h3 className="text-3xl font-black text-gray-800">{stats.occupied}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vacant</p>
                    <h3 className="text-3xl font-black text-gray-800">{stats.vacant}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maintenance</p>
                    <h3 className="text-3xl font-black text-gray-800">{stats.maintenance}</h3>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-800">Occupancy Rate</span>
                    <span className="text-lg font-black text-blue-600">{stats.rate}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-1000" 
                        style={{ width: `${stats.rate}%` }}
                    />
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-semibold text-gray-400 ml-2 whitespace-nowrap">Filter by status:</span>
                <div className="flex gap-2">
                    {['All', 'Occupied', 'Vacant', 'Maintenance'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                statusFilter === status 
                                ? 'bg-[#0f172a] text-white shadow-md' 
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50">
                    <div>
                        <h2 className="font-bold text-gray-800 text-base">All Rooms</h2>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Showing {filteredRooms.length} of {stats.total} rooms</p>
                    </div>
                </div>

                {filteredRooms.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-semibold">No rooms found</p>
                        <p className="text-xs text-gray-400 mt-1">Rooms will appear here once students are assigned.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/10">
                                    <th className="px-8 py-4">Room No.</th>
                                    <th className="px-6 py-4">Floor</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Student ID</th>
                                    <th className="px-6 py-4">Total Students</th>
                                    <th className="px-8 py-4 text-right">Monthly Rent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <BedDouble size={16} className="text-gray-400" />
                                                <span className="font-bold text-gray-700 text-sm">{room.roomNo}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-gray-500 font-medium">{room.floor || '1st Floor'}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                                room.status?.toLowerCase() === 'occupied' ? 'bg-green-50 text-green-600' :
                                                room.status?.toLowerCase() === 'vacant' ? 'bg-gray-50 text-gray-500' :
                                                room.status?.toLowerCase() === 'maintenance' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-gray-50 text-gray-400'
                                            }`}>
                                                {room.status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-medium text-gray-700">{room.student || '-'}</td>
                                        <td className="px-6 py-5 text-sm text-gray-500">{room.studentId || '-'}</td>
                                        <td className="px-6 py-5 text-sm text-gray-500">
                                            {room.students ? (
                                                <span className="flex items-center gap-1"><Users size={14} className="text-gray-400" />{room.students.length}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-8 py-5 text-right text-sm font-bold text-gray-800">
                                            {room.monthlyRent ? `৳${room.monthlyRent.toLocaleString()}` : '-'}
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