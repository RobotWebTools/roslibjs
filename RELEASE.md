# Robot Web Tools Module Release TODOs

This document describes TODOs and checklists in order to release
Robot Web Tool javascript modules([roslibjs](https://github.com/RobotWebTools/roslibjs), [ros2djs](https://github.com/RobotWebTools/ros2djs), [ros3djs](https://github.com/RobotWebTools/ros3djs)).

## 0. Make sure that the releasing module is compatible with other RWT modules

## 1. Generate CHANGELOG using [github-changes](https://github.com/lalitkapoor/github-changes)

```bash
github-changes -o RobotWebTools -r roslibjs --only-pulls --use-commit-body -a -b develop
```

## 2. Bump a new version

* Version bump in package.json, bower.json, and in the main file. e.g) [RosLib.js](src/RosLib.js)
* Mark *upcoming* in CHAGELOG.md as the new release version
* Tag the version
* Create a new release on GitHub. Let GitHub auto-generate the changelog there.

## 3. Release modules

### NPM

Keep all modules under @robot-web-tools scope? or in global scope? What are pros and cons?

* `npm publish`

### CDN

Talk to @rctoris

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
