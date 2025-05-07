import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import LicenseNavigation from "@/components/LicenseNavigation";
import NuxiSavFilterPanel from "@/components/NuxiSavFilterPanel";
import NuxiSavLicenseTable from "@/components/NuxiSavLicenseTable";
import NuxiSavLicenseForm from "@/components/NuxiSavLicenseForm";
import { useNuxiSavLicenseData } from "@/hooks/useNuxiSavLicenseData";
import { NuxiSavLicense, NuxiSavLicenseFilters, SortConfig } from "@/types/license";
import { PlusCircle } from "lucide-react";

export default function NuxiSavLicenses() {
  // État pour les filtres
  const [filters, setFilters] = useState<NuxiSavLicenseFilters>({
    idClient: "",
    identifiantWeb: "",
    serial: "",
    onlyWithAtel: false,
    onlyWithTrck: false,
    onlyWithTckWeb: false,
    onlyWithAud: false,
    onlyWithSdk: false,
    hideSuspended: false
  });

  // État pour le tri
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "ID",
    direction: "desc"
  });

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // État pour la licence sélectionnée
  const [selectedLicense, setSelectedLicense] = useState<NuxiSavLicense | null>(null);
  
  // État pour indiquer si on est en train de créer une nouvelle licence
  const [isNewLicense, setIsNewLicense] = useState<boolean>(false);

  // Récupération des données avec le hook personnalisé
  const {
    licenses,
    isLoading,
    createLicense,
    updateLicense,
    pagination
  } = useNuxiSavLicenseData(filters, sortConfig, currentPage, pageSize);

  // Fonction pour gérer le changement de tri
  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Fonction pour gérer la sélection d'une licence
  const handleSelectLicense = (license: NuxiSavLicense) => {
    setSelectedLicense(license);
    setIsNewLicense(false);
  };

  // Fonction pour créer une nouvelle licence
  const handleNewLicense = () => {
    const emptyLicense: NuxiSavLicense = {
      ID: -1,
      IdClient: 0,
      NomSoft: "NuxiSav",
      IdentifiantWeb: "",
      SerialPermanente: "",
      SerialFlotante: "",
      Options: "",
      Suspendu: 0,
      IDSynchro: "",
      Der_Utilisation: null,
      Version: "",
      DateLimite: null,
      NbrPermanente: 1,
      NbrFlotante: 0,
      NbrSession: 0,
      Info: "",
      Postes: []
    };
    
    setSelectedLicense(emptyLicense);
    setIsNewLicense(true);
  };

  // Fonction pour enregistrer une licence (création ou mise à jour)
  const handleSaveLicense = (license: NuxiSavLicense) => {
    if (isNewLicense) {
      createLicense(license);
    } else {
      updateLicense(license);
    }
    
    // Réinitialiser après enregistrement
    setSelectedLicense(null);
    setIsNewLicense(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <LicenseNavigation currentType="nuxisav" />
      
      {/* Titre */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Gestion des licences NuxiSAV</h1>
      </div>
      
      {/* Panneau de filtres */}
      <NuxiSavFilterPanel 
        filters={filters} 
        onFilterChange={setFilters} 
      />
      
      {/* Tableau des licences */}
      <div className="mb-4">
        <NuxiSavLicenseTable 
          licenses={licenses || []} 
          isLoading={isLoading}
          sortConfig={sortConfig}
          onSort={handleSort}
          onSelectLicense={handleSelectLicense}
          selectedLicenseId={selectedLicense?.ID}
        />
        
        {/* Pagination */}
        <div className="flex justify-center items-center my-4 space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Précédent
          </Button>
          
          <span className="text-sm text-slate-600">
            Page {currentPage}
          </span>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!licenses || licenses.length < pageSize || isLoading}
          >
            Suivant
          </Button>
        </div>
      </div>
      
      {/* Titre et bouton nouvelle licence */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Détails de la licence</h2>
        <Button 
          onClick={handleNewLicense}
          variant="outline"
          className="inline-flex items-center"
        >
          <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
          Nouvelle licence
        </Button>
      </div>
      
      {/* Formulaire d'édition de licence */}
      <NuxiSavLicenseForm 
        license={selectedLicense} 
        onSave={handleSaveLicense}
        isNew={isNewLicense}
      />
    </div>
  );
}