import KRAsTable from './KRAsTable';

interface TeamMember {
  id: string;
  full_name: string;
  position: string;
  department: string;
  role?: string;
}

interface KRAManagementProps {
  teamMemberId: string;
  teamMember: TeamMember;
}

export default function KRAManagement({ teamMemberId, teamMember }: KRAManagementProps) {
  return <KRAsTable teamMemberId={teamMemberId} teamMember={teamMember} />;
}
