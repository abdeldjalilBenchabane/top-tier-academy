import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pointsAPI, paymentsAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Coins, Check, Star, Zap, Key } from 'lucide-react';
import { PointPackage } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

declare global {
  interface Window {
    refreshUserPoints?: () => void;
  }
}

const PointsPurchase: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [codeQuantity, setCodeQuantity] = useState<number>(1);
  const [pointsBalance, setPointsBalance] = useState<number>(user?.pointsBalance || 0);

  useEffect(() => {
    fetchPackages();
    fetchPointsBalance();
    // eslint-disable-next-line
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

  const fetchPointsBalance = async () => {
    try {
      const response = await pointsAPI.getBalance();
      setPointsBalance(response.balance);
      updateUser({ pointsBalance: response.balance });
    } catch (error) {
      setPointsBalance(0);
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

  const handleRedeemCode = async () => {
    if (!redeemCode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a code"
      });
      return;
    }
    
    setCodeLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/points/codes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code: redeemCode })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      toast({
        variant: "default",
        title: "Success",
        description: data.message
      });
      setRedeemCode('');
      fetchPointsBalance();
      if (typeof window.refreshUserPoints === 'function') {
        window.refreshUserPoints();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to redeem code'
      });
    } finally {
      setCodeLoading(false);
      setIsRedeemDialogOpen(false);
    }
  };

  const handleGenerateCodes = async () => {
    if (!selectedPackage || codeQuantity < 1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a package and enter valid quantity"
      });
      return;
    }

    setCodeLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/points/codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          packageId: selectedPackage,
          quantity: codeQuantity
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      toast({
        variant: "default",
        title: "Success",
        description: `Generated ${codeQuantity} codes successfully`
      });
      setIsRedeemDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to generate codes'
      });
    } finally {
      setCodeLoading(false);
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
          <div className="flex flex-col gap-2">
            <div className="text-right bg-white/80 rounded-2xl px-6 py-4 shadow-md border border-blue-100">
              <p className="text-sm text-blue-700 font-semibold mb-1">رصيدك الحالي</p>
              <p className="text-3xl font-extrabold text-blue-700 tracking-widest">
                {pointsBalance} <span className="text-lg font-bold">نقطة</span>
              </p>
            </div>
            <Button 
              variant="secondary"
              className="w-full bg-white text-blue-700 hover:bg-blue-50"
              onClick={() => setIsRedeemDialogOpen(true)}
            >
              <Key className="h-4 w-4 ml-2" />
              استخدام رمز النقاط
            </Button>
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

      {/* Redeem Code Dialog */}
      <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>استخدام رمز النقاط</DialogTitle>
            <DialogDescription>أدخل رمز النقاط الذي حصلت عليه من الإدارة أو من بطاقة مطبوعة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              className="w-full border rounded-lg px-4 py-2 text-lg"
              placeholder="أدخل الرمز هنا"
              value={redeemCode}
              onChange={e => setRedeemCode(e.target.value)}
              disabled={codeLoading}
              dir="ltr"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedeemDialogOpen(false)} disabled={codeLoading}>
              إلغاء
            </Button>
            <Button onClick={handleRedeemCode} disabled={codeLoading || !redeemCode}>
              {codeLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  جاري التحقق...
                </>
              ) : (
                'تفعيل الرمز'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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