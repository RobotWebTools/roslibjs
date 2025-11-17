# How to release roslibjs

## 0. Make sure that the releasing module is compatible with other RWT modules

## 1. Generate CHANGELOG using `npm run make-changelog`

* (and clean it up by hand a little bit until we figure out how to make it substitute in-line)

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