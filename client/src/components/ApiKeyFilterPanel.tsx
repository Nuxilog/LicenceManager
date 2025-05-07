import { FormEvent, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { ApiKeyLicenseFilters } from "@/types/license";

interface ApiKeyFilterPanelProps {
  filters: {
    clientId: string;
    apiKey: string;
    serial: string;
    onlyExpired: boolean;
    showInactive: boolean;
  };
  onFilterChange: (filters: ApiKeyFilterPanelProps["filters"]) => void;
}

export default function ApiKeyFilterPanel({ filters, onFilterChange }: ApiKeyFilterPanelProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSwitchChange = (field: keyof ApiKeyLicenseFilters) => {
    if (field === 'onlyExpired' || field === 'showInactive') {
      onFilterChange({
        ...filters,
        [field]: !filters[field]
      });
    }
  };
  
  const handleReset = () => {
    onFilterChange({
      clientId: "",
      apiKey: "",
      serial: "",
      onlyExpired: false,
      showInactive: false
    });
    
    if (formRef.current) {
      formRef.current.reset();
    }
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form ref={formRef}>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="clientId">ID Client</Label>
              <Input 
                id="clientId" 
                name="clientId" 
                placeholder="Rechercher par ID client" 
                value={filters.clientId}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">Clé API</Label>
              <Input 
                id="apiKey" 
                name="apiKey" 
                placeholder="Rechercher par clé API" 
                value={filters.apiKey}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serial">Numéro de série</Label>
              <Input 
                id="serial" 
                name="serial" 
                placeholder="Rechercher par numéro de série" 
                value={filters.serial}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex items-center space-x-8 mb-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="onlyExpired" 
                checked={filters.onlyExpired} 
                onCheckedChange={() => handleSwitchChange('onlyExpired')} 
              />
              <Label htmlFor="onlyExpired">Filtrer par Qté ≤ 0</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="showInactive" 
                checked={filters.showInactive} 
                onCheckedChange={() => handleSwitchChange('showInactive')} 
              />
              <Label htmlFor="showInactive">Afficher inactives (avec STOP)</Label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <NuxiButton 
              type="button"
              variant="outline" 
              onClick={handleReset}
              size="sm"
            >
              Réinitialiser les filtres
            </NuxiButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}