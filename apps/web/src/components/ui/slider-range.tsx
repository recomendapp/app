import React, { useEffect, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from "@/lib/utils"

interface SliderRangeProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    formatLabel?: (value: number) => React.ReactNode;
}

const SliderRange = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    SliderRangeProps
>(({
    className,
    min,
    max,
    step,
    formatLabel,
    value,
    onValueChange,
    ...props
}, ref) => {
    const initialValue = Array.isArray(value) ? value : [min ?? 0, max ?? 0];
    const [localValues, setLocalValues] = useState(initialValue);

    const handleValueChange = (newValues: number[]) => {
        setLocalValues(newValues);
        if (onValueChange) {
            onValueChange(newValues);
        }
    };

	useEffect(() => {
		Array.isArray(value) && setLocalValues(value);
	}, [value]);

    return (
		<React.Fragment>
			<SliderPrimitive.Root
				ref={ref}
				min={min}
				max={max}
				step={step}
				value={localValues}
				onValueChange={handleValueChange}
				className={cn('relative flex w-full touch-none select-none items-center', className)}
				{...props}
			>
				<SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
					<SliderPrimitive.Range className="absolute h-full bg-primary" />
				</SliderPrimitive.Track>
				{localValues.map((value, index) => (
					<React.Fragment key={index}>
						<SliderPrimitive.Thumb
							className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
						/>
					</React.Fragment>
				))}
			</SliderPrimitive.Root>
			<div className='w-full flex justify-between text-muted-foreground'>
				{localValues.map((value, index) => (
					<div key={index} className='text-center'>
						<span className='text-xs'>{formatLabel ? formatLabel(value) : value}</span>
					</div>
				))}
			</div>
		</React.Fragment>
    );
});

SliderRange.displayName = SliderPrimitive.Root.displayName;

export { SliderRange };