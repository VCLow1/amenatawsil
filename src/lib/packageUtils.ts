import { Package } from '../types';

/**
 * Filtre les colis visibles pour une agence donnée.
 *
 * Règles :
 * - EXCLURE les colis transférés DEPUIS cette agence vers une autre
 * - INCLURE les colis transférés VERS cette agence
 * - INCLURE les colis dont le shipper ou le courier appartient à l'agence
 */
export const filterPackagesForAgency = (
  packages: Package[],
  agencyName: string,
  agencyUserNames: string[],
  agencyCompanyNames: string[]
): Package[] => {
  return packages.filter(p => {
    // Exclure les colis transférés DEPUIS cette agence vers une autre
    if (
      p.transferredFromAgency === agencyName &&
      p.transferredToAgency &&
      p.transferredToAgency !== agencyName
    ) {
      return false;
    }

    // Inclure les colis transférés VERS cette agence
    if (p.transferredToAgency === agencyName) {
      return true;
    }

    // Inclure les colis du shipper ou courier de l'agence
    return (
      agencyUserNames.includes(p.shipper) ||
      agencyCompanyNames.includes(p.shipper) ||
      agencyUserNames.includes(p.courier || '')
    );
  });
};

/**
 * Filtre les colis en attente d'approbation pour une agence.
 */
export const filterPendingPackagesForAgency = (
  packages: Package[],
  agencyName: string,
  agencyUserNames: string[]
): Package[] => {
  return packages.filter(p => {
    if (p.approvalStatus !== 'waiting') return false;

    // Exclure les colis transférés depuis cette agence
    if (
      p.transferredFromAgency === agencyName &&
      p.transferredToAgency &&
      p.transferredToAgency !== agencyName
    ) {
      return false;
    }

    // Inclure les colis transférés vers cette agence en attente
    if (p.transferredToAgency === agencyName) return true;

    return agencyUserNames.includes(p.shipper);
  });
};
