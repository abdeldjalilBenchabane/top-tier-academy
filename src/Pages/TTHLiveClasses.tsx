import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LiveCard from '@/components/LiveCard';
import NavBar from '@/components/NavBar';
import Footer from '@/components/TTHFooter';
import { api } from '@/lib/api';

const TTHLiveClasses = () => {
  console.log('TTHLiveClasses mounted');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await api.get('/live-sessions');
        console.log('Réponse API /live-sessions:', data);
        setLiveEvents(
          data
            .filter(session => session.status !== 'cancelled')
            .map((session) => {
              let status = session.status;
              if (!status) {
                const start = new Date(session.start_time);
                const now = new Date();
                if (session.is_ended) status = 'ended';
                else if (now >= start) status = 'live';
                else status = 'upcoming';
              }
              return {
                id: session.id,
                title: session.title,
                presenter: session.professor_name || session.professorId || 'أستاذ مباشر',
                date: session.start_time ? new Date(session.start_time).toLocaleDateString('fr-FR') : '',
                time: session.start_time ? new Date(session.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
                price: session.price,
                currency: session.currency || 'DA',
                expectedViewers: session.expected_viewers || 0,
                thumbnail: session.thumbnail || '',
                status,
                isPaid: session.is_paid || false,
                description: session.description || '',
              };
            })
        );
      } catch (err) {
        setLiveEvents([]);
      }
    };
    fetchSessions();
  }, []);

  console.log('liveEvents:', liveEvents);

  const filteredEvents = liveEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.presenter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'live' && event.status === 'live') ||
      (filterStatus === 'upcoming' && event.status === 'upcoming') ||
      (filterStatus === 'paid' && event.isPaid);
    return matchesSearch && matchesFilter;
  });

  return (
    <div >
      <NavBar />
      <div className="min-h-screen  bg-blue-900 mt-[1px] " dir="rtl">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10  top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">منصة البث المباشر</h1>
              </div>

            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="ابحث عن البث المباشر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-purple-500"
                />
              </div>
              <div className="flex  gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? 'bg-purple-600 hover:bg-purple-700' : 'border-white/20 bg-white/15 text-white hover:bg-white/10'}
                >
                  الكل
                </Button>
                <Button
                  variant={filterStatus === 'live' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('live')}
                  className={filterStatus === 'live' ? 'bg-red-600 hover:bg-red-700' : 'border-white/20 bg-white/15 text-white hover:bg-white/10'}
                >
                  مباشر
                </Button>
                <Button
                  variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('upcoming')}
                  className={filterStatus === 'upcoming' ? 'bg-blue-600 hover:bg-blue-700' : 'border-white/20 bg-white/15 text-white hover:bg-white/10'}
                >
                  قريباً
                </Button>
                <Button
                  variant={filterStatus === 'paid' ? 'default' : 'outline'}
                  onClick={() => setFilterStatus('paid')}
                  className={filterStatus === 'paid' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-white/20 bg-white/15  text-white hover:bg-white/10'}
                >
                  مدفوع
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {liveEvents.filter(e => e.status === 'live').length}
              </div>
              <div className="text-gray-300">بث مباشر الآن</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {liveEvents.filter(e => e.status === 'upcoming').length}
              </div>
              <div className="text-gray-300">بث قادم</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {liveEvents.filter(e => e.isPaid).length}
              </div>
              <div className="text-gray-300">مدفوع</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">
                {liveEvents.reduce((sum, e) => sum + e.expectedViewers, 0).toLocaleString()}
              </div>
              <div className="text-gray-300">إجمالي المشاهدين المتوقع</div>
            </div>
          </div>

          {/* Live Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <LiveCard key={event.id} {...event} />
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">لا توجد نتائج مطابقة لبحثك</div>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                مسح الفلاتر
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className='mt-[1px]'>
        <Footer />
      </div>
    </div>
  );
};

export default TTHLiveClasses;
