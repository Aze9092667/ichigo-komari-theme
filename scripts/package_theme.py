"""Create the installable Komari theme ZIP using only Python's standard library."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import json

ROOT = Path(__file__).resolve().parent.parent
REQUIRED = (
    'komari-theme.json',
    'preview.png',
    'TRANSIT-LICENSE.txt',
    'THIRD_PARTY_NOTICES.md',
)


def main():
    for name in REQUIRED:
        if not (ROOT / name).is_file():
            raise SystemExit(f'Missing required file: {name}')
    manifest = json.loads((ROOT / 'komari-theme.json').read_text(encoding='utf-8'))
    data = manifest.get('configuration', {}).get('data', [])
    snapshots = next((item for item in data if item.get('key') == 'pandaOpsRouteProbeResults'), None)
    if snapshots and json.loads(snapshots.get('default') or '{}') != {}:
        raise SystemExit('Public packages must not contain private route snapshots.')
    index = ROOT / 'dist/index.html'
    if not index.is_file():
        raise SystemExit('dist/index.html is missing.')
    html = index.read_text(encoding='utf-8')
    if '/api/plugin/unlock-test/assets/' in html or 'function nfSyncWidgetVisibility' in html:
        raise SystemExit('Remove mirrored plugin injection before packaging to avoid duplicate widgets.')
    files = [ROOT / name for name in REQUIRED]
    files.extend(path for path in (ROOT / 'dist').rglob('*') if path.is_file())
    output = ROOT / 'release/Ichigo-Komari-Theme.zip'
    output.parent.mkdir(exist_ok=True)
    with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(files):
            if path.is_symlink():
                raise SystemExit(f'Symlinks are not packaged: {path.relative_to(ROOT)}')
            archive.write(path, path.relative_to(ROOT).as_posix())
    print(f'Packaged {len(files)} files for {manifest["version"]}: {output.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
