import { useState, FormEvent, useEffect } from "react";
import { StudioLicense } from "@/types/license";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { Checkbox } from "@/components/ui/checkbox";
import { generateSerial } from "@/lib/licenseUtils";
import { AlertCircle, Copy } from "lucide-react";

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
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Serial copié dans le presse-papier");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border mb-4">
      <h3 className="text-xl font-semibold mb-3">
        {isNew ? "Ajouter une nouvelle licence Studio" : `Modifier la licence Studio #${license?.ID}`}
      </h3>
      
      {formError && (
        <div className="bg-red-50 text-red-700 p-2 rounded-md mb-3 flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{formError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Première ligne: Numéro client et Numéro de série */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="NumClient" className="mb-1 text-sm">Numéro de client <span className="text-red-500">*</span></Label>
              <Input
                id="NumClient"
                name="NumClient"
                type="number"
                required
                value={formData.NumClient || ''}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            
            <div>
              <Label htmlFor="Serial" className="mb-1 text-sm">Serial <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="Serial"
                  name="Serial"
                  required
                  value={formData.Serial || ''}
                  onChange={handleInputChange}
                  className="w-full pr-8"
                />
                <NuxiButton 
                  type="button"
                  variant="primary" 
                  size="icon" 
                  className="absolute right-0 top-0 h-full px-2"
                  onClick={() => formData.Serial && copyToClipboard(formData.Serial)}
                >
                  <Copy className="h-4 w-4" />
                </NuxiButton>
              </div>
            </div>
          </div>
          
          {/* Deuxième ligne: Identifiant utilisateur et Licence suspendue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="IdentifiantUser" className="mb-1 text-sm">Identifiant utilisateur</Label>
              <Input
                id="IdentifiantUser"
                name="IdentifiantUser"
                value={formData.IdentifiantUser || ''}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center pt-6">
              <Checkbox 
                id="Suspendu" 
                checked={formData.Suspendu === 1}
                onCheckedChange={(checked) => handleCheckboxChange("Suspendu", checked === true)}
              />
              <Label htmlFor="Suspendu" className="ml-2 text-sm">Licence suspendue</Label>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 mt-3">
          <h4 className="text-md font-medium mb-2">Modules activés</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="PDF" 
                checked={formData.PDF === 1}
                onCheckedChange={(checked) => handleCheckboxChange("PDF", checked === true)}
              />
              <Label htmlFor="PDF" className="text-sm">Module PDF</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="Vue" 
                checked={formData.Vue === 1}
                onCheckedChange={(checked) => handleCheckboxChange("Vue", checked === true)}
              />
              <Label htmlFor="Vue" className="text-sm">Module Vue</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="PagePerso" 
                checked={formData.PagePerso === 1}
                onCheckedChange={(checked) => handleCheckboxChange("PagePerso", checked === true)}
              />
              <Label htmlFor="PagePerso" className="text-sm">Module Page Perso</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="WDE" 
                checked={formData.WDE === 1}
                onCheckedChange={(checked) => handleCheckboxChange("WDE", checked === true)}
              />
              <Label htmlFor="WDE" className="text-sm">Module WDE</Label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-3 border-t mt-3">
          <NuxiButton 
            type="button"
            variant="primary"
            onClick={() => {
              if (license) {
                setFormData({...license});
              } else {
                // Si pas de licence existante (création), réinitialiser le formulaire
                setFormData({
                  ID: 0,
                  NumClient: 0,
                  Serial: generateSerial(),
                  IdentifiantUser: null,
                  PDF: 0,
                  Vue: 0,
                  PagePerso: 0,
                  WDE: 0,
                  Suspendu: 0
                });
              }
            }}
          >
            Annuler
          </NuxiButton>
          <NuxiButton 
            type="submit"
            variant="secondary"
          >
            Enregistrer
          </NuxiButton>
        </div>
      </form>
    </div>
  );
}