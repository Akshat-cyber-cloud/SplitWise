import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function UserTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const tourKey = user?.id ? `sharedsplit_tour_completed_${user.id}` : 'sharedsplit_tour_completed';
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrow: 'top' });
  const [highlightPos, setHighlightPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const resizeRef = useRef(null);

  // Define steps
  const steps = [
    {
      target: null,
      page: '/groups',
      title: 'Welcome to SharedSplit! 👋',
      content: 'Let\'s take a quick 1-minute tour to see how to split expenses and track balances effortlessly.',
      btnText: 'Start Tour',
    },
    {
      target: '#tour-summary-cards',
      page: '/groups',
      title: 'Your Net Balances 💳',
      content: 'Here you see your total net balance across all your groups. Green means you are owed money, and red means you owe others.',
      btnText: 'Next',
    },
    {
      target: '#tour-create-group',
      page: '/groups',
      title: 'Create a Group ✈️',
      content: 'Start a new group here for a trip, a flat, or an event. Give it a name and hit Create to get started.',
      btnText: 'Next',
    },
    {
      target: '#tour-groups-list',
      page: '/groups',
      title: 'Your Groups 👥',
      content: 'All your active groups are listed here. Click on a group card (like "Goa Trip 2024") to enter it and continue the tour!',
      btnText: 'Next',
    },
    {
      target: '#tour-members-card',
      page: '/groups/', // matches /groups/:id
      title: 'Group Members & Timing 📅',
      content: 'These are the group members. Important: members only owe for expenses dated after they join, so make sure join dates are correct!',
      btnText: 'Next',
    },
    {
      target: '#tour-balance-summary',
      page: '/groups/',
      title: 'Who Owes Who? 📊',
      content: 'This summary shows exactly who owes what. Click on any member or click "Drill-down Ledger" to see detailed breakdowns.',
      btnText: 'Next',
    },
    {
      target: '#tour-import-csv',
      page: '/groups/',
      title: 'Supercharged CSV Import ⚡',
      content: 'Upload your bank statement or expense list here. The system will automatically create missing users, add them to the group, and split expenses instantly!',
      btnText: 'Next',
    },
    {
      target: '#tour-settle-up-btn',
      page: '/groups/',
      title: 'Settle Up Debts 🤝',
      content: 'When a member pays someone back, record the transaction here to settle balances and clear the debt ledger. You\'re all set!',
      btnText: 'Finish Tour',
    }
  ];

  // Check if tour should start
  useEffect(() => {
    const tourCompleted = localStorage.getItem(tourKey);
    if (!tourCompleted) {
      // Start tour after a brief delay so page loads
      const timer = setTimeout(() => {
        setActive(true);
        setStepIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, tourKey]);

  const [hasGroups, setHasGroups] = useState(true);

  // Check if user has groups when on the dashboard
  useEffect(() => {
    if (location.pathname === '/groups') {
      api.get('/balances/dashboard')
        .then(({ data }) => {
          setHasGroups(data.groups && data.groups.length > 0);
        })
        .catch(() => setHasGroups(false));
    }
  }, [location.pathname, stepIndex]);

  const currentStep = { ...steps[stepIndex] };

  if (stepIndex === 3 && !hasGroups) {
    currentStep.content = "You don't have any groups yet! Please create a group first using the form above. You can restart this tour at any time from the sidebar.";
    currentStep.btnText = 'Finish Tour';
  }

  // Update tooltip and highlight position relative to target element
  const updatePositions = () => {
    if (!active || !currentStep) return;

    if (!currentStep.target) {
      // Centered Welcome modal
      setHighlightPos({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    const element = document.querySelector(currentStep.target);
    if (!element) {
      // Target element not found (e.g. page changed or groups list is empty)
      // fallback to centered or skip
      setHighlightPos({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const top = rect.top + scrollY;
    const left = rect.left + scrollX;
    const width = rect.width;
    const height = rect.height;

    setHighlightPos({ top: top - 8, left: left - 8, width: width + 16, height: height + 16 });

    // Tooltip position calculations
    const tooltipHeight = 180;
    const tooltipWidth = 320;
    const windowWidth = window.innerWidth;
    let tTop = top + height + 16;
    let tLeft = left + (width / 2) - (tooltipWidth / 2);
    let arrow = 'top';

    // If tooltip goes off-screen vertically, place it above
    if (tTop + tooltipHeight > scrollY + window.innerHeight) {
      tTop = top - tooltipHeight - 16;
      arrow = 'bottom';
    }

    // Keep tooltip within horizontal bounds
    if (tLeft < 16) {
      tLeft = 16;
    } else if (tLeft + tooltipWidth > windowWidth - 16) {
      tLeft = windowWidth - tooltipWidth - 16;
    }

    setTooltipPos({ top: tTop, left: tLeft, arrow });
  };

  useEffect(() => {
    updatePositions();

    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [active, stepIndex, location.pathname]);

  // Handle page sync
  useEffect(() => {
    if (!active || !currentStep) return;

    const currentPath = location.pathname;
    const expectedPage = currentStep.page;

    // Check if the current page matches the expected page of the step
    if (expectedPage === '/groups' && currentPath !== '/groups') {
      // Wait or redirect
      navigate('/groups');
    } else if (expectedPage === '/groups/' && !currentPath.startsWith('/groups/')) {
      // If we are at Step 4+ and not in a group, wait for user to click or auto-navigate to group 1
      // For a seamless tour, we can auto-navigate to group 1 or the first available group
      api.get('/balances/dashboard').then(({ data }) => {
        if (data.groups && data.groups.length > 0) {
          navigate(`/groups/${data.groups[0].groupId}`);
        } else {
          // If no groups, skip the inside-group steps and finish
          handleSkip();
        }
      }).catch(() => handleSkip());
    }
  }, [stepIndex, location.pathname]);

  const handleNext = () => {
    if (stepIndex === 3 && !hasGroups) {
      handleComplete();
      return;
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(tourKey, 'true');
    setActive(false);
  };

  const handleComplete = () => {
    localStorage.setItem(tourKey, 'true');
    setActive(false);
  };

  if (!active || !currentStep) return null;

  const isModal = !currentStep.target;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none">
      {/* Dim backdrop with cut-out highlight overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
        onClick={handleSkip}
      />

      {/* Pulsing Highlight Target Box */}
      {!isModal && highlightPos.width > 0 && (
        <div
          className="absolute border-2 border-teal-400 bg-teal-400/5 rounded-2xl shadow-[0_0_25px_rgba(45,212,191,0.4)] animate-pulse transition-all duration-300 pointer-events-none"
          style={{
            top: `${highlightPos.top}px`,
            left: `${highlightPos.left}px`,
            width: `${highlightPos.width}px`,
            height: `${highlightPos.height}px`,
          }}
        />
      )}

      {/* Onboarding Dialog Popup */}
      <div
        className={`absolute pointer-events-auto bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 max-w-sm w-[320px] select-text transition-all duration-300 ${
          isModal 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' 
            : ''
        }`}
        style={!isModal ? {
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
        } : undefined}
      >
        {/* Tooltip arrow pointer */}
        {!isModal && (
          <div 
            className={`absolute w-4 h-4 bg-white border-l border-t border-slate-100 rotate-45 ${
              tooltipPos.arrow === 'top' 
                ? '-top-2 left-1/2 -translate-x-1/2' 
                : '-bottom-2 left-1/2 -translate-x-1/2 border-l-0 border-t-0 border-r border-b'
            }`}
          />
        )}

        {/* Header Progress indicator */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold tracking-wider text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full uppercase">
            Step {stepIndex + 1} of {steps.length}
          </span>
          <button 
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Step Title */}
        <h4 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
          {currentStep.title}
        </h4>

        {/* Step Content */}
        <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
          {currentStep.content}
        </p>

        {/* Control Buttons */}
        <div className="flex gap-2 justify-between items-center pt-3 border-t border-slate-50">
          {stepIndex > 0 ? (
            <button
              onClick={handleBack}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 rounded-lg"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="btn btn-primary text-xs font-bold py-2 px-4 shadow-sm"
          >
            {currentStep.btnText}
          </button>
        </div>
      </div>
    </div>
  );
}
