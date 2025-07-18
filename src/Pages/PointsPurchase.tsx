import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pointsAPI, paymentsAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Coins, Check, Star, Zap } from 'lucide-react';
import { PointPackage } from '@/types';

const PointsPurchase: React.FC = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await pointsAPI.getPackages();
      setPackages(response.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setAlert({ type: 'error', message: 'فشل في تحميل الباقات' });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string, amount: number, packageName: string) => {
    try {
      setPurchaseLoading(packageId);
      setAlert(null);

      // Create Chargily checkout
      const checkoutData = {
        amount,
        currency: 'dzd',
        packageId,
        packageName
      };

      const response = await paymentsAPI.createCheckout(checkoutData);
      
      if (response.success && response.checkoutUrl) {
        // Redirect to Chargily payment page
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout');
      }
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      setAlert({ 
        type: 'error', 
        message: 'فشل في إنشاء طلب الشراء. يرجى المحاولة مرة أخرى.' 
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const getPackageIcon = (index: number) => {
    switch (index) {
      case 0: return <Coins className="w-6 h-6" />;
      case 1: return <Star className="w-6 h-6" />;
      case 2: return <Zap className="w-6 h-6" />;
      default: return <Coins className="w-6 h-6" />;
    }
  };

  const getPackageColor = (index: number) => {
    switch (index) {
      case 0: return 'from-blue-500 to-blue-600';
      case 1: return 'from-purple-500 to-purple-600';
      case 2: return 'from-orange-500 to-orange-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل الباقات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-orange-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">شراء النقاط</h1>
            <p className="text-blue-100 text-lg font-semibold">اختر الباقة المناسبة لك وادفع بأمان</p>
            </div>
          <div className="text-right bg-white/80 rounded-2xl px-6 py-4 shadow-md border border-blue-100">
            <p className="text-sm text-blue-700 font-semibold mb-1">رصيدك الحالي</p>
            <p className="text-3xl font-extrabold text-blue-700 tracking-widest">
              {user?.pointsBalance || 0} <span className="text-lg font-bold">نقطة</span>
              </p>
          </div>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Alert className={alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Packages */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {packages.map((pkg, index) => (
            <Card
              key={pkg.id}
              onClick={() => !purchaseLoading && handlePurchase(pkg.id, pkg.price, pkg.name)}
              className={`relative overflow-hidden shadow-xl rounded-3xl border-0 transition-all duration-300 cursor-pointer ${index === 1 ? 'scale-105 z-10 ring-4 ring-yellow-400/30' : 'hover:scale-105'} ${purchaseLoading === pkg.id ? 'opacity-70 pointer-events-none' : ''}`}
              style={{ minHeight: 420 }}
            >
              {/* Popular badge for middle package */}
              {index === 1 && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-yellow-500 text-white px-4 py-1 text-base shadow-lg">الأكثر شعبية</Badge>
                </div>
              )}
              <CardHeader className={`bg-gradient-to-r ${getPackageColor(index)} text-white pb-6 pt-8 px-6 rounded-t-3xl shadow-md`}> 
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {getPackageIcon(index)}
                    <CardTitle className="text-2xl font-extrabold tracking-tight drop-shadow-lg">{pkg.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center justify-between h-full">
                <div className="text-center mb-6">
                  <div className="text-5xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                    {pkg.points.toLocaleString()}
                  </div>
                  <p className="text-blue-700 text-lg font-bold">نقطة</p>
                </div>
                <div className="text-center mb-6">
                  <div className="text-4xl font-extrabold text-purple-700 mb-1 drop-shadow-sm">
                    {pkg.price.toLocaleString()}
                  </div>
                  <p className="text-gray-500 font-semibold">دينار جزائري</p>
                </div>
                <div className="space-y-3 mb-8 w-full">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-base text-gray-700 font-semibold">نقاط صالحة مدى الحياة</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-base text-gray-700 font-semibold">دفع آمن عبر Chargily</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-base text-gray-700 font-semibold">تأكيد فوري</span>
                  </div>
                </div>
                <Button
                  onClick={() => handlePurchase(pkg.id, pkg.price, pkg.name)}
                  disabled={purchaseLoading === pkg.id}
                  className={`w-full bg-gradient-to-r ${getPackageColor(index)} hover:opacity-90 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg`}
                >
                  {purchaseLoading === pkg.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      جاري إنشاء الدفع...
                    </>
                  ) : (
                    'شراء الآن'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg rounded-3xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-extrabold text-blue-700 mb-6">معلومات مهمة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-gray-700">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>النقاط صالحة لجميع الخدمات</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>دفع آمن عبر Chargily</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>استرداد الأموال متاح</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>دعم فني على مدار الساعة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PointsPurchase; 