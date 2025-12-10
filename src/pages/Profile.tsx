import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, Mail, Wallet, CreditCard, Coins, Swords, Users, LogOut, Car, FileText } from "lucide-react";
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
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [kycForm, setKycForm] = useState({ name: '', email: '', docNumber: '' });
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
      <div className="flex items-center gap-3 p-3 border-b border-black/10">
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-black/10 rounded-lg">
          <ArrowLeft className="w-4 h-4 text-black" />
        </button>
        <h1 className="text-lg font-bold text-black">My Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="p-3 space-y-3">
        {/* Profile Card with Background */}
        <div 
          className="relative rounded-xl overflow-hidden p-3"
          style={{
            background: 'linear-gradient(135deg, #4a90a4 0%, #2d5a6b 100%)',
            minHeight: '100px'
          }}
        >
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 right-2 w-12 h-12 rounded-full bg-white/20" />
            <div className="absolute bottom-2 left-1/2 w-8 h-8 rounded-full bg-white/10" />
          </div>
          
          <div className="relative flex items-center justify-between">
            {/* User Info */}
            <div className="space-y-1 text-white">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                <span className="font-semibold text-sm">{profile.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                <span className="text-xs">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                <span className="text-xs">{profile.email || "Email"}</span>
              </div>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-purple-300/50 flex items-center justify-center border-2 border-white/30">
              <User className="w-5 h-5 text-white/70" />
            </div>

            {/* Edit Profile Button */}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => {
                setEditForm({ ...profile });
                setIsEditOpen(true);
              }}
              className="bg-white text-black hover:bg-white/90 font-semibold rounded-full px-3 py-1 text-xs"
            >
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-2 rounded-xl border-2 border-gray-400/50" style={{ backgroundColor: '#F5D547' }}>
          <div className="flex gap-2">
            <Link to="/wallet" className="flex-1">
              <div 
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: '#1D7A7A' }}
              >
                <div className="w-7 h-7 rounded-md bg-orange-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span>WALLET</span>
              </div>
            </Link>
            <button onClick={() => setIsKycOpen(true)} className="flex-1">
              <div 
                className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-white font-bold text-sm"
                style={{ backgroundColor: '#1D7A7A' }}
              >
                <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span>KYC ACCEPTED</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-2 mt-3">
          {/* Coin Won */}
          <div 
            className="flex items-center gap-3 p-3 rounded-lg border-2"
            style={{ backgroundColor: '#D4A84B', borderColor: '#8B7355' }}
          >
            <div className="w-9 h-9 rounded-full bg-pink-200 flex items-center justify-center">
              <Coins className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-teal-700">Coin Won</p>
              <p className="text-base font-bold text-teal-700">₹{stats.coinWon}</p>
            </div>
          </div>

          {/* Battle Played */}
          <Link to="/game-history?tab=Game">
            <div 
              className="flex items-center gap-3 p-3 rounded-lg border-2 mt-2"
              style={{ backgroundColor: '#E57373', borderColor: '#8B7355' }}
            >
              <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center">
                <Swords className="w-4 h-4 text-gray-800" />
              </div>
              <div>
                <p className="text-sm font-bold text-teal-700">Battle Played</p>
                <p className="text-base font-bold text-teal-700">{stats.battlePlayed}</p>
              </div>
            </div>
          </Link>

          {/* Referral */}
          <Link to="/refer-earn">
            <div 
              className="flex items-center gap-3 p-3 rounded-lg border-2 mt-2"
              style={{ backgroundColor: '#FFF8DC', borderColor: '#8B7355' }}
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-teal-700">Referral</p>
                <p className="text-base font-bold text-teal-700">{stats.referralCount}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full mt-4 bg-white text-black border-2 border-black font-bold py-4 text-sm hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4 mr-2" />
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

      {/* KYC Document Selection Dialog */}
      <Dialog open={isKycOpen} onOpenChange={(open) => { setIsKycOpen(open); if (!open) setSelectedDocType(null); }}>
        <DialogContent className="bg-white max-w-md mx-auto">
          {!selectedDocType ? (
            <>
              <DialogHeader>
                <p className="text-sm text-gray-700 text-center mb-1">1. You Need To Choice One Way To Verify Your Document</p>
                <p className="text-sm text-gray-700 text-center mb-3">2. आपको अपने दस्तावेज़ को सत्यापित करने के लिए एक तरीका चुनना होगा।</p>
                <DialogTitle className="text-2xl font-bold text-black text-center">Select Document Type</DialogTitle>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <Button 
                  className="w-full py-6 text-lg font-bold bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setSelectedDocType('AADHAR CARD')}
                >
                  <CreditCard className="mr-3 w-6 h-6" />
                  AADHAR CARD
                </Button>
                
                <Button 
                  className="w-full py-6 text-lg font-bold bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => setSelectedDocType('DRIVING LICENCE')}
                >
                  <Car className="mr-3 w-6 h-6" />
                  DRIVING LICENCE
                </Button>
                
                <Button 
                  className="w-full py-6 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setSelectedDocType('PAN CARD')}
                >
                  <FileText className="mr-3 w-6 h-6" />
                  PAN CARD
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-black text-center">
                  Enter details of {selectedDocType === 'AADHAR CARD' ? 'Aadhar Card' : selectedDocType === 'DRIVING LICENCE' ? 'Driving Licence' : 'Pan Card'}:
                </DialogTitle>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <Input 
                  placeholder="Enter Name" 
                  value={kycForm.name}
                  onChange={(e) => setKycForm(prev => ({ ...prev, name: e.target.value }))}
                  className="border-gray-300 py-5"
                />
                <Input 
                  placeholder="Email ID" 
                  type="email"
                  value={kycForm.email}
                  onChange={(e) => setKycForm(prev => ({ ...prev, email: e.target.value }))}
                  className="border-gray-300 py-5"
                />
                <Input 
                  placeholder={selectedDocType === 'AADHAR CARD' ? 'Aadhar Num' : selectedDocType === 'DRIVING LICENCE' ? 'Licence Num' : 'Pan Num'}
                  value={kycForm.docNumber}
                  onChange={(e) => setKycForm(prev => ({ ...prev, docNumber: e.target.value }))}
                  className="border-gray-300 py-5"
                />
                
                <Button className="w-full py-5 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white">
                  UPLOAD FRONT {selectedDocType === 'AADHAR CARD' ? 'AADHAR' : selectedDocType === 'DRIVING LICENCE' ? 'LICENCE' : 'PAN'}
                </Button>
                
                <Button className="w-full py-5 text-base font-bold bg-blue-400 hover:bg-blue-500 text-white">
                  UPLOAD BACK {selectedDocType === 'AADHAR CARD' ? 'AADHAR' : selectedDocType === 'DRIVING LICENCE' ? 'LICENCE' : 'PAN'}
                </Button>
                
                <div className="flex justify-center">
                  <Button 
                    className="px-8 py-4 text-base font-bold bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      toast({ title: "KYC Submitted", description: `${selectedDocType} details submitted for verification!` });
                      setIsKycOpen(false);
                      setSelectedDocType(null);
                      setKycForm({ name: '', email: '', docNumber: '' });
                    }}
                  >
                    SUBMIT
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedDocType(null)}
                >
                  Back to Document Selection
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
