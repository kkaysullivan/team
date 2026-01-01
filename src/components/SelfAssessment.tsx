import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle, Loader, Award, Target, ArrowRight, ChevronRight, ChevronLeft, Circle } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  role_id: string | null;
  current_level: string;
  manager_id: string;
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

interface Level {
  id: string;
  name: string;
  description: string;
}

interface Assessment {
  skill_id: string;
  self_rating: string | null;
}

type ViewState = 'welcome' | 'assessing' | 'success';

export default function SelfAssessment() {
  const [viewState, setViewState] = useState<ViewState>('welcome');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [token, setToken] = useState<string>('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [categorySkills, setCategorySkills] = useState<Record<string, string[]>>({});
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setError('No assessment token provided');
      setLoading(false);
    }
  }, []);

  const validateToken = async (tokenValue: string) => {
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('self_assessment_tokens')
        .select('*, team_members(*)')
        .eq('token', tokenValue)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (tokenError || !tokenData) {
        setError('Invalid or expired assessment link');
        setTokenValid(false);
        setLoading(false);
        return;
      }

      setTokenValid(true);
      setMember(tokenData.team_members as TeamMember);
      await loadAssessmentData(tokenData.team_members.id, tokenData.team_members.role_id);
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to validate assessment link');
      setTokenValid(false);
      setLoading(false);
    }
  };

  const loadAssessmentData = async (memberId: string, roleId: string | null) => {
    try {
      console.log('Loading assessment data for member:', memberId, 'role:', roleId);

      const { data: levelsData, error: levelsError } = await supabase
        .from('levels')
        .select('*')
        .order('name');

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('maturity_categories')
        .select('*')
        .order('display_order');

      const { data: skillsData, error: skillsError } = await supabase
        .from('maturity_skills')
        .select('*')
        .order('display_order');

      const { data: skillLevelsData, error: skillLevelsError } = await supabase
        .from('skill_levels')
        .select('*, levels(name)');

      const { data: categorySkillsData, error: categorySkillsError } = await supabase
        .from('category_skills')
        .select('*')
        .order('display_order');

      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('maturity_assessments')
        .select('skill_id, self_rating')
        .eq('team_member_id', memberId);

      console.log('Data loaded:', {
        levels: levelsData?.length,
        categories: categoriesData?.length,
        skills: skillsData?.length,
        skillLevels: skillLevelsData?.length,
        categorySkills: categorySkillsData?.length,
        assessments: assessmentsData?.length
      });

      console.log('Errors:', {
        levelsError,
        categoriesError,
        skillsError,
        skillLevelsError,
        categorySkillsError,
        assessmentsError
      });

      if (levelsData) setLevels(levelsData);
      if (categoriesData) {
        setCategories(categoriesData);
      }
      if (skillsData) setSkills(skillsData);
      if (skillLevelsData) {
        const levelsWithNames = skillLevelsData.map(sl => ({
          ...sl,
          level_name: (sl.levels as any)?.name || ''
        }));
        setSkillLevels(levelsWithNames);
      }

      if (categorySkillsData) {
        const csMap: Record<string, string[]> = {};
        categorySkillsData.forEach(cs => {
          if (!csMap[cs.category_id]) {
            csMap[cs.category_id] = [];
          }
          csMap[cs.category_id].push(cs.skill_id);
        });
        console.log('Category skills map:', csMap);
        setCategorySkills(csMap);
      }

      // Always start with empty assessments for a fresh self-assessment
      setAssessments([]);

      setLoading(false);
    } catch (err) {
      console.error('Error loading assessment data:', err);
      setError('Failed to load assessment data');
      setLoading(false);
    }
  };

  const handleRatingChange = (skillId: string, levelId: string) => {
    let updatedAssessments: Assessment[] = [];

    setAssessments(prev => {
      const existing = prev.find(a => a.skill_id === skillId);
      if (existing) {
        updatedAssessments = prev.map(a => a.skill_id === skillId ? { ...a, self_rating: levelId } : a);
      } else {
        updatedAssessments = [...prev, { skill_id: skillId, self_rating: levelId }];
      }
      return updatedAssessments;
    });

    // Auto-scroll to next unanswered question
    setTimeout(() => {
      const currentCategory = getCurrentCategory();
      if (!currentCategory) return;

      const categorySkillIds = categorySkills[currentCategory.id] || [];
      const currentSkillIndex = categorySkillIds.indexOf(skillId);

      // Find next unanswered skill
      for (let i = currentSkillIndex + 1; i < categorySkillIds.length; i++) {
        const nextSkillId = categorySkillIds[i];
        const hasRating = updatedAssessments.some(a =>
          a.skill_id === nextSkillId && a.self_rating !== null
        );

        if (!hasRating) {
          const nextElement = document.querySelector(`input[name="skill-${nextSkillId}"]`);
          if (nextElement) {
            const parent = nextElement.closest('.mb-8');
            if (parent) {
              parent.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
              });
            }
            break;
          }
        }
      }
    }, 150);
  };

  const handleSubmit = async () => {
    if (!member) return;

    setSaving(true);
    setError('');

    try {
      for (const assessment of assessments) {
        if (!assessment.self_rating) continue;

        const { data: existing } = await supabase
          .from('maturity_assessments')
          .select('id')
          .eq('team_member_id', member.id)
          .eq('skill_id', assessment.skill_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('maturity_assessments')
            .update({ self_rating: assessment.self_rating, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('maturity_assessments')
            .insert({
              team_member_id: member.id,
              assessor_id: member.manager_id,
              skill_id: assessment.skill_id,
              self_rating: assessment.self_rating,
              notes: ''
            });
        }
      }

      await supabase
        .from('self_assessment_tokens')
        .update({ completed_at: new Date().toISOString() })
        .eq('token', token);

      setViewState('success');
    } catch (err) {
      console.error('Error saving assessment:', err);
      setError('Failed to save assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSkillsForCategory = (categoryId: string) => {
    const skillIds = categorySkills[categoryId] || [];
    return skills.filter(s => skillIds.includes(s.id));
  };

  const getLevelsForSkill = (skillId: string) => {
    const skillLevelsList = skillLevels.filter(sl => sl.skill_id === skillId);
    skillLevelsList.sort((a, b) => a.display_order - b.display_order);
    return skillLevelsList;
  };

  const getRatingForSkill = (skillId: string) => {
    return assessments.find(a => a.skill_id === skillId)?.self_rating || null;
  };

  const getCurrentCategory = () => categories[currentCategoryIndex];

  const isCurrentCategoryComplete = () => {
    const currentCategory = getCurrentCategory();
    if (!currentCategory) return false;

    const categorySkillIds = categorySkills[currentCategory.id] || [];
    if (categorySkillIds.length === 0) return false;

    return categorySkillIds.every(skillId =>
      assessments.some(a => a.skill_id === skillId && a.self_rating !== null)
    );
  };

  const areAllCategoriesComplete = () => {
    return categories.every(category => {
      const categorySkillIds = categorySkills[category.id] || [];
      if (categorySkillIds.length === 0) return false;

      return categorySkillIds.every(skillId =>
        assessments.some(a => a.skill_id === skillId && a.self_rating !== null)
      );
    });
  };

  const getTotalSkillsCount = () => {
    const allCategorySkillIds = new Set<string>();
    categories.forEach(category => {
      const skillIds = categorySkills[category.id] || [];
      skillIds.forEach(id => allCategorySkillIds.add(id));
    });
    return allCategorySkillIds.size;
  };

  const getCompletedSkillsCount = () => {
    const allCategorySkillIds = new Set<string>();
    categories.forEach(category => {
      const skillIds = categorySkills[category.id] || [];
      skillIds.forEach(id => allCategorySkillIds.add(id));
    });

    return assessments.filter(a =>
      a.self_rating !== null && allCategorySkillIds.has(a.skill_id)
    ).length;
  };

  const getProgressPercentage = () => {
    const total = getTotalSkillsCount();
    const completed = getCompletedSkillsCount();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleContinue = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
    }
  };

  const handleBack = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
    }
  };

  const handleCategorySelect = (index: number) => {
    setCurrentCategoryIndex(index);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
  };

  const getCategoryCompletionStatus = (categoryId: string) => {
    const categorySkillIds = categorySkills[categoryId] || [];
    if (categorySkillIds.length === 0) return false;

    return categorySkillIds.every(skillId =>
      assessments.some(a => a.skill_id === skillId && a.self_rating !== null)
    );
  };

  const handleGetStarted = () => {
    setViewState('assessing');
    setCurrentCategoryIndex(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (error || tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Assessment Unavailable</h1>
          <p className="text-slate-600 mb-4">{error || 'This assessment link is invalid or has expired.'}</p>
          <p className="text-sm text-slate-500">Please contact your manager for a new assessment link.</p>
        </div>
      </div>
    );
  }

  if (viewState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Assessment Submitted!</h1>
          <p className="text-lg text-slate-600 mb-6">
            Thank you for completing your self-assessment, {member?.full_name}.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
            <p className="text-slate-700 mb-3">
              Your responses have been saved successfully. Kristy will compare your ratings with her own assessment during your upcoming 1:1 meeting.
            </p>
            <p className="text-slate-700">
              This will be a great opportunity to discuss your development, identify growth areas, and align on your career progression.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-3xl w-full text-center">
          <div className="mb-8">
            <Award className="w-24 h-24 text-blue-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome to Your Self-Assessment
            </h1>
            <p className="text-xl text-slate-600 mb-2">
              Hi {member?.full_name}!
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">What to expect:</h2>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You'll rate yourself on {getTotalSkillsCount()} skills across {categories.length} categories</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Each category will be presented one at a time</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Be honest in your self-assessment - this helps guide your development</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Kristy will compare your ratings with hers in your upcoming 1:1</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleGetStarted}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl mx-auto"
          >
            Get Started
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  const currentCategory = getCurrentCategory();
  const isLastCategory = currentCategoryIndex === categories.length - 1;
  const categoryComplete = isCurrentCategoryComplete();
  const allComplete = areAllCategoriesComplete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((category, index) => {
                const isComplete = getCategoryCompletionStatus(category.id);
                const isCurrent = index === currentCategoryIndex;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(index)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isComplete
                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Category {currentCategoryIndex + 1} of {categories.length}
              </span>
              <span className="text-sm font-medium text-slate-700">
                {getCompletedSkillsCount()} of {getTotalSkillsCount()} skills rated
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Target className="w-8 h-8" />
              <h1 className="text-3xl font-bold">{currentCategory?.name}</h1>
            </div>
            <p className="text-blue-50 text-lg">{currentCategory?.description}</p>
          </div>

          <div className="p-8">
            {currentCategory && getSkillsForCategory(currentCategory.id).map((skill, index) => {
              const skillLevelsList = getLevelsForSkill(skill.id);
              const currentRating = getRatingForSkill(skill.id);

              return (
                <div key={skill.id} className="mb-8 pb-8 border-b border-slate-200 last:border-0 last:pb-0">
                  <div className="mb-4">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{skill.name}</h3>
                        {skill.description && (
                          <p className="text-slate-600 mt-1">{skill.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 ml-11">
                    {skillLevelsList.map(level => (
                      <label
                        key={level.id}
                        className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                          currentRating === level.level_id
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`skill-${skill.id}`}
                          value={level.level_id}
                          checked={currentRating === level.level_id}
                          onChange={() => handleRatingChange(skill.id, level.level_id)}
                          className="mt-1 w-5 h-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 mb-1">{level.level_name}</div>
                          <div className="text-slate-600">{level.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentCategoryIndex > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-semibold"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                )}
                <div>
                  {!categoryComplete && (
                    <p className="text-sm text-amber-600 font-medium">
                      Please rate all skills in this category
                    </p>
                  )}
                  {categoryComplete && !allComplete && (
                    <p className="text-sm text-green-600 font-medium">
                      Category complete!
                    </p>
                  )}
                  {allComplete && (
                    <p className="text-sm text-green-600 font-medium">
                      All skills rated! Ready to submit
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isLastCategory && (
                  <button
                    onClick={handleContinue}
                    disabled={!categoryComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {allComplete && (
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Submit Assessment
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-slate-700 text-center">
            Your responses will be compared with Kristy's assessment in your upcoming 1:1 meeting
          </p>
        </div>
      </div>
    </div>
  );
}
