import { useMutation, useQueryClient } from '@tanstack/react-query';
import { errMsg } from '@/lib/admin-api';
import { useToast } from './useToast';

/**
 * Mutation wrapper: toasts the result and invalidates every query (public ['page',key], ['services',..], ['site'],
 * ['team'], ['faqs'], ['posts'], ['testimonials'] and the admin lists) so the public site reflects the change immediately.
 */
export function useAdminMutation<V, R = unknown>(fn: (v: V) => Promise<R>, successMsg?: string, onDone?: (r: R, v: V) => void) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, v) => {
      if (successMsg) toast.success(successMsg);
      void qc.invalidateQueries();
      onDone?.(r, v);
    },
    onError: (e) => toast.error(errMsg(e)),
  });
}
