import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { capitalize } from 'lodash';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ButtonShare({
  url,
  icon,
  className
}: {
  url: string;
  icon?: boolean;
  className?: string;
}) {
  const common = useTranslations('common');
  const copyToClipboard = useCopyToClipboard();
  if (icon) {
    return (
      <Button className={className} variant={'outline'} onClick={() => copyToClipboard(url)}>
        <Share2 />
      </Button>
    );
  }

  return <p onClick={() => copyToClipboard(url)}>{capitalize(common('messages.share'))}</p>;
}
