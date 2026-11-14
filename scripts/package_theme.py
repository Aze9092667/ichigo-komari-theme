"""Create the installable Komari theme ZIP using only Python's standard library."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile, ZipInfo
import hashlib
import json
import stat

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
    address_families = next((item for item in data if item.get('key') == 'azeNodeAddressFamilies'), None)
    if address_families and json.loads(address_families.get('default') or '{}') != {}:
        raise SystemExit('Public packages must not contain private address-family summaries.')
    index = ROOT / 'dist/index.html'
    if not index.is_file():
        raise SystemExit('dist/index.html is missing.')
    html = index.read_text(encoding='utf-8')
    if '/api/plugin/unlock-test/assets/' in html or 'function nfSyncWidgetVisibility' in html:
        raise SystemExit('Remove mirrored plugin injection before packaging to avoid duplicate widgets.')
    files = [ROOT / name for name in REQUIRED]
    files.extend(path for path in (ROOT / 'dist').rglob('*') if path.is_file())
    for path in files:
        if path.is_symlink():
            raise SystemExit(f'Symlinks are not packaged: {path.relative_to(ROOT)}')
    directories = sorted({parent for path in files for parent in path.parents if parent != ROOT and ROOT in parent.parents}, key=lambda path: (len(path.parts), path.as_posix()))
    output = ROOT / 'release/Ichigo-Komari-Theme.zip'
    output.parent.mkdir(exist_ok=True)
    with ZipFile(output, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for path in directories:
            info = ZipInfo.from_file(path, path.relative_to(ROOT).as_posix() + '/')
            info.create_system = 3
            info.external_attr = ((stat.S_IFDIR | 0o755) << 16) | 0x10
            info.compress_type = ZIP_STORED
            archive.writestr(info, b'')
        for path in sorted(files):
            info = ZipInfo.from_file(path, path.relative_to(ROOT).as_posix())
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())
    with ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise SystemExit('ZIP CRC validation failed.')
        entries = archive.infolist()
        names = {entry.filename for entry in entries}
        if len(names) != len(entries):
            raise SystemExit('Duplicate ZIP paths are not allowed.')
        for name in (*REQUIRED, 'dist/index.html', 'dist/', 'dist/assets/'):
            if name not in names:
                raise SystemExit(f'Missing ZIP entry: {name}')
        for entry in entries:
            expected = stat.S_IFDIR | 0o755 if entry.is_dir() else stat.S_IFREG | 0o644
            if entry.create_system != 3 or entry.external_attr >> 16 != expected:
                raise SystemExit(f'Invalid Unix ZIP permissions: {entry.filename}')
    print(json.dumps({'zip': str(output.relative_to(ROOT)), 'version': manifest['version'], 'files': len(files), 'directories': len(directories), 'bytes': output.stat().st_size, 'sha256': hashlib.sha256(output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
