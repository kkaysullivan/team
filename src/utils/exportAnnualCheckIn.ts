import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopType, TabStopPosition, BorderStyle } from 'docx';

interface ReflectionData {
  wins: { team_member: string; leader: string };
  learnings: { team_member: string; leader: string };
  fail_forward: { team_member: string; leader: string };
  level_up: { team_member: string; leader: string };
  steps_taking: { team_member: string; leader: string };
  next_year_goals: { team_member: string; leader: string };
  impact_areas: { team_member: string; leader: string };
}

interface PeerFeedback {
  name: string;
  feedback: string;
}

interface MaturitySnapshot {
  category: string;
  skill: string;
  current_level: string;
  leader_rating: number;
}

interface GrowthArea {
  skill_name: string;
  current_level: string;
  target_level: string;
  priority: number;
}

interface AnnualCheckInData {
  teamMemberName: string;
  reviewDate: string;
  managerName: string;
  reflectionQuestions?: ReflectionData;
  peerFeedback?: PeerFeedback[];
  maturitySnapshot?: MaturitySnapshot[];
  growthAreas?: GrowthArea[];
}

export async function exportAnnualCheckInToWord(data: AnnualCheckInData): Promise<void> {
  const sections = [];

  // Header Section
  sections.push(
    new Paragraph({
      text: 'ANNUAL CHECK-IN',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Team Member: ', bold: true }),
        new TextRun({ text: data.teamMemberName }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Review Date: ', bold: true }),
        new TextRun({ text: new Date(data.reviewDate).toLocaleDateString() }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Manager: ', bold: true }),
        new TextRun({ text: data.managerName }),
      ],
      spacing: { after: 400 },
    })
  );

  // Reflection Questions
  if (data.reflectionQuestions) {
    sections.push(
      new Paragraph({
        text: 'REFLECTION QUESTIONS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const questions = [
      { label: 'What were your biggest wins this year?', key: 'wins' },
      { label: 'What were your biggest learnings this year?', key: 'learnings' },
      { label: 'Tell me about a time you failed forward.', key: 'fail_forward' },
      { label: 'How have you leveled up this year?', key: 'level_up' },
      { label: 'What steps are you taking to develop your craft?', key: 'steps_taking' },
      { label: 'What are your goals for next year?', key: 'next_year_goals' },
      { label: 'What areas do you want to make an impact in?', key: 'impact_areas' },
    ];

    for (const question of questions) {
      const key = question.key as keyof ReflectionData;
      const answers = data.reflectionQuestions[key];

      sections.push(
        new Paragraph({
          text: question.label,
          bold: true,
          spacing: { before: 300, after: 100 },
        })
      );

      if (answers.team_member) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Team Member Response: ', bold: true, italics: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: answers.team_member,
            spacing: { after: 200 },
          })
        );
      }

      if (answers.leader) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Leader Response: ', bold: true, italics: true }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: answers.leader,
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  // Peer Feedback
  if (data.peerFeedback && data.peerFeedback.length > 0) {
    sections.push(
      new Paragraph({
        text: 'PEER FEEDBACK',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    for (const peer of data.peerFeedback) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: peer.name, bold: true }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: peer.feedback || 'No feedback provided',
          spacing: { after: 200 },
        })
      );
    }
  }

  // Maturity Model Snapshot
  if (data.maturitySnapshot && data.maturitySnapshot.length > 0) {
    sections.push(
      new Paragraph({
        text: 'MATURITY MODEL SNAPSHOT',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const groupedByCategory: Record<string, MaturitySnapshot[]> = {};
    for (const item of data.maturitySnapshot) {
      if (!groupedByCategory[item.category]) {
        groupedByCategory[item.category] = [];
      }
      groupedByCategory[item.category].push(item);
    }

    for (const [category, items] of Object.entries(groupedByCategory)) {
      sections.push(
        new Paragraph({
          text: category,
          bold: true,
          spacing: { before: 300, after: 100 },
        })
      );

      for (const item of items) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${item.skill}: `, bold: true }),
              new TextRun({ text: `${item.current_level} (Rating: ${item.leader_rating}/5)` }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  // Growth Areas
  if (data.growthAreas && data.growthAreas.length > 0) {
    sections.push(
      new Paragraph({
        text: 'TOP GROWTH AREAS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    const sortedGrowth = [...data.growthAreas].sort((a, b) => a.priority - b.priority);

    for (const area of sortedGrowth) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Priority ${area.priority}: `, bold: true }),
            new TextRun({ text: area.skill_name }),
          ],
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Current Level: ', bold: true }),
            new TextRun({ text: area.current_level }),
            new TextRun({ text: ' → ', bold: true }),
            new TextRun({ text: 'Target Level: ', bold: true }),
            new TextRun({ text: area.target_level }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Annual_CheckIn_${data.teamMemberName.replace(/\s+/g, '_')}_${new Date(data.reviewDate).getFullYear()}.docx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
