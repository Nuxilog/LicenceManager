import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NuxiSavLicense, NuxiSavLicenseFilters, SortConfig } from "@/types/license";

// Fonction pour filtrer les licences
function applyFilters(data: NuxiSavLicense[], filters: NuxiSavLicenseFilters): NuxiSavLicense[] {
  if (!data) return [];
  
  return data.filter(license => {
    // Filtrer par ID Client
    if (filters.idClient && !String(license.IdClient).includes(filters.idClient)) {
      return false;
    }
    
    // Filtrer par Identifiant Web
    if (filters.identifiantWeb && license.IdentifiantWeb && 
        !license.IdentifiantWeb.toLowerCase().includes(filters.identifiantWeb.toLowerCase())) {
      return false;
    }
    
    // Filtrer par Serial
    if (filters.serial && license.SerialPermanente && 
        !license.SerialPermanente.toLowerCase().includes(filters.serial.toLowerCase())) {
      return false;
    }
    
    // Filtrer par Options
    const options = license.Options ? license.Options.split(',').map(o => o.trim()) : [];
    
    if (filters.onlyWithAtel && !options.includes('Atel')) {
      return false;
    }
    
    if (filters.onlyWithTrck && !options.includes('Trck')) {
      return false;
    }
    
    if (filters.onlyWithTckWeb && !options.includes('TckWeb')) {
      return false;
    }
    
    if (filters.onlyWithAud && !options.includes('Aud')) {
      return false;
    }
    
    if (filters.onlyWithSdk && !options.includes('sdk')) {
      return false;
    }
    
    // Masquer les licences suspendues si demandé
    if (filters.hideSuspended && license.Suspendu === 1) {
      return false;
    }
    
    return true;
  });
}

// Fonction pour trier les licences
function applySorting(data: NuxiSavLicense[], sortConfig: SortConfig): NuxiSavLicense[] {
  if (!data) return [];
  
  return [...data].sort((a, b) => {
    let aValue: any = a[sortConfig.key as keyof NuxiSavLicense];
    let bValue: any = b[sortConfig.key as keyof NuxiSavLicense];
    
    // Pour les valeurs null ou undefined, traiter comme des chaînes vides pour le tri
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Comparer selon le type de données
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // Pour les nombres ou autres types
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}

// Fonction pour paginer les résultats
function applyPagination(data: NuxiSavLicense[], page: number, pageSize: number): NuxiSavLicense[] {
  if (!data) return [];
  
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

export function useNuxiSavLicenseData(filters: NuxiSavLicenseFilters, sortConfig: SortConfig, page: number = 1, pageSize: number = 15) {
  const queryClient = useQueryClient();
  
  // Requête pour récupérer toutes les licences
  const { data: licenses, isLoading, error } = useQuery({
    queryKey: ['/api/nuxisav-licenses', filters, sortConfig, page, pageSize],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      // Ajouter les filtres aux paramètres de recherche
      if (filters.idClient) searchParams.append('idClient', filters.idClient);
      if (filters.identifiantWeb) searchParams.append('identifiantWeb', filters.identifiantWeb);
      if (filters.serial) searchParams.append('serial', filters.serial);
      if (filters.onlyWithAtel) searchParams.append('onlyWithAtel', 'true');
      if (filters.onlyWithTrck) searchParams.append('onlyWithTrck', 'true');
      if (filters.onlyWithTckWeb) searchParams.append('onlyWithTckWeb', 'true');
      if (filters.onlyWithAud) searchParams.append('onlyWithAud', 'true');
      if (filters.onlyWithSdk) searchParams.append('onlyWithSdk', 'true');
      if (filters.hideSuspended) searchParams.append('hideSuspended', 'true');
      
      // Ajouter les informations de tri et pagination
      searchParams.append('sortKey', sortConfig.key);
      searchParams.append('sortDirection', sortConfig.direction);
      searchParams.append('page', page.toString());
      searchParams.append('pageSize', pageSize.toString());
      
      const response = await fetch(`/api/nuxisav-licenses?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des licences');
      }
      return response.json();
    }
  });
  
  // Mutation pour créer une nouvelle licence
  const createMutation = useMutation({
    mutationFn: async (newLicense: NuxiSavLicense) => {
      const response = await fetch('/api/nuxisav-licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLicense)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création de la licence');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalider la requête existante pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['/api/nuxisav-licenses'] });
    }
  });
  
  // Mutation pour mettre à jour une licence existante
  const updateMutation = useMutation({
    mutationFn: async (updatedLicense: NuxiSavLicense) => {
      const response = await fetch(`/api/nuxisav-licenses/${updatedLicense.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedLicense)
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la licence');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalider la requête existante pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['/api/nuxisav-licenses'] });
    }
  });
  
  // Calcul de la pagination
  const totalLicenses = licenses?.length || 0;
  const totalPages = Math.ceil(totalLicenses / pageSize);
  const paginatedLicenses = applyPagination(licenses || [], page, pageSize);
  
  return {
    licenses: paginatedLicenses,
    isLoading,
    error,
    createLicense: createMutation.mutate,
    updateLicense: updateMutation.mutate,
    createError: createMutation.error,
    updateError: updateMutation.error,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    pagination: {
      currentPage: page,
      totalPages,
      totalLicenses
    }
  };
}