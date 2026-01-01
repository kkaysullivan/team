import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  notes: string;
  transcript: string;
}

function generateTopicTitle(points: string[]): string {
  if (points.length === 0) return "General Discussion";

  const commonKeywords = [
    { words: ['project', 'deliverable', 'timeline', 'deadline'], title: 'Project Updates' },
    { words: ['performance', 'goal', 'objective', 'kra', 'metric'], title: 'Performance & Goals' },
    { words: ['team', 'collaboration', 'communication', 'meeting'], title: 'Team Collaboration' },
    { words: ['skill', 'learning', 'training', 'development', 'growth'], title: 'Professional Development' },
    { words: ['challenge', 'issue', 'problem', 'concern', 'blocker'], title: 'Challenges & Concerns' },
    { words: ['feedback', 'review', 'assessment', 'evaluation'], title: 'Feedback & Review' },
    { words: ['career', 'promotion', 'advancement', 'opportunity'], title: 'Career Growth' },
    { words: ['workload', 'capacity', 'bandwidth', 'resource'], title: 'Workload & Capacity' },
    { words: ['client', 'customer', 'stakeholder', 'user'], title: 'Client Relations' },
    { words: ['process', 'workflow', 'efficiency', 'improvement'], title: 'Process Improvements' }
  ];

  const combinedText = points.join(' ').toLowerCase();

  for (const category of commonKeywords) {
    if (category.words.some(word => combinedText.includes(word))) {
      return category.title;
    }
  }

  const firstPoint = points[0];
  const words = firstPoint.split(' ').slice(0, 4);
  if (words.length >= 2) {
    return words.join(' ').replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Discussion Topic';
  }

  return 'Discussion Topic';
}

function generateStructuredSummary(notes: string, transcript: string): string {
  const combinedContent = `${notes}\n\n${transcript}`.trim();

  if (!combinedContent) {
    return "<h1>Meeting Summary</h1><p>No content available to summarize.</p>";
  }

  const lines = combinedContent.split('\n').filter(line => line.trim().length > 0);

  const html: string[] = [
    '<h1 class="text-3xl font-bold text-slate-900 mb-6">Meeting Summary</h1>',
  ];

  const keyPoints: string[] = [];
  const actionItems: string[] = [];
  const topics = new Map<string, string[]>();

  for (const line of lines) {
    const trimmedLine = line.trim();

    const actionKeywords = ['action', 'todo', 'will', 'should', 'need to', 'follow up', 'next step'];
    const isActionItem = actionKeywords.some(keyword =>
      trimmedLine.toLowerCase().includes(keyword)
    );

    if (isActionItem) {
      const cleanedItem = trimmedLine.replace(/^[-*]\s*/, '');
      actionItems.push(cleanedItem);
    } else if (trimmedLine.length > 20) {
      const cleanedItem = trimmedLine.replace(/^[-*]\s*/, '');
      keyPoints.push(cleanedItem);
    }
  }

  if (keyPoints.length === 0 && lines.length > 0) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 20) {
        keyPoints.push(line);
      }
    }
  }

  html.push('<h2 class="text-2xl font-semibold text-slate-800 mb-3 mt-6">Overview</h2>');
  html.push('<p class="text-slate-700 leading-relaxed mb-6">');

  const totalItems = keyPoints.length + actionItems.length;
  if (totalItems > 0) {
    html.push(`One-on-one meeting covering ${keyPoints.length > 0 ? 'key discussion topics' : 'updates'}`);
    if (actionItems.length > 0) {
      html.push(` with ${actionItems.length} action item${actionItems.length > 1 ? 's' : ''} identified.`);
    } else {
      html.push('.');
    }
  } else {
    html.push('Meeting discussion and updates.');
  }
  html.push('</p>');

  html.push('<h2 class="text-2xl font-semibold text-slate-800 mb-3 mt-6">Topics Discussed</h2>');

  if (keyPoints.length > 0) {
    const topicGroups = Math.ceil(keyPoints.length / 3);
    for (let i = 0; i < topicGroups && i < 3; i++) {
      const startIdx = i * 3;
      const endIdx = Math.min(startIdx + 3, keyPoints.length);

      const topicTitle = generateTopicTitle(keyPoints.slice(startIdx, endIdx));
      html.push(`<h3 class="text-xl font-semibold text-slate-700 mb-2 mt-4">${escapeHtml(topicTitle)}</h3>`);
      html.push('<ul class="list-disc list-inside space-y-1.5 mb-4 text-slate-700">');

      for (let j = startIdx; j < endIdx; j++) {
        html.push(`<li class="ml-4">${escapeHtml(keyPoints[j])}</li>`);
      }
      html.push('</ul>');
    }
  } else {
    html.push('<h3 class="text-xl font-semibold text-slate-700 mb-2 mt-4">General Discussion</h3>');
    html.push('<ul class="list-disc list-inside space-y-1.5 mb-4 text-slate-700">');
    html.push('<li class="ml-4">General updates and discussions</li>');
    html.push('</ul>');
  }

  html.push('<h2 class="text-2xl font-semibold text-slate-800 mb-3 mt-6">Action Items</h2>');

  if (actionItems.length > 0) {
    html.push('<ul class="space-y-2 mb-4 text-slate-700">');
    for (const item of actionItems.slice(0, 6)) {
      const ownerMatch = item.match(/\((Owner|owner):\s*([^)]+)\)/i);
      const itemText = ownerMatch ? item : `${item} (Owner: TBD)`;
      html.push(`<li class="flex items-start gap-2"><span class="text-slate-400">☐</span><span>${escapeHtml(itemText)}</span></li>`);
    }
    html.push('</ul>');
  } else {
    html.push('<ul class="space-y-2 mb-4 text-slate-700">');
    html.push('<li class="flex items-start gap-2"><span class="text-slate-400">☐</span><span>No specific action items identified</span></li>');
    html.push('</ul>');
  }

  return html.join('\n');
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { notes, transcript }: RequestBody = await req.json();

    const summary = generateStructuredSummary(notes || '', transcript || '');

    return new Response(
      JSON.stringify({ summary }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating summary:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary' }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});