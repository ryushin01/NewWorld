import { z } from 'zod';
import type { PlaceInput } from '@/shared/api';
import { LIMITS } from '@/shared/config';

export const placeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '장소 이름을 입력해 주세요.')
    .max(LIMITS.title, `${LIMITS.title}자 이내로 입력해 주세요.`),
  kind: z.enum(['real', 'fantasy']),
  // 검색·지도에서 받아 오는 값이라 입력 칸이 없으므로 넘치면 잘라 저장합니다.
  // DB(char_length)처럼 글자(코드 포인트) 단위로 잘라 이모지 같은 글자가 반으로 쪼개지지 않게 합니다.
  address: z.string().transform((value) => Array.from(value).slice(0, LIMITS.address).join('')),
  latitude: z.number(),
  longitude: z.number(),
  memo: z.string().max(LIMITS.longText, `${LIMITS.longText}자 이내로 입력해 주세요.`),
  tags: z
    .array(z.string().max(LIMITS.tagLength, `태그는 ${LIMITS.tagLength}자 이내로 입력해 주세요.`))
    .max(LIMITS.tags, `태그는 ${LIMITS.tags}개까지 넣을 수 있습니다.`),
  catalogId: z.string().nullable(),
  wishlisted: z.boolean(),
}) satisfies z.ZodType<PlaceInput>;
