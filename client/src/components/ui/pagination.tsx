import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingsCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingsCount = 1,
}: PaginationProps) {
  // Fonction pour générer les numéros de page à afficher
  const generatePages = () => {
    // Gérer le cas où il n'y a pas ou peu de pages
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Début et fin des pages avec ellipsis
    const startPages = [1];
    const endPages = [totalPages];
    
    // Pages autour de la page courante
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingsCount,
      totalPages
    );

    // Déterminer si on doit montrer les ellipsis
    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

    // Pages du milieu
    const middlePages = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );

    // Assembler le tableau final avec les ellipsis
    const pages = [
      ...startPages,
      ...(shouldShowLeftEllipsis ? ['ellipsis-left'] : leftSiblingIndex > 1 ? [2] : []),
      ...middlePages.filter(p => !startPages.includes(p) && !endPages.includes(p)),
      ...(shouldShowRightEllipsis ? ['ellipsis-right'] : rightSiblingIndex < totalPages ? [totalPages - 1] : []),
      ...endPages.filter(p => p !== 1)
    ];

    return pages;
  };

  // Si une seule page, ne pas afficher la pagination
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center space-x-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {generatePages().map((page, index) => {
        if (page === 'ellipsis-left' || page === 'ellipsis-right') {
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              size="sm"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }

        const pageNum = page as number;
        return (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}