#!/bin/bash

set -ex;

# TODO(lukemurray): When citation-style-language/schema#225 is merged remove -c from below. find way to update on change.
# download latest csl schemas from github
pushd "schemas";
wget -q -c https://raw.githubusercontent.com/citation-style-language/schema/master/schemas/input/csl-data.json;
wget -q -c https://raw.githubusercontent.com/citation-style-language/schema/master/schemas/input/csl-citation.json;
popd;

# convert the schemas to tyepscript interfaces
npx json2ts -i "schemas/" -o "src/types/" --cwd="schemas/";