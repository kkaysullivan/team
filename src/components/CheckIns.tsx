import CheckInsTable from './CheckInsTable';

interface CheckInsProps {
  teamMemberId?: string;
  openFormInitially?: boolean;
}

export default function CheckIns({ teamMemberId, openFormInitially = false }: CheckInsProps) {
  return <CheckInsTable teamMemberId={teamMemberId} showHeader={!teamMemberId} />;
}
