"""제목 글꼴(NewWorld Title)을 만듭니다.

한글재민체 3.0은 한글 11,172자에 글자 번호를 매겨 두었지만 실제로 그린 글자는 2,350자이고 나머지는 빈칸입니다.
React Native에는 글꼴 대체 목록이 없어, 빈칸 글자를 빼기만 하면 시스템 글꼴로 넘어갑니다.
그래서 재민체에서 실제로 그린 글자만 남기고, 빠진 글자는 본문 글꼴 유앤피플 고딕 UNI로 채워 한 파일로 합칩니다.
두 글꼴 모두 SIL Open Font License 1.1이며, 합친 글꼴도 같은 라이선스입니다(assets/fonts/newworld-title/LICENSE.txt).

사용(fontTools 필요):
  python3 scripts/fonts/build-title-font.py Jaemin3-Regular.ttf "유앤피플 고딕 UNI.ttf" assets/fonts/newworld-title/NewWorldTitle-Regular.ttf
"""

import io
import sys

from fontTools import subset
from fontTools.merge import Merger
from fontTools.pens.boundsPen import ControlBoundsPen
from fontTools.ttLib import TTFont

# 모양은 없지만 너비가 있어야 하는 공백 글자
SPACES = {0x20, 0xA0, 0x2002, 0x2003, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000}


def keep_from_jaemin(cp: int) -> bool:
    """재민체에서 가져올 범위: 기본 라틴·문장 부호·기호·한글. 한자는 앱에 쓰지 않아 뺍니다(용량 약 8 MB)."""
    return (
        0x20 <= cp <= 0x7E
        or 0xA0 <= cp <= 0xFF
        or 0x2000 <= cp <= 0x2BFF
        or 0x3000 <= cp <= 0x303F
        or 0x3131 <= cp <= 0x318E
        or 0xAC00 <= cp <= 0xD7A3
        or 0xFF01 <= cp <= 0xFFEF
    )


def drawn_codepoints(font: TTFont) -> set[int]:
    """실제 윤곽이 있는 글자(공백 글자는 너비가 있으면 포함)."""
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    found = set()
    for cp, name in cmap.items():
        pen = ControlBoundsPen(glyphs)
        glyphs[name].draw(pen)
        if pen.bounds is not None or (cp in SPACES and font["hmtx"][name][0] > 0):
            found.add(cp)
    return found


def subset_font(path: str, unicodes: set[int]) -> TTFont:
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.hinting = False
    options.notdef_outline = True
    font = TTFont(path)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=sorted(unicodes))
    subsetter.subset(font)
    return font


def set_names(font: TTFont, jaemin_copyright: str) -> None:
    name = font["name"]
    name.names = []
    records = {
        0: f"{jaemin_copyright} (Hangeul Jaemin 3.0) / UNPEOPLE Gothic UNI (c) 2018 UNPEOPLE Co., Ltd.",
        1: "NewWorld Title",
        2: "Regular",
        3: "1.000;NewWorld Title Regular",
        4: "NewWorld Title Regular",
        5: "Version 1.000; Hangeul Jaemin 3.0 1.000 + UNPEOPLE Gothic UNI 1.0",
        6: "NewWorldTitle-Regular",
        13: "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
        14: "https://openfontlicense.org",
    }
    for name_id, text in records.items():
        name.setName(text, name_id, 3, 1, 0x409)
        name.setName(text, name_id, 1, 0, 0)


def main(jaemin_path: str, unpeople_path: str, out_path: str) -> None:
    jaemin = TTFont(jaemin_path)
    unpeople = TTFont(unpeople_path)
    if jaemin["head"].unitsPerEm != unpeople["head"].unitsPerEm:
        sys.exit("두 글꼴의 unitsPerEm이 달라 합칠 수 없습니다.")

    from_jaemin = {cp for cp in drawn_codepoints(jaemin) if keep_from_jaemin(cp)}
    from_unpeople = drawn_codepoints(unpeople) - from_jaemin
    jaemin_copyright = jaemin["name"].getDebugName(0)

    first = subset_font(jaemin_path, from_jaemin)
    second = subset_font(unpeople_path, from_unpeople)
    # 두 글꼴의 표 구성을 맞춥니다(합칠 때 한쪽에만 있는 표는 오류가 납니다).
    for font in (first, second):
        for tag in ("DSIG", "gasp", "vhea", "vmtx", "VORG", "BASE", "meta", "LTSH", "hdmx", "VDMX", "kern"):
            if tag in font:
                del font[tag]

    buffers = []
    for font in (first, second):
        buffer = io.BytesIO()
        font.save(buffer)
        buffer.seek(0)
        buffers.append(buffer)
    merged = Merger().merge(buffers)

    # 줄 높이와 기준선은 재민체 값을 그대로 씁니다(합치면 두 글꼴의 큰 값으로 바뀜).
    for tag, fields in {
        "hhea": ("ascent", "descent", "lineGap"),
        "OS/2": ("sTypoAscender", "sTypoDescender", "sTypoLineGap", "usWinAscent", "usWinDescent", "fsSelection", "sxHeight", "sCapHeight", "fsType"),
        "post": ("underlinePosition", "underlineThickness"),
    }.items():
        for field in fields:
            if hasattr(first[tag], field):
                setattr(merged[tag], field, getattr(first[tag], field))
    merged["OS/2"].recalcUnicodeRanges(merged)
    set_names(merged, jaemin_copyright)
    merged.save(out_path)

    hangul = range(0xAC00, 0xD7A4)
    print(f"재민체에서 가져온 글자: {len(from_jaemin)} (한글 {sum(cp in from_jaemin for cp in hangul)})")
    print(f"유앤피플 고딕 UNI로 채운 글자: {len(from_unpeople)} (한글 {sum(cp in from_unpeople for cp in hangul)})")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
