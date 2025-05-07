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
  // Formater un numéro client avec des zéros à gauche
  const formatNumClient = (num: number) => {
    return String(num).padStart(5, '0');
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
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{label}</Badge>;
    }
    return null;
  };

  // Rendre l'état suspendu
  const renderSuspendedState = (suspended: number) => {
    if (suspended) {
      return <Badge variant="default" className="bg-red-600 hover:bg-red-700">Suspendu</Badge>;
    }
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Actif</Badge>;
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
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => (
            <TableRow 
              key={license.ID} 
              className={selectedLicenseId === license.ID ? "bg-blue-50" : undefined}
            >
              <TableCell className="font-medium">{license.ID}</TableCell>
              <TableCell>{formatNumClient(license.NumClient)}</TableCell>
              <TableCell>{license.Serial || "N/A"}</TableCell>
              <TableCell>{license.IdentifiantUser || "N/A"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {renderModuleBadge(license.PDF, "PDF")}
                  {renderModuleBadge(license.Vue, "Vue")}
                  {renderModuleBadge(license.PagePerso, "Page Perso")}
                  {renderModuleBadge(license.WDE, "WDE")}
                </div>
              </TableCell>
              <TableCell>{renderSuspendedState(license.Suspendu)}</TableCell>
              <TableCell className="text-right">
                <NuxiButton
                  onClick={() => onSelectLicense(license)}
                  variant="outline"
                  size="sm"
                >
                  Modifier
                </NuxiButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}