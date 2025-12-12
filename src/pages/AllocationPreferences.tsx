import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const BUCKET_DEFINITIONS = [
  {
    key: 'core_team',
    label: 'Core Team / Leadership',
    description: 'Founders and ongoing leadership responsible for strategic direction.',
    typical: '15-25%',
    source: 'https://www.liquifi.finance/post/token-vesting-and-investor-lockup-trends',
  },
  {
    key: 'contributors',
    label: 'Contributors / Airdrop',
    description: 'People who contributed work to the project (engineering, marketing, design, operations, etc.).',
    typical: '5-15%',
    source: 'https://www.liquifi.finance/post/token-vesting-and-investor-lockup-trends',
  },
  {
    key: 'network_rewards',
    label: 'Network Rewards',
    description: 'Tokens distributed over time to incentivize ecosystem activity (staking, usage, etc.).',
    typical: '20-40%',
    source: 'https://www.liquifi.finance/post/token-vesting-and-investor-lockup-trends',
  },
  {
    key: 'ecosystem_partners',
    label: 'Ecosystem Partners',
    description: 'Strategic partners, integrations, grants to external builders.',
    typical: '10-20%',
    source: 'https://www.liquifi.finance/post/token-vesting-and-investor-lockup-trends',
  },
  {
    key: 'treasury',
    label: 'Treasury / Reserve',
    description: 'Funds held for future development, operations, and unforeseen needs.',
    typical: '15-30%',
    source: 'https://www.liquifi.finance/post/token-vesting-and-investor-lockup-trends',
  },
];

const AllocationPreferences = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [contributor, setContributor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expertise
  const [expertise, setExpertise] = useState<string>('');
  const [expertiseDescription, setExpertiseDescription] = useState<string>('');

  // Bucket votes
  const [bucketDeferred, setBucketDeferred] = useState(false);
  const [bucketDelegatedTo, setBucketDelegatedTo] = useState('');
  const [bucketVotes, setBucketVotes] = useState<Record<string, number>>({
    core_team: 20,
    contributors: 10,
    network_rewards: 30,
    ecosystem_partners: 15,
    treasury: 25,
  });
  const [bucketRationale, setBucketRationale] = useState('');

  // Lockup preferences
  const [lockupDeferred, setLockupDeferred] = useState(false);
  const [lockupDelegatedTo, setLockupDelegatedTo] = useState('');
  const [cliffMonths, setCliffMonths] = useState(12);
  const [vestingMonths, setVestingMonths] = useState(36);
  const [tgePercent, setTgePercent] = useState(5);
  const [lockupRationale, setLockupRationale] = useState('');

  const bucketTotal = Object.values(bucketVotes).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const fetchContributor = async () => {
      if (!token) {
        setError('Invalid access link');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        setError('Invalid or expired access link');
        setLoading(false);
        return;
      }

      // If already submitted allocation prefs, go to interview
      if (data.allocation_prefs_submitted_at) {
        navigate(`/interview/${token}`);
        return;
      }

      // Load any saved draft data
      if (data.cap_table_expertise) setExpertise(data.cap_table_expertise);
      if (data.cap_table_expertise_description) setExpertiseDescription(data.cap_table_expertise_description);
      if (data.bucket_deferred) setBucketDeferred(data.bucket_deferred);
      if (data.bucket_delegated_to) setBucketDelegatedTo(data.bucket_delegated_to);
      if (data.bucket_votes) setBucketVotes(data.bucket_votes);
      if (data.bucket_rationale) setBucketRationale(data.bucket_rationale);
      if (data.lockup_deferred) setLockupDeferred(data.lockup_deferred);
      if (data.lockup_delegated_to) setLockupDelegatedTo(data.lockup_delegated_to);
      if (data.lockup_cliff_months !== null) setCliffMonths(data.lockup_cliff_months);
      if (data.lockup_vesting_months !== null) setVestingMonths(data.lockup_vesting_months);
      if (data.lockup_tge_percent !== null) setTgePercent(data.lockup_tge_percent);
      if (data.lockup_rationale) setLockupRationale(data.lockup_rationale);

      setContributor(data);
      setLoading(false);
    };

    fetchContributor();
  }, [token, navigate]);

  // Auto-save function
  const saveProgress = useCallback(async () => {
    if (!contributor?.id) return;
    
    setSaving(true);
    await supabase
      .from('contributors')
      .update({
        cap_table_expertise: expertise,
        cap_table_expertise_description: expertiseDescription,
        bucket_deferred: bucketDeferred,
        bucket_delegated_to: bucketDelegatedTo || null,
        bucket_votes: bucketVotes,
        bucket_rationale: bucketRationale,
        lockup_deferred: lockupDeferred,
        lockup_delegated_to: lockupDelegatedTo || null,
        lockup_cliff_months: cliffMonths,
        lockup_vesting_months: vestingMonths,
        lockup_tge_percent: tgePercent,
        lockup_rationale: lockupRationale,
      })
      .eq('id', contributor.id);
    
    setSaving(false);
  }, [contributor?.id, expertise, expertiseDescription, bucketDeferred, bucketDelegatedTo, bucketVotes, bucketRationale, lockupDeferred, lockupDelegatedTo, cliffMonths, vestingMonths, tgePercent, lockupRationale]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contributor?.id) {
        saveProgress();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [expertise, expertiseDescription, bucketDeferred, bucketDelegatedTo, bucketVotes, bucketRationale, lockupDeferred, lockupDelegatedTo, cliffMonths, vestingMonths, tgePercent, lockupRationale, saveProgress, contributor?.id]);

  const handleBucketChange = (key: string, value: number) => {
    setBucketVotes(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!bucketDeferred && bucketTotal !== 100) {
      alert('Bucket allocations must sum to 100%');
      return;
    }

    await supabase
      .from('contributors')
      .update({
        cap_table_expertise: expertise,
        cap_table_expertise_description: expertiseDescription,
        bucket_deferred: bucketDeferred,
        bucket_delegated_to: bucketDeferred ? bucketDelegatedTo || null : null,
        bucket_votes: bucketDeferred ? null : bucketVotes,
        bucket_rationale: bucketRationale,
        lockup_deferred: lockupDeferred,
        lockup_delegated_to: lockupDeferred ? lockupDelegatedTo || null : null,
        lockup_cliff_months: lockupDeferred ? null : cliffMonths,
        lockup_vesting_months: lockupDeferred ? null : vestingMonths,
        lockup_tge_percent: lockupDeferred ? null : tgePercent,
        lockup_rationale: lockupRationale,
        allocation_prefs_submitted_at: new Date().toISOString(),
      })
      .eq('id', contributor.id);

    navigate(`/interview/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Step 1 of 2: Allocation Preferences</span>
            <span className="flex items-center gap-2">
              {saving && <span className="text-blue-500">Saving...</span>}
              <span>~15-20 minutes total</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Allocation Preferences</h1>
        <p className="text-gray-600 mb-4">
          Welcome, {contributor?.name}. Before we discuss your contributions, we'd like your input on how tokens should be allocated.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Your responses are confidential and will be used to inform token allocation decisions. Leadership may review individual responses if needed.
        </p>

        {/* Expertise Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Token/Cap Table Experience</h2>
          <p className="text-sm text-gray-600 mb-4">
            This helps us understand how to weight your input on allocation questions.
          </p>
          <div className="space-y-3">
            {[
              { value: 'none', label: 'No experience with token distributions or cap tables' },
              { value: 'some', label: 'Some familiarity (read about it, minor involvement)' },
              { value: 'experienced', label: 'Experienced (participated in 1-2 token launches or cap table decisions)' },
              { value: 'expert', label: 'Expert (led or significantly shaped multiple token/equity distributions)' },
            ].map((option) => (
              <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="expertise"
                  value={option.value}
                  checked={expertise === option.value}
                  onChange={(e) => setExpertise(e.target.value)}
                  className="mt-1"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe your experience (optional)
            </label>
            <textarea
              value={expertiseDescription}
              onChange={(e) => setExpertiseDescription(e.target.value)}
              placeholder="e.g., I was involved in token design for Project X..."
              className="w-full border rounded-md p-2 text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Section A: Token Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Section A: Token Distribution</h2>
          <p className="text-sm text-gray-600 mb-4">
            How should tokens be distributed across these categories? Adjust sliders to sum to 100%.
          </p>
          
          {/* Defer option */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={bucketDeferred}
              onChange={(e) => setBucketDeferred(e.target.checked)}
            />
            <span className="text-sm">I'd prefer to defer this to those with more expertise</span>
          </label>
          
          {bucketDeferred && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delegate to (optional)
              </label>
              <input
                type="text"
                value={bucketDelegatedTo}
                onChange={(e) => setBucketDelegatedTo(e.target.value)}
                placeholder="e.g., Matt, James, or 'leadership team'"
                className="w-full border rounded-md p-2 text-sm"
              />
            </div>
          )}
          
          {/* Bucket sliders */}
          <div className={`space-y-6 ${bucketDeferred ? 'opacity-50 pointer-events-none' : ''}`}>
            {BUCKET_DEFINITIONS.map((bucket) => (
              <div key={bucket.key}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-sm">{bucket.label}</span>
                  <span className="text-sm font-semibold">{bucketVotes[bucket.key] || 0}%</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{bucket.description}</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bucketVotes[bucket.key] || 0}
                  onChange={(e) => handleBucketChange(bucket.key, parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">
  Industry typical: {bucket.typical} (
  <a href={bucket.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">source</a>
  )
</p>
              </div>
            ))}
          </div>
          
          {/* Total indicator */}
          <div className={`mt-4 p-3 rounded ${bucketTotal === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className="font-medium">Total: {bucketTotal}%</span>
            {bucketTotal !== 100 && <span className="ml-2 text-sm">(must equal 100%)</span>}
          </div>
          
          {/* Rationale */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rationale (recommended)
            </label>
            <textarea
              value={bucketRationale}
              onChange={(e) => setBucketRationale(e.target.value)}
              placeholder="Any reasoning behind your distribution choices..."
              className="w-full border rounded-md p-2 text-sm"
              rows={2}
              disabled={bucketDeferred}
            />
            <p className="text-xs text-gray-500 mt-1">Explaining your reasoning helps the algorithm weigh your input more thoughtfully.</p>
          </div>
          
          <p className="text-xs text-gray-400 mt-3">
            Note: These are industry typical ranges. Mother's needs may differ.
          </p>
        </div>

        {/* Section B: Vesting & Lockups */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Section B: Vesting & Lockups</h2>
          <p className="text-sm text-gray-600 mb-4">
            How should tokens be released over time? These parameters help align long-term incentives.
          </p>
          
          {/* Defer option */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={lockupDeferred}
              onChange={(e) => setLockupDeferred(e.target.checked)}
            />
            <span className="text-sm">I'd prefer to defer this to those with more expertise</span>
          </label>
          
          {lockupDeferred && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delegate to (optional)
              </label>
              <input
                type="text"
                value={lockupDelegatedTo}
                onChange={(e) => setLockupDelegatedTo(e.target.value)}
                placeholder="e.g., Matt, James, or 'leadership team'"
                className="w-full border rounded-md p-2 text-sm"
              />
            </div>
          )}
          
          {/* Lockup sliders */}
          <div className={`space-y-6 ${lockupDeferred ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Cliff Period */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-sm">Cliff Period</span>
                <span className="text-sm font-semibold">{cliffMonths} months</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Time before any tokens unlock</p>
              <input
                type="range"
                min="0"
                max="24"
                value={cliffMonths}
                onChange={(e) => setCliffMonths(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
  Industry typical: 6-12 months (
  <a href="https://www.liquifi.finance/post/token-vesting-and-investor-lockup-trends" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">Liquifi 2024</a>
  )
</p>
            </div>
            
            {/* Vesting Duration */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-sm">Total Vesting Duration</span>
                <span className="text-sm font-semibold">{vestingMonths} months</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Total time until fully vested (includes cliff)</p>
              <input
                type="range"
                min="12"
                max="60"
                value={vestingMonths}
                onChange={(e) => setVestingMonths(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
  Industry typical: 24-48 months (
  <a href="https://www.bitbond.com/resources/tokenomics-101" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">Bitbond 2025</a>
  )
</p>
            </div>
            
            {/* TGE Unlock */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-sm">TGE Unlock</span>
                <span className="text-sm font-semibold">{tgePercent}%</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Percentage available immediately at Token Generation Event</p>
              <input
                type="range"
                min="0"
                max="25"
                value={tgePercent}
                onChange={(e) => setTgePercent(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
  Industry typical: 0-10% (
  <a href="https://www.liquifi.finance/post/token-vesting-and-investor-lockup-trends" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">Liquifi 2024</a>
  )
</p>
            </div>
          </div>
          
          {/* Rationale */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rationale (recommended)
            </label>
            <textarea
              value={lockupRationale}
              onChange={(e) => setLockupRationale(e.target.value)}
              placeholder="Any reasoning behind your vesting choices..."
              className="w-full border rounded-md p-2 text-sm"
              rows={2}
              disabled={lockupDeferred}
            />
            <p className="text-xs text-gray-500 mt-1">Explaining your reasoning helps the algorithm weigh your input more thoughtfully.</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={handleSubmit}
            disabled={!bucketDeferred && bucketTotal !== 100}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              !bucketDeferred && bucketTotal !== 100
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Continue to Interview →
          </button>
          {!bucketDeferred && bucketTotal !== 100 && (
            <p className="text-sm text-red-500 text-center mt-2">
              Bucket allocations must sum to 100% before continuing
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Questions? Reach out to Jonathan on Telegram: <a href="https://t.me/CoachJ87" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">@CoachJ87</a>
        </p>
      </div>
    </div>
  );
};

export default AllocationPreferences;
