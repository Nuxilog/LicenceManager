import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";

interface FilterPanelProps {
  filters: {
    idClient: string;
    idSynchro: string;
    serial: string;
    identifiantPC: string;
    onlyNuxiDev: boolean;
  };
  onFilterChange: (filters: FilterPanelProps["filters"]) => void;
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow">
            <div>
              <Label htmlFor="filter-client" className="mb-1">Numéro Client</Label>
              <Input 
                id="filter-client" 
                value={tempFilters.idClient}
                onChange={(e) => handleChange("idClient", e.target.value)}
                placeholder="Filtrer par IDClient"
              />
            </div>
            <div>
              <Label htmlFor="filter-synchro" className="mb-1">ID de Synchro</Label>
              <Input 
                id="filter-synchro" 
                value={tempFilters.idSynchro}
                onChange={(e) => handleChange("idSynchro", e.target.value)}
                placeholder="Filtrer par IDSynchro"
              />
            </div>
            <div>
              <Label htmlFor="filter-serial" className="mb-1">Numéro de licence</Label>
              <Input 
                id="filter-serial" 
                value={tempFilters.serial}
                onChange={(e) => handleChange("serial", e.target.value)}
                placeholder="Filtrer par Serial"
              />
            </div>
            <div>
              <Label htmlFor="filter-pc" className="mb-1">Identifiant PC</Label>
              <Input 
                id="filter-pc" 
                value={tempFilters.identifiantPC}
                onChange={(e) => handleChange("identifiantPC", e.target.value)}
                placeholder="Filtrer par IdentifiantPC"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Checkbox 
                id="nuxidev-only" 
                checked={tempFilters.onlyNuxiDev}
                onCheckedChange={(checked) => handleChange("onlyNuxiDev", Boolean(checked))}
              />
              <Label htmlFor="nuxidev-only" className="ml-2">Uniquement NuxiDev</Label>
            </div>
            <Button type="submit">
              Appliquer les filtres
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
