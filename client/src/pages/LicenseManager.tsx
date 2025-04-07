import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLicenseData } from "@/hooks/useLicenseData";
import { License } from "@/types/license";
import FilterPanel from "@/components/FilterPanel";
import LicenseTable from "@/components/LicenseTable";
import LicenseForm from "@/components/LicenseForm";
import { Button } from "@/components/ui/button";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { PlusIcon } from "lucide-react";
import { generateSerial, generateFTPPassword } from "@/lib/licenseUtils";

export default function LicenseManager() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    idClient: "",
    idSynchro: "",
    serial: "",
    identifiantPC: "",
    onlyNuxiDev: true
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: "ID",
    direction: "desc" as "asc" | "desc"
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { 
    data: licenses, 
    isLoading, 
    error,
    refetch,
    createLicense,
    updateLicense 
  } = useLicenseData(filters, sortConfig, currentPage, pageSize);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // Réinitialiser à la première page lors du changement de filtres
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
    // Réinitialiser à la première page lors du changement de tri
    setCurrentPage(1);
  };

  const handleSelectLicense = (license: License) => {
    setSelectedLicense(license);
    setIsCreatingNew(false);
  };

  const handleAddNewLicense = () => {
    const emptyLicense: License = {
      ID: 0,
      IDClient: "",
      IdentifiantPC: "",
      Options: "",
      Serial: generateSerial(),
      Suspendu: 0,
      NomSoft: "NuxiDev",
      NomPoste: "",
      NomSession: "",
      Date_DerUtilisation: null,
      Version: "",
      Data1: "nuxidev.ovh",
      Data2: "",
      FTP1_Hote: "ftp://ftp.cluster030.hosting.ovh.net",
      FTP2_Hote: "",
      FTP1_Identifiant: "",
      FTP2_Identifiant: "",
      FTP1_Mdp: generateFTPPassword(),
      FTP2_Mdp: "",
      Data_Actif: null,
      FTP_Actif: null,
      URL1: "https://nuxidev.ovh/NuxiDev/nuxidev.ovh/",
      URL2: "",
      IDSynchro: "",
      NbRun: null,
      Date_LimiteUtil: null,
      Terminaux: "",
      Tablettes: "",
      MrqBlancheNum: null,
      Upload1: "",
      Upload2: "",
      Secu2Srv1: "",
      Info: "",
      ConfigConnecteur: "",
      Premium: 0,
      MDP_Premium: "",
      Autorisations_Premium: "",
      ConfigMobile: "",
      DateClient: null,
      Partenaire: null
    };
    
    setSelectedLicense(emptyLicense);
    setIsCreatingNew(true);
  };

  const handleSaveLicense = async (license: License) => {
    try {
      if (isCreatingNew) {
        await createLicense(license);
        toast({
          title: "Succès",
          description: "Licence créée avec succès",
        });
      } else {
        await updateLicense(license);
        toast({
          title: "Succès",
          description: "Licence mise à jour avec succès",
        });
      }
      
      setIsCreatingNew(false);
      refetch();
    } catch (error) {
      console.error("Error saving license:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-red-500 mb-2">Erreur de chargement des données</h2>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <>
      <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      
      <LicenseTable 
        licenses={licenses || []} 
        isLoading={isLoading}
        sortConfig={sortConfig}
        onSort={handleSort}
        onSelectLicense={handleSelectLicense}
        selectedLicenseId={selectedLicense?.ID}
      />
      
      {/* Pagination */}
      <div className="flex justify-center items-center my-4 space-x-2">
        <NuxiButton 
          variant="primary" 
          size="sm" 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
        >
          Précédent
        </NuxiButton>
        <span className="text-sm text-slate-600">
          Page {currentPage}
        </span>
        <NuxiButton 
          variant="primary" 
          size="sm" 
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={!licenses || licenses.length < pageSize || isLoading}
        >
          Suivant
        </NuxiButton>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Détails de la licence</h2>
        <NuxiButton 
          onClick={handleAddNewLicense}
          variant="secondary"
          className="inline-flex items-center"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Ajouter une licence
        </NuxiButton>
      </div>
      
      <LicenseForm 
        license={selectedLicense} 
        onSave={handleSaveLicense} 
        isNew={isCreatingNew}
      />
    </>
  );
}
