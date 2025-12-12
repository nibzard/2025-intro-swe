'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    label: 'Najmanje 8 znakova',
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: 'Bar jedno veliko slovo (A-Z)',
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: 'Bar jedno malo slovo (a-z)',
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: 'Bar jedna brojka (0-9)',
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: 'Bar jedan poseban znak (!@#$%...)',
    test: (pwd) => /[^a-zA-Z0-9]/.test(pwd),
  },
];

export function PasswordStrengthIndicator({
  password,
  showRequirements = true
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    requirements.forEach((req) => {
      if (req.test(password)) score++;
    });

    if (score === 0) return { score: 0, label: '', color: '' };
    if (score <= 2) return { score: 1, label: 'Slaba', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Osrednja', color: 'bg-yellow-500' };
    if (score <= 4) return { score: 3, label: 'Dobra', color: 'bg-blue-500' };
    return { score: 4, label: 'Izvrsna', color: 'bg-green-500' };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                level <= strength.score
                  ? strength.color
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        {strength.label && (
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Jačina lozinke: <span className={strength.score >= 3 ? 'text-green-600 dark:text-green-400' : strength.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}>{strength.label}</span>
          </p>
        )}
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1.5">
          {requirements.map((req, index) => {
            const passed = req.test(password);
            return (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  passed
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {passed ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span>{req.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
