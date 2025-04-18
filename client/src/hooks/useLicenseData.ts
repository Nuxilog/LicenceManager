import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { License, LicenseFilters, SortConfig } from "@/types/license";
import { apiRequest } from "@/lib/queryClient";

export function useLicenseData(filters: LicenseFilters, sortConfig: SortConfig, page: number = 1, pageSize: number = 10) {
  const queryClient = useQueryClient();
  const queryKey = ['/api/licenses', filters, sortConfig, page, pageSize];

  // Fetch licenses
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Convert filters and sort to query params
      const queryParams = new URLSearchParams();
      if (filters.idClient) queryParams.append('idClient', filters.idClient);
      if (filters.idSynchro) queryParams.append('idSynchro', filters.idSynchro);
      if (filters.serial) queryParams.append('serial', filters.serial);
      if (filters.identifiantPC) queryParams.append('identifiantPC', filters.identifiantPC);
      if (filters.onlyNuxiDev) queryParams.append('onlyNuxiDev', 'true');
      
      queryParams.append('sortBy', sortConfig.key);
      queryParams.append('sortDirection', sortConfig.direction);
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pageSize.toString());
      
      return fetch(`/api/licenses?${queryParams.toString()}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error('Failed to fetch licenses');
        return res.json();
      });
    }
  });

  // Create a new license
  const createLicenseMutation = useMutation({
    mutationFn: async (newLicense: License) => {
      const res = await apiRequest('POST', '/api/licenses', newLicense);
      return res.json();
    },
    onSuccess: () => {
      // Invalider toutes les requêtes qui commencent par /api/licenses (pour rafraîchir toutes les vues)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as unknown[];
          return Array.isArray(queryKey) && 
                 queryKey.length > 0 && 
                 queryKey[0] === '/api/licenses';
        }
      });
    }
  });

  // Update an existing license
  const updateLicenseMutation = useMutation({
    mutationFn: async (updatedLicense: License) => {
      const res = await apiRequest('PUT', `/api/licenses/${updatedLicense.ID}`, updatedLicense);
      return res.json();
    },
    onSuccess: () => {
      // Invalider toutes les requêtes qui commencent par /api/licenses (pour rafraîchir toutes les vues)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as unknown[];
          return Array.isArray(queryKey) && 
                 queryKey.length > 0 && 
                 queryKey[0] === '/api/licenses';
        }
      });
    }
  });

  // Check if an ID de Synchro already exists
  const checkIdSynchroUniqueness = async (idSynchro: string, excludeLicenseId?: number) => {
    if (!idSynchro) return { exists: false, licenses: [] };
    
    const queryParams = new URLSearchParams();
    if (excludeLicenseId) queryParams.append('excludeLicenseId', excludeLicenseId.toString());
    
    const url = `/api/licenses/check-id-synchro/${idSynchro}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await fetch(url, {
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error('Failed to check ID Synchro uniqueness');
    }
    
    return res.json();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    createLicense: createLicenseMutation.mutateAsync,
    updateLicense: updateLicenseMutation.mutateAsync,
    isCreating: createLicenseMutation.isPending,
    isUpdating: updateLicenseMutation.isPending,
    checkIdSynchroUniqueness
  };
}
