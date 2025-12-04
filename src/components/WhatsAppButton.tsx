import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <a 
      href="https://wa.me/919999999999" 
      target="_blank" 
      rel="noopener noreferrer"
      className="whatsapp-btn hover:scale-110 transition-transform"
    >
      <MessageCircle className="w-7 h-7 text-white" fill="white" />
    </a>
  );
};

export default WhatsAppButton;
