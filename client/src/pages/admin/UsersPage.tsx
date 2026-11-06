import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/admin/Modal';
import { CopyButton } from '@/components/admin/SecurityBits';
import { Badge, Btn, Card, EmptyState, ErrorState, Field, PageHeader, Select, Spinner, TextInput } from '@/components/admin/ui';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import { useConfirm } from '@/hooks/useConfirm';
import { errMsg, fmtDate, type AdminUser } from '@/lib/admin-api';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { z } from 'zod';

type Role = AdminUser['role'];
interface Issued {
  title: string;
  email: string;
  password: string;
}

/** Shows a generated temporary password exactly once. */
function TempPasswordModal({ issued, onClose }: { issued: Issued; onClose: () => void }) {
  const confirm = useConfirm();
  const [copied, setCopied] = useState(false);
  const close = async () => {
    if (
      copied ||
      (await confirm({
        title: 'Close without copying?',
        message: 'This temporary password cannot be shown again.',
        confirmLabel: 'Close anyway',
      }))
    )
      onClose();
  };
  return (
    <Modal title={issued.title} size="sm" onClose={() => void close()}>
      <p className="text-sm text-ink-700">
        Give this one-time password to <strong className="text-ink">{issued.email}</strong>. They must choose a new password at their first
        sign in.
      </p>
      <div className="my-4 rounded-2xl border border-line bg-surface-soft p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-700">Temporary password</p>
        <p data-testid="temp-password" className="mt-1 select-all break-all font-mono text-lg font-bold text-ink">
          {issued.password}
        </p>
        <div onClick={() => setCopied(true)} className="mt-3">
          <CopyButton text={issued.password} label="Copy password" />
        </div>
      </div>
      <p role="alert" className="mb-4 rounded-xl bg-warn-soft px-3 py-2 text-sm font-semibold text-warn">
        Shown once. It is stored only as a hash, so it cannot be recovered. Reset the password again if it is lost.
      </p>
      <div className="flex justify-end">
        <Btn onClick={() => void close()}>Done</Btn>
      </div>
    </Modal>
  );
}

const createSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  email: z.string().trim().email('Enter a valid email address'),
  role: z.enum(['ADMIN', 'EDITOR']),
});

function UserFormModal({
  user,
  isSelf,
  onClose,
  onIssued,
}: {
  user: AdminUser | null;
  isSelf: boolean;
  onClose: () => void;
  onIssued: (i: Issued) => void;
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'EDITOR');
  const [error, setError] = useState('');
  const m = useAdminMutation<void, { user?: AdminUser; temporaryPassword?: string }>(
    () =>
      user
        ? api(`/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ name: name.trim(), role }) })
        : api('/admin/users', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), role }) }),
    user ? 'User updated' : undefined,
    (r) => {
      onClose();
      if (!user && r.user && r.temporaryPassword) onIssued({ title: 'User created', email: r.user.email, password: r.temporaryPassword });
    },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = createSchema.safeParse({ name, email, role });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError('');
    m.mutate();
  };
  return (
    <Modal title={user ? 'Edit user' : 'Create user'} size="sm" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Email" hint={user ? 'The email cannot be changed.' : undefined}>
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} />
        </Field>
        <Field
          label="Role"
          hint={isSelf ? 'You cannot change your own role.' : 'Admins manage everything including users. Editors manage content and leads.'}
        >
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isSelf}>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
        {!user && (
          <p className="text-sm text-ink-700">
            A strong temporary password is generated for you and shown once after you create the account.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn type="submit" disabled={m.isPending}>
            {m.isPending ? 'Saving…' : user ? 'Save' : 'Create user'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

function Status({ u }: { u: AdminUser }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={u.active ? 'success' : 'neutral'}>{u.active ? 'Active' : 'Deactivated'}</Badge>
      {u.mustChangePassword && <Badge tone="warn">Must change password</Badge>}
    </div>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const confirm = useConfirm();
  const q = useQuery({ queryKey: ['admin', 'users'], queryFn: () => api<AdminUser[]>('/admin/users') });
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);
  useEffect(() => {
    document.title = 'Users | MAOUAJ admin';
  }, []);

  const resetPw = useAdminMutation(
    (u: AdminUser) => api<{ temporaryPassword: string }>(`/admin/users/${u.id}/reset-password`, { method: 'POST' }),
    undefined,
    (r, u) => setIssued({ title: 'Password reset', email: u.email, password: r.temporaryPassword }),
  );
  const setActive = useAdminMutation(
    (v: { u: AdminUser; active: boolean }) => api(`/admin/users/${v.u.id}/${v.active ? 'activate' : 'deactivate'}`, { method: 'POST' }),
    'User updated',
  );
  const remove = useAdminMutation((u: AdminUser) => api(`/admin/users/${u.id}`, { method: 'DELETE' }), 'User deleted');

  const rows = q.data ?? [];
  const actions = (u: AdminUser) => {
    const self = u.id === me?.id;
    return (
      <div className="flex flex-wrap gap-1.5 md:justify-end">
        <Btn size="sm" variant="secondary" onClick={() => setEditing(u)}>
          Edit
        </Btn>
        <Btn
          size="sm"
          variant="secondary"
          onClick={async () => {
            if (
              await confirm({
                title: 'Reset password?',
                message: `Generate a new one-time password for ${u.email}? Their current password stops working and they are signed out everywhere.`,
                confirmLabel: 'Reset password',
              })
            )
              resetPw.mutate(u);
          }}
        >
          Reset password
        </Btn>
        <Btn
          size="sm"
          variant="secondary"
          disabled={self}
          title={self ? 'You cannot deactivate yourself' : undefined}
          onClick={async () => {
            if (
              !u.active ||
              (await confirm({
                title: 'Deactivate user?',
                message: `${u.email} will be signed out and unable to sign in until reactivated.`,
                confirmLabel: 'Deactivate',
              }))
            )
              setActive.mutate({ u, active: !u.active });
          }}
        >
          {u.active ? 'Deactivate' : 'Activate'}
        </Btn>
        <Btn
          size="sm"
          variant="danger"
          disabled={self}
          title={self ? 'You cannot delete yourself' : undefined}
          onClick={async () => {
            if (await confirm({ title: 'Delete user?', message: `Permanently delete ${u.email}? This cannot be undone.` }))
              remove.mutate(u);
          }}
        >
          Delete
        </Btn>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Admins create accounts and hand over a one-time temporary password. No email is sent. Everyone must set a new password at first sign in."
        actions={<Btn onClick={() => setEditing('new')}>+ Create user</Btn>}
      />
      {q.isLoading ? (
        <Spinner />
      ) : q.isError ? (
        <ErrorState message={errMsg(q.error)} onRetry={() => void q.refetch()} />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title="No users yet" />
        </Card>
      ) : (
        <>
          {/* tablet/desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-soft text-xs uppercase tracking-wider text-ink-700">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last sign in</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((u) => (
                    <tr key={u.id} className={u.active ? '' : 'bg-surface-soft/60'}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-ink">
                          {u.name}
                          {u.id === me?.id && <span className="ml-2 text-xs font-semibold text-ink-500">(you)</span>}
                        </p>
                        <p className="text-ink-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === 'ADMIN' ? 'brand' : 'neutral'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Status u={u} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-700">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Never'}</td>
                      <td className="min-w-[260px] px-4 py-3">{actions(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {/* phone cards */}
          <ul className="space-y-3 md:hidden" aria-label="Users">
            {rows.map((u) => (
              <li key={u.id}>
                <Card className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">
                        {u.name}
                        {u.id === me?.id && <span className="ml-2 text-xs font-semibold text-ink-500">(you)</span>}
                      </p>
                      <p className="truncate text-sm text-ink-500">{u.email}</p>
                    </div>
                    <Badge tone={u.role === 'ADMIN' ? 'brand' : 'neutral'}>{u.role}</Badge>
                  </div>
                  <Status u={u} />
                  <p className="text-xs text-ink-500">Last sign in: {u.lastLoginAt ? fmtDate(u.lastLoginAt) : 'Never'}</p>
                  {actions(u)}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {editing && (
        <UserFormModal
          user={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === me?.id}
          onClose={() => setEditing(null)}
          onIssued={setIssued}
        />
      )}
      {issued && <TempPasswordModal issued={issued} onClose={() => setIssued(null)} />}
    </>
  );
}
