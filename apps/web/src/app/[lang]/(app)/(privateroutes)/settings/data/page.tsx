'use client';

import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { Importer } from "../../../../../../components/Settings/Data/Importer/Importer";
import { Exporter } from "@/components/Settings/Data/Exporter/Exporter";

export default function SettingsDataPage() {
  const t = useTranslations('pages.settings');
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('data.label')}</h3>
        <p className="text-sm text-muted-foreground text-justify">
          {t('data.description')}
        </p>
      </div>
      <Separator />
      <Importer />
      <Separator />
      <Exporter />
    </div>
  );
}
