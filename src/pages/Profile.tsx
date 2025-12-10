import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, Mail, Wallet, CreditCard, Coins, Swords, Users, LogOut, CheckCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://rajasthanludo.com/api';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: "Player",
    username: "Player",
    email: "",
    phone: ""
  });
  
  // Stats state
  const [stats, setStats] = useState({
    coinWon: 0,
    battlePlayed: 0,
    referralCount: 0
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState({ ...profile });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const mobile = localStorage.getItem('userMobile');
      const playerName = localStorage.getItem('playerName');
      
      if (!mobile) {
        navigate('/auth');
        return;
      }

      // Set initial data from localStorage
      setProfile(prev => ({
        ...prev,
        phone: mobile,
        name: playerName || 'Player',
        username: playerName || 'Player'
      }));

      // Fetch real stats from API
      const response = await fetch(`${API_BASE_URL}/get-user-stats.php?mobile=${mobile}`);
      const data = await response.json();
      
      if (data.status) {
        setProfile({
          name: data.user.name || playerName || 'Player',
          username: data.user.name || playerName || 'Player',
          email: data.user.email || '',
          phone: data.user.mobile
        });
        
        setStats({
          coinWon: data.stats.coin_won || 0,
          battlePlayed: data.stats.battle_played || 0,
          referralCount: data.stats.referral_count || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Validate
    if (!editForm.name.trim()) {
      toast({ title: "Error", description: "Name cannot be empty", variant: "destructive" });
      return;
    }
    if (!editForm.username.trim()) {
      toast({ title: "Error", description: "Username cannot be empty", variant: "destructive" });
      return;
    }
    if (!editForm.phone.trim() || editForm.phone.length < 10) {
      toast({ title: "Error", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    
    setProfile({ ...editForm });
    localStorage.setItem('playerName', editForm.name);
    setIsEditOpen(false);
    toast({ title: "Success", description: "Profile updated successfully!" });
  };

  const handleCancel = () => {
    setEditForm({ ...profile });
    setIsEditOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userMobile');
    localStorage.removeItem('playerName');
    localStorage.removeItem('depositChips');
    localStorage.removeItem('winningChips');
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    toast({ title: "Logged Out", description: "You have been logged out successfully" });
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5D547' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

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
                <span className="font-semibold">{profile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profile.email || "Email"}</span>
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
              onClick={() => {
                setEditForm({ ...profile });
                setIsEditOpen(true);
              }}
              className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-4"
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 rounded-2xl border-2 border-gray-400/50" style={{ backgroundColor: '#F5D547' }}>
          <div className="flex gap-3">
            <Link to="/wallet" className="flex-1">
              <div 
                className="flex items-center justify-center gap-3 py-5 px-6 rounded-2xl text-white font-bold text-lg"
                style={{ backgroundColor: '#1D7A7A' }}
              >
                <div className="w-10 h-10 rounded-lg bg-orange-400 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span>WALLET</span>
              </div>
            </Link>
            <button onClick={() => setIsKycOpen(true)} className="flex-1">
              <div 
                className="flex items-center justify-center gap-3 py-5 px-6 rounded-2xl text-white font-bold text-lg"
                style={{ backgroundColor: '#1D7A7A' }}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <span>KYC ACCEPTED</span>
              </div>
            </button>
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
              <p className="text-xl font-bold text-teal-700">₹{stats.coinWon}</p>
            </div>
          </div>

          {/* Battle Played */}
          <Link to="/game-history?tab=Game">
            <div 
              className="flex items-center gap-4 p-4 rounded-xl border-2 mt-3"
              style={{ backgroundColor: '#E57373', borderColor: '#8B7355' }}
            >
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <Swords className="w-6 h-6 text-gray-800" />
              </div>
              <div>
                <p className="text-lg font-bold text-teal-700">Battle Played</p>
                <p className="text-xl font-bold text-teal-700">{stats.battlePlayed}</p>
              </div>
            </div>
          </Link>

          {/* Referral */}
          <Link to="/refer-earn">
            <div 
              className="flex items-center gap-4 p-4 rounded-xl border-2 mt-3"
              style={{ backgroundColor: '#FFF8DC', borderColor: '#8B7355' }}
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-teal-700">Referral</p>
                <p className="text-xl font-bold text-teal-700">{stats.referralCount}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full mt-6 bg-white text-black border-2 border-black font-bold py-6 text-lg hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-2" />
          LOG OUT
        </Button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black">Edit Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-500">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="border-gray-300 text-black text-lg py-6"
                maxLength={50}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-500">Username</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="border-gray-300 text-gray-400 text-lg py-6"
                disabled
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-500">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="border-gray-300 text-black text-lg py-6"
                maxLength={100}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-500">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="border-gray-300 text-gray-400 text-lg py-6"
                disabled
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 text-purple-600 font-bold text-lg hover:bg-purple-50"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg py-6"
            >
              SAVE CHANGES
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Status Dialog */}
      <Dialog open={isKycOpen} onOpenChange={setIsKycOpen}>
        <DialogContent className="bg-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black text-center">KYC Status</DialogTitle>
          </DialogHeader>
          
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-600">KYC Verified</h3>
            <p className="text-gray-600 text-center">Your KYC has been successfully verified. You can now withdraw funds without any restrictions.</p>
          </div>
          
          <Button
            onClick={() => setIsKycOpen(false)}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-6"
          >
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
