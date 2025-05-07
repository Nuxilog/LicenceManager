import { License } from "@/types/license";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CONFIG_OPTIONS } from "@/lib/constants";

interface LicenseTableProps {
  licenses: License[];
  isLoading: boolean;
  sortConfig: {
    key: string;
    direction: "asc" | "desc";
  };
  onSort: (key: string) => void;
  onSelectLicense: (license: License) => void;
  selectedLicenseId?: number;
}

export default function LicenseTable({ 
  licenses, 
  isLoading, 
  sortConfig, 
  onSort,
  onSelectLicense,
  selectedLicenseId
}: LicenseTableProps) {
  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="invisible group-hover:visible ml-1 h-4 w-4 text-slate-400" />;
    }
    return sortConfig.direction === "asc" 
      ? <ChevronUp className="ml-1 h-4 w-4 text-slate-400" /> 
      : <ChevronDown className="ml-1 h-4 w-4 text-slate-400" />;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
    } catch (error) {
      return dateString;
    }
  };
  
  const getConfigurationLabel = (configValue: string | null): string => {
    if (!configValue || configValue === "none") return "";
    
    // Chercher dans CONFIG_OPTIONS pour trouver le label correspondant
    const configOption = CONFIG_OPTIONS.find(option => option.value === configValue);
    if (configOption) {
      return configOption.label;
    }
    
    return "Configuration personnalisée";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => onSort("ID")}>
                <div className="group inline-flex items-center">
                  ID
                  {renderSortIcon("ID")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => onSort("IDClient")}>
                <div className="group inline-flex items-center">
                  IDClient
                  {renderSortIcon("IDClient")}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => onSort("IDSynchro")}>
                <div className="group inline-flex items-center">
                  IDSynchro
                  {renderSortIcon("IDSynchro")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">Configuration</TableHead>
              <TableHead className="whitespace-nowrap">Version</TableHead>
              <TableHead className="whitespace-nowrap">Premium</TableHead>
              <TableHead className="whitespace-nowrap">MDP_Premium</TableHead>
              <TableHead className="whitespace-nowrap">Serial</TableHead>
              <TableHead className="whitespace-nowrap">Suspendu</TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => onSort("Date_DerUtilisation")}>
                <div className="group inline-flex items-center">
                  Date_DerUtilisation
                  {renderSortIcon("Date_DerUtilisation")}
                </div>
              </TableHead>
              <TableHead className="whitespace-nowrap">Date_LimiteUtil</TableHead>
              <TableHead className="whitespace-nowrap">Options</TableHead>
              <TableHead className="whitespace-nowrap">IdentifiantPC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(12)].map((_, j) => (
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
                <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                  Aucune licence trouvée
                </TableCell>
              </TableRow>
            )}
            
            {!isLoading && licenses.map((license) => (
              <TableRow 
                key={license.ID} 
                className={`hover:bg-slate-50 cursor-pointer ${selectedLicenseId === license.ID ? 'bg-blue-50' : ''}`}
                onClick={() => onSelectLicense(license)}
              >
                <TableCell className="whitespace-nowrap py-2">{license.ID}</TableCell>
                <TableCell className="whitespace-nowrap py-2">{license.IDClient}</TableCell>
                <TableCell className="whitespace-nowrap py-2">{license.IDSynchro}</TableCell>
                <TableCell className="whitespace-nowrap py-2">
                  {getConfigurationLabel(license.Tablettes)}
                </TableCell>
                <TableCell className="whitespace-nowrap py-2">{license.Version}</TableCell>
                <TableCell className="whitespace-nowrap py-2">
                  {license.Premium ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Oui</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-800 hover:bg-slate-100">Non</Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap py-2">{license.MDP_Premium}</TableCell>
                <TableCell className="whitespace-nowrap py-2">{license.Serial}</TableCell>
                <TableCell className="whitespace-nowrap py-2">
                  {license.Suspendu ? (
                    <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Oui</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-800 hover:bg-slate-100">Non</Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap py-2">{formatDate(license.Date_DerUtilisation as string)}</TableCell>
                <TableCell className="whitespace-nowrap py-2">{formatDateOnly(license.Date_LimiteUtil as string)}</TableCell>
                <TableCell className="whitespace-nowrap py-2 text-slate-500">{license.Options}</TableCell>
                <TableCell className="whitespace-nowrap py-2 text-slate-500">{license.IdentifiantPC}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
