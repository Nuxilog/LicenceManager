import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ApiKeyLicense, ApiKeyLicenseFilters, SortConfig } from "@/types/license";

// Fonction pour simuler des données de licences API Key pendant le développement
const mockApiKeyLicenses: ApiKeyLicense[] = [
  {
    ID: 1,
    ClientID: 1001,
    ApiKey: "B24G-9FCD-5F9F-ECE2-HHD2-ABC1-DEF2-GHI3",
    Description: "API pour l'intégration avec le système CRM",
    CreatedAt: new Date(2023, 5, 15).toISOString(),
    ExpiresAt: new Date(2024, 5, 15).toISOString(),
    IsActive: 1
  },
  {
    ID: 2,
    ClientID: 1002,
    ApiKey: "X7YZ-1ABC-2DEF-3GHI-4JKL-5MNO-6PQR-7STU",
    Description: "API pour le service de facturation",
    CreatedAt: new Date(2023, 3, 10).toISOString(),
    ExpiresAt: null,
    IsActive: 1
  },
  {
    ID: 3,
    ClientID: 1003,
    ApiKey: "AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH",
    Description: "Accès en lecture seule aux données clients",
    CreatedAt: new Date(2022, 11, 5).toISOString(),
    ExpiresAt: new Date(2023, 11, 5).toISOString(), // Date expirée
    IsActive: 0
  }
];

// Cette fonction simule l'application des filtres aux données mockées
function applyFilters(data: ApiKeyLicense[], filters: ApiKeyLicenseFilters): ApiKeyLicense[] {
  return data.filter(license => {
    // Filtrage par Client ID
    if (filters.clientId && !license.ClientID.toString().includes(filters.clientId)) {
      return false;
    }
    
    // Filtrage par API Key
    if (filters.apiKey && !license.ApiKey.toLowerCase().includes(filters.apiKey.toLowerCase())) {
      return false;
    }
    
    // Ne pas afficher les licences expirées si showExpired est false
    if (!filters.showExpired && license.ExpiresAt && new Date(license.ExpiresAt) < new Date()) {
      return false;
    }
    
    // Ne pas afficher les licences inactives si showInactive est false
    if (!filters.showInactive && !license.IsActive) {
      return false;
    }
    
    return true;
  });
}

// Cette fonction simule le tri des données
function applySorting(data: ApiKeyLicense[], sortConfig: SortConfig): ApiKeyLicense[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof ApiKeyLicense];
    const bValue = b[sortConfig.key as keyof ApiKeyLicense];
    
    // Gestion de null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    
    // Pour les dates, convertir en objets Date
    if (typeof aValue === 'string' && (sortConfig.key === 'CreatedAt' || sortConfig.key === 'ExpiresAt')) {
      const dateA = aValue ? new Date(aValue).getTime() : 0;
      const dateB = bValue as string ? new Date(bValue as string).getTime() : 0;
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    // Pour les autres types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    } else {
      // Pour les nombres et autres types
      return sortConfig.direction === 'asc'
        ? (aValue as any) > (bValue as any) ? 1 : -1
        : (bValue as any) > (aValue as any) ? 1 : -1;
    }
  });
}

// Cette fonction simule la pagination
function applyPagination(data: ApiKeyLicense[], page: number, pageSize: number): ApiKeyLicense[] {
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

export function useApiKeyLicenseData(filters: ApiKeyLicenseFilters, sortConfig: SortConfig, page: number = 1, pageSize: number = 15) {
  const [error, setError] = useState<Error | null>(null);

  // Simulation de la requête API (à remplacer par une vraie requête API quand l'API sera prête)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/apikey-licenses', filters, sortConfig, page, pageSize],
    queryFn: async () => {
      try {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Application des filtres, tri et pagination aux données mockées
        let filteredData = applyFilters(mockApiKeyLicenses, filters);
        let sortedData = applySorting(filteredData, sortConfig);
        let paginatedData = applyPagination(sortedData, page, pageSize);
        
        return paginatedData;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    }
  });

  // Mutation pour créer une nouvelle licence (simulée)
  const { mutateAsync: createLicense } = useMutation({
    mutationFn: async (newLicense: ApiKeyLicense) => {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dans une vraie API, nous enverrions une requête POST avec newLicense
      console.log('Creating new API key license:', newLicense);
      
      // Simuler un succès
      return { ...newLicense, ID: Math.floor(Math.random() * 1000) + 100 };
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['/api/apikey-licenses'] });
    }
  });

  // Mutation pour mettre à jour une licence existante (simulée)
  const { mutateAsync: updateLicense } = useMutation({
    mutationFn: async (updatedLicense: ApiKeyLicense) => {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dans une vraie API, nous enverrions une requête PUT avec updatedLicense
      console.log('Updating API key license:', updatedLicense);
      
      // Simuler un succès
      return updatedLicense;
    },
    onSuccess: () => {
      // Invalider le cache pour recharger les données
      queryClient.invalidateQueries({ queryKey: ['/api/apikey-licenses'] });
    }
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    createLicense,
    updateLicense
  };
}