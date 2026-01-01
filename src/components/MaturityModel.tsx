import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, User as UserIcon, TrendingUp, Award, Target, Briefcase, Users, GraduationCap, ShieldCheck, Sparkles, Lightbulb, Code, AlertTriangle, CheckCircle2, TrendingDown, Share2, Copy, Check } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  role_id: string | null;
  current_level: string;
}

interface MaturityModel {
  id: string;
  name: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

interface Skill {
  id: string;
  name: string;
  description: string;
}

interface SkillLevel {
  id: string;
  skill_id: string;
  level_id: string;
  description: string;
  display_order: number;
  level_name?: string;
}

interface Assessment {
  id?: string;
  team_member_id: string;
  skill_id: string;
  leader_rating: string | null;
  self_rating: string | null;
  notes: string;
}

interface MaturityModelProps {
  teamMemberId?: string;
}

const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, any> = {
    'Business Acumen': Briefcase,
    'Collaboration': Users,
    'Coachability': GraduationCap,
    'Professionalism': ShieldCheck,
    'Craft Excellence': Sparkles,
    'Brand IQ': Lightbulb,
    'Technical Skill': Code,
  };
  return iconMap[categoryName] || Target;
};

export default function MaturityModel({ teamMemberId }: MaturityModelProps) {
  const { user } = useAuth();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [maturityModel, setMaturityModel] = useState<MaturityModel | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [categorySkills, setCategorySkills] = useState<Record<string, string[]>>({});
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'overview' | 'edit'>('overview');
  const [assessmentLink, setAssessmentLink] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    if (teamMemberId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [teamMemberId]);

  useEffect(() => {
    if (teamMemberId) {
      fetchAssessments();
    }
  }, [teamMemberId]);

  const loadData = async () => {
    if (!teamMemberId) return;

    setLoading(true);

    const { data: memberData } = await supabase
      .from('team_members')
      .select('id, full_name, role, role_id, current_level')
      .eq('id', teamMemberId)
      .maybeSingle();

    if (!memberData) {
      setLoading(false);
      return;
    }

    setMember(memberData);

    if (!memberData.role_id) {
      setMaturityModel(null);
      setCategories([]);
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from('roles')
      .select('maturity_model_id')
      .eq('id', memberData.role_id)
      .maybeSingle();

    if (!roleData?.maturity_model_id) {
      setMaturityModel(null);
      setCategories([]);
      setLoading(false);
      return;
    }

    const [modelResult, modelCategoriesResult, levelsResult] = await Promise.all([
      supabase.from('maturity_models').select('*').eq('id', roleData.maturity_model_id).maybeSingle(),
      supabase
        .from('maturity_model_categories')
        .select(`
          category_id,
          display_order,
          maturity_categories (id, name, description)
        `)
        .eq('maturity_model_id', roleData.maturity_model_id)
        .order('display_order'),
      supabase.from('levels').select('id, name').order('created_at'),
    ]);

    if (modelResult.data) {
      setMaturityModel(modelResult.data);
    }

    if (modelCategoriesResult.data) {
      const cats = modelCategoriesResult.data
        .map((mc: any) => ({
          id: mc.maturity_categories.id,
          name: mc.maturity_categories.name,
          description: mc.maturity_categories.description,
          display_order: mc.display_order,
        }))
        .sort((a: Category, b: Category) => a.display_order - b.display_order);

      setCategories(cats);

      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }

      const categoryIds = cats.map((c: Category) => c.id);
      if (categoryIds.length > 0) {
        const [categorySkillsResult, skillsResult, skillLevelsResult] = await Promise.all([
          supabase.from('category_skills').select('*').in('category_id', categoryIds),
          supabase.from('maturity_skills').select('*'),
          supabase.from('skill_levels').select('*').order('display_order'),
        ]);

        if (skillsResult.data) {
          setSkills(skillsResult.data);
        }

        if (categorySkillsResult.data) {
          const csMap: Record<string, string[]> = {};
          categorySkillsResult.data.forEach((cs: any) => {
            if (!csMap[cs.category_id]) {
              csMap[cs.category_id] = [];
            }
            csMap[cs.category_id].push(cs.skill_id);
          });
          setCategorySkills(csMap);
        }

        if (skillLevelsResult.data && levelsResult.data) {
          const enriched = skillLevelsResult.data.map((sl: any) => ({
            ...sl,
            level_name: levelsResult.data.find((l: any) => l.id === sl.level_id)?.name,
          }));
          setSkillLevels(enriched);
        }
      }
    }

    setLoading(false);
  };

  const fetchAssessments = async () => {
    if (!teamMemberId) return;

    const { data } = await supabase
      .from('maturity_assessments')
      .select('*')
      .eq('team_member_id', teamMemberId);

    if (data) {
      setAssessments(data);
      const notesMap: Record<string, string> = {};
      data.forEach((assessment) => {
        notesMap[assessment.skill_id] = assessment.notes || '';
      });
      setNotes(notesMap);
    }
  };

  const handleRatingClick = (skillId: string, levelId: string, ratingType: 'leader' | 'self') => {
    const existingAssessment = assessments.find((a) => a.skill_id === skillId);

    if (existingAssessment) {
      setAssessments(
        assessments.map((a) =>
          a.skill_id === skillId
            ? {
                ...a,
                [ratingType === 'leader' ? 'leader_rating' : 'self_rating']: levelId,
              }
            : a
        )
      );
    } else {
      setAssessments([
        ...assessments,
        {
          team_member_id: teamMemberId!,
          skill_id: skillId,
          leader_rating: ratingType === 'leader' ? levelId : null,
          self_rating: ratingType === 'self' ? levelId : null,
          notes: '',
        },
      ]);
    }
  };

  const handleNotesChange = (skillId: string, value: string) => {
    setNotes({ ...notes, [skillId]: value });

    const existingAssessment = assessments.find((a) => a.skill_id === skillId);
    if (existingAssessment) {
      setAssessments(
        assessments.map((a) => (a.skill_id === skillId ? { ...a, notes: value } : a))
      );
    }
  };

  const handleSave = async () => {
    if (!teamMemberId || assessments.length === 0 || !user) return;

    setSaving(true);
    setSaveSuccess(false);

    const dataToSave = assessments.map((assessment) => ({
      team_member_id: assessment.team_member_id,
      skill_id: assessment.skill_id,
      leader_rating: assessment.leader_rating,
      self_rating: assessment.self_rating,
      notes: notes[assessment.skill_id] || '',
      assessor_id: user.id,
    }));

    const { error } = await supabase
      .from('maturity_assessments')
      .upsert(dataToSave, {
        onConflict: 'team_member_id,skill_id',
      });

    if (error) {
      console.error('Error saving assessments:', error);
    } else {
      setSaveSuccess(true);
      await fetchAssessments();
      setTimeout(() => {
        setSaveSuccess(false);
        setViewMode('overview');
      }, 1500);
    }

    setSaving(false);
  };

  const generateSelfAssessmentLink = async () => {
    if (!teamMemberId) return;

    setGeneratingLink(true);

    try {
      const { data: existingToken } = await supabase
        .from('self_assessment_tokens')
        .select('token, expires_at')
        .eq('team_member_id', teamMemberId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      let token = existingToken?.token;

      if (!token) {
        const { data: newToken, error } = await supabase
          .from('self_assessment_tokens')
          .insert({ team_member_id: teamMemberId })
          .select('token')
          .single();

        if (error) throw error;
        token = newToken.token;
      }

      const baseUrl = window.location.origin;
      const link = `${baseUrl}?token=${token}`;
      setAssessmentLink(link);
      setShowLinkModal(true);
    } catch (error) {
      console.error('Error generating assessment link:', error);
      alert('Failed to generate assessment link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(assessmentLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getRating = (skillId: string, ratingType: 'leader' | 'self'): string | null => {
    const assessment = assessments.find((a) => a.skill_id === skillId);
    return assessment ? (ratingType === 'leader' ? assessment.leader_rating : assessment.self_rating) : null;
  };

  const getCategorySkills = (categoryId?: string) => {
    const catId = categoryId || selectedCategory;
    const skillIds = categorySkills[catId] || [];
    return skills
      .filter((s) => skillIds.includes(s.id))
      .sort((a, b) => {
        const aIndex = skillIds.indexOf(a.id);
        const bIndex = skillIds.indexOf(b.id);
        return aIndex - bIndex;
      });
  };

  const getAllSkills = () => {
    return categories.map((category) => ({
      category,
      skills: getCategorySkills(category.id),
    }));
  };

  const handleEditCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setViewMode('edit');
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
  };

  const getSkillLevels = (skillId: string) => {
    return skillLevels
      .filter((sl) => sl.skill_id === skillId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getLevelNames = () => {
    if (categorySkills[selectedCategory]?.length > 0) {
      const firstSkillId = categorySkills[selectedCategory][0];
      const levels = getSkillLevels(firstSkillId);
      return levels.map((sl) => sl.level_name || '');
    }
    return [];
  };

  const getLevelScore = (levelName: string | null): number => {
    if (!levelName) return 0;
    const normalized = levelName.toLowerCase();
    if (normalized.includes('associate')) return 0;
    if (normalized.includes('level 1')) return 1;
    if (normalized.includes('level 2')) return 2;
    if (normalized.includes('senior')) return 3;
    if (normalized.includes('lead')) return 4;
    return 0;
  };

  const getOverallLevelName = (avgScore: number): string => {
    if (avgScore >= 3.8) return 'Lead';
    if (avgScore >= 2.8) return 'Senior Level';
    if (avgScore >= 1.8) return 'Level 2';
    if (avgScore >= 0.8) return 'Level 1';
    return 'Associate';
  };

  const calculateScores = () => {
    const scoredSkills = assessments
      .map((assessment) => {
        const skill = skills.find((s) => s.id === assessment.skill_id);
        const levels = getSkillLevels(assessment.skill_id);
        const leaderLevel = levels.find((l) => l.level_id === assessment.leader_rating);
        const selfLevel = levels.find((l) => l.level_id === assessment.self_rating);

        const leaderScore = getLevelScore(leaderLevel?.level_name || null);
        const selfScore = getLevelScore(selfLevel?.level_name || null);

        return {
          skillId: assessment.skill_id,
          skillName: skill?.name || '',
          leaderScore,
          selfScore,
          leaderLevelName: leaderLevel?.level_name || 'Not Rated',
          selfLevelName: selfLevel?.level_name || 'Not Rated',
        };
      })
      .filter((s) => s.leaderScore > 0 || s.selfScore > 0);

    const totalLeaderScore = scoredSkills.reduce((sum, s) => sum + s.leaderScore, 0);
    const totalSelfScore = scoredSkills.reduce((sum, s) => sum + s.selfScore, 0);
    const count = scoredSkills.length;

    const avgLeaderScore = count > 0 ? totalLeaderScore / count : 0;
    const avgSelfScore = count > 0 ? totalSelfScore / count : 0;

    const strengths = scoredSkills
      .filter((s) => s.leaderScore >= 3)
      .sort((a, b) => b.leaderScore - a.leaderScore);

    const growthOpportunities = scoredSkills
      .filter((s) => s.leaderScore < 3)
      .sort((a, b) => a.leaderScore - b.leaderScore);

    return {
      avgLeaderScore,
      avgSelfScore,
      leaderLevel: getOverallLevelName(avgLeaderScore),
      selfLevel: getOverallLevelName(avgSelfScore),
      strengths,
      growthOpportunities,
      totalSkillsRated: count,
    };
  };

  const calculateCategoryScore = (categoryId: string) => {
    const catSkillIds = categorySkills[categoryId] || [];
    const categoryAssessments = assessments.filter((a) => catSkillIds.includes(a.skill_id));

    const scoredSkills = categoryAssessments
      .map((assessment) => {
        const levels = getSkillLevels(assessment.skill_id);
        const leaderLevel = levels.find((l) => l.level_id === assessment.leader_rating);
        const leaderScore = getLevelScore(leaderLevel?.level_name || null);
        return leaderScore;
      })
      .filter((score) => score > 0);

    if (scoredSkills.length === 0) return null;

    const avgScore = scoredSkills.reduce((sum, score) => sum + score, 0) / scoredSkills.length;
    return {
      avgScore,
      levelName: getOverallLevelName(avgScore),
      skillsRated: scoredSkills.length,
    };
  };

  const calculateAverageCategoryScore = () => {
    const categoryScores = categories
      .map((category) => calculateCategoryScore(category.id))
      .filter((score) => score !== null);

    if (categoryScores.length === 0) return null;

    const totalScore = categoryScores.reduce((sum, score) => sum + score!.avgScore, 0);
    const avgScore = totalScore / categoryScores.length;

    return {
      avgScore,
      levelName: getOverallLevelName(avgScore),
      categoriesRated: categoryScores.length,
    };
  };

  const hasSignificantRatingGap = (skillId: string): boolean => {
    const leaderRating = getRating(skillId, 'leader');
    const selfRating = getRating(skillId, 'self');

    if (!leaderRating || !selfRating) return false;

    const levels = getSkillLevels(skillId);
    const leaderLevel = levels.find((l) => l.level_id === leaderRating);
    const selfLevel = levels.find((l) => l.level_id === selfRating);

    const leaderScore = getLevelScore(leaderLevel?.level_name || null);
    const selfScore = getLevelScore(selfLevel?.level_name || null);

    return Math.abs(leaderScore - selfScore) >= 2;
  };

  const getGrowthIndicator = (): { status: 'needs-coaching' | 'on-track' | 'promotion-ready'; label: string; description: string } | null => {
    if (!member?.current_level || !avgCategoryScore) return null;

    const memberLevel = member.current_level;
    const avgScore = avgCategoryScore.avgScore;

    // Define level ranges
    const levelRanges: Record<string, { min: number; max: number }> = {
      'Associate': { min: 0.0, max: 0.7 },
      'Level 1': { min: 0.8, max: 1.7 },
      'Level 2': { min: 1.8, max: 2.7 },
      'Senior Level': { min: 2.8, max: 3.7 },
      'Lead': { min: 3.8, max: 4.0 },
    };

    const range = levelRanges[memberLevel];
    if (!range) return null;

    // Round to 1 decimal place for comparison to handle floating point precision
    const roundedScore = Math.round(avgScore * 10) / 10;
    const promotionThreshold = Math.round((range.max - 0.3) * 10) / 10;

    // Needs Coaching: lower than the actual level range
    if (roundedScore < range.min) {
      return {
        status: 'needs-coaching',
        label: 'Needs Coaching',
        description: 'Below expected level range',
      };
    }

    // Promotion Ready: within 0.3 of the top of the range or exceeds it
    if (roundedScore >= promotionThreshold) {
      return {
        status: 'promotion-ready',
        label: 'Promotion Ready',
        description: 'Performing at or above level expectations',
      };
    }

    // On Track: within the range
    return {
      status: 'on-track',
      label: 'On Track',
      description: 'Meeting level expectations',
    };
  };

  const categorySkillsList = getCategorySkills();
  const levelNames = getLevelNames();
  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
  const scores = calculateScores();
  const allCategorySkills = getAllSkills();
  const avgCategoryScore = calculateAverageCategoryScore();
  const growthIndicator = getGrowthIndicator();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teamMemberId) {
    return (
      <div className="text-center py-12">
        <UserIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No team member selected</p>
      </div>
    );
  }

  if (!maturityModel) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <p className="text-slate-600">No maturity model assigned to this team member's role.</p>
        <p className="text-sm text-slate-500 mt-2">
          Assign a role with a maturity model in Admin settings.
        </p>
      </div>
    );
  }

  if (viewMode === 'overview') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Maturity Model</h1>
          <p className="text-slate-600 mt-1">Evaluate skills and track development progress</p>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={generateSelfAssessmentLink}
            disabled={generatingLink}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingLink ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Generating...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share Self-Assessment</span>
              </>
            )}
          </button>

          <div className="flex gap-4">
            {growthIndicator && (
              <div
                className={`border-2 rounded-lg p-4 min-w-[200px] ${
                  growthIndicator.status === 'needs-coaching'
                    ? 'bg-red-50 border-red-300'
                    : growthIndicator.status === 'promotion-ready'
                    ? 'bg-green-50 border-green-300'
                    : 'bg-blue-50 border-blue-300'
                }`}
              >
                <p className="text-sm text-slate-600 mb-2 text-center">Growth Status</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {growthIndicator.status === 'needs-coaching' && (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                  {growthIndicator.status === 'on-track' && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  )}
                  {growthIndicator.status === 'promotion-ready' && (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  )}
                  <span
                    className={`text-lg font-bold ${
                      growthIndicator.status === 'needs-coaching'
                        ? 'text-red-700'
                        : growthIndicator.status === 'promotion-ready'
                        ? 'text-green-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {growthIndicator.label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 text-center">
                  {growthIndicator.description}
                </p>
                {member && (
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Current Level: {member.current_level}
                  </p>
                )}
              </div>
            )}
            {avgCategoryScore && (
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 min-w-[200px]">
                <p className="text-sm text-slate-600 mb-2 text-center">Category Average</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {avgCategoryScore.avgScore.toFixed(1)}
                  </span>
                  <span className="text-lg text-slate-600">/ 4.0</span>
                </div>
                <p className="text-base font-semibold text-blue-700 mt-2 text-center">
                  {avgCategoryScore.levelName}
                </p>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  {avgCategoryScore.categoriesRated} categor{avgCategoryScore.categoriesRated !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            )}
          </div>
        </div>

        {scores.totalSkillsRated > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-blue-600" />
              <h4 className="text-lg font-semibold text-slate-900">Overall Score</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-2">Leader Assessment</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {scores.avgLeaderScore.toFixed(1)}
                  </span>
                  <span className="text-lg text-slate-600">/ 4.0</span>
                </div>
                <p className="text-lg font-semibold text-blue-700 mt-1">{scores.leaderLevel}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">Team Member Assessment</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-600">
                    {scores.avgSelfScore.toFixed(1)}
                  </span>
                  <span className="text-lg text-slate-600">/ 4.0</span>
                </div>
                <p className="text-lg font-semibold text-slate-700 mt-1">{scores.selfLevel}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-slate-600">
                Based on {scores.totalSkillsRated} rated skill{scores.totalSkillsRated !== 1 ? 's' : ''} across all categories
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {allCategorySkills.map(({ category, skills: catSkills }) => {
            const CategoryIcon = getCategoryIcon(category.name);
            return (
              <div key={category.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <CategoryIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                    </div>
                  </div>
                <button
                  onClick={() => handleEditCategory(category.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Edit
                </button>
              </div>
              <div className="p-4">
                {catSkills.length === 0 ? (
                  <p className="text-slate-500 text-sm">No skills in this category.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {catSkills.map((skill) => {
                        const leaderRating = getRating(skill.id, 'leader');
                        const selfRating = getRating(skill.id, 'self');
                        const skillLevelsForSkill = getSkillLevels(skill.id);
                        const leaderLevelData = skillLevelsForSkill.find((sl) => sl.level_id === leaderRating);
                        const selfLevelData = skillLevelsForSkill.find((sl) => sl.level_id === selfRating);
                        const hasGap = hasSignificantRatingGap(skill.id);

                        return (
                          <div key={skill.id} className={`border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 ${hasGap ? 'bg-amber-50 -mx-4 px-4 py-3 border-l-4 border-l-amber-400' : ''}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div>
                                  <p className="font-medium text-slate-900">{skill.name}</p>
                                  {hasGap && (
                                    <p className="text-xs text-amber-700 font-medium mt-1">Significant rating gap - needs discussion</p>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{skill.description}</p>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <div className="text-right">
                                  <p className="text-xs text-slate-500 mb-1">Leader</p>
                                  <p className={`font-medium ${leaderLevelData ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {leaderLevelData?.level_name || 'Not rated'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500 mb-1">Team Member</p>
                                  <p className={`font-medium ${selfLevelData ? 'text-green-600' : 'text-slate-400'}`}>
                                    {selfLevelData?.level_name || 'Not rated'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(() => {
                      const categoryScore = calculateCategoryScore(category.id);
                      if (categoryScore) {
                        return (
                          <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-slate-900">Average Rating</span>
                              </div>
                              <div className="text-right">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-bold text-blue-600">
                                    {categoryScore.avgScore.toFixed(1)}
                                  </span>
                                  <span className="text-slate-600">/ 4.0</span>
                                </div>
                                <p className="text-sm font-medium text-blue-700 mt-1">{categoryScore.levelName}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Based on {categoryScore.skillsRated} skill{categoryScore.skillsRated !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {showLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Share2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Self-Assessment Link</h2>
                    <p className="text-sm text-slate-600 mt-1">Share this link with {member?.full_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 font-mono break-all">{assessmentLink}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyLinkToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Note:</strong> This link will expire in 30 days. The team member can use it to complete their self-assessment for all skills in the maturity model.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <button
          onClick={handleBackToOverview}
          className="text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          ← Back to Overview
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Edit Ratings</h1>
        <p className="text-slate-600 mt-1">Rate skills for each level</p>
      </div>

      {categories.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCategoryData && (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">{selectedCategoryData.name}</h3>
              <p className="text-slate-600 mt-1">{selectedCategoryData.description}</p>
            </div>

        {categorySkillsList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-600">No skills assigned to this category.</p>
            <p className="text-sm text-slate-500 mt-2">
              Add skills to categories in Admin settings.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="text-left p-4 font-semibold text-slate-900 min-w-[200px]">
                      Skill
                    </th>
                    <th className="text-left p-2 font-semibold text-slate-900 w-20">
                      Rating By
                    </th>
                    {levelNames.map((level) => (
                      <th
                        key={level}
                        className="text-left p-4 font-semibold text-slate-900 min-w-[180px]"
                      >
                        {level}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categorySkillsList.map((skill) => {
                    const leaderRating = getRating(skill.id, 'leader');
                    const selfRating = getRating(skill.id, 'self');
                    const skillLevelsForSkill = getSkillLevels(skill.id);

                    return (
                      <>
                        <tr key={`${skill.id}-leader`} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-900 align-top" rowSpan={2}>
                            {skill.name}
                          </td>
                          <td className="p-2 text-sm text-slate-600 align-top">
                            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              Leader
                            </div>
                          </td>
                          {levelNames.map((levelName) => {
                            const levelData = skillLevelsForSkill.find(
                              (sl) => sl.level_name === levelName
                            );
                            const isSelected = leaderRating === levelData?.level_id;

                            return (
                              <td
                                key={levelName}
                                className={`p-3 align-top cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-100 border-2 border-blue-500'
                                    : 'border border-slate-200 hover:bg-slate-100'
                                }`}
                                onClick={() => levelData && handleRatingClick(skill.id, levelData.level_id, 'leader')}
                              >
                                <p className="text-sm text-slate-700">
                                  {levelData?.description || ''}
                                </p>
                              </td>
                            );
                          })}
                        </tr>
                        <tr key={`${skill.id}-self`} className="border-b-2 border-slate-300">
                          <td className="p-2 text-sm text-slate-600 align-top">
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              Team Member
                            </div>
                          </td>
                          {levelNames.map((levelName) => {
                            const levelData = skillLevelsForSkill.find(
                              (sl) => sl.level_name === levelName
                            );
                            const isSelected = selfRating === levelData?.level_id;

                            return (
                              <td
                                key={levelName}
                                className={`p-3 align-top cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-green-100 border-2 border-green-500'
                                    : 'border border-slate-200 hover:bg-slate-100'
                                }`}
                                onClick={() => levelData && handleRatingClick(skill.id, levelData.level_id, 'self')}
                              >
                                <p className="text-sm text-slate-700">
                                  {levelData?.description || ''}
                                </p>
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-4">
              <h4 className="font-semibold text-slate-900">Notes (Optional)</h4>
              {categorySkillsList.map((skill) => {
                const leaderRating = getRating(skill.id, 'leader');
                const selfRating = getRating(skill.id, 'self');
                if (!leaderRating && !selfRating) return null;

                return (
                  <div key={skill.id} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      {skill.name}
                    </label>
                    <textarea
                      value={notes[skill.id] || ''}
                      onChange={(e) => handleNotesChange(skill.id, e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any additional notes or context..."
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-4 mt-6">
              {saveSuccess && (
                <div className="text-green-600 font-medium">
                  Assessment saved successfully!
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving || assessments.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Assessment'}
              </button>
            </div>
          </>
        )}
      </>
      )}
    </div>
  );
}
