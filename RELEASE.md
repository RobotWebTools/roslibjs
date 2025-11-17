# How to release roslibjs

## 0. Make sure that the releasing module is compatible with other RWT modules

## 1. Generate CHANGELOG using [github-changelog-generator](https://github.com/github-changelog-generator/github-changelog-generator)

```bash
docker run -it --rm -v "$(pwd)":/usr/local/src/your-app githubchangeloggenerator/github-changelog-generator -u robotwebtools -p <PACKAGE_NAME> --usernames-as-github-logins --simple-list --no-issues --date-format "%Y-%m-%d %H:%M %z" -t <YOUR_GITHUB_TOKEN>
```

## 2. Bump a new version

* Version bump in [package.json](./package.json)
* Tag the version

## 3. Create GitHub Release

* Create a new GitHub release based on the new git tag.
* Add the version number as release title (Without leading `v`).
* Let GitHub auto-generate the Changelog
* Mark `Set as latest release`
* Publish release
* [The CD action](.github/workflows/cd.yml) will automatically publish the docs to the website and publish the package to npm.