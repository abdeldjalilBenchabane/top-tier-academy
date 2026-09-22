import React, { useEffect, useState } from 'react';
import { pointsAPI } from '@/services/api';
import { serverDate } from '@/lib/utils';

const PointsHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await pointsAPI.getMyTransactions();
        setTransactions(res.transactions || []);
      } catch (err: any) {
        setError('فشل في تحميل سجل النقاط');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">سجل معاملات النقاط</h2>
        {loading ? (
          <div className="text-center text-[#194cbf]">جاري التحميل...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-gray-500">لا توجد معاملات نقاط بعد.</div>
        ) : (
          <table className="w-full text-right border">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-2">النوع</th>
                <th className="p-2">المبلغ</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">التاريخ</th>
                <th className="p-2">الوصف</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b">
                  <td className="p-2">{tx.transaction_type}</td>
                  <td className="p-2">{tx.points}</td>
                  <td className="p-2">{tx.status}</td>
                  <td className="p-2">{serverDate(tx.created_at).toLocaleString('ar-EG')}</td>
                  <td className="p-2">{tx.metadata && tx.metadata.packageName ? tx.metadata.packageName : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PointsHistory; 