import { Separator } from '@libs/ui/components/separator';
import { getTranslations } from 'next-intl/server';
import { Importer } from '@/components/Settings/Data/Importer/Importer';
import { Exporter } from '@/components/Settings/Data/Exporter/Exporter';
import { getExportSources, getImportSources } from '@/api/server/data';

export default async function SettingsDataPage() {
  const t = await getTranslations('pages.settings');
  const [importSources, exportSources] = await Promise.all([
    getImportSources(),
    getExportSources(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('data.label')}</h3>
        <p className="text-sm text-muted-foreground text-justify">{t('data.description')}</p>
      </div>
      <Separator />
      <Importer initialSources={importSources} />
      <Separator />
      <Exporter initialDestinations={exportSources} />
    </div>
  );
}
