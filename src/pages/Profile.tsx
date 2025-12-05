import { ArrowLeft, User, Phone, Mail, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">My Profile</h1>
      </div>

      {/* Profile Content */}
      <div className="p-4 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-xl font-bold">RockyPlayer</h2>
          <p className="text-muted-foreground">ID: #RP12345</p>
        </div>

        {/* Info Cards */}
        <div className="space-y-3">
          <div className="bg-card p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">+91 98765 43210</p>
            </div>
            <Edit className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="bg-card p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">player@rockyludo.com</p>
            </div>
            <Edit className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-primary">156</p>
            <p className="text-xs text-muted-foreground">Games Played</p>
          </div>
          <div className="bg-card p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-500">89</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          <div className="bg-card p-4 rounded-xl text-center">
            <p className="text-2xl font-bold text-primary">57%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Edit Profile
        </Button>
      </div>
    </div>
  );
};

export default Profile;
