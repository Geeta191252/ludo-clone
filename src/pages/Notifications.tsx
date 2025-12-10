import { ArrowLeft, Bell, CheckCircle, XCircle, Clock, AlertTriangle, Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface Notification {
  id: string;
  type: 'kyc_accepted' | 'kyc_rejected' | 'kyc_pending' | 'deposit' | 'withdrawal' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  amount?: number;
  status?: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    
    const userData = localStorage.getItem('user');
    if (!userData) {
      // Still show welcome notification for non-logged in users
      setNotifications([{
        id: 'welcome',
        type: 'general',
        title: 'Welcome to RockyPlayers!',
        message: 'RockyPlayers में आपका स्वागत है। Login करें और games खेलें!',
        timestamp: new Date().toISOString(),
        read: true
      }]);
      setLoading(false);
      return;
    }
    
    const user = JSON.parse(userData);
    const mobile = user.mobile;
    const kycStatus = user.kyc_status || localStorage.getItem('kycStatus');
    
    console.log('Fetching notifications for mobile:', mobile, 'KYC Status:', kycStatus);
    
    const generatedNotifications: Notification[] = [];
    
    // Fetch deposits
    try {
      const depositRes = await fetch(`/api/get-transaction-history.php?mobile=${mobile}&type=deposit`);
      const depositText = await depositRes.text();
      console.log('Deposit API response:', depositText);
      
      try {
        const depositData = JSON.parse(depositText);
        if (depositData.status === true && depositData.transactions && depositData.transactions.length > 0) {
          depositData.transactions.slice(0, 10).forEach((tx: any, index: number) => {
            const txStatus = tx.status?.toUpperCase() || 'PENDING';
            generatedNotifications.push({
              id: `deposit_${tx.id || index}`,
              type: 'deposit',
              title: txStatus === 'SUCCESS' ? 'Deposit Successful ✓' : txStatus === 'PENDING' ? 'Deposit Pending' : 'Deposit Failed',
              message: `₹${tx.amount} ${txStatus === 'SUCCESS' ? 'जमा हो गया' : txStatus === 'PENDING' ? 'प्रोसेसिंग में है' : 'विफल हो गया'}`,
              timestamp: tx.date || tx.created_at || new Date().toISOString(),
              read: true,
              amount: tx.amount,
              status: txStatus
            });
          });
        }
      } catch (parseError) {
        console.error('Error parsing deposit data:', parseError);
      }
    } catch (e) {
      console.error('Error fetching deposits:', e);
    }

    // Fetch withdrawals
    try {
      const withdrawRes = await fetch(`/api/get-transaction-history.php?mobile=${mobile}&type=withdrawal`);
      const withdrawText = await withdrawRes.text();
      console.log('Withdrawal API response:', withdrawText);
      
      try {
        const withdrawData = JSON.parse(withdrawText);
        if (withdrawData.status === true && withdrawData.transactions && withdrawData.transactions.length > 0) {
          withdrawData.transactions.slice(0, 10).forEach((tx: any, index: number) => {
            const txStatus = tx.status?.toUpperCase() || 'PENDING';
            const isApproved = txStatus === 'APPROVED' || txStatus === 'SUCCESS';
            generatedNotifications.push({
              id: `withdraw_${tx.id || index}`,
              type: 'withdrawal',
              title: isApproved ? 'Withdrawal Successful ✓' : txStatus === 'PENDING' ? 'Withdrawal Pending' : 'Withdrawal Failed',
              message: `₹${tx.amount} ${isApproved ? 'निकासी सफल' : txStatus === 'PENDING' ? 'प्रोसेसिंग में है' : 'विफल हो गया'}`,
              timestamp: tx.date || tx.created_at || new Date().toISOString(),
              read: true,
              amount: tx.amount,
              status: isApproved ? 'SUCCESS' : txStatus
            });
          });
        }
      } catch (parseError) {
        console.error('Error parsing withdrawal data:', parseError);
      }
    } catch (e) {
      console.error('Error fetching withdrawals:', e);
    }

    // KYC notifications
    if (kycStatus === 'accepted' || kycStatus === 'verified') {
      generatedNotifications.unshift({
        id: 'kyc_accepted',
        type: 'kyc_accepted',
        title: 'KYC Approved ✓',
        message: 'आपकी KYC सफलतापूर्वक verify हो गई है। अब आप सभी features का उपयोग कर सकते हैं।',
        timestamp: new Date().toISOString(),
        read: false
      });
    } else if (kycStatus === 'rejected' || kycStatus === 'cancelled') {
      generatedNotifications.unshift({
        id: 'kyc_rejected',
        type: 'kyc_rejected',
        title: 'KYC Rejected ✗',
        message: 'Wrong documents - KYC cancel। कृपया सही documents के साथ दोबारा KYC submit करें।',
        timestamp: new Date().toISOString(),
        read: false
      });
    } else if (kycStatus === 'pending') {
      generatedNotifications.unshift({
        id: 'kyc_pending',
        type: 'kyc_pending',
        title: 'KYC Pending',
        message: 'आपकी KYC verification प्रक्रिया में है। कृपया प्रतीक्षा करें।',
        timestamp: new Date().toISOString(),
        read: false
      });
    }
    
    // Welcome notification at end
    generatedNotifications.push({
      id: 'welcome',
      type: 'general',
      title: 'Welcome to RockyPlayers!',
      message: 'RockyPlayers में आपका स्वागत है। Games खेलें और जीतें!',
      timestamp: new Date().toISOString(),
      read: true
    });
    
    console.log('Total notifications:', generatedNotifications.length);
    setNotifications(generatedNotifications);
    setLoading(false);
  };

  const getNotificationIcon = (type: string, status?: string) => {
    switch (type) {
      case 'kyc_accepted':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'kyc_rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'kyc_pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'deposit':
        return status === 'SUCCESS' ? <ArrowDownCircle className="w-6 h-6 text-green-500" /> : 
               status === 'PENDING' ? <Clock className="w-6 h-6 text-yellow-500" /> : 
               <XCircle className="w-6 h-6 text-red-500" />;
      case 'withdrawal':
        return status === 'SUCCESS' ? <ArrowUpCircle className="w-6 h-6 text-green-500" /> : 
               status === 'PENDING' ? <Clock className="w-6 h-6 text-yellow-500" /> : 
               <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Bell className="w-6 h-6 text-primary" />;
    }
  };

  const getNotificationBg = (type: string, status?: string) => {
    if (type === 'deposit' || type === 'withdrawal') {
      if (status === 'SUCCESS') return 'bg-green-500/10 border-green-500/30';
      if (status === 'PENDING') return 'bg-yellow-500/10 border-yellow-500/30';
      return 'bg-red-500/10 border-red-500/30';
    }
    switch (type) {
      case 'kyc_accepted':
        return 'bg-green-500/10 border-green-500/30';
      case 'kyc_rejected':
        return 'bg-red-500/10 border-red-500/30';
      case 'kyc_pending':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-secondary border-border';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h1>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground">कोई notification नहीं है</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border ${getNotificationBg(notification.type, notification.status)} ${
                !notification.read ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background flex items-center justify-center">
                  {getNotificationIcon(notification.type, notification.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary"></span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  {notification.type === 'kyc_rejected' && (
                    <button
                      onClick={() => navigate('/profile')}
                      className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Resubmit KYC
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
