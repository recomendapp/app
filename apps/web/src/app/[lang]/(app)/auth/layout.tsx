import { getMe } from "@/lib/auth/server";
import { redirect } from "@/lib/i18n/navigation";
import { SupportedLocale } from "@libs/i18n";

const AuthLayout = async ({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ lang: SupportedLocale }>;
}) => {
	const { lang } = await params;
	const { data: session } = await getMe({
		locale: lang,
	});
	if (session) {
		redirect({ href: '/', locale: lang });
	}
	return children;
};

export default AuthLayout;