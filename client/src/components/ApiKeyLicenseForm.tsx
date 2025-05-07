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
  const [hasExpiry, setHasExpiry] = useState<boolean>(!!license?.ExpiresAt);

  // Reset the form when a new license is selected
  if (license && license.ID !== localLicense?.ID) {
    setLocalLicense(license);
    setHasExpiry(!!license.ExpiresAt);
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

    // Update the license with the form data
    const updatedLicense: ApiKeyLicense = {
      ...localLicense,
      ExpiresAt: hasExpiry ? localLicense.ExpiresAt : null,
    };

    onSave(updatedLicense);
  };

  const handleCancel = () => {
    // Reset to the original license
    setLocalLicense(license);
    setHasExpiry(!!license?.ExpiresAt);
  };

  return (
    <Card className="p-6">
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* First row: Client ID and API Key */}
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
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  onClick={generateApiKey}
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Générer
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
        </div>

        {/* Second row: Description and Expiry */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={localLicense.Description || ""}
              onChange={(e) => setLocalLicense({...localLicense, Description: e.target.value})}
              placeholder="Description de l'utilisation de cette clé API"
              className="h-24"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="hasExpiry">Date d'expiration</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="hasExpiry" 
                  checked={hasExpiry} 
                  onCheckedChange={(checked) => {
                    setHasExpiry(checked);
                    if (!checked) {
                      setLocalLicense({...localLicense, ExpiresAt: null});
                    } else if (!localLicense.ExpiresAt) {
                      // Set default expiry to 1 year from now
                      const oneYearFromNow = new Date();
                      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                      setLocalLicense({...localLicense, ExpiresAt: oneYearFromNow.toISOString()});
                    }
                  }}
                />
                <Label htmlFor="hasExpiry" className="text-sm">Activer expiration</Label>
              </div>
            </div>
            {hasExpiry && (
              <Input 
                type="datetime-local" 
                id="expiresAt" 
                name="expiresAt" 
                value={formatDateForInput(localLicense.ExpiresAt)}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setLocalLicense({...localLicense, ExpiresAt: date ? date.toISOString() : null});
                }}
              />
            )}
          </div>
        </div>

        {/* Third row: Status */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive" 
              checked={!!localLicense.IsActive} 
              onCheckedChange={(checked) => {
                setLocalLicense({...localLicense, IsActive: checked ? 1 : 0});
              }}
            />
            <Label htmlFor="isActive">Clé active</Label>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {localLicense.IsActive ? 
              "Cette clé API est actuellement active et peut être utilisée pour les requêtes." : 
              "Cette clé API est inactive et ne peut pas être utilisée pour les requêtes."}
          </p>
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