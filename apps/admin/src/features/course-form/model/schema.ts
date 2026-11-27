import { z } from 'zod';
import { LIMITS } from '@admin/shared/api';
import { slugSchema } from '@admin/features/destination-form';

export const courseFormSchema = z.object({
  id: slugSchema,
  title: z
    .string()
    .trim()
    .min(1, '코스 이름을 입력해 주세요.')
    .max(LIMITS.courseTitle, `코스 이름은 ${LIMITS.courseTitle}자 이하입니다.`),
  summary: z
    .string()
    .trim()
    .min(1, '코스 소개를 입력해 주세요.')
    .max(LIMITS.courseSummary, `코스 소개는 ${LIMITS.courseSummary}자 이하입니다.`),
  stops: z
    .array(z.string())
    .min(2, '여행지를 2곳 이상 담아 주세요.')
    .max(LIMITS.courseStops, `여행지는 ${LIMITS.courseStops}곳까지 담습니다.`)
    .refine(
      (stops) => new Set(stops).size === stops.length,
      '같은 여행지를 두 번 담을 수 없습니다.',
    ),
});
export type CourseFormValues = z.infer<typeof courseFormSchema>;
