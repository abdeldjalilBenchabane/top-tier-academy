import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

/**
 * One confirmation dialog for every purchase a student can make, so nothing is
 * ever bought by a single accidental tap.
 *
 * Usage:
 *   const confirmPurchase = useConfirmPurchase();
 *   if (!(await confirmPurchase({ title, price, balance }))) return;
 */
const PurchaseConfirmContext = createContext(null);

export const useConfirmPurchase = () => {
  const ctx = useContext(PurchaseConfirmContext);
  // Never block a purchase just because the provider is missing.
  return ctx || (async () => true);
};

export const PurchaseConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null);
  const resolver = useRef(null);

  const confirmPurchase = useCallback((options) => {
    setRequest(options || {});
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  const settle = (value) => {
    setRequest(null);
    if (resolver.current) { resolver.current(value); resolver.current = null; }
  };

  const price = Number(request?.price ?? 0);
  const balance = Number(request?.balance ?? 0);
  const knowBalance = request?.balance !== undefined && request?.balance !== null;
  const after = balance - price;
  const affordable = !knowBalance || after >= 0;

  return (
    <PurchaseConfirmContext.Provider value={confirmPurchase}>
      {children}

      {request && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          dir="rtl"
          onClick={() => settle(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-lg font-extrabold text-gray-900">تأكيد الشراء</h3>
            <p className="mb-4 text-sm text-gray-500">
              {request.kindLabel || 'سيتم خصم النقاط من رصيدك مباشرة.'}
            </p>

            <div className="mb-4 space-y-2 rounded-xl bg-gray-50 p-3 text-sm">
              {request.title && (
                <div className="flex justify-between gap-3">
                  <span className="text-gray-600">العنصر</span>
                  <span className="max-w-[60%] truncate font-bold text-gray-900">{request.title}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">السعر</span>
                <span className="font-bold text-[#194cbf]">{price.toLocaleString()} نقطة</span>
              </div>
              {knowBalance && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">رصيدك الحالي</span>
                    <span className="font-bold text-gray-900">{balance.toLocaleString()} نقطة</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">رصيدك بعد الشراء</span>
                    <span className={`font-extrabold ${affordable ? 'text-green-700' : 'text-red-600'}`}>
                      {after.toLocaleString()} نقطة
                    </span>
                  </div>
                </>
              )}
            </div>

            {!affordable && (
              <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
                نقاطك غير كافية لإتمام هذا الشراء.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => settle(false)}
                className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 font-bold text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => settle(true)}
                disabled={!affordable}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#194cbf] to-[#61a1ff] py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                تأكيد الشراء
              </button>
            </div>
          </div>
        </div>
      )}
    </PurchaseConfirmContext.Provider>
  );
};

export default PurchaseConfirmProvider;
