import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ButtonProps as ShadcnButtonProps } from "./button"

// Style personnalisé pour les boutons Nuxi suivant la charte graphique
const nuxiButtonVariants = cva(
  "inline-flex items-center justify-center h-[38px] w-[116px] rounded-[4px] text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-white text-[#36599E] border border-[#36599E] hover:bg-[#E3E6EA] active:bg-[#36599E] active:text-white",
        secondary: "bg-[#36599E] text-white hover:bg-[#0A2A69] active:bg-[#85A3DE]",
        outline: "bg-transparent text-[#36599E] border border-[#36599E] hover:bg-[#F3F6FA] active:bg-[#E3E6EA]",
      },
      size: {
        default: "",
        sm: "h-8 px-3", // Pour les boutons plus petits si nécessaire
        lg: "h-10",     // Pour les boutons plus grands si nécessaire
        icon: "h-8 w-8", // Pour les boutons icônes
      },
      fullWidth: {
        true: "w-full",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface NuxiButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof nuxiButtonVariants>, 'variant'> {
      fullWidth?: boolean;
      variant?: 'primary' | 'secondary' | 'outline';
}

const NuxiButton = React.forwardRef<HTMLButtonElement, NuxiButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        className={cn(nuxiButtonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NuxiButton.displayName = "NuxiButton"

export { NuxiButton, nuxiButtonVariants }