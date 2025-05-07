import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApiKeyLicense, SortConfig } from "@/types/license";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ApiKeyLicenseTableProps {
  licenses: ApiKeyLicense[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onSelectLicense: (license: ApiKeyLicense) => void;
  selectedLicenseId?: number;
}

export default function ApiKeyLicenseTable({
  licenses,
  isLoading,
  sortConfig,
  onSort,
  onSelectLicense,
  selectedLicenseId
}: ApiKeyLicenseTableProps) {
  // Format dates from ISO to readable format
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy à HH:mm", { locale: fr });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Verify if an API key has a restriction
  const hasRestriction = (restriction: string): boolean => {
    return restriction.trim().length > 0;
  };

  // Render the status of the API key based on Quantity and Restriction
  const renderApiKeyStatus = (quantity: number, restriction: string): JSX.Element => {
    if (hasRestriction(restriction)) {
      // Si la restriction contient "stop" ou "impay", c'est probablement une clé suspendue
      if (restriction.toLowerCase().includes('stop') || restriction.toLowerCase().includes('impay')) {
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Suspendue</Badge>;
      }
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Restreinte</Badge>;
    }
    
    if (quantity < 0) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Épuisée</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Liste des licences API Key</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer w-[80px]"
                onClick={() => onSort("ID")}
              >
                <div className="flex items-center">
                  ID
                  {sortConfig.key === "ID" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => onSort("ClientID")}
              >
                <div className="flex items-center">
                  Client ID
                  {sortConfig.key === "ClientID" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => onSort("Serial")}
              >
                <div className="flex items-center">
                  Serial
                  {sortConfig.key === "Serial" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Clé API</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => onSort("Quantity")}
              >
                <div className="flex items-center">
                  Quantité
                  {sortConfig.key === "Quantity" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => onSort("LastUsed")}
              >
                <div className="flex items-center">
                  Dernière utilisation
                  {sortConfig.key === "LastUsed" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}
            
            {!isLoading && licenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Aucune licence API Key trouvée
                </TableCell>
              </TableRow>
            )}
            
            {!isLoading && licenses.map((license) => (
              <TableRow 
                key={license.ID} 
                className={`${selectedLicenseId === license.ID ? "bg-blue-50" : ""} hover:bg-gray-50 cursor-pointer`}
                onClick={() => onSelectLicense(license)}
              >
                <TableCell className="font-medium py-2">{license.ID}</TableCell>
                <TableCell className="py-2">{license.ClientID}</TableCell>
                <TableCell className="py-2">
                  <div className="font-mono text-sm">
                    {license.Serial}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="font-mono text-sm max-w-[200px] truncate">
                    {license.ApiKey}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  {license.Quantity.toLocaleString('fr-FR')}
                </TableCell>
                <TableCell className="py-2">{formatDate(license.LastUsed)}</TableCell>
                <TableCell className="py-2">{renderApiKeyStatus(license.Quantity, license.Restriction)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}