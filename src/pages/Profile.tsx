import { useState } from "react";
import { ArrowLeft, User, Phone, Mail, Wallet, CreditCard, Coins, Swords, Users, LogOut } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: "RockyPlayer",
    username: "RockyPlayer",
    email: "",
    phone: "9876543210"
  });
  
  // Edit form state
  const [editForm, setEditForm] = useState({ ...profile });

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
    setIsEditOpen(false);
    toast({ title: "Success", description: "Profile updated successfully!" });
  };

  const handleCancel = () => {
    setEditForm({ ...profile });
    setIsEditOpen(false);
  };

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
    </div>
  );
};

export default Profile;
