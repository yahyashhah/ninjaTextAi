// components/reports/sub-components/HeaderSection.tsx
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderSectionProps {
  router: any;
  reportIcon: React.ReactNode;
  reportName: string;
  reportType: string;
  setShowHelpModal: (show: boolean) => void;
}

const Header = ({ router, reportIcon, reportName, setShowHelpModal }: HeaderSectionProps) => {
  return (
    <div className="w-full flex justify-between items-center p-4 px-6 bg-white shadow-sm border-b">
      <div className="flex items-center space-x-4">
        <ArrowLeft
          className="cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => router.back()}
          size={20}
        />
        <div className="flex items-center space-x-2">
          {reportIcon}
          <h1 className="text-lg font-semibold text-gray-800">
            {reportName}
          </h1>
        </div>
      </div>

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowHelpModal(true)}
        className="text-blue-600 hover:text-blue-800"
      >
        <Info className="h-4 w-4 mr-2" />
        Help
      </Button>
    </div>
  );
};

export default Header;