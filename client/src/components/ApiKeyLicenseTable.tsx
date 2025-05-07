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

  // Check if a key is expired
  const isExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    try {
      return new Date(expiryDate) < new Date();
    } catch (error) {
      return false;
    }
  };

  // Render the expiry status of the API key
  const renderExpiryStatus = (expiryDate: string | null): JSX.Element => {
    if (!expiryDate) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Sans expiration</Badge>;
    }
    
    if (isExpired(expiryDate)) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Expirée</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Valide</Badge>;
  };

  // Render the active status of the API key
  const renderActiveStatus = (isActive: number): JSX.Element => {
    return isActive ? 
      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge> :
      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>;
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
              <TableHead>Clé API</TableHead>
              <TableHead>Description</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => onSort("CreatedAt")}
              >
                <div className="flex items-center">
                  Date de création
                  {sortConfig.key === "CreatedAt" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => onSort("ExpiresAt")}
              >
                <div className="flex items-center">
                  Expiration
                  {sortConfig.key === "ExpiresAt" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => onSort("IsActive")}
              >
                <div className="flex items-center">
                  Statut
                  {sortConfig.key === "IsActive" && (
                    <ArrowUpDown className={`ml-1 h-4 w-4 ${sortConfig.direction === "asc" ? "transform rotate-180" : ""}`} />
                  )}
                </div>
              </TableHead>
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
                  <div className="font-mono text-sm max-w-[200px] truncate">
                    {license.ApiKey}
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  {license.Description || "N/A"}
                </TableCell>
                <TableCell className="py-2">{formatDate(license.CreatedAt)}</TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center space-x-2">
                    <span>{license.ExpiresAt ? formatDate(license.ExpiresAt) : "Sans expiration"}</span>
                    {renderExpiryStatus(license.ExpiresAt)}
                  </div>
                </TableCell>
                <TableCell className="py-2">{renderActiveStatus(license.IsActive)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}