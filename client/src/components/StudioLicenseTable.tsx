import { ChevronDown, ChevronUp } from "lucide-react";
import { StudioLicense, SortConfig } from "@/types/license";
import { NuxiButton } from "@/components/ui/nuxi-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StudioLicenseTableProps {
  licenses: StudioLicense[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onSelectLicense: (license: StudioLicense) => void;
  selectedLicenseId?: number;
}

export default function StudioLicenseTable({
  licenses,
  isLoading,
  sortConfig,
  onSort,
  onSelectLicense,
  selectedLicenseId
}: StudioLicenseTableProps) {
  // Formater un numéro client
  const formatNumClient = (num: number) => {
    return String(num);
  };

  // Render le header de colonne avec la flèche de tri
  const renderSortableHeader = (label: string, key: string) => {
    const isSorted = sortConfig.key === key;
    return (
      <div className="flex items-center space-x-1 cursor-pointer" onClick={() => onSort(key)}>
        <span>{label}</span>
        {isSorted && (
          <span className="ml-1">
            {sortConfig.direction === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </div>
    );
  };

  // Rendere le badge pour un module activé
  const renderModuleBadge = (isEnabled: number, label: string) => {
    if (isEnabled) {
      return <Badge variant="default" className="bg-[#36599E] hover:bg-[#0A2A69] px-1.5 py-0 text-xs">{label}</Badge>;
    }
    return null;
  };

  // Rendre l'état suspendu
  const renderSuspendedState = (suspended: number | null) => {
    if (suspended === 1) {
      return <Badge variant="default" className="bg-red-600 hover:bg-red-700 px-1.5 py-0 text-xs">Suspendu</Badge>;
    }
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700 px-1.5 py-0 text-xs">Actif</Badge>;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{renderSortableHeader("ID", "ID")}</TableHead>
              <TableHead>{renderSortableHeader("Client", "NumClient")}</TableHead>
              <TableHead>{renderSortableHeader("Serial", "Serial")}</TableHead>
              <TableHead>{renderSortableHeader("Identifiant", "IdentifiantUser")}</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>État</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (licenses.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Aucune licence trouvée</h3>
        <p className="text-gray-500">Utilisez les filtres pour affiner votre recherche.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{renderSortableHeader("ID", "ID")}</TableHead>
            <TableHead>{renderSortableHeader("Client", "NumClient")}</TableHead>
            <TableHead>{renderSortableHeader("Serial", "Serial")}</TableHead>
            <TableHead>{renderSortableHeader("Identifiant", "IdentifiantUser")}</TableHead>
            <TableHead>Modules</TableHead>
            <TableHead>État</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => (
            <TableRow 
              key={license.ID} 
              className={`${selectedLicenseId === license.ID ? "bg-[#DBEAFE]" : ""} hover:bg-gray-50 cursor-pointer`}
              onClick={() => onSelectLicense(license)}
            >
              <TableCell className="font-medium py-2">{license.ID}</TableCell>
              <TableCell className="py-2">{formatNumClient(license.NumClient)}</TableCell>
              <TableCell className="py-2">{license.Serial || "N/A"}</TableCell>
              <TableCell className="py-2">{license.IdentifiantUser || "N/A"}</TableCell>
              <TableCell className="py-2">
                <div className="flex flex-wrap gap-1">
                  {renderModuleBadge(license.PDF, "PDF")}
                  {renderModuleBadge(license.Vue, "Vue")}
                  {renderModuleBadge(license.PagePerso, "Page Perso")}
                  {renderModuleBadge(license.WDE, "WDE")}
                </div>
              </TableCell>
              <TableCell className="py-2">{renderSuspendedState(license.Suspendu)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}