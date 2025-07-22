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
  const [markCompletedLog, setMarkCompletedLog] = useState<string | null>(null);
  const [debugTransactions, setDebugTransactions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const transactionId = searchParams.get('transaction_id');
  const checkoutId = searchParams.get('checkout_id');

  useEffect(() => {
    const markCompletedIfNeeded = async () => {
      if (checkoutId || transactionId) {
        try {
          console.log('Calling /api/payments/mark-completed', { checkoutId, transactionId });
          const res = await fetch('/api/payments/mark-completed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkout_id: checkoutId, transaction_id: transactionId })
          });
          const data = await res.json();
          setMarkCompletedLog(JSON.stringify(data, null, 2));
        } catch (err) {
          setMarkCompletedLog('Error calling /mark-completed: ' + (err instanceof Error ? err.message : String(err)));
          setErrorMsg('Failed to call /api/payments/mark-completed. See browser console for details.');
        }
      } else {
        setErrorMsg('No checkout_id or transaction_id found in URL.');
      }
    };
    markCompletedIfNeeded();
  }, [checkoutId, transactionId]);

  useEffect(() => {
    // Fetch last 5 transactions for debug
    fetch('/api/payments/debug/transactions')
      .then(res => res.json())
      .then(setDebugTransactions)
      .catch(() => setDebugTransactions([]));
  }, []);

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
            {errorMsg && (
              <div className="bg-red-100 text-red-700 rounded-lg p-3 mb-3 border border-red-300">
                <strong>Frontend Error:</strong> {errorMsg}
              </div>
            )}
            {markCompletedLog && (
              <div className="bg-yellow-50 text-left text-xs rounded-lg p-3 mb-3 border border-yellow-300">
                <strong>Backend /mark-completed log:</strong>
                <pre className="whitespace-pre-wrap break-all">{markCompletedLog}</pre>
              </div>
            )}
            {debugTransactions.length > 0 && (
              <div className="bg-blue-50 text-left text-xs rounded-lg p-3 mb-3 border border-blue-300">
                <strong>Last 5 DB Transactions:</strong>
                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(debugTransactions, null, 2)}</pre>
              </div>
            )}
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