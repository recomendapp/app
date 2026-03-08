import { getMe } from "@/lib/auth/server";
import { redirect } from "@/lib/i18n/navigation";
import { SupportedLocale } from "@libs/i18n";
import FeedPersons from "./_components/FeedPersons";

export default async function FeedPersonsPage(
  props: {
	params: Promise<{
	  lang: SupportedLocale;
	}>;
  }
) {
	const { lang } = await props.params;

	const { data: user } = await getMe();

	if (!user?.isPremium) {
		redirect({ href: '/upgrade', locale: lang });
	}

	return <FeedPersons />
}
