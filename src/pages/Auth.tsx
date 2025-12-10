import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import rajasthanLudoLogo from "@/assets/rajasthan-ludo-logo.png";

// API Base URL - your Hostinger domain
const API_BASE = "https://rajasthanludo.com";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already logged in on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    const userToken = localStorage.getItem('userToken');
    
    if (user && userToken) {
      try {
        const userData = JSON.parse(user);
        if (userData.mobile) {
          localStorage.setItem('userMobile', userData.mobile);
          localStorage.setItem('playerName', userData.name || 'Player');
        }
        navigate('/');
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('userToken');
      }
    }
  }, [navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mobile.length !== 10) {
      toast({
        title: "Invalid Mobile",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/send-otp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      const text = await response.text();
      console.log('Send OTP response:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Invalid JSON response:', text);
        toast({
          title: "Server Error",
          description: "Server error - please try again later",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.status) {
        setOtpSent(true);
        setCountdown(60); // 60 seconds countdown
        toast({
          title: "OTP Sent! 📱",
          description: `OTP has been sent to ${mobile}`,
        });
      } else {
        toast({
          title: "Failed to Send OTP",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        title: "Error",
        description: error?.message || "Network error - check internet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/verify-otp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });

      const text = await response.text();
      console.log('Verify OTP response:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Invalid JSON response:', text);
        toast({
          title: "Server Error",
          description: "Server error - please try again later",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data.status) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userMobile", data.user.mobile);
        localStorage.setItem("playerName", data.user.name || "Player");
        toast({
          title: "Login Successful! 🎮",
          description: `Welcome, ${data.user.name || 'Player'}!`,
        });
        navigate("/");
      } else {
        toast({
          title: "Verification Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: "Error",
        description: error?.message || "Network error - check internet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (countdown === 0) {
      setOtp("");
      handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e] flex flex-col items-center justify-start p-4 pt-8">
      <div className="w-full max-w-md">
        {/* Logo Section with Border */}
        <div className="border-2 border-primary/30 rounded-lg p-6 mb-6 flex items-center justify-center bg-gradient-to-b from-primary/5 to-transparent">
          <img 
            src={rajasthanLudoLogo} 
            alt="Rajasthan Ludo" 
            className="w-64 h-64 object-contain"
          />
        </div>

        {/* Sign in Card */}
        <Card className="border-0 shadow-xl bg-gray-100/95 backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-lg font-medium text-gray-500">Sign in or Sign up</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              {/* Mobile Number Input */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-gray-500 font-normal">Mobile Number</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-gray-200 rounded">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Please enter your mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-14 h-12 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                    required
                    maxLength={10}
                    disabled={otpSent}
                  />
                </div>
              </div>

              {/* OTP Input - Show after OTP is sent */}
              {otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-500 font-normal">OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP 
                      maxLength={6} 
                      value={otp} 
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-10 h-12 text-lg border-gray-300 bg-white text-gray-900" />
                        <InputOTPSlot index={1} className="w-10 h-12 text-lg border-gray-300 bg-white text-gray-900" />
                        <InputOTPSlot index={2} className="w-10 h-12 text-lg border-gray-300 bg-white text-gray-900" />
                        <InputOTPSlot index={3} className="w-10 h-12 text-lg border-gray-300 bg-white text-gray-900" />
                        <InputOTPSlot index={4} className="w-10 h-12 text-lg border-gray-300 bg-white text-gray-900" />
                        <InputOTPSlot index={5} className="w-10 h-12 text-lg border-gray-300 bg-white text-gray-900" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {countdown > 0 ? (
                    <p className="text-center text-sm text-gray-500">
                      Resend OTP in {countdown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="w-full text-center text-sm text-primary hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#2d1b4e] hover:bg-[#3d2b5e] text-white font-medium rounded-lg"
                disabled={isLoading}
              >
                {isLoading 
                  ? (otpSent ? "Verifying..." : "Sending OTP...") 
                  : (otpSent ? "Verify OTP" : "Send OTP")
                }
              </Button>

              {/* Change Number */}
              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setCountdown(0);
                  }}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Change Mobile Number
                </button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <p className="text-center text-xs text-gray-300 mt-6 px-4">
          By proceeding, you agree to our{" "}
          <span className="text-primary cursor-pointer hover:underline">Terms of Use</span>,{" "}
          <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>
          {" "}and that you are 18 years or older. You are not playing from 
          Assam, Odisha, Nagaland, Sikkim, Meghalaya, Andhra Pradesh, or Telangana.
        </p>
      </div>
    </div>
  );
};

export default Auth;
