import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import {
  REPORT_TARGET_LABELS,
  useBackend,
  type AdminUser,
  type Report,
  type ReportAction,
} from '@admin/shared/api';
import { reportKeys } from '@admin/entities/report';
import { Avatar, userKeys } from '@admin/entities/user';
import { Button, Dialog, ErrorState, Field, useAnnounce } from '@admin/shared/ui';
import { handleReportSchema, type HandleReportValues } from '../model/schema';

const ACTION_LABELS: Record<ReportAction, string> = {
  reset_nickname: '닉네임 초기화(여행자+번호)',
  remove_avatar: '프로필 사진 내리기',
  dismiss: '신고 기각(조치하지 않음)',
};

function HandleForm({
  report,
  target,
  onDone,
}: {
  report: Report;
  target?: AdminUser;
  onDone: () => void;
}) {
  const backend = useBackend();
  const client = useQueryClient();
  const announce = useAnnounce();
  const groupId = useId();
  const fix: ReportAction = report.target === 'nickname' ? 'reset_nickname' : 'remove_avatar';
  const handle = useMutation({
    mutationFn: (values: HandleReportValues) =>
      backend.handleReport(report.id, values.action, values.note),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: reportKeys.all }),
        client.invalidateQueries({ queryKey: userKeys.all }),
      ]),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HandleReportValues>({
    resolver: zodResolver(handleReportSchema),
    defaultValues: { action: fix, note: '' },
  });

  return (
    <form
      className="form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await handle.mutateAsync(values);
        announce(values.action === 'dismiss' ? '신고를 기각했습니다.' : '신고를 처리했습니다.');
        onDone();
      })}
    >
      {target ? (
        <div className="report-target">
          <Avatar user={target} size={64} />
          <dl className="meta">
            <div>
              <dt>대상 회원</dt>
              <dd>{target.nickname}</dd>
            </div>
            <div>
              <dt>신고 항목</dt>
              <dd>{REPORT_TARGET_LABELS[report.target]}</dd>
            </div>
            <div>
              <dt>사유</dt>
              <dd>{report.reason}</dd>
            </div>
          </dl>
        </div>
      ) : null}
      <fieldset className="radio-group" aria-describedby={`${groupId}-hint`}>
        <legend className="field__label">처리 방법</legend>
        {[fix, 'dismiss' as const].map((action) => (
          <label key={action} className="radio">
            <input type="radio" value={action} {...register('action')} />
            <span>{ACTION_LABELS[action]}</span>
          </label>
        ))}
        <p className="field__hint" id={`${groupId}-hint`}>
          조치하면 같은 회원의 같은 항목에 쌓인 신고도 함께 닫힙니다.
        </p>
      </fieldset>
      <Field
        label="처리 메모"
        required
        error={errors.note?.message}
        hint="회원에게 보이지 않는 운영 기록입니다."
      >
        {(props) => (
          <textarea className="input input--area" rows={3} {...props} {...register('note')} />
        )}
      </Field>
      {handle.error ? <ErrorState error={handle.error} /> : null}
      <div className="form__actions">
        <Button type="submit" variant="solid" disabled={handle.isPending}>
          처리 완료
        </Button>
      </div>
    </form>
  );
}

/** 닉네임·프로필 사진 신고를 처리하는 모달 */
export function HandleReportDialog({
  report,
  target,
  onClose,
}: {
  report: Report | null;
  target?: AdminUser;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(report)} title="신고 처리" onClose={onClose}>
      {report ? <HandleForm report={report} target={target} onDone={onClose} /> : null}
    </Dialog>
  );
}
