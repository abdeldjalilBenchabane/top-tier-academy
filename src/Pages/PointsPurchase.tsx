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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">شراء النقاط</h1>
              <p className="text-gray-600">اختر الباقة المناسبة لك</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">رصيدك الحالي</p>
              <p className="text-2xl font-bold text-blue-600">
                {user?.pointsBalance || 0} نقطة
              </p>
            </div>
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <Card key={pkg.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
              {/* Popular badge for middle package */}
              {index === 1 && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-yellow-500 text-white px-3 py-1">
                    الأكثر شعبية
                  </Badge>
                </div>
              )}
              
              <CardHeader className={`bg-gradient-to-r ${getPackageColor(index)} text-white pb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {getPackageIcon(index)}
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {pkg.points.toLocaleString()}
                  </div>
                  <p className="text-gray-600">نقطة</p>
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {pkg.price.toLocaleString()}
                  </div>
                  <p className="text-gray-500">دينار جزائري</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">نقاط صالحة مدى الحياة</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">دفع آمن عبر Chargily</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">تأكيد فوري</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => handlePurchase(pkg.id, pkg.price, pkg.name)}
                  disabled={purchaseLoading === pkg.id}
                  className={`w-full bg-gradient-to-r ${getPackageColor(index)} hover:opacity-90 text-white font-semibold py-3`}
                >
                  {purchaseLoading === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
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
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات مهمة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>النقاط صالحة لجميع الخدمات</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>دفع آمن عبر Chargily</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>استرداد الأموال متاح</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Check className="w-4 h-4 text-green-500" />
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