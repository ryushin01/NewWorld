"""본문 글꼴(유앤피플 고딕 UNI)을 앱에 넣을 크기로 만듭니다.

공식 배포 TTF에서 화면 표시에 쓰지 않는 TrueType 힌팅 명령과, 글자 번호(cmap)나 글자 바꿈(GSUB)으로
닿을 수 없는 글리프만 뺍니다. 글자 범위(한글 11,172자 포함)와 글자 모양, 글자 사이 간격, 이름표(저작권·라이선스)는
그대로입니다(예전 방식 커닝 표 `kern`도 남김). iOS는 힌팅을 쓰지 않고, 제목 글꼴(build-title-font.py)도 같은 옵션으로 만듭니다. 약 2.5MB → 1.2MB.
글꼴은 SIL Open Font License 1.1이며 고친 파일도 같은 라이선스입니다(assets/fonts/unpeople-gothic/LICENSE.txt).

사용(fontTools 필요):
  python3 scripts/fonts/build-body-font.py "유앤피플 고딕 UNI.ttf" assets/fonts/unpeople-gothic/UnpeopleGothic-UNI.ttf
"""

import sys

from fontTools import subset
from fontTools.ttLib import TTFont


def main(source_path: str, out_path: str) -> None:
    font = TTFont(source_path)
    unicodes = sorted(font.getBestCmap())
    before = len(font.getGlyphOrder())

    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.hinting = False
    # GPOS가 있어도 예전 방식 커닝 표를 남깁니다(글자 사이 간격이 원본과 같도록).
    options.legacy_kern = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    font.save(out_path)

    after = TTFont(out_path)
    if sorted(after.getBestCmap()) != unicodes:
        sys.exit("글자 범위가 원본과 달라졌습니다.")
    print(f"글자 {len(unicodes)}개 그대로, 글리프 {before} → {len(after.getGlyphOrder())}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
