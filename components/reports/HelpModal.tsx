// components/reports/sub-components/HelpModal.tsx
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HelpModalProps {
  showHelpModal: boolean;
  setShowHelpModal: (show: boolean) => void;
  reportName: string;
  helpContent: React.ReactNode;
}

const HelpModal = ({ showHelpModal, setShowHelpModal, reportName, helpContent }: HelpModalProps) => {
  if (!showHelpModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {reportName} Guide
          </h3>
          <button
            onClick={() => setShowHelpModal(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6 text-gray-700 space-y-3">
          {helpContent}
        </div>            
        <Button 
          onClick={() => setShowHelpModal(false)} 
          className="w-full"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
};

export default HelpModal;