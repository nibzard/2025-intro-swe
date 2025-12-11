'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Check, X, Loader2 } from 'lucide-react';
import { debounce } from '@/lib/utils';

interface UsernameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  onValidationChange?: (isValid: boolean) => void;
}

export function UsernameInput({
  id,
  name,
  onValidationChange,
  ...props
}: UsernameInputProps) {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const checkUsernameAvailability = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 3) {
        setIsAvailable(null);
        setIsChecking(false);
        return;
      }

      // Basic validation
      if (!/^[a-zA-Z]/.test(value)) {
        setValidationError('Mora početi slovom');
        setIsAvailable(false);
        setIsChecking(false);
        onValidationChange?.(false);
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        setValidationError('Samo slova, brojevi, _ i -');
        setIsAvailable(false);
        setIsChecking(false);
        onValidationChange?.(false);
        return;
      }

      setValidationError('');
      setIsChecking(true);

      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(value)}`);
        const data = await response.json();

        setIsAvailable(data.available);
        onValidationChange?.(data.available);
      } catch (error) {
        console.error('Error checking username:', error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [onValidationChange]
  );

  useEffect(() => {
    checkUsernameAvailability(username);
  }, [username, checkUsernameAvailability]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        value={username}
        onChange={handleChange}
        className="pr-10"
        {...props}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isChecking && username.length >= 3 && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        )}
        {!isChecking && isAvailable === true && (
          <Check className="w-4 h-4 text-green-500" />
        )}
        {!isChecking && isAvailable === false && username.length >= 3 && (
          <X className="w-4 h-4 text-red-500" />
        )}
      </div>
      {validationError && username.length >= 3 && (
        <p className="text-xs text-red-500 mt-1">{validationError}</p>
      )}
      {!isChecking && isAvailable === false && !validationError && username.length >= 3 && (
        <p className="text-xs text-red-500 mt-1">Korisničko ime je već zauzeto</p>
      )}
      {!isChecking && isAvailable === true && username.length >= 3 && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Korisničko ime je dostupno</p>
      )}
    </div>
  );
}
