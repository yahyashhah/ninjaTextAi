"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface PaymentFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const PaymentForm = ({ onSuccess, onClose }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState("");
  const [saveInfo, setSaveInfo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          receipt_email: email,
          payment_method_data: {
            billing_details: {
              email: email,
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || "Payment failed");
      } else {
        onSuccess();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <PaymentElement
        options={{
          layout: {
            type: "tabs",
            defaultCollapsed: false,
          },
          wallets: {
            applePay: "never",
            googlePay: "never",
          },
        }}
      />

      <div className="flex items-center">
        <input
          id="save-info"
          type="checkbox"
          checked={saveInfo}
          onChange={(e) => setSaveInfo(e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="save-info" className="ml-2 block text-sm text-gray-700">
          Securely save my information for 1-click checkout
        </label>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Subscribe for $19.99/month"}
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Pay faster on New Business Sandbox and everywhere Link is accepted.
      </div>
    </form>
  );
};

interface StripeCheckoutModalProps {
  clientSecret: string;
  onClose: () => void;
}

export const StripeCheckoutModal = ({ clientSecret, onClose }: StripeCheckoutModalProps) => {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#6366f1",
        colorBackground: "#ffffff",
        colorText: "#30313d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        spacingUnit: "4px",
        borderRadius: "4px",
      },
      rules: {
        ".Tab": {
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.03)",
        },
        ".Tab:hover": {
          color: "var(--colorPrimary)",
        },
        ".Tab--selected": {
          borderColor: "var(--colorPrimary)",
        },
      },
    },
    loader: "auto",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Subscribe to NinjaText-AI Pro</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-600 mb-4">$19.99 per month</p>
        <p className="text-sm text-gray-500 mb-6">Unlimited NinjaText-AI Report Generations</p>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <button 
              type="button"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Link
            </button>
            <button 
              type="button"
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Amazon Pay
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or pay another way</span>
            </div>
          </div>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <PaymentForm onSuccess={onClose} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
};