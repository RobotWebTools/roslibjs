Robot Web Tools Module Release TODOs
====================================

This document describes TODOs and checklists in order to release
Robot Web Tool javascript modules([roslibjs](https://github.com/RobotWebTools/roslibjs), [ros2djs](https://github.com/RobotWebTools/ros2djs), [ros3djs](https://github.com/RobotWebTools/ros3djs)).

### Make sure that the releasing module is compatible with other RWT modules.

use travis to check the compatibility?

### Generate CHANGELOG using [github-changes](https://github.com/lalitkapoor/github-changes). 

```
github-changes -o RobotWebTools -r roslibjs --only-pulls --use-commit-body -a -b develop
```

### Bump a new version

* Remove a SNAPSHOT postfix from package.json and bowers.json
* Mark *upcoming* in CHAGELOG.md as the new release version
* Tag the version

### Release

**NPM**

Keep all modules under @robot-web-tools scope? or in global scope? What are pros and cons?

**Bowers**

Can it be automated too?

**CDN**

TODO(@jihoonl) Fill it after release

### Update jsdocs in Robot Web Tools website

[Here](https://github.com/RobotWebTools/robotwebtools.github.io/tree/master/jsdoc).
Check if docs can be hosted directly from its own repository.

### Sync `develop` branch with `master`

`Master` branch should represent the latest release. 
* Create a PR against `master` from `develop`
* Do *Rebase and merge* to have the same history as `develop` branch

### Prepare `develop` branch for a new version

Bump a version in package.json and bowers.json and add `-SNAPSHOT` postfix.
