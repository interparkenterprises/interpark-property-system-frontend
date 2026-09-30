'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

// Compatibility wrapper for older imports. New work should use Dialog directly.
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="p-5">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
