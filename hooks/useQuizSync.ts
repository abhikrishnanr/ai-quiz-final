
import { useState, useEffect, useCallback } from 'react';
import { QuizSession } from '../types';
import { QuizService } from '../services/mockBackend';
import { APP_CONFIG } from '../constants';

export const useQuizSync = () => {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    try {
      const data = await QuizService.getSession();
      setSession(data);
      setError(null);
    } catch (err) {
      setError('Failed to sync quiz state');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, APP_CONFIG.POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [sync]);

  return { session, loading, error, refresh: sync };
};
