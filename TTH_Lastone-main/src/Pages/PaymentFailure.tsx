import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { paymentsAPI } from '@/services/api';

const PaymentFailure: React.FC = () => {
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من المعاملة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <XCircle className="w-16 h-16 text-red-600 mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              فشل في الدفع
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                عذراً، حدث خطأ أثناء معالجة الدفع
              </p>
              <p className="text-red-700 text-sm mt-2">
                لم يتم خصم أي مبلغ من حسابك
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
                  <span className="font-bold text-gray-900">
                    {transaction.amount?.toLocaleString()} دج
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">الحالة:</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    فشل
                  </span>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">نصائح لحل المشكلة:</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-right">
                <li>• تأكد من صحة بيانات البطاقة</li>
                <li>• تحقق من توفر الرصيد الكافي</li>
                <li>• تأكد من تفعيل الدفع عبر الإنترنت</li>
                <li>• جرب بطاقة أخرى إذا استمرت المشكلة</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
              <Button 
                onClick={() => navigate('/points')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                المحاولة مرة أخرى
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFailure; 