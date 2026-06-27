import { Card, CardContent, Typography } from '@mui/material';
import { CompanyWordmark } from '../../components/shared/CompanyLogo/CompanyWordmark';
import { RESPONSIVE } from '../../config/responsive';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { CuratedCompany } from '../../features/companies/companiesApi';

interface CompanyCardProps {
  company: CuratedCompany;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const isMobile = useIsMobile();

  const description = [company.blurb, company.accomplishment].filter(Boolean).join(' ');

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent
        sx={{
          flexGrow: 1,
          p: RESPONSIVE.curatedCard.contentPadding,
          '&:last-child': { pb: RESPONSIVE.spacing.cardPaddingBottom },
        }}
      >
        <CompanyWordmark
          companyId={company.id}
          displayName={company.displayName}
          height={
            isMobile
              ? RESPONSIVE.curatedCard.wordmarkHeight.compact
              : RESPONSIVE.curatedCard.wordmarkHeight.default
          }
        />
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: RESPONSIVE.curatedCard.descriptionFontSize }}
          >
            {description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
