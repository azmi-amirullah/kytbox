'use client';

import { Dialog, DialogContent, ModalHeader } from '@/components/ui/dialog';
import CustomDomainSettings from './CustomDomainSettings';
import type { CustomDomainDTO } from '@/types/dto';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomDomain?: CustomDomainDTO | null;
}

export default function CustomDomainModal({
  isOpen,
  onClose,
  initialCustomDomain = null,
}: CustomDomainModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-2xl w-full p-6 sm:rounded-2xl border border-border shadow-xl'>
        <ModalHeader
          title='Custom Domain Setup'
          description='Map your own custom domain or subdomain to your Bio profile.'
          onClose={onClose}
        />

        <div className='max-h-[80vh] overflow-y-auto'>
          <CustomDomainSettings initialCustomDomain={initialCustomDomain} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

