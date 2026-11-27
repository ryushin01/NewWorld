import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { AdminError, LIMITS, useBackend, type Course, type CourseInput } from '@admin/shared/api';
import { courseKeys } from '@admin/entities/course';
import { useDestinations } from '@admin/entities/destination';
import { navigate } from '@admin/shared/lib';
import { Button, ButtonLink, ErrorState, Field, useAnnounce } from '@admin/shared/ui';
import { courseFormSchema, type CourseFormValues } from '../model/schema';
import { StopsEditor } from './stops-editor';

/** 전설의 현장 코스 추가·수정. 코스를 만들면 앱이 '○○ 완주' 뱃지를 함께 계산합니다. */
export function CourseForm({ initial }: { initial?: Course }) {
  const backend = useBackend();
  const client = useQueryClient();
  const announce = useAnnounce();
  const destinations = useDestinations();
  const save = useMutation({
    mutationFn: (input: CourseInput) => backend.saveCourse(input, initial ? 'update' : 'create'),
    onSuccess: () => client.invalidateQueries({ queryKey: courseKeys.all }),
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: initial ?? { id: '', title: '', summary: '', stops: [] },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(values);
      announce(`${saved.title} 코스를 저장했습니다.`);
      navigate('/courses');
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
      aria-label={initial ? '코스 수정' : '코스 추가'}
    >
      <fieldset className="form__section">
        <legend className="form__legend">
          <span aria-hidden="true">COURSE</span> 코스
        </legend>
        <div className="form__grid">
          <Field
            label="ID"
            required
            error={errors.id?.message}
            hint={initial ? '뱃지 ID(course-…)와 이어져 바꿀 수 없습니다.' : '예: silk-road'}
          >
            {(props) => (
              <input className="input" readOnly={Boolean(initial)} {...props} {...register('id')} />
            )}
          </Field>
          <Field label="코스 이름" required error={errors.title?.message}>
            {(props) => (
              <input
                className="input"
                maxLength={LIMITS.courseTitle}
                {...props}
                {...register('title')}
              />
            )}
          </Field>
        </div>
        <Field label="코스 소개" required error={errors.summary?.message}>
          {(props) => (
            <textarea className="input input--area" rows={3} {...props} {...register('summary')} />
          )}
        </Field>
      </fieldset>
      <fieldset className="form__section">
        <legend className="form__legend">
          <span aria-hidden="true">STOPS</span> 들르는 여행지
        </legend>
        <Field
          label="여행지 더하기"
          error={errors.stops?.message ?? errors.stops?.root?.message}
          hint={`2~${LIMITS.courseStops}곳, 순서대로 들릅니다.`}
        >
          {(props) => (
            <Controller
              control={control}
              name="stops"
              render={({ field }) => (
                <StopsEditor
                  inputId={props.id}
                  selectRef={field.ref}
                  describedBy={props['aria-describedby']}
                  error={errors.stops?.message}
                  value={field.value}
                  onChange={field.onChange}
                  destinations={destinations.data ?? []}
                />
              )}
            />
          )}
        </Field>
      </fieldset>
      {save.error && !(save.error instanceof AdminError && save.error.code === 'conflict') ? (
        <ErrorState error={save.error} />
      ) : null}
      <div className="form__actions">
        <ButtonLink to="/courses" variant="line">
          취소
        </ButtonLink>
        <Button type="submit" variant="solid" disabled={save.isPending}>
          {save.isPending ? '저장하는 중' : initial ? '수정 저장' : '코스 추가'}
        </Button>
      </div>
    </form>
  );
}
