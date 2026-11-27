import { z } from 'zod';
import { LIMITS, reportActionSchema } from '@admin/shared/api';

export const handleReportSchema = z.object({
  action: reportActionSchema,
  note: z
    .string()
    .trim()
    .min(1, '처리 메모를 적어 주세요.')
    .max(LIMITS.note, `처리 메모는 ${LIMITS.note}자 이하입니다.`),
});
export type HandleReportValues = z.infer<typeof handleReportSchema>;
