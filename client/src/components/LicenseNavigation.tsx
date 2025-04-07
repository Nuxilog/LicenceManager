import { useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type LicenseType = 'nuxidev' | 'nuxisav' | 'studio';

interface LicenseNavigationProps {
  currentType: LicenseType;
}

export default function LicenseNavigation({ currentType }: LicenseNavigationProps) {
  const [, setLocation] = useLocation();

  const handleTypeChange = (type: LicenseType) => {
    setLocation(`/licenses/${type}`);
  };

  return (
    <div className="w-full mb-6">
      <Tabs 
        defaultValue={currentType} 
        value={currentType}
        onValueChange={handleTypeChange as (value: string) => void}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="nuxidev" className="text-base">Licences NuxiDev</TabsTrigger>
          <TabsTrigger value="nuxisav" className="text-base">Licences NuxiSAV</TabsTrigger>
          <TabsTrigger value="studio" className="text-base">Licences Studio</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}