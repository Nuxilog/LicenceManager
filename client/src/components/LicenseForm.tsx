import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { License } from "@/types/license";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  NOM_SOFT_OPTIONS, 
  SQL_SERVER_OPTIONS, 
  FTP_SERVER_OPTIONS,
  CONFIG_OPTIONS 
} from "@/lib/constants";
import { calculateAsciiSum } from "@/lib/licenseUtils";

interface LicenseFormProps {
  license: License | null;
  onSave: (license: License) => void;
  isNew: boolean;
}

export default function LicenseForm({ license, onSave, isNew }: LicenseFormProps) {
  const [formData, setFormData] = useState<License | null>(license);
  const [nbTerminaux, setNbTerminaux] = useState<string>("1");
  const [dataAscii, setDataAscii] = useState<string>("");

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
      
      // Extraire la partie lettres de l'ID de Synchro (sans la somme ASCII)
      if (license.IDSynchro) {
        const match = license.IDSynchro.match(/^([A-Z]+)\d*$/);
        if (match) {
          setDataAscii(match[1]);
        } else {
          setDataAscii(license.IDSynchro);
        }
      } else {
        setDataAscii("");
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

  const handleSelectChange = (name: string, value: string) => {
    // Traiter "none" comme une valeur vide
    const finalValue = value === "none" ? "" : value;
    
    setFormData(prev => {
      if (!prev) return prev;
      
      // Special handling for Data1 field: update URL1
      if (name === "Data1" && finalValue) {
        return {
          ...prev,
          [name]: finalValue,
          URL1: `https://${finalValue}/NuxiDev/${finalValue}/`
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

  const handleDataAsciiChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setDataAscii(value);
  };

  // Gestion de la sortie du champ ID de Synchro - calcul de la somme ASCII
  const handleIdSynchroBlur = () => {
    if (dataAscii && formData) {
      const asciiSum = calculateAsciiSum(dataAscii);
      const calculatedValue = `${dataAscii}${asciiSum}`;
      
      setFormData({
        ...formData,
        IDSynchro: calculatedValue
      });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Information en-tête */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
        <div>
          <Label htmlFor="id">ID</Label>
          <Input 
            id="id" 
            name="ID" 
            value={formData.ID || ""} 
            readOnly
            className="bg-slate-100"
          />
        </div>
        <div>
          <Label htmlFor="date_der_utilisation">Dernière utilisation</Label>
          <Input 
            id="date_der_utilisation" 
            name="Date_DerUtilisation" 
            value={formData.Date_DerUtilisation || ""} 
            readOnly
            className="bg-slate-100"
          />
        </div>
        <div>
          <Label htmlFor="version">Version</Label>
          <Input 
            id="version" 
            name="Version" 
            value={formData.Version || ""} 
            readOnly
            className="bg-slate-100"
          />
        </div>
        <div>
          <Label htmlFor="id_client">Numéro client</Label>
          <Input 
            id="id_client" 
            name="IDClient" 
            value={formData.IDClient || ""} 
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="id_synchro">ID de Synchro</Label>
          <Input 
            id="id_synchro"
            name="IDSynchro"
            value={dataAscii} 
            onChange={handleDataAsciiChange}
            onBlur={handleIdSynchroBlur}
            className="uppercase"
          />
        </div>
        <div>
          <Label htmlFor="serial">Serial</Label>
          <Input 
            id="serial" 
            name="Serial" 
            value={formData.Serial || ""} 
            onChange={handleChange}
          />
        </div>
        <div>
          <div className="flex items-center h-full mt-6">
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
          <Label htmlFor="mdp_premium">Mot de passe Premium</Label>
          <Input 
            id="mdp_premium" 
            name="MDP_Premium" 
            value={formData.MDP_Premium || ""} 
            onChange={handleChange}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="config">Choix de la configuration</Label>
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

      {/* Corps de la licence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="nom_soft">Nom du Soft</Label>
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
          <Label htmlFor="nb_terminaux">Nombre de terminaux</Label>
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
          <Label htmlFor="date_limite_util">Date Limite d'utilisation</Label>
          <Input 
            id="date_limite_util" 
            name="Date_LimiteUtil" 
            type="date"
            value={formData.Date_LimiteUtil ? new Date(formData.Date_LimiteUtil as string).toISOString().split('T')[0] : ""} 
            onChange={handleChange}
          />
        </div>
        <div>
          <div className="flex items-center h-full mt-6">
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
        <div>
          <Label htmlFor="data1">SQL Serveur 1</Label>
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
          <Label htmlFor="ftp1_hote">FTP Serveur 1</Label>
          <Select 
            name="FTP1_Hote"
            value={formData.FTP1_Hote || "none"}
            onValueChange={(value) => handleSelectChange("FTP1_Hote", value)}
          >
            <SelectTrigger id="ftp1_hote">
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
        </div>
        <div>
          <Label htmlFor="ftp1_mdp">Mot de passe FTP</Label>
          <Input 
            id="ftp1_mdp" 
            name="FTP1_Mdp" 
            value={formData.FTP1_Mdp || ""} 
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="url1">Téléchargement FTP</Label>
          <Input 
            id="url1" 
            name="URL1" 
            value={formData.URL1 || ""} 
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        <Button 
          type="button"
          variant="outline"
          onClick={() => setFormData(license)}
        >
          Annuler
        </Button>
        <Button type="submit">
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
