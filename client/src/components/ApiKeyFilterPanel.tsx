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
    minQuantity: number | undefined;
    hasRestriction: boolean;
    showExpired: boolean;
    showInactive: boolean;
  };
  onFilterChange: (filters: ApiKeyFilterPanelProps["filters"]) => void;
}

export default function ApiKeyFilterPanel({ filters, onFilterChange }: ApiKeyFilterPanelProps) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      
      const minQuantityValue = formData.get("minQuantity") as string;
      const minQuantity = minQuantityValue ? parseInt(minQuantityValue) : undefined;
      
      onFilterChange({
        ...filters,
        clientId: formData.get("clientId") as string || "",
        apiKey: formData.get("apiKey") as string || "",
        serial: formData.get("serial") as string || "",
        minQuantity
      });
    }
  };
  
  const handleSwitchChange = (field: keyof ApiKeyLicenseFilters) => {
    if (field === 'showExpired' || field === 'showInactive' || field === 'hasRestriction') {
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
      minQuantity: undefined,
      hasRestriction: false,
      showExpired: false,
      showInactive: false
    });
    
    if (formRef.current) {
      formRef.current.reset();
    }
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="clientId">ID Client</Label>
              <Input 
                id="clientId" 
                name="clientId" 
                placeholder="Rechercher par ID client" 
                defaultValue={filters.clientId} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">Clé API</Label>
              <Input 
                id="apiKey" 
                name="apiKey" 
                placeholder="Rechercher par clé API" 
                defaultValue={filters.apiKey} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serial">Numéro de série</Label>
              <Input 
                id="serial" 
                name="serial" 
                placeholder="Rechercher par numéro de série" 
                defaultValue={filters.serial} 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="minQuantity">Quantité minimale</Label>
              <Input 
                id="minQuantity" 
                name="minQuantity" 
                type="number"
                placeholder="Quantité minimale" 
                defaultValue={filters.minQuantity?.toString() || ''} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hasRestriction" className="block mb-2">Avec restrictions</Label>
              <Switch 
                id="hasRestriction" 
                checked={filters.hasRestriction} 
                onCheckedChange={() => handleSwitchChange('hasRestriction')} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="showExpired" className="block mb-2">Afficher épuisées (Qté = 0)</Label>
              <Switch 
                id="showExpired" 
                checked={filters.showExpired} 
                onCheckedChange={() => handleSwitchChange('showExpired')} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="showInactive" className="block mb-2">Afficher inactives (STOP)</Label>
              <Switch 
                id="showInactive" 
                checked={filters.showInactive} 
                onCheckedChange={() => handleSwitchChange('showInactive')} 
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <NuxiButton 
              type="button"
              variant="outline" 
              onClick={handleReset}
            >
              Réinitialiser
            </NuxiButton>
            <NuxiButton 
              type="submit"
              variant="primary"
            >
              Filtrer
            </NuxiButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}