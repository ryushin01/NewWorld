import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import {
  AdminError,
  LIMITS,
  LORE_LABELS,
  LORES_BY_REALM,
  REALM_LABELS,
  realmSchema,
  type Destination,
} from '@admin/shared/api';
import { navigate } from '@admin/shared/lib';
import { Button, ButtonLink, ErrorState, Field, useAnnounce } from '@admin/shared/ui';
import { destinationFormSchema, type DestinationFormValues } from '../model/schema';
import { useSaveDestination } from '../model/use-save-destination';

const EMPTY: DestinationFormValues = {
  id: '',
  realm: 'real',
  lore: 'history',
  name: '',
  originalName: '',
  tagline: '',
  group: '',
  location: '',
  era: '',
  latitude: 0,
  longitude: 0,
  overview: '',
};

/** 여행지 추가·수정 폼. 오류가 나면 첫 오류 칸으로 초점을 옮깁니다. */
export function DestinationForm({ initial }: { initial?: Destination }) {
  const mode = initial ? 'update' : 'create';
  const save = useSaveDestination(mode);
  const announce = useAnnounce();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: initial ?? EMPTY,
  });
  const realm = useWatch({ control, name: 'realm' });

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      announce(`${saved.name}을(를) 저장했습니다.`);
      navigate(`/destinations/${encodeURIComponent(saved.id)}`);
    } catch (error) {
      if (error instanceof AdminError && error.code === 'conflict') {
        setError('id', { message: error.message }, { shouldFocus: true });
      }
    }
  });

  return (
    <form
      className="form"
      noValidate
      onSubmit={submit}
      aria-label={initial ? '여행지 수정' : '여행지 추가'}
    >
      <fieldset className="form__section">
        <legend className="form__legend">
          <span aria-hidden="true">BASIC</span> 기본 정보
        </legend>
        <div className="form__grid">
          <Field
            label="ID"
            required
            error={errors.id?.message}
            hint={
              initial
                ? '앱의 스탬프·코스가 이 ID를 가리켜 바꿀 수 없습니다.'
                : '예: stonehenge. 저장한 뒤에는 바꿀 수 없습니다.'
            }
          >
            {(props) => (
              <input className="input" readOnly={Boolean(initial)} {...props} {...register('id')} />
            )}
          </Field>
          <Field label="이름" required error={errors.name?.message}>
            {(props) => (
              <input
                className="input"
                maxLength={LIMITS.destinationName}
                {...props}
                {...register('name')}
              />
            )}
          </Field>
          <Field label="원어 이름" error={errors.originalName?.message}>
            {(props) => (
              <input className="input" lang="en" {...props} {...register('originalName')} />
            )}
          </Field>
          <Field label="한 줄 소개" required error={errors.tagline?.message}>
            {(props) => (
              <input
                className="input"
                maxLength={LIMITS.tagline}
                {...props}
                {...register('tagline')}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className="form__section">
        <legend className="form__legend">
          <span aria-hidden="true">CATEGORY</span> 분류
        </legend>
        <div className="form__grid">
          <Field label="세계" required error={errors.realm?.message}>
            {(props) => (
              <select
                className="input"
                {...props}
                {...register('realm', {
                  onChange: (event: { target: { value: string } }) => {
                    const next = realmSchema.safeParse(event.target.value);
                    if (next.success) setValue('lore', LORES_BY_REALM[next.data][0] ?? 'history');
                  },
                })}
              >
                {realmSchema.options.map((value) => (
                  <option key={value} value={value}>
                    {REALM_LABELS[value]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="분류" required error={errors.lore?.message}>
            {(props) => (
              <select className="input" {...props} {...register('lore')}>
                {LORES_BY_REALM[realm].map((value) => (
                  <option key={value} value={value}>
                    {LORE_LABELS[value]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            label="묶음"
            required
            error={errors.group?.message}
            hint="실존은 대륙(예: 유럽), 환상은 전승권(예: 켈트·아더왕)"
          >
            {(props) => <input className="input" {...props} {...register('group')} />}
          </Field>
          <Field label="시대" error={errors.era?.message}>
            {(props) => <input className="input" {...props} {...register('era')} />}
          </Field>
        </div>
      </fieldset>

      <fieldset className="form__section">
        <legend className="form__legend">
          <span aria-hidden="true">LOCATION</span> 위치
        </legend>
        <div className="form__grid">
          <Field label="지역" error={errors.location?.message}>
            {(props) => <input className="input" {...props} {...register('location')} />}
          </Field>
          <Field label="위도" required error={errors.latitude?.message} hint="-90~90">
            {(props) => (
              <input
                className="input"
                type="number"
                step="any"
                inputMode="decimal"
                {...props}
                {...register('latitude', { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field label="경도" required error={errors.longitude?.message} hint="-180~180">
            {(props) => (
              <input
                className="input"
                type="number"
                step="any"
                inputMode="decimal"
                {...props}
                {...register('longitude', { valueAsNumber: true })}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className="form__section">
        <legend className="form__legend">
          <span aria-hidden="true">STORY</span> 소개
        </legend>
        <Field label="소개" error={errors.overview?.message} hint={`${LIMITS.overview}자 이하`}>
          {(props) => (
            <textarea className="input input--area" rows={6} {...props} {...register('overview')} />
          )}
        </Field>
      </fieldset>

      {save.error && !(save.error instanceof AdminError && save.error.code === 'conflict') ? (
        <ErrorState error={save.error} />
      ) : null}
      <div className="form__actions">
        <ButtonLink
          to={initial ? `/destinations/${encodeURIComponent(initial.id)}` : '/destinations'}
          variant="line"
        >
          취소
        </ButtonLink>
        <Button type="submit" variant="solid" disabled={save.isPending}>
          {save.isPending ? '저장하는 중' : initial ? '수정 저장' : '여행지 추가'}
        </Button>
      </div>
    </form>
  );
}
