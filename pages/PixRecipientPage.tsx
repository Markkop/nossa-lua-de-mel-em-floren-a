import React from 'react';
import PixDisplay from '../components/PixDisplay';
import { getRecipientPixCode, hasRecipientPixCode } from '../pixConfig';
import type { PixRecipient } from '../pixConfig';

interface PixRecipientPageProps {
  recipient: PixRecipient;
}

const PIX_PAGE_TITLES: Record<PixRecipient, string> = {
  mark: 'Pix Mark',
  yosha: 'Pix Yosha',
};

const PixRecipientPage: React.FC<PixRecipientPageProps> = ({ recipient }) => {
  const pixCode = getRecipientPixCode(recipient);
  const isPixConfigured = hasRecipientPixCode(recipient);

  return (
    <PixDisplay
      title={PIX_PAGE_TITLES[recipient]}
      pixCode={pixCode}
      isPixConfigured={isPixConfigured}
    />
  );
};

export default PixRecipientPage;
