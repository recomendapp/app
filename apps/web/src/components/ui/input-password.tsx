import * as React from "react"
import { Input } from "./input"

import { cn } from "@/lib/utils"
import { EyeIcon, EyeOffIcon } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const InputPassword = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input>
>(({ className, placeholder, type, ...props }, ref) => {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "Password"}
        className={cn(
          "pr-10",
          className
        )}
        ref={ref}
        {...props}
      />
      <button
      type="button"
      className="absolute top-1/2 right-2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
      onClick={() => setShow(!show)}
      >
        {show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
      </button>
    </div>
  )
})
InputPassword.displayName = "InputPassword"

export { InputPassword }
