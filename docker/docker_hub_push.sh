#!/usr/bin/env bash

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
if ([[ "$TRAVIS_BRANCH" == "master" ]] || [[ ! -z "$TRAVIS_TAG" ]]) && [[ "$TRAVIS_PULL_REQUEST" == "false" ]];
then
    docker push "jamespfennell/realtimerail.nyc:latest"
fi;
