import React, { useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface InfiniteScrollProps {
	dataLength?: number;
	isLoading: boolean;
	isFetching: boolean;
	fetchMore: () => void;
	hasMore: boolean;
	loader: React.ReactNode;
	skeleton?: React.ComponentType;
	children: React.ReactNode;
}

export const InfiniteScroll = ({
	dataLength,
	isLoading,
	isFetching,
	fetchMore,
	hasMore,
	loader,
	skeleton: SkeletonComponent,
	children,
} : InfiniteScrollProps) => {
	const { ref, inView } = useInView();

	useEffect(() => {
		if (inView && hasMore) {
			fetchMore();
		}
	}, [inView, hasMore, fetchMore]);

	const renderChildren = useCallback(() => {
		if (dataLength === undefined || isLoading) {
			if (SkeletonComponent === undefined) {
				return loader;
			}
			return Array.from({ length: 10 }).map((_, index) => (
				<SkeletonComponent key={index} />
			));
		}
		return React.Children.map(children, (child, index) => {
			const isLastItem = index === dataLength - 1;
			if (isLastItem) {
				return (
					<div ref={ref} key={index}>
						{child}
					</div>
				);
			} else {
				return child;
			}
		});
	}, [children, dataLength, ref, isLoading, SkeletonComponent, loader]);
	return (
		<>
			{renderChildren()}
			{(isFetching && !isLoading) && loader}
		</>
	)
}