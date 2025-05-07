import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { NuxiSavLicense, SortConfig } from "@/types/license";
import { formatDateFr } from "@/lib/utils";

interface NuxiSavLicenseTableProps {
  licenses: NuxiSavLicense[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  onSelectLicense: (license: NuxiSavLicense) => void;
  selectedLicenseId?: number;
}

export default function NuxiSavLicenseTable({
  licenses,
  isLoading,
  sortConfig,
  onSort,
  onSelectLicense,
  selectedLicenseId,
}: NuxiSavLicenseTableProps) {
  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return null;
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="inline ml-1 h-4 w-4" /> 
      : <ChevronDown className="inline ml-1 h-4 w-4" />;
  };

  // Fonction pour rendre les badges d'options
  const renderOptionBadges = (options: string | null) => {
    if (!options) return null;
    
    const optionMap: { [key: string]: string } = {
      'Atel': 'Atelier',
      'Trck': 'Tracking',
      'TckWeb': 'Ticket web',
      'Aud': 'Audit',
      'sdk': 'SDK'
    };
    
    const optionsList = options.split(',').map(option => option.trim());
    
    return (
      <div className="flex flex-wrap gap-1">
        {optionsList.map((option, index) => (
          <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            {optionMap[option] || option}
          </Badge>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p>Chargement des licences...</p>
      </div>
    );
  }

  if (licenses.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
        <p>Aucune licence trouvée.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[80px] cursor-pointer"
              onClick={() => onSort('ID')}
            >
              ID {renderSortIcon('ID')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('IdClient')}
            >
              Client {renderSortIcon('IdClient')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('IdentifiantWeb')}
            >
              Identifiant Web {renderSortIcon('IdentifiantWeb')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('SerialPermanente')}
            >
              Serial Permanente {renderSortIcon('SerialPermanente')}
            </TableHead>
            <TableHead 
              className="cursor-pointer text-center"
              onClick={() => onSort('NbrPermanente')}
            >
              Nombre {renderSortIcon('NbrPermanente')}
            </TableHead>
            <TableHead>
              Options
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('Der_Utilisation')}
            >
              Dernière Utilisation {renderSortIcon('Der_Utilisation')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => onSort('Version')}
            >
              Version {renderSortIcon('Version')}
            </TableHead>
            <TableHead 
              className="cursor-pointer text-center"
              onClick={() => onSort('Suspendu')}
            >
              État {renderSortIcon('Suspendu')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => (
            <TableRow 
              key={license.ID}
              className={`h-6 py-1 cursor-pointer ${selectedLicenseId === license.ID ? 'bg-slate-100' : ''}`}
              onClick={() => onSelectLicense(license)}
            >
              <TableCell className="font-medium py-1">{license.ID}</TableCell>
              <TableCell className="py-1">{license.IdClient}</TableCell>
              <TableCell className="py-1">{license.IdentifiantWeb || '-'}</TableCell>
              <TableCell className="py-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate block max-w-[250px]">{license.SerialPermanente || '-'}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{license.SerialPermanente}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="py-1 text-center">{license.NbrPermanente}</TableCell>
              <TableCell className="py-1">{renderOptionBadges(license.Options)}</TableCell>
              <TableCell className="py-1">{formatDateFr(license.Der_Utilisation)}</TableCell>
              <TableCell className="py-1">{license.Version || '-'}</TableCell>
              <TableCell className="py-1 text-center">
                {license.Suspendu === 1 ? (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    Suspendu
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Actif
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}