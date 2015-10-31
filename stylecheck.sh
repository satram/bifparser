#!/usr/bin/env bash


# Fail pipeline when not running under Jenkins. This allows the script to fail
# during a developer run but allow Jenkins to catch the reports for a whole run.
if [ -z ${JENKINS_URL} ]; then
    set -e
    set -o pipefail
fi

# Run js and python strict style checkers.

PACKAGE_DIR=itmwebapp

# Directory of "this" script.
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

BUILDLOGDIR=${DIR}/_buildlog
mkdir -p ${BUILDLOGDIR}


function run_check {
	cmd=$1
    if type ${cmd} >/dev/null 2>&1; then
        echo "Running ${cmd}..."
        $@ 2>&1 | tee ${BUILDLOGDIR}/${cmd}.log
	else
        >&2 echo "The \"${cmd}\" command is not installed, see README.md for install instructions."
        exit 1;
    fi
}

run_check jscs ${PACKAGE_DIR} --config jscs.cfg

# Human readable output when not running under Jenkins.
# For csslint, ignore everything except errors.
# See: https://2002-2012.mattwilcox.net/archive/entry/id/1054/
if [ -z ${JENKINS_URL} ]; then
    run_check csslint ${PACKAGE_DIR} \
                --quiet \
                --errors="" \
                --warnings=errors \
                --exclude-list=itmwebapp/static/libs
else
    run_check csslint ${PACKAGE_DIR} \
                --quiet \
                --errors="" \
                --warnings=errors \
                --format=lint-xml \
                --exclude-list=itmwebapp/static/libs
fi

run_check pep8 ${PACKAGE_DIR} tests

run_check pylint ${PACKAGE_DIR} \
            --reports=no \
            --output-format=parseable \
            --disable=invalid-name \
            --disable=abstract-method \
            --disable=broad-except \
            --disable=arguments-differ \
            --disable=locally-disabled \
            --disable=duplicate-code \
            --disable=too-many-instance-attributes \
            --disable=fixme

# Run seperate check on tests directory.
run_check pylint ${DIR}/tests \
            --reports=no \
            --output-format=parseable \
            --disable=invalid-name \
            --disable=abstract-method \
            --disable=broad-except \
            --disable=arguments-differ \
            --disable=locally-disabled \
            --disable=missing-docstring \
            --disable=too-many-arguments \
            --disable=duplicate-code \
            --disable=fixme
