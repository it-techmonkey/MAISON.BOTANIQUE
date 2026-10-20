"""Connect ignored image-pipeline working data without copying source or calling APIs."""
import argparse
import os
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]


def link_path(link: Path, target: Path, *, directory: bool = True):
    target = target.expanduser().resolve()
    if link.is_symlink():
        if link.resolve() != target:
            raise ValueError(f'Refusing to replace an existing link: {link}')
        return
    if link.exists():
        raise ValueError(f'Refusing to replace existing files: {link}')
    if directory:
        target.mkdir(parents=True, exist_ok=True)
    elif not target.is_file():
        raise ValueError('The supplied secrets file does not exist')
    link.parent.mkdir(parents=True, exist_ok=True)
    link.symlink_to(os.path.relpath(target, link.parent), target_is_directory=directory)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, default=REPO / '.local/image-pipeline')
    parser.add_argument('--refs-dir', type=Path)
    parser.add_argument('--diwali-refs-dir', type=Path)
    parser.add_argument('--secrets-file', type=Path)
    args = parser.parse_args()
    pipeline = REPO / 'catalog/image-pipeline'
    targets = [(pipeline / name, args.data_dir / name, True) for name in ['out', 'qa', 'jobs']]
    targets += [(pipeline / 'refs', args.refs_dir or args.data_dir / 'refs', True),
                (pipeline / 'diwali/jobs', args.data_dir / 'diwali/jobs', True),
                (pipeline / 'diwali/refs', args.diwali_refs_dir or args.data_dir / 'diwali/refs', True)]
    if args.secrets_file:
        targets.append((pipeline / 'api-keys.txt', args.secrets_file, False))
    # Check every destination before creating any link.
    for link, target, directory in targets:
        if link.is_symlink() and link.resolve() != target.expanduser().resolve():
            parser.error(f'Existing link points elsewhere: {link}')
        if link.exists() and not link.is_symlink():
            parser.error(f'Existing data must be preserved before linking: {link}')
        if not directory and not target.expanduser().is_file():
            parser.error('The supplied secrets file does not exist')
    for link, target, directory in targets:
        link_path(link, target, directory=directory)
    print(f'Connected {len(targets)} local paths. No API calls or Shopify writes.')


if __name__ == '__main__':
    main()
