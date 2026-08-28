import { FormItem } from '@libs/ui/components/form';
import { Label } from '@libs/ui/components/label';
import { useMap } from '../../../../context/map-context';
import { useEffect, useState } from 'react';
import useDebounce from '@/hooks/use-debounce';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { RotateCcwIcon } from 'lucide-react';
import { SliderRange } from '@libs/ui/components/slider-range';

export const MapFilterDate = () => {
  const { filters } = useMap();
  const [value, setValue] = useState<number[]>(filters.date.value);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedValue !== filters.date.value) filters.date.setValue(debouncedValue);
  }, [debouncedValue, filters.date]);

  return (
    <FormItem>
      <Label className=" inline-flex items-center">
        Date
        {!value.every((value, index) => value === filters.date.defaultValue[index]) && (
          <TooltipBox tooltip="Reset">
            <RotateCcwIcon
              onClick={() => {
                setValue(filters.date.defaultValue);
              }}
              className="w-3 h-3 ml-1 text-muted-foreground hover:text-primary-foreground cursor-pointer"
            />
          </TooltipBox>
        )}
      </Label>
      <SliderRange
        min={filters.date.defaultValue[0]}
        value={value}
        max={filters.date.defaultValue[1]}
        step={1}
        onValueChange={(value) => {
          setValue(value);
        }}
      />
    </FormItem>
  );
};
