import { useState, FormEvent, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NuxiSavLicense, NuxiSavPoste } from "@/types/license";
import { Copy, Trash2 } from "lucide-react";
import { formatDateFr } from "@/lib/utils";

interface NuxiSavLicenseFormProps {
  license: NuxiSavLicense | null;
  onSave: (license: NuxiSavLicense) => void;
  isNew: boolean;
}

export default function NuxiSavLicenseForm({ license, onSave, isNew }: NuxiSavLicenseFormProps) {
  const { toast } = useToast();
  const [editedLicense, setEditedLicense] = useState<NuxiSavLicense | null>(license);
  
  // Définir le type pour les options
  type OptionKeys = 'Atel' | 'Trck' | 'TckWeb' | 'Aud' | 'sdk';
  
  // Options disponibles avec leurs labels
  const availableOptions = [
    { value: 'Atel' as OptionKeys, label: 'Atelier' },
    { value: 'Trck' as OptionKeys, label: 'Tracking' },
    { value: 'TckWeb' as OptionKeys, label: 'Ticket web' },
    { value: 'Aud' as OptionKeys, label: 'Audit' },
    { value: 'sdk' as OptionKeys, label: 'SDK' }
  ];
  
  // État pour suivre les options sélectionnées
  const [options, setOptions] = useState<Record<OptionKeys, boolean>>({
    Atel: false,
    Trck: false,
    TckWeb: false,
    Aud: false,
    sdk: false
  });

  // Mise à jour des options sélectionnées lorsque la licence change
  useEffect(() => {
    if (license && license.Options) {
      const selectedOptions = license.Options.split(',').map(opt => opt.trim());
      const newOptions: Record<OptionKeys, boolean> = { 
        Atel: false, 
        Trck: false, 
        TckWeb: false, 
        Aud: false, 
        sdk: false 
      };
      
      selectedOptions.forEach(opt => {
        if (opt === 'Atel' || opt === 'Trck' || opt === 'TckWeb' || opt === 'Aud' || opt === 'sdk') {
          newOptions[opt] = true;
        }
      });
      
      setOptions(newOptions);
    } else {
      setOptions({ Atel: false, Trck: false, TckWeb: false, Aud: false, sdk: false });
    }
    
    setEditedLicense(license);
  }, [license]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedLicense) return;
    
    const { name, value, type } = e.target;
    
    // Pour les champs numériques, convertir en nombre
    if (type === 'number') {
      const numValue = value === '' ? 0 : parseInt(value, 10);
      setEditedLicense({
        ...editedLicense,
        [name]: numValue
      });
    } else {
      setEditedLicense({
        ...editedLicense,
        [name]: value
      });
    }
  };

  const handleOptionChange = (optionKey: OptionKeys, checked: boolean) => {
    setOptions({
      ...options,
      [optionKey]: checked
    });
  };

  // Fonction pour libérer un poste
  const handleReleasePost = (poste: NuxiSavPoste) => {
    if (!editedLicense) return;
    
    // Utilisons des chaînes vides au lieu de null pour être sûr que la base de données les traite correctement
    const updatedPoste = {
      ...poste,
      Emprunte_PC: "",
      Nom_Poste: "",
      Nom_Session: "",
      Der_Utilisation: null, // null est correct pour les dates
      Version: "",
      Connecte: 0
    };
    
    const updatedPostes = editedLicense.Postes.map(p => {
      if (p.ID === poste.ID) return updatedPoste;
      return p;
    });
    
    setEditedLicense({
      ...editedLicense,
      Postes: updatedPostes
    });
    
    // Modification immédiate sans attendre d'appuyer sur Enregistrer
    // (Décommentez cette ligne si vous souhaitez que le bouton Libérer sauvegarde automatiquement)
    // handleSubmit(new Event('submit') as React.FormEvent);
  };

  // Fonction pour mettre à jour le nombre de postes
  const handleNbrPermanenteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedLicense) return;
    
    const newCount = parseInt(e.target.value, 10) || 0;
    const currentCount = editedLicense.Postes.length;
    const serialPermanente = editedLicense.SerialPermanente || '';
    
    let updatedPostes = [...editedLicense.Postes];
    
    if (newCount > currentCount) {
      // Ajouter des postes
      for (let i = 0; i < newCount - currentCount; i++) {
        const newPoste: NuxiSavPoste = {
          ID: -1 - i, // ID temporaire négatif pour les nouveaux postes
          IDLicence: editedLicense.ID,
          Serial: serialPermanente,
          Emprunte_PC: null,
          Nom_Poste: null,
          Nom_Session: null,
          Der_Utilisation: null,
          Version: null,
          Connecte: 0
        };
        updatedPostes.push(newPoste);
      }
    } else if (newCount < currentCount) {
      // Supprimer des postes en excès (on garde les premiers)
      updatedPostes = updatedPostes.slice(0, newCount);
    }
    
    setEditedLicense({
      ...editedLicense,
      NbrPermanente: newCount,
      Postes: updatedPostes
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!editedLicense) return;
    
    // Construire la chaîne d'options à partir des options sélectionnées
    const selectedOptions = Object.entries(options)
      .filter(([_, isSelected]) => isSelected)
      .map(([key, _]) => key);
    
    const optionsString = selectedOptions.join(',');
    
    // Licence mise à jour avec les options (jamais null pour éviter l'erreur SQL)
    const updatedLicense = {
      ...editedLicense,
      Options: optionsString || ""
    };
    
    onSave(updatedLicense);
    toast({
      title: isNew ? "Licence créée" : "Licence mise à jour",
      description: `ID: ${updatedLicense.ID}, Client: ${updatedLicense.IdClient}`
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: "Le texte a été copié dans le presse-papier."
    });
  };

  if (!editedLicense) {
    return (
      <Card className="p-6">
        <p>Sélectionnez une licence pour l'éditer ou cliquez sur "Nouvelle licence".</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">
        {isNew ? "Nouvelle licence NuxiSav" : `Modifier la licence NuxiSav #${editedLicense.ID}`}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="IdClient">ID Client</Label>
            <Input
              id="IdClient"
              name="IdClient"
              value={editedLicense.IdClient || ''}
              onChange={handleInputChange}
              placeholder="ID Client"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="IdentifiantWeb">Identifiant Web</Label>
            <Input
              id="IdentifiantWeb"
              name="IdentifiantWeb"
              value={editedLicense.IdentifiantWeb || ''}
              onChange={handleInputChange}
              placeholder="Identifiant Web"
            />
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="SerialPermanente">Serial Permanente</Label>
              <div className="flex">
                <Input
                  id="SerialPermanente"
                  name="SerialPermanente"
                  value={editedLicense.SerialPermanente || ''}
                  onChange={handleInputChange}
                  placeholder="Serial Permanente"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(editedLicense.SerialPermanente || '')}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="w-32">
              <Label htmlFor="NbrPermanente">Nombre</Label>
              <Input
                id="NbrPermanente"
                name="NbrPermanente"
                type="number"
                min="0"
                value={editedLicense.NbrPermanente || 0}
                onChange={handleNbrPermanenteChange}
                placeholder="Nombre"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="Version">Version</Label>
            <Input
              id="Version"
              name="Version"
              value={editedLicense.Version || ''}
              onChange={handleInputChange}
              placeholder="Version"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <Label className="block mb-2">Options</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {availableOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`option-${option.value}`}
                  checked={options[option.value] || false}
                  onCheckedChange={(checked) => handleOptionChange(option.value, checked as boolean)} 
                />
                <Label htmlFor={`option-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4 flex items-center space-x-2">
          <Checkbox 
            id="suspendu"
            name="Suspendu"
            checked={editedLicense.Suspendu === 1}
            onCheckedChange={(checked) => {
              setEditedLicense({
                ...editedLicense,
                Suspendu: checked ? 1 : 0
              });
            }} 
          />
          <Label htmlFor="suspendu">Licence suspendue</Label>
        </div>
        
        <h3 className="text-md font-semibold mb-2 mt-6">Postes ({editedLicense.Postes.length})</h3>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Empreinte PC</TableHead>
              <TableHead>Nom Poste</TableHead>
              <TableHead>Nom Session</TableHead>
              <TableHead>Dernière Utilisation</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Connecté</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editedLicense.Postes.map((poste) => (
              <TableRow key={poste.ID} className="h-8">
                <TableCell>{poste.ID}</TableCell>
                <TableCell>{poste.Serial || '-'}</TableCell>
                <TableCell>{poste.Emprunte_PC || '-'}</TableCell>
                <TableCell>{poste.Nom_Poste || '-'}</TableCell>
                <TableCell>{poste.Nom_Session || '-'}</TableCell>
                <TableCell>{formatDateFr(poste.Der_Utilisation)}</TableCell>
                <TableCell>{poste.Version || '-'}</TableCell>
                <TableCell>
                  {poste.Connecte === 1 ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      Oui
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300">
                      Non
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {poste.Emprunte_PC && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleReleasePost(poste)}
                    >
                      Libérer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {editedLicense.Postes.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Aucun poste associé à cette licence.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => setEditedLicense(license)}>
            Annuler
          </Button>
          <Button type="submit">
            {isNew ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}