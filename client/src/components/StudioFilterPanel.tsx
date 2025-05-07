import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StudioFilterPanelProps {
  filters: {
    numClient: string;
    serial: string;
    identifiantUser: string;
    onlyWithPDF: boolean;
    onlyWithVue: boolean;
    onlyWithPagePerso: boolean;
    onlyWithWDE: boolean;
    hideSuspended: boolean;
  };
  onFilterChange: (filters: StudioFilterPanelProps["filters"]) => void;
}

export default function StudioFilterPanel({ filters, onFilterChange }: StudioFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState({
    numClient: filters.numClient || "",
    serial: filters.serial || "",
    identifiantUser: filters.identifiantUser || "",
    onlyWithPDF: filters.onlyWithPDF || false,
    onlyWithVue: filters.onlyWithVue || false,
    onlyWithPagePerso: filters.onlyWithPagePerso || false,
    onlyWithWDE: filters.onlyWithWDE || false,
    hideSuspended: filters.hideSuspended || false
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      numClient: "",
      serial: "",
      identifiantUser: "",
      onlyWithPDF: false,
      onlyWithVue: false,
      onlyWithPagePerso: false,
      onlyWithWDE: false,
      hideSuspended: false
    };
    
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setLocalFilters(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
      <h3 className="text-lg font-medium mb-3">Filtrer les licences Studio</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numClient">Numéro Client</Label>
            <Input
              id="numClient"
              name="numClient"
              placeholder="Numéro client"
              value={localFilters.numClient}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serial">Numéro de Série</Label>
            <Input
              id="serial"
              name="serial"
              placeholder="Contient..."
              value={localFilters.serial}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="identifiantUser">Identifiant Utilisateur</Label>
            <Input
              id="identifiantUser"
              name="identifiantUser"
              placeholder="Contient..."
              value={localFilters.identifiantUser}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="onlyWithPDF" 
              checked={localFilters.onlyWithPDF}
              onCheckedChange={(checked) => handleCheckboxChange("onlyWithPDF", checked === true)}
            />
            <Label htmlFor="onlyWithPDF">Module PDF</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="onlyWithVue" 
              checked={localFilters.onlyWithVue}
              onCheckedChange={(checked) => handleCheckboxChange("onlyWithVue", checked === true)}
            />
            <Label htmlFor="onlyWithVue">Module Vue</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="onlyWithPagePerso" 
              checked={localFilters.onlyWithPagePerso}
              onCheckedChange={(checked) => handleCheckboxChange("onlyWithPagePerso", checked === true)}
            />
            <Label htmlFor="onlyWithPagePerso">Module Page Perso</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="onlyWithWDE" 
              checked={localFilters.onlyWithWDE}
              onCheckedChange={(checked) => handleCheckboxChange("onlyWithWDE", checked === true)}
            />
            <Label htmlFor="onlyWithWDE">Module WDE</Label>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="hideSuspended" 
            checked={localFilters.hideSuspended}
            onCheckedChange={(checked) => handleCheckboxChange("hideSuspended", checked === true)}
          />
          <Label htmlFor="hideSuspended">Masquer les licences suspendues</Label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <NuxiButton 
            type="button" 
            variant="outline" 
            onClick={handleReset}
          >
            Réinitialiser
          </NuxiButton>
          <NuxiButton type="submit" variant="primary">
            Appliquer les filtres
          </NuxiButton>
        </div>
      </form>
    </div>
  );
}