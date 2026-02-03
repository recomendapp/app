export interface RightPanel<P = any> {
	title: string;
	component: React.ComponentType<P>;
	props: P;
	onlyAuth?: boolean;
};

export const createRightPanel = ({
	title,
	component,
	props,
	onlyAuth = false,
}: RightPanel) => ({
	title,
	component,
	props,
	onlyAuth,
})
