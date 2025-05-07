import { useState } from "react";
import LicenseNavigation from "@/components/LicenseNavigation";
import { useStudioLicenseData } from "@/hooks/useStudioLicenseData";
import StudioFilterPanel from "@/components/StudioFilterPanel";
import StudioLicenseTable from "@/components/StudioLicenseTable";
import StudioLicenseForm from "@/components/StudioLicenseForm";
import { useToast } from "@/hooks/use-toast";
import { StudioLicense } from "@/types/license";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { PlusIcon } from "lucide-react";

export default function StudioLicenses() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    numClient: "",
    serial: "",
    identifiantUser: "",
    onlyWithPDF: false,
    onlyWithVue: false,
    onlyWithPagePerso: false,
    onlyWithWDE: false,
    hideSuspended: false
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: "ID",
    direction: "desc" as "asc" | "desc"
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [selectedLicense, setSelectedLicense] = useState<StudioLicense | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { 
    data: licenses, 
    isLoading, 
    error,
    refetch,
    createLicense,
    updateLicense 
  } = useStudioLicenseData(filters, sortConfig, currentPage, pageSize);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleSelectLicense = (license: StudioLicense) => {
    setSelectedLicense(license);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    // Créer une nouvelle licence vide
    const emptyLicense: StudioLicense = {
      ID: 0,
      NumClient: 0,
      Serial: null,
      IdentifiantUser: null,
      PDF: 0,
      Vue: 0,
      PagePerso: 0,
      WDE: 0,
      Suspendu: 0
    };
    
    setSelectedLicense(emptyLicense);
    setIsCreatingNew(true);
  };

  const handleSaveLicense = async (license: StudioLicense) => {
    try {
      if (isCreatingNew) {
        await createLicense(license);
        toast({
          title: "Licence créée avec succès",
          description: `La licence studio pour le client #${license.NumClient} a été créée.`,
          variant: "default",
        });
      } else {
        await updateLicense(license);
        toast({
          title: "Licence mise à jour avec succès",
          description: `Les modifications de la licence #${license.ID} ont été enregistrées.`,
          variant: "default",
        });
      }
      
      // Réinitialiser l'état
      setSelectedLicense(null);
      setIsCreatingNew(false);
      
      // Rafraîchir les données
      refetch();
    } catch (error) {
      console.error('Error saving license:', error);
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <LicenseNavigation currentType="studio" />
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Erreur de chargement des données</h2>
          <p>{(error as Error).message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <LicenseNavigation currentType="studio" />
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-purple-800 mb-2">Licences Studio</h2>
        <p className="text-sm text-purple-700">
          Cette section permet de gérer les licences Studio et leurs modules associés (PDF, Vue, Page Perso, WDE).
        </p>
      </div>
      
      {selectedLicense ? (
        <StudioLicenseForm 
          license={selectedLicense} 
          onSave={handleSaveLicense} 
          isNew={isCreatingNew} 
        />
      ) : null}
      
      <StudioFilterPanel filters={filters} onFilterChange={handleFilterChange} />
      
      <div className="flex justify-end mb-4">
        <NuxiButton 
          variant="primary" 
          size="default"
          onClick={handleCreateNew}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Nouvelle licence
        </NuxiButton>
      </div>
      
      <StudioLicenseTable 
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
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Précédent
        </NuxiButton>
        
        <span className="text-sm font-medium">
          Page {currentPage}
        </span>
        
        <NuxiButton 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={!licenses || licenses.length < pageSize}
        >
          Suivant
        </NuxiButton>
      </div>
    </div>
  );
}