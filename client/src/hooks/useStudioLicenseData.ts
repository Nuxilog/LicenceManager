import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudioLicense, StudioLicenseFilters, SortConfig } from "@/types/license";
import { apiRequest } from "@/lib/queryClient";

export function useStudioLicenseData(filters: StudioLicenseFilters, sortConfig: SortConfig, page: number = 1, pageSize: number = 10) {
  const queryClient = useQueryClient();
  const queryKey = ['/api/studio-licenses', filters, sortConfig, page, pageSize];

  // Fetch studio licenses
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      // Convert filters and sort to query params
      const queryParams = new URLSearchParams();
      if (filters.numClient) queryParams.append('numClient', filters.numClient);
      if (filters.serial) queryParams.append('serial', filters.serial);
      if (filters.identifiantUser) queryParams.append('identifiantUser', filters.identifiantUser);
      if (filters.onlyWithPDF) queryParams.append('onlyWithPDF', 'true');
      if (filters.onlyWithVue) queryParams.append('onlyWithVue', 'true');
      if (filters.onlyWithPagePerso) queryParams.append('onlyWithPagePerso', 'true');
      if (filters.onlyWithWDE) queryParams.append('onlyWithWDE', 'true');
      if (filters.hideSuspended) queryParams.append('hideSuspended', 'true');
      
      queryParams.append('sortBy', sortConfig.key);
      queryParams.append('sortDirection', sortConfig.direction);
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pageSize.toString());
      
      return fetch(`/api/studio-licenses?${queryParams.toString()}`, {
        credentials: 'include'
      }).then(res => {
        if (!res.ok) throw new Error('Failed to fetch studio licenses');
        return res.json();
      });
    }
  });

  // Create a new studio license
  const createLicenseMutation = useMutation({
    mutationFn: async (newLicense: StudioLicense) => {
      const res = await apiRequest('POST', '/api/studio-licenses', newLicense);
      return res.json();
    },
    onSuccess: () => {
      // Invalider toutes les requêtes qui commencent par /api/studio-licenses (pour rafraîchir toutes les vues)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as unknown[];
          return Array.isArray(queryKey) && 
                 queryKey.length > 0 && 
                 queryKey[0] === '/api/studio-licenses';
        }
      });
    }
  });

  // Update an existing studio license
  const updateLicenseMutation = useMutation({
    mutationFn: async (updatedLicense: StudioLicense) => {
      const res = await apiRequest('PUT', `/api/studio-licenses/${updatedLicense.ID}`, updatedLicense);
      return res.json();
    },
    onSuccess: () => {
      // Invalider toutes les requêtes qui commencent par /api/studio-licenses (pour rafraîchir toutes les vues)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey as unknown[];
          return Array.isArray(queryKey) && 
                 queryKey.length > 0 && 
                 queryKey[0] === '/api/studio-licenses';
        }
      });
    }
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    createLicense: createLicenseMutation.mutateAsync,
    updateLicense: updateLicenseMutation.mutateAsync,
    isCreating: createLicenseMutation.isPending,
    isUpdating: updateLicenseMutation.isPending
  };
}