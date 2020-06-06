#!/bin/bash

set -ex;

# download latest csl schemas from github
pushd "schemas";
wget -q -c -N https://raw.githubusercontent.com/citation-style-language/schema/master/schemas/input/csl-data.json;
wget -q -c -N https://raw.githubusercontent.com/citation-style-language/schema/master/schemas/input/csl-citation.json;
popd;

# convert the schemas to tyepscript interfaces
npx json2ts -i "schemas/" -o "src/types/" --cwd="schemas/";