export interface ShareControllerProps {
	onFileReady?: (file: File) => void;
}

export type ShareController<T> = {
  Component: React.ComponentType<T>;
  props: T;
};

export const createShareController = <T,>(
  Component: React.ComponentType<T>,
  props: T
): ShareController<T> => ({
  Component,
  props,
});
