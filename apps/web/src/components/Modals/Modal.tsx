import * as React from "react"
 
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useUI } from "@/context/ui-context"

export interface ModalType {
	id: string;
	open: boolean;
}

// interface ModalProps {
// 	children?: React.ReactNode
// 	header?: {
// 		title?: React.ReactNode;
// 		description?: React.ReactNode;
// 	}
// 	footer?: React.ReactNode;
// 	open?: boolean;
// 	onOpenChange?: (open: boolean) => void;
// 	className?: string;
// }

// const Modal = ({
// 	children,
// 	header,
// 	footer,
// 	open = true,
// 	onOpenChange,
// 	className,
// } : ModalProps) => {
// 	const { device } = useUI();
 
// 	if (device === 'desktop') {
// 		return (
// 			<Dialog open={open} onOpenChange={onOpenChange}>
// 			{/* {children && (
// 				<DialogTrigger asChild>
// 					{children}
// 				</DialogTrigger>
// 			)} */}
// 			<DialogContent className={cn('max-h-[80%]', className)}>
// 				{header && (
// 					<DialogHeader>
// 						{header.title && (<DialogTitle>{header.title}</DialogTitle>)}
// 						{header.description && (<DialogDescription>{header.description}</DialogDescription>)}
// 					</DialogHeader>
// 				)}
// 				<div className="overflow-y-auto pr-2">
// 					{/* {content} */}
// 					{children}
// 				</div>
// 				{footer && (<DialogFooter>{footer}</DialogFooter>)}
// 			</DialogContent>
// 			</Dialog>
// 		)
// 	}

// 	return (
// 		<Drawer open={true}>
// 			{/* {children && (
// 				<DrawerTrigger asChild>
// 					{children}
// 				</DrawerTrigger>
// 			)} */}
// 			<DrawerContent className={cn('max-h-[95%]', className)}>
// 				{header && (
// 					<DrawerHeader className="text-left">
// 						{header.title && (<DrawerTitle>{header.title}</DrawerTitle>)}
// 						{header.description && (<DrawerDescription>{header.description}</DrawerDescription>)}
// 					</DrawerHeader>
// 				)}
// 				<div className="p-4 overflow-y-auto">
// 					{/* {content} */}
// 					{children}
// 				</div>
// 				{footer && (<DrawerFooter>{footer}</DrawerFooter>)}
// 			</DrawerContent>
// 			{/* <DrawerContent>
// 			<DrawerHeader className="text-left">
// 				<DrawerTitle>Edit profile</DrawerTitle>
// 				<DrawerDescription>
// 				Make changes to your profile here. Click save when you're done.
// 				</DrawerDescription>
// 			</DrawerHeader>
// 			<ProfileForm className="px-4" />
// 			<DrawerFooter className="pt-2">
// 				<DrawerClose asChild>
// 				<Button variant="outline">Cancel</Button>
// 				</DrawerClose>
// 			</DrawerFooter>
// 			</DrawerContent> */}
// 		</Drawer>
// 	)
// }

/**
 * Modal component
 * @param children
 * @return on desktop: Dialog, on mobile: Drawer
 */
const Modal = ({
	children,
	className,
	...props
}: React.ComponentProps<typeof Dialog> & { className?: string }) => {
	const { device } = useUI();
	return device === 'desktop' ? (
		<Dialog {...props}>
			<ModalContent className={cn('', className)}>
				{children}
			</ModalContent>
		</Dialog>
	) : (
		<Drawer {...props}>
			<ModalContent className={cn('', className)}>
				{children}
			</ModalContent>
		</Drawer>
	);
}

/**
 * Modal content component
 * @param children
 * @return on desktop: DialogContent, on mobile: DrawerContent
 */
const ModalContent = React.forwardRef<
	React.ElementRef<typeof DialogContent>,
	React.ComponentPropsWithoutRef<typeof DrawerContent>
>(({ className, ...props }, ref) => {
	const { device } = useUI();
	return device === 'desktop' ? (
		<DialogContent
			ref={ref}
			className={cn('max-h-[80%] overflow-auto', className)}
			{...props}
		/>
	) : (
		<DrawerContent
			ref={ref}
			className={cn('max-h-[95%]', className)}
			{...props}
		/>
	);
});
ModalContent.displayName = 'ModalContent';

const ModalBody = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => {
	const { device } = useUI();
	return device === 'desktop' ? (
		<div className={cn('', className)} {...props} />
	) : (
		<div className={cn('p-4 overflow-auto', className)} {...props} />
	);
};
ModalBody.displayName = 'ModalBody';

/**
 * Modal header component
 * @param children
 * @return on desktop: DialogHeader, on mobile: DrawerHeader
 */
const ModalHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => {
	const { device } = useUI();
	return device === 'desktop' ? (
		<DialogHeader
			className={cn('', className)}
			{...props}
		/>
	) : (
		<DrawerHeader
			className={cn('', className)}
			{...props}
		/>
	);
};
ModalHeader.displayName = 'ModalHeader';

/**
 * Modal footer component
 * @param children
 * @return on desktop: DialogFooter, on mobile: DrawerFooter
 */
const ModalFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => {
	const { device } = useUI();
	return device === 'desktop' ? (
		<DialogFooter
			className={cn('', className)}
			{...props}
		/>
	) : (
		<DrawerFooter
			className={cn('pt-2', className)}
			{...props}
		/>
	);
};
ModalFooter.displayName = 'ModalFooter';

/**
 * Modal title component
 * @param children
 * @return On desktop: DialogTitle, On mobile: DrawerTitle
 */
const ModalTitle = React.forwardRef<
	React.ElementRef<typeof DialogTitle>,
	React.ComponentPropsWithoutRef<typeof DrawerTitle>
>(({ className, ...props }, ref) => {
	const { device } = useUI();
	return device === 'desktop' ? (
		<DialogTitle
			ref={ref}
			className={cn('', className)}
			{...props}
		/>
	) : (
		<DrawerTitle
			ref={ref}
			className={cn('', className)}
			{...props}
		/>
	);
});
ModalTitle.displayName = 'ModalTitle';

/**
 * Modal description component
 * @param children
 * @return On desktop: DialogDescription, On mobile: DrawerDescription
 */
const ModalDescription = React.forwardRef<
	React.ElementRef<typeof DialogDescription>,
	React.ComponentPropsWithoutRef<typeof DrawerDescription>
>(({ className, ...props }, ref) => {
	const { device } = useUI();
	return device === 'desktop' ? (
		<DialogDescription
			ref={ref}
			className={cn('', className)}
			{...props}
		/>
	) : (
		<DrawerDescription
			ref={ref}
			className={cn('', className)}
			{...props}
		/>
	);
});
ModalDescription.displayName = 'ModalDescription';




export {
	Modal,
	// ModalPortal
	// ModalOverlay,
	// ModalTrigger,
	ModalContent,
	ModalBody,
	ModalHeader,
	ModalFooter,
	ModalTitle,
	ModalDescription,
}