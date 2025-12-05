import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const Wallet = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5D547' }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">My Wallet</h1>
      </div>

      {/* Wallet Content */}
      <div className="p-4 space-y-6">
        {/* Deposit Chips Section */}
        <div className="rounded-xl border-2 border-black/20 overflow-hidden">
          {/* Header */}
          <div className="py-3 px-4 text-center" style={{ backgroundColor: '#1D6B6B' }}>
            <h2 className="text-xl font-bold text-white">Deposit Chips</h2>
          </div>
          
          {/* Description */}
          <div className="p-4 text-center" style={{ backgroundColor: '#FFF8DC' }}>
            <p className="text-red-600 text-sm font-medium">
              यह चिप्स Win अवं Buy की गई चिप्स है इनसे सिर्फ गेम खेले जा सकते है,
              <br />
              बैंक या <span className="italic">UPI</span> से निकाला नहीं जा सकता है
            </p>
          </div>

          {/* Amount Display */}
          <div className="flex justify-center py-6" style={{ backgroundColor: '#F5D547' }}>
            <div className="bg-white rounded-xl shadow-lg px-12 py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
              <p className="text-3xl font-bold text-black">₹ 134</p>
              <p className="text-gray-600 text-lg">Chips</p>
            </div>
          </div>

          {/* Add Button */}
          <div className="px-4 pb-4" style={{ backgroundColor: '#F5D547' }}>
            <Button 
              className="w-full py-6 text-lg font-bold text-white rounded-xl"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Winning Chips Section */}
        <div className="rounded-xl border-2 border-black/20 overflow-hidden">
          {/* Header */}
          <div className="py-3 px-4 text-center" style={{ backgroundColor: '#1D6B6B' }}>
            <h2 className="text-xl font-bold text-white">Winning Chips</h2>
          </div>
          
          {/* Description */}
          <div className="p-4 text-center" style={{ backgroundColor: '#FFF8DC' }}>
            <p className="text-red-600 text-sm font-medium">
              यह चिप्स गेम से जीती हुई एवं रेफरल से कमाई हुई है, इन्हे बैंक या <span className="italic">UPI</span> में
              <br />
              निकाला जा सकता है, इन चिप्स से गेम भी खेला जा सकता है
            </p>
          </div>

          {/* Amount Display */}
          <div className="flex justify-center py-6" style={{ backgroundColor: '#F5D547' }}>
            <div className="bg-white rounded-xl shadow-lg px-12 py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">₹</span>
              </div>
              <p className="text-3xl font-bold text-black">₹ 0</p>
              <p className="text-gray-600 text-lg">Chips</p>
            </div>
          </div>

          {/* Withdrawal Button */}
          <div className="px-4 pb-4" style={{ backgroundColor: '#F5D547' }}>
            <Button 
              className="w-full py-6 text-lg font-bold text-white rounded-xl"
              style={{ backgroundColor: '#1D6B6B' }}
            >
              Withdrawal
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Wallet;
