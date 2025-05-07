import { useState } from "react";
import LicenseNavigation from "@/components/LicenseNavigation";
import { useApiKeyLicenseData } from "@/hooks/useApiKeyLicenseData";
import ApiKeyFilterPanel from "@/components/ApiKeyFilterPanel";
import ApiKeyLicenseTable from "@/components/ApiKeyLicenseTable";
import ApiKeyLicenseForm from "@/components/ApiKeyLicenseForm";
import { useToast } from "@/hooks/use-toast";
import { ApiKeyLicense } from "@/types/license";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { PlusIcon } from "lucide-react";
import { generateSerial } from "@/lib/licenseUtils";

export default function ApiKeyLicenses() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    clientId: "",
    apiKey: "",
    showExpired: false,
    showInactive: false
  });
  
  const [sortConfig, setSortConfig] = useState({
    key: "ID",
    direction: "desc" as "asc" | "desc"
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  
  const [selectedLicense, setSelectedLicense] = useState<ApiKeyLicense | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { 
    data: licenses, 
    isLoading, 
    error,
    refetch,
    createLicense,
    updateLicense 
  } = useApiKeyLicenseData(filters, sortConfig, currentPage, pageSize);

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

  const handleSelectLicense = (license: ApiKeyLicense) => {
    setSelectedLicense(license);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    // Créer une nouvelle licence API Key avec une clé générée automatiquement
    const apiKey = generateSerial() + "-" + generateSerial() + "-" + generateSerial();
    const apiKeyV5 = generateSerial() + "-" + generateSerial() + "-" + generateSerial() + "-" + generateSerial();
    const serial = generateSerial();
    const currentDate = new Date().toISOString();
    
    const emptyLicense: ApiKeyLicense = {
      ID: 0,
      ClientID: 0,
      Serial: serial,
      ApiKey: apiKey,
      ApiKeyV5: apiKeyV5,
      Quantity: 1000, // Valeur par défaut, typiquement un crédit de 1000 appels
      LastUsed: currentDate,
      Restriction: ""
    };
    
    setSelectedLicense(emptyLicense);
    setIsCreatingNew(true);
  };

  const handleSaveLicense = async (license: ApiKeyLicense) => {
    try {
      if (isCreatingNew) {
        await createLicense(license);
        toast({
          title: "Clé API créée avec succès",
          description: `La clé API pour le client #${license.ClientID} a été créée.`,
          variant: "default",
        });
      } else {
        await updateLicense(license);
        toast({
          title: "Clé API mise à jour avec succès",
          description: `Les modifications de la clé API #${license.ID} ont été enregistrées.`,
          variant: "default",
        });
      }
      
      // Réinitialiser l'état
      setSelectedLicense(null);
      setIsCreatingNew(false);
      
      // Rafraîchir les données
      refetch();
    } catch (error) {
      console.error('Error saving API key license:', error);
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
        <LicenseNavigation currentType="apikey" />
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Erreur de chargement des données</h2>
          <p>{(error as Error).message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <LicenseNavigation currentType="apikey" />
      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-cyan-800 mb-2">Licences API Key</h2>
        <p className="text-sm text-cyan-700">
          Cette section permet de gérer les clés API pour l'accès programmatique aux services Nuxi.
        </p>
      </div>
      
      <ApiKeyFilterPanel filters={filters} onFilterChange={handleFilterChange} />
      
      <ApiKeyLicenseTable 
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
        <h2 className="text-lg font-semibold text-slate-900">Détails de la clé API</h2>
        <NuxiButton 
          onClick={handleCreateNew}
          variant="secondary"
          className="inline-flex items-center"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Ajouter une clé API
        </NuxiButton>
      </div>
      
      {selectedLicense && (
        <ApiKeyLicenseForm 
          license={selectedLicense} 
          onSave={handleSaveLicense} 
          isNew={isCreatingNew} 
        />
      )}
    </div>
  );
}