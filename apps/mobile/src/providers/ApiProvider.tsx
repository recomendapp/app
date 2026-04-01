import { useLocale } from "use-intl";
import { client } from "@packages/api-js";
import { API_ENDPOINT } from "../env";
import { useEffect } from "react";
import { HEADER_LANGUAGE_KEY } from "@libs/i18n";

client.setConfig({
  baseUrl: API_ENDPOINT || 'https://api.recomend.app/v1',
  credentials: 'include',
});

export const ApiProvider = ({ children }: { children?: React.ReactNode }) => {
  const locale = useLocale();

  useEffect(() => {
    client.setConfig({
      headers: {
        [HEADER_LANGUAGE_KEY]: locale,
      },
    });
  }, [locale]);

  return children;
};