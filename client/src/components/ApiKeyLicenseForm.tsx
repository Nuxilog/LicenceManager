import { useState, FormEvent, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { ApiKeyLicense } from "@/types/license";
import { format } from "date-fns";
import { Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSerial } from "@/lib/licenseUtils";

interface ApiKeyLicenseFormProps {
  license: ApiKeyLicense | null;
  onSave: (license: ApiKeyLicense) => void;
  isNew: boolean;
}

export default function ApiKeyLicenseForm({ license, onSave, isNew }: ApiKeyLicenseFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [localLicense, setLocalLicense] = useState<ApiKeyLicense | null>(license);
  
  // Reset the form when a new license is selected
  if (license && license.ID !== localLicense?.ID) {
    setLocalLicense(license);
  }

  if (!localLicense) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié!",
      description: "La valeur a été copiée dans le presse-papier",
      variant: "default",
    });
  };

  const generateApiKey = () => {
    // Generate a longer key that looks like an API key
    const key = generateSerial() + "-" + generateSerial() + "-" + generateSerial();
    setLocalLicense(prev => {
      if (!prev) return null;
      return { ...prev, ApiKey: key };
    });
  };

  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      return "";
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!localLicense) return;

    // Validate the form
    if (!localLicense.ClientID) {
      toast({
        title: "Erreur",
        description: "L'ID client est requis",
        variant: "destructive",
      });
      return;
    }

    if (!localLicense.ApiKey) {
      toast({
        title: "Erreur",
        description: "La clé API est requise",
        variant: "destructive",
      });
      return;
    }

    if (!localLicense.Serial) {
      toast({
        title: "Erreur",
        description: "Le numéro de série est requis",
        variant: "destructive",
      });
      return;
    }

    // Update the license with the form data
    const updatedLicense: ApiKeyLicense = {
      ...localLicense
    };

    onSave(updatedLicense);
  };

  const handleCancel = () => {
    // Reset to the original license
    setLocalLicense(license);
  };

  // Generate a new Serial for the license
  const createNewSerial = () => {
    const newSerial = generateSerial();
    setLocalLicense(prev => {
      if (!prev) return null;
      return { ...prev, Serial: newSerial };
    });
  };

  // Generate a new API Key V5
  const generateApiKeyV5 = () => {
    // Generate a longer key for V5
    const keyV5 = generateSerial() + "-" + generateSerial() + "-" + generateSerial() + "-" + generateSerial();
    setLocalLicense(prev => {
      if (!prev) return null;
      return { ...prev, ApiKeyV5: keyV5 };
    });
  };

  return (
    <Card className="p-6">
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* First row: Client ID and Serial */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="clientId">ID Client</Label>
            <Input 
              id="clientId" 
              name="clientId" 
              value={localLicense.ClientID}
              onChange={(e) => setLocalLicense({...localLicense, ClientID: parseInt(e.target.value) || 0})}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serial" className="flex justify-between">
              <span>Numéro de série</span>
              <div className="space-x-2">
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={() => handleCopy(localLicense.Serial)}
                >
                  <Copy className="h-4 w-4 inline mr-1" />
                  Copier
                </button>
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={createNewSerial}
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Générer
                </button>
              </div>
            </Label>
            <Input 
              id="serial" 
              name="serial" 
              value={localLicense.Serial}
              onChange={(e) => setLocalLicense({...localLicense, Serial: e.target.value})}
              className="font-mono"
              required
            />
          </div>
        </div>

        {/* Second row: API Key and API Key V5 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex justify-between">
              <span>Clé API</span>
              <div className="space-x-2">
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={() => handleCopy(localLicense.ApiKey)}
                >
                  <Copy className="h-4 w-4 inline mr-1" />
                  Copier
                </button>
              </div>
            </Label>
            <Input 
              id="apiKey" 
              name="apiKey" 
              value={localLicense.ApiKey}
              onChange={(e) => setLocalLicense({...localLicense, ApiKey: e.target.value})}
              className="font-mono"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKeyV5" className="flex justify-between">
              <span>Clé API V5</span>
              <div className="space-x-2">
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={() => handleCopy(localLicense.ApiKeyV5)}
                >
                  <Copy className="h-4 w-4 inline mr-1" />
                  Copier
                </button>
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={generateApiKeyV5}
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Générer
                </button>
              </div>
            </Label>
            <Input 
              id="apiKeyV5" 
              name="apiKeyV5" 
              value={localLicense.ApiKeyV5}
              onChange={(e) => setLocalLicense({...localLicense, ApiKeyV5: e.target.value})}
              className="font-mono"
              required
            />
          </div>
        </div>

        {/* Third row: Quantity and Last Used */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité</Label>
            <Input 
              id="quantity" 
              name="quantity" 
              type="number"
              value={localLicense.Quantity}
              onChange={(e) => setLocalLicense({...localLicense, Quantity: parseInt(e.target.value) || 0})}
              required
            />
            <p className="text-sm text-gray-500">
              Nombre d'appels API restants pour cette clé
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastUsed">Dernière utilisation</Label>
            <Input 
              id="lastUsed" 
              name="lastUsed" 
              type="datetime-local"
              value={formatDateForInput(localLicense.LastUsed)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : new Date();
                setLocalLicense({...localLicense, LastUsed: date.toISOString()});
              }}
              disabled
            />
            <p className="text-sm text-gray-500">
              Date de la dernière utilisation de cette clé (mise à jour automatiquement)
            </p>
          </div>
        </div>

        {/* Fourth row: Restriction */}
        <div className="mb-6">
          <div className="space-y-2">
            <Label htmlFor="restriction">Restrictions</Label>
            <Textarea 
              id="restriction" 
              name="restriction" 
              value={localLicense.Restriction}
              onChange={(e) => setLocalLicense({...localLicense, Restriction: e.target.value})}
              placeholder="Restrictions éventuelles pour cette clé API (ex: 'impayé', 'stop', etc.)"
              className="h-24"
            />
            <p className="text-sm text-gray-500">
              Laissez vide pour une clé sans restriction, ou ajoutez des mots-clés comme "stop" ou "impayé" pour suspendre la clé
            </p>
          </div>
        </div>


        
        {/* Form buttons */}
        <div className="flex justify-end space-x-2">
          <NuxiButton 
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Annuler
          </NuxiButton>
          <NuxiButton 
            type="submit"
            variant="primary"
          >
            {isNew ? "Créer" : "Enregistrer"}
          </NuxiButton>
        </div>
      </form>
    </Card>
  );
}