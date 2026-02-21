import CheckInsTable from './CheckInsTable';

interface CheckInsProps {
  teamMemberId?: string;
  openFormInitially?: boolean;
  initialEditCheckInId?: string;
}

export default function CheckIns({ teamMemberId, openFormInitially = false, initialEditCheckInId }: CheckInsProps) {
  return <CheckInsTable teamMemberId={teamMemberId} showHeader={!teamMemberId} initialEditCheckInId={initialEditCheckInId} />;
}
