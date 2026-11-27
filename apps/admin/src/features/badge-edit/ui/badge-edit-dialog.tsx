import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LIMITS, useBackend, type Badge, type BadgeInput } from '@admin/shared/api';
import { badgeKeys } from '@admin/entities/badge';
import { Button, Dialog, ErrorState, Field, useAnnounce } from '@admin/shared/ui';

const badgeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '뱃지 이름을 입력해 주세요.')
    .max(LIMITS.badgeName, `뱃지 이름은 ${LIMITS.badgeName}자 이하입니다.`),
  description: z
    .string()
    .trim()
    .min(1, '설명을 입력해 주세요.')
    .max(LIMITS.badgeDescription, `설명은 ${LIMITS.badgeDescription}자 이하입니다.`),
});

function BadgeForm({ badge, onDone }: { badge: Badge; onDone: () => void }) {
  const backend = useBackend();
  const client = useQueryClient();
  const announce = useAnnounce();
  const save = useMutation({
    mutationFn: (input: BadgeInput) => backend.saveBadge(badge.id, input),
    onSuccess: () => client.invalidateQueries({ queryKey: badgeKeys.all }),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BadgeInput>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: { name: badge.name, description: badge.description },
  });
  return (
    <form
      className="form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await save.mutateAsync(values);
        announce(`${values.name} 뱃지를 저장했습니다.`);
        onDone();
      })}
    >
      <Field label="뱃지 이름" required error={errors.name?.message}>
        {(props) => <input className="input" {...props} {...register('name')} />}
      </Field>
      <Field
        label="설명"
        required
        error={errors.description?.message}
        hint={`획득 조건: ${badge.rule} (조건은 앱 코드에서 계산합니다)`}
      >
        {(props) => (
          <textarea
            className="input input--area"
            rows={3}
            {...props}
            {...register('description')}
          />
        )}
      </Field>
      {save.error ? <ErrorState error={save.error} /> : null}
      <div className="form__actions">
        <Button type="submit" variant="solid" disabled={save.isPending}>
          뱃지 저장
        </Button>
      </div>
    </form>
  );
}

/** 기념 뱃지의 이름·설명을 고치는 모달 */
export function BadgeEditDialog({ badge, onClose }: { badge: Badge | null; onClose: () => void }) {
  return (
    <Dialog
      open={Boolean(badge)}
      title={badge ? `${badge.name} 뱃지 고치기` : '뱃지 고치기'}
      onClose={onClose}
    >
      {badge ? <BadgeForm badge={badge} onDone={onClose} /> : null}
    </Dialog>
  );
}
