import { FormItem } from '@libs/ui/components/form';
import { Label } from '@libs/ui/components/label';
import { Slider } from '@libs/ui/components/slider';
import { useMap } from '../../../../context/map-context';
import { useEffect, useState } from 'react';
import useDebounce from '@/hooks/use-debounce';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { RotateCcwIcon } from 'lucide-react';
import { useFormatter } from 'next-intl';

export const MapFilterRuntime = () => {
  const format = useFormatter();
  const { filters } = useMap();
  const [value, setValue] = useState<number[]>(filters.runtime.value);
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedValue !== filters.runtime.value) filters.runtime.setValue(debouncedValue);
  }, [debouncedValue, filters.runtime]);

  return (
    <FormItem>
      <Label className=" inline-flex items-center">
        Durée
        {!value.every((value, index) => value === filters.runtime.defaultValue[index]) && (
          <TooltipBox tooltip="Reset">
            <RotateCcwIcon
              onClick={() => {
                setValue(filters.runtime.defaultValue);
              }}
              className="w-3 h-3 ml-1 text-muted-foreground hover:text-primary-foreground cursor-pointer"
            />
          </TooltipBox>
        )}
      </Label>
      <Slider
        min={filters.runtime.defaultValue[0]}
        value={value}
        max={filters.runtime.defaultValue[1]}
        step={15}
        formatLabel={(value) =>
          format.dateTime((value - 60) * 60 * 1000, { hour: 'numeric', minute: 'numeric' })
        }
        onValueChange={(value) => {
          setValue(value);
        }}
      />
    </FormItem>
  );
};
