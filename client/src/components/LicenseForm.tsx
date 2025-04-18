import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { License } from "@/types/license";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  NOM_SOFT_OPTIONS, 
  SQL_SERVER_OPTIONS, 
  FTP_SERVER_OPTIONS,
  CONFIG_OPTIONS 
} from "@/lib/constants";
import { calculateAsciiSum, cryptPassword } from "@/lib/licenseUtils";
import { useToast } from "@/hooks/use-toast";
import { useLicenseData } from "@/hooks/useLicenseData";
import { Copy, RefreshCw } from "lucide-react";

interface LicenseFormProps {
  license: License | null;
  onSave: (license: License) => void;
  isNew: boolean;
}

export default function LicenseForm({ license, onSave, isNew }: LicenseFormProps) {
  const [formData, setFormData] = useState<License | null>(license);
  const [nbTerminaux, setNbTerminaux] = useState<string>("1");
  const { toast } = useToast();
  const { checkIdSynchroUniqueness } = useLicenseData({}, { key: "ID", direction: "asc" });

  // Fonction pour copier une valeur dans le presse-papier
  const copyToClipboard = (value: string, label: string) => {
    if (!value) {
      toast({
        title: "Aucune valeur à copier",
        description: `Le champ ${label} est vide.`,
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(value)
      .then(() => {
        toast({
          title: "Copié !",
          description: `${label} a été copié dans le presse-papier.`,
          duration: 2000
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier dans le presse-papier.",
          variant: "destructive"
        });
      });
  };

  useEffect(() => {
    if (license) {
      setFormData(license);
      
      // Extract number of terminals from Options if available
      if (license.Options) {
        const terminalsPart = license.Options.split(';')[0];
        if (terminalsPart) {
          setNbTerminaux(terminalsPart);
        }
      }
    }
  }, [license]);

  if (!formData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <p className="text-center text-slate-500">Sélectionnez une licence ou ajoutez-en une nouvelle</p>
      </div>
    );
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => {
      if (!prev) return prev;
      
      let updatedValue: any = type === "checkbox" ? checked ? 1 : 0 : value;
      
      // Special handling for Premium checkbox: set MDP_Premium to IDClient when checked
      if (name === "Premium" && updatedValue === 1) {
        return {
          ...prev,
          [name]: updatedValue,
          MDP_Premium: prev.IDClient
        };
      } else if (name === "Premium" && updatedValue === 0) {
        return {
          ...prev,
          [name]: updatedValue,
          MDP_Premium: ""
        };
      }
      
      return {
        ...prev,
        [name]: updatedValue
      };
    });
  };

  // Fonction pour générer l'URL de téléchargement FTP en fonction du serveur et de l'ID de Synchro
  const updateDownloadUrl = (data1: string, idSynchro: string) => {
    if (!data1) return "";
    if (!idSynchro) return `https://${data1}/NuxiDev/`;
    return `https://${data1}/NuxiDev/${idSynchro}/`;
  };

  const handleSelectChange = (name: string, value: string) => {
    // Traiter "none" comme une valeur vide
    const finalValue = value === "none" ? "" : value;
    
    setFormData(prev => {
      if (!prev) return prev;
      
      // Special handling for Data1 field: update URL1
      if (name === "Data1") {
        const idSynchro = prev.IDSynchro || "";
        return {
          ...prev,
          [name]: finalValue,
          URL1: updateDownloadUrl(finalValue, idSynchro)
        };
      }
      
      return {
        ...prev,
        [name]: finalValue
      };
    });
  };

  const handleNbTerminauxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNbTerminaux(value);
    
    // Update the Options field with the format: nb_terminaux;IDSynchro;0
    if (formData) {
      const parts = formData.Options ? formData.Options.split(';') : ["", "", ""];
      const idSynchro = parts[1] || formData.IDSynchro || "";
      
      setFormData({
        ...formData,
        Options: `${value};${idSynchro};0`
      });
    }
  };

  // Gestion spéciale du champ ID de Synchro
  const handleIdSynchroChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    
    if (formData) {
      // Mettre à jour formData avec les lettres saisies uniquement
      setFormData({
        ...formData,
        IDSynchro: value
      });
    }
  };

  // Quand on quitte le champ ID de Synchro, recalculer la valeur avec la somme ASCII
  const handleIdSynchroBlur = async () => {
    if (formData && formData.IDSynchro) {
      // Extraire seulement les lettres du début (pour s'assurer qu'on n'a pas déjà une somme)
      const lettersPart = formData.IDSynchro.match(/^([A-Z]+)/);
      if (lettersPart && lettersPart[1]) {
        const letters = lettersPart[1];
        // Calculer la somme ASCII et créer la valeur complète
        const asciiSum = calculateAsciiSum(letters);
        const calculatedValue = `${letters}${asciiSum}`;
        
        // Mettre à jour le formData avec la valeur complète (lettres + somme)
        // et mettre à jour l'URL1 si Data1 est défini
        setFormData(prev => {
          if (!prev) return prev;
          
          const updatedObj = {
            ...prev,
            IDSynchro: calculatedValue
          };
          
          // Mettre à jour l'URL1 si Data1 est présent
          if (prev.Data1) {
            updatedObj.URL1 = updateDownloadUrl(prev.Data1, calculatedValue);
          }
          
          return updatedObj;
        });
        
        // Vérifier si l'ID de Synchro existe déjà dans la base de données
        try {
          // Exclure la licence actuelle de la vérification (uniquement pour les mises à jour)
          const licenseId = formData.ID || undefined;
          const result = await checkIdSynchroUniqueness(calculatedValue, licenseId);
          
          if (result.exists && result.licenses && result.licenses.length > 0) {
            // Récupérer les numéros clients des licences qui utilisent déjà cet ID de Synchro
            const clientIds = result.licenses.map((license: License) => license.IDClient).join(', ');
            
            // Afficher un toast avec les informations
            toast({
              variant: "destructive",
              title: "Attention : ID de Synchro déjà utilisé",
              description: `Cet ID de Synchro est déjà utilisé par les clients: ${clientIds}`,
              duration: 6000
            });
          }
        } catch (error) {
          console.error("Erreur lors de la vérification de l'unicité de l'ID de Synchro:", error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de vérifier l'unicité de l'ID de Synchro"
          });
        }
      }
    }
  };

  // Fonction pour générer la valeur de sécurité niveau 2 en cryptant le mot de passe FTP
  const generateSecu2Value = () => {
    if (!formData || !formData.FTP1_Mdp) {
      toast({
        title: "Impossible de générer la valeur",
        description: "Le mot de passe FTP est vide.",
        variant: "destructive"
      });
      return;
    }
    
    // Crypter le mot de passe FTP uniquement
    const cryptedValue = cryptPassword(formData.FTP1_Mdp);
    
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        Secu2Srv1: cryptedValue
      };
    });
    
    toast({
      title: "Valeur générée",
      description: "La valeur Sécu niveau 2 a été générée avec succès.",
      duration: 2000
    });
  };

  // Fonction pour formater les dates au format MySQL (YYYY-MM-DD HH:MM:SS)
  const formatDateForMySQL = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      
      // Format YYYY-MM-DD HH:MM:SS
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error("Erreur de conversion de date:", error);
      return null;
    }
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData) {
      // Créer une copie des données du formulaire pour éviter de modifier l'état
      const formDataToSubmit = { ...formData };
      
      // Formater les dates au format MySQL si elles existent
      if (formDataToSubmit.Date_DerUtilisation) {
        formDataToSubmit.Date_DerUtilisation = formatDateForMySQL(formDataToSubmit.Date_DerUtilisation);
      }
      
      if (formDataToSubmit.Date_LimiteUtil) {
        formDataToSubmit.Date_LimiteUtil = formatDateForMySQL(formDataToSubmit.Date_LimiteUtil);
      }
      
      if (formDataToSubmit.DateClient) {
        formDataToSubmit.DateClient = formatDateForMySQL(formDataToSubmit.DateClient);
      }
      
      // Envoyer les données avec les dates formatées
      onSave(formDataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      {/* Information en-tête */}
      <div className="flex flex-col gap-y-2 mb-3 pb-3 border-b border-slate-200">
        {/* Première ligne: Numéro Client + Version + Dernière Utilisation + ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2">
          <div>
            <Label htmlFor="id_client" className="mb-1">Numéro client</Label>
            <Input 
              id="id_client" 
              name="IDClient" 
              value={formData.IDClient || ""} 
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="version" className="mb-1">Version</Label>
            <Input 
              id="version" 
              name="Version" 
              value={formData.Version || ""} 
              readOnly
              className="bg-slate-100"
            />
          </div>
          <div>
            <Label htmlFor="date_der_utilisation" className="mb-1">Dernière utilisation</Label>
            <Input 
              id="date_der_utilisation" 
              name="Date_DerUtilisation" 
              value={formData.Date_DerUtilisation ? new Date(formData.Date_DerUtilisation).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : ""} 
              readOnly
              className="bg-slate-100"
            />
          </div>
          <div>
            <Label htmlFor="id" className="mb-1">ID</Label>
            <div className="relative">
              <Input 
                id="id" 
                name="ID" 
                value={formData.ID || ""} 
                readOnly
                className="bg-slate-100 pr-8"
              />
              <NuxiButton 
                type="button"
                variant="primary" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => copyToClipboard(formData.ID.toString() || "", "ID")}
              >
                <Copy className="h-4 w-4" />
              </NuxiButton>
            </div>
          </div>
        </div>
        
        {/* Deuxième ligne: ID de Synchro + Serial + Choix de la configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 mt-2">
          <div>
            <Label htmlFor="id_synchro" className="mb-1">ID de Synchro</Label>
            <div className="relative">
              <Input 
                id="id_synchro"
                name="IDSynchro"
                value={formData.IDSynchro || ""} 
                onChange={handleIdSynchroChange}
                onBlur={handleIdSynchroBlur}
                className="uppercase pr-8"
              />
              <NuxiButton 
                type="button"
                variant="primary" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => copyToClipboard(formData.IDSynchro || "", "ID de Synchro")}
              >
                <Copy className="h-4 w-4" />
              </NuxiButton>
            </div>
          </div>
          <div>
            <Label htmlFor="serial" className="mb-1">Serial</Label>
            <div className="relative">
              <Input 
                id="serial" 
                name="Serial" 
                value={formData.Serial || ""} 
                onChange={handleChange}
                className="pr-8"
              />
              <NuxiButton 
                type="button"
                variant="primary" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => copyToClipboard(formData.Serial || "", "Serial")}
              >
                <Copy className="h-4 w-4" />
              </NuxiButton>
            </div>
          </div>
          <div>
            <Label htmlFor="config" className="mb-1">Choix de la configuration</Label>
            <Select 
              name="Tablettes"
              value={formData.Tablettes || "none"}
              onValueChange={(value) => handleSelectChange("Tablettes", value)}
            >
              <SelectTrigger id="config">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {CONFIG_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Troisième ligne: Suspendu + Licence Premium + Mot de passe Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 mt-2">
          <div className="flex flex-col justify-end">
            <div className="flex items-center h-10">
              <Checkbox 
                id="suspendu" 
                name="Suspendu" 
                checked={!!formData.Suspendu}
                onCheckedChange={(checked) => {
                  setFormData(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      Suspendu: checked ? 1 : 0
                    };
                  });
                }}
              />
              <Label htmlFor="suspendu" className="ml-2">Suspendu</Label>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center h-10">
              <Checkbox 
                id="premium" 
                name="Premium" 
                checked={!!formData.Premium}
                onCheckedChange={(checked) => {
                  setFormData(prev => {
                    if (!prev) return prev;
                    const updatedValue = checked ? 1 : 0;
                    return {
                      ...prev,
                      Premium: updatedValue,
                      MDP_Premium: updatedValue ? prev.IDClient : ""
                    };
                  });
                }}
              />
              <Label htmlFor="premium" className="ml-2">Licence Premium</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="mdp_premium" className="mb-1">Mot de passe Premium</Label>
            <div className="relative">
              <Input 
                id="mdp_premium" 
                name="MDP_Premium" 
                value={formData.MDP_Premium || ""} 
                onChange={handleChange}
                className="pr-8"
              />
              <NuxiButton 
                type="button"
                variant="primary" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => copyToClipboard(formData.MDP_Premium || "", "Mot de passe Premium")}
              >
                <Copy className="h-4 w-4" />
              </NuxiButton>
            </div>
          </div>
        </div>
      </div>

      {/* Corps de la licence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
        <div>
          <Label htmlFor="nom_soft" className="mb-1">Nom du Soft</Label>
          <Select 
            name="NomSoft"
            value={formData.NomSoft || "NuxiDev"}
            onValueChange={(value) => handleSelectChange("NomSoft", value)}
          >
            <SelectTrigger id="nom_soft">
              <SelectValue placeholder="NuxiDev Générique" />
            </SelectTrigger>
            <SelectContent>
              {NOM_SOFT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nb_terminaux" className="mb-1">Nombre de terminaux</Label>
          <Input 
            id="nb_terminaux" 
            type="number"
            min="1"
            value={nbTerminaux} 
            onChange={handleNbTerminauxChange}
          />
          <input 
            type="hidden" 
            name="Options" 
            value={formData.Options || ""}
          />
        </div>
        <div>
          <Label htmlFor="date_limite_util" className="mb-1">Date Limite d'utilisation</Label>
          <Input 
            id="date_limite_util" 
            name="Date_LimiteUtil" 
            type="date"
            value={formData.Date_LimiteUtil ? new Date(formData.Date_LimiteUtil as string).toISOString().split('T')[0] : ""} 
            onChange={handleChange}
          />
        </div>
        {/* Ligne avec Data1 + FTP1 + URL1 */}
        <div>
          <Label htmlFor="data1" className="mb-1">Serveur DATA 1</Label>
          <Select 
            name="Data1"
            value={formData.Data1 || "none"}
            onValueChange={(value) => handleSelectChange("Data1", value)}
          >
            <SelectTrigger id="data1">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-</SelectItem>
              {SQL_SERVER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ftp1_hote" className="mb-1">FTP Serveur 1</Label>
          <div className="relative">
            <Select 
              name="FTP1_Hote"
              value={formData.FTP1_Hote || "none"}
              onValueChange={(value) => handleSelectChange("FTP1_Hote", value)}
            >
              <SelectTrigger id="ftp1_hote" className="pr-8">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {FTP_SERVER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NuxiButton 
              type="button"
              variant="primary" 
              size="icon" 
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => copyToClipboard(formData.FTP1_Hote || "", "FTP Serveur 1")}
            >
              <Copy className="h-4 w-4" />
            </NuxiButton>
          </div>
        </div>
        <div>
          <Label htmlFor="url1" className="mb-1">Téléchargement FTP</Label>
          <div className="relative">
            <Input 
              id="url1" 
              name="URL1" 
              value={formData.URL1 || ""} 
              readOnly
              className="bg-slate-100 pr-8"
            />
            <NuxiButton 
              type="button"
              variant="primary" 
              size="icon" 
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => copyToClipboard(formData.URL1 || "", "Téléchargement FTP")}
            >
              <Copy className="h-4 w-4" />
            </NuxiButton>
          </div>
        </div>
        
        {/* Ligne avec FTP1_Identifiant + FTP1_Mdp + Secu2Srv1 */}
        <div>
          <Label htmlFor="ftp1_identifiant" className="mb-1">Utilisateur FTP</Label>
          <div className="relative">
            <Input 
              id="ftp1_identifiant" 
              name="FTP1_Identifiant" 
              value={formData.FTP1_Identifiant || ""} 
              onChange={handleChange}
              className="pr-8"
            />
            <NuxiButton 
              type="button"
              variant="primary" 
              size="icon" 
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => copyToClipboard(formData.FTP1_Identifiant || "", "Utilisateur FTP")}
            >
              <Copy className="h-4 w-4" />
            </NuxiButton>
          </div>
        </div>
        <div>
          <Label htmlFor="ftp1_mdp" className="mb-1">Mot de passe FTP</Label>
          <div className="relative">
            <Input 
              id="ftp1_mdp" 
              name="FTP1_Mdp" 
              value={formData.FTP1_Mdp || ""} 
              onChange={handleChange}
              className="pr-8"
            />
            <NuxiButton 
              type="button"
              variant="primary" 
              size="icon" 
              className="absolute right-0 top-0 h-full px-2"
              onClick={() => copyToClipboard(formData.FTP1_Mdp || "", "Mot de passe FTP")}
            >
              <Copy className="h-4 w-4" />
            </NuxiButton>
          </div>
        </div>
        <div>
          <Label htmlFor="secu2_srv1" className="mb-1">Sécu niveau 2</Label>
          <div className="relative">
            <Input 
              id="secu2_srv1" 
              name="Secu2Srv1" 
              value={formData.Secu2Srv1 || ""} 
              onChange={handleChange}
              className="pr-16"
            />
            <div className="absolute right-0 top-0 h-full flex">
              <NuxiButton 
                type="button"
                variant="primary" 
                size="icon" 
                className="px-2"
                onClick={() => copyToClipboard(formData.Secu2Srv1 || "", "Sécu niveau 2")}
                title="Copier la valeur"
              >
                <Copy className="h-4 w-4" />
              </NuxiButton>
              <NuxiButton 
                type="button"
                variant="primary" 
                size="icon" 
                className="px-2"
                onClick={generateSecu2Value}
                title="Générer à partir du mot de passe FTP"
              >
                <RefreshCw className="h-4 w-4" />
              </NuxiButton>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-3">
        <NuxiButton 
          type="button"
          variant="primary"
          onClick={() => setFormData(license)}
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
  );
}