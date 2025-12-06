import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Save, Key, Globe, MessageSquare, CreditCard, Shield } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface SiteSettings {
  site_name: string;
  site_url: string;
  whatsapp_number: string;
  telegram_link: string;
  support_email: string;
  min_deposit: number;
  max_deposit: number;
  min_withdrawal: number;
  max_withdrawal: number;
  marquee_text: string;
  notice_text: string;
  maintenance_mode: boolean;
}

interface PaymentSettings {
  pay0_api_key: string;
  pay0_webhook_secret: string;
  upi_id: string;
}

interface AdminCredentials {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<'site' | 'payment' | 'admin'>('site');
  const [saving, setSaving] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: "Ludo Empire",
    site_url: "",
    whatsapp_number: "",
    telegram_link: "",
    support_email: "",
    min_deposit: 100,
    max_deposit: 50000,
    min_withdrawal: 100,
    max_withdrawal: 25000,
    marquee_text: "",
    notice_text: "",
    maintenance_mode: false,
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    pay0_api_key: "",
    pay0_webhook_secret: "",
    upi_id: "",
  });

  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-get-settings.php", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.status) {
        if (data.site_settings) setSiteSettings(data.site_settings);
        if (data.payment_settings) setPaymentSettings(data.payment_settings);
      }
    } catch (error) {
      console.log("Using default settings");
    }
  };

  const handleSaveSiteSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-save-settings.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ type: 'site', settings: siteSettings }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: "Site settings saved!" });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-save-settings.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ type: 'payment', settings: paymentSettings }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: "Payment settings saved!" });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (adminCredentials.new_password !== adminCredentials.confirm_password) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin-change-password.php", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          current_password: adminCredentials.current_password,
          new_password: adminCredentials.new_password,
        }),
      });
      const data = await response.json();
      
      if (data.status) {
        toast({ title: "Success", description: "Password changed!" });
        setAdminCredentials({ current_password: "", new_password: "", confirm_password: "" });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'site', label: 'Site Settings', icon: Globe },
    { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
    { id: 'admin', label: 'Admin Security', icon: Shield },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Configure your platform</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-800 text-white border-b-2 border-purple-500' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Site Settings */}
        {activeTab === 'site' && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5" /> Site Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Site Name</label>
                  <Input
                    value={siteSettings.site_name}
                    onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Site URL</label>
                  <Input
                    value={siteSettings.site_url}
                    onChange={(e) => setSiteSettings({ ...siteSettings, site_url: e.target.value })}
                    placeholder="https://yoursite.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">WhatsApp Number</label>
                  <Input
                    value={siteSettings.whatsapp_number}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp_number: e.target.value })}
                    placeholder="+91 9876543210"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Telegram Link</label>
                  <Input
                    value={siteSettings.telegram_link}
                    onChange={(e) => setSiteSettings({ ...siteSettings, telegram_link: e.target.value })}
                    placeholder="https://t.me/yourchannel"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Support Email</label>
                  <Input
                    type="email"
                    value={siteSettings.support_email}
                    onChange={(e) => setSiteSettings({ ...siteSettings, support_email: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Min Deposit (₹)</label>
                  <Input
                    type="number"
                    value={siteSettings.min_deposit}
                    onChange={(e) => setSiteSettings({ ...siteSettings, min_deposit: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Max Deposit (₹)</label>
                  <Input
                    type="number"
                    value={siteSettings.max_deposit}
                    onChange={(e) => setSiteSettings({ ...siteSettings, max_deposit: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Min Withdrawal (₹)</label>
                  <Input
                    type="number"
                    value={siteSettings.min_withdrawal}
                    onChange={(e) => setSiteSettings({ ...siteSettings, min_withdrawal: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Max Withdrawal (₹)</label>
                  <Input
                    type="number"
                    value={siteSettings.max_withdrawal}
                    onChange={(e) => setSiteSettings({ ...siteSettings, max_withdrawal: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Marquee Text</label>
                <Textarea
                  value={siteSettings.marquee_text}
                  onChange={(e) => setSiteSettings({ ...siteSettings, marquee_text: e.target.value })}
                  placeholder="Scrolling announcement text..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Notice Box Text</label>
                <Textarea
                  value={siteSettings.notice_text}
                  onChange={(e) => setSiteSettings({ ...siteSettings, notice_text: e.target.value })}
                  placeholder="Important notice..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button onClick={handleSaveSiteSettings} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Site Settings"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Payment Gateway (Pay0.shop)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-400 text-sm">
                  <Key className="w-4 h-4 inline mr-2" />
                  API keys यहाँ से update होंगे। Pay0.shop dashboard से API key लो।
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Pay0 API Key</label>
                <Input
                  type="password"
                  value={paymentSettings.pay0_api_key}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, pay0_api_key: e.target.value })}
                  placeholder="Enter your Pay0 API key"
                  className="bg-slate-700 border-slate-600 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Webhook Secret (Optional)</label>
                <Input
                  type="password"
                  value={paymentSettings.pay0_webhook_secret}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, pay0_webhook_secret: e.target.value })}
                  placeholder="Webhook verification secret"
                  className="bg-slate-700 border-slate-600 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Withdrawal UPI ID</label>
                <Input
                  value={paymentSettings.upi_id}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, upi_id: e.target.value })}
                  placeholder="yourname@upi"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button onClick={handleSavePaymentSettings} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Payment Settings"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Admin Security */}
        {activeTab === 'admin' && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" /> Change Admin Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Current Password</label>
                <Input
                  type="password"
                  value={adminCredentials.current_password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, current_password: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">New Password</label>
                <Input
                  type="password"
                  value={adminCredentials.new_password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, new_password: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Confirm New Password</label>
                <Input
                  type="password"
                  value={adminCredentials.confirm_password}
                  onChange={(e) => setAdminCredentials({ ...adminCredentials, confirm_password: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button onClick={handleChangePassword} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                <Shield className="w-4 h-4 mr-2" />
                {saving ? "Updating..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
