# Deploy safety — architecture docs

Templates copied by `architecture-kit init`. Use with `site.exposure` and `governance.docsProductionExposure` in `architecture.config.json`.

| File | Use |
|------|-----|
| [wordpress.distignore.example](./wordpress.distignore.example) | rsync/FTP deploy — exclude docs from theme sync |
| [all-in-one-wp-migration-excludes.txt.example](./all-in-one-wp-migration-excludes.txt.example) | All-in-One WP Migration exclude list |
| [apache-deny-architecture.htaccess.example](./apache-deny-architecture.htaccess.example) | Block HTTP access if HTML lives under web root |

## Config

```json
{
  "site": {
    "exposure": "dev-staging"
  },
  "governance": {
    "docsProductionExposure": "dev-only"
  }
}
```

- **local** / **dev-staging**: built HTML should not ship to public production
- **production**: only when docs are intentionally public

## CI check

After building a deploy artifact:

```bash
npx architecture-kit validate --deploy-artifact .next/standalone
# or
npx architecture-kit validate --deploy-artifact ./dist-theme
```

Fails when forbidden paths (`public/architecture/`, `.architecture-kit/`, `docs/` for WordPress) appear in the artifact.
