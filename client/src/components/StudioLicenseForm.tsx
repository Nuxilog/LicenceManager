import { useState, FormEvent, useEffect } from "react";
import { StudioLicense } from "@/types/license";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { Checkbox } from "@/components/ui/checkbox";
import { generateSerial } from "@/lib/licenseUtils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface StudioLicenseFormProps {
  license: StudioLicense | null;
  onSave: (license: StudioLicense) => void;
  isNew: boolean;
}

export default function StudioLicenseForm({ license, onSave, isNew }: StudioLicenseFormProps) {
  const [formData, setFormData] = useState<StudioLicense>({
    ID: 0,
    NumClient: 0,
    Serial: null,
    IdentifiantUser: null,
    PDF: 0,
    Vue: 0,
    PagePerso: 0,
    WDE: 0,
    Suspendu: 0
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Initialiser le formulaire lorsque la licence change
  useEffect(() => {
    if (license) {
      setFormData(license);
    } else if (isNew) {
      setFormData({
        ID: 0,
        NumClient: 0,
        Serial: generateSerial(), // Générer un numéro de série automatiquement
        IdentifiantUser: null,
        PDF: 0,
        Vue: 0,
        PagePerso: 0,
        WDE: 0,
        Suspendu: 0
      });
    }
  }, [license, isNew]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!formData.NumClient) {
      setFormError("Le numéro de client est obligatoire");
      return;
    }
    
    if (!formData.Serial) {
      setFormError("Le numéro de série est obligatoire");
      return;
    }
    
    // Tout est valide, soumettre les données
    setFormError(null);
    onSave(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked ? 1 : 0
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border mb-4">
      <h3 className="text-xl font-semibold mb-4">
        {isNew ? "Ajouter une nouvelle licence Studio" : `Modifier la licence Studio #${license?.ID}`}
      </h3>
      
      {formError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{formError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="NumClient">Numéro de client <span className="text-red-500">*</span></Label>
            <Input
              id="NumClient"
              name="NumClient"
              type="number"
              required
              value={formData.NumClient || ''}
              onChange={handleInputChange}
              className="w-full"
            />
            <p className="text-xs text-gray-500">Identifiant du client pour cette licence</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="Serial">Numéro de série <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input
                id="Serial"
                name="Serial"
                required
                value={formData.Serial || ''}
                onChange={handleInputChange}
                className="flex-grow"
              />
              <NuxiButton 
                type="button" 
                variant="secondary"
                onClick={() => setFormData(prev => ({ ...prev, Serial: generateSerial() }))}
              >
                Générer
              </NuxiButton>
            </div>
            <p className="text-xs text-gray-500">Le numéro de série unique de la licence</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="IdentifiantUser">Identifiant utilisateur</Label>
            <Input
              id="IdentifiantUser"
              name="IdentifiantUser"
              value={formData.IdentifiantUser || ''}
              onChange={handleInputChange}
              className="w-full"
            />
            <p className="text-xs text-gray-500">Identifiant de l'utilisateur associé à cette licence</p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-lg font-medium mb-3">Modules activés</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="PDF" 
                checked={formData.PDF === 1}
                onCheckedChange={(checked) => handleCheckboxChange("PDF", checked === true)}
              />
              <Label htmlFor="PDF">Module PDF</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="Vue" 
                checked={formData.Vue === 1}
                onCheckedChange={(checked) => handleCheckboxChange("Vue", checked === true)}
              />
              <Label htmlFor="Vue">Module Vue</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="PagePerso" 
                checked={formData.PagePerso === 1}
                onCheckedChange={(checked) => handleCheckboxChange("PagePerso", checked === true)}
              />
              <Label htmlFor="PagePerso">Module Page Perso</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="WDE" 
                checked={formData.WDE === 1}
                onCheckedChange={(checked) => handleCheckboxChange("WDE", checked === true)}
              />
              <Label htmlFor="WDE">Module WDE</Label>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="Suspendu" 
              checked={formData.Suspendu === 1}
              onCheckedChange={(checked) => handleCheckboxChange("Suspendu", checked === true)}
            />
            <Label htmlFor="Suspendu">Licence suspendue</Label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Une licence suspendue ne peut pas être utilisée</p>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <NuxiButton type="submit" variant="primary">
            {isNew ? "Créer la licence" : "Enregistrer les modifications"}
          </NuxiButton>
        </div>
      </form>
    </div>
  );
}