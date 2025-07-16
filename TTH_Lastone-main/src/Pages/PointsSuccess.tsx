import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { paymentsAPI, pointsAPI } from '../services/api';

const PointsSuccess: React.FC = () => {
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
          
          // If transaction is completed, update user points in navbar
          if (response.transaction.status === 'completed') {
            // Trigger a custom event to update navbar points
            window.dispatchEvent(new CustomEvent('pointsUpdated', {
              detail: { points: response.transaction.points }
            }));
          }
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من المعاملة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Card className="text-center">
          <CardHeader className="pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              تم الشراء بنجاح!
            </CardTitle>
            <p className="text-gray-600">
              شكراً لك على شراء النقاط. تم إضافة النقاط إلى حسابك بنجاح.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {transaction && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 space-x-reverse mb-3">
                  <Coins className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-lg">
                    {transaction.points?.toLocaleString()} نقطة
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>رقم المعاملة: {transaction.id}</p>
                  <p>المبلغ: {transaction.amount} {transaction.currency}</p>
                  <p>التاريخ: {new Date(transaction.created_at).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/points')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                العودة إلى صفحة النقاط
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PointsSuccess; 