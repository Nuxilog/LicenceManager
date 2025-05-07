import { Input } from "@/components/ui/input";
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
  const handleChange = (field: keyof typeof filters, value: string | boolean) => {
    const updatedFilters = { ...filters, [field]: value };
    onFilterChange(updatedFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
      <div className="space-y-4">
        {/* Champs de recherche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="filter-client" className="mb-1">Numéro Client</Label>
            <Input 
              id="filter-client" 
              value={filters.numClient}
              onChange={(e) => handleChange("numClient", e.target.value)}
              placeholder="Numéro client"
            />
          </div>
          <div>
            <Label htmlFor="filter-serial" className="mb-1">Numéro de série</Label>
            <Input 
              id="filter-serial" 
              value={filters.serial}
              onChange={(e) => handleChange("serial", e.target.value)}
              placeholder="Numéro de série"
            />
          </div>
          <div>
            <Label htmlFor="filter-user" className="mb-1">Identifiant utilisateur</Label>
            <Input 
              id="filter-user" 
              value={filters.identifiantUser}
              onChange={(e) => handleChange("identifiantUser", e.target.value)}
              placeholder="Identifiant utilisateur"
            />
          </div>
        </div>
        
        {/* Options de filtrage */}
        <div className="flex items-center flex-wrap justify-between border-t border-slate-200 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
            <div className="flex items-center">
              <Checkbox 
                id="pdf-only" 
                checked={filters.onlyWithPDF}
                onCheckedChange={(checked) => handleChange("onlyWithPDF", Boolean(checked))}
              />
              <Label htmlFor="pdf-only" className="ml-2 text-sm">Module PDF</Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="vue-only" 
                checked={filters.onlyWithVue}
                onCheckedChange={(checked) => handleChange("onlyWithVue", Boolean(checked))}
              />
              <Label htmlFor="vue-only" className="ml-2 text-sm">Module Vue</Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="page-perso-only" 
                checked={filters.onlyWithPagePerso}
                onCheckedChange={(checked) => handleChange("onlyWithPagePerso", Boolean(checked))}
              />
              <Label htmlFor="page-perso-only" className="ml-2 text-sm">Module Page Perso</Label>
            </div>
            <div className="flex items-center">
              <Checkbox 
                id="wde-only" 
                checked={filters.onlyWithWDE}
                onCheckedChange={(checked) => handleChange("onlyWithWDE", Boolean(checked))}
              />
              <Label htmlFor="wde-only" className="ml-2 text-sm">Module WDE</Label>
            </div>
          </div>
          
          <div className="flex items-center mt-3 md:mt-0">
            <div className="flex items-center">
              <Checkbox 
                id="hide-suspended" 
                checked={filters.hideSuspended}
                onCheckedChange={(checked) => handleChange("hideSuspended", Boolean(checked))}
              />
              <Label htmlFor="hide-suspended" className="ml-2 text-sm">Masquer licences suspendues</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}