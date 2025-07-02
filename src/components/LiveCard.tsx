
import React, { useState } from 'react';
import { Calendar, Clock, Users, Play, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface LiveCardProps {
  id: string;
  title: string;
  presenter: string;
  date: string;
  time: string;
  price: number;
  currency: string;
  expectedViewers: number;
  thumbnail: string;
  status: 'upcoming' | 'live' | 'ended';
  isPaid: boolean;
  description: string;
}

const LiveCard: React.FC<LiveCardProps> = ({
  id,
  title,
  presenter,
  date,
  time,
  price,
  currency,
  expectedViewers,
  thumbnail,
  status,
  isPaid,
  description
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    // Simulate payment process
    setTimeout(() => {
      setIsProcessingPayment(false);
      // In real implementation, this would update the isPaid status
      alert('تم الدفع بنجاح! يمكنك الآن الوصول إلى البث المباشر.');
    }, 2000);
  };

  const handleAccessLive = () => {
    if (status === 'live' && isPaid) {
      navigate(`/streaming/${id}`);
    } else if (status === 'upcoming') {
      alert('البث لم يبدأ بعد. سيتم إشعارك عند بدء البث.');
    } else if (!isPaid) {
      handlePayment();
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
            مباشر الآن
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <Clock className="w-3 h-3 mr-1" />
            قريباً
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            انتهى
          </Badge>
        );
    }
  };

  const getActionButton = () => {
    if (status === 'ended') {
      return (
        <Button disabled className="w-full" variant="secondary">
          انتهى البث
        </Button>
      );
    }

    if (isPaid) {
      if (status === 'live') {
        return (
          <Button onClick={handleAccessLive} className="w-full bg-cyan-500 hover:bg-cyan-600">
            <Play className="w-4 h-4 ml-2" />
            دخول البث المباشر
          </Button>
        );
      } else {
        return (
          <Button disabled className="w-full bg-cyan-500">
            <CheckCircle className="w-4 h-4 ml-2" />
            تم الدفع - في انتظار البث
          </Button>
        );
      }
    }

    return (
      <Button 
        onClick={handlePayment} 
        disabled={isProcessingPayment}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        <Lock className="w-4 h-4 ml-2" />
        {isProcessingPayment ? 'جاري المعالجة...' : `ادفع ${price} ${currency}`}
      </Button>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl group">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
        <div className="absolute top-3 left-3">
          {isPaid && (
            <Badge className="bg-cyan-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              مدفوع
            </Badge>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-bold text-xl text-white mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>
        
        <p className="text-purple-300 font-medium mb-3">
          مقدم من: {presenter}
        </p>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{expectedViewers} متوقع</span>
          </div>
          <div className="font-bold text-white text-lg">
            {price} {currency}
          </div>
        </div>

        {getActionButton()}
      </div>
    </div>
  );
};

export default LiveCard;
