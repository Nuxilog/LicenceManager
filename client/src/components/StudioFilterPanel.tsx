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
  const [tempFilters, setTempFilters] = useState(filters);

  const handleChange = (field: keyof typeof filters, value: string | boolean) => {
    setTempFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFilterChange(tempFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
            <div>
              <Label htmlFor="filter-client" className="mb-1">Numéro Client</Label>
              <Input 
                id="filter-client" 
                value={tempFilters.numClient}
                onChange={(e) => handleChange("numClient", e.target.value)}
                placeholder="Numéro client"
              />
            </div>
            <div>
              <Label htmlFor="filter-serial" className="mb-1">Numéro de série</Label>
              <Input 
                id="filter-serial" 
                value={tempFilters.serial}
                onChange={(e) => handleChange("serial", e.target.value)}
                placeholder="Numéro de série"
              />
            </div>
            <div>
              <Label htmlFor="filter-user" className="mb-1">Identifiant utilisateur</Label>
              <Input 
                id="filter-user" 
                value={tempFilters.identifiantUser}
                onChange={(e) => handleChange("identifiantUser", e.target.value)}
                placeholder="Identifiant utilisateur"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
            <div className="flex items-center">
              <Checkbox 
                id="pdf-only" 
                checked={tempFilters.onlyWithPDF}
                onCheckedChange={(checked) => handleChange("onlyWithPDF", Boolean(checked))}
              />
              <Label htmlFor="pdf-only" className="ml-2">Module PDF</Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="vue-only" 
                checked={tempFilters.onlyWithVue}
                onCheckedChange={(checked) => handleChange("onlyWithVue", Boolean(checked))}
              />
              <Label htmlFor="vue-only" className="ml-2">Module Vue</Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="page-perso-only" 
                checked={tempFilters.onlyWithPagePerso}
                onCheckedChange={(checked) => handleChange("onlyWithPagePerso", Boolean(checked))}
              />
              <Label htmlFor="page-perso-only" className="ml-2">Module Page Perso</Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="wde-only" 
                checked={tempFilters.onlyWithWDE}
                onCheckedChange={(checked) => handleChange("onlyWithWDE", Boolean(checked))}
              />
              <Label htmlFor="wde-only" className="ml-2">Module WDE</Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="hide-suspended" 
                checked={tempFilters.hideSuspended}
                onCheckedChange={(checked) => handleChange("hideSuspended", Boolean(checked))}
              />
              <Label htmlFor="hide-suspended" className="ml-2">Masquer suspendues</Label>
            </div>
          </div>
          <div>
            <NuxiButton type="submit" variant="secondary">
              Appliquer les filtres
            </NuxiButton>
          </div>
        </div>
      </form>
    </div>
  );
}