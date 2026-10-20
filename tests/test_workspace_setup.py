import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('workspace_setup', Path(__file__).resolve().parents[1] / 'scripts/setup-workspace.py')
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class WorkspaceLinks(unittest.TestCase):
    def test_link_preserves_data_and_is_repeatable(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            target = root / 'media/out'
            target.mkdir(parents=True)
            (target / 'approved.txt').write_text('preserve')
            link = root / 'pipeline/out'
            setup.link_path(link, target)
            setup.link_path(link, target)
            self.assertEqual((link / 'approved.txt').read_text(), 'preserve')
            self.assertFalse(Path(link.readlink()).is_absolute())

    def test_existing_directory_and_different_link_are_never_replaced(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            existing = root / 'existing'
            existing.mkdir()
            with self.assertRaises(ValueError):
                setup.link_path(existing, root / 'replacement')
            link = root / 'linked'
            setup.link_path(link, root / 'original')
            with self.assertRaises(ValueError):
                setup.link_path(link, root / 'different')
            self.assertEqual(link.resolve(), root / 'original')

    def test_missing_credentials_are_not_created(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            with self.assertRaises(ValueError):
                setup.link_path(root / 'api-keys.txt', root / 'missing.env', directory=False)
            self.assertFalse((root / 'api-keys.txt').exists())


if __name__ == '__main__':
    unittest.main()
