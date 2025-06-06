import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import type { Crop } from "@shared/schema";
import { generateCropUrl } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  crop: Crop | null;
}

export default function QRModal({ isOpen, onClose, crop }: QRModalProps) {
  const cropUrl = crop ? generateCropUrl(crop.id) : "";

  const downloadQR = () => {
    // Create a canvas element
    const canvas = document.createElement("canvas");
    const svg = document.querySelector(".qr-code svg");
    if (!svg) return;

    // Convert SVG to canvas
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `crop-${crop?.id}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      });
    };
    img.src = url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Print QR Code</DialogTitle>
        </DialogHeader>
        <div className="text-center">
          <div className="bg-white p-2 rounded-lg mb-2 flex flex-col items-center">
            <div className="qr-code mb-2" style={{ width: 192, height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cropUrl ? (
                <QRCodeSVG
                  value={cropUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <QrCode className="text-6xl text-gray-400 h-16 w-16" />
              )}
            </div>
            <Button
              style={{ width: 200 }}
              className="bg-primary hover:bg-green-600 text-white"
              onClick={downloadQR}
              disabled={!cropUrl}
            >
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
