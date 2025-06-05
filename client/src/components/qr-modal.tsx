import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import type { Crop } from "@shared/schema";
import { generateCropUrl } from "@/lib/utils";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: Crop | null;
}

export default function QRModal({ isOpen, onClose, crop }: QRModalProps) {
  const cropUrl = crop ? generateCropUrl(crop.id) : "";

  const downloadQR = () => {
    // This would integrate with a QR code generation library
    console.log("Downloading QR code for:", cropUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Crop QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <QrCode className="text-6xl text-gray-400 h-16 w-16" />
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4 break-all">{cropUrl}</p>
          
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-green-600 text-white"
              onClick={downloadQR}
            >
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
