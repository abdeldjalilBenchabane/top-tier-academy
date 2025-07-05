import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Coins, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { paymentsAPI } from '@/services/api';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    if (transactionId) {
      fetchTransactionStatus();
    } else {
      setLoading(false);
    }
  }, [transactionId]);

  const fetchTransactionStatus = async () => {
    try {
      const response = await paymentsAPI.getTransactionStatus(transactionId!);
      setTransaction(response.transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الدفع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              تم الدفع بنجاح! 🎉
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                شكراً لك! تم إضافة النقاط إلى حسابك بنجاح
              </p>
            </div>

            {transaction && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">رقم المعاملة:</span>
                  <span className="font-mono text-sm">{transaction.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">المبلغ:</span>
                  <span className="font-bold text-green-600">
                    {transaction.amount?.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">النقاط المضافة:</span>
                  <span className="font-bold text-blue-600">
                    {transaction.points?.toLocaleString()} نقطة
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">الحالة:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    مكتمل
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center space-x-4 space-x-reverse">
              <Coins className="w-8 h-8 text-yellow-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">النقاط جاهزة للاستخدام!</p>
                <p className="text-sm text-gray-600">يمكنك الآن استخدام نقاطك في جميع الخدمات</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => navigate('/')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
              <Button 
                onClick={() => navigate('/points')}
                variant="outline"
                className="flex-1"
              >
                <Coins className="w-4 h-4 ml-2" />
                شراء المزيد
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess; 