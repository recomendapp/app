import { SettingsNav } from '@/app/[lang]/(app)/(privateroutes)/settings/_components/SettingsNav';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { SupportedLocale } from '@/translations/locales';

export const generateMetadata = async (
  props: {
      params: Promise<{
        lang: string;
      }>;
    }
): Promise<Metadata> => {
  const params = await props.params;
  const common = await getTranslations({ locale: params.lang as SupportedLocale, namespace: 'pages' });
  return {
    title: upperFirst(common('settings.label')),
    robots: {
      index: false,
      follow: false,
    }
  };
}

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout = async ({ children }: SettingsLayoutProps) => {
  const t = await getTranslations('pages.settings');
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="">
        <h2 className="text-2xl font-bold">{t('label')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <aside className=" lg:w-1/5">
          <SettingsNav />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}

export default SettingsLayout;