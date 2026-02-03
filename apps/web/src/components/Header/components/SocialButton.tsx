import { useUI } from '@/context/ui-context';
import { Button } from '@/components/ui/button';
import { RightPanelSocial } from '@/components/sidebar/right-panel/RightPanelSocial';
import { Icons } from '@/config/icons';
import { cn } from '@/lib/utils';
import { upperFirst } from 'lodash';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

/**
 * Social button
 * @description Open social in the right panel
 * @param {string} className - The class name of the element
 * @param {React.ComponentProps<typeof Button>} props - The props of the element
 */
export const SocialButton = ({
	variant = "outline",
	size = "icon",
	onClick,
	...props
} : React.ComponentProps<typeof Button>) => {
	const common = useTranslations('common');
	const {
		toggleRightPanelContent,
	} = useUI();

	const handleOnClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		toggleRightPanelContent(RightPanelSocial());
		onClick?.(e);
	}, [onClick, toggleRightPanelContent]);
	return (
		<Button variant={variant} size={size} onClick={handleOnClick} {...props}>
			<Icons.users />
			<span className="sr-only">{upperFirst(common('messages.open_social_panel'))}</span>
		</Button>
	);
}