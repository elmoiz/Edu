import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from 'react-query';
import axios from 'axios';
import { 
  Plus, 
  Users, 
  Video, 
  Clock, 
  LogOut, 
  BookOpen,
  Calendar,
  MoreVertical
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: '',
    description: '',
    subject: '',
    grade: ''
  });

  const { data: rooms, isLoading, refetch } = useQuery('rooms', async () => {
    const response = await axios.get(`${API_URL}/rooms`);
    return response.data.rooms;
  });

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/rooms`, newRoom);
      setShowCreateModal(false);
      setNewRoom({ title: '', description: '', subject: '', grade: '' });
      refetch();
      navigate(`/room/${response.data.roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <header className="bg-dark-card border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">منصة التعلم</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.profile?.firstName} {user?.profile?.lastName}</p>
                <p className="text-xs text-gray-400">{user?.role === 'teacher' ? 'معلم' : 'طالب'}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-light rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{rooms?.length || 0}</p>
              <p className="text-sm text-gray-400">الجلسات النشطة</p>
            </div>
          </div>
          
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-sm text-gray-400">طلاب مشتركون</p>
            </div>
          </div>
          
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">24h</p>
              <p className="text-sm text-gray-400">ساعات التعلم</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {user?.role === 'teacher' && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إنشاء جلسة جديدة
            </button>
          </div>
        )}

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">جاري التحميل...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms?.map((room) => (
              <div key={room._id} className="card p-6 hover:border-primary/50 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    room.status === 'live' ? 'bg-danger animate-pulse' : 
                    room.status === 'waiting' ? 'bg-warning' : 'bg-gray-500'
                  }`} />
                  <button className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{room.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{room.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {room.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {room.participants?.length || 0}/{room.settings?.maxParticipants}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-xs font-bold">
                      {room.teacher?.username?.[0]}
                    </div>
                    <span className="text-sm text-gray-300">{room.teacher?.username}</span>
                  </div>
                  
                  <button
                    onClick={() => handleJoinRoom(room.roomId)}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    انضمام
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && rooms?.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">لا توجد جلسات</h3>
            <p className="text-gray-400">ابدأ بإنشاء جلسة جديدة</p>
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-6">إنشاء جلسة جديدة</h2>
            
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">عنوان الجلسة</label>
                <input
                  type="text"
                  value={newRoom.title}
                  onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الوصف</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="input-field h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">المادة</label>
                  <input
                    type="text"
                    value={newRoom.subject}
                    onChange={(e) => setNewRoom({ ...newRoom, subject: e.target.value })}
                    className="input-field"
                    placeholder="مثال: الرياضيات"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">الصف</label>
                  <input
                    type="text"
                    value={newRoom.grade}
                    onChange={(e) => setNewRoom({ ...newRoom, grade: e.target.value })}
                    className="input-field"
                    placeholder="مثال: الثالث ثانوي"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary"
                >
                  إلغاء
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;