import React, { useState } from 'react';
import { supabase } from './supabase';

interface VisionUnlockProps {
  visionId: string | number;
  userEmail: string;
  onBack?: () => void;
  onSuccess?: () => void; // ✅ To'lov muvaffaqiyatli bo'lganda chaqiriladi
  t: any;
}

// Fixed exchange rate: 1 USD = 18 ZAR
const USD_TO_ZAR_RATE = 18;

const VisionUnlock: React.FC<VisionUnlockProps> = ({ visionId, userEmail, onBack, onSuccess, t }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(3);

  const handleUnlock = async () => {
    if (loading) return;
    if (amount < 3) {
      setError(t.minContribution || "Please enter a minimum contribution of $3.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "verify-paystack-payment",
        {
          body: {
            action: "initialize",
            email: userEmail,
            amount: Math.round(amount * 100), // USD cents → Edge Function converts to ZAR
            vision_id: String(visionId),
            callback_url: `${window.location.origin}/success.html?vision_id=${String(visionId)}`,
          },
        }
      );

      if (invokeError) throw new Error(t.initPaymentFailed || "We couldn't start the payment. Please try again.");
      if (!data?.data?.access_code) throw new Error(t.initPaymentFailed || "Payment gateway did not return an access code.");

      const accessCode = data.data.access_code;
      const reference = data.data.reference;

      setLoading(false);

      // Open Paystack popup
      const PaystackPop = (window as any).PaystackPop;
      const handler = PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: userEmail,
        amount: Math.round(amount * 100 * USD_TO_ZAR_RATE), // ✅ USD cents → ZAR cents
        currency: "ZAR",                                     // ✅ ZAR valyutasi
        ref: reference,
        access_code: accessCode,
        onSuccess: async (transaction: any) => {
          setLoading(true);
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const verifyResponse = await fetch(
              `${supabaseUrl}/functions/v1/verify-paystack-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                  action: "verify",
                  reference: transaction.reference,
                  vision_id: String(visionId),
                  amount: Math.round(amount * 100),
                }),
              }
            );
            const verifyData = await verifyResponse.json();
            if (!verifyData.status) throw new Error(verifyData.message || t.verificationFailed);
            // ✅ window.location.reload() o'rniga onSuccess chaqiriladi
            if (onSuccess) onSuccess();
          } catch (err: any) {
            setLoading(false);
            setError(err.message || t.verificationFailed);
          }
        },
        onCancel: () => {
          setError(t.paymentCancelled || "Payment was cancelled.");
        },
      });

      window.location.href = data.data.authorization_url;

    } catch (err: any) {
      setLoading(false);
      setError(err.message || t.initPaymentFailed || "We couldn't start the payment. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#F5F5F3] flex flex-col items-center justify-center p-6 text-center animate-fade overflow-hidden">
        <div className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full animate-spin mb-8"></div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.4em] font-bold opacity-40">{t.preparingPayment || "Connecting to secure payment gateway..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-[#F5F5F3] animate-fade relative overflow-hidden">
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md p-5 bg-black text-white rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between">
          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] uppercase tracking-widest font-black opacity-40 mb-1">SYSTEM NOTIFICATION</span>
            <p className="text-xs font-medium pr-4">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100 transition-opacity p-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      <div className="max-w-sm w-full space-y-8 bg-white p-10 md:p-14 rounded-[3rem] border border-black/5 shadow-2xl shadow-black/[0.03] flex flex-col items-center">
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.5em] opacity-40 font-bold">PROVISION</p>
          <h1 className="text-4xl serif font-normal tracking-tight text-[#111111]">{t.paywallTitle || "Unlock Your Vision"}</h1>
          <p className="text-sm opacity-50 font-light leading-relaxed serif italic">
            {t.paywallDesc || "A small contribution to keep Hazon running and support your journey."}
          </p>
        </div>

        <div className="w-full py-8 border-y border-black/5 flex flex-col items-center my-2">
          <span className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-bold mb-3">{t.contribute || "MY CONTRIBUTION"}</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setAmount(a => Math.max(3, a - 1))} className="w-10 h-10 rounded-full border border-black/10 text-xl font-bold flex items-center justify-center hover:bg-black/5 transition">−</button>
            <span className="text-5xl font-bold tracking-tighter text-[#111111] w-16 text-center">${amount}</span>
            <button onClick={() => setAmount(a => a + 1)} className="w-10 h-10 rounded-full border border-black/10 text-xl font-bold flex items-center justify-center hover:bg-black/5 transition">+</button>
          </div>
          <p className="text-[9px] uppercase tracking-widest opacity-20 font-bold mt-3">MINIMUM $3.00</p>
        </div>

        <div className="w-full space-y-4">
          <button
            onClick={handleUnlock}
            disabled={amount < 3}
            className="w-full bg-black text-white py-5 rounded-full text-[11px] uppercase tracking-[0.4em] font-bold shadow-xl shadow-black/10 hover:bg-black/80 transition-all active:scale-[0.98] disabled:opacity-30"
          >
            {t.paywallAction || "Unlock Vision"}
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="w-full py-1 text-[9px] uppercase tracking-[0.4em] font-bold opacity-30 hover:opacity-60 transition-opacity"
            >
              {t.returnLibrary || "Return to Library"}
            </button>
          )}
        </div>

        <p className="text-[8px] uppercase tracking-[0.3em] opacity-20 font-bold">SECURE PAYMENT VIA PAYSTACK</p>
      </div>
    </div>
  );
};

export default VisionUnlock;