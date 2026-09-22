import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { paymentsAPI } from '../services/api';
import { serverDate } from '@/lib/utils';

const PointsFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    const checkTransaction = async () => {
      if (transactionId) {
        try {
          const response = await paymentsAPI.getTransactionStatus(transactionId);
          setTransaction(response.transaction);
        } catch (error) {
          console.error('Error fetching transaction:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkTransaction();
  }, [transactionId]);

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
          <CardHeader className="pb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">
              فشل في عملية الدفع
            </CardTitle>
            <p className="text-gray-600">
              عذراً، حدث خطأ أثناء عملية الدفع. يرجى المحاولة مرة أخرى.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {transaction && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  <p>رقم المعاملة: {transaction.id}</p>
                  <p>الحالة: {transaction.status}</p>
                  <p>التاريخ: {serverDate(transaction.created_at).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/points')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                المحاولة مرة أخرى
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة للرئيسية
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PointsFailure; 