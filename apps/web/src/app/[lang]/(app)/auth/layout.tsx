import { getMe } from "@/lib/auth/server";
import { redirect } from "@/lib/i18n/navigation";
import { SupportedLocale } from "@libs/i18n";

const AuthLayout = async ({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ lang: string }>;
}) => {
	const { lang } = await params;
	const { data: session } = await getMe({
		locale: lang as SupportedLocale,
	});
	if (session) {
		redirect({ href: '/', locale: lang as SupportedLocale });
	}
	return children;
};

export default AuthLayout;