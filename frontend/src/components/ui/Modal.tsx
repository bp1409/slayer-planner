import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button type="button" className="icon-button" aria-label={title} title={title}>{icon}</button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog" aria-describedby={undefined}>
        <header className="dialog-header">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Close className="icon-button" aria-label={`Close ${title.toLowerCase()}`}><X size={17} /></Dialog.Close>
        </header>
        <div className="dialog-body" tabIndex={0}>{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
