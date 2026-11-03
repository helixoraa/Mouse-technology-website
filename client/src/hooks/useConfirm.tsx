import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal } from '@/components/admin/Modal';
import { Btn } from '@/components/admin/ui';

interface Opts {
  title?: string;
  message: string;
  confirmLabel?: string;
}
type ConfirmFn = (o: Opts | string) => Promise<boolean>;
const Ctx = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<Opts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(typeof o === 'string' ? { message: o } : o);
    return new Promise<boolean>((res) => {
      resolver.current = res;
    });
  }, []);

  const close = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setOpts(null);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {opts && (
        <Modal title={opts.title ?? 'Are you sure?'} onClose={() => close(false)} size="sm">
          <p className="text-sm text-ink-700">{opts.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => close(false)}>
              Cancel
            </Btn>
            <Btn variant="danger" onClick={() => close(true)} autoFocus>
              {opts.confirmLabel ?? 'Delete'}
            </Btn>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const c = useContext(Ctx);
  if (!c) throw new Error('useConfirm must be used inside ConfirmProvider');
  return c;
}
