import argparse
import json
from pathlib import Path

import numpy as np


DEFAULT_EXTENSIONS = (".txt", ".md", ".html", ".json")


def load_and_clean(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")

    if path.suffix.lower() == ".json":
        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            return text
        return json.dumps(obj, separators=(",", ":"))

    return text.replace("<", " ").replace(">", " ")


def pi_tokenize(text: str, vocab_size: int) -> list[int]:
    return [ord(char) % vocab_size for char in text]


def iter_source_files(input_dir: Path, extensions: tuple[str, ...]) -> list[Path]:
    return [
        path
        for path in input_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in extensions
    ]


def pack_directory(
    input_dir: Path,
    output_file: Path,
    vocab_size: int,
    atom_size: int,
    extensions: tuple[str, ...],
) -> dict[str, int]:
    tokens: list[int] = []

    for path in iter_source_files(input_dir, extensions):
        text = load_and_clean(path)
        tokens.extend(pi_tokenize(text, vocab_size))

    pad = (-len(tokens)) % atom_size
    if pad:
        tokens.extend([0] * pad)

    arr = np.array(tokens, dtype=np.uint16)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    arr.tofile(output_file)

    return {
        "tokens": len(arr),
        "atoms": len(arr) // atom_size,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pack text/JSON/HTML into binary atoms.")
    parser.add_argument("input_dir", type=Path, help="Directory to scan for source files.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("matrix_atoms.bin"),
        help="Output binary file path.",
    )
    parser.add_argument(
        "--vocab-size",
        type=int,
        default=65536,
        help="Vocabulary size (uint16 range).",
    )
    parser.add_argument(
        "--atom-size",
        type=int,
        default=256,
        help="Tokens per atom (fixed width).",
    )
    parser.add_argument(
        "--extensions",
        type=str,
        default=",".join(DEFAULT_EXTENSIONS),
        help="Comma-separated list of file extensions to ingest.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not 1 <= args.vocab_size <= 65536:
        raise ValueError("vocab-size must be within 1..65536 for uint16 packing.")
    if args.atom_size <= 0:
        raise ValueError("atom-size must be a positive integer.")
    extensions = tuple(
        ext.strip().lower()
        for ext in args.extensions.split(",")
        if ext.strip()
    )

    stats = pack_directory(
        args.input_dir,
        args.output,
        args.vocab_size,
        args.atom_size,
        extensions,
    )

    print(f"[OK] Packed {stats['tokens']} tokens")
    print(f"[OK] Atoms: {stats['atoms']}")
    print(f"[OK] Output: {args.output}")


if __name__ == "__main__":
    main()
