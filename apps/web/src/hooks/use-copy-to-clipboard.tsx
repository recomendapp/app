import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

export const useCopyToClipboard = () => {
  const t = useTranslations('common');

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(upperFirst(t('messages.copied', {gender: 'male', count: 1})));
    return text;
  };

  return copy;
}