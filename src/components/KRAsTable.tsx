import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  X,
  Save,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface KeyResponsibility {
  responsibility: string;
  winning_looks_like: string;
  what_it_takes: string[];
}

interface KRA {
  id: string;
  team_member_id: string;
  title: string;
  description: string;
  key_responsibilities: KeyResponsibility[];
  success_metrics: string[];
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  leader_alignment: boolean;
  uploaded_to_paycom: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  position: string;
  department: string;
  role?: string;
}

interface KRAsTableProps {
  teamMemberId: string;
  teamMember: TeamMember;
}

type SortField = 'start_date' | 'title' | 'is_active' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function KRAsTable({ teamMemberId, teamMember }: KRAsTableProps) {
  const [kras, setKras] = useState<KRA[]>([]);
  const [filteredKras, setFilteredKras] = useState<KRA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('start_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showForm, setShowForm] = useState(false);
  const [viewingKra, setViewingKra] = useState<KRA | null>(null);
  const [editingKraId, setEditingKraId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    key_responsibilities: [] as KeyResponsibility[],
    leader_alignment: false,
    uploaded_to_paycom: false,
  });

  useEffect(() => {
    fetchKRAs();
  }, [teamMemberId]);

  useEffect(() => {
    filterAndSort();
  }, [kras, searchQuery, sortField, sortDirection]);

  const fetchKRAs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kras')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKras(data || []);
    } catch (error) {
      console.error('Error fetching KRAs:', error);
    }
    setLoading(false);
  };

  const filterAndSort = () => {
    let filtered = [...kras];

    if (searchQuery) {
      filtered = filtered.filter(
        (kra) =>
          kra.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'start_date') {
        aValue = new Date(a.start_date).getTime();
        bValue = new Date(b.start_date).getTime();
      } else if (sortField === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else if (sortField === 'is_active') {
        aValue = a.is_active ? 1 : 0;
        bValue = b.is_active ? 1 : 0;
      } else if (sortField === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredKras(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const isFormValid = () => {
    const { title, start_date, key_responsibilities } = formData;

    if (!title.trim()) return false;
    if (!start_date) return false;

    if (key_responsibilities.length < 3 || key_responsibilities.length > 5) return false;

    return key_responsibilities.every(kr =>
      kr.responsibility.trim() !== '' &&
      kr.winning_looks_like.trim() !== '' &&
      kr.what_it_takes.length >= 2 &&
      kr.what_it_takes.every(wit => wit.trim() !== '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const kraData = {
        team_member_id: teamMemberId,
        title: formData.title,
        description: '',
        key_responsibilities: formData.key_responsibilities,
        success_metrics: [],
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_active: true,
        leader_alignment: formData.leader_alignment,
        uploaded_to_paycom: formData.uploaded_to_paycom,
      };

      if (editingKraId) {
        const { error } = await supabase
          .from('kras')
          .update(kraData)
          .eq('id', editingKraId);

        if (error) throw error;
      } else {
        await supabase
          .from('kras')
          .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
          .eq('team_member_id', teamMemberId)
          .eq('is_active', true);

        const { error } = await supabase
          .from('kras')
          .insert([kraData]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingKraId(null);
      resetForm();
      fetchKRAs();
    } catch (error) {
      console.error('Error saving KRA:', error);
      alert('Failed to save KRA. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (kra: KRA) => {
    setEditingKraId(kra.id);
    setFormData({
      title: kra.title,
      start_date: kra.start_date,
      end_date: kra.end_date || '',
      key_responsibilities: Array.isArray(kra.key_responsibilities) && kra.key_responsibilities.length > 0
        ? kra.key_responsibilities
        : [],
      leader_alignment: kra.leader_alignment || false,
      uploaded_to_paycom: kra.uploaded_to_paycom || false,
    });
    setShowForm(true);
  };

  const handleView = (kra: KRA) => {
    setViewingKra(kra);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this KRA?')) return;

    try {
      const { error } = await supabase
        .from('kras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchKRAs();
    } catch (error) {
      console.error('Error deleting KRA:', error);
      alert('Failed to delete KRA. Please try again.');
    }
  };

  const handleChecklistUpdate = async (id: string, field: 'leader_alignment' | 'uploaded_to_paycom', value: boolean) => {
    try {
      const { error } = await supabase
        .from('kras')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      fetchKRAs();
    } catch (error) {
      console.error('Error updating checklist:', error);
      alert('Failed to update checklist. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      key_responsibilities: [],
      leader_alignment: false,
      uploaded_to_paycom: false,
    });
  };

  const addResponsibility = () => {
    if (formData.key_responsibilities.length >= 5) return;

    setFormData({
      ...formData,
      key_responsibilities: [
        ...formData.key_responsibilities,
        { responsibility: '', winning_looks_like: '', what_it_takes: ['', ''] }
      ],
    });
  };

  const removeResponsibility = (index: number) => {
    setFormData({
      ...formData,
      key_responsibilities: formData.key_responsibilities.filter((_, i) => i !== index),
    });
  };

  const updateResponsibility = (index: number, field: keyof KeyResponsibility, value: string) => {
    const updated = [...formData.key_responsibilities];
    if (field === 'responsibility' || field === 'winning_looks_like') {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData({ ...formData, key_responsibilities: updated });
  };

  const addWhatItTakes = (krIndex: number) => {
    const updated = [...formData.key_responsibilities];
    updated[krIndex] = {
      ...updated[krIndex],
      what_it_takes: [...updated[krIndex].what_it_takes, '']
    };
    setFormData({ ...formData, key_responsibilities: updated });
  };

  const removeWhatItTakes = (krIndex: number, witIndex: number) => {
    const updated = [...formData.key_responsibilities];
    updated[krIndex] = {
      ...updated[krIndex],
      what_it_takes: updated[krIndex].what_it_takes.filter((_, i) => i !== witIndex)
    };
    setFormData({ ...formData, key_responsibilities: updated });
  };

  const updateWhatItTakes = (krIndex: number, witIndex: number, value: string) => {
    const updated = [...formData.key_responsibilities];
    const updatedWhatItTakes = [...updated[krIndex].what_it_takes];
    updatedWhatItTakes[witIndex] = value;
    updated[krIndex] = {
      ...updated[krIndex],
      what_it_takes: updatedWhatItTakes
    };
    setFormData({ ...formData, key_responsibilities: updated });
  };

  const exportToExcel = (kra: KRA) => {
    try {
      const worksheetData: any[] = [
        ['Key Result Areas'],
        [],
        ['Name:', teamMember.full_name],
        ['Role:', teamMember.role || teamMember.position || 'N/A'],
        ['Summary:', kra.title],
        ['Start Date:', new Date(kra.start_date).toLocaleDateString()],
        ['End Date:', kra.end_date ? new Date(kra.end_date).toLocaleDateString() : 'N/A'],
        ['Status:', kra.is_active ? 'Active' : 'Inactive'],
        ['Leader Alignment:', kra.leader_alignment ? 'Yes' : 'No'],
        ['Uploaded to Paycom:', kra.uploaded_to_paycom ? 'Yes' : 'No'],
        [],
        ['Key Responsibilities'],
        [],
      ];

      if (Array.isArray(kra.key_responsibilities) && kra.key_responsibilities.length > 0) {
        kra.key_responsibilities.forEach((kr, index) => {
          worksheetData.push([`${index + 1}. ${kr.responsibility}`]);
          worksheetData.push(['What winning looks like:', kr.winning_looks_like]);
          worksheetData.push(['What it will take:']);
          if (kr.what_it_takes && kr.what_it_takes.length > 0) {
            kr.what_it_takes.forEach((wit) => {
              worksheetData.push(['', `• ${wit}`]);
            });
          }
          worksheetData.push([]);
        });
      }

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'KRA');

      const fileName = `KRA-${teamMember.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  const exportToPDF = (kra: KRA) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      const ramseyBlue = [0, 119, 200];
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      const logoBase64 = 'data:image/png;base64,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';
      pdf.addImage(logoBase64, 'PNG', margin, yPosition - 3, 40, 12);

      yPosition += 15;
      pdf.setFontSize(28);
      pdf.text('Key Result Areas', margin, yPosition);

      yPosition += 12;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');

      const fieldStartX = margin;
      const labelWidth = 22;

      pdf.text('Name:', fieldStartX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(teamMember.full_name, fieldStartX + labelWidth, yPosition);

      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Role:', fieldStartX, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(teamMember.role || teamMember.position || 'N/A', fieldStartX + labelWidth, yPosition);

      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary:', fieldStartX, yPosition);
      pdf.setFont('helvetica', 'normal');

      const summaryLines = pdf.splitTextToSize(kra.title, pageWidth - margin * 2 - labelWidth);
      pdf.text(summaryLines, fieldStartX + labelWidth, yPosition);
      yPosition += summaryLines.length * 5 + 2;

      yPosition += 8;

      if (Array.isArray(kra.key_responsibilities) && kra.key_responsibilities.length > 0) {
        kra.key_responsibilities.forEach((kr, index) => {
          if (yPosition > pageHeight - 70) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(16);
          pdf.setTextColor(...ramseyBlue);
          pdf.setFont('helvetica', 'bold');
          const kraTitle = `${index + 1}. ${kr.responsibility}`;
          const kraTitleLines = pdf.splitTextToSize(kraTitle, pageWidth - margin * 2);
          pdf.text(kraTitleLines, margin, yPosition);
          yPosition += kraTitleLines.length * 6 + 4;

          if (kr.winning_looks_like) {
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bolditalic');
            pdf.text('What winning looks like:', margin, yPosition);
            yPosition += 5;

            pdf.setFont('helvetica', 'normal');
            const winningLines = pdf.splitTextToSize(kr.winning_looks_like, pageWidth - margin * 2);
            pdf.text(winningLines, margin, yPosition);
            yPosition += winningLines.length * 5 + 2;
          }

          if (kr.what_it_takes && kr.what_it_takes.length > 0) {
            yPosition += 2;
            pdf.setFont('helvetica', 'bolditalic');
            pdf.text('What it will take:', margin, yPosition);
            yPosition += 5;

            pdf.setFont('helvetica', 'normal');
            kr.what_it_takes.forEach((wit) => {
              if (yPosition > pageHeight - 35) {
                pdf.addPage();
                yPosition = margin;
              }

              pdf.setFillColor(0, 0, 0);
              pdf.circle(margin + 2, yPosition - 1, 0.7, 'F');

              const witLines = pdf.splitTextToSize(wit, pageWidth - margin * 2 - 7);
              pdf.text(witLines, margin + 5, yPosition);
              yPosition += witLines.length * 5 + 1;
            });
          }

          yPosition += 6;
        });
      }

      yPosition = Math.max(yPosition, pageHeight - 50);

      const signatureY = pageHeight - 25;
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');

      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, signatureY, margin + 70, signatureY);
      pdf.text("Team Member's Signature", margin, signatureY + 4);

      const dateX = pageWidth - margin - 60;
      pdf.line(dateX, signatureY, dateX + 60, signatureY);
      pdf.text('Date', dateX, signatureY + 4);

      const stripeStartX = pageWidth - 35;
      const stripeStartY = pageHeight - 45;
      pdf.setDrawColor(...ramseyBlue);
      pdf.setLineWidth(3);

      for (let i = 0; i < 6; i++) {
        const x1 = stripeStartX + (i * 4);
        const y1 = stripeStartY;
        const x2 = x1 + 25;
        const y2 = pageHeight - 5;

        pdf.line(x1, y1, x2, y2);
      }

      const fileName = `KRA-${teamMember.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    // Parse the date string in YYYY-MM-DD format without timezone conversion
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const renderKRAForm = () => {
    const isEditing = !!editingKraId;

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">
          {isEditing ? 'Edit KRA' : 'New KRA'}
        </h4>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Summary *
            </label>
            <textarea
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Provide a brief summary of this KRA..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">Leave blank if currently active</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-slate-900 mb-3">Checklist</h5>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.leader_alignment}
                  onChange={(e) => setFormData({ ...formData, leader_alignment: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Leader alignment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.uploaded_to_paycom}
                  onChange={(e) => setFormData({ ...formData, uploaded_to_paycom: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Uploaded to Paycom</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Key Responsibilities *
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Add 3-5 key responsibilities. Each must have at least 2 "What it will take" items.
                </p>
              </div>
              {formData.key_responsibilities.length < 5 && (
                <button
                  type="button"
                  onClick={addResponsibility}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Responsibility
                </button>
              )}
            </div>

            {formData.key_responsibilities.length === 0 ? (
              <div className="text-center py-8 bg-white border-2 border-dashed border-slate-300 rounded-lg">
                <p className="text-slate-600 mb-3">No key responsibilities added yet</p>
                <button
                  type="button"
                  onClick={addResponsibility}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Responsibility
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.key_responsibilities.map((kr, krIndex) => (
                  <div key={krIndex} className="bg-white border border-slate-300 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">
                        Responsibility {krIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeResponsibility(krIndex)}
                        className="text-red-600 hover:text-red-700"
                        title="Remove responsibility"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={kr.responsibility}
                          onChange={(e) => updateResponsibility(krIndex, 'responsibility', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter key responsibility..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          What winning looks like:
                        </label>
                        <textarea
                          value={kr.winning_looks_like}
                          onChange={(e) => updateResponsibility(krIndex, 'winning_looks_like', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Describe what success looks like for this responsibility..."
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-slate-600">
                            What it will take: (min 2)
                          </label>
                          <button
                            type="button"
                            onClick={() => addWhatItTakes(krIndex)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            + Add Item
                          </button>
                        </div>
                        <div className="space-y-2">
                          {kr.what_it_takes.map((wit, witIndex) => (
                            <div key={witIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={wit}
                                onChange={(e) => updateWhatItTakes(krIndex, witIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Enter what it will take..."
                                required
                              />
                              {kr.what_it_takes.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeWhatItTakes(krIndex, witIndex)}
                                  className="px-2 text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              {formData.key_responsibilities.length < 3 && (
                <span className="text-orange-600">
                  Add at least {3 - formData.key_responsibilities.length} more {3 - formData.key_responsibilities.length === 1 ? 'responsibility' : 'responsibilities'}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingKraId(null);
                  resetForm();
                }}
                disabled={formLoading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading || !isFormValid()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {formLoading ? 'Saving...' : isEditing ? 'Update KRA' : 'Create KRA'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const renderViewModal = () => {
    if (!viewingKra) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900">View KRA</h3>
            <button
              onClick={() => setViewingKra(null)}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-semibold text-slate-900">{viewingKra.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  viewingKra.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {viewingKra.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-slate-500">
                <span>Start: {formatDate(viewingKra.start_date)}</span>
                {viewingKra.end_date && (
                  <span>End: {formatDate(viewingKra.end_date)}</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-slate-900 mb-3">Checklist</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={viewingKra.leader_alignment}
                    disabled
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                  />
                  <span className="text-sm text-slate-700">Leader alignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={viewingKra.uploaded_to_paycom}
                    disabled
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                  />
                  <span className="text-sm text-slate-700">Uploaded to Paycom</span>
                </div>
              </div>
            </div>

            {Array.isArray(viewingKra.key_responsibilities) && viewingKra.key_responsibilities.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-semibold text-slate-900">Key Responsibilities</h5>
                {viewingKra.key_responsibilities.map((kr, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h6 className="font-semibold text-slate-900 mb-2">
                      {index + 1}. {kr.responsibility}
                    </h6>
                    {kr.winning_looks_like && (
                      <p className="text-sm text-slate-600 italic mb-2">
                        <span className="font-medium">What winning looks like:</span> {kr.winning_looks_like}
                      </p>
                    )}
                    {kr.what_it_takes && kr.what_it_takes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">What it will take:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          {kr.what_it_takes.map((wit, witIndex) => (
                            <li key={witIndex} className="text-sm text-slate-600">{wit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
            <button
              onClick={() => setViewingKra(null)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm) {
    return renderKRAForm();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Key Result Areas</h3>
            <p className="text-slate-600 text-sm leading-relaxed mt-1">
              Key Results Area (KRA) is a living document that defines what "winning" looks like for a specific role.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            New KRA
          </button>
        </div>
      </div>

      {filteredKras.filter(k => k.is_active).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-slate-900">Active KRA</h4>
          {filteredKras.filter(k => k.is_active).map((kra) => (
            <div key={kra.id} className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-slate-900">{kra.title}</h4>
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500 mt-2">
                    <span>Start: {formatDate(kra.start_date)}</span>
                    {kra.end_date && (
                      <span>End: {formatDate(kra.end_date)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(kra)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(kra.id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <h5 className="text-sm font-semibold text-slate-900 mb-3">Checklist</h5>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kra.leader_alignment}
                      onChange={(e) => handleChecklistUpdate(kra.id, 'leader_alignment', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Leader alignment</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kra.uploaded_to_paycom}
                      onChange={(e) => handleChecklistUpdate(kra.id, 'uploaded_to_paycom', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Uploaded to Paycom</span>
                  </label>
                </div>
              </div>

              {Array.isArray(kra.key_responsibilities) && kra.key_responsibilities.length > 0 && (
                <div className="space-y-4">
                  {kra.key_responsibilities.map((kr, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <h5 className="font-semibold text-slate-900 mb-2">
                        {index + 1}. {kr.responsibility}
                      </h5>
                      {kr.winning_looks_like && (
                        <p className="text-sm text-slate-600 italic mb-2">
                          <span className="font-medium">What winning looks like:</span> {kr.winning_looks_like}
                        </p>
                      )}
                      {kr.what_it_takes && kr.what_it_takes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">What it will take:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            {kr.what_it_takes.map((wit, witIndex) => (
                              <li key={witIndex} className="text-sm text-slate-600">{wit}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search KRAs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('start_date')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Start Date
                    {getSortIcon('start_date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Title
                    {getSortIcon('title')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('is_active')}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wider hover:text-slate-900 transition"
                  >
                    Status
                    {getSortIcon('is_active')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredKras.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? 'No KRAs found matching your search' : 'No KRAs yet'}
                  </td>
                </tr>
              ) : (
                filteredKras.map((kra) => (
                  <tr key={kra.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-slate-900">
                        {formatDate(kra.start_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-900 line-clamp-2">
                        {kra.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        kra.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {kra.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {kra.is_active ? (
                          <>
                            <button
                              onClick={() => handleEdit(kra)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(kra.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                            <button
                              onClick={() => exportToExcel(kra)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              Download
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleView(kra)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleEdit(kra)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(kra.id)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                            <button
                              onClick={() => exportToExcel(kra)}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              Download
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredKras.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {filteredKras.length} of {kras.length} KRA{kras.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {renderViewModal()}
    </div>
  );
}
