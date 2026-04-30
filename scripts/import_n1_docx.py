import argparse
import json
import re
import warnings
from pathlib import Path

from docx import Document
from pykakasi import kakasi

warnings.filterwarnings('ignore', category=DeprecationWarning)

SEPARATOR_PATTERN = re.compile(r'^—+$')
HEAD_PATTERN = re.compile(r'^(?P<kana>.+?)(?:【(?P<kanji>.+?)】)?◆\s*(?P<rest>.*)$')
MEANING_PATTERN = re.compile(r'^(?P<example>.+?)「(?P<translation>.+?)」$')
AD_SUFFIX_PATTERN = re.compile(r'\s*N1 核心 800 词[-－].*$', re.IGNORECASE)


def normalize_lines(paragraphs):
    lines = [p.text.strip() for p in paragraphs if p.text.strip()]
    merged = []
    for line in lines:
        if (
            merged
            and not SEPARATOR_PATTERN.match(line)
            and '◆' not in line
            and not merged[-1].endswith('」')
            and not SEPARATOR_PATTERN.match(merged[-1])
        ):
            merged[-1] = merged[-1] + ' ' + line
        else:
            merged.append(line)
    return merged


def parse_entries(lines):
    entries = []
    current = None

    def flush_current():
        nonlocal current
        if current is not None:
            entries.append(current)
            current = None

    for line in lines:
        if SEPARATOR_PATTERN.match(line):
            continue

        if '◆' in line:
            flush_current()
            match = HEAD_PATTERN.match(line)
            if not match:
                continue
            kana = match.group('kana').strip()
            kanji = (match.group('kanji') or '').strip()
            rest = match.group('rest').strip()
            current = {
                'kana': kana,
                'kanji': kanji,
                'meanings': []
            }
            if rest:
                meaning = parse_meaning_line(rest)
                if meaning:
                    current['meanings'].append(meaning)
                else:
                    current['meanings'].append({'meaning': '', 'example': rest, 'exampleTranslation': ''})
        else:
            if current is None:
                continue
            meaning = parse_meaning_line(line)
            if meaning:
                current['meanings'].append(meaning)
            elif current['meanings']:
                current['meanings'][-1]['example'] += ' ' + line
            else:
                current['meanings'].append({'meaning': '', 'example': line, 'exampleTranslation': ''})

    flush_current()
    return entries


def parse_meaning_line(line):
    line = AD_SUFFIX_PATTERN.sub('', line).strip()
    match = MEANING_PATTERN.match(line)
    if not match:
        return None
    return {
        'meaning': match.group('translation').strip(),
        'example': match.group('example').strip(),
        'exampleTranslation': match.group('translation').strip(),
    }


kks = kakasi()
kks.setMode('H', 'a')
kks.setMode('K', 'a')
converter = kks


def kana_to_romaji(kana_text):
    kana_text = kana_text.replace('　', '').replace(' ', '')
    return ''.join(item['hepburn'] for item in converter.convert(kana_text))


def build_word_entry(entry, index, category, difficulty):
    kana = entry['kana'].replace('　', '').strip()
    kanji = entry['kanji'].strip()
    if kana == '':
        kana = kanji
    return {
        'id': f'w{index:03d}',
        'kanji': kanji,
        'kana': kana,
        'romaji': kana_to_romaji(kana),
        'meanings': entry['meanings'],
        'category': category,
        'difficulty': difficulty,
        'tags': [],
    }


def main():
    parser = argparse.ArgumentParser(description='Import N1 vocabulary DOCX into JSON')
    parser.add_argument('--docx', type=Path, default=Path('N1核心词汇800词｜帝京日语 纯净_加水印.docx'),
                        help='Path to the source DOCX file')
    parser.add_argument('--output', type=Path, default=Path('src/data/words.json'),
                        help='Path to output JSON file')
    parser.add_argument('--category', default='N1核心', help='Word category')
    parser.add_argument('--difficulty', type=int, default=3, help='Default difficulty')
    args = parser.parse_args()

    if not args.docx.exists():
        raise FileNotFoundError(f'DOCX file not found: {args.docx}')

    document = Document(args.docx)
    lines = normalize_lines(document.paragraphs)
    entries = parse_entries(lines)
    words = [build_word_entry(entry, idx + 1, args.category, args.difficulty)
             for idx, entry in enumerate(entries)]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f'Imported {len(words)} entries.')


if __name__ == '__main__':
    main()
