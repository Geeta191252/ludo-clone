import { ArrowLeft, User, Phone, Mail, Wallet, CreditCard, Coins, Swords, Users, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5D547' }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">My Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="p-4 space-y-4">
        {/* Profile Card with Background */}
        <div 
          className="relative rounded-2xl overflow-hidden p-4"
          style={{
            background: 'linear-gradient(135deg, #4a90a4 0%, #2d5a6b 100%)',
            minHeight: '140px'
          }}
        >
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 right-2 w-16 h-16 rounded-full bg-white/20" />
            <div className="absolute bottom-2 left-1/2 w-12 h-12 rounded-full bg-white/10" />
          </div>
          
          <div className="relative flex items-center justify-between">
            {/* User Info */}
            <div className="space-y-2 text-white">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="font-semibold">RockyPlayer</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">9876543210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </div>
            </div>

            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-purple-300/50 flex items-center justify-center border-2 border-white/30">
              <User className="w-8 h-8 text-white/70" />
            </div>

            {/* Edit Profile Button */}
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-4"
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link to="/wallet" className="flex-1">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl text-white font-bold" style={{ backgroundColor: '#1D9A8C' }}>
              <Wallet className="w-6 h-6" />
              <span>WALLET</span>
            </div>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl text-white font-bold" style={{ backgroundColor: '#1D9A8C' }}>
              <CreditCard className="w-6 h-6" />
              <span>KYC ACCEPTED</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-3 mt-6">
          {/* Coin Won */}
          <div 
            className="flex items-center gap-4 p-4 rounded-xl border-2"
            style={{ backgroundColor: '#D4A84B', borderColor: '#8B7355' }}
          >
            <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center">
              <Coins className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-teal-700">Coin Won</p>
              <p className="text-xl font-bold text-teal-700">134</p>
            </div>
          </div>

          {/* Battle Played */}
          <div 
            className="flex items-center gap-4 p-4 rounded-xl border-2"
            style={{ backgroundColor: '#E57373', borderColor: '#8B7355' }}
          >
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
              <Swords className="w-6 h-6 text-gray-800" />
            </div>
            <div>
              <p className="text-lg font-bold text-teal-700">Battle Played</p>
              <p className="text-xl font-bold text-teal-700">21</p>
            </div>
          </div>

          {/* Referral */}
          <div 
            className="flex items-center gap-4 p-4 rounded-xl border-2"
            style={{ backgroundColor: '#FFF8DC', borderColor: '#8B7355' }}
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-teal-700">Referral</p>
              <p className="text-xl font-bold text-teal-700">0</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full mt-6 bg-white text-black border-2 border-black font-bold py-6 text-lg hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-2" />
          LOG OUT
        </Button>
      </div>
    </div>
  );
};

export default Profile;
