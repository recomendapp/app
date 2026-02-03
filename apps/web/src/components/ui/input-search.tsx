import * as React from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

const InputSearch = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3">
    <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <Input
      ref={ref}
      className={cn(
        "flex h-11 bg-transparent! py-3  placeholder:text-muted-foreground",
        "border-none! px-0 ring-0! ring-offset-0!",
        className
      )}
      {...props}
    />
  </div>
))
InputSearch.displayName = "InputSearch";

export { InputSearch };