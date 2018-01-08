#!/bin/sh

setup_git() {
  git config --global user.email "jihoonlee.in@gmail.com"
  git config --global user.name "Travis CI"
}

commit_and_push() {
  echo "Add Remote"
  git remote add pr_origin https://${GITHUB_API_KEY}@github.com/${TRAVIS_PULL_REQUEST_SLUG}.git > /dev/null 2>&1
  git fetch pr_origin ${TRAVIS_PULL_REQUEST_BRANCH}
  git checkout -b ${TRAVIS_PULL_REQUEST_BRANCH} pr_origin/${TRAVIS_PULL_REQUEST_BRANCH}
  echo "Add built module and commit"
  git add build/roslib.js
  git add build/roslib.min.js
  git commit build/roslib.js build/roslib.min.js -m "Update built module"
  echo "Push"
  git push --quiet --set-upstream pr_origin ${TRAVIS_PULL_REQUEST_BRANCH}
}

if [ "${TRAVIS_PULL_REQUEST}" != "false" ]; then
  echo "Run push"
  setup_git
  commit_and_push
fi

echo "Done"
