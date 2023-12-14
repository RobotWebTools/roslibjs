# Robot Web Tools Module Release TODOs

This document describes TODOs and checklists in order to release
Robot Web Tool javascript modules([roslibjs](https://github.com/RobotWebTools/roslibjs), [ros2djs](https://github.com/RobotWebTools/ros2djs), [ros3djs](https://github.com/RobotWebTools/ros3djs)).

## 0. Make sure that the releasing module is compatible with other RWT modules

## 1. Generate CHANGELOG using [github-changelog-generator](https://github.com/github-changelog-generator/github-changelog-generator)

```bash
docker run -it --rm -v "$(pwd)":/usr/local/src/your-app githubchangeloggenerator/github-changelog-generator -u robotwebtools -p <PACKAGE_NAME> --usernames-as-github-logins --simple-list --no-issues --date-format "%Y-%m-%d %H:%M %z" -t <YOUR_GITHUB_TOKEN>
```

## 2. Bump a new version

* Version bump in package.json, bower.json, and in the main file. e.g) [RosLib.js](src/RosLib.js)
* Tag the version

## 3. Release modules

### NPM

Publish the module. We publish in the global scope.

* `npm publish`

### CDN

Hosted via the [JsDelivr](https://www.jsdelivr.com/) CDN, which takes it directly from the repo.

## 4. Create GitHub Release

* Create a new GitHub release based on the new git tag.
* Add the version number as release title (Without leading `v`).
* Let GitHub auto-generate the Changelog
* Mark `Set as latest release`
* Publish release

## 5. Update JSdocs in Robot Web Tools website

The JSdocs are update automatically by GitHub Actions [config](.github/workflows/docs.yml). The GitHub release created above, will trigger this run. The docs are hosted in their own repository at the `gh-pages` branch.

## 6. Sync `develop` branch with `master`

`Master` branch should represent the latest release.

* Create a PR against `master` from `develop`
* Do *Rebase and merge* to have the same history as `develop` branch
