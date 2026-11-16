const SYLLABLE_FIRST = 0xac00;
const SYLLABLE_LAST = 0xd7a3;
/** 한 초성에 딸린 음절 수(중성 21 × 종성 28) */
const PER_INITIAL = 588;
const PER_MEDIAL = 28;
const INITIALS = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];

const syllableIndex = (char: string) => {
  const code = char.charCodeAt(0);
  return code >= SYLLABLE_FIRST && code <= SYLLABLE_LAST ? code - SYLLABLE_FIRST : null;
};

/** 한글 음절의 초성. 음절이 아니면 그대로 돌려줍니다. */
export const initialOf = (char: string) => {
  const index = syllableIndex(char);
  return index === null ? char : INITIALS[Math.floor(index / PER_INITIAL)];
};

/**
 * 입력한 한 글자가 본문의 한 글자와 맞는지 봅니다.
 * - 초성만 친 글자(ㅍ)는 초성이 같은 음절(피·포·판…)과 맞습니다.
 * - 마지막으로 받침 없이 친 글자(로)는 아직 받침을 치는 중일 수 있어(론·롱…) 초성과 중성이 같으면 맞습니다.
 */
const charMatches = (textChar: string, termChar: string, typing: boolean) => {
  if (textChar === termChar) return true;
  if (INITIALS.includes(termChar)) return initialOf(textChar) === termChar;
  if (!typing) return false;
  const term = syllableIndex(termChar);
  const text = syllableIndex(textChar);
  if (term === null || text === null || term % PER_MEDIAL !== 0) return false;
  return Math.floor(text / PER_MEDIAL) === Math.floor(term / PER_MEDIAL);
};

const compact = (value: string) => [...value.toLowerCase().replace(/\s+/g, '')];

/**
 * 검색어가 본문에 들어 있는지 봅니다. 대소문자와 띄어쓰기는 따지지 않고,
 * 한글은 초성만(ㅍㄹㅁㄷ → 피라미드) 치거나 마지막 글자를 치는 중(아발로 → 아발론)이어도 찾습니다.
 */
export const matchesSearch = (text: string, keyword: string) => {
  const term = compact(keyword);
  if (term.length === 0) return true;
  const chars = compact(text);
  for (let start = 0; start + term.length <= chars.length; start += 1) {
    const matched = term.every((char, offset) =>
      charMatches(chars[start + offset], char, offset === term.length - 1),
    );
    if (matched) return true;
  }
  return false;
};
