import { useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NuxiSavLicenseFilters } from "@/types/license";

interface NuxiSavFilterPanelProps {
  filters: NuxiSavLicenseFilters;
  onFilterChange: (filters: NuxiSavLicenseFilters) => void;
}

export default function NuxiSavFilterPanel({ filters, onFilterChange }: NuxiSavFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<NuxiSavLicenseFilters>(filters);

  // Apply changes directly on input change without requiring form submission
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // For checkbox/switch inputs use the checked property, otherwise use value
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedFilters = {
      ...localFilters,
      [name]: newValue
    };
    
    setLocalFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <Card className="p-4 mb-4">
      <h2 className="text-lg font-semibold mb-4">Filtrer les licences</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="idClient">ID Client</Label>
          <Input
            id="idClient"
            name="idClient"
            value={localFilters.idClient || ''}
            onChange={handleInputChange}
            placeholder="Numéro client"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="identifiantWeb">Identifiant Web</Label>
          <Input
            id="identifiantWeb"
            name="identifiantWeb"
            value={localFilters.identifiantWeb || ''}
            onChange={handleInputChange}
            placeholder="Identifiant Web"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="serial">Serial</Label>
          <Input
            id="serial"
            name="serial"
            value={localFilters.serial || ''}
            onChange={handleInputChange}
            placeholder="Numéro de série"
            className="mt-1"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="onlyWithAtel"
            name="onlyWithAtel"
            checked={localFilters.onlyWithAtel || false}
            onCheckedChange={(checked) => {
              const updatedFilters = { ...localFilters, onlyWithAtel: checked };
              setLocalFilters(updatedFilters);
              onFilterChange(updatedFilters);
            }}
          />
          <Label htmlFor="onlyWithAtel">Atelier</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="onlyWithTrck"
            name="onlyWithTrck"
            checked={localFilters.onlyWithTrck || false}
            onCheckedChange={(checked) => {
              const updatedFilters = { ...localFilters, onlyWithTrck: checked };
              setLocalFilters(updatedFilters);
              onFilterChange(updatedFilters);
            }}
          />
          <Label htmlFor="onlyWithTrck">Tracking</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="onlyWithTckWeb"
            name="onlyWithTckWeb"
            checked={localFilters.onlyWithTckWeb || false}
            onCheckedChange={(checked) => {
              const updatedFilters = { ...localFilters, onlyWithTckWeb: checked };
              setLocalFilters(updatedFilters);
              onFilterChange(updatedFilters);
            }}
          />
          <Label htmlFor="onlyWithTckWeb">Ticket web</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="onlyWithAud"
            name="onlyWithAud"
            checked={localFilters.onlyWithAud || false}
            onCheckedChange={(checked) => {
              const updatedFilters = { ...localFilters, onlyWithAud: checked };
              setLocalFilters(updatedFilters);
              onFilterChange(updatedFilters);
            }}
          />
          <Label htmlFor="onlyWithAud">Audit</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="onlyWithSdk"
            name="onlyWithSdk"
            checked={localFilters.onlyWithSdk || false}
            onCheckedChange={(checked) => {
              const updatedFilters = { ...localFilters, onlyWithSdk: checked };
              setLocalFilters(updatedFilters);
              onFilterChange(updatedFilters);
            }}
          />
          <Label htmlFor="onlyWithSdk">SDK</Label>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mt-4">
        <Switch
          id="hideSuspended"
          name="hideSuspended"
          checked={localFilters.hideSuspended || false}
          onCheckedChange={(checked) => {
            const updatedFilters = { ...localFilters, hideSuspended: checked };
            setLocalFilters(updatedFilters);
            onFilterChange(updatedFilters);
          }}
        />
        <Label htmlFor="hideSuspended">Masquer licences suspendues</Label>
      </div>
    </Card>
  );
}