#!/usr/bin/env python

import os
import sys

try:
    from setuptools import setup, find_packages
except ImportError:
    from distutils.core import setup


from itmwebapp import __version__

setup(
    name='bifplayer',
    version=__version__,
    description='Satheesh Ram <bifplayer>',
    author='Satheesh Ram',
    author_email='satheesh.ram@gmail.com',
    url='https://purpledinosaur@bitbucket.org/purpledinosaur/bifparser.git',
    packages=find_packages('.'),
    include_package_data = True,
    package_data = {
        '': ['*.js', '*.css', '*.html', '*.png', '*.map', '*.eot', '*.svg',
             '*.ttf', '*.woff', '*.otf', '*.crx'],
    },
    scripts=[
    ],
    data_files=[],
    setup_requires=[
    ],
    test_suite='nose.collector',
)
